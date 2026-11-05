const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'task_created',
      'task_assigned',
      'task_status_changed',
      'comment_added',
      'reply_added',
      'mention',
      'discussion_created',
      'discussion_replied',
      'file_uploaded',
      'project_created',
      'member_added'
    ],
    required: true
  },
  action: { type: String, required: true, trim: true },
  targetTitle: { type: String, required: true, trim: true },
  snippet: { type: String, default: '', trim: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  discussionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Discussion', default: null },
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'SharedFile', default: null }
}, { timestamps: true });

activitySchema.index({ orgId: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
