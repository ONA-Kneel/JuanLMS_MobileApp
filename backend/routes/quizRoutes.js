//quiz routes

import express from 'express';
import User from '../models/User.js';
import Quiz from '../models/Quiz.js';
import Class from '../models/Class.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cloudinary from '../utils/cloudinary.js';
import QuizResponse from '../models/QuizResponse.js';
import PostedGrades from '../models/PostedGrades.js';
// import { authenticateToken } from '../middleware/authMiddleware.js';
import seedrandom from 'seedrandom';
import { createQuizNotification } from '../services/notificationService.js';

const router = express.Router();

// Multer setup for quiz images (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

// Upload quiz image
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      const uploadDir = 'uploads/quiz-images';
      const fs = require('fs');
      const path = require('path');
      fs.mkdirSync(uploadDir, { recursive: true });
      const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(req.file.originalname) || '.png';
      const filename = unique + ext;
      const filepath = path.join(uploadDir, filename);
      fs.writeFileSync(filepath, req.file.buffer);
      return res.json({ url: `/uploads/quiz-images/${filename}` });
    }
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: 'juanlms/quiz-images', resource_type: 'image' }, (err, r) => {
        if (err) return reject(err);
        resolve(r);
      });
      stream.end(req.file.buffer);
    });
    res.json({ url: result.secure_url });
  } catch (err) {
    console.error('Quiz image upload error:', err);
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(500).json({ error: 'Cloudinary not configured on server' });
    }
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Create a new quiz
router.post('/', /*authenticateToken,*/ async (req, res) => {
  // if (req.user.role !== 'faculty') return res.status(403).json({ error: 'Forbidden' });
  try {
    const quiz = new Quiz(req.body);
    await quiz.save();
    
    // Create notifications for students in the class(es)
    try {
      if (quiz.classID) {
        await createQuizNotification(quiz.classID, quiz);
      } else if (quiz.assignedTo && Array.isArray(quiz.assignedTo)) {
        for (const assignment of quiz.assignedTo) {
          if (assignment.classID) {
            await createQuizNotification(assignment.classID, quiz);
          }
        }
      }
    } catch (notificationError) {
      console.error('Error creating quiz notifications:', notificationError);
      // Don't fail the quiz creation if notification creation fails
    }

    // Emit real-time events to all users in the class(es)
    try {
      const io = req.app.get('io');
      if (io) {
        if (quiz.classID) {
          io.to(`class-${quiz.classID}`).emit('newQuiz', {
            classID: quiz.classID,
            quiz: {
              _id: quiz._id,
              title: quiz.title,
              description: quiz.description,
              instructions: quiz.instructions,
              type: quiz.type,
              dueDate: quiz.dueDate,
              points: quiz.points,
              questions: quiz.questions,
              timing: quiz.timing,
              questionBehaviour: quiz.questionBehaviour,
              safeExamBrowser: quiz.safeExamBrowser,
              grading: quiz.grading,
              attachmentLink: quiz.attachmentLink,
              attachmentFile: quiz.attachmentFile,
              postAt: quiz.postAt,
              createdAt: quiz.createdAt,
              classID: quiz.classID
            }
          });
          console.log(`[Real-time] Emitted newQuiz event to class ${quiz.classID}`);
        } else if (quiz.assignedTo && Array.isArray(quiz.assignedTo)) {
          for (const assignment of quiz.assignedTo) {
            if (assignment.classID) {
              io.to(`class-${assignment.classID}`).emit('newQuiz', {
                classID: assignment.classID,
                quiz: {
                  _id: quiz._id,
                  title: quiz.title,
                  description: quiz.description,
                  instructions: quiz.instructions,
                  type: quiz.type,
                  dueDate: quiz.dueDate,
                  points: quiz.points,
                  questions: quiz.questions,
                  timing: quiz.timing,
                  questionBehaviour: quiz.questionBehaviour,
                  safeExamBrowser: quiz.safeExamBrowser,
                  grading: quiz.grading,
                  attachmentLink: quiz.attachmentLink,
                  attachmentFile: quiz.attachmentFile,
                  postAt: quiz.postAt,
                  createdAt: quiz.createdAt,
                  classID: assignment.classID
                }
              });
              console.log(`[Real-time] Emitted newQuiz event to class ${assignment.classID}`);
            }
          }
        }
      }
    } catch (socketError) {
      console.error('Error emitting quiz socket event:', socketError);
      // Don't fail the quiz creation if socket emission fails
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
    
    console.log('=== QUIZ SUBMISSION RECEIVED ===');
    console.log('Quiz ID:', quizId);
    console.log('Student ID:', studentId);
    console.log('Received answers:', JSON.stringify(answers, null, 2));
    console.log('Answers array length:', answers.length);
    console.log('Answers structure:', answers.map((a, i) => ({ index: i, questionId: a.questionId, answer: a.answer })));
    
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

    // Helpers to normalize diverse client answers into comparable forms
    const toLowerTrim = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v);
    const coerceBoolean = (v) => {
      if (typeof v === 'boolean') return v;
      const s = String(v).trim().toLowerCase();
      if (s === 'true' || s === 't' || s === '1' || s === 'yes') return true;
      if (s === 'false' || s === 'f' || s === '0' || s === 'no') return false;
      return v;
    };
    const mapTextAnswersToIndices = (studentAns, choices) => {
      if (!Array.isArray(choices) || choices.length === 0) return studentAns;
      const normChoices = choices.map(c => toLowerTrim(String(c)));
      if (Array.isArray(studentAns)) {
        return studentAns.map(a => {
          const idx = normChoices.indexOf(toLowerTrim(String(a)));
          return idx >= 0 ? idx : a;
        });
      }
      const idx = normChoices.indexOf(toLowerTrim(String(studentAns)));
      return idx >= 0 ? idx : studentAns;
    };
    const caseInsensitiveEqual = (a, b) => toLowerTrim(String(a)) === toLowerTrim(String(b));
    
    // Process each question and answer
    quiz.questions.forEach((q, i) => {
      console.log(`\n--- Processing Question ${i + 1} ---`);
      console.log('Question data:', {
        id: q._id,
        type: q.type,
        text: q.question,
        choices: q.choices,
        correctAnswers: q.correctAnswers,
        correctAnswer: q.correctAnswer
      });
      
      // Find the corresponding answer for this question by matching questionId (robust)
      let questionAnswer = answers.find(a => String(a?.questionId) === String(q._id));
      let studentAnswer = questionAnswer?.answer;
      // Fallback: if not found, try positional index
      if (studentAnswer === undefined && i < answers.length) {
        studentAnswer = answers[i]?.answer;
      }
      
      console.log('Question answer found:', questionAnswer);
      console.log('Student answer for this question:', studentAnswer);
      
      let correct = false;
      let correctAnswerForStorage;
      
      if (q.type === 'multiple') {
        // For multiple choice questions
        if (Array.isArray(q.correctAnswers) && q.correctAnswers.length > 0) {
          console.log('Multiple choice question - correct answers (indices):', q.correctAnswers);
          console.log('Student answer:', studentAnswer);
          
          // Check if student answer matches any of the correct answers
          // Accept either indices or choice texts from clients
          const normalizedStudent = mapTextAnswersToIndices(studentAnswer, q.choices);
          if (Array.isArray(normalizedStudent)) {
            correct = normalizedStudent.length === q.correctAnswers.length &&
              normalizedStudent.every(a => q.correctAnswers.includes(a));
            console.log('Student answer is array, checking length and content match');
          } else {
            correct = q.correctAnswers.includes(normalizedStudent);
            console.log('Student answer is single value, checking if in correct answers');
          }
          
          // Store the actual correct answer TEXT values for frontend highlighting
          // q.correctAnswers contains indices, so convert them to actual choice text
          correctAnswerForStorage = q.correctAnswers.map(index => q.choices[index]).filter(Boolean);
          console.log('Correct answer text values for storage:', correctAnswerForStorage);
        } else {
          correct = false;
          correctAnswerForStorage = [];
          console.log('No correct answers defined for multiple choice question');
        }
      } else if (q.type === 'truefalse') {
        // For true/false questions
        console.log('True/false question - correct answer:', q.correctAnswer);
        console.log('Student answer:', studentAnswer);
        // Accept booleans or strings
        const normStudent = coerceBoolean(studentAnswer);
        const normCorrect = coerceBoolean(q.correctAnswer);
        correct = normStudent === normCorrect;
        correctAnswerForStorage = q.correctAnswer;
      } else {
        // For identification questions
        console.log('Identification question - correct answer:', q.correctAnswer);
        console.log('Student answer:', studentAnswer);
        // Case/space-insensitive comparison for text identification
        if (studentAnswer == null || q.correctAnswer == null) {
          correct = false;
        } else {
          correct = caseInsensitiveEqual(studentAnswer, q.correctAnswer);
        }
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
    console.log('=== FINAL SUBMISSION DEBUG ===');
    console.log('Total score calculated:', score);
    console.log('Checked answers:', checkedAnswers);
    console.log('Final answers to save:', answers);
    
    const response = new QuizResponse({ 
      quizId, 
      studentId, 
      answers, 
      score, 
      checkedAnswers 
    });
    
    await response.save();
    console.log('Quiz response saved successfully with ID:', response._id);
    
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

// Mark all quiz responses as graded (for faculty convenience)
router.patch('/:quizId/responses/mark-all-graded', /*authenticateToken,*/ async (req, res) => {
  // if (req.user.role !== 'faculty') return res.status(403).json({ error: 'Forbidden' });
  try {
    const { quizId } = req.params;
    
    // Update all responses for this quiz to mark them as graded
    const result = await QuizResponse.updateMany(
      { quizId },
      { 
        graded: true,
        updatedAt: new Date()
      }
    );
    
    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} responses as graded`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH a quiz response's score by responseId
router.patch('/:quizId/responses/:responseId', /*authenticateToken,*/ async (req, res) => {
  // if (req.user.role !== 'faculty') return res.status(403).json({ error: 'Forbidden' });
  try {
    const { responseId } = req.params;
    const { score, feedback } = req.body;
    
    // Validate score - allow 0 as a valid score since students may not pass anything
    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ 
        error: 'Score must be a non-negative number. Zero is a valid score for students who did not pass anything.' 
      });
    }
    
    const updateData = { 
      score, 
      graded: true,
      updatedAt: new Date()
    };
    
    if (feedback !== undefined) {
      updateData.feedback = feedback;
    }
    
    const updated = await QuizResponse.findByIdAndUpdate(responseId, updateData, { new: true });
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
          const found = Array.isArray(response.answers)
            ? response.answers.find(a => String(a?.questionId) === String(q._id))
            : null;
          let studentAnswer = found?.answer;
          if (studentAnswer === undefined) studentAnswer = response.answers?.[i]?.answer;
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
              const toLowerTrim = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v);
              const normChoices = (q.choices || []).map(c => toLowerTrim(String(c)));
              const mapToIndex = (ans) => {
                if (Array.isArray(ans)) return ans.map(a => {
                  const idx = normChoices.indexOf(toLowerTrim(String(a))); return idx >= 0 ? idx : a;
                });
                const idx = normChoices.indexOf(toLowerTrim(String(ans))); return idx >= 0 ? idx : ans;
              };
              const normalized = mapToIndex(studentAnswer);
              if (Array.isArray(normalized)) {
                correct = normalized.length === q.correctAnswers.length &&
                  normalized.every(a => q.correctAnswers.includes(a));
              } else {
                correct = q.correctAnswers.includes(normalized);
              }
              // Convert indices to actual answer text for frontend highlighting
              correctAnswerForStorage = q.correctAnswers.map(index => q.choices[index]).filter(Boolean);
            } else {
              correct = false;
              correctAnswerForStorage = [];
            }
          } else if (q.type === 'truefalse') {
            const coerceBoolean = (v) => {
              if (typeof v === 'boolean') return v;
              const s = String(v).trim().toLowerCase();
              if (s === 'true' || s === 't' || s === '1' || s === 'yes') return true;
              if (s === 'false' || s === 'f' || s === '0' || s === 'no') return false;
              return v;
            };
            correct = coerceBoolean(studentAnswer) === coerceBoolean(q.correctAnswer);
            correctAnswerForStorage = q.correctAnswer;
          } else {
            const toLowerTrim = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v);
            if (studentAnswer == null || q.correctAnswer == null) {
              correct = false;
            } else {
              correct = toLowerTrim(studentAnswer) === toLowerTrim(q.correctAnswer);
            }
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
        className: classInfo ? classInfo.className : null,
        classCode: classInfo ? classInfo.classCode : 'N/A'
      };
    });
    
    res.json(quizzesWithClassInfo);
  } catch (err) {
    console.error('Error fetching faculty quizzes:', err);
    res.status(500).json({ error: 'Failed to fetch faculty quizzes.' });
  }
});

// Get posted grades for a specific student
router.get('/student-posted-grades', async (req, res) => {
  try {
    const { studentId, classId, section } = req.query;

    // Validate required fields
    if (!studentId || !classId || !section) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: studentId, classId, section'
      });
    }

    console.log('🔍 Fetching posted grades for student:', { 
      studentId, 
      classId, 
      section,
      studentIdType: typeof studentId,
      studentIdValue: studentId
    });

    // Search through database for posted quarterly grades for this student
    const studentGrades = [];
    
    try {
      // Find all posted grades for this class and section
      const postedGradesRecords = await PostedGrades.find({
        classId: classId,
        section: section
      }).sort({ quarter: 1, postedAt: -1 });

      console.log(`🔍 Found ${postedGradesRecords.length} posted grade records for class ${classId}, section ${section}`);

      for (const postedGradesRecord of postedGradesRecords) {
        console.log(`🔍 Checking quarter ${postedGradesRecord.quarter}:`, {
          totalStudents: postedGradesRecord.grades.length,
          studentIds: postedGradesRecord.grades.map(g => g.studentId.toString())
        });

        // Find the specific student's grades
        const studentGrade = postedGradesRecord.grades.find(grade => {
          const gradeStudentId = grade.studentId.toString();
          const queryStudentId = studentId.toString();
          console.log(`🔍 Comparing student IDs: ${gradeStudentId} === ${queryStudentId}`);
          return gradeStudentId === queryStudentId;
        });

        if (studentGrade) {
          studentGrades.push({
            quarter: postedGradesRecord.quarter,
            quarterlyGrade: studentGrade.quarterlyGrade,
            termFinalGrade: studentGrade.termFinalGrade,
            remarks: studentGrade.remarks,
            postedAt: postedGradesRecord.postedAt
          });
          console.log(`✅ Found grades for student ${studentId} in ${postedGradesRecord.quarter}:`, studentGrade);
        } else {
          console.log(`⚠️ Student ${studentId} not found in ${postedGradesRecord.quarter} grades`);
        }
      }
    } catch (dbError) {
      console.error('❌ Error fetching from database:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch grades from database',
        error: dbError.message
      });
    }
    
    if (studentGrades.length > 0) {
      console.log('✅ Found posted grades for student:', studentGrades);
      
      // Transform the grades into the format expected by frontend
      const transformedGrades = {
        studentId: studentId,
        grades: {}
      };
      
      studentGrades.forEach(grade => {
        transformedGrades.grades[grade.quarter] = {
          quarterlyGrade: grade.quarterlyGrade,
          termFinalGrade: grade.termFinalGrade,
          remarks: grade.remarks
        };
      });
      
      res.json({
        success: true,
        message: 'Posted grades found',
        data: {
          studentId,
          classId,
          section,
          grades: [transformedGrades] // Wrap in array as expected by frontend
        }
      });
    } else {
      console.log('❌ No posted grades found for student:', { studentId, classId, section });
      res.json({
        success: true,
        message: 'No posted grades found',
        data: {
          studentId,
          classId,
          section,
          grades: []
        }
      });
    }

  } catch (error) {
    console.error('❌ Error in student-posted-grades endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;