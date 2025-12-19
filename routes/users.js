const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

/**
 * Save/update user location (for NGOs to receive notifications)
 * POST /api/users/location
 */
router.post('/location', protect, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ message: 'Invalid latitude or longitude' });
    }
    
    // Update user location
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        }
      },
      { new: true }
    );
    
    res.json({ 
      message: 'Location saved successfully',
      location: user.location 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
