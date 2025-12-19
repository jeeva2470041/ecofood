const mongoose = require('mongoose');

const FoodSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['Veg', 'Non-Veg'], required: true },
  quantity: { type: String, required: true },
  expiryAt: { type: Date, required: true },
  image: { type: String },
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true }
  },
  status: { type: String, enum: ['Available', 'Pending', 'Completed'], default: 'Available' },
  verificationCode: { type: String },
  claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pickupTimerExpiresAt: { type: Date }
}, { timestamps: true });

// 2dsphere index for geospatial queries
FoodSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Food', FoodSchema);
