const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validatePassword } = require('../utils/passwordValidator');
const dotenv = require('dotenv');
dotenv.config();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'change_this_secret', { expiresIn: '7d' });
};

exports.register = async (req, res) => {
  const { name, email, password, role, phone, organizationName, address } = req.body;
  try {
    // Validate password
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ message: 'Password is too weak', errors: passwordCheck.errors });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'Email already registered' });

    // Donors are auto-approved, NGOs are pending
    const status = role === 'ngo' ? 'Pending' : 'Active';

    user = new User({
      name,
      email,
      password,
      role,
      phone,
      status,
      organizationName: role === 'ngo' ? organizationName : undefined,
      address: role === 'ngo' ? address : undefined
    });

    await user.save();
    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    // Block inactive users
    if (!user.isActive) return res.status(403).json({ message: 'Your account has been deactivated. Contact admin.' });

    // Block NGOs that are not approved
    if (user.role === 'ngo' && user.status !== 'Approved') {
      return res.status(403).json({ message: 'Your NGO registration is pending admin approval' });
    }

    const matched = await user.matchPassword(password);
    if (!matched) return res.status(401).json({ message: 'Invalid email or password' });
    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Forgot Password - Send OTP
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If this email is registered, you will receive an OTP shortly.' });
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP with 10 minute expiry
    user.resetOTP = otp;
    user.resetOTPExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save({ validateBeforeSave: false });

    // Send OTP email
    const emailService = require('../services/emailService');
    const emailSent = await emailService.sendPasswordResetOTP(user, otp);

    if (emailSent) {
      res.json({
        success: true,
        message: 'OTP sent to your email address.',
        email: email // Return email for frontend to use
      });
    } else {
      res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({
      email,
      resetOTP: otp,
      resetOTPExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // OTP is valid
    res.json({
      success: true,
      message: 'OTP verified successfully',
      email: email
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reset Password with OTP
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    // Validate password strength
    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        message: 'Password is too weak',
        errors: passwordCheck.errors
      });
    }

    // Find user with valid OTP
    const user = await User.findOne({
      email,
      resetOTP: otp,
      resetOTPExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Please request a new one.' });
    }

    // Update password
    user.password = newPassword;
    user.resetOTP = undefined;
    user.resetOTPExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
