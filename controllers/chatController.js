const chatService = require('../services/chatService');

/**
 * Send a message to the chatbot
 * POST /api/chat/message
 */
exports.sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user?.id || req.ip; // Use user ID if authenticated, otherwise IP

        if (!message || message.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Message is required',
            });
        }

        // Limit message length
        if (message.length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Message is too long. Please keep it under 1000 characters.',
            });
        }

        const response = await chatService.sendMessage(userId, message.trim());

        if (response.success) {
            res.json({
                success: true,
                message: response.message,
            });
        } else {
            res.status(500).json({
                success: false,
                message: response.message,
                error: response.error,
            });
        }
    } catch (error) {
        console.error('Chat controller error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while processing your message.',
        });
    }
};

/**
 * Clear chat session
 * POST /api/chat/clear
 */
exports.clearSession = async (req, res) => {
    try {
        const userId = req.user?.id || req.ip;
        const result = chatService.clearSession(userId);
        res.json(result);
    } catch (error) {
        console.error('Clear session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear chat session.',
        });
    }
};

/**
 * Health check for chat service
 * GET /api/chat/health
 */
exports.healthCheck = async (req, res) => {
    res.json({
        success: true,
        message: 'Chat service is running',
        timestamp: new Date().toISOString(),
    });
};
