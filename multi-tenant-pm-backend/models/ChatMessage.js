const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatChannel',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: { type: String, default: '', trim: true, maxlength: 4000 },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SharedFile' }],
  replyToId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage',
    default: null
  }
}, { timestamps: true });

chatMessageSchema.index({ channelId: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
