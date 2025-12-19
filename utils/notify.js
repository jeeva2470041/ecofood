// Notification logic separated for clarity. For now this does simple console alerts.
// In production you can plug email, SMS or push services here.
const User = require('../models/User');

async function notifyNearbyNGOs(food, radiusKm = 5) {
  try {
    const [lng, lat] = food.location.coordinates;
    const nearby = await User.find({
      role: 'ngo',
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radiusKm * 1000
        }
      }
    }).limit(50);
    // For each NGO we'd push a notification. For demo: console.log
    nearby.forEach(n => {
      console.log(`Notify NGO ${n.email}: new food '${food.name}' at ${lat},${lng}`);
    });
    return nearby;
  } catch (err) {
    console.error('notifyNearbyNGOs error', err);
    return [];
  }
}

module.exports = { notifyNearbyNGOs };
