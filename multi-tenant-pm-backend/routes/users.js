


const express = require('express');
const { 
  inviteUser, 
  // activateUser, 
  getOrgUsers, 
  updateUserRole,
  deleteUser,  // Add this if you have it
  getUsers  // Remove this if you're using getOrgUsers instead
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const checkUserLimit = require('../middleware/userLimit');
const { authorize } = require('../middleware/roleGuard');

const router = express.Router();

// Public route (no auth needed)
// router.get('/activate/:token', activateUser);

// Apply auth middleware to all protected routes
router.use(protect);
router.use(tenant);

// Check user limit for invite operations only (not for viewing users)
router.post('/invite', checkUserLimit, authorize('admin', 'super_admin'), inviteUser);

// Get organization users (admin only)
router.get('/', authorize('admin', 'super_admin'), getOrgUsers);

// Update user role (admin only)
router.put('/role', authorize('admin', 'super_admin'), updateUserRole);

// Delete user (admin only)
// router.delete('/:id', authorize('admin', 'super_admin'), deleteUser); // Add this if you have deleteUser controller

module.exports = router;