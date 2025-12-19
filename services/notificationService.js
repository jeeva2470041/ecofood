const Notification = require('../models/Notification');
const User = require('../models/User');

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

      // Create notifications for each nearby NGO
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
        message: `${claimer.name} has claimed your ${food.name}. Verification code: ${food.verificationCode}`,
        read: false
      });

      await notification.save();
      console.log(`Notified donor ${donor.email} about claimed food`);
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
  }
};

module.exports = notificationService;
