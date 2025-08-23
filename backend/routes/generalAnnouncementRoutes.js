import express from "express";
import GeneralAnnouncement from "../models/GeneralAnnouncement.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import mongoose from "mongoose";

const router = express.Router();

// POST /api/general-announcements - Create a new general announcement
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, body, recipientRoles, termName, schoolYear } = req.body;
    const userId = req.user.id; // From auth middleware
    const userRole = req.user.role?.toLowerCase();

    // Validate required fields
    if (!title || !body || !recipientRoles || recipientRoles.length === 0 || !termName || !schoolYear) {
      return res.status(400).json({ 
        message: "Title, body, recipient roles, term name, and school year are required" 
      });
    }

    // Validate character limits
    if (title.length > 100) {
      return res.status(400).json({ 
        message: "Title cannot exceed 100 characters" 
      });
    }

    if (body.length > 2000) {
      return res.status(400).json({ 
        message: "Body cannot exceed 2000 characters" 
      });
    }

    // Filter out the creator's role so they don't receive their own announcement
    const filteredRecipientRoles = recipientRoles.filter(role => {
      // Normalize the creator's role for comparison
      let normalizedCreatorRole = userRole;
      if (userRole === 'student') normalizedCreatorRole = 'students';
      if (userRole === 'vpe' || userRole === 'vice president') normalizedCreatorRole = 'vice president of education';
      
      return role !== normalizedCreatorRole;
    });

    // Ensure at least one recipient remains after filtering
    if (filteredRecipientRoles.length === 0) {
      return res.status(400).json({ 
        message: "At least one recipient (other than yourself) is required" 
      });
    }

    // Create new announcement
    const announcement = new GeneralAnnouncement({
      title,
      body,
      recipientRoles: filteredRecipientRoles,
      termName,
      schoolYear,
      createdBy: userId
    });

    await announcement.save();

    res.status(201).json({
      message: "Announcement created successfully",
      announcement
    });

  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({ 
      message: "Failed to create announcement",
      error: error.message 
    });
  }
});

// GET /api/general-announcements - Get announcements based on user role
router.get("/", authenticateToken, async (req, res) => {
  console.log('GET /api/general-announcements called');
  try {
    const userRole = req.user.role?.toLowerCase();
    const userId = req.user.id;
    
    console.log('User role:', userRole, 'User ID:', userId);
    
    if (!userRole) {
      console.log('No user role found');
      return res.status(400).json({ message: "User role not found" });
    }

    // Normalize role for matching (similar to login logic)
    let normalizedRole = userRole;
    if (userRole === 'student') normalizedRole = 'students';
    if (userRole === 'vpe' || userRole === 'vice president') normalizedRole = 'vice president of education';

    console.log('Normalized role:', normalizedRole);

    // Find announcements that the user can see and haven't acknowledged yet
    const announcements = await GeneralAnnouncement.find({
      recipientRoles: { $in: [normalizedRole] },
      // Exclude announcements that the user has already acknowledged
      'announcementsViews.userId': { $ne: userId }
    })
    .populate('createdBy', 'firstname lastname role')
    .sort({ createdAt: -1 });

    console.log('Found general announcements:', announcements.length);
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching general announcements:', error);
    res.status(500).json({ 
      message: "Failed to fetch announcements",
      error: error.message 
    });
  }
});

// GET /api/general-announcements/acknowledged - Get acknowledged announcements
router.get("/acknowledged", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const announcements = await GeneralAnnouncement.find({
      'announcementsViews.userId': userId
    })
    .populate('createdBy', 'firstname lastname role')
    .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    console.error("Error fetching acknowledged announcements:", error);
    res.status(500).json({ 
      message: "Failed to fetch acknowledged announcements",
      error: error.message 
    });
  }
});

// POST /api/general-announcements/:id/acknowledge - Acknowledge an announcement
router.post("/:id/acknowledge", authenticateToken, async (req, res) => {
  try {
    const announcementId = req.params.id;
    const userId = req.user.id;

    const announcement = await GeneralAnnouncement.findById(announcementId);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    // Check if user has already acknowledged this announcement
    const alreadyAcknowledged = announcement.announcementsViews.some(
      view => view.userId.toString() === userId
    );

    if (alreadyAcknowledged) {
      return res.status(400).json({ message: "Announcement already acknowledged" });
    }

    // Add acknowledgment
    announcement.announcementsViews.push({
      userId: userId,
      acknowledgedAt: new Date()
    });

    await announcement.save();

    res.json({
      message: "Announcement acknowledged successfully",
      announcement
    });
  } catch (error) {
    console.error("Error acknowledging announcement:", error);
    res.status(500).json({ 
      message: "Failed to acknowledge announcement",
      error: error.message 
    });
  }
});

export default router;
