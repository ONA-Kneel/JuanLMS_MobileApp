import express from 'express';
import GroupChat from '../models/GroupChat.js';
import GroupMessage from '../models/GroupMessage.js';
import User from '../models/User.js';

const router = express.Router();

// Create a new group chat
router.post('/', async (req, res) => {
  try {
    const { name, description, createdBy, participants } = req.body;
    
    if (!name || !createdBy || !participants || participants.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (participants.length > 50) {
      return res.status(400).json({ error: 'Group cannot have more than 50 participants' });
    }

    // Ensure creator is included in participants
    const allParticipants = participants.includes(createdBy) 
      ? participants 
      : [...participants, createdBy];

    const newGroup = new GroupChat({
      name,
      description: description || '',
      createdBy,
      participants: allParticipants,
      admins: [createdBy] // Creator is automatically an admin
    });

    await newGroup.save();

    // Return the created group with all fields
    res.status(201).json({
      _id: newGroup._id,
      name: newGroup.name,
      description: newGroup.description,
      createdBy: newGroup.createdBy,
      participants: newGroup.participants,
      admins: newGroup.admins,
      isActive: newGroup.isActive,
      maxParticipants: newGroup.maxParticipants,
      joinCode: newGroup.joinCode,
      createdAt: newGroup.createdAt,
      updatedAt: newGroup.updatedAt
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Get all groups for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const groups = await GroupChat.find({ isActive: true, participants: userId });
    
    res.json(groups);
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Join a group using group ID
router.post('/:groupId/join', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const group = await GroupChat.findById(groupId);
    if (!group || !group.isActive) {
      return res.status(404).json({ error: 'Group not found or inactive' });
    }

    if (group.participants.includes(userId)) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    if (group.participants.length >= group.maxParticipants) {
      return res.status(400).json({ error: 'Group is at maximum capacity' });
    }

    const success = group.addParticipant(userId);
    if (!success) {
      return res.status(400).json({ error: 'Failed to add user to group' });
    }

    await group.save();
    res.json(group);
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ error: 'Failed to join group' });
  }
});

// Join a group using join code
router.post('/join/:joinCode', async (req, res) => {
  try {
    const { joinCode } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const group = await GroupChat.findOne({ joinCode, isActive: true });
    if (!group) {
      return res.status(404).json({ error: 'Group not found or inactive' });
    }

    if (group.participants.includes(userId)) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    if (group.participants.length >= group.maxParticipants) {
      return res.status(400).json({ error: 'Group is at maximum capacity' });
    }

    const success = group.addParticipant(userId);
    if (!success) {
      return res.status(400).json({ error: 'Failed to add user to group' });
    }

    await group.save();
    res.json(group);
  } catch (error) {
    console.error('Error joining group by code:', error);
    res.status(500).json({ error: 'Failed to join group' });
  }
});

// Leave a group
router.post('/:groupId/leave', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const group = await GroupChat.findById(groupId);
    if (!group || !group.isActive) {
      return res.status(404).json({ error: 'Group not found or inactive' });
    }

    if (group.createdBy === userId) {
      return res.status(400).json({ error: 'Group creator cannot leave the group' });
    }

    if (!group.participants.includes(userId)) {
      return res.status(400).json({ error: 'User is not a member of this group' });
    }

    const success = group.removeParticipant(userId);
    if (!success) {
      return res.status(400).json({ error: 'Failed to remove user from group' });
    }

    await group.save();
    res.json({ message: 'Successfully left the group' });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({ error: 'Failed to leave group' });
  }
});

// Remove a member from group (admin only)
router.post('/:groupId/remove-member', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, memberId } = req.body;

    if (!userId || !memberId) {
      return res.status(400).json({ error: 'User ID and member ID are required' });
    }

    const group = await GroupChat.findById(groupId);
    if (!group || !group.isActive) {
      return res.status(404).json({ error: 'Group not found or inactive' });
    }

    if (!group.isAdmin(userId)) {
      return res.status(403).json({ error: 'Only admins can remove members' });
    }

    if (memberId === group.createdBy) {
      return res.status(400).json({ error: 'Cannot remove group creator' });
    }

    if (!group.participants.includes(memberId)) {
      return res.status(400).json({ error: 'User is not a member of this group' });
    }

    const success = group.removeParticipant(memberId);
    if (!success) {
      return res.status(400).json({ error: 'Failed to remove member from group' });
    }

    await group.save();
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Get group by join code
router.get('/join/:joinCode', async (req, res) => {
  try {
    const { joinCode } = req.params;
    const group = await GroupChat.findOne({ joinCode, isActive: true });
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found or inactive' });
    }

    res.json({
      _id: group._id,
      name: group.name,
      description: group.description,
      participants: group.participants.length,
      maxParticipants: group.maxParticipants
    });
  } catch (error) {
    console.error('Error finding group by join code:', error);
    res.status(500).json({ error: 'Failed to find group' });
  }
});

// Get all groups (admin only)
router.get('/', async (req, res) => {
  try {
    const groups = await GroupChat.find({ isActive: true });
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Get group messages
router.get('/:groupId/messages', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if user is a member of the group
    const group = await GroupChat.findById(groupId);
    if (!group || !group.isActive || !group.participants.includes(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await GroupMessage.find({ groupId })
      .sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching group messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message to group
router.post('/:groupId/messages', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { senderId, message, fileUrl } = req.body;

    if (!senderId || !message) {
      return res.status(400).json({ error: 'Sender ID and message are required' });
    }

    // Check if user is a member of the group
    const group = await GroupChat.findById(groupId);
    if (!group || !group.isActive || !group.participants.includes(senderId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get sender name
    const sender = await User.findById(senderId);
    const senderName = sender ? `${sender.firstname} ${sender.lastname}` : 'Unknown';

    const newMessage = new GroupMessage({
      senderId,
      groupId,
      message,
      fileUrl,
      senderName
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending group message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router; 