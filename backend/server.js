import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });

import mongoose from 'mongoose';
import connect from "./connect.cjs";
import express from "express";
import cors from "cors";
import users from "./routes/userRoutes.js";
import messagesRouter from './routes/messages.js';
import classRoutes from './routes/classRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import generalAnnouncementRoutes from './routes/generalAnnouncementRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import groupChatsRouter from './routes/groupChats.js';
import adminRoutes from './routes/adminRoutes.js';
import http from 'http';
import { Server } from 'socket.io';
import { MongoClient } from 'mongodb';
import ticketsRouter from "./routes/tickets.js";
import lessonRoutes from './routes/lessonRoutes.js';
import gradeRoutes from './routes/gradeRoutes.js';
import auditRoutes from './routes/auditRoutes.js';


const app = express();
const PORT = 5000;

// Configure CORS (allow all local/dev origins). In production, scope this down as needed.
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.options('*', cors());
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`=== SERVER REQUEST DEBUG ===`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.originalUrl}`);
  console.log(`Path: ${req.path}`);
  console.log(`Base URL: ${req.baseUrl}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`=== END SERVER REQUEST DEBUG ===`);
  next();
});

// Simple test route at root level
app.get('/', (req, res) => {
  res.json({ message: 'JuanLMS Backend Server is running!', timestamp: new Date().toISOString() });
});

app.use('/api', users);
app.use('/api/messages', messagesRouter);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/general-announcements', generalAnnouncementRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/tickets', ticketsRouter);
app.use('/api', classRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api', adminRoutes);
app.use('/api', auditRoutes);
app.use('/api/group-chats', groupChatsRouter);
app.use('/uploads', express.static('uploads'));

// Mobile app compatibility routes (direct routes without /api prefix)
app.use('/quizzes', quizRoutes);
app.use('/assignments', assignmentRoutes);
app.use('/group-chats', groupChatsRouter);

// Group messages compatibility route (redirects to group-chats)
app.use('/group-messages', groupChatsRouter);

// Test route to verify server is working
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date().toISOString() });
});

// Test assignment routes specifically
app.get('/test-assignments', (req, res) => {
  res.json({ 
    message: 'Assignment routes are accessible!', 
    timestamp: new Date().toISOString(),
    availableRoutes: [
      '/assignments',
      '/assignments/:id',
      '/assignments/:id/replace-file',
      '/assignments/:id/submit',
      '/assignments/:id/submissions'
    ]
  });
});

// Academic year route alias for mobile app compatibility
app.get('/api/academic-year/active', async (req, res) => {
  try {
    // Return hardcoded academic year data for mobile app compatibility
    res.json({
      academicYear: '2025-2026',
      currentTerm: 'First Semester',
      startDate: '2025-06-01',
      endDate: '2026-03-31'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// School Year endpoints for mobile app compatibility
app.get('/api/schoolyears/active', async (req, res) => {
  try {
    // Return the current active school year (2025-2026)
    res.json({
      _id: "current",
      schoolYearStart: "2025",
      schoolYearEnd: "2026",
      status: "active",
      startDate: "2025-06-01",
      endDate: "2026-03-31"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/schoolyears', async (req, res) => {
  try {
    // Return available school years including current and future ones
    const schoolYears = [
      {
        _id: "current",
        schoolYearStart: "2025",
        schoolYearEnd: "2026",
        status: "active",
        startDate: "2025-06-01",
        endDate: "2026-03-31"
      },
      {
        _id: "future",
        schoolYearStart: "2026",
        schoolYearEnd: "2027",
        status: "inactive",
        startDate: "2026-06-01",
        endDate: "2027-03-31"
      }
    ];
    
    res.json(schoolYears);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/terms/schoolyear/:schoolYear', async (req, res) => {
  try {
    const { schoolYear } = req.params;
    
    // Return terms for the specified school year
    const terms = [
      {
        _id: "term1",
        termName: "Term 1",
        schoolYear: schoolYear,
        status: "active",
        startDate: "2025-06-01",
        endDate: "2025-10-31"
      },
      {
        _id: "term2",
        termName: "Term 2",
        schoolYear: schoolYear,
        status: "inactive",
        startDate: "2025-11-01",
        endDate: "2026-03-31"
      }
    ];
    
    res.json(terms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test route to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Test announcement route
app.get('/api/test-announcements', async (req, res) => {
  try {
    res.json({ 
      message: 'Announcement route is accessible!', 
      timestamp: new Date().toISOString(),
      routes: ['/api/announcements', '/api/general-announcements']
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Events API endpoint
app.get('/api/events', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const events = await db.collection('Events').find().toArray();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Catch-all route for unmatched API routes
app.use('/api/*', (req, res) => {
  console.log(`404 - API route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'API route not found', 
    method: req.method, 
    url: req.originalUrl,
    availableRoutes: [
      '/api/test',
      '/api/test-announcements',
      '/api/announcements',
      '/api/general-announcements',
      '/api/academic-year/active'
    ]
  });
});

// Catch-all route for unmatched routes
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found', 
    method: req.method, 
    url: req.originalUrl 
  });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');
  
  // Individual chat events
  socket.on('joinChat', (chatId) => socket.join(chatId));
  socket.on('sendMessage', (msg) => io.to(msg.chatId).emit('receiveMessage', msg));
  
  // Group chat events
  socket.on('joinGroup', (data) => {
    socket.join(`group-${data.groupId}`);
    console.log(`User ${data.userId} joined group ${data.groupId}`);
  });
  
  socket.on('leaveGroup', (data) => {
    socket.leave(`group-${data.groupId}`);
    console.log(`User ${data.userId} left group ${data.groupId}`);
  });
  
  socket.on('sendGroupMessage', (msg) => {
    io.to(`group-${msg.groupId}`).emit('receiveGroupMessage', msg);
  });
  
  socket.on('disconnect', () => console.log('A user disconnected'));
});

mongoose.connect(process.env.ATLAS_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Mongoose connected to MongoDB!');
  await connect.connectToServer();
  server.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
  });
})
.catch(err => {
  console.error('Mongoose connection error:', err);
  process.exit(1);
});
