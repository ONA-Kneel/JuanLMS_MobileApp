import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });

import mongoose from 'mongoose';
import connect from "./connect.cjs";
import express from "express";
import cors from "cors";
import users from "./routes/userRoutes.js";
import messagesRouter from './routes/messages.js';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(users);
app.use('/api/messages', messagesRouter);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('joinChat', (chatId) => socket.join(chatId));
  socket.on('sendMessage', (msg) => io.to(msg.chatId).emit('receiveMessage', msg));
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
