// config/stripe.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');

// Webhook signature verification
const verifyStripeWebhook = (signature, payload, webhookSecret) => {
  const sig = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload, 'utf8')
    .digest('hex');

  if (/^v1,.*/.test(signature)) {
    const [, timestamp, computed] = signature.split(',');
    const computedSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(timestamp + '.' + payload, 'utf8')
      .digest('hex');

    if (timeDifference(Date.now() / 1000, parseInt(timestamp)) > 300) {
      throw new Error('Webhook signature verification failed. Request too old.');
    }

    return computed === computedSig;
  }

  return sig === signature;
};

// Tolerance for time differences
const timeDifference = (current, timestamp) => {
  return Math.abs((current - timestamp));
};

module.exports = {
  stripe,
  verifyStripeWebhook
};


// Mock Stripe config
// const stripe = {};
// const verifyStripeWebhook = () => true;

// module.exports = { stripe, verifyStripeWebhook };
