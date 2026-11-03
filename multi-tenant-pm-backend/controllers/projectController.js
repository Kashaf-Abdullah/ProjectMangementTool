const Project = require('../models/Project');
const Task = require('../models/Task');
const Discussion = require('../models/Discussion');
const SharedFile = require('../models/SharedFile');
const Notification = require('../models/Notification');
const { createNotification } = require('./notificationController');
const { recordActivity } = require('./activityController');

const PROJECT_POPULATE = [
  { path: 'projectManagerId', select: 'firstName lastName email role' },
  { path: 'members', select: 'firstName lastName email role' }
];

const enrichProjectsWithTaskStats = async (projects, orgId) => {
  if (!projects || projects.length === 0) return [];
  const projectIds = projects.map(p => p._id);

  const [tasks, discAgg, fileAgg] = await Promise.all([
    Task.find({ orgId, projectId: { $in: projectIds } }).select('projectId status dueDate'),
    Discussion.aggregate([
      { $match: { orgId, projectId: { $in: projectIds } } },
      { $group: { _id: '$projectId', count: { $sum: 1 } } }
    ]),
    SharedFile.aggregate([
      { $match: { orgId, projectId: { $in: projectIds } } },
      { $group: { _id: '$projectId', count: { $sum: 1 } } }
    ])
  ]);

  const statsMap = {};
  const discMap = {};
  const fileMap = {};
  const now = new Date();

  for (const row of discAgg) discMap[row._id.toString()] = row.count;
  for (const row of fileAgg) fileMap[row._id.toString()] = row.count;

  for (const pid of projectIds) {
    statsMap[pid.toString()] = { total: 0, completed: 0, inProgress: 0, overdue: 0 };
  }

  for (const t of tasks) {
    const key = t.projectId?.toString();
    if (!statsMap[key]) continue;
    statsMap[key].total += 1;
    if (t.status === 'done') statsMap[key].completed += 1;
    if (t.status === 'in_progress') statsMap[key].inProgress += 1;
    if (t.dueDate && new Date(t.dueDate) < now && t.status !== 'done') {
      statsMap[key].overdue += 1;
    }
  }

  return projects.map(p => {
    const obj = p.toObject ? p.toObject() : p;
    const key = obj._id.toString();
    const st = statsMap[key] || { total: 0, completed: 0, inProgress: 0, overdue: 0 };
    const computedProgress = st.total > 0 ? Math.round((st.completed / st.total) * 100) : (obj.progress || 0);
    return {
      ...obj,
      taskCount: st.total,
      completedTaskCount: st.completed,
      inProgressTaskCount: st.inProgress,
      overdueTaskCount: st.overdue,
      discussionCount: discMap[key] || 0,
      fileCount: fileMap[key] || 0,
      progress: st.total > 0 ? computedProgress : 0
    };
  });
};

const createProject = async (req, res) => {
  try {
    const memberIds = Array.isArray(req.body.members) ? [...req.body.members] : [];
    if (!memberIds.some(id => id.toString() === req.user._id.toString())) {
      memberIds.push(req.user._id);
    }

    const projectData = {
      name: req.body.name,
      description: req.body.description || '',
      color: req.body.color || '#2563eb',
      members: memberIds,
      orgId: req.user.orgId,
      projectManagerId: req.user._id
    };

    const project = await Project.create(projectData);
    await project.populate(PROJECT_POPULATE);

    const senderName = `${req.user.firstName} ${req.user.lastName}`.trim();
    for (const member of project.members) {
      const mId = member._id ? member._id.toString() : member.toString();
      if (mId !== req.user._id.toString()) {
        await createNotification({
          orgId: req.user.orgId,
          recipientId: mId,
          senderId: req.user._id,
          type: 'project_member_added',
          title: `Added to Project: ${project.name}`,
          message: `${senderName} added you to project "${project.name}".`,
          projectId: project._id
        });
      }
    }

    await recordActivity({
      orgId: req.user.orgId,
      actorId: req.user._id,
      type: 'project_created',
      action: 'created project',
      targetTitle: project.name,
      snippet: project.description || '',
      projectId: project._id
    });

    res.status(201).json({
      ...project.toObject(),
      taskCount: 0,
      completedTaskCount: 0,
      discussionCount: 0,
      fileCount: 0,
      progress: 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrgProjects = async (req, res) => {
  try {
    const projects = await Project.find({ orgId: req.user.orgId })
      .populate(PROJECT_POPULATE)
      .sort({ createdAt: -1 });
    const enriched = await enrichProjectsWithTaskStats(projects, req.user.orgId);
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const existing = await Project.findOne({ _id: req.params.id, orgId: req.user.orgId });
    if (!existing) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const oldMembers = new Set((existing.members || []).map(m => m.toString()));
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, orgId: req.user.orgId },
      req.body,
      { new: true, runValidators: true }
    ).populate(PROJECT_POPULATE);

    if (Array.isArray(req.body.members)) {
      const senderName = `${req.user.firstName} ${req.user.lastName}`.trim();
      for (const mId of req.body.members) {
        const idStr = mId.toString();
        if (!oldMembers.has(idStr) && idStr !== req.user._id.toString()) {
          await createNotification({
            orgId: req.user.orgId,
            recipientId: idStr,
            senderId: req.user._id,
            type: 'project_member_added',
            title: `Added to Project: ${project.name}`,
            message: `${senderName} added you to project "${project.name}".`,
            projectId: project._id
          });
        }
      }
    }

    const [enriched] = await enrichProjectsWithTaskStats([project], req.user.orgId);
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      orgId: req.user.orgId
    });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    await Task.deleteMany({ projectId: project._id, orgId: req.user.orgId });
    await Discussion.deleteMany({ projectId: project._id, orgId: req.user.orgId });
    await Notification.deleteMany({ projectId: project._id, orgId: req.user.orgId });
    res.json({ message: 'Project and associated tasks deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRecentProjects = async (req, res) => {
  try {
    const projects = await Project.find({ orgId: req.user.orgId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate(PROJECT_POPULATE);
    const enriched = await enrichProjectsWithTaskStats(projects, req.user.orgId);
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProject,
  getRecentProjects,
  getOrgProjects,
  updateProject,
  deleteProject
};
