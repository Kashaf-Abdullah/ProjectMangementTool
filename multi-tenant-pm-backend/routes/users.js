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

router.get('/', getOrgUsers);

router.post('/invite', checkUserLimit, authorize('admin', 'project_manager', 'super_admin'), inviteUser);
router.put('/role', authorize('admin', 'super_admin'), updateUserRole);
router.delete('/:id', authorize('admin', 'super_admin'), deleteUser);

module.exports = router;
