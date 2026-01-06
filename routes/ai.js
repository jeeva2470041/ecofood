const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// @route   POST api/ai/analyze-food
// @desc    Analyze food item using Grok AI
// @access  Private
router.post('/analyze-food', protect, aiController.analyzeFoodItem);

module.exports = router;
