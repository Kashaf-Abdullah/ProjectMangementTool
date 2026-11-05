const express = require('express');
const { getActivities } = require('../controllers/activityController');
const { protect } = require('../middleware/auth');
const tenant = require('../middleware/tenant');

const router = express.Router();
router.use(protect);
router.use(tenant);

router.get('/', getActivities);

module.exports = router;
