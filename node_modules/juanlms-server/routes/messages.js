import express from 'express';
import Message from '../models/Message.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { senderId, receiverId, text, message } = req.body;
  
  // Handle both 'text' and 'message' fields for compatibility
  const messageContent = text || message;
  
  if (!messageContent) {
    return res.status(400).json({ error: 'Message content is required' });
  }
  
  const newMessage = new Message({ 
    senderId, 
    receiverId, 
    message: messageContent,
    timestamp: new Date() // Explicitly set timestamp
  });
  
  console.log('Creating new message:', {
    senderId,
    receiverId,
    message: messageContent,
    timestamp: newMessage.timestamp,
    timestampType: typeof newMessage.timestamp
  });
  
  await newMessage.save();
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

  console.log(`Fetching recent chats for user ${userId}`);
  console.log(`Found ${messages.length} messages`);
  
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

  console.log(`Sending ${recentChats.length} recent chats`);
  recentChats.forEach(chat => {
    console.log(`Chat with ${chat.partnerId}:`, {
      timestamp: chat.lastMessage.timestamp,
      timestampType: typeof chat.lastMessage.timestamp,
      message: chat.lastMessage.message
    });
  });

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