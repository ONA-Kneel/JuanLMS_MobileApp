//quiz routes

import express from 'express';
import User from '../models/User.js';
import Quiz from '../models/Quiz.js';
import Class from '../models/Class.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import QuizResponse from '../models/QuizResponse.js';
// import { authenticateToken } from '../middleware/authMiddleware.js';
import seedrandom from 'seedrandom';
import { createQuizNotification } from '../services/notificationService.js';

const router = express.Router();

// Multer setup for quiz images
const quizImageDir = path.resolve('backend/server/uploads/quiz-images');
if (!fs.existsSync(quizImageDir)) fs.mkdirSync(quizImageDir, { recursive: true });
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, quizImageDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// Upload quiz image
router.post('/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const imageUrl = `/uploads/quiz-images/${req.file.filename}`;
  res.json({ url: imageUrl });
});

// Create a new quiz
router.post('/', /*authenticateToken,*/ async (req, res) => {
  // if (req.user.role !== 'faculty') return res.status(403).json({ error: 'Forbidden' });
  try {
    const quiz = new Quiz(req.body);
    await quiz.save();
    
    // Create notifications for students in the class(es)
    if (quiz.classID) {
      await createQuizNotification(quiz.classID, quiz);
    } else if (quiz.assignedTo && Array.isArray(quiz.assignedTo)) {
      for (const assignment of quiz.assignedTo) {
        if (assignment.classID) {
          await createQuizNotification(assignment.classID, quiz);
        }
      }
    }
    
    res.status(201).json(quiz);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all quizzes (optionally filter by classID)
router.get('/', /*authenticateToken,*/ async (req, res) => {
  try {
    const { classID } = req.query;
    // const userId = req.user.userID;
    // const role = req.user.role;
    
    let quizzes;
    if (classID) {
      quizzes = await Quiz.find({
        $or: [
          { classID: classID }, // For backward compatibility with old quizzes
          { 'assignedTo.classID': classID } // For new quizzes with correct structure
        ]
      });
    } else {
      // if (role === 'faculty') {
      //   // For faculty, get quizzes from all their classes
      //   const facultyClasses = await Class.find({ facultyID: userId });
      //   const classIDs = facultyClasses.map(c => c.classID);
      //   quizzes = await Quiz.find({ 
      //     $or: [ 
      //       { classID: { $in: classIDs } }, 
      //       { 'assignedTo.classID': { $in: classIDs } } 
      //     ] 
      //   });
      // } else {
        quizzes = [];
      // }
    }
    
    // Get class information for all unique classIDs
    const allClassIDs = [...new Set([
      ...quizzes.map(q => q.classID).filter(Boolean),
      ...quizzes.flatMap(q => q.assignedTo?.map(a => a.classID) || []).filter(Boolean)
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
    
    // Add class info to quizzes
    const quizzesWithClassInfo = quizzes.map(q => {
      const quizObj = q.toObject();
      const primaryClassID = q.classID || q.assignedTo?.[0]?.classID;
      return {
        ...quizObj,
        classInfo: classesMap[primaryClassID] || { className: 'Unknown', classCode: 'N/A', classDesc: '' }
      };
    });
    
    res.json(quizzesWithClassInfo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// IMPORTANT: Place this route BEFORE any /:id or /:quizId routes!
// =======================

// Fetch a single student's response for a quiz
router.get('/:quizId/response/:studentId', /*authenticateToken,*/ async (req, res) => {
  try {
    const { quizId, studentId } = req.params;
    const response = await QuizResponse.findOne({ quizId, studentId }).populate('studentId', 'firstname lastname email');
    if (!response) return res.status(404).json({ error: 'Response not found.' });
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single quiz by ID (for edit/faculty)
router.get('/:id', /*authenticateToken,*/ async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a quiz for a student (with shuffling)
router.get('/:quizId', /*authenticateToken,*/ async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId).lean();
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    // FIX: Use questionBehaviour.shuffle (boolean)
    // if (quiz.questionBehaviour && quiz.questionBehaviour.shuffle && req.user && req.user._id) {
    //   quiz.questions = seededShuffle(quiz.questions, req.user._id.toString());
    // }

    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a quiz by ID
router.put('/:id', /*authenticateToken,*/ async (req, res) => {
  // if (req.user.role !== 'faculty') return res.status(403).json({ error: 'Forbidden' });
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json(quiz);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH a quiz by ID (partial update)
router.patch('/:id', /*authenticateToken,*/ async (req, res) => {
  // if (req.user.role !== 'faculty') return res.status(403).json({ error: 'Forbidden' });
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json(quiz);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a quiz by ID
router.delete('/:id', /*authenticateToken,*/ async (req, res) => {
  // if (req.user.role !== 'faculty') return res.status(403).json({ error: 'Forbidden' });
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json({ message: 'Quiz deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student submits quiz answers
router.post('/:quizId/submit', /*authenticateToken,*/ async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentId = req.body.studentId;
    const { answers } = req.body;
    
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Answers are required.' });
    }
    
    const existing = await QuizResponse.findOne({ quizId, studentId });
    if (existing) {
      return res.status(400).json({ error: 'You have already submitted this quiz. You cannot submit again.' });
    }
    
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    let score = 0;
    let checkedAnswers = [];
    
    // Process each question and answer
    quiz.questions.forEach((q, i) => {
      const studentAnswer = answers[i]?.answer;
      let correct = false;
      let correctAnswerForStorage;
      
      console.log(`Processing question ${i + 1}:`, {
        questionType: q.type,
        studentAnswer: studentAnswer,
        questionText: q.question,
        correctAnswers: q.correctAnswers,
        correctAnswer: q.correctAnswer
      });
      
      if (q.type === 'multiple') {
        // For multiple choice questions
        if (Array.isArray(q.correctAnswers) && q.correctAnswers.length > 0) {
          // Check if student answer matches any of the correct answers
          if (Array.isArray(studentAnswer)) {
            correct = studentAnswer.length === q.correctAnswers.length &&
              studentAnswer.every(a => q.correctAnswers.includes(a));
          } else {
            correct = q.correctAnswers.includes(studentAnswer);
          }
          // Store the actual correct answer TEXT values for frontend highlighting
          // q.correctAnswers contains indices, so convert them to actual choice text
          correctAnswerForStorage = q.correctAnswers.map(index => q.choices[index]).filter(Boolean);
        } else {
          correct = false;
          correctAnswerForStorage = [];
        }
      } else if (q.type === 'truefalse') {
        // For true/false questions
        correct = studentAnswer === q.correctAnswer;
        correctAnswerForStorage = q.correctAnswer;
      } else {
        // For identification questions
        correct = studentAnswer === q.correctAnswer;
        correctAnswerForStorage = q.correctAnswer;
      }
      
      if (correct) score += q.points || 1;
      
      checkedAnswers.push({ 
        correct, 
        studentAnswer, 
        correctAnswer: correctAnswerForStorage 
      });
      
      console.log(`Question ${i + 1} result:`, {
        correct,
        score: correct ? (q.points || 1) : 0,
        storedStudentAnswer: studentAnswer,
        storedCorrectAnswer: correctAnswerForStorage,
        // Add debugging for multiple choice
        questionType: q.type,
        originalCorrectAnswers: q.correctAnswers,
        choices: q.choices,
        convertedCorrectAnswers: q.type === 'multiple' ? q.correctAnswers.map(index => q.choices[index]) : 'N/A'
      });
    });
    
    // Create the quiz response with proper data structure
    const response = new QuizResponse({ 
      quizId, 
      studentId, 
      answers, 
      score, 
      checkedAnswers 
    });
    
    await response.save();
    
    const total = Array.isArray(quiz.questions)
      ? quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0)
      : 0;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    
    res.status(201).json({ 
      message: 'Quiz submitted successfully.', 
      score, 
      total, 
      percentage, 
      submittedAt: response.submittedAt 
    });
  } catch (err) {
    console.error('Error submitting quiz:', err);
    res.status(500).json({ error: err.message });
  }
});

// Faculty fetches all responses for a quiz
router.get('/:quizId/responses', /*authenticateToken,*/ async (req, res) => {
  try {
    const { quizId } = req.params;
    const responses = await QuizResponse.find({ quizId }).populate('studentId', 'firstname lastname email');
    res.json(responses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH a quiz response's score by responseId
router.patch('/:quizId/responses/:responseId', /*authenticateToken,*/ async (req, res) => {
  // if (req.user.role !== 'faculty') return res.status(403).json({ error: 'Forbidden' });
  try {
    const { responseId } = req.params;
    const { score } = req.body;
    if (typeof score !== 'number') return res.status(400).json({ error: 'Score must be a number.' });
    const updated = await QuizResponse.findByIdAndUpdate(responseId, { score }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Quiz response not found.' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch students by array of IDs
router.post('/students/by-ids', /*authenticateToken,*/ async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No student IDs provided.' });
    }
    const students = await User.find({ userID: { $in: ids } }, 'firstname lastname email _id userID');
    res.json({ students });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get the current student's score for a quiz
router.get('/:quizId/myscore', /*authenticateToken,*/ async (req, res) => {
  try {
    const { quizId } = req.params;
    const { studentId, revealAnswers } = req.query;
    
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }
    
    const response = await QuizResponse.findOne({ quizId, studentId });
    if (!response) {
      return res.status(404).json({ error: 'No submission found' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    const total = Array.isArray(quiz.questions)
      ? quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0)
      : 0;
    const percentage = total > 0 ? Math.round(((response.score ?? 0) / total) * 100) : 0;

    console.log('=== CALCULATING TOTAL POINTS ===');
    console.log('Quiz questions:', quiz.questions?.length);
    console.log('Individual question points:', quiz.questions?.map(q => ({ question: q.question.substring(0, 30) + '...', points: q.points })));
    console.log('Calculated total:', total);
    console.log('Response score:', response.score);
    console.log('Calculated percentage:', percentage);

    const payload = {
      score: response.score ?? 0,
      total,
      percentage,
      submittedAt: response.submittedAt,
      graded: !!response.graded,
    };

    if (String(revealAnswers).toLowerCase() === 'true') {
      console.log('=== REVEALING ANSWERS ===');
      console.log('Original response:', {
        answers: response.answers,
        checkedAnswers: response.checkedAnswers,
        answersLength: response.answers?.length
      });
      
      // Check if checkedAnswers exists, if not, regenerate them
      if (!response.checkedAnswers || response.checkedAnswers.length === 0) {
        console.log('Regenerating checkedAnswers for quiz response');
        
        const regeneratedCheckedAnswers = [];
        quiz.questions.forEach((q, i) => {
          const studentAnswer = response.answers[i]?.answer;
          let correct = false;
          let correctAnswerForStorage;
          
          console.log(`Regenerating question ${i + 1}:`, {
            questionType: q.type,
            storedAnswerObj: response.answers[i],
            extractedStudentAnswer: studentAnswer,
            questionText: q.question,
            correctAnswers: q.correctAnswers,
            correctAnswer: q.correctAnswer
          });
          
          if (q.type === 'multiple') {
            if (Array.isArray(q.correctAnswers) && q.correctAnswers.length > 0) {
              if (Array.isArray(studentAnswer)) {
                correct = studentAnswer.length === q.correctAnswers.length &&
                  studentAnswer.every(a => q.correctAnswers.includes(a));
              } else {
                correct = q.correctAnswers.includes(studentAnswer);
              }
              // Convert indices to actual answer text for frontend highlighting
              correctAnswerForStorage = q.correctAnswers.map(index => q.choices[index]).filter(Boolean);
            } else {
              correct = false;
              correctAnswerForStorage = [];
            }
          } else if (q.type === 'truefalse') {
            correct = studentAnswer === q.correctAnswer;
            correctAnswerForStorage = q.correctAnswer;
          } else {
            correct = studentAnswer === q.correctAnswer;
            correctAnswerForStorage = q.correctAnswer;
          }
          
          regeneratedCheckedAnswers.push({ 
            correct, 
            studentAnswer, 
            correctAnswer: correctAnswerForStorage 
          });
          
          console.log(`Regenerated question ${i + 1}:`, {
            correct,
            storedStudentAnswer: studentAnswer,
            storedCorrectAnswer: correctAnswerForStorage,
            // Add debugging for multiple choice
            questionType: q.type,
            originalCorrectAnswers: q.correctAnswers,
            choices: q.choices,
            convertedCorrectAnswers: q.type === 'multiple' ? q.correctAnswers.map(index => q.choices[index]) : 'N/A'
          });
        });
        
        // Update the database with regenerated data
        try {
          await QuizResponse.findByIdAndUpdate(response._id, { 
            checkedAnswers: regeneratedCheckedAnswers 
          });
          console.log('Updated quiz response with regenerated checkedAnswers');
        } catch (updateErr) {
          console.error('Failed to update quiz response:', updateErr);
        }
        
        payload.checkedAnswers = regeneratedCheckedAnswers;
      } else {
        console.log('Using existing checkedAnswers from database');
        payload.checkedAnswers = response.checkedAnswers;
      }
      
      // Always include the answers array
      payload.answers = response.answers || [];
      
      console.log('Final payload for frontend:', {
        checkedAnswers: payload.checkedAnswers,
        answers: payload.answers,
        answersLength: payload.answers?.length,
        score: payload.score,
        total: payload.total,
        percentage: payload.percentage
      });
    }

    console.log('=== FINAL RESPONSE PAYLOAD ===');
    console.log('Sending to frontend:', {
      score: payload.score,
      total: payload.total,
      percentage: payload.percentage,
      hasCheckedAnswers: !!payload.checkedAnswers,
      hasAnswers: !!payload.answers
    });

    res.json(payload);
  } catch (err) {
    console.error('Error in myscore endpoint:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper: Seeded Fisher-Yates shuffle
function seededShuffle(array, seed) {
  const rng = seedrandom(seed);
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Get all quizzes created by a specific faculty member
router.get('/faculty/:facultyId', /*authenticateToken,*/ async (req, res) => {
  try {
    const { facultyId } = req.params;
    
    // Find classes taught by this faculty member
    const classes = await Class.find({ faculty: facultyId });
    const classIds = classes.map(cls => cls.classID);
    
    // Find quizzes for these classes
    const quizzes = await Quiz.find({ 
      $or: [
        { classID: { $in: classIds } },
        { classIDs: { $in: classIds } }
      ]
    }).sort({ createdAt: -1 });
    
    // Add class information to each quiz
    const quizzesWithClassInfo = quizzes.map(quiz => {
      const classId = quiz.classID || (quiz.classIDs && quiz.classIDs[0]);
      const classInfo = classes.find(cls => cls.classID === classId);
      return {
        ...quiz.toObject(),
        className: classInfo ? classInfo.className : 'Unknown Class',
        classCode: classInfo ? classInfo.classCode : 'N/A'
      };
    });
    
    res.json(quizzesWithClassInfo);
  } catch (err) {
    console.error('Error fetching faculty quizzes:', err);
    res.status(500).json({ error: 'Failed to fetch faculty quizzes.' });
  }
});

export default router;