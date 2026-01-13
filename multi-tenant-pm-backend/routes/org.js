// routes/org.js
const express = require('express');
const { 
  createOrganization, 
  getAllOrganizations, 
  getOrgStats 
} = require('../controllers/orgController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');
const tenant = require('../middleware/tenant');
const Organization = require('../models/Organization');

const router = express.Router();

// Super admin routes (no tenant isolation needed)
router.use(protect);
router.post('/', authorize('super_admin'), createOrganization);
router.get('/', authorize('super_admin'), getAllOrganizations);

// Org admin routes (tenant isolation)
router.use(tenant);
router.get('/stats', getOrgStats);
// Admin dashboard routes
router.patch('/:id', protect, async (req, res) => {
  try {
    const org = await Organization.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    res.json(org);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
