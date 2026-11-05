<<<<<<< HEAD



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

// Organization members need the team list for project and task assignment.
router.get('/', getOrgUsers);

// Update user role (admin only)
router.put('/role', authorize('admin', 'super_admin'), updateUserRole);

// Delete user (admin only)
// router.delete('/:id', authorize('admin', 'super_admin'), deleteUser); // Add this if you have deleteUser controller

module.exports = router;
=======
const express = require('express');
const {
  inviteUser,
  getOrgUsers,
  updateUserRole,
  deleteUser
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const checkUserLimit = require('../middleware/userLimit');
const { authorize } = require('../middleware/roleGuard');

const router = express.Router();

router.use(protect);
router.use(tenant);

// Allow all authenticated organization members to list members (required for task assignment & filters)
router.get('/', getOrgUsers);

// Invite or add team member (Admin / Project Manager)
router.post('/invite', checkUserLimit, authorize('admin', 'project_manager', 'super_admin'), inviteUser);

// Update user role (Admin only)
router.put('/role', authorize('admin', 'super_admin'), updateUserRole);

// Remove user (Admin only)
router.delete('/:id', authorize('admin', 'super_admin'), deleteUser);

module.exports = router;
>>>>>>> 069e30a653e10f86ca4835e9579f9dbce67189d7
