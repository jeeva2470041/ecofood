const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
} = require('../controllers/notificationController');

// All routes require authentication (NGO or Donor)
router.use(protect, authorize('ngo', 'donor'));

// Get all notifications
router.get('/', getNotifications);

// Get unread count
router.get('/unread/count', getUnreadCount);

// Mark specific notification as read
router.put('/:notificationId/read', markAsRead);

// Mark all as read
router.put('/read/all', markAllAsRead);

// Delete specific notification
router.delete('/:notificationId', deleteNotification);

// Delete all notifications
router.delete('/all', deleteAllNotifications);

module.exports = router;
