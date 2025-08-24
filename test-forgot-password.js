// Test script for forgot password functionality
import fetch from 'node-fetch';

const API_BASE = 'https://juanlms-webapp-server.onrender.com/api';

async function testForgotPassword() {
  console.log('Testing Forgot Password Endpoints...\n');

  try {
    // Test 1: Request OTP
    console.log('1. Testing /forgot-password endpoint...');
    const forgotResponse = await fetch(`${API_BASE}/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: 'test@students.sjddef.edu.ph' 
      }),
    });
    
    const forgotData = await forgotResponse.json();
    console.log('Status:', forgotResponse.status);
    console.log('Response:', forgotData);
    console.log('');

    if (forgotResponse.ok) {
      // Test 2: Validate OTP (this will fail without a valid OTP, but we can test the endpoint)
      console.log('2. Testing /validate-otp endpoint...');
      const validateResponse = await fetch(`${API_BASE}/validate-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: 'test@students.sjddef.edu.ph',
          otp: '123456' // This will be invalid
        }),
      });
      
      const validateData = await validateResponse.json();
      console.log('Status:', validateResponse.status);
      console.log('Response:', validateData);
      console.log('');

      // Test 3: Reset Password (this will fail without a valid OTP, but we can test the endpoint)
      console.log('3. Testing /reset-password endpoint...');
      const resetResponse = await fetch(`${API_BASE}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: 'test@students.sjddef.edu.ph',
          otp: '123456', // This will be invalid
          newPassword: 'newpassword123'
        }),
      });
      
      const resetData = await resetResponse.json();
      console.log('Status:', resetResponse.status);
      console.log('Response:', resetData);
    }

  } catch (error) {
    console.error('Error testing endpoints:', error);
  }
}

// Run the test
testForgotPassword();
