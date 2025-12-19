const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  ngoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  foodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food',
    required: true
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['food_posted', 'food_claimed', 'food_expiring', 'pickup_reminder'],
    default: 'food_posted'
  },
  title: String,
  message: String,
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Mark old notifications as read automatically after 7 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

// Index for querying unread notifications efficiently
notificationSchema.index({ ngoId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
