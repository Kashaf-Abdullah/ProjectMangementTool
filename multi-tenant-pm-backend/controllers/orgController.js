// controllers/orgController.js
const Organization = require('../models/Organization');
const User = require('../models/User');

const createOrganization = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Super admin only' });
    }

    const { name, subdomain } = req.body;
    const org = await Organization.create({ name, subdomain });

    res.status(201).json(org);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllOrganizations = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Super admin only' });
    }

    const organizations = await Organization.find({}).sort({ createdAt: -1 });
    res.json(organizations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrgStats = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.params.orgId;
    if (!orgId && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Org access required' });
    }

    const org = await Organization.findById(orgId);
    if (!org) return res.status(404).json({ message: 'Org not found' });

    const userCount = await User.countDocuments({ orgId: org._id });
    res.json({
      ...org.toObject(),
      currentUsers: userCount,
      limitStatus: userCount >= org.userLimit ? 'limit_reached' : 'ok'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createOrganization, getAllOrganizations, getOrgStats };
