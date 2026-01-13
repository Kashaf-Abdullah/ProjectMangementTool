// routes/projects.js
const express = require('express');
const { 
  createProject, 
  getOrgProjects, 
  updateProject, 
  deleteProject ,
  getRecentProjects
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const { authorize } = require('../middleware/roleGuard');

const router = express.Router();

router.use(protect);
router.use(tenant);

router.post('/', authorize('admin', 'project_manager'), createProject);
router.get('/', getOrgProjects);
router.put('/:id', authorize('admin', 'project_manager'), updateProject);
router.delete('/:id', authorize('admin', 'project_manager'), deleteProject);
router.get('/recent', protect, tenant, getRecentProjects);
module.exports = router;
