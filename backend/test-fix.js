// Test script to verify the correct answer conversion fix
console.log('=== TESTING CORRECT ANSWER CONVERSION ===');

// Simulate the quiz question structure
const quizQuestion = {
  type: 'multiple',
  question: 'What is 2 + 2?',
  choices: ['3', '4', '5', '6'],
  correctAnswers: [1], // Index 1 = '4'
  points: 5
};

// Test the conversion logic
const correctAnswerForStorage = quizQuestion.correctAnswers.map(index => quizQuestion.choices[index]).filter(Boolean);

console.log('Original quiz question:', {
  type: quizQuestion.type,
  choices: quizQuestion.choices,
  correctAnswers: quizQuestion.correctAnswers
});

console.log('Converted correct answers:', correctAnswerForStorage);
console.log('Expected result: ["4"]');
console.log('Test passed:', JSON.stringify(correctAnswerForStorage) === '["4"]');

// Test with multiple correct answers
const multiChoiceQuestion = {
  type: 'multiple',
  question: 'Which are even numbers?',
  choices: ['1', '2', '3', '4'],
  correctAnswers: [1, 3], // Indices 1 and 3 = '2' and '4'
  points: 5
};

const multiCorrectAnswerForStorage = multiChoiceQuestion.correctAnswers.map(index => multiChoiceQuestion.choices[index]).filter(Boolean);

console.log('\nMultiple choice test:');
console.log('Original correct answers (indices):', multiChoiceQuestion.correctAnswers);
console.log('Converted correct answers (text):', multiCorrectAnswerForStorage);
console.log('Expected result: ["2", "4"]');
console.log('Test passed:', JSON.stringify(multiCorrectAnswerForStorage) === '["2","4"]');

console.log('\n=== ALL TESTS COMPLETED ===');
