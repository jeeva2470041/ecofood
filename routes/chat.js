const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// @route   POST /api/chat/message
// @desc    Send a message to the chatbot
// @access  Public (rate limited in production)
router.post('/message', chatController.sendMessage);

// @route   POST /api/chat/clear
// @desc    Clear chat session
// @access  Public
router.post('/clear', chatController.clearSession);

// @route   GET /api/chat/health
// @desc    Health check for chat service
// @access  Public
router.get('/health', chatController.healthCheck);

module.exports = router;
