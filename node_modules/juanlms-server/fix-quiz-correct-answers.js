import mongoose from 'mongoose';
import Quiz from './models/Quiz.js';

const MONGODB_URI = 'mongodb+srv://Rayhan:webprogrammer123@juanlms.td1v92f.mongodb.net/JuanLMS?retryWrites=true&w=majority&appName=JuanLMS';

async function fixQuizCorrectAnswers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the specific quiz
    const quiz = await Quiz.findById('68a21c3379a2c9a8595cf506');
    if (!quiz) {
      console.log('Quiz not found!');
      return;
    }

    console.log('Found quiz:', quiz.title);
    console.log('Questions before fix:', quiz.questions.length);

    // Fix each question
    let updated = false;
    quiz.questions.forEach((question, index) => {
      console.log(`\nQuestion ${index + 1}:`, {
        type: question.type,
        question: question.question.substring(0, 50) + '...',
        correctAnswers: question.correctAnswers,
        correctAnswer: question.correctAnswer,
        choices: question.choices
      });

      if (question.type === 'multiple' && Array.isArray(question.correctAnswers) && question.correctAnswers.length > 0) {
        // For multiple choice, set correctAnswer to the actual choice text
        if (!question.correctAnswer && question.choices) {
          question.correctAnswer = question.correctAnswers.map(index => question.choices[index]).filter(Boolean);
          updated = true;
          console.log(`Fixed Q${index + 1}: Set correctAnswer to`, question.correctAnswer);
        }
      } else if (question.type === 'truefalse') {
        // For true/false, set correctAnswer if missing
        if (!question.correctAnswer) {
          question.correctAnswer = 'true'; // Default to true, adjust as needed
          updated = true;
          console.log(`Fixed Q${index + 1}: Set correctAnswer to`, question.correctAnswer);
        }
      } else if (question.type === 'identification') {
        // For identification, set correctAnswer if missing
        if (!question.correctAnswer) {
          question.correctAnswer = 'LEGIT!'; // Based on the test data
          updated = true;
          console.log(`Fixed Q${index + 1}: Set correctAnswer to`, question.correctAnswer);
        }
      }
    });

    if (updated) {
      // Save the updated quiz
      await quiz.save();
      console.log('\n✅ Quiz updated successfully!');
      
      // Verify the fix
      const updatedQuiz = await Quiz.findById('68a21c3379a2c9a8595cf506');
      console.log('\nVerification - Questions after fix:');
      updatedQuiz.questions.forEach((q, index) => {
        console.log(`Q${index + 1}:`, {
          type: q.type,
          correctAnswer: q.correctAnswer,
          correctAnswers: q.correctAnswers
        });
      });
    } else {
      console.log('\nNo updates needed.');
    }

  } catch (error) {
    console.error('Error fixing quiz:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixQuizCorrectAnswers();
