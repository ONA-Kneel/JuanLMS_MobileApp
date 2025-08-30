//assignment routes
import express from 'express';
import Assignment from '../models/Assignment.js';
// import { authenticateToken } from '../middleware/authMiddleware.js';
import Submission from '../models/Submission.js';
import multer from 'multer';
import path from 'path';
import User from '../models/User.js';
import Quiz from '../models/Quiz.js';
import Class from '../models/Class.js';
// import { createAssignmentNotification } from '../services/notificationService.js';

const router = express.Router();

// Debug middleware to log all requests to assignment routes
router.use((req, res, next) => {
  console.log('=== ASSIGNMENT ROUTES DEBUG ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request path:', req.path);
  console.log('Request params:', req.params);
  console.log('Request originalUrl:', req.originalUrl);
  console.log('Request baseUrl:', req.baseUrl);
  console.log('=== END ASSIGNMENT ROUTES DEBUG ===');
  next();
});

// Simple test route to verify assignment routes are working
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Assignment routes are working!', 
    timestamp: new Date().toISOString(),
    requestInfo: {
      method: req.method,
      url: req.url,
      path: req.path,
      baseUrl: req.baseUrl,
      originalUrl: req.originalUrl
    }
  });
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'uploads', 'submissions'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Get all assignments for a class
router.get('/', /*authenticateToken,*/ async (req, res) => {
  const { classID } = req.query;

  let assignments = [];
  if (classID) {
    assignments = await Assignment.find({ classID }).sort({ createdAt: -1 });
  } else {
    assignments = await Assignment.find().sort({ createdAt: -1 });
  }

  // Fetch quizzes for this class
  let quizzes = [];
  if (classID) {
    quizzes = await Quiz.find({
      $or: [
        { classID: classID }, // For backward compatibility with old quizzes
        { 'assignedTo.classID': classID } // For new quizzes with correct structure
      ]
    }).sort({ createdAt: -1 });
  } else {
    quizzes = await Quiz.find().sort({ createdAt: -1 });
  }

  // Get class information for all unique classIDs
  const allClassIDs = [...new Set([
    ...assignments.map(a => a.classID),
    ...quizzes.map(q => q.classID || (q.classIDs && q.classIDs[0])).filter(Boolean)
  ])];

  const classesMap = {};
  if (allClassIDs.length > 0) {
    const classes = await Class.find({ classID: { $in: allClassIDs } });
    classes.forEach(cls => {
      classesMap[cls.classID] = {
        className: cls.className,
        classCode: cls.classCode,
        classDesc: cls.classDesc
      };
    });
  }

  // Add type field and class info for frontend
  const assignmentsWithType = assignments.map(a => ({ 
    ...a.toObject(), 
    type: 'assignment',
    classInfo: classesMap[a.classID] || { className: 'Unknown', classCode: 'N/A', classDesc: '' }
  }));
  const quizzesWithType = quizzes.map(q => ({ 
    ...q.toObject(), 
    type: 'quiz',
    classInfo: classesMap[q.classID || (q.assignedTo && q.assignedTo[0]?.classID)] || { className: 'Unknown', classCode: 'N/A', classDesc: '' }
  }));

  let combined = [...assignmentsWithType, ...quizzesWithType];

  // Sort by dueDate if available, otherwise by createdAt
  combined.sort((a, b) => {
    const aDate = a.dueDate ? new Date(a.dueDate) : new Date(a.createdAt);
    const bDate = b.dueDate ? new Date(b.dueDate) : new Date(b.createdAt);
    return aDate - bDate;
  });

  res.json(combined);
});

// Get a single assignment by ID
router.get('/:id', /*authenticateToken,*/ async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }
    res.json(assignment);
  } catch (err) {
    console.error('Error fetching assignment:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid assignment ID format.' });
    }
    res.status(500).json({ error: 'Failed to fetch assignment. Please try again.' });
  }
});

// Update assignment (for posting status, etc.)
router.patch('/:id', /*authenticateToken,*/ async (req, res) => {
  try {
    const { postAt } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }
    
    // Only allow faculty who created the assignment to update it
    // if (assignment.createdBy.toString() !== req.user._id.toString()) {
    //   return res.status(403).json({ error: 'Not authorized to update this assignment.' });
    // }
    
    if (postAt !== undefined) {
      assignment.postAt = postAt;
    }
    
    await assignment.save();
    res.json(assignment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Create assignment or quiz
router.post('/', /*authenticateToken,*/ upload.single('attachmentFile'), async (req, res) => {
  try {
    let { classIDs, classID, title, instructions, type, description, dueDate, points, fileUploadRequired, allowedFileTypes, fileInstructions, questions, assignedTo, attachmentLink, postAt } = req.body;
    // const createdBy = req.user._id;
    const createdBy = null; // Since auth is disabled
    
    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Assignment title is required.' });
    }
    
    if (!classIDs && !classID) {
      return res.status(400).json({ error: 'At least one class must be selected.' });
    }
    
    if (points !== undefined && (points < 1 || points > 100)) {
      return res.status(400).json({ error: 'Points must be between 1 and 100.' });
    }
    
    // Parse arrays/objects if sent as FormData
    if (typeof classIDs === 'string') {
      try {
        classIDs = JSON.parse(classIDs);
      } catch (parseErr) {
        return res.status(400).json({ error: 'Invalid class IDs format.' });
      }
    }
    if (typeof assignedTo === 'string') {
      try {
        assignedTo = JSON.parse(assignedTo);
      } catch (parseErr) {
        return res.status(400).json({ error: 'Invalid assignedTo format.' });
      }
    }
    
    let attachmentFile = '';
    if (req.file) {
      attachmentFile = `/uploads/submissions/${req.file.filename}`;
    }
    
    let assignments = [];
    if (Array.isArray(classIDs) && classIDs.length > 0) {
      for (const cid of classIDs) {
        const assignment = new Assignment({
          classID: cid,
          title: title.trim(),
          instructions,
          type: type || 'assignment',
          description,
          dueDate,
          points,
          fileUploadRequired,
          allowedFileTypes,
          fileInstructions,
          questions,
          createdBy,
          assignedTo,
          attachmentLink,
          attachmentFile,
          postAt
        });
        await assignment.save();
        assignments.push(assignment);
        
        // Create notifications for students in this class
        // await createAssignmentNotification(cid, assignment);
      }
      return res.status(201).json(assignments);
    } else if (classID) {
      const assignment = new Assignment({
        classID,
        title: title.trim(),
        instructions,
        type: type || 'assignment',
        description,
        dueDate,
        points,
        fileUploadRequired,
        allowedFileTypes,
        fileInstructions,
        questions,
        createdBy,
        assignedTo,
        attachmentLink,
        attachmentFile,
        postAt
      });
      await assignment.save();
      
      // Create notifications for students in this class
      // await createAssignmentNotification(classID, assignment);
      
      return res.status(201).json([assignment]);
    } else {
      return res.status(400).json({ error: 'No classID(s) provided.' });
    }
  } catch (err) {
    console.error('Error creating assignment:', err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    res.status(500).json({ error: 'Failed to create assignment. Please try again.' });
  }
});

// Edit assignment
router.put('/:id', /*authenticateToken,*/ async (req, res) => {
  try {
    const { title, instructions, description, dueDate, points, attachmentLink, postAt, classIDs } = req.body;
    
    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Assignment title is required.' });
    }
    
    if (points !== undefined && (points < 1 || points > 100)) {
      return res.status(400).json({ error: 'Points must be between 1 and 100.' });
    }
    
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }
    
    // Only allow faculty who created the assignment to update it
    // if (assignment.createdBy.toString() !== req.user._id.toString()) {
    //   return res.status(403).json({ error: 'You are not authorized to edit this assignment.' });
    // }
    
    // Update fields
    if (title !== undefined) assignment.title = title.trim();
    if (instructions !== undefined) assignment.instructions = instructions;
    if (description !== undefined) assignment.description = description;
    if (dueDate !== undefined) assignment.dueDate = dueDate;
    if (points !== undefined) assignment.points = points;
    if (attachmentLink !== undefined) assignment.attachmentLink = attachmentLink;
    if (postAt !== undefined) assignment.postAt = postAt;
    if (classIDs !== undefined && Array.isArray(classIDs)) {
      assignment.classID = classIDs[0]; // For now, just use the first class ID
    }
    
    await assignment.save();
    res.json(assignment);
  } catch (err) {
    console.error('Error updating assignment:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid assignment ID format.' });
    }
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    res.status(500).json({ error: 'Failed to update assignment. Please try again.' });
  }
});

// Delete assignment
router.delete('/:id', /*authenticateToken,*/ async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }
    
    // Only allow faculty who created the assignment to delete it
    // if (assignment.createdBy.toString() !== req.user._id.toString()) {
    //   return res.status(403).json({ error: 'You are not authorized to delete this assignment.' });
    // }
    
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Assignment deleted successfully.' });
  } catch (err) {
    console.error('Error deleting assignment:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid assignment ID format.' });
    }
    res.status(500).json({ error: 'Failed to delete assignment. Please try again.' });
  }
});

// Mark assignment as viewed by a student
router.post('/:id/view', /*authenticateToken,*/ async (req, res) => {
  try {
    // const userId = req.user._id;
    const { userId } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    if (!assignment.views) assignment.views = [];
    if (!assignment.views.some(id => id.equals(userId))) {
      assignment.views.push(userId);
      await assignment.save();
    }
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as viewed' });
  }
});

// Student submits an assignment (with file upload)
router.post('/:id/submit', /*authenticateToken,*/ upload.array('files', 5), async (req, res) => {
  try {
    // const student = req.user._id;
    const { studentId, context } = req.body;
    const assignment = req.params.id;
    // Check if already submitted
    let submission = await Submission.findOne({ assignment, student: studentId });
    const isResubmission = !!submission;
    
    let files = [];
    if (req.files && req.files.length > 0) {
      files = req.files.map(f => ({
        url: `/uploads/submissions/${f.filename}`,
        name: f.filename,
        originalName: f.originalname,
        uploadedAt: new Date(),
        isReplacement: isResubmission,
        replacementTime: isResubmission ? new Date() : undefined,
        isLate: false, // Will be calculated below
        fileSize: f.size,
        mimetype: f.mimetype
      }));
    }
    
    // Check if submission is late
    const assignmentData = await Assignment.findById(assignment);
    const now = new Date();
    const dueDate = assignmentData?.dueDate ? new Date(assignmentData.dueDate) : null;
    const isLate = dueDate && now > dueDate;
    
    // Update isLate flag for all files
    files.forEach(file => {
      file.isLate = isLate;
    });
    
    if (submission) {
      // This is a resubmission - update existing submission
      submission.files = files;
      submission.context = context || submission.context;
      submission.lastUpdated = new Date();
      submission.hasReplacement = true;
      submission.replacementCount = (submission.replacementCount || 0) + 1;
      await submission.save();
    } else {
      // This is a new submission
      submission = new Submission({ 
        assignment, 
        student: studentId, 
        files, 
        context,
        submittedAt: new Date(),
        status: 'turned-in',
        originalSubmissionDate: new Date(),
        lastUpdated: new Date()
      });
      await submission.save();
    }
    
    res.json({
      submission,
      isResubmission,
      replacementCount: submission.replacementCount || 0,
      isLate
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit assignment.' });
  }
});

// Faculty gets all submissions for an assignment
router.get('/:id/submissions', /*authenticateToken,*/ async (req, res) => {
  try {
    const assignment = req.params.id;
    const submissions = await Submission.find({ assignment }).populate('student', 'userID firstname lastname email');
    res.json(submissions);
  } catch (err) {
    console.error('Error fetching submissions:', err);
    res.status(500).json({ error: 'Failed to fetch submissions.' });
  }
});

// Get submission history for a specific student and assignment
router.get('/:id/submission/:studentId', /*authenticateToken,*/ async (req, res) => {
  try {
    const { id, studentId } = req.params;
    
    const submission = await Submission.findOne({ 
      assignment: id, 
      student: studentId 
    }).populate('student', 'userID firstname lastname email');
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found.' });
    }
    
    // Calculate timing status
    const assignment = await Assignment.findById(id);
    const dueDate = assignment?.dueDate ? new Date(assignment.dueDate) : null;
    const now = new Date();
    
    let timingStatus = 'on-time';
    if (dueDate && submission.lastUpdated > dueDate) {
      const daysLate = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
      if (daysLate === 0) {
        timingStatus = 'late';
      } else {
        timingStatus = 'overdue';
      }
    }
    
    res.json({
      submission,
      timingStatus,
      dueDate: assignment?.dueDate,
      daysLate: dueDate && now > dueDate ? Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)) : 0
    });
  } catch (err) {
    console.error('Error fetching submission history:', err);
    res.status(500).json({ error: 'Failed to fetch submission history.' });
  }
});

// Faculty grades a submission
router.post('/:id/grade', /*authenticateToken,*/ async (req, res) => {
  try {
    const { submissionId, grade, feedback } = req.body;
    const submission = await Submission.findById(submissionId);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    // Enforce max score of 100
    let finalGrade = grade;
    if (typeof finalGrade === 'number' && finalGrade > 100) {
      finalGrade = 100;
    }
    submission.grade = finalGrade;
    submission.feedback = feedback;
    submission.status = 'graded';
    await submission.save();
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: 'Failed to grade submission.' });
  }
});

// IMPORTANT: Place specific routes BEFORE general ones to avoid route conflicts
// Test endpoint to verify route path
router.get('/:id/test-replace', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('=== TEST REPLACE ENDPOINT HIT ===');
    console.log('Assignment ID:', id);
    console.log('Assignment ID type:', typeof id);
    console.log('Assignment ID length:', id?.length);
    console.log('=== END TEST DEBUG ===');
    
    res.json({ 
      message: 'Test endpoint working',
      assignmentId: id,
      assignmentIdType: typeof id,
      assignmentIdLength: id?.length
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ error: 'Test endpoint error' });
  }
});

// Student replaces a file in their submission
router.post('/:id/replace-file', upload.single('replacementFile'), async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, isLate, submissionTime } = req.body;
    
    console.log('=== REPLACE-FILE ENDPOINT HIT ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('Assignment ID from params:', id);
    console.log('Assignment ID type:', typeof id);
    console.log('Assignment ID length:', id?.length);
    console.log('=== END REPLACE-FILE DEBUG ===');
    
    // Validate the assignment ID
    if (!id || id.length !== 24) {
      console.error('Invalid assignment ID received:', id, 'Length:', id?.length);
      return res.status(400).json({ 
        error: 'Invalid assignment ID format.',
        receivedId: id,
        idLength: id?.length,
        expectedLength: 24
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No replacement file provided.' });
    }

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required.' });
    }

    // Find the existing submission
    const submission = await Submission.findOne({ 
      assignment: id, 
      student: studentId 
    });

    if (!submission) {
      console.error('Submission not found for assignment:', id, 'student:', studentId);
      return res.status(404).json({ 
        error: 'Submission not found.',
        assignmentId: id,
        studentId: studentId
      });
    }

    // Create the new file object
    const newFile = {
      url: `/uploads/submissions/${req.file.filename}`,
      name: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      fileSize: req.file.size,
      path: req.file.path,
      uploadedAt: new Date(),
      isReplacement: true,
      replacementTime: new Date(),
      isLate: isLate === 'true',
      submissionTime: submissionTime ? new Date(submissionTime) : new Date()
    };

    // Replace the original files with the new replacement file
    // Remove all previous files and add only the new replacement file
    submission.files = [newFile];

    // Update submission metadata
    submission.lastUpdated = new Date();
    submission.hasReplacement = true;
    submission.replacementCount = (submission.replacementCount || 0) + 1;
    submission.latestFile = newFile;

    await submission.save();

    res.json({ 
      message: 'File successfully replaced. The original file has been removed and replaced with the new file.',
      file: newFile,
      submission: {
        id: submission._id,
        hasReplacement: submission.hasReplacement,
        replacementCount: submission.replacementCount,
        lastUpdated: submission.lastUpdated
      }
    });

  } catch (error) {
    console.error('Error in file replacement:', error);
    res.status(500).json({
      error: 'Internal server error during file replacement.',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Student undoes their submission (delete submission)
router.delete('/:id/submission', /*authenticateToken,*/ async (req, res) => {
  try {
    // const student = req.user._id;
    const { studentId } = req.body;
    const assignment = req.params.id;
    const submission = await Submission.findOneAndDelete({ assignment, student: studentId });
    if (!submission) return res.status(404).json({ error: 'Submission not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to undo submission.' });
  }
});

// Student deletes a file from their submission (but not the whole submission)
router.patch('/:id/submission/file', /*authenticateToken,*/ async (req, res) => {
  try {
    // const student = req.user._id;
    const { studentId, fileUrl } = req.body;
    const assignment = req.params.id;
    if (!fileUrl) return res.status(400).json({ error: 'fileUrl is required.' });
    const submission = await Submission.findOne({ assignment, student: studentId });
    if (!submission) return res.status(404).json({ error: 'Submission not found.' });
    // Remove the file from the files array
    submission.files = (submission.files || []).filter(f => f.url !== fileUrl);
    await submission.save();
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete file from submission.' });
  }
});

// Get all assignments created by a specific faculty member
router.get('/faculty/:facultyId', /*authenticateToken,*/ async (req, res) => {
  try {
    const { facultyId } = req.params;
    
    // Find classes taught by this faculty member
    const classes = await Class.find({ faculty: facultyId });
    const classIds = classes.map(cls => cls.classID);
    
    // Find assignments for these classes
    const assignments = await Assignment.find({ 
      classID: { $in: classIds } 
    }).sort({ createdAt: -1 });
    
    // Add class information to each assignment
    const assignmentsWithClassInfo = assignments.map(assignment => {
      const classInfo = classes.find(cls => cls.classID === assignment.classID);
      return {
        ...assignment.toObject(),
        className: classInfo ? classInfo.className : null,
        classCode: classInfo ? classInfo.classCode : 'N/A'
      };
    });
    
    res.json(assignmentsWithClassInfo);
  } catch (err) {
    console.error('Error fetching faculty assignments:', err);
    res.status(500).json({ error: 'Failed to fetch faculty assignments.' });
  }
});

export default router;
