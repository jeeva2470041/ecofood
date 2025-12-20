const Food = require('../models/Food');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

// Donor posts a food donation
exports.postFood = async (req, res) => {
  try {
    const { name, type, quantity, expiryAt, latitude, longitude } = req.body;
    if (!name || !type || !quantity || !expiryAt || !latitude || !longitude) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const food = new Food({
      donor: req.user._id,
      name,
      type,
      quantity,
      expiryAt: new Date(expiryAt),
      image: req.body.image || null,
      location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
      status: 'Available'
    });
    await food.save();
    
    // Notify nearby NGOs
    await notificationService.notifyNearbyNGOs(food, 10);
    
    res.json({ food });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// NGOs fetch nearby available listings within radiusKm
exports.listNearby = async (req, res) => {
  try {
    const radiusKm = parseFloat(req.query.radiusKm) || 5;
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ message: 'Missing coordinates' });
    const maxDistance = radiusKm * 1000;
    const items = await Food.find({
      status: 'Available',
      location: {
        $nearSphere: { $geometry: { type: 'Point', coordinates: [lng, lat] }, $maxDistance: maxDistance }
      }
    }).limit(50);
    // compute distances on client or leave to frontend
    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// NGO claims a food listing
exports.claimFood = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food not found' });
    if (food.status !== 'Available') return res.status(400).json({ message: 'Food is no longer available' });
    
    // set to pending and assign
    food.status = 'Pending';
    food.claimedBy = req.user._id;
    // create 6-digit code for verification
    food.verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    // pickup timer: 2 hours default
    food.pickupTimerExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    await food.save();
    
    // Notify donor
    await notificationService.notifyFoodClaimed(food, req.user);
    
    res.json({ food });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Donor verifies pickup with code -> Completed
exports.verifyPickup = async (req, res) => {
  try {
    const { code } = req.body;
    const food = await Food.findById(req.params.id).populate('claimedBy');
    if (!food) return res.status(404).json({ message: 'Not found' });
    if (food.status !== 'Pending') return res.status(400).json({ message: 'Not pending' });
    if (food.verificationCode !== (code || '')) return res.status(400).json({ message: 'Code mismatch' });
    
    food.status = 'Completed';
    // clear sensitive fields
    food.verificationCode = undefined;
    food.pickupTimerExpiresAt = undefined;
    await food.save();
    
    // Notify NGO about pickup completion
    await notificationService.notifyPickupCompleted(food, food.claimedBy);
    
    res.json({ food, message: 'Pickup verified! Thank you for your donation.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// NGOs fetch all available listings (fallback when geolocation unavailable)
exports.listAvailable = async (req, res) => {
  try {
    const items = await Food.find({
      status: 'Available'
    }).sort({ createdAt: -1 }).limit(100);
    res.json({ items, foods: items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Impact stats (completed transactions only)
exports.impact = async (req, res) => {
  try {
    const totalSaved = await Food.countDocuments({ status: 'Completed' });
    const donationsCompleted = totalSaved;
    const ngosHelped = await Food.distinct('claimedBy', { status: 'Completed' });
    res.json({ totalSaved, donationsCompleted, ngosHelped: ngosHelped.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Donor fetches their own donations
exports.getMyDonations = async (req, res) => {
  try {
    const items = await Food.find({ donor: req.user._id })
      .populate('claimedBy', 'name email phone organizationName address')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ items, foods: items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// NGO fetches their claimed foods (for pickup)
exports.getMyClaimedFoods = async (req, res) => {
  try {
    const items = await Food.find({ claimedBy: req.user._id })
      .populate('donor', 'name email phone address location')
      .populate('food')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ items, foods: items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
