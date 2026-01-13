const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Organization = require('../models/Organization');
const router = express.Router();

router.post('/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  console.log('🔥 WEBHOOK HIT!');
  console.log('Headers:', req.headers['stripe-signature']);
  
  try {
    let event;
    
    // DEVELOPMENT: Signature skip karo
    const sig = req.headers['stripe-signature'];
    if (!sig || process.env.NODE_ENV !== 'production') {
      console.log('⚠️  Development mode - skipping signature');
      event = req.body;  // Raw body as event
    } else {
      // Production: Proper verification
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orgId = session.metadata?.orgId;
      
      if (orgId) {
        await Organization.findByIdAndUpdate(orgId, { 
          $inc: { userLimit: 5 } 
        });
        console.log(`✅ userLimit +5 for org: ${orgId}`);
      }
    }
    
    res.json({received: true});
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    res.status(400).send(err.message);
  }
});

module.exports = router;
