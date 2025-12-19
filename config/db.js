const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecofood';
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected');
    
    // Create geospatial indexes for location-based queries
    const User = require('../models/User');
    const Food = require('../models/Food');
    
    try {
      // Create 2dsphere indexes for geospatial queries
      await User.collection.createIndex({ 'location': '2dsphere' });
      console.log('✓ User location 2dsphere index created');
      
      await Food.collection.createIndex({ 'location': '2dsphere' });
      console.log('✓ Food location 2dsphere index created');
      
      // Create TTL index for notifications auto-cleanup
      const Notification = require('../models/Notification');
      await Notification.collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 604800 });
      console.log('✓ Notification TTL index created (7 days)');
    } catch (indexErr) {
      console.log('Note: Some indexes may already exist:', indexErr.message);
    }
  } catch (err) {
    console.error('MongoDB connection error', err);
    process.exit(1);
  }
};

module.exports = connectDB;
