const notificationService = require('../services/notificationService');
const Notification = require('../models/Notification');

/**
 * Notification Controller
 * Handles notification-related HTTP requests
 */

// Get all notifications for the logged-in NGO
exports.getNotifications = async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;
    const ngoId = req.user._id;

    const { notifications, total, unread } = await notificationService.getNotifications(
      ngoId,
      parseInt(limit),
      parseInt(skip)
    );

    res.json({ notifications, total, unread });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const ngoId = req.user._id;
    const count = await notificationService.getUnreadCount(ngoId);
    res.json({ unread: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark a specific notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await notificationService.markAsRead(notificationId);
    
    // Verify ownership
    if (notification.ngoId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json({ notification });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const ngoId = req.user._id;
    await notificationService.markAllAsRead(ngoId);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Verify ownership
    if (notification.ngoId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await notificationService.deleteNotification(notificationId);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete all notifications
exports.deleteAllNotifications = async (req, res) => {
  try {
    const ngoId = req.user._id;
    await notificationService.deleteAllNotifications(ngoId);
    res.json({ message: 'All notifications deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
