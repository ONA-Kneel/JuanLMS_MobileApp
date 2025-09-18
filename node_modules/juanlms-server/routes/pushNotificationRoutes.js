const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Notification = require('../models/Notification');
const {
  sendNotificationToDevice,
  sendNotificationToMultipleDevices,
  sendNotificationToTopic,
  sendChatMessageNotification,
  sendAnnouncementNotification,
  sendAssignmentNotification,
  sendQuizNotification
} = require('../services/firebaseAdminService');

// Store FCM tokens for users
const userTokens = new Map();

// Register FCM token for user
router.post('/register-token', async (req, res) => {
  try {
    const { userId, fcmToken, platform, appVersion } = req.body;

    if (!userId || !fcmToken) {
      return res.status(400).json({ error: 'User ID and FCM token are required' });
    }

    // Store token in memory (in production, store in database)
    userTokens.set(userId, {
      fcmToken,
      platform,
      appVersion,
      registeredAt: new Date()
    });

    console.log(`FCM token registered for user ${userId}:`, fcmToken);

    res.json({ 
      success: true, 
      message: 'FCM token registered successfully',
      token: fcmToken
    });
  } catch (error) {
    console.error('Error registering FCM token:', error);
    res.status(500).json({ error: 'Failed to register FCM token' });
  }
});

// Send notification to specific user
router.post('/send-to-user', async (req, res) => {
  try {
    const { userId, notification } = req.body;

    if (!userId || !notification) {
      return res.status(400).json({ error: 'User ID and notification are required' });
    }

    const userTokenData = userTokens.get(userId);
    if (!userTokenData) {
      return res.status(404).json({ error: 'User FCM token not found' });
    }

    const result = await sendNotificationToDevice(userTokenData.fcmToken, notification);
    
    res.json({ 
      success: true, 
      message: 'Notification sent successfully',
      result 
    });
  } catch (error) {
    console.error('Error sending notification to user:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Send notification to multiple users
router.post('/send-to-users', async (req, res) => {
  try {
    const { userIds, notification } = req.body;

    if (!userIds || !Array.isArray(userIds) || !notification) {
      return res.status(400).json({ error: 'User IDs array and notification are required' });
    }

    const fcmTokens = [];
    const validUserIds = [];

    for (const userId of userIds) {
      const userTokenData = userTokens.get(userId);
      if (userTokenData) {
        fcmTokens.push(userTokenData.fcmToken);
        validUserIds.push(userId);
      }
    }

    if (fcmTokens.length === 0) {
      return res.status(404).json({ error: 'No valid FCM tokens found for the provided users' });
    }

    const result = await sendNotificationToMultipleDevices(fcmTokens, notification);
    
    res.json({ 
      success: true, 
      message: `Notification sent to ${fcmTokens.length} users`,
      result,
      validUserIds
    });
  } catch (error) {
    console.error('Error sending notification to users:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Send notification to topic
router.post('/send-to-topic', async (req, res) => {
  try {
    const { topic, notification } = req.body;

    if (!topic || !notification) {
      return res.status(400).json({ error: 'Topic and notification are required' });
    }

    const result = await sendNotificationToTopic(topic, notification);
    
    res.json({ 
      success: true, 
      message: 'Notification sent to topic successfully',
      result 
    });
  } catch (error) {
    console.error('Error sending notification to topic:', error);
    res.status(500).json({ error: 'Failed to send notification to topic' });
  }
});

// Send chat message notification
router.post('/send-chat-message', async (req, res) => {
  try {
    const { recipientId, senderName, message, isGroup, groupName } = req.body;

    if (!recipientId || !senderName || !message) {
      return res.status(400).json({ error: 'Recipient ID, sender name, and message are required' });
    }

    const recipientTokenData = userTokens.get(recipientId);
    if (!recipientTokenData) {
      return res.status(404).json({ error: 'Recipient FCM token not found' });
    }

    const result = await sendChatMessageNotification(
      recipientTokenData.fcmToken,
      senderName,
      message,
      isGroup,
      groupName
    );
    
    res.json({ 
      success: true, 
      message: 'Chat message notification sent successfully',
      result 
    });
  } catch (error) {
    console.error('Error sending chat message notification:', error);
    res.status(500).json({ error: 'Failed to send chat message notification' });
  }
});

// Send announcement notification
router.post('/send-announcement', async (req, res) => {
  try {
    const { recipientIds, announcement } = req.body;

    if (!recipientIds || !Array.isArray(recipientIds) || !announcement) {
      return res.status(400).json({ error: 'Recipient IDs array and announcement are required' });
    }

    const fcmTokens = [];
    for (const recipientId of recipientIds) {
      const userTokenData = userTokens.get(recipientId);
      if (userTokenData) {
        fcmTokens.push(userTokenData.fcmToken);
      }
    }

    if (fcmTokens.length === 0) {
      return res.status(404).json({ error: 'No valid FCM tokens found for the provided recipients' });
    }

    const result = await sendAnnouncementNotification(fcmTokens, announcement);
    
    res.json({ 
      success: true, 
      message: `Announcement notification sent to ${fcmTokens.length} users`,
      result 
    });
  } catch (error) {
    console.error('Error sending announcement notification:', error);
    res.status(500).json({ error: 'Failed to send announcement notification' });
  }
});

// Send assignment notification
router.post('/send-assignment', async (req, res) => {
  try {
    const { recipientIds, assignment } = req.body;

    if (!recipientIds || !Array.isArray(recipientIds) || !assignment) {
      return res.status(400).json({ error: 'Recipient IDs array and assignment are required' });
    }

    const fcmTokens = [];
    for (const recipientId of recipientIds) {
      const userTokenData = userTokens.get(recipientId);
      if (userTokenData) {
        fcmTokens.push(userTokenData.fcmToken);
      }
    }

    if (fcmTokens.length === 0) {
      return res.status(404).json({ error: 'No valid FCM tokens found for the provided recipients' });
    }

    const result = await sendAssignmentNotification(fcmTokens, assignment);
    
    res.json({ 
      success: true, 
      message: `Assignment notification sent to ${fcmTokens.length} users`,
      result 
    });
  } catch (error) {
    console.error('Error sending assignment notification:', error);
    res.status(500).json({ error: 'Failed to send assignment notification' });
  }
});

// Send quiz notification
router.post('/send-quiz', async (req, res) => {
  try {
    const { recipientIds, quiz } = req.body;

    if (!recipientIds || !Array.isArray(recipientIds) || !quiz) {
      return res.status(400).json({ error: 'Recipient IDs array and quiz are required' });
    }

    const fcmTokens = [];
    for (const recipientId of recipientIds) {
      const userTokenData = userTokens.get(recipientId);
      if (userTokenData) {
        fcmTokens.push(userTokenData.fcmToken);
      }
    }

    if (fcmTokens.length === 0) {
      return res.status(404).json({ error: 'No valid FCM tokens found for the provided recipients' });
    }

    const result = await sendQuizNotification(fcmTokens, quiz);
    
    res.json({ 
      success: true, 
      message: `Quiz notification sent to ${fcmTokens.length} users`,
      result 
    });
  } catch (error) {
    console.error('Error sending quiz notification:', error);
    res.status(500).json({ error: 'Failed to send quiz notification' });
  }
});

// Get user's FCM token status
router.get('/user-token/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userTokenData = userTokens.get(userId);

    if (!userTokenData) {
      return res.status(404).json({ error: 'User FCM token not found' });
    }

    res.json({
      success: true,
      userId,
      hasToken: true,
      platform: userTokenData.platform,
      appVersion: userTokenData.appVersion,
      registeredAt: userTokenData.registeredAt
    });
  } catch (error) {
    console.error('Error getting user token status:', error);
    res.status(500).json({ error: 'Failed to get user token status' });
  }
});

// Get all registered tokens (for debugging)
router.get('/tokens', async (req, res) => {
  try {
    const tokens = Array.from(userTokens.entries()).map(([userId, data]) => ({
      userId,
      platform: data.platform,
      appVersion: data.appVersion,
      registeredAt: data.registeredAt,
      hasToken: !!data.fcmToken
    }));

    res.json({
      success: true,
      count: tokens.length,
      tokens
    });
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).json({ error: 'Failed to get tokens' });
  }
});

module.exports = router;
