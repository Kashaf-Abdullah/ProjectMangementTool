const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

const getAnalytics = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    if (!orgId && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Organization access required' });
    }

    const filterProjectId = req.query.projectId && req.query.projectId !== 'all'
      ? req.query.projectId
      : null;

    const projectQuery = orgId ? { orgId } : {};
    const userQuery = orgId ? { orgId, isActive: true } : { isActive: true };
    const taskQuery = orgId ? { orgId } : {};
    if (filterProjectId) {
      taskQuery.projectId = filterProjectId;
    }

    const [projects, tasks, users] = await Promise.all([
      Project.find(projectQuery).populate('projectManagerId', 'firstName lastName').lean(),
      Task.find(taskQuery)
        .populate('assigneeId', 'firstName lastName email role')
        .populate('projectId', 'name color')
        .populate('createdBy', 'firstName lastName')
        .lean(),
      User.find(userQuery).select('firstName lastName email role isActive createdAt').lean()
    ]);

    const now = new Date();

    // Status counts
    const statusCounts = {
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0
    };

    // Priority counts
    const priorityCounts = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    };

    let overdueTasks = 0;

    for (const t of tasks) {
      if (statusCounts[t.status] !== undefined) statusCounts[t.status] += 1;
      if (priorityCounts[t.priority] !== undefined) priorityCounts[t.priority] += 1;
      if (t.dueDate && new Date(t.dueDate) < now && t.status !== 'done') {
        overdueTasks += 1;
      }
    }

    const totalTasks = tasks.length;
    const completedTasks = statusCounts.done;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Project breakdown (always across org projects, or single filtered project)
    const allOrgTasks = filterProjectId
      ? await Task.find(orgId ? { orgId } : {}).lean()
      : tasks;

    const projectStats = projects.map(proj => {
      const pid = proj._id.toString();
      const pTasks = allOrgTasks.filter(t => {
        const tPid = t.projectId?._id ? t.projectId._id.toString() : t.projectId?.toString();
        return tPid === pid;
      });
      const pTotal = pTasks.length;
      const pDone = pTasks.filter(t => t.status === 'done').length;
      const pInProgress = pTasks.filter(t => t.status === 'in_progress').length;
      const pReview = pTasks.filter(t => t.status === 'review').length;
      const pTodo = pTasks.filter(t => t.status === 'todo').length;
      const pOverdue = pTasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length;
      const progress = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;

      return {
        _id: proj._id,
        name: proj.name,
        color: proj.color || '#2563eb',
        isActive: proj.isActive,
        managerName: proj.projectManagerId
          ? `${proj.projectManagerId.firstName} ${proj.projectManagerId.lastName}`.trim()
          : 'Unassigned',
        memberCount: Array.isArray(proj.members) ? proj.members.length : 0,
        totalTasks: pTotal,
        completedTasks: pDone,
        inProgressTasks: pInProgress,
        reviewTasks: pReview,
        todoTasks: pTodo,
        overdueTasks: pOverdue,
        progress
      };
    });

    // Member workload breakdown
    const memberWorkload = users.map(u => {
      const uid = u._id.toString();
      const uTasks = tasks.filter(t => {
        const tUid = t.assigneeId?._id ? t.assigneeId._id.toString() : t.assigneeId?.toString();
        return tUid === uid;
      });
      const assigned = uTasks.length;
      const completed = uTasks.filter(t => t.status === 'done').length;
      const inProgress = uTasks.filter(t => t.status === 'in_progress').length;
      const review = uTasks.filter(t => t.status === 'review').length;
      const todo = uTasks.filter(t => t.status === 'todo').length;
      const overdue = uTasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length;
      const rate = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;

      return {
        _id: u._id,
        name: `${u.firstName} ${u.lastName}`.trim(),
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        role: u.role,
        assignedTasks: assigned,
        completedTasks: completed,
        inProgressTasks: inProgress,
        reviewTasks: review,
        todoTasks: todo,
        overdueTasks: overdue,
        completionRate: rate
      };
    }).sort((a, b) => b.assignedTasks - a.assignedTasks);

    // 7-day trend (tasks created vs completed by day)
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - i);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const created = tasks.filter(t => {
        const d = new Date(t.createdAt);
        return d >= dayStart && d <= dayEnd;
      }).length;

      const completed = tasks.filter(t => {
        if (t.status !== 'done') return false;
        const d = new Date(t.updatedAt || t.createdAt);
        return d >= dayStart && d <= dayEnd;
      }).length;

      trend.push({
        date: dayStart.toISOString().split('T')[0],
        label: dayStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        shortLabel: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        created,
        completed
      });
    }

    const currentUserId = req.user._id.toString();
    const myTasks = tasks.filter(t => {
      const tUid = t.assigneeId?._id ? t.assigneeId._id.toString() : t.assigneeId?.toString();
      return tUid === currentUserId;
    });

    res.json({
      summary: {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.isActive).length,
        archivedProjects: projects.filter(p => !p.isActive).length,
        totalTasks,
        completedTasks,
        inProgressTasks: statusCounts.in_progress,
        reviewTasks: statusCounts.review,
        todoTasks: statusCounts.todo,
        overdueTasks,
        completionRate,
        totalMembers: users.length,
        avgTasksPerMember: users.length > 0 ? Number((totalTasks / users.length).toFixed(1)) : 0,
        myAssignedTasks: myTasks.length,
        myCompletedTasks: myTasks.filter(t => t.status === 'done').length,
        myOverdueTasks: myTasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length
      },
      statusDistribution: [
        { key: 'todo', label: 'To Do', count: statusCounts.todo, color: '#64748b' },
        { key: 'in_progress', label: 'In Progress', count: statusCounts.in_progress, color: '#3b82f6' },
        { key: 'review', label: 'In Review', count: statusCounts.review, color: '#f59e0b' },
        { key: 'done', label: 'Completed', count: statusCounts.done, color: '#10b981' }
      ],
      priorityDistribution: [
        { key: 'urgent', label: 'Urgent', count: priorityCounts.urgent, color: '#ef4444' },
        { key: 'high', label: 'High', count: priorityCounts.high, color: '#f59e0b' },
        { key: 'medium', label: 'Medium', count: priorityCounts.medium, color: '#3b82f6' },
        { key: 'low', label: 'Low', count: priorityCounts.low, color: '#64748b' }
      ],
      projectStats,
      memberWorkload,
      weeklyTrend: trend
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAnalytics };
