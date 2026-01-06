// Debug script to check dotenv -> grokService load order
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
console.log('After dotenv.config(), GROK_API_KEY present:', !!process.env.GROK_API_KEY, process.env.GROK_API_KEY ? process.env.GROK_API_KEY.substring(0,10)+'...' : '');

// Now require grokService (it will print a warning if it didn't capture the key)
try {
  const grokService = require('./services/grokService');
  console.log('Required grokService module successfully.');
} catch (err) {
  console.error('Error requiring grokService:', err);
}
