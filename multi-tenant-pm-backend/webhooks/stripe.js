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
      return res.status(400).json({ message: 'Webhook signature verification failed' });
    }

    if (event?.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orgId = session.metadata?.orgId;
      if (orgId) {
        const org = await Organization.findById(orgId);
        if (org) {
          org.userLimit += 5;
          const adminEmail = await User.findOne({ orgId, role: 'admin' }).select('email');
          await org.save();
          if (adminEmail) {
            await sendBillingConfirmation(adminEmail.email, org.name, 1);
          }
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

module.exports = stripeWebhook;
