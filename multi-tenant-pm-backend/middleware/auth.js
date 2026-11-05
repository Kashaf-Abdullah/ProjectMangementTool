const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const queryToken = typeof req.query.token === 'string' ? req.query.token : null;
  const token =
    authHeader && authHeader.startsWith('Bearer') ? authHeader.split(' ')[1] : queryToken;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pm_tool_fallback_secret_key');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalid' });
  }
};

module.exports = { protect };
