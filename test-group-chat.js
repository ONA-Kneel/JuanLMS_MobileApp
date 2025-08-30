const axios = require('axios');

const API_URL = 'https://juanlms-webapp-server.onrender.com';

// Test group chat functionality
async function testGroupChat() {
  try {
    console.log('Testing Group Chat API endpoints...\n');

    // Test 1: Check if server is accessible
    console.log('1. Testing server connectivity...');
    try {
      const healthCheck = await axios.get(`${API_URL}/api/health`);
      console.log('✅ Server is accessible:', healthCheck.data);
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
    }

    // Test 2: Check if group-chats endpoint exists
    console.log('\n2. Testing group-chats endpoint...');
    try {
      const response = await axios.get(`${API_URL}/group-chats`);
      console.log('✅ Group chats endpoint accessible');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Group chats endpoint exists (requires authentication)');
      } else {
        console.log('❌ Group chats endpoint failed:', error.message);
      }
    }

    // Test 3: Check if group-messages endpoint exists
    console.log('\n3. Testing group-messages endpoint...');
    try {
      const response = await axios.get(`${API_URL}/group-messages`);
      console.log('✅ Group messages endpoint accessible');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Group messages endpoint exists (requires authentication)');
      } else {
        console.log('❌ Group messages endpoint failed:', error.message);
      }
    }

    // Test 4: Check if users endpoint exists
    console.log('\n4. Testing users endpoint...');
    try {
      const response = await axios.get(`${API_URL}/users`);
      console.log('✅ Users endpoint accessible');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Users endpoint exists (requires authentication)');
      } else {
        console.log('❌ Users endpoint failed:', error.message);
      }
    }

    console.log('\n✅ Group Chat API testing completed!');
    console.log('\nNote: Most endpoints require authentication (JWT token)');
    console.log('The mobile app should include the Authorization header with the token.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testGroupChat();

