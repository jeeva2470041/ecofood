/**
 * Admin Seeder Script
 * Creates an admin user in the database
 * Run: node scripts/seedAdmin.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');

const ADMIN_CREDENTIALS = {
    name: 'EcoFood Admin',
    email: 'admin@ecofood.com',
    password: 'Admin@123',
    role: 'admin',
    status: 'Active',
    isActive: true
};

async function seedAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecofood');
        console.log('Connected to MongoDB');

        // Delete existing admin user if any (to reset password)
        await User.deleteOne({ email: ADMIN_CREDENTIALS.email });
        console.log('Cleared existing admin user (if any)');

        // Create new admin user (password will be hashed by pre-save hook)
        const admin = new User(ADMIN_CREDENTIALS);
        await admin.save();

        console.log('');
        console.log('✅ Admin user created successfully!');
        console.log('===================================');
        console.log('📧 Email:    admin@ecofood.com');
        console.log('🔑 Password: Admin@123');
        console.log('===================================');
        console.log('');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
}

seedAdmin();
