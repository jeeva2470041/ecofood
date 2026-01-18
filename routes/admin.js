const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPendingNGOs,
  getAllNGOs,
  getAllUsers,
  approveNGO,
  rejectNGO,
  blockUser,
  unblockUser,
  resetUserPassword,
  deactivateUser,
  activateUser,
  getAllFoods,
  updateFoodStatus,
  removeListing,
  getCompletedFoods,
  getImpactStats
} = require('../controllers/adminController');

// All admin routes require authentication and admin role
router.use(protect, authorize('admin'));

// User management
router.get('/users', getAllUsers);
router.post('/users/:userId/block', blockUser);
router.post('/users/:userId/unblock', unblockUser);
router.post('/users/:userId/reset-password', resetUserPassword);
router.post('/users/:userId/deactivate', deactivateUser);
router.post('/users/:userId/activate', activateUser);

// NGO management
router.get('/ngos/pending', getPendingNGOs);
router.get('/ngos', getAllNGOs);
router.post('/ngos/:ngoId/approve', approveNGO);
router.post('/ngos/:ngoId/reject', rejectNGO);

// Food & listing management
router.get('/foods', getAllFoods);
router.get('/foods/completed', getCompletedFoods);
router.put('/foods/:foodId/status', updateFoodStatus);
router.delete('/foods/:foodId', removeListing);

// Stats & analytics
router.get('/stats', getImpactStats);

module.exports = router;

