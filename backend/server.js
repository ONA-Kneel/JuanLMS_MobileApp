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
import quizRoutes from './routes/quizRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import groupChatsRouter from './routes/groupChats.js';
import http from 'http';
import { Server } from 'socket.io';
import { MongoClient } from 'mongodb';
import ticketsRouter from "./routes/tickets.js";
import lessonRoutes from './routes/lessonRoutes.js';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(users);
app.use('/api/messages', messagesRouter);
app.use('/api/announcements', announcementRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/tickets', ticketsRouter);
app.use('/api', classRoutes);
app.use('/api/lessons', lessonRoutes);

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
