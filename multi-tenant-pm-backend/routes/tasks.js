const express = require('express');
const {
  createTask,
  getProjectTasks,
  updateTask,
  getTasks,
  deleteTask
} = require('../controllers/taskController');
const {
  getTaskComments,
  addTaskComment,
  deleteTaskComment
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const { authorize } = require('../middleware/roleGuard');

const router = express.Router();

router.use(protect);
router.use(tenant);

router.route('/')
  .get(getTasks)
  .post(authorize('admin', 'project_manager', 'super_admin'), createTask);

router.get('/project/:projectId', getProjectTasks);

router.get('/:taskId/comments', getTaskComments);
router.post('/:taskId/comments', addTaskComment);
router.delete('/:taskId/comments/:commentId', deleteTaskComment);

router.put('/:id', updateTask);
router.delete('/:id', authorize('admin', 'project_manager', 'super_admin'), deleteTask);

module.exports = router;
