// lessonRoutes.js
// Handles lesson upload (with multiple files) and retrieval for classes in JuanLMS.
// Uses Multer for file upload and Mongoose for lesson storage.

import express from 'express';
import multer from 'multer';
import cloudinary from '../utils/cloudinary.js';
import { createClassNotifications } from '../services/notificationService.js';
import Lesson from '../models/Lesson.js';
import path from 'path';
import database from '../connect.cjs';
import { ObjectId } from 'mongodb';
// import { authenticateToken } from '../middleware/authMiddleware.js';
// import LessonProgress from '../models/LessonProgress.js';

const router = express.Router();

// --- Multer setup for file uploads (memory) ---
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => { cb(null, true); }
});

// --- POST /lessons - upload lesson with multiple files ---
// Accepts up to 5 files per lesson
router.post('/', /*authenticateToken,*/ upload.array('files', 5), async (req, res) => {
  try {
    const { classID, title, link } = req.body;
    // Validate required fields and at least one file
    if (!classID || !title || (!req.files || req.files.length === 0) && !link) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Upload each file buffer to Cloudinary (raw resource type for arbitrary docs)
    const uploadOne = (file) => new Promise((resolve, reject) => {
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        const uploadDir = 'uploads/lessons';
        const fs = require('fs');
        const path = require('path');
        fs.mkdirSync(uploadDir, { recursive: true });
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = unique + '-' + (file.originalname || 'file');
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, file.buffer);
        return resolve({ fileUrl: `/uploads/lessons/${filename}`, fileName: file.originalname });
      }
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'juanlms/lessons', resource_type: 'auto' },
        (err, result) => {
          if (err) return reject(err);
          resolve({ fileUrl: result.secure_url, fileName: file.originalname });
        }
      );
      stream.end(file.buffer);
    });
    const files = req.files && req.files.length > 0 ? await Promise.all(req.files.map(uploadOne)) : [];
    // Create and save the lesson document
    const lesson = new Lesson({ classID, title, files, link });
    await lesson.save();

    // Create notifications for students in the class
    try {
      await createClassNotifications(classID, lesson, 'activity', 'Faculty');
    } catch (notificationError) {
      console.error('Error creating lesson notifications:', notificationError);
      // Don't fail the lesson creation if notification creation fails
    }

    // Create audit log for material upload
    // const db = database.getDb();
    // await db.collection('AuditLogs').insertOne({
    //   userId: new ObjectId(req.user._id),
    //   userName: `${req.user.firstname} ${req.user.lastname}`,
    //   userRole: req.user.role,
    //   action: `${req.user.role.toUpperCase()}_UPLOAD_MATERIAL`,
    //   details: `Uploaded ${files.length} file(s) for lesson "${title}" in class ${classID}`,
    //   ipAddress: req.ip || req.connection.remoteAddress,
    //   timestamp: new Date()
    // });

    // Emit socket event for new material
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('material:created', {
          _id: lesson._id,
          classID: lesson.classID,
          title: lesson.title,
          files: lesson.files,
          link: lesson.link,
          createdAt: lesson.createdAt || new Date().toISOString()
        });
      }
    } catch (e) {
      console.log('Socket emit material:created failed:', e.message);
    }
    res.status(201).json({ success: true, lesson });
  } catch (err) {
    console.error('Lesson upload error:', err);
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(500).json({ error: 'Cloudinary not configured on server' });
    }
    res.status(500).json({ error: 'Failed to upload lesson' });
  }
});

// --- GET /lessons?classID=... - fetch lessons for a class ---
router.get('/', /*authenticateToken,*/ async (req, res) => {
  try {
    const { classID } = req.query;
    if (!classID) return res.status(400).json({ error: 'classID required' });
    // Find lessons for the given class, most recent first
    // Each lesson contains an array of files (with fileUrl and fileName)
    const lessons = await Lesson.find({ classID }).sort({ uploadedAt: -1 });
    res.json(lessons);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// Add Multer error handler for file size
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Max size is 100MB per file.' });
  }
  next(err);
});

// --- LESSON PROGRESS ROUTES ---
// POST /lesson-progress: set/update progress
// router.post('/lesson-progress', /*authenticateToken,*/ async (req, res) => {
//   try {
//     const { lessonId, fileUrl, lastPage, totalPages } = req.body;
//     if (!lessonId || !fileUrl || lastPage == null || totalPages == null) {
//       return res.status(400).json({ error: 'Missing required fields' });
//     }
//     // const filter = { userId: req.user._id, lessonId, fileUrl };
//     // const update = { lastPage, totalPages, updatedAt: new Date() };
//     // const options = { upsert: true, new: true, setDefaultsOnInsert: true };
//     // const progress = await LessonProgress.findOneAndUpdate(filter, update, options);
//     // res.json({ success: true, progress });
//     res.json({ success: true }); // Placeholder since auth is disabled
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to save progress' });
//   }
// });

// GET /lesson-progress?lessonId=...&fileUrl=...: get progress for current user
// router.get('/lesson-progress', /*authenticateToken,*/ async (req, res) => {
//   try {
//     const { lessonId, fileUrl } = req.query;
//     if (!lessonId || !fileUrl) return res.status(400).json({ error: 'lessonId and fileUrl required' });
//     // const progress = await LessonProgress.findOne({ userId: req.user._id, lessonId, fileUrl });
//     // res.json(progress || {});
//     res.json({}); // Placeholder since auth is disabled
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to fetch progress' });
//   }
// });

// --- DELETE /lessons/:lessonId - delete a lesson and its files (faculty only) ---
router.delete('/:lessonId', /*authenticateToken,*/ async (req, res) => {
  try {
    // if (req.user.role !== 'faculty') return res.status(403).json({ error: 'Forbidden' });
    const { lessonId } = req.params;
    const lesson = await Lesson.findByIdAndDelete(lessonId);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    // Optionally: delete files from disk here
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
});

// --- DELETE /lessons/:lessonId/file?fileUrl=... - delete a file from a lesson (faculty only) ---
router.delete('/:lessonId/file', /*authenticateToken,*/ async (req, res) => {
  try {
    // if (req.user.role !== 'faculty') return res.status(403).json({ error: 'Forbidden' });
    const { lessonId } = req.params;
    const { fileUrl } = req.query;
    if (!fileUrl) return res.status(400).json({ error: 'fileUrl required' });
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    lesson.files = lesson.files.filter(f => f.fileUrl !== fileUrl);
    await lesson.save();
    // Optionally: delete file from disk here
    res.json({ success: true, lesson });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// --- PUT /lessons/:lessonId - edit lesson title (faculty only) ---
router.put('/:lessonId', /*authenticateToken,*/ async (req, res) => {
  try {
    // if (req.user.role !== 'faculty') return res.status(403).json({ error: 'Forbidden' });
    const { lessonId } = req.params;
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const lesson = await Lesson.findByIdAndUpdate(lessonId, { title }, { new: true });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    res.json({ success: true, lesson });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

// PATCH /lessons/:lessonId/files - add new files to an existing lesson (faculty only)
router.patch('/:lessonId/files', /*authenticateToken,*/ upload.array('files', 5), async (req, res) => {
  try {
    // if (req.user.role !== 'faculty') return res.status(403).json({ error: 'Forbidden' });
    const { lessonId } = req.params;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
    const uploadOne = (file) => new Promise((resolve, reject) => {
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        const uploadDir = 'uploads/lessons';
        const fs = require('fs');
        const path = require('path');
        fs.mkdirSync(uploadDir, { recursive: true });
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = unique + '-' + (file.originalname || 'file');
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, file.buffer);
        return resolve({ fileUrl: `/uploads/lessons/${filename}`, fileName: file.originalname });
      }
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'juanlms/lessons', resource_type: 'auto' },
        (err, result) => {
          if (err) return reject(err);
          resolve({ fileUrl: result.secure_url, fileName: file.originalname });
        }
      );
      stream.end(file.buffer);
    });
    const newFiles = await Promise.all(req.files.map(uploadOne));
    lesson.files.push(...newFiles);
    await lesson.save();
    res.json({ success: true, lesson });
  } catch (err) {
    console.error('Add lesson files error:', err);
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(500).json({ error: 'Cloudinary not configured on server' });
    }
    res.status(500).json({ error: 'Failed to add files to lesson' });
  }
});

export default router; 