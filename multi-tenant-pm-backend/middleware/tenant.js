// middleware/tenant.js
const Organization = require('../models/Organization');
const User = require('../models/User');

// Auto-filter queries by orgId (super_admin bypass)
const tenant = async (req, res, next) => {
  try {
    if (req.user.role === 'super_admin') {
      // Super admin bypasses tenant isolation
      return next();
    }

    if (!req.user.orgId) {
      return res.status(400).json({ message: 'Organization required' });
    }

    // Verify user belongs to org
    const userOrgMatch = await User.findOne({ 
      _id: req.user._id, 
      orgId: req.user.orgId 
    });
    
    if (!userOrgMatch) {
      return res.status(403).json({ message: 'Invalid organization access' });
    }

    // Attach orgId to request for query filtering
    req.tenantOrgId = req.user.orgId;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = tenant;
