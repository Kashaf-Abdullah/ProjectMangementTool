// controllers/billingController.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Organization = require('../models/Organization');
const User = require('../models/User'); 
const createCheckoutSession = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const org = await Organization.findById(orgId);

    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Create or retrieve Stripe customer
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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'User Pack (5 additional users)',
            description: `Add 5 more users to ${org.name}`
          },
          unit_amount: 500, // $5.00
        },
        quantity: 1,
      }],
      // mode: 'payment',
      // success_url: `${req.headers.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      // cancel_url: `${req.headers.origin}/billing?cancelled=true`,
            mode: 'payment',
      success_url: 'https://httpstat.us/200',  // ← FIXED
      cancel_url: 'https://httpstat.us/400',    // ← FIXED
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

// const getBillingStatus = async (req, res) => {
//   try {
//     const orgId = req.user.orgId;
//     const org = await Organization.findById(orgId);
    
//     const currentUsers = await User.countDocuments({ orgId });
    
//     res.json({
//       userLimit: org.userLimit,
//       currentUsers,
//       canAddUsers: currentUsers < org.userLimit,
//       stripeCustomerId: org.stripeCustomerId
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

const getBillingStatus = async (req, res) => {
  try {
    console.log('DEBUG: Fetching billing status for user:', req.user?._id);
    console.log('DEBUG: User orgId:', req.user?.orgId);

    // Check if user has orgId
    if (!req.user?.orgId) {
      console.warn('DEBUG: User has no orgId');
      return res.json({
        userLimit: 5,
        currentUsers: 0,
        canAddUsers: true,
        stripeCustomerId: null,
        message: 'User not assigned to an organization'
      });
    }

    const orgId = req.user.orgId;
    
    // Find organization
    const org = await Organization.findById(orgId).lean();
    console.log('DEBUG: Organization found:', org ? 'Yes' : 'No');
    
    if (!org) {
      console.warn('DEBUG: Organization not found for ID:', orgId);
      return res.json({
        userLimit: 5,
        currentUsers: 0,
        canAddUsers: true,
        stripeCustomerId: null,
        message: 'Organization not found'
      });
    }

    console.log('DEBUG: Org userLimit:', org.userLimit);
    console.log('DEBUG: Org stripeCustomerId:', org.stripeCustomerId);

    // Count users in organization
    const currentUsers = await User.countDocuments({ orgId });
    console.log('DEBUG: Current users count:', currentUsers);

    // Default user limit to 5 if not set
    const userLimit = org.userLimit || 5;
    
    res.json({
      userLimit,
      currentUsers,
      canAddUsers: currentUsers < userLimit,
      stripeCustomerId: org.stripeCustomerId || null
    });
    
  } catch (error) {
    console.error('ERROR in getBillingStatus:', error.message);
    console.error('ERROR stack:', error.stack);
    
    // Return safe defaults instead of 500
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
