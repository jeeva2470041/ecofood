const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validatePassword } = require('../utils/passwordValidator');
const dotenv = require('dotenv');
dotenv.config();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'change_this_secret', { expiresIn: '7d' });
};

exports.register = async (req, res) => {
  const { name, email, password, role, phone, organizationName, address } = req.body;
  try {
    // Validate password
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ message: 'Password is too weak', errors: passwordCheck.errors });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'Email already registered' });
    
    // Donors are auto-approved, NGOs are pending
    const status = role === 'ngo' ? 'Pending' : 'Active';
    
    user = new User({ 
      name, 
      email, 
      password, 
      role, 
      phone,
      status,
      organizationName: role === 'ngo' ? organizationName : undefined,
      address: role === 'ngo' ? address : undefined
    });
    
    await user.save();
    res.json({ 
      token: generateToken(user._id), 
      user: { 
        id: user._id, 
        name: user.name, 
        role: user.role, 
        status: user.status 
      } 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    
    // Block inactive users
    if (!user.isActive) return res.status(403).json({ message: 'Your account has been deactivated. Contact admin.' });
    
    // Block NGOs that are not approved
    if (user.role === 'ngo' && user.status !== 'Approved') {
      return res.status(403).json({ message: 'Your NGO registration is pending admin approval' });
    }
    
    const matched = await user.matchPassword(password);
    if (!matched) return res.status(401).json({ message: 'Invalid email or password' });
    res.json({ 
      token: generateToken(user._id), 
      user: { 
        id: user._id, 
        name: user.name, 
        role: user.role, 
        status: user.status 
      } 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
