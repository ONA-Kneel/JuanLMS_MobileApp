const fetch = require('node-fetch');

async function testEndpoints() {
  const baseUrl = 'https://juanlms-webapp-server.onrender.com';
  
  // Test 1: Basic server health
  console.log('=== Testing server health ===');
  try {
    const response = await fetch(`${baseUrl}/api/test`);
    const data = await response.json();
    console.log('✅ Server health:', data);
  } catch (error) {
    console.log('❌ Server health error:', error.message);
  }
  
  // Test 2: Users endpoint
  console.log('\n=== Testing users endpoint ===');
  try {
    const response = await fetch(`${baseUrl}/api/users`);
    const data = await response.json();
    console.log('✅ Users endpoint works, found', data.length, 'users');
  } catch (error) {
    console.log('❌ Users endpoint error:', error.message);
  }
  
  // Test 3: Login endpoint with GET (should return 405 Method Not Allowed)
  console.log('\n=== Testing login endpoint with GET ===');
  try {
    const response = await fetch(`${baseUrl}/api/login`);
    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response body:', text);
  } catch (error) {
    console.log('❌ Login GET error:', error.message);
  }
  
  // Test 4: Login endpoint with POST
  console.log('\n=== Testing login endpoint with POST ===');
  try {
    const response = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@students.sjddef.edu.ph',
        password: 'test123'
      })
    });
    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response body:', text);
  } catch (error) {
    console.log('❌ Login POST error:', error.message);
  }
}

testEndpoints();
