const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['donor', 'ngo', 'admin'], default: 'donor' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Active'], default: 'Active' },
  // For NGOs
  organizationName: { type: String },
  address: { type: String },
  documents: [
    {
      filename: String,
      url: String,
      uploadedAt: { type: Date, default: Date.now }
    }
  ],
  // optional location for NGOs or donors
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  isActive: { type: Boolean, default: true },
  // Password Reset OTP
  resetOTP: { type: String },
  resetOTPExpiry: { type: Date }
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', UserSchema);
