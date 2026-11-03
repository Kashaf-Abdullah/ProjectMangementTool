const express = require('express');
const {
  createProject,
  getOrgProjects,
  updateProject,
  deleteProject,
  getRecentProjects
} = require('../controllers/projectController');
const {
  getDiscussions,
  createDiscussion
} = require('../controllers/discussionController');
const { protect } = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const { authorize } = require('../middleware/roleGuard');

const router = express.Router();

router.use(protect);
router.use(tenant);

router.get('/recent', getRecentProjects);
router.get('/', getOrgProjects);
router.post('/', authorize('admin', 'project_manager', 'super_admin'), createProject);

router.get('/:projectId/discussions', getDiscussions);
router.post('/:projectId/discussions', createDiscussion);

router.put('/:id', authorize('admin', 'project_manager', 'super_admin'), updateProject);
router.delete('/:id', authorize('admin', 'project_manager', 'super_admin'), deleteProject);

module.exports = router;
