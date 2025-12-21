const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const Food = require('./models/Food');
const Notification = require('./models/Notification');

dotenv.config({ path: path.join(__dirname, '.env') });

const seedData = async () => {
    try {
        console.log('🚀 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        // 1. Clear existing test data to start fresh
        console.log('🧹 Clearing old test data...');
        await Food.deleteMany({});
        await Notification.deleteMany({});
        // We keep existing users but we'll update or create specific ones for distance testing

        let donor = await User.findOne({ role: 'donor' });
        let activeUser = await User.findOne({ location: { $exists: true } }).sort({ updatedAt: -1 });

        if (!donor || !activeUser) {
            console.log('⚠️ Warning: Need at least one donor with location.');
            process.exit(1);
        }

        const baseLng = activeUser.location.coordinates[0];
        const baseLat = activeUser.location.coordinates[1];

        // 2. Setup Test NGOs at specific distances
        console.log('👥 Setting up Test NGOs at different distances...');

        // Near NGO (~3km away)
        await User.findOneAndUpdate(
            { email: 'near_ngo@test.com' },
            {
                name: 'Near NGO (5km)',
                role: 'ngo',
                status: 'Approved',
                isActive: true,
                location: { type: 'Point', coordinates: [baseLng + 0.02, baseLat + 0.02] }
            },
            { upsert: true, new: true }
        );

        // Far NGO (~15km away - Should NOT be notified)
        await User.findOneAndUpdate(
            { email: 'far_ngo@test.com' },
            {
                name: 'Far NGO (15km)',
                role: 'ngo',
                status: 'Approved',
                isActive: true,
                location: { type: 'Point', coordinates: [baseLng + 0.15, baseLat + 0.15] }
            },
            { upsert: true, new: true }
        );

        console.log('🌱 Seeding 10 fresh food items (5km away for testing)...');
        const foodNames = ['Hot Meals', 'Sandwiches', 'Veg Biryani', 'Fruit Box', 'Pasta'];

        for (let i = 0; i < 10; i++) {
            const expiryAt = new Date();
            expiryAt.setHours(expiryAt.getHours() + 5);

            const food = new Food({
                donor: donor._id,
                name: `${foodNames[i % foodNames.length]} Test #${i + 1}`,
                type: 'Veg',
                quantity: '10 units',
                expiryAt,
                status: 'Available',
                // Offset by ~5km so you can see a route in Google Maps
                location: {
                    type: 'Point',
                    coordinates: [baseLng + 0.04, baseLat + 0.04]
                }
            });
            await food.save();
        }

        console.log('✅ Done! Old data cleared and 10 fresh items added.');
        console.log('💡 TEST CASE: Far NGO (15km) should not see these in their dashboard if "Nearby" is selected.');
        process.exit(0);

    } catch (err) {
        console.error('❌ Error seeding data:', err);
        process.exit(1);
    }
};

seedData();
