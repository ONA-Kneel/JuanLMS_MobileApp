const fetch = require('node-fetch');

const API_BASE = 'https://juanlms-webapp-server.onrender.com';

async function testNotificationEndpoints() {
  console.log('Testing notification endpoints...\n');
  
  // Test 1: Check if /api/notifications/debug/all works
  try {
    console.log('1. Testing /api/notifications/debug/all...');
    const debugResponse = await fetch(`${API_BASE}/api/notifications/debug/all`, {
      headers: {
        'Authorization': 'Bearer test-token' // This will likely fail auth, but we'll see the response
      }
    });
    console.log(`   Status: ${debugResponse.status}`);
    const debugData = await debugResponse.text();
    console.log(`   Response: ${debugData.substring(0, 200)}...\n`);
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }

  // Test 2: Check if /notifications/debug/all works (fallback)
  try {
    console.log('2. Testing /notifications/debug/all...');
    const debugResponse2 = await fetch(`${API_BASE}/notifications/debug/all`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log(`   Status: ${debugResponse2.status}`);
    const debugData2 = await debugResponse2.text();
    console.log(`   Response: ${debugData2.substring(0, 200)}...\n`);
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }

  // Test 3: Check if /api/notifications/:userId works
  try {
    console.log('3. Testing /api/notifications/68c1a45da6e937423775df0b...');
    const userResponse = await fetch(`${API_BASE}/api/notifications/68c1a45da6e937423775df0b`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log(`   Status: ${userResponse.status}`);
    const userData = await userResponse.text();
    console.log(`   Response: ${userData.substring(0, 200)}...\n`);
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }

  // Test 4: Check if /notifications/:userId works (fallback)
  try {
    console.log('4. Testing /notifications/68c1a45da6e937423775df0b...');
    const userResponse2 = await fetch(`${API_BASE}/notifications/68c1a45da6e937423775df0b`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log(`   Status: ${userResponse2.status}`);
    const userData2 = await userResponse2.text();
    console.log(`   Response: ${userData2.substring(0, 200)}...\n`);
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }

  // Test 5: Check server health
  try {
    console.log('5. Testing server health...');
    const healthResponse = await fetch(`${API_BASE}/`);
    console.log(`   Status: ${healthResponse.status}`);
    const healthData = await healthResponse.text();
    console.log(`   Response: ${healthData}\n`);
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }
}

testNotificationEndpoints().catch(console.error);
