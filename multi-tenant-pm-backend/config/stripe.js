const Stripe = require('stripe');
const crypto = require('crypto');

const stripe = process.env.STRIPE_SECRET_KEY
  ? Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const timeDifference = (current, timestamp) => Math.abs(current - timestamp);

const verifyStripeWebhook = (signature, payload, webhookSecret) => {
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
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

    if (timeDifference(Date.now() / 1000, parseInt(timestamp, 10)) > 300) {
      throw new Error('Webhook signature verification failed. Request too old.');
    }
    return computed === computedSig;
  }

  return sig === signature;
};

module.exports = {
  stripe,
  verifyStripeWebhook
};
