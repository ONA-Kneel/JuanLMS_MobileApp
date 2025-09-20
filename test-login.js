const fetch = require('node-fetch');

async function testLogin() {
  try {
    console.log('Testing login endpoint...');
    
    const response = await fetch('https://juanlms-webapp-server.onrender.com/api/login', {
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
    console.log('Response headers:', response.headers.raw());
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('Login successful:', data);
    } else {
      console.log('Login failed with status:', response.status);
    }
  } catch (error) {
    console.error('Error testing login:', error);
  }
}

testLogin();
