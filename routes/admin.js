const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPendingNGOs,
  getAllNGOs,
  approveNGO,
  rejectNGO,
  deactivateUser,
  activateUser,
  getAllFoods,
  getCompletedFoods,
  getImpactStats
} = require('../controllers/adminController');

// All admin routes require authentication and admin role
router.use(protect, authorize('admin'));

// NGO management
router.get('/ngos/pending', getPendingNGOs);
router.get('/ngos', getAllNGOs);
router.post('/ngos/:ngoId/approve', approveNGO);
router.post('/ngos/:ngoId/reject', rejectNGO);

// User management
router.post('/users/:userId/deactivate', deactivateUser);
router.post('/users/:userId/activate', activateUser);

// Food & impact management
router.get('/foods', getAllFoods);
router.get('/foods/completed', getCompletedFoods);
router.get('/stats', getImpactStats);

module.exports = router;
