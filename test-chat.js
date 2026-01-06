// Quick test script to verify chatService using Grok
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const chatService = require('./services/chatService');

(async () => {
  try {
    console.log('Testing chat service...');
    const resp = await chatService.sendMessage('test-user-1', 'Hello, how do I donate leftover food?');
    console.log('Response:', resp);
  } catch (err) {
    console.error('Test failed:', err.message || err);
  }
})();