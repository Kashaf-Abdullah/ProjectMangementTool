require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { attachWebSocketServer } = require('./utils/realtime');

const authRoutes = require('./routes/auth');
const orgRoutes = require('./routes/org');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const fileRoutes = require('./routes/files');
const discussionRoutes = require('./routes/discussions');
const chatRoutes = require('./routes/chat');
const activityRoutes = require('./routes/activities');
const billingRoutes = require('./routes/billing');
const webhookRoutes = require('./routes/webhooks');
const searchRoutes = require('./routes/search');

const app = express();
const httpServer = http.createServer(app);
attachWebSocketServer(httpServer);

connectDB();

app.use(cors({
  origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : true,
  credentials: true
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/search', searchRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  httpServer.listen(PORT, () => {
    console.log(`Server & WebSocket running on port ${PORT}`);
  });
}

module.exports = app;
