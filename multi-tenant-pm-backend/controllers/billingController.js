const { stripe } = require('../config/stripe');
const Organization = require('../models/Organization');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const Activity = require('../models/Activity');

const SEAT_PRICE = 3.00; // $3.00 per member added
const PLATFORM_FEE_RATE = 0.10; // 10% platform join fee

const createCheckoutSession = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const seatsCount = Math.max(1, Math.min(100, Number(req.body.seatsCount) || 5));
    const seatsCost = Number((seatsCount * SEAT_PRICE).toFixed(2));
    const platformFee = Number((seatsCost * PLATFORM_FEE_RATE).toFixed(2));
    const totalAmount = Number((seatsCost + platformFee).toFixed(2));

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date().toISOString().split('T')[0];

    // If Stripe is configured and available
    if (stripe) {
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
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Member Seats (+${seatsCount} seats)`,
                description: `Add ${seatsCount} user seats to ${org.name} ($3.00/member)`
              },
              unit_amount: Math.round(SEAT_PRICE * 100), // $3.00 in cents
            },
            quantity: seatsCount,
          },
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Platform Join Fee (10%)',
                description: '10% platform joining & cloud infrastructure fee'
              },
              unit_amount: Math.round(platformFee * 100),
            },
            quantity: 1,
          }
        ],
        mode: 'payment',
        success_url: `${origin}/billing?success=true&seats=${seatsCount}`,
        cancel_url: `${origin}/billing?cancelled=true`,
        customer: customer.id,
        metadata: {
          orgId: org._id.toString(),
          seatsCount: seatsCount.toString(),
          invoiceNumber
        }
      });

      return res.json({ url: session.url, invoiceNumber });
    }

    // Direct mode fallback (when Stripe secret key not set in environment)
    org.userLimit = (org.userLimit || 5) + seatsCount;
    await org.save();

    const invoice = await Invoice.create({
      orgId: org._id,
      invoiceNumber,
      date: today,
      seatsCount,
      seatPrice: SEAT_PRICE,
      seatsCost,
      platformFeeRate: PLATFORM_FEE_RATE,
      platformFee,
      totalAmount,
      description: `Team Expansion (+${seatsCount} seats @ $3.00/seat + 10% platform fee)`,
      status: 'paid'
    });

    try {
      await Activity.create({
        orgId: org._id,
        actorId: req.user._id,
        type: 'member_added',
        action: `purchased ${seatsCount} additional member seats ($${totalAmount} with 10% platform join fee)`,
        targetTitle: `${org.name} Workspace Capacity Upgraded`
      });
    } catch (e) {
      // Activity logging optional
    }

    return res.json({
      success: true,
      url: '/billing?upgraded=true',
      newLimit: org.userLimit,
      invoice,
      message: `Successfully added ${seatsCount} member seats!`
    });
  } catch (error) {
    console.error('Error in createCheckoutSession:', error);
    res.status(500).json({ message: error.message || 'Payment processing error' });
  }
};

const getBillingStatus = async (req, res) => {
  try {
    if (!req.user?.orgId) {
      return res.json({
        userLimit: 5,
        currentUsers: 0,
        canAddUsers: true,
        stripeCustomerId: null,
        seatPrice: SEAT_PRICE,
        platformFeePercent: 10,
        invoices: []
      });
    }

    const orgId = req.user.orgId;
    const org = await Organization.findById(orgId).lean();
    if (!org) {
      return res.json({
        userLimit: 5,
        currentUsers: 0,
        canAddUsers: true,
        stripeCustomerId: null,
        seatPrice: SEAT_PRICE,
        platformFeePercent: 10,
        invoices: []
      });
    }

    const currentUsers = await User.countDocuments({ orgId, isActive: true });
    const userLimit = org.userLimit || 5;

    let invoices = [];
    try {
      invoices = await Invoice.find({ orgId }).sort({ createdAt: -1 }).lean();
    } catch (e) {
      invoices = [];
    }

    res.json({
      userLimit,
      currentUsers,
      canAddUsers: currentUsers < userLimit,
      stripeCustomerId: org.stripeCustomerId || null,
      seatPrice: SEAT_PRICE,
      platformFeePercent: 10,
      invoices
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching billing status',
      userLimit: 5,
      currentUsers: 0,
      canAddUsers: true,
      stripeCustomerId: null,
      seatPrice: SEAT_PRICE,
      platformFeePercent: 10,
      invoices: []
    });
  }
};

const getInvoices = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const invoices = await Invoice.find({ orgId }).sort({ createdAt: -1 }).lean();
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createCheckoutSession, getBillingStatus, getInvoices };
