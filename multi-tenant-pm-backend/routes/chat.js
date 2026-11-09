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
const { authenticatePusherChannel } = require('../utils/realtime');

const router = express.Router();
router.use(protect);
router.use(tenant);

router.post('/pusher/auth', (req, res) => {
  const { socket_id: socketId, channel_name: channelName } = req.body;
  if (!socketId || !channelName) {
    return res.status(400).json({ message: 'Pusher socket and channel are required' });
  }

  try {
    return res.json(authenticatePusherChannel(socketId, channelName, req.user));
  } catch (error) {
    const status = error.message === 'Pusher is not configured' ? 503 : 403;
    return res.status(status).json({ message: error.message });
  }
});

router.get('/channels', getChannels);
router.post('/channels', createChannel);
router.post('/dm', openOrCreateDM);
router.get('/channels/:channelId/messages', getChannelMessages);
router.post('/channels/:channelId/messages', sendChannelMessage);
router.delete('/messages/:id', deleteChatMessage);

module.exports = router;
