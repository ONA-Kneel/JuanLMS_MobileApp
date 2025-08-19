import mongoose from 'mongoose';
import Quiz from './models/Quiz.js';
import Class from './models/Class.js';

const MONGODB_URI = 'mongodb+srv://Rayhan:webprogrammer123@juanlms.td1v92f.mongodb.net/JuanLMS?retryWrites=true&w=majority&appName=JuanLMS';

async function testQuizFetch() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Test 1: Check if there are any quizzes in the database
    console.log('\n=== TEST 1: Check total quizzes ===');
    const totalQuizzes = await Quiz.countDocuments();
    console.log('Total quizzes in database:', totalQuizzes);

    if (totalQuizzes === 0) {
      console.log('No quizzes found in database. This might be the issue.');
      return;
    }

    // Test 2: Check quiz structure
    console.log('\n=== TEST 2: Check quiz structure ===');
    const sampleQuiz = await Quiz.findOne();
    if (sampleQuiz) {
      console.log('Sample quiz structure:');
      console.log('- _id:', sampleQuiz._id);
      console.log('- title:', sampleQuiz.title);
      console.log('- classID:', sampleQuiz.classID);
      console.log('- assignedTo:', sampleQuiz.assignedTo);
      console.log('- questions count:', sampleQuiz.questions?.length);
    }

    // Test 3: Check if there are any classes
    console.log('\n=== TEST 3: Check classes ===');
    const totalClasses = await Class.countDocuments();
    console.log('Total classes in database:', totalClasses);

    if (totalClasses > 0) {
      const sampleClass = await Class.findOne();
      console.log('Sample class structure:');
      console.log('- classID:', sampleClass.classID);
      console.log('- className:', sampleClass.className);
      console.log('- members count:', sampleClass.members?.length);
    }

    // Test 4: Test the quiz query logic
    console.log('\n=== TEST 4: Test quiz query logic ===');
    if (totalClasses > 0) {
      const sampleClass = await Class.findOne();
      const classID = sampleClass.classID;
      console.log('Testing quiz fetch for classID:', classID);

      // Test the old way (classID field)
      const quizzesByClassID = await Quiz.find({ classID: classID });
      console.log('Quizzes found by classID field:', quizzesByClassID.length);

      // Test the new way (assignedTo.classID field)
      const quizzesByAssignedTo = await Quiz.find({ 'assignedTo.classID': classID });
      console.log('Quizzes found by assignedTo.classID field:', quizzesByAssignedTo.length);

      // Test the combined query (what we fixed)
      const quizzesCombined = await Quiz.find({
        $or: [
          { classID: classID },
          { 'assignedTo.classID': classID }
        ]
      });
      console.log('Quizzes found by combined query (fixed):', quizzesCombined.length);

      if (quizzesCombined.length > 0) {
        console.log('Sample quiz from combined query:');
        const quiz = quizzesCombined[0];
        console.log('- title:', quiz.title);
        console.log('- classID:', quiz.classID);
        console.log('- assignedTo:', quiz.assignedTo);
      }
    }

    console.log('\n=== TEST COMPLETE ===');
    console.log('If quizzes are still not showing up, check:');
    console.log('1. Are there quizzes in the database?');
    console.log('2. Do quizzes have the correct classID or assignedTo structure?');
    console.log('3. Are students properly enrolled in classes?');
    console.log('4. Are quizzes posted/scheduled correctly?');

  } catch (error) {
    console.error('Error testing quiz fetch:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testQuizFetch();
