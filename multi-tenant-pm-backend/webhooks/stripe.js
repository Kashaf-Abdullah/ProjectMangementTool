// webhooks/stripe.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { verifyStripeWebhook } = require('../config/stripe');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { sendBillingConfirmation } = require('../utils/email');

const stripeWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    
    try {
      event = verifyStripeWebhook(sig, req.body, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ message: 'Webhook signature verification failed' });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const orgId = session.metadata.orgId;

        if (orgId) {
          const org = await Organization.findById(orgId);
          if (org) {
            // Add 5 users to limit for each $5 payment
            org.userLimit += 5;
            
            // Find org admin email for confirmation
            const adminEmail = await User.findOne({
              orgId: orgId,
              role: 'admin'
            }).select('email');

            await org.save();
            
            // Send confirmation email
            if (adminEmail) {
              await sendBillingConfirmation(
                adminEmail.email, 
                org.name, 
                1 // 1 user pack
              );
            }

            console.log(`User limit upgraded for org ${orgId}: ${org.userLimit}`);
          }
        }
        break;

      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

module.exports = stripeWebhook;



// // Mock webhook
// const stripeWebhook = (req, res) => {
//   console.log('✅ Mock Stripe webhook received:', req.body);
//   res.json({ received: true });
// };
// module.exports = stripeWebhook;
