const express = require('express');
const { stripe } = require('../config/stripe');
const Organization = require('../models/Organization');

const router = express.Router();

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    let event;
    const sig = req.headers['stripe-signature'];
    if (!sig || process.env.NODE_ENV !== 'production' || !stripe) {
      event = req.body;
    } else {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }

    if (event?.type === 'checkout.session.completed') {
      const orgId = event.data?.object?.metadata?.orgId;
      if (orgId) {
        await Organization.findByIdAndUpdate(orgId, { $inc: { userLimit: 5 } });
      }
    }

    res.json({ received: true });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;
