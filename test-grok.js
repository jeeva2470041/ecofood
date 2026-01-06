// Quick test script to verify Grok API key
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const grokService = require('./services/grokService');

(async function testGrok() {
  try {
    console.log('Testing Grok API...');
    const resp = await grokService.generateText('Say hello in one word');
    console.log('SUCCESS! Response:', resp);
  } catch (err) {
    console.error('ERROR:', err.message || err);
  }
})();