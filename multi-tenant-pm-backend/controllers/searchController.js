const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const search = async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (query.length < 2 || query.length > 100) {
    return res.status(400).json({ message: 'Search query must be between 2 and 100 characters' });
  }

  if (!req.user.orgId) {
    return res.json({ tasks: [], projects: [], users: [] });
  }

  try {
    const matcher = new RegExp(escapeRegex(query), 'i');
    const orgId = req.user.orgId;

    const [tasks, projects, users] = await Promise.all([
      Task.find({ orgId, $or: [{ title: matcher }, { description: matcher }] })
        .select('title status priority projectId')
        .populate({ path: 'projectId', select: 'name' })
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean(),
      Project.find({ orgId, $or: [{ name: matcher }, { description: matcher }] })
        .select('name description color')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      User.find({
        orgId,
        _id: { $ne: req.user._id },
        isActive: true,
        $or: [{ firstName: matcher }, { lastName: matcher }, { email: matcher }]
      })
        .select('firstName lastName email role')
        .sort({ firstName: 1, lastName: 1 })
        .limit(5)
        .lean()
    ]);

    res.json({ tasks, projects, users });
  } catch (error) {
    console.error('Error searching workspace:', error);
    res.status(500).json({ message: 'Failed to search workspace' });
  }
};

module.exports = { search };
