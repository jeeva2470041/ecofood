const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  postFood,
  listNearby,
  listAvailable,
  claimFood,
  verifyPickup,
  impact,
  getMyDonations
} = require('../controllers/foodController');

// Donor posts
router.post('/', protect, authorize('donor'), postFood);

// Donor fetches their own donations
router.get('/my-donations', protect, authorize('donor'), getMyDonations);

// NGOs fetch nearby available
router.get('/nearby', protect, authorize('ngo'), listNearby);

// NGOs fetch all available (fallback)
router.get('/available', protect, authorize('ngo'), listAvailable);

// NGO claims
router.post('/:id/claim', protect, authorize('ngo'), claimFood);

// Donor verifies pickup
router.post('/:id/verify', protect, authorize('donor'), verifyPickup);

// Impact dashboard
router.get('/impact/stats', protect, impact);

module.exports = router;
