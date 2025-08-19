// Test script to verify total points calculation
console.log('=== TESTING TOTAL POINTS CALCULATION ===');

// Simulate quiz data structure
const quizData = {
  questions: [
    {
      question: 'What is 2 + 2?',
      points: 5,
      type: 'multiple'
    },
    {
      question: 'What is 3 + 3?',
      points: 3,
      type: 'multiple'
    },
    {
      question: 'What is 4 + 4?',
      points: 2,
      type: 'multiple'
    }
  ],
  points: 100 // Default quiz points
};

// Test the total calculation logic (same as backend)
const total = Array.isArray(quizData.questions)
  ? quizData.questions.reduce((sum, q) => sum + (q.points || 1), 0)
  : 0;

console.log('Quiz data:', {
  questionsLength: quizData.questions?.length,
  individualQuestionPoints: quizData.questions?.map(q => ({ question: q.question.substring(0, 20) + '...', points: q.points })),
  quizDefaultPoints: quizData.points
});

console.log('Calculated total:', total);
console.log('Expected total: 10 (5 + 3 + 2)');
console.log('Test passed:', total === 10);

// Test with missing points (should default to 1)
const quizWithMissingPoints = {
  questions: [
    { question: 'Q1', points: 5 },
    { question: 'Q2' }, // Missing points
    { question: 'Q3', points: 2 }
  ]
};

const totalWithDefaults = Array.isArray(quizWithMissingPoints.questions)
  ? quizWithMissingPoints.questions.reduce((sum, q) => sum + (q.points || 1), 0)
  : 0;

console.log('\nTest with missing points:');
console.log('Calculated total:', totalWithDefaults);
console.log('Expected total: 8 (5 + 1 + 2)');
console.log('Test passed:', totalWithDefaults === 8);

console.log('\n=== ALL TESTS COMPLETED ===');
