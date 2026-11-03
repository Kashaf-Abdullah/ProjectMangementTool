const mongoose = require('mongoose');

const chatChannelSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  type: {
    type: String,
    enum: ['channel', 'dm'],
    default: 'channel'
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

chatChannelSchema.index({ orgId: 1, type: 1 });

module.exports = mongoose.model('ChatChannel', chatChannelSchema);
