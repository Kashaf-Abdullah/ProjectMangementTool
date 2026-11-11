const express = require('express');
const { search } = require('../controllers/searchController');
const { protect } = require('../middleware/auth');
const tenant = require('../middleware/tenant');

const router = express.Router();

router.use(protect);
router.use(tenant);
router.get('/', search);

module.exports = router;
