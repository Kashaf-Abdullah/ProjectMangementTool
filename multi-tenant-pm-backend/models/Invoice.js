const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  seatsCount: {
    type: Number,
    required: true,
    default: 1
  },
  seatPrice: {
    type: Number,
    required: true,
    default: 3.00
  },
  seatsCost: {
    type: Number,
    required: true
  },
  platformFeeRate: {
    type: Number,
    required: true,
    default: 0.10
  },
  platformFee: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['paid', 'pending', 'failed'],
    default: 'paid'
  },
  stripeSessionId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

invoiceSchema.index({ orgId: 1, createdAt: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
