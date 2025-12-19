const User = require('../models/User');
const Food = require('../models/Food');

// Get all pending NGO registrations
exports.getPendingNGOs = async (req, res) => {
  try {
    const ngos = await User.find({ role: 'ngo', status: 'Pending' }).select('-password');
    res.json({ ngos });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all NGO registrations (all statuses)
exports.getAllNGOs = async (req, res) => {
  try {
    const ngos = await User.find({ role: 'ngo' }).select('-password');
    res.json({ ngos });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Approve NGO registration
exports.approveNGO = async (req, res) => {
  try {
    const ngo = await User.findByIdAndUpdate(
      req.params.ngoId,
      { status: 'Approved' },
      { new: true }
    ).select('-password');
    if (!ngo) return res.status(404).json({ message: 'NGO not found' });
    res.json({ message: 'NGO approved', ngo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reject NGO registration
exports.rejectNGO = async (req, res) => {
  try {
    const ngo = await User.findByIdAndUpdate(
      req.params.ngoId,
      { status: 'Rejected' },
      { new: true }
    ).select('-password');
    if (!ngo) return res.status(404).json({ message: 'NGO not found' });
    res.json({ message: 'NGO rejected', ngo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Deactivate user
exports.deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isActive: false },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deactivated', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Activate user
exports.activateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isActive: true },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User activated', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all food donations
exports.getAllFoods = async (req, res) => {
  try {
    const foods = await Food.find()
      .populate('donor', 'name email phone')
      .populate('claimedBy', 'name email organizationName');
    res.json({ foods });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get completed donations for impact analytics
exports.getCompletedFoods = async (req, res) => {
  try {
    const completed = await Food.find({ status: 'Completed' })
      .populate('donor', 'name email')
      .populate('claimedBy', 'name organizationName');
    res.json({ completed });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get impact stats
exports.getImpactStats = async (req, res) => {
  try {
    const totalCompleted = await Food.countDocuments({ status: 'Completed' });
    const ngosHelped = await Food.distinct('claimedBy', { status: 'Completed' });
    const totalDonors = await Food.distinct('donor', { status: 'Completed' });
    const approvedNGOs = await User.countDocuments({ role: 'ngo', status: 'Approved' });
    const donors = await User.countDocuments({ role: 'donor' });
    res.json({
      totalCompleted,
      ngosHelped: ngosHelped.length,
      totalDonors: totalDonors.length,
      approvedNGOs,
      donors
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
