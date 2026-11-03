const { WebSocketServer, WebSocket } = require('ws');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const wsClients = new Set();

function broadcastToOrg(orgId, payload) {
  if (!orgId) return;
  const orgKey = orgId.toString();
  const serialized = JSON.stringify(payload);
  for (const client of wsClients) {
    if (client.orgId === orgKey && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(serialized);
    }
  }
}

function sendToUser(userId, payload) {
  if (!userId) return;
  const userKey = userId.toString();
  const serialized = JSON.stringify(payload);
  for (const client of wsClients) {
    if (client.userId === userKey && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(serialized);
    }
  }
}

function getOnlineUserIds(orgId) {
  if (!orgId) return [];
  const orgKey = orgId.toString();
  const set = new Set();
  for (const client of wsClients) {
    if (client.orgId === orgKey && client.ws.readyState === WebSocket.OPEN) {
      set.add(client.userId);
    }
  }
  return Array.from(set);
}

function attachWebSocketServer(httpServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', async (req, socket, head) => {
    try {
      const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost:5000'}`);
      if (parsedUrl.pathname !== '/ws') {
        socket.destroy();
        return;
      }
      const token = parsedUrl.searchParams.get('token');
      if (!token) {
        socket.destroy();
        return;
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pm_tool_fallback_secret_key');
      const user = await User.findById(decoded.id).select('_id firstName lastName orgId isActive');
      if (!user || !user.isActive || !user.orgId) {
        socket.destroy();
        return;
      }
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, user);
      });
    } catch {
      socket.destroy();
    }
  });

  wss.on('connection', (ws, user) => {
    const clientEntry = {
      ws,
      userId: user._id.toString(),
      orgId: user.orgId.toString()
    };
    wsClients.add(clientEntry);

    broadcastToOrg(clientEntry.orgId, {
      type: 'presence:sync',
      onlineUserIds: getOnlineUserIds(clientEntry.orgId)
    });

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(String(raw));
        if (msg?.type === 'chat:typing' && msg.channelId) {
          broadcastToOrg(clientEntry.orgId, {
            type: 'chat:typing',
            channelId: String(msg.channelId),
            userId: clientEntry.userId,
            userName: `${user.firstName} ${user.lastName}`.trim(),
            isTyping: Boolean(msg.isTyping)
          });
        }
      } catch {
        // Ignore invalid JSON frames
      }
    });

    ws.on('close', () => {
      wsClients.delete(clientEntry);
      broadcastToOrg(clientEntry.orgId, {
        type: 'presence:sync',
        onlineUserIds: getOnlineUserIds(clientEntry.orgId)
      });
    });
  });

  return wss;
}

module.exports = {
  attachWebSocketServer,
  broadcastToOrg,
  sendToUser,
  getOnlineUserIds
};
