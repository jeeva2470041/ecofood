const grokService = require('./grokService');

// Store conversation history in memory
const conversationHistory = new Map();

const SYSTEM_PROMPT = `You are EcoBot, a helpful AI assistant for EcoFood - a food donation platform that connects food donors with NGOs to reduce food waste and help those in need.

Your role is to:
1. Help donors understand how to donate food safely
2. Guide NGOs on how to claim and collect food donations
3. Answer questions about food safety, storage, and shelf life
4. Provide tips on reducing food waste
5. Explain how the EcoFood platform works

Be friendly, concise, and helpful. Use emojis occasionally to make the conversation more engaging. If asked about topics unrelated to food donation or the platform, politely redirect the conversation.

Important platform features to know:
- Donors can post food listings with photos, quantity, and expiry information
- NGOs can browse and claim available food donations
- The platform sends notifications when food is claimed or ready for pickup
- There's a pickup code system to verify successful handovers`;

/**
 * Get conversation history for a user
 */
const getHistory = (userId) => {
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, []);
  }
  return conversationHistory.get(userId);
};

/**
 * Send a message and get a response using simple generateContent
 */
const sendMessage = async (userId, message) => {
  try {
    // Get existing history
    const history = getHistory(userId);

    // Build the full prompt with system context and history
    let fullPrompt = SYSTEM_PROMPT + "\n\n";

    // Add conversation history (last 10 messages)
    const recentHistory = history.slice(-10);
    if (recentHistory.length > 0) {
      fullPrompt += "Previous conversation:\n";
      for (const msg of recentHistory) {
        fullPrompt += `${msg.role}: ${msg.content}\n`;
      }
      fullPrompt += "\n";
    }

    fullPrompt += `User: ${message}\n\nAssistant:`;

    // Generate response using Grok service
    const text = await grokService.generateText(fullPrompt, 'llama-3.1-8b-instant');

    // Save to history
    history.push({ role: "User", content: message });
    history.push({ role: "Assistant", content: text });

    // Keep history limited
    if (history.length > 20) {
      history.splice(0, 2);
    }

    return {
      success: true,
      message: text,
    };
  } catch (error) {
    console.error("Error in chat service:", error);

    // Handle specific error types
    if (error.message?.includes("API key") || error.status === 401) {
      return {
        success: false,
        message: "I'm having trouble connecting right now. Please try again later.",
        error: "API_KEY_ERROR",
      };
    }

    if (error.message?.includes("quota") || error.status === 429) {
      return {
        success: false,
        message: "I'm a bit busy right now. Please try again in a moment.",
        error: "QUOTA_EXCEEDED",
      };
    }

    if (error.status === 404) {
      return {
        success: false,
        message: "The AI service is temporarily unavailable. Please try again later.",
        error: "MODEL_NOT_FOUND",
      };
    }

    return {
      success: false,
      message: "Sorry, I encountered an error. Please try again.",
      error: error.message,
    };
  }
};

/**
 * Clear a user's chat session
 */
const clearSession = (userId) => {
  conversationHistory.delete(userId);
  return { success: true, message: "Chat session cleared" };
};

/**
 * Clean up old sessions (call periodically)
 */
const cleanupSessions = () => {
  // Simple cleanup - clear all if more than 1000 users
  if (conversationHistory.size > 1000) {
    conversationHistory.clear();
  }
};

// Run cleanup every 30 minutes
setInterval(cleanupSessions, 30 * 60 * 1000);

module.exports = {
  sendMessage,
  clearSession,
};
