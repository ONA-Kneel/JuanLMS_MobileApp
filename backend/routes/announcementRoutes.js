import express from 'express';
import Announcement from '../models/Announcement.js';
// import { authenticateToken } from '../middleware/authMiddleware.js';
import { createAnnouncementNotification } from '../services/notificationService.js';
import mongoose from 'mongoose'; // Added for database connection check

const router = express.Router();

// Test route to verify routing is working
router.get('/test', (req, res) => {
  console.log('GET /api/announcements/test called');
  res.json({ 
    message: 'Announcement routes are working!', 
    timestamp: new Date().toISOString(),
    databaseStatus: mongoose.connection.readyState
  });
});

// Test route to create sample announcements
router.post('/test/create-sample-announcements', async (req, res) => {
  try {
    const sampleAnnouncements = [
      // Announcements for General Biology (C883)
      {
        classID: "C883",
        title: "Welcome to General Biology!",
        content: "Hello everyone! Welcome to General Biology. We're excited to explore the fascinating world of life sciences together.",
        createdBy: null, // Since auth is disabled
        createdAt: new Date()
      },
      {
        classID: "C883", 
        title: "Lab Safety Guidelines",
        content: "Please review the lab safety guidelines before our first laboratory session. Safety goggles and lab coats are required.",
        createdBy: null,
        createdAt: new Date()
      },
      {
        classID: "C883",
        title: "Chapter 1 Reading Assignment",
        content: "Please read Chapter 1: Introduction to Biology before our next class. Come prepared to discuss the basic principles of life.",
        createdBy: null,
        createdAt: new Date()
      },
      // Announcements for General Biology (C863)
      {
        classID: "C863",
        title: "Welcome to General Biology Class!",
        content: "Welcome to another section of General Biology. Looking forward to an exciting semester of discovery!",
        createdBy: null,
        createdAt: new Date()
      },
      {
        classID: "C863",
        title: "Midterm Exam Schedule",
        content: "The midterm exam is scheduled for next Friday. Please come prepared with your student ID and writing materials.",
        createdBy: null,
        createdAt: new Date()
      }
    ];

    // Check if announcements already exist for these classes
    const existingAnnouncements = await Announcement.find({ 
      classID: { $in: ["C883", "C863"] } 
    });
    
    if (existingAnnouncements.length > 0) {
      return res.json({
        success: true,
        message: 'Sample announcements already exist',
        count: existingAnnouncements.length,
        announcements: existingAnnouncements
      });
    }

    // Insert sample announcements
    const result = await Announcement.insertMany(sampleAnnouncements);
    
    res.json({
      success: true,
      message: 'Sample announcements created successfully',
      count: result.length,
      announcements: result
    });
  } catch (error) {
    console.error('Error creating sample announcements:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all announcements for a class
router.get('/', /*authenticateToken,*/ async (req, res) => {
  console.log('GET /api/announcements called with query:', req.query);
  try {
    // Check if database is connected
    if (!mongoose.connection.readyState) {
      console.error('Database not connected. Ready state:', mongoose.connection.readyState);
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const { classID } = req.query;
    
    if (classID) {
      // Get announcements for a specific class
      console.log('Fetching announcements for classID:', classID);
      const announcements = await Announcement.find({ classID }).sort({ createdAt: -1 });
      console.log('Found announcements for class:', announcements.length);
      res.json(announcements);
    } else {
      // Get all announcements
      console.log('Fetching all announcements');
      const announcements = await Announcement.find({}).sort({ createdAt: -1 });
      console.log('Found total announcements:', announcements.length);
      res.json(announcements);
    }
  } catch (error) {
    console.error('Error in GET /api/announcements:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create announcement
router.post('/', /*authenticateToken,*/ async (req, res) => {
  try {
    const { classID, title, content, priority, category, targetAudience, createdBy } = req.body;
    console.log(`Creating announcement:`, { title, content, priority, category, targetAudience, createdBy });
    
    const announcement = new Announcement({
      classID: classID || null,
      title, 
      content, 
      priority: priority || 'medium',
      category: category || 'general',
      targetAudience: targetAudience || ['everyone'],
      createdBy: createdBy || req.user?._id,
      isActive: true
    });
    await announcement.save();
    
    console.log(`Announcement saved with ID: ${announcement._id}`);
    
    // Create notifications for students in the class if classID is provided
    if (classID) {
      console.log(`Creating notifications for class: ${classID}`);
      try {
        await createAnnouncementNotification(classID, announcement);
      } catch (notificationError) {
        console.error('Error creating announcement notifications:', notificationError);
        // Don't fail the announcement creation if notification creation fails
      }
    }
    
    res.status(201).json(announcement);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// Edit announcement
router.put('/:id', /*authenticateToken,*/ async (req, res) => {
  const { title, content } = req.body;
  const announcement = await Announcement.findByIdAndUpdate(
    req.params.id, { title, content }, { new: true }
  );
  res.json(announcement);
});

// Partial update (e.g., toggle active status)
router.patch('/:id', /*authenticateToken,*/ async (req, res) => {
  try {
    const update = req.body || {};
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );
    if (!announcement) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }
    res.json(announcement);
  } catch (error) {
    console.error('Error patching announcement:', error);
    res.status(500).json({ success: false, error: 'Failed to update announcement' });
  }
});

// Delete announcement
router.delete('/:id', /*authenticateToken,*/ async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router; 