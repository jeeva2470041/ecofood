const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Food = require('./models/Food');
const Notification = require('./models/Notification');
const User = require('./models/User');

dotenv.config();

const cleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🧹 Cleaning up database...');

        const foodResult = await Food.deleteMany({});
        const notifResult = await Notification.deleteMany({});
        const userResult = await User.deleteMany({
            email: { $in: ['near_ngo@test.com', 'far_ngo@test.com'] }
        });

        console.log(`✅ Removed ${foodResult.deletedCount} food items.`);
        console.log(`✅ Removed ${notifResult.deletedCount} notifications.`);
        console.log(`✅ Removed ${userResult.deletedCount} test NGO accounts.`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Error during cleanup:', err);
        process.exit(1);
    }
};

cleanup();
