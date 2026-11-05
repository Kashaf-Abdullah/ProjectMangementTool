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
