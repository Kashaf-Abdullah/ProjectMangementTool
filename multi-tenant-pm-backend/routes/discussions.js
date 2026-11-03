const express = require('express');
const {
  getDiscussions,
  addDiscussionReply,
  updateDiscussion,
  deleteDiscussion
} = require('../controllers/discussionController');
const { protect } = require('../middleware/auth');
const tenant = require('../middleware/tenant');

const router = express.Router();
router.use(protect);
router.use(tenant);

router.get('/', getDiscussions);
router.post('/:id/replies', addDiscussionReply);
router.put('/:id', updateDiscussion);
router.delete('/:id', deleteDiscussion);

module.exports = router;
