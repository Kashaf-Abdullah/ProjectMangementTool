const Discussion = require('../models/Discussion');
const Project = require('../models/Project');
const SharedFile = require('../models/SharedFile');
const { formatFileDoc } = require('./fileController');
const { createNotification } = require('./notificationController');
const { recordActivity } = require('./activityController');
const { resolveMentions } = require('../utils/mentions');
const { broadcastToOrg } = require('../utils/realtime');

const DISC_POPULATE = [
  { path: 'authorId', select: 'firstName lastName email role' },
  { path: 'projectId', select: 'name color' },
  { path: 'attachments', populate: { path: 'uploadedBy', select: 'firstName lastName email' } },
  { path: 'replies.authorId', select: 'firstName lastName email role' },
  { path: 'replies.attachments', populate: { path: 'uploadedBy', select: 'firstName lastName email' } }
];

const formatDiscussion = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  const replies = (obj.replies || []).map((r) => ({
    ...r,
    author: r.authorId || null,
    attachments: Array.isArray(r.attachments) ? r.attachments.filter(Boolean).map(formatFileDoc) : []
  }));
  return {
    ...obj,
    author: obj.authorId || null,
    project: obj.projectId || null,
    projectId: obj.projectId?._id || obj.projectId,
    attachments: Array.isArray(obj.attachments) ? obj.attachments.filter(Boolean).map(formatFileDoc) : [],
    replies,
    replyCount: replies.length
  };
};

const getDiscussions = async (req, res) => {
  try {
    const query = { orgId: req.user.orgId };
    const filterProjectId = req.params.projectId || req.query.projectId;
    if (filterProjectId && filterProjectId !== 'all') {
      query.projectId = filterProjectId;
    }

    const docs = await Discussion.find(query)
      .populate(DISC_POPULATE)
      .sort({ isPinned: -1, updatedAt: -1 });

    res.json(docs.map(formatDiscussion));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createDiscussion = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.projectId, orgId: req.user.orgId });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const { title, content, category, mentions, attachments, isPinned } = req.body;
    if (!title || !String(title).trim() || !content || !String(content).trim()) {
      return res.status(400).json({ message: 'Discussion title and message are required' });
    }

    const attachIds = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
    const mentionedIds = await resolveMentions(`${title} ${content}`, req.user.orgId, req.user._id, mentions);

    const created = await Discussion.create({
      orgId: req.user.orgId,
      projectId: project._id,
      title: String(title).trim(),
      content: String(content).trim(),
      category: ['general', 'architecture', 'design', 'release', 'blocker'].includes(category) ? category : 'general',
      isPinned: Boolean(isPinned),
      isResolved: false,
      authorId: req.user._id,
      mentions: mentionedIds,
      attachments: attachIds,
      replies: []
    });

    if (attachIds.length > 0) {
      await SharedFile.updateMany(
        { _id: { $in: attachIds }, orgId: req.user.orgId },
        { $set: { discussionId: created._id, projectId: project._id } }
      );
    }

    const senderName = `${req.user.firstName} ${req.user.lastName}`.trim();
    for (const mId of mentionedIds) {
      await createNotification({
        orgId: req.user.orgId,
        recipientId: mId,
        senderId: req.user._id,
        type: 'mention',
        title: `${senderName} mentioned you in "${project.name}"`,
        message: `Discussion "${created.title}": ${created.content.slice(0, 110)}`,
        projectId: project._id,
        discussionId: created._id
      });
    }

    await recordActivity({
      orgId: req.user.orgId,
      actorId: req.user._id,
      type: 'discussion_created',
      action: `started a discussion in ${project.name}`,
      targetTitle: created.title,
      snippet: created.content.slice(0, 140),
      projectId: project._id,
      discussionId: created._id,
      fileId: attachIds[0] || null
    });

    const populated = await Discussion.findById(created._id).populate(DISC_POPULATE);
    const formatted = formatDiscussion(populated);
    broadcastToOrg(req.user.orgId, { type: 'discussion:created', discussion: formatted });
    res.status(201).json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addDiscussionReply = async (req, res) => {
  try {
    const disc = await Discussion.findOne({ _id: req.params.id, orgId: req.user.orgId });
    if (!disc) return res.status(404).json({ message: 'Discussion not found' });

    const { content, mentions, attachments } = req.body;
    const trimmed = String(content || '').trim();
    const attachIds = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
    if (!trimmed && attachIds.length === 0) {
      return res.status(400).json({ message: 'Reply content or file attachment required' });
    }

    const mentionedIds = await resolveMentions(trimmed, req.user.orgId, req.user._id, mentions);

    disc.replies.push({
      authorId: req.user._id,
      content: trimmed,
      mentions: mentionedIds,
      attachments: attachIds,
      createdAt: new Date()
    });
    await disc.save();

    if (attachIds.length > 0) {
      await SharedFile.updateMany(
        { _id: { $in: attachIds }, orgId: req.user.orgId },
        { $set: { discussionId: disc._id, projectId: disc.projectId } }
      );
    }

    const senderName = `${req.user.firstName} ${req.user.lastName}`.trim();
    const notified = new Set();

    for (const mId of mentionedIds) {
      notified.add(mId.toString());
      await createNotification({
        orgId: req.user.orgId,
        recipientId: mId,
        senderId: req.user._id,
        type: 'mention',
        title: `${senderName} mentioned you in discussion "${disc.title}"`,
        message: trimmed.slice(0, 120),
        projectId: disc.projectId,
        discussionId: disc._id
      });
    }

    if (disc.authorId.toString() !== req.user._id.toString() && !notified.has(disc.authorId.toString())) {
      await createNotification({
        orgId: req.user.orgId,
        recipientId: disc.authorId,
        senderId: req.user._id,
        type: 'discussion_reply',
        title: `${senderName} replied to "${disc.title}"`,
        message: trimmed.slice(0, 120),
        projectId: disc.projectId,
        discussionId: disc._id
      });
    }

    await recordActivity({
      orgId: req.user.orgId,
      actorId: req.user._id,
      type: 'discussion_replied',
      action: 'replied to project discussion',
      targetTitle: disc.title,
      snippet: trimmed.slice(0, 140),
      projectId: disc.projectId,
      discussionId: disc._id,
      fileId: attachIds[0] || null
    });

    const populated = await Discussion.findById(disc._id).populate(DISC_POPULATE);
    const formatted = formatDiscussion(populated);
    broadcastToOrg(req.user.orgId, { type: 'discussion:updated', discussion: formatted });
    res.status(201).json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateDiscussion = async (req, res) => {
  try {
    const disc = await Discussion.findOne({ _id: req.params.id, orgId: req.user.orgId });
    if (!disc) return res.status(404).json({ message: 'Discussion not found' });

    if (req.body.isPinned !== undefined) disc.isPinned = Boolean(req.body.isPinned);
    if (req.body.isResolved !== undefined) disc.isResolved = Boolean(req.body.isResolved);
    if (req.body.title !== undefined) disc.title = String(req.body.title).trim();
    if (req.body.content !== undefined) disc.content = String(req.body.content).trim();
    await disc.save();

    const populated = await Discussion.findById(disc._id).populate(DISC_POPULATE);
    const formatted = formatDiscussion(populated);
    broadcastToOrg(req.user.orgId, { type: 'discussion:updated', discussion: formatted });
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteDiscussion = async (req, res) => {
  try {
    const disc = await Discussion.findOne({ _id: req.params.id, orgId: req.user.orgId });
    if (!disc) return res.status(404).json({ message: 'Discussion not found' });

    const isPMorAdmin = ['admin', 'project_manager', 'super_admin'].includes(req.user.role);
    if (disc.authorId.toString() !== req.user._id.toString() && !isPMorAdmin) {
      return res.status(403).json({ message: 'Insufficient permission to delete discussion' });
    }

    await Discussion.deleteOne({ _id: disc._id });
    broadcastToOrg(req.user.orgId, { type: 'discussion:deleted', discussionId: disc._id.toString() });
    res.json({ message: 'Discussion deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDiscussions,
  createDiscussion,
  addDiscussionReply,
  updateDiscussion,
  deleteDiscussion
};
