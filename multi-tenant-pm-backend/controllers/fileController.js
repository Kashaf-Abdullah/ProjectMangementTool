const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const multer = require('multer');
const SharedFile = require('../models/SharedFile');
const { recordActivity } = require('./activityController');
const { broadcastToOrg } = require('../utils/realtime');

const UPLOAD_DIR = process.env.UPLOAD_DIR || (
  process.env.VERCEL
    ? path.join(os.tmpdir(), 'multi-tenant-pm-uploads')
    : path.join(__dirname, '..', 'uploads')
);
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').slice(0, 12);
    cb(null, `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`);
  }
});

const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }
});

function detectCategory(mimeType = '', filename = '') {
  const lower = filename.toLowerCase();
  if (mimeType.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|svg)$/.test(lower)) return 'image';
  if (/\.(zip|tar|gz|rar|7z)$/.test(lower) || mimeType.includes('zip')) return 'archive';
  if (/\.(csv|json|xml|sql|yaml|yml|ts|js|jsx|tsx)$/.test(lower) || mimeType.includes('json') || mimeType.includes('csv')) {
    return 'data';
  }
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('word') ||
    mimeType.startsWith('text/') ||
    /\.(pdf|doc|docx|txt|md|rtf|ppt|pptx|xls|xlsx)$/.test(lower)
  ) {
    return 'document';
  }
  return 'other';
}

const formatFileDoc = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    ...obj,
    url: `/api/files/${obj._id}/content`,
    downloadUrl: `/api/files/${obj._id}/download`
  };
};

const getFiles = async (req, res) => {
  try {
    const query = { orgId: req.user.orgId };
    if (req.query.projectId && req.query.projectId !== 'all') {
      query.projectId = req.query.projectId;
    }
    if (req.query.taskId) {
      query.taskId = req.query.taskId;
    }
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }

    const docs = await SharedFile.find(query)
      .populate('uploadedBy', 'firstName lastName email role')
      .populate('projectId', 'name color')
      .populate('taskId', 'title')
      .sort({ createdAt: -1 });

    res.json(docs.map(formatFileDoc));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }
    const { projectId, taskId, discussionId, channelId, description } = req.body;
    const category = detectCategory(req.file.mimetype, req.file.originalname);

    const created = await SharedFile.create({
      orgId: req.user.orgId,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype || 'application/octet-stream',
      size: req.file.size,
      category,
      description: String(description || '').trim(),
      uploadedBy: req.user._id,
      projectId: projectId && projectId !== 'none' ? projectId : null,
      taskId: taskId && taskId !== 'none' ? taskId : null,
      discussionId: discussionId || null,
      channelId: channelId || null
    });

    const populated = await SharedFile.findById(created._id)
      .populate('uploadedBy', 'firstName lastName email role')
      .populate('projectId', 'name color')
      .populate('taskId', 'title');

    await recordActivity({
      orgId: req.user.orgId,
      actorId: req.user._id,
      type: 'file_uploaded',
      action: 'uploaded & shared file',
      targetTitle: created.originalName,
      snippet: created.description || `${(created.size / 1024).toFixed(1)} KB`,
      projectId: created.projectId,
      taskId: created.taskId,
      discussionId: created.discussionId,
      fileId: created._id
    });

    const formatted = formatFileDoc(populated);
    broadcastToOrg(req.user.orgId, { type: 'file:uploaded', file: formatted });
    res.status(201).json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const streamFileContent = async (req, res) => {
  try {
    const file = await SharedFile.findOne({ _id: req.params.id, orgId: req.user.orgId });
    if (!file) return res.status(404).json({ message: 'File not found' });
    const fullPath = path.join(UPLOAD_DIR, file.storedName);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ message: 'Stored file missing on disk' });
    res.setHeader('Content-Type', file.mimeType);
    res.sendFile(fullPath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const downloadFile = async (req, res) => {
  try {
    const file = await SharedFile.findOne({ _id: req.params.id, orgId: req.user.orgId });
    if (!file) return res.status(404).json({ message: 'File not found' });
    const fullPath = path.join(UPLOAD_DIR, file.storedName);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ message: 'Stored file missing on disk' });
    res.download(fullPath, file.originalName);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteFile = async (req, res) => {
  try {
    const file = await SharedFile.findOne({ _id: req.params.id, orgId: req.user.orgId });
    if (!file) return res.status(404).json({ message: 'File not found' });

    const isPMorAdmin = ['admin', 'project_manager', 'super_admin'].includes(req.user.role);
    if (file.uploadedBy.toString() !== req.user._id.toString() && !isPMorAdmin) {
      return res.status(403).json({ message: 'Only the uploader or Admin/PM can delete this file' });
    }

    await SharedFile.deleteOne({ _id: file._id });
    const fullPath = path.join(UPLOAD_DIR, file.storedName);
    if (fs.existsSync(fullPath)) {
      try { fs.unlinkSync(fullPath); } catch {}
    }

    broadcastToOrg(req.user.orgId, { type: 'file:deleted', fileId: file._id.toString() });
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadMiddleware,
  formatFileDoc,
  getFiles,
  uploadFile,
  streamFileContent,
  downloadFile,
  deleteFile
};
