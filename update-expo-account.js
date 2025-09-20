#!/usr/bin/env node

// Script to update Expo account configuration
const fs = require('fs');
const path = require('path');

console.log('🔄 Updating Expo account configuration to "nochu"...\n');

// Update app.json
const appJsonPath = path.join(__dirname, 'frontend', 'app.json');
try {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  
  if (appJson.expo.owner !== 'nochu') {
    appJson.expo.owner = 'nochu';
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
    console.log('✅ Updated app.json with new owner: nochu');
  } else {
    console.log('✅ app.json already has correct owner: nochu');
  }
} catch (error) {
  console.error('❌ Error updating app.json:', error.message);
}

// Check if .expo directory exists and needs updating
const expoDir = path.join(__dirname, 'frontend', '.expo');
if (fs.existsSync(expoDir)) {
  console.log('📁 Found .expo directory - you may need to run "expo logout" and "expo login"');
  console.log('   to update your local Expo session with the new account.');
}

console.log('\n📋 Next steps:');
console.log('1. Run: cd frontend && expo logout');
console.log('2. Run: expo login');
console.log('3. Enter your nochu account credentials');
console.log('4. Run: expo whoami (to verify you\'re logged in as nochu)');
console.log('5. Run: expo start (to test the app)');

console.log('\n🔧 Firebase Configuration:');
console.log('1. Update your Firebase project settings with the new Expo account');
console.log('2. Download new google-services.json and GoogleService-Info.plist');
console.log('3. Replace the placeholder files in the project');

console.log('\n✅ Expo account update complete!');


