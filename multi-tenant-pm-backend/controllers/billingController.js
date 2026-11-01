const { stripe } = require('../config/stripe');
const Organization = require('../models/Organization');
const User = require('../models/User');

const createCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ message: 'Stripe billing is not configured on this server' });
    }

    const orgId = req.user.orgId;
    const org = await Organization.findById(orgId);

    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    let customer;
    if (!org.stripeCustomerId) {
      customer = await stripe.customers.create({
        email: req.user.email,
        metadata: { orgId: org._id.toString() }
      });
      org.stripeCustomerId = customer.id;
      await org.save();
    } else {
      customer = await stripe.customers.retrieve(org.stripeCustomerId);
    }

    const origin = req.headers.origin || process.env.CLIENT_URL || 'http://localhost:5173';
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'User Pack (5 additional users)',
            description: `Add 5 more users to ${org.name}`
          },
          unit_amount: 500,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/billing?success=true`,
      cancel_url: `${origin}/billing?cancelled=true`,
      customer: customer.id,
      metadata: {
        orgId: org._id.toString()
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBillingStatus = async (req, res) => {
  try {
    if (!req.user?.orgId) {
      return res.json({
        userLimit: 5,
        currentUsers: 0,
        canAddUsers: true,
        stripeCustomerId: null
      });
    }

    const orgId = req.user.orgId;
    const org = await Organization.findById(orgId).lean();

    if (!org) {
      return res.json({
        userLimit: 5,
        currentUsers: 0,
        canAddUsers: true,
        stripeCustomerId: null
      });
    }

    const currentUsers = await User.countDocuments({ orgId, isActive: true });
    const userLimit = org.userLimit || 5;

    res.json({
      userLimit,
      currentUsers,
      canAddUsers: currentUsers < userLimit,
      stripeCustomerId: org.stripeCustomerId || null
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching billing status',
      userLimit: 5,
      currentUsers: 0,
      canAddUsers: true,
      stripeCustomerId: null
    });
  }
};

module.exports = { createCheckoutSession, getBillingStatus };
