const express = require('express');
const {
  getChannels,
  createChannel,
  openOrCreateDM,
  getChannelMessages,
  sendChannelMessage,
  deleteChatMessage
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const tenant = require('../middleware/tenant');

const router = express.Router();
router.use(protect);
router.use(tenant);

router.get('/channels', getChannels);
router.post('/channels', createChannel);
router.post('/dm', openOrCreateDM);
router.get('/channels/:channelId/messages', getChannelMessages);
router.post('/channels/:channelId/messages', sendChannelMessage);
router.delete('/messages/:id', deleteChatMessage);

module.exports = router;
