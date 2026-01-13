// routes/billing.js
const express = require('express');
const { 
  createCheckoutSession, 
  getBillingStatus 
} = require('../controllers/billingController');
const { protect } = require('../middleware/auth');
const tenant = require('../middleware/tenant');

const router = express.Router();

router.use(protect);
router.use(tenant);

router.post('/create-checkout-session', createCheckoutSession);
router.get('/status', getBillingStatus);

module.exports = router;
