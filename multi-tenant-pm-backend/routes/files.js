const express = require('express');
const {
  uploadMiddleware,
  getFiles,
  uploadFile,
  streamFileContent,
  downloadFile,
  deleteFile
} = require('../controllers/fileController');
const { protect } = require('../middleware/auth');
const tenant = require('../middleware/tenant');

const router = express.Router();
router.use(protect);
router.use(tenant);

router.get('/', getFiles);
router.post('/upload', uploadMiddleware.single('file'), uploadFile);
router.get('/:id/content', streamFileContent);
router.get('/:id/download', downloadFile);
router.delete('/:id', deleteFile);

module.exports = router;
