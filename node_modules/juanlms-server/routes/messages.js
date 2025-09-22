import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { sendNotificationToUser } from '../services/fcmService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { senderId, receiverId, message } = req.body;
  const newMessage = new Message({ senderId, receiverId, message });
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