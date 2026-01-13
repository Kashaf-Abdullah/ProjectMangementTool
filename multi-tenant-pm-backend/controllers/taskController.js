// controllers/taskController.js
const Task = require('../models/Task');

const createTask = async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      orgId: req.user.orgId,
      createdBy: req.user._id
    };

    const task = await Task.create(taskData);
    await task.populate('assigneeId createdBy', 'firstName lastName');
    
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProjectTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ 
      projectId: req.params.projectId,
      orgId: req.user.orgId 
    })
    .populate('assigneeId createdBy', 'firstName lastName')
    .sort({ order: 1, createdAt: -1 });
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// GET all tasks (for dashboard / recent activity)
const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      orgId: req.user.orgId
    })
      .populate('assigneeId createdBy', 'firstName lastName')
      .sort({ updatedAt: -1 })
      .limit(10);

    res.status(200).json(tasks); // ✅ empty array allowed
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// const updateTask = async (req, res) => {
//   try {
//     const isPMorAdmin = ['admin', 'project_manager'].includes(req.user.role);
    
//     const task = await Task.findOne({ 
//       _id: req.params.id,
//       orgId: req.user.orgId 
//     });

//     if (!task) {
//       return res.status(404).json({ message: 'Task not found' });
//     }

//     // Users can only update their own assigned tasks
//     if (!isPMorAdmin && task.assigneeId.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: 'Can only update assigned tasks' });
//     }

//     const updatedTask = await Task.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true, runValidators: true }
//     ).populate('assigneeId createdBy', 'firstName lastName');

//     res.json(updatedTask);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


const updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;
    
    console.log('DEBUG: User role:', userRole);
    console.log('DEBUG: User ID:', userId);
    console.log('DEBUG: Task ID:', taskId);
    
    // Find task
    const task = await Task.findOne({ 
      _id: taskId,
      orgId: req.user.orgId 
    }).populate('assigneeId createdBy', 'firstName lastName');

    if (!task) {
      console.log('DEBUG: Task not found');
      return res.status(404).json({ message: 'Task not found' });
    }

    console.log('DEBUG: Task assigneeId:', task.assigneeId);
    console.log('DEBUG: Task assigneeId type:', typeof task.assigneeId);
    
    // Check permissions
    const isPMorAdmin = ['admin', 'project_manager'].includes(userRole);
    console.log('DEBUG: Is PM/Admin?', isPMorAdmin);
    
    // 🔴 FIX: Check if assigneeId exists before calling toString()
    if (!isPMorAdmin) {
      if (!task.assigneeId) {
        console.log('DEBUG: Task has no assignee');
        return res.status(403).json({ 
          message: 'Task not assigned. Only PMs/Admins can update unassigned tasks.' 
        });
      }
      
      const assigneeIdStr = task.assigneeId._id ? task.assigneeId._id.toString() : task.assigneeId.toString();
      const userIdStr = userId.toString();
      
      console.log('DEBUG: Assignee ID:', assigneeIdStr);
      console.log('DEBUG: User ID:', userIdStr);
      
      if (assigneeIdStr !== userIdStr) {
        console.log('DEBUG: User not assigned to task');
        return res.status(403).json({ 
          message: 'Can only update tasks assigned to you' 
        });
      }
    }

    // Update the task
    console.log('DEBUG: Updating task with data:', req.body);
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      req.body,
      { new: true, runValidators: true }
    ).populate('assigneeId createdBy', 'firstName lastName');

    console.log('DEBUG: Task updated successfully');
    res.json(updatedTask);
    
  } catch (error) {
    console.error('ERROR in updateTask:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
const deleteTask = async (req, res) => {
  try {
    if (!['admin', 'project_manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      orgId: req.user.orgId
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTask, getProjectTasks, updateTask, deleteTask ,getTasks};
