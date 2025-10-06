import express from 'express';
import mongoose from 'mongoose';
import Submission from '../models/Submission.js';
import QuizResponse from '../models/QuizResponse.js';
import Class from '../models/Class.js';
import Assignment from '../models/Assignment.js';
import Quiz from '../models/Quiz.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper: resolve various student identifiers (ObjectId, schoolID, userID) to Mongo ObjectId
async function resolveStudentObjectId(rawId) {
  try {
    if (mongoose.Types.ObjectId.isValid(rawId)) {
      return new mongoose.Types.ObjectId(rawId);
    }
  } catch {}
  // Try by schoolID
  let user = await User.findOne({ schoolID: rawId }).select('_id');
  if (user) return user._id;
  // Try by userID
  user = await User.findOne({ userID: rawId }).select('_id');
  if (user) return user._id;
  return null;
}

// Test route to verify grades router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Grades router is working!', timestamp: new Date().toISOString() });
});

// Get grades for a specific student in a specific class
router.get('/student/:studentId', /*authenticateToken,*/ async (req, res) => {
  try {
    const { studentId } = req.params;
    const { classId, academicYear, termName } = req.query;

    // Soft-guard: if classId missing, return empty list instead of 500 to avoid UI "Failed to load"
    if (!classId) {
      return res.json([]);
    }

    // Resolve student identifier to Mongo ObjectId
    const studentObjectId = await resolveStudentObjectId(studentId);
    if (!studentObjectId) {
      return res.json([]);
    }

    // Fetch assignments for the class
    const assignments = await Assignment.find({ classID: classId });
    const assignmentIds = assignments.map(a => a._id);
    
    // Fetch assignment submissions and grades
    const submissions = await Submission.find({ 
      student: studentObjectId, 
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
      studentId: studentObjectId, 
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

// Get semestral grades for a student (mobile app endpoint)
router.get('/semestral-grades/student/:studentId', async (req, res) => {
  try {
    console.log('=== SEMESTRAL GRADES ENDPOINT CALLED ===');
    console.log('Student ID:', req.params.studentId);
    console.log('Request headers:', req.headers);
    
    const { studentId } = req.params;
    const studentObjectId = await resolveStudentObjectId(studentId);
    if (!studentObjectId) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    
    // Get student info
    try {
      const student = await User.findById(studentObjectId);
      console.log('Student found:', student ? 'Yes' : 'No');
      if (!student) {
        console.log('Student not found, returning 404');
        return res.status(404).json({ error: 'Student not found.' });
      }
    } catch (dbError) {
      console.error('Database error finding student:', dbError);
      return res.status(500).json({ error: 'Database error finding student.' });
    }

    // Get all classes where the student is enrolled
    let classes;
    try {
      classes = await Class.find({
        $or: [
          { students: studentObjectId },
          { 'students.studentID': studentId },
          { 'students.userID': studentId }
        ]
      });

      console.log('Classes found for student:', classes.length);
      console.log('Class IDs:', classes.map(c => c.classID));

      if (classes.length === 0) {
        console.log('No classes found, returning empty grades array');
        return res.json({ grades: [] });
      }
    } catch (dbError) {
      console.error('Database error finding classes:', dbError);
      return res.status(500).json({ error: 'Database error finding classes.' });
    }

    const allGrades = [];

    // Process each class
    for (const classInfo of classes) {
      try {
        // Get assignments for this class
        const assignments = await Assignment.find({ classID: classInfo.classID });
        const assignmentIds = assignments.map(a => a._id);
        
        // Get assignment submissions and grades
        const submissions = await Submission.find({ 
          student: studentObjectId, 
          assignment: { $in: assignmentIds } 
        }).populate('assignment', 'title points dueDate');
        
        // Get quizzes for this class
        const quizzes = await Quiz.find({ 
          $or: [
            { classID: classInfo.classID },
            { classIDs: classInfo.classID }
          ]
        });
        const quizIds = quizzes.map(q => q._id);
        
        // Get quiz responses and grades
        const quizResponses = await QuizResponse.find({ 
          studentId: studentObjectId, 
          quizId: { $in: quizIds } 
        }).populate('quizId', 'title questions');
        
        // Check if student has any grades for this class
        const hasGrades = submissions.some(s => s.grade !== undefined) || 
                         quizResponses.some(r => r.score !== undefined);
        
        if (hasGrades) {
          // Calculate class grades when grades exist
          let totalPoints = 0;
          let earnedPoints = 0;
          let assignmentCount = 0;
          let quizCount = 0;
          
          // Process assignment grades
          submissions.forEach(submission => {
            if (submission.assignment && submission.grade !== undefined) {
              totalPoints += submission.assignment.points || 0;
              earnedPoints += submission.grade || 0;
              assignmentCount++;
            }
          });
          
          // Process quiz grades
          quizResponses.forEach(response => {
            if (response.quizId && response.score !== undefined) {
              const quizTotal = response.quizId.questions.reduce((sum, q) => sum + (q.points || 1), 0);
              totalPoints += quizTotal;
              earnedPoints += response.score || 0;
              quizCount++;
            }
          });
          
          // Calculate average grade
          const averageGrade = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
          
          // Determine remarks based on average
          let remarks = 'PASSED';
          if (averageGrade < 75) {
            remarks = 'FAILED';
          } else if (averageGrade < 80) {
            remarks = 'Conditional';
          }
          
          // Add class grade to allGrades
          allGrades.push({
            subjectCode: classInfo.subjectCode || classInfo.classCode || 'N/A',
            subjectName: classInfo.className || classInfo.subjectName || 'Unknown Subject',
            academicYear: classInfo.academicYear || '2024-2025',
            termName: classInfo.termName || 'Term 1',
            grades: {
              quarter1: assignmentCount > 0 ? Math.round(averageGrade) : '-',
              quarter2: quizCount > 0 ? Math.round(averageGrade) : '-',
              quarter3: '-',
              quarter4: '-',
              semesterFinal: Math.round(averageGrade),
              remarks: remarks
            }
          });
        } else {
          // Add class with "No grades yet" status
          allGrades.push({
            subjectCode: classInfo.subjectCode || classInfo.classCode || 'N/A',
            subjectName: classInfo.className || classInfo.subjectName || 'Unknown Subject',
            academicYear: classInfo.academicYear || '2024-2025',
            termName: classInfo.termName || 'Term 1',
            grades: {
              quarter1: 'No grades yet',
              quarter2: 'No grades yet',
              quarter3: 'No grades yet',
              quarter4: 'No grades yet',
              semesterFinal: 'No grades yet',
              remarks: 'No grades yet'
            }
          });
        }
        
      } catch (classError) {
        console.error(`Error processing class ${classInfo.classID}:`, classError);
        // Continue with other classes
      }
    }
    
    console.log('Sending response with grades:', allGrades.length);
    res.json({ success: true, grades: allGrades });
    
  } catch (err) {
    console.error('Error fetching semestral grades:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ success: false, error: 'Failed to fetch semestral grades.' });
  }
});

// Get comprehensive student data for a section (for principal grades management)
// This endpoint matches the web app's proven implementation
router.get('/class/all/section/:sectionName/comprehensive', authenticateToken, async (req, res) => {
  try {
    console.log('=== COMPREHENSIVE SECTION ENDPOINT CALLED ===');
    const { sectionName } = req.params;
    const { trackName, strandName, gradeLevel, schoolYear, termName } = req.query;
    
    console.log('Section:', sectionName);
    console.log('Track:', trackName);
    console.log('Strand:', strandName);
    console.log('Grade Level:', gradeLevel);
    console.log('School Year:', schoolYear);
    console.log('Term:', termName);
    
    // Use the same approach as web app - try multiple data sources
    let students = [];
    
    // Method 1: Try to get students from sections API (like web app)
    try {
      const sectionsResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/api/sections?schoolYear=${encodeURIComponent(schoolYear)}&termName=${encodeURIComponent(termName)}`, {
        headers: { Authorization: req.headers.authorization }
      });
      
      if (sectionsResponse.ok) {
        const sectionsData = await sectionsResponse.json();
        const matchingSections = Array.isArray(sectionsData) ? sectionsData.filter(s => 
          s.sectionName === sectionName && 
          s.gradeLevel === gradeLevel
        ) : [];
        
        if (matchingSections.length > 0) {
          // Get students from the matching section
          const studentsResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/users/students/by-section?sectionName=${encodeURIComponent(sectionName)}&termName=${encodeURIComponent(termName)}&schoolYear=${encodeURIComponent(schoolYear)}`, {
            headers: { Authorization: req.headers.authorization }
          });
          
          if (studentsResponse.ok) {
            const studentsData = await studentsResponse.json();
            students = Array.isArray(studentsData) ? studentsData : [];
          }
        }
      }
    } catch (error) {
      console.log('Sections API approach failed:', error.message);
    }
    
    // Method 2: Try to get students from semestral grades (like web app)
    if (students.length === 0) {
      try {
        const gradesResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/api/semestral-grades/principal-view?gradeLevel=${encodeURIComponent(gradeLevel)}&strand=${encodeURIComponent(strandName)}&section=${encodeURIComponent(sectionName)}&termName=${encodeURIComponent(termName)}&academicYear=${encodeURIComponent(schoolYear)}`, {
          headers: { Authorization: req.headers.authorization }
        });
        
        if (gradesResponse.ok) {
          const gradesData = await gradesResponse.json();
          if (gradesData.success && gradesData.students) {
            students = gradesData.students;
          }
        }
      } catch (error) {
        console.log('Semestral grades approach failed:', error.message);
      }
    }
    
    // Method 3: Fallback to direct database query (like web app)
    if (students.length === 0) {
      try {
        // Find classes that match the criteria
        const classQuery = {
          section: sectionName,
          academicYear: schoolYear,
          termName: termName
        };
        
        if (gradeLevel) classQuery.gradeLevel = gradeLevel;
        if (strandName) classQuery.strand = strandName;
        
        const classes = await Class.find(classQuery);
        console.log('Found classes:', classes.length);
        
        if (classes.length > 0) {
          // Get all unique students from these classes
          const allStudents = new Map();
          
          for (const classInfo of classes) {
            if (classInfo.students && Array.isArray(classInfo.students)) {
              for (const student of classInfo.students) {
                let studentId, studentName, userID;
                
                if (typeof student === 'string') {
                  studentId = student;
                  userID = student;
                } else if (student._id) {
                  studentId = student._id;
                  userID = student.userID || student.studentID || student._id;
                  studentName = student.name || student.studentName || 
                               `${student.firstname || ''} ${student.lastname || ''}`.trim();
                } else {
                  studentId = student.studentID || student.userID || student.id;
                  userID = student.userID || student.studentID || student.id;
                  studentName = student.name || student.studentName || 
                               `${student.firstname || ''} ${student.lastname || ''}`.trim();
                }
                
                if (studentId && !allStudents.has(studentId)) {
                  allStudents.set(studentId, {
                    _id: studentId,
                    userID: userID,
                    studentID: userID,
                    name: studentName,
                    studentName: studentName,
                    firstname: student.firstname || '',
                    lastname: student.lastname || '',
                    section: sectionName,
                    gradeLevel: gradeLevel,
                    strand: strandName
                  });
                }
              }
            }
          }
          
          students = Array.from(allStudents.values());
          
          // Fetch names from User collection if needed
          const studentsNeedingNames = students.filter(s => !s.name && !s.studentName);
          if (studentsNeedingNames.length > 0) {
            for (const student of studentsNeedingNames) {
              try {
                const userDoc = await User.findById(student._id).select('firstname lastname userID schoolID');
                if (userDoc) {
                  student.name = `${userDoc.firstname || ''} ${userDoc.lastname || ''}`.trim();
                  student.studentName = student.name;
                  student.firstname = userDoc.firstname || '';
                  student.lastname = userDoc.lastname || '';
                  student.userID = userDoc.userID || student.userID;
                  student.studentID = userDoc.schoolID || userDoc.userID || student.studentID;
                }
              } catch (error) {
                console.log('Error fetching user details for', student._id, ':', error.message);
              }
            }
          }
        }
      } catch (error) {
        console.log('Direct database query failed:', error.message);
      }
    }
    
    console.log('Total students found:', students.length);
    
    res.json({
      success: true,
      data: {
        students: students,
        classes: [] // Not needed for mobile app
      }
    });
    
  } catch (error) {
    console.error('Error in comprehensive section endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch section data'
    });
  }
});

// Get principal view of semestral grades
// This endpoint matches the web app's proven implementation
router.get('/semestral-grades/principal-view', authenticateToken, async (req, res) => {
  try {
    console.log('=== PRINCIPAL VIEW ENDPOINT CALLED ===');
    const { gradeLevel, strand, section, subject, termName, academicYear } = req.query;
    
    console.log('Query params:', { gradeLevel, strand, section, subject, termName, academicYear });
    
    // Only principals can access this endpoint
    if (req.user.role !== 'principal') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Principals only.'
      });
    }

    // Validate required parameters
    if (!gradeLevel || !strand || !section || !subject || !termName || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: gradeLevel, strand, section, subject, termName, academicYear'
      });
    }

    // Use the same approach as web app - try to get from SemestralGrade collection first
    let grades = [];
    let students = [];
    
    try {
      // Try to get grades from SemestralGrade collection (like web app)
      const SemestralGrade = require('../models/SemestralGrade.js');
      
      // Build query to find grades matching the criteria
      const query = {
        termName: termName,
        academicYear: academicYear
      };

      // Try to find grades by subject name or code
      grades = await SemestralGrade.find({
        ...query,
        $or: [
          { subjectName: { $regex: subject, $options: 'i' } },
          { subjectCode: { $regex: subject, $options: 'i' } }
        ]
      }).sort({ studentName: 1 });

      if (grades.length > 0) {
        // Filter grades by section if available in the grade data
        const filteredGrades = grades.filter(grade => 
          !grade.section || grade.section === section
        );

        // Extract unique students
        students = [...new Set(filteredGrades.map(grade => ({
          _id: grade.studentId,
          name: grade.studentName,
          schoolID: grade.schoolID
        })))];

        // Transform grades to match mobile app format
        const transformedGrades = filteredGrades.map(grade => ({
          _id: grade.studentId,
          studentName: grade.studentName,
          schoolID: grade.schoolID,
          grades: {
            quarter1: grade.grades?.quarter1 || '-',
            quarter2: grade.grades?.quarter2 || '-',
            quarter3: grade.grades?.quarter3 || '-',
            quarter4: grade.grades?.quarter4 || '-',
            semesterFinal: grade.grades?.semesterFinal || '-',
            remarks: grade.grades?.remarks || 'No Grades'
          },
          subjectName: grade.subjectName,
          subjectCode: grade.subjectCode,
          section: grade.section || section
        }));

        console.log('Found', transformedGrades.length, 'grades from SemestralGrade collection');
        
        res.json({
          success: true,
          message: `Found ${transformedGrades.length} grade records`,
          grades: transformedGrades,
          students: students,
          filters: {
            gradeLevel,
            strand,
            section,
            subject,
            termName,
            academicYear
          }
        });
        return;
      }
    } catch (error) {
      console.log('SemestralGrade collection approach failed:', error.message);
    }
    
    // Fallback: Try to get from Class collection and calculate grades (like web app)
    try {
      const classQuery = {
        section: section,
        academicYear: academicYear,
        termName: termName
      };
      
      if (gradeLevel) classQuery.gradeLevel = gradeLevel;
      if (strand) classQuery.strand = strand;
      if (subject) {
        classQuery.$or = [
          { subjectName: { $regex: subject, $options: 'i' } },
          { className: { $regex: subject, $options: 'i' } },
          { subjectCode: { $regex: subject, $options: 'i' } }
        ];
      }
      
      const classes = await Class.find(classQuery);
      console.log('Found classes:', classes.length);
      
      const allStudentGrades = [];
      
      for (const classInfo of classes) {
        // Get all students in this class
        const classStudents = classInfo.students || [];
        
        for (const student of classStudents) {
          let studentId, studentName, userID;
          
          if (typeof student === 'string') {
            studentId = student;
            userID = student;
          } else {
            studentId = student._id || student.studentID || student.userID;
            userID = student.userID || student.studentID || student._id;
            studentName = student.name || student.studentName || 
                         `${student.firstname || ''} ${student.lastname || ''}`.trim();
          }
          
          if (studentId) {
            // Try to get student details from User collection
            try {
              const userDoc = await User.findById(studentId).select('firstname lastname userID schoolID');
              if (userDoc) {
                studentName = `${userDoc.firstname || ''} ${userDoc.lastname || ''}`.trim();
                userID = userDoc.userID || userDoc.schoolID || userID;
              }
            } catch (error) {
              console.log('Error fetching user details for', studentId);
            }
            
            // Get grades for this student in this class
            const studentObjectId = await resolveStudentObjectId(studentId);
            if (studentObjectId) {
              // Get assignments and submissions
              const assignments = await Assignment.find({ classID: classInfo.classID });
              const assignmentIds = assignments.map(a => a._id);
              const submissions = await Submission.find({ 
                student: studentObjectId, 
                assignment: { $in: assignmentIds } 
              });
              
              // Get quizzes and responses
              const quizzes = await Quiz.find({ 
                $or: [
                  { classID: classInfo.classID },
                  { classIDs: classInfo.classID }
                ]
              });
              const quizIds = quizzes.map(q => q._id);
              const quizResponses = await QuizResponse.find({ 
                studentId: studentObjectId, 
                quizId: { $in: quizIds } 
              });
              
              // Calculate grades
              let totalPoints = 0;
              let earnedPoints = 0;
              let hasGrades = false;
              
              submissions.forEach(submission => {
                if (submission.grade !== undefined) {
                  const assignment = assignments.find(a => a._id.toString() === submission.assignment.toString());
                  if (assignment) {
                    totalPoints += assignment.points || 0;
                    earnedPoints += submission.grade || 0;
                    hasGrades = true;
                  }
                }
              });
              
              quizResponses.forEach(response => {
                if (response.score !== undefined) {
                  const quiz = quizzes.find(q => q._id.toString() === response.quizId.toString());
                  if (quiz) {
                    const quizTotal = quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0);
                    totalPoints += quizTotal;
                    earnedPoints += response.score || 0;
                    hasGrades = true;
                  }
                }
              });
              
              const averageGrade = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
              let remarks = 'No Grades';
              
              if (hasGrades) {
                if (averageGrade >= 80) {
                  remarks = 'PASSED';
                } else if (averageGrade >= 75) {
                  remarks = 'Conditional';
                } else {
                  remarks = 'FAILED';
                }
              }
              
              allStudentGrades.push({
                _id: studentId,
                studentName: studentName || 'Unknown Student',
                schoolID: userID,
                grades: {
                  quarter1: hasGrades ? Math.round(averageGrade) : '-',
                  quarter2: hasGrades ? Math.round(averageGrade) : '-',
                  quarter3: '-',
                  quarter4: '-',
                  semesterFinal: hasGrades ? Math.round(averageGrade) : '-',
                  remarks: remarks
                },
                subjectName: classInfo.subjectName || classInfo.className,
                subjectCode: classInfo.subjectCode || classInfo.classCode,
                section: section
              });
            }
          }
        }
      }
      
      console.log('Returning', allStudentGrades.length, 'student grades from Class collection');
      res.json({
        success: true,
        data: allStudentGrades
      });
      
    } catch (error) {
      console.log('Class collection approach failed:', error.message);
      
      // If all approaches fail, return empty result
      res.json({
        success: true,
        message: 'No grades found for the specified criteria',
        grades: [],
        students: []
      });
    }
    
  } catch (error) {
    console.error('Error in principal view endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch principal view data'
    });
  }
});

export default router;
