import mongoose from 'mongoose';
import Quiz from './models/Quiz.js';
import QuizResponse from './models/QuizResponse.js';

const MONGODB_URI = 'mongodb+srv://Rayhan:webprogrammer123@juanlms.td1v92f.mongodb.net/JuanLMS?retryWrites=true&w=majority&appName=JuanLMS';

async function testQuizViewSimple() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Test 1: Check if quiz exists and has questions
    console.log('\n=== TEST 1: Check Quiz Structure ===');
    const quiz = await Quiz.findById('68a21c3379a2c9a8595cf506');
    if (quiz) {
      console.log('Quiz found:', {
        _id: quiz._id,
        title: quiz.title,
        questions: quiz.questions?.length,
        points: quiz.points
      });
      
      // Check question structure
      if (quiz.questions && quiz.questions.length > 0) {
        console.log('\nQuestion structure:');
        quiz.questions.forEach((q, index) => {
          console.log(`Q${index + 1}:`, {
            type: q.type,
            question: q.question.substring(0, 50) + '...',
            choices: q.choices?.length || 'N/A',
            correctAnswers: q.correctAnswers,
            points: q.points
          });
        });
      }
    }

    // Test 2: Check quiz response
    console.log('\n=== TEST 2: Check Quiz Response ===');
    const response = await QuizResponse.findOne({ 
      quizId: '68a21c3379a2c9a8595cf506',
      studentId: '6860c1d56ba6e32b404eec19'
    });
    
    if (response) {
      console.log('Quiz response found:', {
        score: response.score,
        total: response.total,
        answers: response.answers?.length,
        checkedAnswers: response.checkedAnswers?.length
      });
      
      // Check answers structure
      if (response.answers && response.answers.length > 0) {
        console.log('\nAnswers structure:');
        response.answers.forEach((answer, index) => {
          console.log(`Answer ${index + 1}:`, {
            answer: answer.answer,
            questionId: answer.questionId
          });
        });
      }
      
      // Check checkedAnswers structure
      if (response.checkedAnswers && response.checkedAnswers.length > 0) {
        console.log('\nCheckedAnswers structure:');
        response.checkedAnswers.forEach((check, index) => {
          console.log(`Checked ${index + 1}:`, {
            correct: check.correct,
            studentAnswer: check.studentAnswer,
            correctAnswer: check.correctAnswer
          });
        });
      }
    }

    console.log('\n=== TEST COMPLETE ===');
    console.log('If QuizView is still not working, check:');
    console.log('1. Frontend state management');
    console.log('2. Component render logic');
    console.log('3. Navigation parameters');

  } catch (error) {
    console.error('Error testing QuizView:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testQuizViewSimple();
