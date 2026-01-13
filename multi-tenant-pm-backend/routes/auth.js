// routes/auth.js
const express = require('express');
const {activateUser, registerSuperAdmin, register,login, registerOrgAdmin, registerUser, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');  // ← YE ADD KARO
const { authorize } = require('../middleware/roleGuard');

const router = express.Router();
router.post('/activate/:token', activateUser); // ✅ POST method

router.post('/register-super-admin', registerSuperAdmin);
router.post('/register-admin',   registerOrgAdmin);
// router.post('/register-user',   registerUser);
router.post('/register-user', protect, authorize('admin', 'project_manager'), registerUser);
router.post('/register', register); // Public registration

router.post('/login', login);
router.get('/profile', protect, getProfile);  

module.exports = router;
