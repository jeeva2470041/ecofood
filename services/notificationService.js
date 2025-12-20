const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('./emailService');

/**
 * Notification Service
 * Handles all notification-related operations
 */

const notificationService = {
  /**
   * Notify nearby NGOs when a donor posts food
   * @param {Object} food - The food object with location
   * @param {Number} radiusKm - Search radius in kilometers
   */
  notifyNearbyNGOs: async (food, radiusKm = 10) => {
    try {
      if (!food.location || !food.location.coordinates) {
        console.log('Food location not available, skipping notification');
        return;
      }

      const maxDistance = radiusKm * 1000; // Convert to meters

      // Find NGOs within radius
      const nearbyNGOs = await User.find({
        role: 'ngo',
        status: 'Approved',
        isActive: true,
        location: {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: food.location.coordinates
            },
            $maxDistance: maxDistance
          }
        }
      });

      // Get donor info for email
      const donor = await User.findById(food.donor);

      // Create in-app notifications and send emails
      const notifications = nearbyNGOs.map(ngo => ({
        ngoId: ngo._id,
        foodId: food._id,
        donorId: food.donor,
        type: 'food_posted',
        title: `New food available: ${food.name}`,
        message: `${food.quantity} of ${food.name} (${food.type}) posted nearby. Expires at ${new Date(food.expiryAt).toLocaleString()}`,
        read: false,
        createdAt: new Date()
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);

        // Send emails to nearby NGOs
        for (const ngo of nearbyNGOs) {
          await emailService.sendFoodPostedEmail(ngo, food, donor);
        }

        console.log(`Notified ${notifications.length} nearby NGOs about food: ${food.name}`);
      }
    } catch (err) {
      console.error('Error notifying nearby NGOs:', err.message);
    }
  },

  /**
   * Get all notifications for an NGO
   */
  getNotifications: async (ngoId, limit = 50, skip = 0) => {
    try {
      const notifications = await Notification.find({ ngoId })
        .populate('foodId')
        .populate('donorId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Notification.countDocuments({ ngoId });
      const unread = await Notification.countDocuments({ ngoId, read: false });

      return { notifications, total, unread };
    } catch (err) {
      console.error('Error fetching notifications:', err.message);
      throw err;
    }
  },

  /**
   * Get unread notification count for an NGO
   */
  getUnreadCount: async (ngoId) => {
    try {
      return await Notification.countDocuments({ ngoId, read: false });
    } catch (err) {
      console.error('Error getting unread count:', err.message);
      throw err;
    }
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (notificationId) => {
    try {
      return await Notification.findByIdAndUpdate(
        notificationId,
        { read: true, readAt: new Date() },
        { new: true }
      );
    } catch (err) {
      console.error('Error marking notification as read:', err.message);
      throw err;
    }
  },

  /**
   * Mark all notifications as read for an NGO
   */
  markAllAsRead: async (ngoId) => {
    try {
      return await Notification.updateMany(
        { ngoId, read: false },
        { read: true, readAt: new Date() }
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err.message);
      throw err;
    }
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (notificationId) => {
    try {
      return await Notification.findByIdAndDelete(notificationId);
    } catch (err) {
      console.error('Error deleting notification:', err.message);
      throw err;
    }
  },

  /**
   * Delete all notifications for an NGO
   */
  deleteAllNotifications: async (ngoId) => {
    try {
      return await Notification.deleteMany({ ngoId });
    } catch (err) {
      console.error('Error deleting all notifications:', err.message);
      throw err;
    }
  },

  /**
   * Notify when food is claimed
   */
  notifyFoodClaimed: async (food, claimer) => {
    try {
      const donor = await User.findById(food.donor);
      if (!donor || !donor.email) return;

      // In-app notification for donor
      const notification = new Notification({
        ngoId: food.donor,
        foodId: food._id,
        donorId: claimer._id,
        type: 'food_claimed',
        title: 'Your food has been claimed!',
        message: `${claimer.name || claimer.organizationName} has claimed your ${food.name}. Verification code will be sent via email.`,
        read: false
      });

      await notification.save();

      // In-app notification for NGO (The claimer)
      const ngoNotification = new Notification({
        ngoId: claimer._id,
        foodId: food._id,
        donorId: food.donor,
        type: 'pickup_reminder',
        title: 'Food Claimed Successfully!',
        message: `You claimed ${food.name}. Your verification code is: ${food.verificationCode}. Show this to the donor during pickup.`,
        read: false
      });
      await ngoNotification.save();

      console.log(`Notified donor ${donor.email} and NGO ${claimer.email} about claimed food`);
    } catch (err) {
      console.error('Error notifying donor about claimed food:', err.message);
    }
  },

  /**
   * Notify about expiring food
   */
  notifyExpiringFood: async (food, hoursUntilExpiry = 2) => {
    try {
      // Find NGOs who can still claim this food
      const maxDistance = 10 * 1000; // 10 km

      const nearbyNGOs = await User.find({
        role: 'ngo',
        status: 'Approved',
        isActive: true,
        location: {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: food.location.coordinates
            },
            $maxDistance: maxDistance
          }
        }
      });

      const notifications = nearbyNGOs.map(ngo => ({
        ngoId: ngo._id,
        foodId: food._id,
        donorId: food.donor,
        type: 'food_expiring',
        title: `Food expiring soon: ${food.name}`,
        message: `This ${food.name} expires in ${hoursUntilExpiry} hours. Claim now to help prevent food waste!`,
        read: false
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
        console.log(`Notified ${notifications.length} NGOs about expiring food: ${food.name}`);
      }
    } catch (err) {
      console.error('Error notifying about expiring food:', err.message);
    }
  },

  /**
   * Notify NGO and Donor about pickup completion
   */
  notifyPickupCompleted: async (food, ngo) => {
    try {
      const donor = await User.findById(food.donor);

      // 1. Create notification for Donor
      if (donor) {
        const donorNotification = new Notification({
          ngoId: donor._id, // Recipient
          foodId: food._id,
          donorId: ngo._id, // Sender (NGO)
          type: 'pickup_reminder', // Reuse existing enum or we could add 'pickup_completed'
          title: 'Pickup Completed! ✅',
          message: `Your donation of ${food.name} has been successfully picked up by ${ngo.organizationName || ngo.name}.`,
          read: false
        });
        await donorNotification.save();
      }

      // 2. Create notification for NGO
      const ngoNotification = new Notification({
        ngoId: ngo._id,
        foodId: food._id,
        donorId: food.donor,
        type: 'pickup_reminder',
        title: 'Success! Pickup Verified',
        message: `You have successfully completed the pickup for ${food.name}.`,
        read: false
      });
      await ngoNotification.save();

      // 3. Send emails
      if (ngo.email) await emailService.sendPickupCompletedEmail(ngo, food, donor);

      console.log(`Created pickup completion notifications for donor and NGO`);
    } catch (err) {
      console.error('Error notifying about pickup completion:', err.message);
    }
  }
};

module.exports = notificationService;
