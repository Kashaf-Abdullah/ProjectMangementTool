const ChatChannel = require('../models/ChatChannel');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const SharedFile = require('../models/SharedFile');
const { formatFileDoc } = require('./fileController');
const { createNotification } = require('./notificationController');
const { resolveMentions } = require('../utils/mentions');
const { broadcastToOrg, sendToUser, getOnlineUserIds } = require('../utils/realtime');

const ensureDefaultChannels = async (orgId, userId) => {
  const count = await ChatChannel.countDocuments({ orgId, type: 'channel' });
  if (count > 0) return;

  const activeUsers = await User.find({ orgId, isActive: true }).select('_id');
  const participantIds = activeUsers.map(u => u._id);

  await ChatChannel.insertMany([
    {
      orgId,
      name: 'general',
      description: 'Workspace announcements, daily standups, and team updates',
      type: 'channel',
      participants: participantIds,
      createdBy: userId
    },
    {
      orgId,
      name: 'engineering',
      description: 'Architecture, API updates, and bug triage',
      type: 'channel',
      participants: participantIds,
      createdBy: userId
    },
    {
      orgId,
      name: 'design-product',
      description: 'UI wireframes, design reviews, and product discussions',
      type: 'channel',
      participants: participantIds,
      createdBy: userId
    }
  ]);
};

const formatChannelDoc = (doc, viewerId) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  const viewerStr = viewerId?.toString();
  let displayName = obj.name;
  let dmPartner = null;

  if (obj.type === 'dm' && Array.isArray(obj.participants)) {
    const other = obj.participants.find(p => p && p._id?.toString() !== viewerStr) || obj.participants[0] || null;
    dmPartner = other;
    if (other) {
      displayName = `${other.firstName} ${other.lastName}`.trim();
    }
  }

  return {
    ...obj,
    displayName,
    dmPartner,
    project: obj.projectId || null
  };
};

const formatMessageDoc = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  const replyTarget = obj.replyToId;
  return {
    ...obj,
    sender: obj.senderId || null,
    attachments: Array.isArray(obj.attachments) ? obj.attachments.filter(Boolean).map(formatFileDoc) : [],
    replyTo: replyTarget && replyTarget._id
      ? {
          _id: replyTarget._id,
          content: replyTarget.content,
          senderName: replyTarget.senderId
            ? `${replyTarget.senderId.firstName} ${replyTarget.senderId.lastName}`.trim()
            : 'Member'
        }
      : null
  };
};

const getChannels = async (req, res) => {
  try {
    await ensureDefaultChannels(req.user.orgId, req.user._id);

    const channels = await ChatChannel.find({
      orgId: req.user.orgId,
      $or: [{ type: 'channel' }, { participants: req.user._id }]
    })
      .populate('participants', 'firstName lastName email role')
      .populate('projectId', 'name color')
      .sort({ updatedAt: -1 });

    res.json({
      channels: channels.map(c => formatChannelDoc(c, req.user._id)),
      onlineUserIds: getOnlineUserIds(req.user.orgId)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createChannel = async (req, res) => {
  try {
    const slug = String(req.body.name || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (!slug) return res.status(400).json({ message: 'Valid channel name is required' });

    const exists = await ChatChannel.findOne({ orgId: req.user.orgId, type: 'channel', name: slug });
    if (exists) return res.status(400).json({ message: `Channel #${slug} already exists` });

    const activeUsers = await User.find({ orgId: req.user.orgId, isActive: true }).select('_id');
    const created = await ChatChannel.create({
      orgId: req.user.orgId,
      name: slug,
      description: String(req.body.description || '').trim(),
      type: 'channel',
      projectId: req.body.projectId || null,
      participants: activeUsers.map(u => u._id),
      createdBy: req.user._id
    });

    const populated = await ChatChannel.findById(created._id)
      .populate('participants', 'firstName lastName email role')
      .populate('projectId', 'name color');

    const formatted = formatChannelDoc(populated, req.user._id);
    broadcastToOrg(req.user.orgId, { type: 'chat:channel_created', channel: formatted });
    res.status(201).json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const openOrCreateDM = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId || targetUserId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Select a valid teammate for Direct Message' });
    }
    const target = await User.findOne({ _id: targetUserId, orgId: req.user.orgId, isActive: true });
    if (!target) return res.status(404).json({ message: 'Teammate not found' });

    let existing = await ChatChannel.findOne({
      orgId: req.user.orgId,
      type: 'dm',
      participants: { $all: [req.user._id, target._id], $size: 2 }
    }).populate('participants', 'firstName lastName email role');

    if (!existing) {
      const created = await ChatChannel.create({
        orgId: req.user.orgId,
        name: `dm-${req.user._id.toString().slice(-4)}-${target._id.toString().slice(-4)}`,
        description: 'Direct Message',
        type: 'dm',
        participants: [req.user._id, target._id],
        createdBy: req.user._id
      });
      existing = await ChatChannel.findById(created._id).populate(
        'participants',
        'firstName lastName email role'
      );
    }

    res.json(formatChannelDoc(existing, req.user._id));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getChannelMessages = async (req, res) => {
  try {
    const channel = await ChatChannel.findOne({ _id: req.params.channelId, orgId: req.user.orgId });
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    if (channel.type === 'dm' && !channel.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied to private conversation' });
    }

    const msgs = await ChatMessage.find({ channelId: channel._id, orgId: req.user.orgId })
      .populate('senderId', 'firstName lastName email role')
      .populate({
        path: 'attachments',
        populate: { path: 'uploadedBy', select: 'firstName lastName email' }
      })
      .populate({
        path: 'replyToId',
        populate: { path: 'senderId', select: 'firstName lastName' }
      })
      .sort({ createdAt: 1 })
      .limit(200);

    res.json(msgs.map(formatMessageDoc));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendChannelMessage = async (req, res) => {
  try {
    const channel = await ChatChannel.findOne({ _id: req.params.channelId, orgId: req.user.orgId });
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    if (channel.type === 'dm' && !channel.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied to private conversation' });
    }

    const { content, mentions, attachments, replyToId } = req.body;
    const trimmed = String(content || '').trim();
    const attachIds = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
    if (!trimmed && attachIds.length === 0) {
      return res.status(400).json({ message: 'Message content or file attachment required' });
    }

    const mentionedIds = await resolveMentions(trimmed, req.user.orgId, req.user._id, mentions);

    const created = await ChatMessage.create({
      orgId: req.user.orgId,
      channelId: channel._id,
      senderId: req.user._id,
      content: trimmed,
      mentions: mentionedIds,
      attachments: attachIds,
      replyToId: replyToId || null
    });

    channel.updatedAt = new Date();
    await channel.save();

    if (attachIds.length > 0) {
      await SharedFile.updateMany(
        { _id: { $in: attachIds }, orgId: req.user.orgId },
        { $set: { channelId: channel._id } }
      );
    }

    const populated = await ChatMessage.findById(created._id)
      .populate('senderId', 'firstName lastName email role')
      .populate({
        path: 'attachments',
        populate: { path: 'uploadedBy', select: 'firstName lastName email' }
      })
      .populate({
        path: 'replyToId',
        populate: { path: 'senderId', select: 'firstName lastName' }
      });

    const formatted = formatMessageDoc(populated);
    const senderName = `${req.user.firstName} ${req.user.lastName}`.trim();

    if (channel.type === 'dm') {
      for (const pId of channel.participants) {
        sendToUser(pId, { type: 'chat:message', message: formatted, channelId: channel._id.toString() });
        if (pId.toString() !== req.user._id.toString()) {
          await createNotification({
            orgId: req.user.orgId,
            recipientId: pId,
            senderId: req.user._id,
            type: 'chat_dm',
            title: `Direct Message from ${senderName}`,
            message: trimmed || 'Shared a file attachment with you',
            channelId: channel._id
          });
        }
      }
    } else {
      broadcastToOrg(req.user.orgId, { type: 'chat:message', message: formatted, channelId: channel._id.toString() });
      for (const mId of mentionedIds) {
        await createNotification({
          orgId: req.user.orgId,
          recipientId: mId,
          senderId: req.user._id,
          type: 'mention',
          title: `${senderName} mentioned you in #${channel.name}`,
          message: trimmed.slice(0, 120),
          projectId: channel.projectId,
          channelId: channel._id
        });
      }
    }

    res.status(201).json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteChatMessage = async (req, res) => {
  try {
    const msg = await ChatMessage.findOne({ _id: req.params.id, orgId: req.user.orgId });
    if (!msg) return res.status(404).json({ message: 'Message not found' });

    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    if (msg.senderId.toString() !== req.user._id.toString() && !isAdmin) {
      return res.status(403).json({ message: 'Cannot delete another member message' });
    }

    await ChatMessage.deleteOne({ _id: msg._id });
    broadcastToOrg(req.user.orgId, {
      type: 'chat:message_deleted',
      channelId: msg.channelId.toString(),
      messageId: msg._id.toString()
    });
    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getChannels,
  createChannel,
  openOrCreateDM,
  getChannelMessages,
  sendChannelMessage,
  deleteChatMessage
};
