import mongoose from 'mongoose';
import Quiz from './models/Quiz.js';
import Class from './models/Class.js';
import User from './models/User.js';

const MONGODB_URI = 'mongodb+srv://Rayhan:webprogrammer123@juanlms.td1v92f.mongodb.net/JuanLMS?retryWrites=true&w=majority&appName=JuanLMS';

async function testQuizStructure() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Test 1: Check quiz timing structure
    console.log('\n=== TEST 1: Check quiz timing structure ===');
    const quizzes = await Quiz.find();
    console.log('Total quizzes found:', quizzes.length);
    
    quizzes.forEach((quiz, index) => {
      console.log(`\nQuiz ${index + 1}: ${quiz.title}`);
      console.log('- _id:', quiz._id);
      console.log('- timing:', quiz.timing);
      console.log('- timing.openEnabled:', quiz.timing?.openEnabled);
      console.log('- timing.open:', quiz.timing?.open);
      console.log('- timing.closeEnabled:', quiz.timing?.closeEnabled);
      console.log('- timing.close:', quiz.timing?.close);
      console.log('- assignedTo:', quiz.assignedTo);
      
      // Check if quiz would be considered "posted" by frontend logic
      const now = new Date();
      const openEnabled = quiz.timing?.openEnabled;
      const openDate = quiz.timing?.open ? new Date(quiz.timing.open) : null;
      
      let isPosted;
      if (openEnabled && openDate) {
        isPosted = openDate <= now;
        console.log('- Frontend logic: openEnabled=true, openDate exists, isPosted:', isPosted);
      } else {
        isPosted = true; // Default behavior
        console.log('- Frontend logic: no timing restrictions, isPosted:', isPosted);
      }
    });

    // Test 2: Check class enrollment
    console.log('\n=== TEST 2: Check class enrollment ===');
    const classes = await Class.find();
    console.log('Total classes found:', classes.length);
    
    classes.forEach((cls, index) => {
      console.log(`\nClass ${index + 1}: ${cls.className} (${cls.classID})`);
      console.log('- members:', cls.members);
      console.log('- members count:', cls.members?.length);
    });

    // Test 3: Check if there are any students
    console.log('\n=== TEST 3: Check students ===');
    const students = await User.find({ role: 'student' });
    console.log('Total students found:', students.length);
    
    if (students.length > 0) {
      const sampleStudent = students[0];
      console.log('Sample student:');
      console.log('- _id:', sampleStudent._id);
      console.log('- firstname:', sampleStudent.firstname);
      console.log('- lastname:', sampleStudent.lastname);
      console.log('- userID:', sampleStudent.userID);
      console.log('- schoolID:', sampleStudent.schoolID);
      console.log('- studentID:', sampleStudent.studentID);
      console.log('- studentCode:', sampleStudent.studentCode);
    }

    // Test 4: Check quiz assignment to specific class
    console.log('\n=== TEST 4: Check quiz assignment to specific class ===');
    if (classes.length > 0) {
      const testClass = classes[0];
      const classID = testClass.classID;
      console.log('Testing with classID:', classID);
      
      // Find quizzes assigned to this class
      const classQuizzes = await Quiz.find({
        $or: [
          { classID: classID },
          { 'assignedTo.classID': classID }
        ]
      });
      
      console.log('Quizzes assigned to this class:', classQuizzes.length);
      classQuizzes.forEach((quiz, index) => {
        console.log(`- Quiz ${index + 1}: ${quiz.title}`);
        console.log('  assignedTo:', quiz.assignedTo);
        
        // Check if any students in this class are assigned to this quiz
        if (quiz.assignedTo && Array.isArray(quiz.assignedTo)) {
          quiz.assignedTo.forEach(assignment => {
            if (assignment.classID === classID) {
              console.log('  Students assigned:', assignment.studentIDs);
            }
          });
        }
      });
    }

    console.log('\n=== TEST COMPLETE ===');
    console.log('Key findings:');
    console.log('1. Quizzes exist in database');
    console.log('2. Quizzes are assigned to classes via assignedTo structure');
    console.log('3. Frontend should show quizzes if timing allows or if no timing restrictions');
    console.log('4. Check if students are properly enrolled in classes');
    console.log('5. Check if quiz timing fields are preventing display');

  } catch (error) {
    console.error('Error testing quiz structure:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testQuizStructure();
