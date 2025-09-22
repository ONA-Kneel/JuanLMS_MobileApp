import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Stream.io configuration
const STREAM_API_KEY = process.env.STREAM_API_KEY || 'mmhfdzb5evj2';
const STREAM_SECRET = process.env.STREAM_SECRET || 'your-stream-secret';
const STREAM_BASE_URL = process.env.STREAM_BASE_URL || 'https://video.stream.io';

// Mock meetings data (replace with actual database integration)
let meetings = [
  {
    _id: '1',
    classID: 'class1',
    title: 'Sample Meeting 1',
    description: 'This is a sample meeting',
    scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    duration: 60,
    createdBy: 'user1',
    participants: ['user1', 'user2'],
    meetingType: 'scheduled',
    status: 'scheduled',
    createdAt: new Date(),
  },
  {
    _id: '2',
    classID: 'class2',
    title: 'Sample Meeting 2',
    description: 'Another sample meeting',
    scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
    duration: 90,
    createdBy: 'user2',
    participants: ['user2', 'user3'],
    meetingType: 'instant',
    status: 'scheduled',
    createdAt: new Date(),
  }
];

// Helper function to generate Stream.io token
const generateStreamToken = (userId, userName) => {
  const payload = {
    user_id: userId,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
    iat: Math.floor(Date.now() / 1000),
  };
  
  return jwt.sign(payload, STREAM_SECRET);
};

// Helper function to build room name from meeting
const buildRoomName = (meeting) => {
  const base = (meeting?.title || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const suffix = String(meeting._id).slice(-6);
  return base ? `${base}-${suffix}` : String(meeting._id);
};

// GET /api/meetings - Get all meetings
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('[MEETINGS] Fetching all meetings for user:', req.user._id);
    res.json(meetings);
  } catch (err) {
    console.error('Error fetching meetings:', err);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// GET /api/meetings/class/:classID - Get all meetings for a class
router.get('/class/:classID', authenticateToken, async (req, res) => {
  try {
    const { classID } = req.params;
    console.log('[MEETINGS] Fetching meetings for class:', classID);
    
    const classMeetings = meetings.filter(meeting => meeting.classID === classID);
    res.json(classMeetings);
  } catch (err) {
    console.error('Error fetching class meetings:', err);
    res.status(500).json({ error: 'Failed to fetch class meetings' });
  }
});

// POST /api/meetings - Create a new meeting
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { classID, title, description, scheduledTime, duration, meetingType } = req.body;
    
    if (!classID || !title || !meetingType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newMeeting = {
      _id: String(meetings.length + 1),
      classID,
      title,
      description: description || '',
      scheduledTime: scheduledTime ? new Date(scheduledTime) : new Date(),
      duration: duration || null,
      createdBy: req.user._id,
      participants: [req.user._id],
      meetingType,
      status: 'scheduled',
      createdAt: new Date(),
    };

    meetings.push(newMeeting);
    
    console.log('[MEETINGS] Created new meeting:', newMeeting._id);
    res.status(201).json(newMeeting);
  } catch (err) {
    console.error('Error creating meeting:', err);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// DELETE /api/meetings/:meetingID - Delete a meeting
router.delete('/:meetingID', authenticateToken, async (req, res) => {
  try {
    const { meetingID } = req.params;
    console.log('[MEETINGS] Deleting meeting:', meetingID);
    
    const meetingIndex = meetings.findIndex(meeting => meeting._id === meetingID);
    
    if (meetingIndex === -1) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Check if user is the creator
    if (meetings[meetingIndex].createdBy !== req.user._id) {
      return res.status(403).json({ error: 'Not authorized to delete this meeting' });
    }

    meetings.splice(meetingIndex, 1);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting meeting:', err);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

// POST /api/meetings/:meetingID/join - Join a meeting
router.post('/:meetingID/join', authenticateToken, async (req, res) => {
  try {
    const { meetingID } = req.params;
    console.log('[MEETINGS] Joining meeting:', meetingID);
    
    const meeting = meetings.find(m => m._id === meetingID);
    
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const roomName = buildRoomName(meeting);
    const streamToken = generateStreamToken(req.user._id, req.user.name || 'User');
    
    // Generate Stream.io room URL
    const roomUrl = `${STREAM_BASE_URL}/call/${roomName}`;
    
    // Add user to participants if not already present
    if (!meeting.participants.includes(req.user._id)) {
      meeting.participants.push(req.user._id);
    }

    // Update meeting status to ongoing if it's an instant meeting
    if (meeting.meetingType === 'instant' && meeting.status === 'scheduled') {
      meeting.status = 'ongoing';
    }

    res.json({
      roomUrl,
      streamToken,
      callId: roomName,
      meetingId: meetingID,
      credentials: {
        apiKey: STREAM_API_KEY,
        token: streamToken,
        userId: req.user._id,
        callId: roomName,
      }
    });
  } catch (err) {
    console.error('Error joining meeting:', err);
    res.status(500).json({ error: 'Failed to join meeting' });
  }
});

// POST /api/meetings/:meetingID/leave - Leave a meeting
router.post('/:meetingID/leave', authenticateToken, async (req, res) => {
  try {
    const { meetingID } = req.params;
    console.log('[MEETINGS] Leaving meeting:', meetingID);
    
    const meeting = meetings.find(m => m._id === meetingID);
    
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Remove user from participants
    meeting.participants = meeting.participants.filter(id => id !== req.user._id);
    
    // If no participants left and it's an instant meeting, mark as ended
    if (meeting.participants.length === 0 && meeting.meetingType === 'instant') {
      meeting.status = 'ended';
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error leaving meeting:', err);
    res.status(500).json({ error: 'Failed to leave meeting' });
  }
});

// POST /api/meetings/:meetingID/end - End meeting for all participants
router.post('/:meetingID/end', authenticateToken, async (req, res) => {
  try {
    const { meetingID } = req.params;
    console.log('[MEETINGS] Ending meeting for all:', meetingID);
    
    const meeting = meetings.find(m => m._id === meetingID);
    
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Check if user is the creator
    if (meeting.createdBy !== req.user._id) {
      return res.status(403).json({ error: 'Not authorized to end this meeting' });
    }

    meeting.status = 'ended';
    meeting.participants = [];

    res.json({ success: true });
  } catch (err) {
    console.error('Error ending meeting:', err);
    res.status(500).json({ error: 'Failed to end meeting' });
  }
});

// GET /api/meetings/:meetingID/status - Get meeting status
router.get('/:meetingID/status', authenticateToken, async (req, res) => {
  try {
    const { meetingID } = req.params;
    
    const meeting = meetings.find(m => m._id === meetingID);
    
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json({
      meetingId: meetingID,
      status: meeting.status,
      participants: meeting.participants,
      participantCount: meeting.participants.length,
      isCurrentlyActive: meeting.status === 'ongoing',
    });
  } catch (err) {
    console.error('Error getting meeting status:', err);
    res.status(500).json({ error: 'Failed to get meeting status' });
  }
});

// POST /api/meetings/:meetingID/start-recording - Start recording
router.post('/:meetingID/start-recording', authenticateToken, async (req, res) => {
  try {
    const { meetingID } = req.params;
    
    const meeting = meetings.find(m => m._id === meetingID);
    
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Check if user is the creator
    if (meeting.createdBy !== req.user._id) {
      return res.status(403).json({ error: 'Not authorized to start recording' });
    }

    // In a real implementation, you would start recording via Stream.io API
    meeting.isRecording = true;
    meeting.recordingStartedAt = new Date();

    res.json({ success: true, recordingId: `rec_${meetingID}_${Date.now()}` });
  } catch (err) {
    console.error('Error starting recording:', err);
    res.status(500).json({ error: 'Failed to start recording' });
  }
});

// POST /api/meetings/:meetingID/stop-recording - Stop recording
router.post('/:meetingID/stop-recording', authenticateToken, async (req, res) => {
  try {
    const { meetingID } = req.params;
    
    const meeting = meetings.find(m => m._id === meetingID);
    
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Check if user is the creator
    if (meeting.createdBy !== req.user._id) {
      return res.status(403).json({ error: 'Not authorized to stop recording' });
    }

    // In a real implementation, you would stop recording via Stream.io API
    meeting.isRecording = false;
    meeting.recordingStoppedAt = new Date();

    res.json({ success: true });
  } catch (err) {
    console.error('Error stopping recording:', err);
    res.status(500).json({ error: 'Failed to stop recording' });
  }
});

export default router;
