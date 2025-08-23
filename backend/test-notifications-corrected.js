// Test the corrected notification endpoint
const API_BASE = 'https://juanlms-webapp-server.onrender.com';

console.log('Testing corrected notification endpoint...');
console.log(`API Base: ${API_BASE}`);

// Test the endpoint structure (without /api prefix)
fetch(`${API_BASE}/notifications/test-user-id`)
  .then(response => {
    console.log(`Response status: ${response.status}`);
    console.log(`Response status text: ${response.statusText}`);
    
    if (response.status === 401) {
      console.log('✅ Endpoint exists but requires authentication (expected)');
    } else if (response.status === 404) {
      console.log('❌ Endpoint not found');
    } else {
      console.log(`⚠️ Unexpected status: ${response.status}`);
    }
  })
  .catch(error => {
    console.log(`❌ Error: ${error.message}`);
  });
