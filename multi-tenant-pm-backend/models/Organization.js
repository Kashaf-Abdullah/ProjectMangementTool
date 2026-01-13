// models/Organization.js
const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  subdomain: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  userLimit: {
    type: Number,
    default: 5,
    min: 5
  },
  currentUsers: {
    type: Number,
    default: 0,
    min: 0
  },
  stripeCustomerId: {
    type: String,
    default: null
  },
  stripeSubId: {
    type: String,
    default: null
  },
    subscription: {
    plan: { type: String, default: 'free' },
    status: { type: String, default: 'active' },
    expiresAt: Date,
    features: { type: Map, of: Boolean, default: {} }
  },
  settings: {
    type: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

organizationSchema.index({ subdomain: 1 });
organizationSchema.index({ stripeCustomerId: 1 });

module.exports = mongoose.model('Organization', organizationSchema);
