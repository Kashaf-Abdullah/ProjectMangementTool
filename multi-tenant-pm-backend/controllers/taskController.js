const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const { sendTaskAssignedEmail } = require('../utils/email');

const TASK_POPULATE = [
  { path: 'assigneeId', select: 'firstName lastName email role' },
  { path: 'createdBy', select: 'firstName lastName email role' },
  { path: 'projectId', select: 'name color isActive members projectManagerId' }
];

const recalculateProjectProgress = async (projectId) => {
  if (!projectId) return;
  try {
    const [total, completed] = await Promise.all([
      Task.countDocuments({ projectId }),
      Task.countDocuments({ projectId, status: 'done' })
    ]);
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    await Project.findByIdAndUpdate(projectId, { progress });
  } catch (err) {
    console.error('Failed to recalculate project progress:', err.message);
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, projectId, assigneeId, status, priority, dueDate, startDate, labels } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }
    if (!projectId) {
      return res.status(400).json({ message: 'Project is required' });
    }
    if (!assigneeId) {
      return res.status(400).json({ message: 'Assignee member is required' });
    }

    const [project, assignee] = await Promise.all([
      Project.findOne({ _id: projectId, orgId: req.user.orgId }),
      User.findOne({ _id: assigneeId, orgId: req.user.orgId })
    ]);

    if (!project) {
      return res.status(404).json({ message: 'Selected project not found in your organization' });
    }
    if (!assignee) {
      return res.status(404).json({ message: 'Selected assignee not found in your organization' });
    }

    // Ensure assigned member is part of project members automatically
    await Project.findByIdAndUpdate(project._id, {
      $addToSet: { members: assignee._id }
    });

    const task = await Task.create({
      title: title.trim(),
      description: description || '',
      projectId: project._id,
      orgId: req.user.orgId,
      assigneeId: assignee._id,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || undefined,
      startDate: startDate || undefined,
      labels: Array.isArray(labels) ? labels : [],
      createdBy: req.user._id
    });

    await task.populate(TASK_POPULATE);
    await recalculateProjectProgress(project._id);

    // Trigger notification for assigned member
    const senderName = `${req.user.firstName} ${req.user.lastName}`.trim();
    await createNotification({
      orgId: req.user.orgId,
      recipientId: assignee._id,
      senderId: req.user._id,
      type: 'task_assigned',
      title: `New Task Assigned: ${task.title}`,
      message: `${senderName} assigned you "${task.title}" in project "${project.name}" (${task.priority} priority).`,
      taskId: task._id,
      projectId: project._id
    });

    // Non-blocking email notification
    sendTaskAssignedEmail({
      to: assignee.email,
      assigneeName: assignee.firstName,
      taskTitle: task.title,
      projectName: project.name,
      assignedByName: senderName,
      priority: task.priority,
      dueDate: task.dueDate
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: error.message });
  }
};

const getProjectTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      projectId: req.params.projectId,
      orgId: req.user.orgId
    })
      .populate(TASK_POPULATE)
      .sort({ order: 1, createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTasks = async (req, res) => {
  try {
    const query = { orgId: req.user.orgId };

    if (req.query.projectId && req.query.projectId !== 'all') {
      query.projectId = req.query.projectId;
    }
    if (req.query.assigneeId && req.query.assigneeId !== 'all') {
      query.assigneeId = req.query.assigneeId;
    }
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }
    if (req.query.priority && req.query.priority !== 'all') {
      query.priority = req.query.priority;
    }

    let taskQuery = Task.find(query)
      .populate(TASK_POPULATE)
      .sort({ updatedAt: -1, createdAt: -1 });

    if (req.query.limit) {
      const limitVal = parseInt(req.query.limit, 10);
      if (!isNaN(limitVal) && limitVal > 0) {
        taskQuery = taskQuery.limit(limitVal);
      }
    }

    const tasks = await taskQuery;
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;

    const existingTask = await Task.findOne({
      _id: taskId,
      orgId: req.user.orgId
    }).populate(TASK_POPULATE);

    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const isPMorAdmin = ['admin', 'project_manager', 'super_admin'].includes(userRole);
    const oldAssigneeId = existingTask.assigneeId?._id
      ? existingTask.assigneeId._id.toString()
      : existingTask.assigneeId?.toString();
    const oldProjectId = existingTask.projectId?._id
      ? existingTask.projectId._id.toString()
      : existingTask.projectId?.toString();
    const oldStatus = existingTask.status;

    if (!isPMorAdmin) {
      if (!oldAssigneeId || oldAssigneeId !== userId.toString()) {
        return res.status(403).json({
          message: 'You can only update tasks assigned to you'
        });
      }
      // Regular members cannot reassign tasks to others or move across projects
      if (req.body.assigneeId && req.body.assigneeId.toString() !== oldAssigneeId) {
        return res.status(403).json({
          message: 'Only Admins or Project Managers can reassign tasks'
        });
      }
      if (req.body.projectId && req.body.projectId.toString() !== oldProjectId) {
        return res.status(403).json({
          message: 'Only Admins or Project Managers can move tasks between projects'
        });
      }
    }

    // Validate new projectId if changed
    let targetProjectId = oldProjectId;
    if (req.body.projectId && req.body.projectId.toString() !== oldProjectId) {
      const targetProject = await Project.findOne({
        _id: req.body.projectId,
        orgId: req.user.orgId
      });
      if (!targetProject) {
        return res.status(404).json({ message: 'Target project not found in your organization' });
      }
      targetProjectId = targetProject._id.toString();
    }

    // Validate new assigneeId if provided
    let newAssigneeDoc = null;
    if (req.body.assigneeId) {
      newAssigneeDoc = await User.findOne({
        _id: req.body.assigneeId,
        orgId: req.user.orgId
      });
      if (!newAssigneeDoc) {
        return res.status(404).json({ message: 'Selected assignee not found in your organization' });
      }
      await Project.findByIdAndUpdate(targetProjectId, {
        $addToSet: { members: newAssigneeDoc._id }
      });
    } else if (targetProjectId !== oldProjectId && oldAssigneeId) {
      await Project.findByIdAndUpdate(targetProjectId, {
        $addToSet: { members: oldAssigneeId }
      });
    }

    const allowedFields = ['title', 'description', 'projectId', 'assigneeId', 'status', 'priority', 'dueDate', 'startDate', 'order', 'labels'];
    const updatePayload = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updatePayload[key] = req.body[key];
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      updatePayload,
      { new: true, runValidators: true }
    ).populate(TASK_POPULATE);

    // Recalculate progress for affected project(s)
    await recalculateProjectProgress(targetProjectId);
    if (oldProjectId && oldProjectId !== targetProjectId) {
      await recalculateProjectProgress(oldProjectId);
    }

    const senderName = `${req.user.firstName} ${req.user.lastName}`.trim();
    const newAssigneeId = updatedTask.assigneeId?._id
      ? updatedTask.assigneeId._id.toString()
      : updatedTask.assigneeId?.toString();
    const projectName = updatedTask.projectId?.name || 'Project';

    // Notify newly assigned member whenever assignee changes
    if (newAssigneeId && newAssigneeId !== oldAssigneeId) {
      await createNotification({
        orgId: req.user.orgId,
        recipientId: newAssigneeId,
        senderId: req.user._id,
        type: 'task_assigned',
        title: `Task Assigned: ${updatedTask.title}`,
        message: `${senderName} assigned you "${updatedTask.title}" in project "${projectName}" (${updatedTask.priority} priority).`,
        taskId: updatedTask._id,
        projectId: updatedTask.projectId?._id || targetProjectId
      });

      if (newAssigneeDoc) {
        sendTaskAssignedEmail({
          to: newAssigneeDoc.email,
          assigneeName: newAssigneeDoc.firstName,
          taskTitle: updatedTask.title,
          projectName,
          assignedByName: senderName,
          priority: updatedTask.priority,
          dueDate: updatedTask.dueDate
        });
      }
    } else if (req.body.status && req.body.status !== oldStatus) {
      // Notify task creator and/or assignee about status change (if different from actor)
      const recipients = new Set();
      const creatorId = updatedTask.createdBy?._id?.toString();
      if (creatorId && creatorId !== userId.toString()) recipients.add(creatorId);
      if (newAssigneeId && newAssigneeId !== userId.toString()) recipients.add(newAssigneeId);

      const statusLabel = updatedTask.status.replace('_', ' ');
      for (const recipientId of recipients) {
        await createNotification({
          orgId: req.user.orgId,
          recipientId,
          senderId: req.user._id,
          type: 'task_status_changed',
          title: `Task Status Updated: ${updatedTask.title}`,
          message: `${senderName} moved "${updatedTask.title}" to "${statusLabel}" in "${projectName}".`,
          taskId: updatedTask._id,
          projectId: updatedTask.projectId?._id || targetProjectId
        });
      }
    }

    res.json(updatedTask);
  } catch (error) {
    console.error('ERROR in updateTask:', error);
    res.status(500).json({ message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    if (!['admin', 'project_manager', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      orgId: req.user.orgId
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await recalculateProjectProgress(task.projectId);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  getProjectTasks,
  updateTask,
  deleteTask,
  getTasks,
  recalculateProjectProgress
};
