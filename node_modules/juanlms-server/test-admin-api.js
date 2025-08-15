import fetch from 'node-fetch';

const BASE_URL = 'https://juanlms-webapp-server.onrender.com';

async function testAdminAPI() {
  console.log('Testing Admin API Endpoints...\n');

  try {
    // Test 1: Dashboard Summary
    console.log('1. Testing Dashboard Summary...');
    const summaryResponse = await fetch(`${BASE_URL}/api/admin/dashboard-summary`);
    if (summaryResponse.ok) {
      const summaryData = await summaryResponse.json();
      console.log('✅ Dashboard Summary:', summaryData);
    } else {
      console.log('❌ Dashboard Summary failed:', summaryResponse.status);
    }

    // Test 2: User Stats
    console.log('\n2. Testing User Stats...');
    const statsResponse = await fetch(`${BASE_URL}/api/admin/user-stats`);
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ User Stats:', statsData);
    } else {
      console.log('❌ User Stats failed:', statsResponse.status);
    }

    // Test 3: Recent Logins
    console.log('\n3. Testing Recent Logins...');
    const loginsResponse = await fetch(`${BASE_URL}/api/admin/recent-logins?limit=5`);
    if (loginsResponse.ok) {
      const loginsData = await loginsResponse.json();
      console.log('✅ Recent Logins:', loginsData);
    } else {
      console.log('❌ Recent Logins failed:', loginsResponse.status);
    }

    // Test 4: Audit Preview
    console.log('\n4. Testing Audit Preview...');
    const auditResponse = await fetch(`${BASE_URL}/api/admin/audit-preview?limit=5`);
    if (auditResponse.ok) {
      const auditData = await auditResponse.json();
      console.log('✅ Audit Preview:', auditData);
    } else {
      console.log('❌ Audit Preview failed:', auditResponse.status);
    }

    // Test 5: Active Users Today
    console.log('\n5. Testing Active Users Today...');
    const activeResponse = await fetch(`${BASE_URL}/api/admin/active-users-today`);
    if (activeResponse.ok) {
      const activeData = await activeResponse.json();
      console.log('✅ Active Users Today:', activeData);
    } else {
      console.log('❌ Active Users Today failed:', activeResponse.status);
    }

    // Test 6: Academic Progress
    console.log('\n6. Testing Academic Progress...');
    const progressResponse = await fetch(`${BASE_URL}/api/admin/academic-progress`);
    if (progressResponse.ok) {
      const progressData = await progressResponse.json();
      console.log('✅ Academic Progress:', progressData);
    } else {
      console.log('❌ Academic Progress failed:', progressResponse.status);
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testAdminAPI(); 