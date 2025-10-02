import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { sendNotificationToUser } from '../services/fcmService.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import cloudinary from '../utils/cloudinary.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Accept both JSON and multipart. For multipart, expect field name 'file'
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    let { message } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ error: 'senderId and receiverId are required' });
    }

    // Allow file-only messages: if no text but has file, set message placeholder
    if ((!message || String(message).trim() === '') && req.file) {
      message = '';
    }

    // Process optional file
    let fileUrl = null;
    if (req.file) {
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        const uploadDir = 'uploads/chat-attachments';
        fs.mkdirSync(uploadDir, { recursive: true });
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(req.file.originalname || '') || '';
        const filename = `dm-${unique}${ext}`;
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, req.file.buffer);
        fileUrl = `/uploads/chat-attachments/${filename}`;
      } else {
        const result = await new Promise((resolve, reject) => {
          const opts = { folder: 'juanlms/chat-attachments', resource_type: 'auto' };
          const stream = cloudinary.uploader.upload_stream(opts, (err, r) => {
            if (err) return reject(err);
            resolve(r);
          });
          stream.end(req.file.buffer);
        });
        fileUrl = result.secure_url;
      }
    }

    const newMessage = new Message({ senderId, receiverId, message: message || '', fileUrl });
    await newMessage.save();

  // Fire-and-forget FCM notification to receiver
  try {
    const sender = await User.findById(senderId, 'firstname lastname');
    const senderName = sender ? `${sender.firstname || ''} ${sender.lastname || ''}`.trim() || 'New message' : 'New message';
    const title = senderName;
    const body = message?.slice(0, 120) || 'You have a new message';
    sendNotificationToUser(receiverId, { title, body }, {
      screen: 'UnifiedChat',
      params: JSON.stringify({ chatId: senderId, threadId: senderId }),
      type: 'chat_direct'
    });
  } catch (e) {
    console.log('[DM] FCM send error:', e);
  }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('[DM] send error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.put('/read/:userId/:chatWithId', async (req, res) => {
  const { userId, chatWithId } = req.params;
  await Message.updateMany(
    { senderId: chatWithId, receiverId: userId, read: false },
    { $set: { read: true } }
  );
  res.json({ success: true });
});

router.get('/recent/:userId', async (req, res) => {
  const { userId } = req.params;
  
  const messages = await Message.find({
    $or: [
      { senderId: userId },
      { receiverId: userId }
    ]
  }).sort({ timestamp: -1 });

  const chatMap = new Map();
  
  messages.forEach(msg => {
    const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    if (!chatMap.has(partnerId)) {
      chatMap.set(partnerId, {
        lastMessage: msg,
        unreadCount: 0
      });
    }
    
    if (msg.receiverId === userId && !msg.read) {
      const chat = chatMap.get(partnerId);
      chat.unreadCount++;
      chatMap.set(partnerId, chat);
    }
  });

  const recentChats = Array.from(chatMap.entries()).map(([partnerId, data]) => ({
    partnerId,
    lastMessage: data.lastMessage,
    unreadCount: data.unreadCount
  })).sort((a, b) => 
    new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
  );

  res.json(recentChats);
});

router.get('/:userId/:chatWithId', async (req, res) => {
  const { userId, chatWithId } = req.params;
  const messages = await Message.find({
    $or: [
      { senderId: userId, receiverId: chatWithId },
      { senderId: chatWithId, receiverId: userId },
    ]
  }).sort({ timestamp: 1 });

  res.json(messages);
});

export default router;