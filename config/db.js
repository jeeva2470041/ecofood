const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    // Use MongoDB Atlas URI ONLY
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error("MONGO_URI is not defined in .env file");
    }

    await mongoose.connect(uri);
    console.log("✅ MongoDB Atlas connected");

    // Load models AFTER connection
    const User = require("../models/User");
    const Food = require("../models/Food");
    const Notification = require("../models/Notification");

    // Create geospatial indexes
    await User.collection.createIndex({ location: "2dsphere" });
    console.log("✓ User location 2dsphere index ready");

    await Food.collection.createIndex({ location: "2dsphere" });
    console.log("✓ Food location 2dsphere index ready");

    // TTL index for notifications (7 days)
    await Notification.collection.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 604800 }
    );
    console.log("✓ Notification TTL index ready (7 days)");

  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
