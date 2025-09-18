// Test script for Firebase push notifications
const axios = require('axios');

const API_URL = 'https://juanlms-webapp-server.onrender.com';

// Test data
const testData = {
  userId: 'test-user-id',
  fcmToken: 'test-fcm-token',
  platform: 'android',
  appVersion: '1.0.0'
};

// Test functions
async function testRegisterToken() {
  try {
    console.log('Testing token registration...');
    const response = await axios.post(`${API_URL}/api/notifications/register-token`, testData);
    console.log('✅ Token registration successful:', response.data);
  } catch (error) {
    console.error('❌ Token registration failed:', error.response?.data || error.message);
  }
}

async function testSendNotification() {
  try {
    console.log('Testing notification sending...');
    const response = await axios.post(`${API_URL}/api/notifications/send-to-user`, {
      userId: testData.userId,
      notification: {
        title: 'Test Notification',
        body: 'This is a test push notification from JuanLMS',
        data: {
          type: 'test',
          timestamp: new Date().toISOString()
        }
      }
    });
    console.log('✅ Notification sent successfully:', response.data);
  } catch (error) {
    console.error('❌ Notification sending failed:', error.response?.data || error.message);
  }
}

async function testChatMessageNotification() {
  try {
    console.log('Testing chat message notification...');
    const response = await axios.post(`${API_URL}/api/notifications/send-chat-message`, {
      recipientId: testData.userId,
      senderName: 'Test User',
      message: 'Hello! This is a test chat message.',
      isGroup: false,
      groupName: null
    });
    console.log('✅ Chat message notification sent successfully:', response.data);
  } catch (error) {
    console.error('❌ Chat message notification failed:', error.response?.data || error.message);
  }
}

async function testGetTokens() {
  try {
    console.log('Testing get tokens...');
    const response = await axios.get(`${API_URL}/api/notifications/tokens`);
    console.log('✅ Tokens retrieved successfully:', response.data);
  } catch (error) {
    console.error('❌ Get tokens failed:', error.response?.data || error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Firebase Push Notification Tests...\n');
  
  await testRegisterToken();
  console.log('');
  
  await testSendNotification();
  console.log('');
  
  await testChatMessageNotification();
  console.log('');
  
  await testGetTokens();
  console.log('');
  
  console.log('✅ All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testRegisterToken,
  testSendNotification,
  testChatMessageNotification,
  testGetTokens,
  runTests
};
