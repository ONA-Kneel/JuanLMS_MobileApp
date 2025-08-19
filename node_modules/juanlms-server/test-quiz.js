// Test script for quiz functionality
import mongoose from 'mongoose';
import Quiz from './models/Quiz.js';
import QuizResponse from './models/QuizResponse.js';
import User from './models/User.js';

// Test database connection
const testDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/juanlms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to test database');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Test quiz creation and submission
const testQuizFlow = async () => {
  try {
    console.log('\n=== TESTING QUIZ FLOW ===');
    
    // Create a test quiz
    const testQuiz = new Quiz({
      title: 'Test Quiz',
      description: 'A test quiz for debugging',
      questions: [
        {
          question: 'What is 2 + 2?',
          type: 'multiple',
          choices: ['3', '4', '5', '6'],
          correctAnswers: ['4'],
          points: 5
        },
        {
          question: 'Is the sky blue?',
          type: 'truefalse',
          correctAnswer: 'True',
          points: 5
        }
      ],
      points: 10,
      timeLimit: 30
    });
    
    await testQuiz.save();
    console.log('Test quiz created:', testQuiz._id);
    
    // Create a test student
    const testStudent = new User({
      userID: 'TEST001',
      firstname: 'Test',
      lastname: 'Student',
      email: 'test@example.com',
      role: 'student'
    });
    
    await testStudent.save();
    console.log('Test student created:', testStudent._id);
    
    // Submit quiz answers
    const testAnswers = [
      { questionId: testQuiz.questions[0]._id, answer: '4' },
      { questionId: testQuiz.questions[1]._id, answer: 'True' }
    ];
    
    const testResponse = new QuizResponse({
      quizId: testQuiz._id,
      studentId: testStudent._id,
      answers: testAnswers,
      score: 10,
      checkedAnswers: [
        { correct: true, studentAnswer: '4', correctAnswer: '4' },
        { correct: true, studentAnswer: 'True', correctAnswer: 'True' }
      ]
    });
    
    await testResponse.save();
    console.log('Test quiz response created:', testResponse._id);
    
    // Test retrieval
    const retrievedResponse = await QuizResponse.findOne({ 
      quizId: testQuiz._id, 
      studentId: testStudent._id 
    });
    
    console.log('\n=== RETRIEVED RESPONSE ===');
    console.log('Response ID:', retrievedResponse._id);
    console.log('Score:', retrievedResponse.score);
    console.log('Answers:', retrievedResponse.answers);
    console.log('Checked Answers:', retrievedResponse.checkedAnswers);
    
    // Clean up test data
    await Quiz.findByIdAndDelete(testQuiz._id);
    await User.findByIdAndDelete(testStudent._id);
    await QuizResponse.findByIdAndDelete(testResponse._id);
    console.log('\nTest data cleaned up');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run tests
const runTests = async () => {
  await testDB();
  await testQuizFlow();
  await mongoose.connection.close();
  console.log('\nTests completed');
};

runTests().catch(console.error);
