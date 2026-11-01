const express = require('express');
const { getAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const tenant = require('../middleware/tenant');

const router = express.Router();

router.use(protect);
router.use(tenant);

router.get('/', getAnalytics);

module.exports = router;
