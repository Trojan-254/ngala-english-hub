/**
 * Ngala English Hub - Server
 * 
 * This server handles user authentication, grammar quiz sessions, and real-time communication for the Ngala English Hub application. It uses Express for routing, Socket.io for real-time features, and SQLite for data storage.
 * 
 * Key features:
 * - User registration and login with secure password hashing
 * - Session management with automatic cleanup of expired sessions
 * - Grammar quiz endpoints for starting sessions, submitting answers, and tracking progress
 * - Real-time communication for classroom features using Socket.io
 * 
 * Written by SAMWUEL SIMIYU(EB01/PU/40792/21). STUDENT TEACHER ON TEACHING PRACTICE FROM PWANI UNIVERSITY.
 * 
 * To run:
 * 1. Install dependencies: npm install
 * 2. Start the server: node server.js
 * 3. Access the app at http://localhost:5000
 * 
 * Note: Ensure the database is initialized before starting the server. The server will automatically create necessary tables if they don't exist.
 */
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { getDb, initializeDatabase } = require('./database/database');
const cors = require('cors');
require('dotenv').config();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://ngala-english-hub.vercel.app', 
  'http://localhost:5173',
  'http://localhost:8080'
].filter(Boolean);


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'OPTIONS']
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  reconnectionAttempts: 5
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized....');
    
    const db = getDb();
    
    // Import routes
    const authRoutes = require('./routes/auth');
    const grammarRoutes = require('./routes/grammar');
    const comprehensionRoutes = require('./routes/comprehension');
    const teacherRoutes = require('./routes/teacher');
    const miscRoutes = require('./routes/misc');
    const contentRoutes = require('./routes/content');
    const pastPapersRoutes = require('./routes/pastpapers');
    const vocabularyRoutes = require('./routes/vocabulary');
    
    // Middle
    app.use(cors({
      origin: function(origin, callback) {
        // Allow requests with no origin 
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
          const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
          return callback(new Error(msg), false);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id']
    }));

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(path.join(__dirname, 'public')));
    
    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/grammar', grammarRoutes);
    app.use('/api/comprehension', comprehensionRoutes);
    app.use('/api/teacher', teacherRoutes);
    app.use('/api', miscRoutes);
    app.use('/api/content', contentRoutes);
    app.use('/api/pastpapers', pastPapersRoutes);
    app.use('/api/vocabulary', vocabularyRoutes);
    
    // Health check
    app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        message: 'Ngala English Hub is running',
        timestamp: new Date().toISOString(),
        database: process.env.TURSO_DATABASE_URL ? 'turso' : 'sqlite'
      });
    });
    
    // Socket.io
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
    
    app.set('io', io);
    
    server.listen(PORT, () => {
      console.log(`Ngala English Hub running on port ${PORT}`);
      console.log(`📍 Backend URL: http://localhost:${PORT}`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
