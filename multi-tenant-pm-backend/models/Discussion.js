const mongoose = require('mongoose');

const discussionReplySchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: { type: String, default: '', trim: true, maxlength: 3000 },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SharedFile' }],
  createdAt: { type: Date, default: Date.now }
});

const discussionSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  title: { type: String, required: true, trim: true, maxlength: 250 },
  content: { type: String, required: true, trim: true, maxlength: 5000 },
  category: {
    type: String,
    enum: ['general', 'architecture', 'design', 'release', 'blocker'],
    default: 'general'
  },
  isPinned: { type: Boolean, default: false },
  isResolved: { type: Boolean, default: false },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SharedFile' }],
  replies: [discussionReplySchema]
}, { timestamps: true });

discussionSchema.index({ orgId: 1, projectId: 1, isPinned: -1, updatedAt: -1 });

module.exports = mongoose.model('Discussion', discussionSchema);
