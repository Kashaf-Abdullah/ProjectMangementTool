const mongoose = require('mongoose');

const sharedFileSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  originalName: { type: String, required: true, trim: true },
  storedName: { type: String, required: true },
  mimeType: { type: String, default: 'application/octet-stream' },
  size: { type: Number, default: 0 },
  category: {
    type: String,
    enum: ['image', 'document', 'data', 'archive', 'other'],
    default: 'other'
  },
  description: { type: String, default: '', trim: true },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  discussionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Discussion',
    default: null
  },
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatChannel',
    default: null
  }
}, { timestamps: true });

sharedFileSchema.index({ orgId: 1, projectId: 1, createdAt: -1 });

module.exports = mongoose.model('SharedFile', sharedFileSchema);
