// Test various endpoints to see which ones are available
const API_BASE = 'https://juanlms-webapp-server.onrender.com/api';

const endpoints = [
  '/api/notifications',
  '/api/general-announcements',
  '/api/announcements',
  '/api/users',
  '/api/classes',
  '/api/quizzes',
  '/api/assignments',
  '/api/health',
  '/api/status'
];

console.log('Testing available endpoints...\n');

async function testEndpoints() {
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`);
      console.log(`${endpoint}: ${response.status} ${response.statusText}`);
      
      if (response.status === 401) {
        console.log(`  → Requires authentication (expected)`);
      } else if (response.status === 404) {
        console.log(`  → Not found`);
      } else if (response.status === 200) {
        console.log(`  → Accessible`);
      } else {
        console.log(`  → Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`${endpoint}: Error - ${error.message}`);
    }
    console.log('');
  }
}

testEndpoints();
