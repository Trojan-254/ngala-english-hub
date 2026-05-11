const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { getDb } = require('./database/database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  pingTimeout: 60000,
  pingInterval: 25000,
  reconnectionAttempts: 5
});

const PORT = 5000;

// Initialize database
const db = getDb();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Basic health check route — confirms server is running
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Ngala English Hub is running',
    timestamp: new Date().toISOString()
  });
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_class', (classGroup) => {
    socket.join(classGroup);
    console.log(`${socket.id} joined room: ${classGroup}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to route handlers later
app.set('io', io);

// Session cleanup job — runs every hour
setInterval(() => {
  const stmt = db.prepare(`DELETE FROM sessions WHERE expires_at < datetime('now')`);
  const result = stmt.run();
  if (result.changes > 0) {
    console.log(`Cleaned up ${result.changes} expired session(s)`);
  }
}, 1000 * 60 * 60);

server.listen(PORT, () => {
  console.log(`Ngala English Hub running at http://localhost:${PORT}`);
  console.log(`LAN access: http://<this-machine-ip>:${PORT}`);
});