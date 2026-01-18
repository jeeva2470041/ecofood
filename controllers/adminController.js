const User = require('../models/User');
const Food = require('../models/Food');
const bcrypt = require('bcryptjs');

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

// Get all users (Admin, Donor, NGO)
exports.getAllUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;
    let query = {};

    if (role && role !== 'all') {
      query.role = role;
    }
    if (status && status !== 'all') {
      if (status === 'Active') {
        query.isActive = true;
      } else if (status === 'Blocked') {
        query.isActive = false;
      } else {
        query.status = status;
      }
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json({ users });
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

// Block user
exports.blockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isActive: false },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User blocked', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Unblock user
exports.unblockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isActive: true },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User unblocked', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reset user password
exports.resetUserPassword = async (req, res) => {
  try {
    const newPassword = 'EcoFeed@123'; // Default reset password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { password: hashedPassword },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Password reset to default: EcoFeed@123', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Deactivate user (legacy)
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

// Activate user (legacy)
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

// Get all food donations with filters
exports.getAllFoods = async (req, res) => {
  try {
    const { status, type, city } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }
    if (type && type !== 'all') {
      query.type = type;
    }

    const foods = await Food.find(query)
      .populate('donor', 'name email phone address')
      .populate('claimedBy', 'name email organizationName')
      .sort({ createdAt: -1 });
    res.json({ foods });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update food listing status
exports.updateFoodStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const food = await Food.findByIdAndUpdate(
      req.params.foodId,
      { status },
      { new: true }
    ).populate('donor', 'name email')
      .populate('claimedBy', 'name organizationName');

    if (!food) return res.status(404).json({ message: 'Listing not found' });
    res.json({ message: `Listing status updated to ${status}`, food });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove food listing
exports.removeListing = async (req, res) => {
  try {
    const food = await Food.findByIdAndDelete(req.params.foodId);
    if (!food) return res.status(404).json({ message: 'Listing not found' });
    res.json({ message: 'Listing removed successfully' });
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

// Get comprehensive impact stats
exports.getImpactStats = async (req, res) => {
  try {
    // User counts
    const totalDonors = await User.countDocuments({ role: 'donor' });
    const approvedNGOs = await User.countDocuments({ role: 'ngo', status: 'Approved' });
    const pendingNGOs = await User.countDocuments({ role: 'ngo', status: 'Pending' });
    const totalUsers = await User.countDocuments();
    const blockedUsers = await User.countDocuments({ isActive: false });

    // Food counts
    const totalListings = await Food.countDocuments();
    const activeListings = await Food.countDocuments({ status: 'Available' });
    const completedDonations = await Food.countDocuments({ status: 'Completed' });
    const pendingPickups = await Food.countDocuments({ status: 'Pending' });

    // Get expired count (Available status and past expiry)
    const expiredListings = await Food.countDocuments({
      status: 'Available',
      expiryAt: { $lt: new Date() }
    });

    // Calculate food saved (estimate based on quantity strings - rough calculation)
    const completedFoods = await Food.find({ status: 'Completed' });
    let estimatedMeals = 0;
    let totalFoodKg = 0;
    completedFoods.forEach(food => {
      // Try to extract numbers from quantity strings
      const numMatch = food.quantity.match(/\d+/);
      if (numMatch) {
        const num = parseInt(numMatch[0]);
        if (food.quantity.toLowerCase().includes('kg')) {
          totalFoodKg += num;
          estimatedMeals += num * 4; // ~4 meals per kg
        } else if (food.quantity.toLowerCase().includes('serving') || food.quantity.toLowerCase().includes('meal')) {
          estimatedMeals += num;
        } else if (food.quantity.toLowerCase().includes('portion')) {
          estimatedMeals += num;
        } else {
          estimatedMeals += num; // Default: assume each unit is a meal
        }
      }
    });

    // Monthly donation data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyDonations = await Food.aggregate([
      {
        $match: {
          status: 'Completed',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Top donors
    const topDonors = await Food.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: '$donor', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'donorInfo'
        }
      },
      { $unwind: '$donorInfo' },
      {
        $project: {
          name: '$donorInfo.name',
          email: '$donorInfo.email',
          count: 1
        }
      }
    ]);

    // Most active NGOs
    const topNGOs = await Food.aggregate([
      { $match: { status: 'Completed', claimedBy: { $exists: true } } },
      { $group: { _id: '$claimedBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'ngoInfo'
        }
      },
      { $unwind: '$ngoInfo' },
      {
        $project: {
          name: '$ngoInfo.organizationName',
          count: 1
        }
      }
    ]);

    res.json({
      // User stats
      donors: totalDonors,
      approvedNGOs,
      pendingNGOs,
      totalUsers,
      blockedUsers,

      // Listing stats
      totalListings,
      activeListings,
      completedDonations,
      pendingPickups,
      expiredListings,
      totalCompleted: completedDonations,

      // Impact stats
      totalFoodKg,
      estimatedMeals,

      // Analytics
      monthlyDonations,
      topDonors,
      topNGOs,

      // Legacy support
      ngosHelped: topNGOs.length,
      totalDonors
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
