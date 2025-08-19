// Migration script to fix existing quiz responses
import mongoose from 'mongoose';
import Quiz from './models/Quiz.js';
import QuizResponse from './models/QuizResponse.js';

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/juanlms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to database for migration');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Migrate existing quiz responses
const migrateQuizResponses = async () => {
  try {
    console.log('\n=== STARTING MIGRATION ===');
    
    // Find all quiz responses
    const responses = await QuizResponse.find({});
    console.log(`Found ${responses.length} quiz responses to migrate`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const response of responses) {
      try {
        console.log(`\nProcessing response ${response._id} for quiz ${response.quizId}`);
        
        // Get the quiz to access questions
        const quiz = await Quiz.findById(response.quizId);
        if (!quiz) {
          console.log(`Quiz ${response.quizId} not found, skipping response ${response._id}`);
          continue;
        }
        
        // Check if checkedAnswers needs regeneration
        if (!response.checkedAnswers || response.checkedAnswers.length === 0) {
          console.log(`Regenerating checkedAnswers for response ${response._id}`);
          
          const regeneratedCheckedAnswers = [];
          quiz.questions.forEach((q, i) => {
            const studentAnswer = response.answers[i]?.answer;
            let correct = false;
            let correctAnswerForStorage;
            
            if (q.type === 'multiple') {
              if (Array.isArray(q.correctAnswers) && q.correctAnswers.length > 0) {
                if (Array.isArray(studentAnswer)) {
                  correct = studentAnswer.length === q.correctAnswers.length &&
                    studentAnswer.every(a => q.correctAnswers.includes(a));
                } else {
                  correct = q.correctAnswers.includes(studentAnswer);
                }
                correctAnswerForStorage = q.correctAnswers;
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
            
            regeneratedCheckedAnswers.push({ 
              correct, 
              studentAnswer, 
              correctAnswer: correctAnswerForStorage 
            });
          });
          
          // Update the response
          await QuizResponse.findByIdAndUpdate(response._id, { 
            checkedAnswers: regeneratedCheckedAnswers 
          });
          
          console.log(`Updated response ${response._id} with regenerated checkedAnswers`);
          migratedCount++;
        } else {
          console.log(`Response ${response._id} already has checkedAnswers, skipping`);
        }
        
      } catch (error) {
        console.error(`Error processing response ${response._id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`\n=== MIGRATION COMPLETED ===`);
    console.log(`Successfully migrated: ${migratedCount} responses`);
    console.log(`Errors: ${errorCount} responses`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

// Run migration
const runMigration = async () => {
  await connectDB();
  await migrateQuizResponses();
  await mongoose.connection.close();
  console.log('\nMigration completed');
};

runMigration().catch(console.error);
