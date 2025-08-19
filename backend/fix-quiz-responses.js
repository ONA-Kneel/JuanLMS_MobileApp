import mongoose from 'mongoose';
import Quiz from './models/Quiz.js';
import QuizResponse from './models/QuizResponse.js';

const MONGODB_URI = 'mongodb+srv://Rayhan:webprogrammer123@juanlms.td1v92f.mongodb.net/JuanLMS?retryWrites=true&w=majority&appName=JuanLMS';

async function fixQuizResponses() {
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

    // Find all responses for this quiz
    const responses = await QuizResponse.find({ quizId: '68a21c3379a2c9a8595cf506' });
    console.log(`Found ${responses.length} quiz responses`);

    let updatedCount = 0;
    for (const response of responses) {
      console.log(`\nProcessing response for student: ${response.studentId}`);
      
      // Regenerate checkedAnswers
      const regeneratedCheckedAnswers = [];
      let updated = false;
      
      quiz.questions.forEach((q, i) => {
        const studentAnswer = response.answers[i]?.answer;
        let correct = false;
        let correctAnswerForStorage;
        
        console.log(`Question ${i + 1}:`, {
          type: q.type,
          studentAnswer,
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
        
        const newCheckedAnswer = { 
          correct, 
          studentAnswer, 
          correctAnswer: correctAnswerForStorage 
        };
        
        regeneratedCheckedAnswers.push(newCheckedAnswer);
        
        // Check if this is different from the existing data
        const existing = response.checkedAnswers[i];
        if (!existing || existing.correctAnswer !== correctAnswerForStorage) {
          updated = true;
          console.log(`Will update Q${i + 1}:`, {
            old: existing?.correctAnswer,
            new: correctAnswerForStorage,
            correct
          });
        }
      });
      
      if (updated) {
        // Update the response
        response.checkedAnswers = regeneratedCheckedAnswers;
        await response.save();
        updatedCount++;
        console.log(`✅ Updated response for student ${response.studentId}`);
      } else {
        console.log(`No updates needed for student ${response.studentId}`);
      }
    }

    console.log(`\n🎉 Update complete! Updated ${updatedCount} responses.`);

  } catch (error) {
    console.error('Error fixing quiz responses:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixQuizResponses();
