const grokService = require('../services/grokService');

exports.analyzeFoodItem = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Food name is required' });
    }

    const analysis = await grokService.analyzeFood(name, description || '');
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
