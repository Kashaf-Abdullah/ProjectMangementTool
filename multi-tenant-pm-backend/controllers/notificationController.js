const Notification = require('../models/Notification');
const { sendToUser } = require('../utils/realtime');

const createNotification = async ({
  orgId,
  recipientId,
  senderId = null,
  type = 'task_assigned',
  title,
  message,
  taskId = null,
  projectId = null,
  discussionId = null,
  channelId = null
}) => {
  try {
    if (!orgId || !recipientId) return null;
    const notif = await Notification.create({
      orgId,
      recipientId,
      senderId,
      type,
      title,
      message,
      taskId,
      projectId,
      discussionId,
      channelId,
      isRead: false
    });
    const populated = await Notification.findById(notif._id)
      .populate('senderId', 'firstName lastName email role')
      .populate('projectId', 'name color')
      .populate('taskId', 'title status priority');

    sendToUser(recipientId, {
      type: 'notification:new',
      notification: populated
    });
    return populated;
  } catch (err) {
    console.error('Error creating notification:', err.message);
    return null;
  }
};

const getMyNotifications = async (req, res) => {
  try {
    const query = { recipientId: req.user._id };
    if (req.user.orgId) {
      query.orgId = req.user.orgId;
    }
    const [notifications, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate('senderId', 'firstName lastName email role')
        .populate('projectId', 'name color')
        .populate('taskId', 'title status priority')
        .sort({ createdAt: -1 })
        .limit(50),
      Notification.countDocuments({ ...query, isRead: false })
    ]);

    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { isRead: true },
      { new: true }
    )
      .populate('senderId', 'firstName lastName email role')
      .populate('projectId', 'name color')
      .populate('taskId', 'title status priority');

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipientId: req.user._id
    });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createNotification,
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification
};
