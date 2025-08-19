import mongoose from 'mongoose';
import Quiz from './models/Quiz.js';
import QuizResponse from './models/QuizResponse.js';
import User from './models/User.js';

const MONGODB_URI = 'mongodb+srv://Rayhan:webprogrammer123@juanlms.td1v92f.mongodb.net/JuanLMS?retryWrites=true&w=majority&appName=JuanLMS';

async function testQuizView() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Test 1: Check if quiz exists
    console.log('\n=== TEST 1: Check Quiz Data ===');
    const quiz = await Quiz.findById('68a21c3379a2c9a8595cf506'); // Mobile Testing Quiz
    if (quiz) {
      console.log('Quiz found:', {
        _id: quiz._id,
        title: quiz.title,
        questions: quiz.questions?.length,
        points: quiz.points,
        assignedTo: quiz.assignedTo
      });
    } else {
      console.log('Quiz not found!');
      return;
    }

    // Test 2: Check if student exists
    console.log('\n=== TEST 2: Check Student Data ===');
    const student = await User.findById('6860c1d56ba6e32b404eec19'); // Student ID from logs
    if (student) {
      console.log('Student found:', {
        _id: student._id,
        firstname: student.firstname,
        lastname: student.lastname,
        role: student.role,
        userID: student.userID,
        schoolID: student.schoolID
      });
    } else {
      console.log('Student not found!');
      return;
    }

    // Test 3: Check quiz response
    console.log('\n=== TEST 3: Check Quiz Response ===');
    const response = await QuizResponse.findOne({ 
      quizId: '68a21c3379a2c9a8595cf506',
      studentId: '6860c1d56ba6e32b404eec19'
    });
    
    if (response) {
      console.log('Quiz response found:', {
        _id: response._id,
        quizId: response.quizId,
        studentId: response.studentId,
        score: response.score,
        total: response.total,
        answers: response.answers?.length,
        checkedAnswers: response.checkedAnswers?.length,
        submittedAt: response.submittedAt
      });
      
      // Check answers structure
      if (response.answers && Array.isArray(response.answers)) {
        console.log('\nAnswers structure:');
        response.answers.forEach((answer, index) => {
          console.log(`Answer ${index + 1}:`, {
            fullObject: answer,
            keys: Object.keys(answer),
            answer: answer.answer,
            value: answer.value,
            text: answer.text,
            choice: answer.choice
          });
        });
      }
      
      // Check checkedAnswers structure
      if (response.checkedAnswers && Array.isArray(response.checkedAnswers)) {
        console.log('\nCheckedAnswers structure:');
        response.checkedAnswers.forEach((check, index) => {
          console.log(`Checked Answer ${index + 1}:`, {
            fullObject: check,
            keys: Object.keys(check),
            correct: check.correct,
            studentAnswer: check.studentAnswer,
            correctAnswer: check.correctAnswer
          });
        });
      }
    } else {
      console.log('Quiz response not found!');
      return;
    }

    // Test 4: Simulate the myscore endpoint call
    console.log('\n=== TEST 4: Simulate myscore Endpoint ===');
    const total = quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0);
    const percentage = total > 0 ? Math.round((response.score / total) * 100) : 0;
    
    console.log('Calculated values:', {
      score: response.score,
      total: total,
      percentage: percentage,
      questionsCount: quiz.questions.length,
      questionPoints: quiz.questions.map(q => q.points)
    });

    console.log('\n=== TEST COMPLETE ===');
    console.log('If QuizView is not working, check:');
    console.log('1. Quiz data is being fetched correctly');
    console.log('2. Student response data exists and has correct structure');
    console.log('3. Frontend is properly handling the response data');
    console.log('4. Review mode logic is working correctly');

  } catch (error) {
    console.error('Error testing QuizView:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testQuizView();
