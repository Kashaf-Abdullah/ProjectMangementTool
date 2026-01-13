// controllers/projectController.js
const Project = require('../models/Project');
const User = require('../models/User');

const createProject = async (req, res) => {
  try {
    const projectData = {
      ...req.body,
      orgId: req.user.orgId,
      projectManagerId: req.user._id
    };

    const project = await Project.create(projectData);
    await project.populate('projectManagerId', 'firstName lastName');
    
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrgProjects = async (req, res) => {
  try {
    const projects = await Project.find({ orgId: req.user.orgId })
      .populate('projectManagerId', 'firstName lastName')
      .populate('members', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, orgId: req.user.orgId },
      req.body,
      { new: true, runValidators: true }
    ).populate('projectManagerId', 'firstName lastName');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
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

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Add this function
const getRecentProjects = async (req, res) => {
  try {
    const projects = await Project.find({ 
      orgId: req.user.orgId 
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('createdBy', 'firstName lastName');
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = { createProject, getRecentProjects,getOrgProjects, updateProject, deleteProject };
