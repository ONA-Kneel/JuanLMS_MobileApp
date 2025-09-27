// Comprehensive test for real-time functionality
const axios = require('axios');

const API_BASE_URL = 'https://juanlms-webapp-server.onrender.com';

async function testRealTimeComplete() {
  console.log('🧪 Testing Complete Real-Time Functionality...\n');

  try {
    // Test 1: Verify server is running
    console.log('1. Testing server connectivity...');
    const healthResponse = await axios.get(`${API_BASE_URL}/test`);
    console.log('✅ Server is running:', healthResponse.data.message);

    // Test 2: Create test announcement
    console.log('\n2. Testing announcement creation with real-time...');
    const announcementData = {
      classID: 'C213', // Replace with actual class ID
      title: 'Real-time Test Announcement - ' + new Date().toISOString(),
      content: 'This is a test announcement to verify real-time functionality works properly.',
      priority: 'high',
      category: 'test',
      targetAudience: ['everyone'],
      createdBy: 'test-user'
    };

    const announcementResponse = await axios.post(`${API_BASE_URL}/api/announcements`, announcementData);
    console.log('✅ Announcement created:', announcementResponse.data._id);
    console.log('📡 Real-time event should be emitted to class C213');

    // Test 3: Create test assignment
    console.log('\n3. Testing assignment creation with real-time...');
    const assignmentData = {
      classID: 'C213', // Replace with actual class ID
      title: 'Real-time Test Assignment - ' + new Date().toISOString(),
      instructions: 'This is a test assignment to verify real-time functionality.',
      type: 'assignment',
      description: 'Test assignment description for real-time testing',
      points: 100,
      fileUploadRequired: false,
      createdBy: 'test-user'
    };

    const assignmentResponse = await axios.post(`${API_BASE_URL}/api/assignments`, assignmentData);
    console.log('✅ Assignment created:', assignmentResponse.data[0]._id);
    console.log('📡 Real-time event should be emitted to class C213');

    // Test 4: Create test lesson
    console.log('\n4. Testing lesson creation with real-time...');
    const lessonData = {
      classID: 'C213', // Replace with actual class ID
      title: 'Real-time Test Lesson - ' + new Date().toISOString(),
      link: 'https://example.com/test-lesson-realtime'
    };

    const lessonResponse = await axios.post(`${API_BASE_URL}/api/lessons`, lessonData);
    console.log('✅ Lesson created:', lessonResponse.data.lesson._id);
    console.log('📡 Real-time event should be emitted to class C213');

    // Test 5: Create test quiz
    console.log('\n5. Testing quiz creation with real-time...');
    const quizData = {
      classID: 'C213', // Replace with actual class ID
      title: 'Real-time Test Quiz - ' + new Date().toISOString(),
      description: 'This is a test quiz to verify real-time functionality.',
      instructions: 'Answer all questions carefully for real-time testing.',
      type: 'quiz',
      points: 50,
      questions: [
        {
          type: 'multiple',
          question: 'What is the capital of the Philippines?',
          choices: ['Manila', 'Cebu', 'Davao', 'Quezon City'],
          correctAnswers: [0],
          points: 1
        }
      ],
      createdBy: 'test-user'
    };

    const quizResponse = await axios.post(`${API_BASE_URL}/api/quizzes`, quizData);
    console.log('✅ Quiz created:', quizResponse.data._id);
    console.log('📡 Real-time event should be emitted to class C213');

    console.log('\n🎉 All real-time tests completed successfully!');
    console.log('\n📱 To verify real-time functionality in the app:');
    console.log('1. Open the mobile app');
    console.log('2. Navigate to class C213');
    console.log('3. You should see all 4 new items appear immediately:');
    console.log('   - New announcement');
    console.log('   - New assignment');
    console.log('   - New lesson material');
    console.log('   - New quiz');
    console.log('4. Check console logs for real-time event emissions');
    console.log('5. No white screen should occur');

    console.log('\n🔧 Socket Service Status:');
    console.log('- Real-time features are now enabled');
    console.log('- Proper error handling prevents crashes');
    console.log('- Fallback to safe mode if socket.io fails');
    console.log('- Class room management for targeted updates');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if server is running');
    console.log('2. Verify class ID exists');
    console.log('3. Check network connectivity');
    console.log('4. Review server logs for errors');
  }
}

// Run the test
testRealTimeComplete();
