// routes/tasks.js
const express = require('express');
const { 
  createTask, 
  getProjectTasks, 
  updateTask,
  getTasks, 
  deleteTask 
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const { authorize } = require('../middleware/roleGuard');

const router = express.Router();

router.use(protect);
router.use(tenant);

// router.route('/')
//   .get(getTasks)       // ✅ FIXED
//   .post(protect, createTask);

router.route('/')
  .get(getTasks)           // ✅ Already protected by `router.use(protect)`
  .post(authorize('admin', 'project_manager'), createTask); // Add authorization

// router.post('/', authorize('admin', 'project_manager'), createTask);
router.get('/project/:projectId', getProjectTasks);
router.put('/:id', updateTask);
router.delete('/:id', authorize('admin', 'project_manager'), deleteTask);

module.exports = router;
