// middleware/userLimit.js
const Organization = require('../models/Organization');
const User = require('../models/User');

const checkUserLimit = async (req, res, next) => {
  try {
    if (req.user.role === 'super_admin') {
      return next();
    }

    const orgId = req.user.orgId;
    const org = await Organization.findById(orgId);
    
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const currentUsers = await User.countDocuments({ 
      orgId, 
      isActive: true 
    });

    // Update org currentUsers count
    org.currentUsers = currentUsers;
    await org.save();

    if (currentUsers >= org.userLimit) {
      return res.status(403).json({
        message: 'User limit reached',
        currentUsers,
        userLimit: org.userLimit,
        upgradeRequired: true,
        upgradeUrl: '/api/billing/create-checkout-session'
      });
    }

    req.org = org;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = checkUserLimit;
