const Activity = require('../models/Activity');
const { broadcastToOrg } = require('../utils/realtime');

const formatActivityDoc = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    ...obj,
    actor: obj.actorId || null,
    project: obj.projectId || null,
    task: obj.taskId || null,
    projectId: obj.projectId?._id || obj.projectId || null,
    taskId: obj.taskId?._id || obj.taskId || null
  };
};

const recordActivity = async ({
  orgId,
  actorId,
  type,
  action,
  targetTitle,
  snippet = '',
  projectId = null,
  taskId = null,
  discussionId = null,
  fileId = null
}) => {
  try {
    if (!orgId || !actorId) return null;
    const created = await Activity.create({
      orgId,
      actorId,
      type,
      action,
      targetTitle,
      snippet,
      projectId,
      taskId,
      discussionId,
      fileId
    });
    const populated = await Activity.findById(created._id)
      .populate('actorId', 'firstName lastName email role')
      .populate('projectId', 'name color')
      .populate('taskId', 'title');

    const formatted = formatActivityDoc(populated);
    broadcastToOrg(orgId, {
      type: 'activity:new',
      activity: formatted
    });
    return formatted;
  } catch (err) {
    console.error('Error recording activity:', err.message);
    return null;
  }
};

const getActivities = async (req, res) => {
  try {
    const query = { orgId: req.user.orgId };
    if (req.query.projectId && req.query.projectId !== 'all') {
      query.projectId = req.query.projectId;
    }
    if (req.query.actorId && req.query.actorId !== 'all') {
      query.actorId = req.query.actorId;
    }
    if (req.query.category && req.query.category !== 'all') {
      const cat = String(req.query.category);
      if (cat === 'tasks') {
        query.type = { $in: ['task_created', 'task_assigned', 'task_status_changed'] };
      } else if (cat === 'comments') {
        query.type = { $in: ['comment_added', 'reply_added', 'mention'] };
      } else if (cat === 'discussions') {
        query.type = { $in: ['discussion_created', 'discussion_replied'] };
      } else if (cat === 'files') {
        query.type = 'file_uploaded';
      } else if (cat === 'projects') {
        query.type = { $in: ['project_created', 'member_added'] };
      }
    }

    const limitVal = parseInt(req.query.limit || '100', 10);
    const docs = await Activity.find(query)
      .populate('actorId', 'firstName lastName email role')
      .populate('projectId', 'name color')
      .populate('taskId', 'title')
      .sort({ createdAt: -1 })
      .limit(isNaN(limitVal) ? 100 : limitVal);

    res.json(docs.map(formatActivityDoc));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { recordActivity, getActivities };
