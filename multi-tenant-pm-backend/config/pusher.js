const Pusher = require('pusher');

const requiredSettings = [
  process.env.PUSHER_APP_ID,
  process.env.PUSHER_KEY,
  process.env.PUSHER_SECRET,
  process.env.PUSHER_CLUSTER
];

const isConfigured = requiredSettings.every(Boolean);

if (!isConfigured && requiredSettings.some(Boolean)) {
  console.warn('Pusher is partially configured; chat realtime will use WebSockets instead.');
}

const pusher = isConfigured
  ? new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true
    })
  : null;

module.exports = { pusher, isConfigured };
