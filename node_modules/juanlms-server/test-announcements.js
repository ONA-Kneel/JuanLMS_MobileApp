import axios from 'axios';

const API_BASE_URL = 'https://juanlms-webapp-server.onrender.com/api';

async function testAnnouncements() {
  try {
    console.log('Testing Announcements API...\n');

    // Test 1: Get all announcements
    console.log('1. Testing GET /api/announcements');
    try {
      const response = await axios.get(`${API_BASE_URL}/announcements`);
      console.log('✅ Success:', response.data.length, 'announcements found');
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    // Test 2: Create a new announcement
    console.log('\n2. Testing POST /api/announcements');
    try {
      const newAnnouncement = {
        title: 'Test Announcement from Mobile App',
        content: 'This is a test announcement created by the mobile app to verify the API is working correctly.',
        priority: 'high',
        category: 'general',
        targetAudience: ['everyone'],
        createdBy: 'MobileAppTest'
      };
      
      const response = await axios.post(`${API_BASE_URL}/announcements`, newAnnouncement);
      console.log('✅ Success: Announcement created with ID:', response.data._id);
      
      // Test 3: Update the announcement status
      console.log('\n3. Testing PATCH /api/announcements/:id');
      try {
        const updateResponse = await axios.patch(`${API_BASE_URL}/announcements/${response.data._id}`, {
          isActive: false
        });
        console.log('✅ Success: Announcement status updated:', updateResponse.data.isActive);
      } catch (error) {
        console.log('❌ Error updating status:', error.response?.data || error.message);
      }
      
    } catch (error) {
      console.log('❌ Error creating announcement:', error.response?.data || error.message);
    }

    console.log('\n🎉 Announcements API test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAnnouncements();
