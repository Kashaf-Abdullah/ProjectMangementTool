const Comment = require('../models/Comment');
const Task = require('../models/Task');
const User = require('../models/User');
const SharedFile = require('../models/SharedFile');
const { formatFileDoc } = require('./fileController');
const { createNotification } = require('./notificationController');
const { recordActivity } = require('./activityController');
const { resolveMentions } = require('../utils/mentions');
const { sendMentionEmail } = require('../utils/email');
const { broadcastToOrg } = require('../utils/realtime');

const formatComment = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    ...obj,
    author: obj.authorId || null,
    attachments: Array.isArray(obj.attachments)
      ? obj.attachments.filter(Boolean).map(formatFileDoc)
      : []
  };
};

const getTaskComments = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.taskId, orgId: req.user.orgId });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const [comments, taskFiles] = await Promise.all([
      Comment.find({ taskId: task._id, orgId: req.user.orgId })
        .populate('authorId', 'firstName lastName email role')
        .populate({
          path: 'attachments',
          populate: { path: 'uploadedBy', select: 'firstName lastName email' }
        })
        .sort({ createdAt: 1 }),
      SharedFile.find({ taskId: task._id, orgId: req.user.orgId })
        .populate('uploadedBy', 'firstName lastName email role')
        .sort({ createdAt: -1 })
    ]);

    res.json({
      comments: comments.map(formatComment),
      files: taskFiles.map(formatFileDoc)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addTaskComment = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.taskId, orgId: req.user.orgId });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { content, parentId, mentions, attachments } = req.body;
    const trimmed = String(content || '').trim();
    const attachIds = Array.isArray(attachments) ? attachments.filter(Boolean) : [];

    if (!trimmed && attachIds.length === 0) {
      return res.status(400).json({ message: 'Comment text or attachment is required' });
    }

    const parentComment = parentId
      ? await Comment.findOne({ _id: parentId, taskId: task._id })
      : null;

    const mentionedIds = await resolveMentions(trimmed, req.user.orgId, req.user._id, mentions);

    const created = await Comment.create({
      orgId: req.user.orgId,
      taskId: task._id,
      projectId: task.projectId,
      parentId: parentComment ? parentComment._id : null,
      authorId: req.user._id,
      content: trimmed,
      mentions: mentionedIds,
      attachments: attachIds
    });

    if (attachIds.length > 0) {
      await SharedFile.updateMany(
        { _id: { $in: attachIds }, orgId: req.user.orgId },
        { $set: { taskId: task._id, projectId: task.projectId } }
      );
    }

    const senderName = `${req.user.firstName} ${req.user.lastName}`.trim();
    const notified = new Set();
    const mentionedUsers = mentionedIds.length > 0
      ? await User.find({
        _id: { $in: mentionedIds },
        orgId: req.user.orgId,
        isActive: true
      }).select('_id firstName email')
      : [];

    for (const mentionedUser of mentionedUsers) {
      notified.add(mentionedUser._id.toString());
      await Promise.all([
        createNotification({
          orgId: req.user.orgId,
          recipientId: mentionedUser._id,
          senderId: req.user._id,
          type: 'mention',
          title: `${senderName} mentioned you in a task comment`,
          message: `On "${task.title}": ${trimmed.slice(0, 120)}`,
          taskId: task._id,
          projectId: task.projectId
        }),
        sendMentionEmail({
          to: mentionedUser.email,
          recipientName: mentionedUser.firstName,
          senderName,
          taskTitle: task.title,
          comment: trimmed,
          taskUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/tasks?task=${task._id}`
        })
      ]);
    }

    if (parentComment && parentComment.authorId.toString() !== req.user._id.toString() && !notified.has(parentComment.authorId.toString())) {
      notified.add(parentComment.authorId.toString());
      await createNotification({
        orgId: req.user.orgId,
        recipientId: parentComment.authorId,
        senderId: req.user._id,
        type: 'task_comment',
        title: `${senderName} replied to your comment`,
        message: `On "${task.title}": ${trimmed.slice(0, 120)}`,
        taskId: task._id,
        projectId: task.projectId
      });
    }

    for (const targetId of [task.assigneeId, task.createdBy]) {
      const idStr = targetId?.toString();
      if (idStr && idStr !== req.user._id.toString() && !notified.has(idStr)) {
        notified.add(idStr);
        await createNotification({
          orgId: req.user.orgId,
          recipientId: idStr,
          senderId: req.user._id,
          type: 'task_comment',
          title: `New comment on: ${task.title}`,
          message: `${senderName}: "${trimmed.slice(0, 120)}"`,
          taskId: task._id,
          projectId: task.projectId
        });
      }
    }

    await recordActivity({
      orgId: req.user.orgId,
      actorId: req.user._id,
      type: parentComment ? 'reply_added' : mentionedIds.length > 0 ? 'mention' : 'comment_added',
      action: parentComment
        ? 'replied to a comment on task'
        : mentionedIds.length > 0
          ? 'commented & mentioned teammates on task'
          : 'commented on task',
      targetTitle: task.title,
      snippet: trimmed.slice(0, 140),
      projectId: task.projectId,
      taskId: task._id,
      fileId: attachIds[0] || null
    });

    const populated = await Comment.findById(created._id)
      .populate('authorId', 'firstName lastName email role')
      .populate({
        path: 'attachments',
        populate: { path: 'uploadedBy', select: 'firstName lastName email' }
      });

    const formatted = formatComment(populated);
    broadcastToOrg(req.user.orgId, {
      type: 'task:comment_added',
      taskId: task._id.toString(),
      comment: formatted
    });

    res.status(201).json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTaskComment = async (req, res) => {
  try {
    const target = await Comment.findOne({
      _id: req.params.commentId,
      taskId: req.params.taskId,
      orgId: req.user.orgId
    });
    if (!target) return res.status(404).json({ message: 'Comment not found' });

    const isPMorAdmin = ['admin', 'project_manager', 'super_admin'].includes(req.user.role);
    if (target.authorId.toString() !== req.user._id.toString() && !isPMorAdmin) {
      return res.status(403).json({ message: 'Cannot delete another member comment' });
    }

    const childReplies = await Comment.find({ parentId: target._id }).select('_id');
    const removedIds = [target._id.toString(), ...childReplies.map(r => r._id.toString())];

    await Comment.deleteMany({ _id: { $in: removedIds } });

    broadcastToOrg(req.user.orgId, {
      type: 'task:comment_deleted',
      taskId: req.params.taskId,
      removedIds
    });

    res.json({ message: 'Comment deleted', removedIds });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTaskComments,
  addTaskComment,
  deleteTaskComment
};
