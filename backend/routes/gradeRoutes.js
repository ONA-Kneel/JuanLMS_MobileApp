import express from 'express';
import Submission from '../models/Submission.js';
import QuizResponse from '../models/QuizResponse.js';
import Class from '../models/Class.js';
import Assignment from '../models/Assignment.js';
import Quiz from '../models/Quiz.js';
import User from '../models/User.js';

const router = express.Router();

// Get grades for a specific student in a specific class
router.get('/student/:studentId', /*authenticateToken,*/ async (req, res) => {
  try {
    const { studentId } = req.params;
    const { classId, academicYear, termName } = req.query;

    // Fetch assignments for the class
    const assignments = await Assignment.find({ classID: classId });
    const assignmentIds = assignments.map(a => a._id);
    
    // Fetch assignment submissions and grades
    const submissions = await Submission.find({ 
      student: studentId, 
      assignment: { $in: assignmentIds } 
    }).populate('assignment', 'title points dueDate');
    
    // Fetch quizzes for the class
    const quizzes = await Quiz.find({ 
      $or: [
        { classID: classId },
        { classIDs: classId }
      ]
    });
    const quizIds = quizzes.map(q => q._id);
    
    // Fetch quiz responses and grades
    const quizResponses = await QuizResponse.find({ 
      studentId, 
      quizId: { $in: quizIds } 
    }).populate('quizId', 'title questions');
    
    // Combine and format grades
    const grades = [];
    
    // Add assignment grades
    submissions.forEach(submission => {
      if (submission.assignment) {
        grades.push({
          _id: submission._id,
          type: 'assignment',
          title: submission.assignment.title,
          points: submission.assignment.points || 0,
          score: submission.grade || 0,
          dueDate: submission.assignment.dueDate,
          submittedAt: submission.submittedAt,
          status: submission.status,
          feedback: submission.feedback,
          classId: classId,
          academicYear: academicYear,
          termName: termName
        });
      }
    });
    
    // Add quiz grades
    quizResponses.forEach(response => {
      if (response.quizId) {
        const totalPoints = response.quizId.questions.reduce((sum, q) => sum + (q.points || 1), 0);
        grades.push({
          _id: response._id,
          type: 'quiz',
          title: response.quizId.title,
          points: totalPoints,
          score: response.score || 0,
          dueDate: null, // Quizzes might not have due dates
          submittedAt: response.submittedAt,
          status: response.graded ? 'graded' : 'submitted',
          feedback: response.feedback,
          classId: classId,
          academicYear: academicYear,
          termName: termName
        });
      }
    });
    
    res.json(grades);
  } catch (err) {
    console.error('Error fetching student grades:', err);
    res.status(500).json({ error: 'Failed to fetch student grades.' });
  }
});

// Get all grades for a specific class
router.get('/class/:classId', /*authenticateToken,*/ async (req, res) => {
  try {
    const { classId } = req.params;
    const { academicYear, termName } = req.query;
    
    // Get all students in the class
    const classInfo = await Class.findOne({ classID: classId });
    if (!classInfo) {
      return res.status(404).json({ error: 'Class not found.' });
    }
    
    // Get all assignments for the class
    const assignments = await Assignment.find({ classID: classId });
    const assignmentIds = assignments.map(a => a._id);
    
    // Get all submissions for these assignments
    const submissions = await Submission.find({ 
      assignment: { $in: assignmentIds } 
    }).populate('student', 'firstname lastname userID')
      .populate('assignment', 'title points dueDate');
    
    // Get all quizzes for the class
    const quizzes = await Quiz.find({ 
      $or: [
        { classID: classId },
        { classIDs: classId }
      ]
    });
    const quizIds = quizzes.map(q => q._id);
    
    // Get all quiz responses
    const quizResponses = await QuizResponse.find({ 
      quizId: { $in: quizIds } 
    }).populate('studentId', 'firstname lastname userID')
      .populate('quizId', 'title questions');
    
    // Group grades by student
    const studentGrades = {};
    
    // Process assignment submissions
    submissions.forEach(submission => {
      const studentId = submission.student._id.toString();
      if (!studentGrades[studentId]) {
        studentGrades[studentId] = {
          studentId: studentId,
          studentName: `${submission.student.firstname} ${submission.student.lastname}`,
          userID: submission.student.userID,
          grades: []
        };
      }
      
      if (submission.assignment) {
        studentGrades[studentId].grades.push({
          _id: submission._id,
          type: 'assignment',
          title: submission.assignment.title,
          points: submission.assignment.points || 0,
          score: submission.grade || 0,
          dueDate: submission.assignment.dueDate,
          submittedAt: submission.submittedAt,
          status: submission.status,
          feedback: submission.feedback,
          classId: classId,
          academicYear: academicYear,
          termName: termName
        });
      }
    });
    
    // Process quiz responses
    quizResponses.forEach(response => {
      const studentId = response.studentId._id.toString();
      if (!studentGrades[studentId]) {
        studentGrades[studentId] = {
          studentId: studentId,
          studentName: `${response.studentId.firstname} ${response.studentId.lastname}`,
          userID: response.studentId.userID,
          grades: []
        };
      }
      
      if (response.quizId) {
        const totalPoints = response.quizId.questions.reduce((sum, q) => sum + (q.points || 1), 0);
        studentGrades[studentId].grades.push({
          _id: response._id,
          type: 'quiz',
          title: response.quizId.title,
          points: totalPoints,
          score: response.score || 0,
          dueDate: null,
          submittedAt: response.submittedAt,
          status: response.graded ? 'graded' : 'submitted',
          feedback: response.feedback,
          classId: classId,
          academicYear: academicYear,
          termName: termName
        });
      }
    });
    
    // Convert to array
    const result = Object.values(studentGrades);
    res.json(result);
  } catch (err) {
    console.error('Error fetching class grades:', err);
    res.status(500).json({ error: 'Failed to fetch class grades.' });
  }
});

// Update a grade (for assignments)
router.put('/assignment/:submissionId', /*authenticateToken,*/ async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { score, feedback } = req.body;
    
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found.' });
    }
    
    // Update the grade
    submission.grade = score;
    submission.feedback = feedback;
    submission.status = 'graded';
    
    await submission.save();
    
    res.json(submission);
  } catch (err) {
    console.error('Error updating assignment grade:', err);
    res.status(500).json({ error: 'Failed to update grade.' });
  }
});

// Update a grade (for quizzes)
router.put('/quiz/:responseId', /*authenticateToken,*/ async (req, res) => {
  try {
    const { responseId } = req.params;
    const { score, feedback } = req.body;
    
    const response = await QuizResponse.findById(responseId);
    if (!response) {
      return res.status(404).json({ error: 'Quiz response not found.' });
    }
    
    // Update the grade
    response.score = score;
    response.feedback = feedback;
    response.graded = true;
    
    await response.save();
    
    res.json(response);
  } catch (err) {
    console.error('Error updating quiz grade:', err);
    res.status(500).json({ error: 'Failed to update grade.' });
  }
});

// Get grades summary for a faculty member
router.get('/faculty/:facultyId/summary', /*authenticateToken,*/ async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { academicYear, termName } = req.query;
    
    // Get all classes taught by the faculty member
    const classes = await Class.find({ faculty: facultyId });
    const classIds = classes.map(cls => cls.classID);
    
    // Get all assignments for these classes
    const assignments = await Assignment.find({ classID: { $in: classIds } });
    const assignmentIds = assignments.map(a => a._id);
    
    // Get all submissions for these assignments
    const submissions = await Submission.find({ 
      assignment: { $in: assignmentIds } 
    }).populate('assignment', 'classID points');
    
    // Get all quizzes for these classes
    const quizzes = await Quiz.find({ 
      $or: [
        { classID: { $in: classIds } },
        { classIDs: { $in: classIds } }
      ]
    });
    const quizIds = quizzes.map(q => q._id);
    
    // Get all quiz responses
    const quizResponses = await QuizResponse.find({ 
      quizId: { $in: quizIds } 
    });
    
    // Calculate summary statistics
    const summary = {
      totalClasses: classes.length,
      totalAssignments: assignments.length,
      totalQuizzes: quizzes.length,
      totalSubmissions: submissions.length,
      totalQuizResponses: quizResponses.length,
      gradedSubmissions: submissions.filter(s => s.status === 'graded').length,
      gradedQuizResponses: quizResponses.filter(r => r.graded).length
    };
    
    res.json(summary);
  } catch (err) {
    console.error('Error fetching faculty grades summary:', err);
    res.status(500).json({ error: 'Failed to fetch grades summary.' });
  }
});

export default router;
