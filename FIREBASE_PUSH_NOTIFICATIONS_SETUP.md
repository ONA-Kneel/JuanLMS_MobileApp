# 🔥 Firebase Push Notifications Setup Guide

This guide will help you set up Firebase push notifications for your JuanLMS mobile app.

## 📋 Prerequisites

- Firebase project created
- Android Studio (for Android setup)
- Xcode (for iOS setup)
- Node.js and npm installed

## 🚀 Step-by-Step Setup

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing project
3. Enable Authentication and Cloud Messaging
4. Add your Android and iOS apps to the project

### 2. Android Setup

#### 2.1 Download Configuration Files
1. In Firebase Console, go to Project Settings
2. Select your Android app
3. Download `google-services.json`
4. Replace the placeholder file in `frontend/android/app/google-services.json`

#### 2.2 Update Package Name
1. Update package name in `frontend/android/app/build.gradle`:
   ```gradle
   defaultConfig {
       applicationId 'com.yourcompany.juanlms' // Change this
   }
   ```

#### 2.3 Update Firebase Configuration
1. Update `frontend/firebase.config.js` with your actual Firebase config:
   ```javascript
   export const firebaseConfig = {
     apiKey: "your-actual-api-key",
     authDomain: "your-project-id.firebaseapp.com",
     projectId: "your-project-id",
     // ... other config values
   };
   ```

### 3. iOS Setup

#### 3.1 Download Configuration Files
1. In Firebase Console, select your iOS app
2. Download `GoogleService-Info.plist`
3. Replace the placeholder file in `frontend/ios/GoogleService-Info.plist`

#### 3.2 Update Bundle ID
1. Update bundle ID in Xcode project settings to match Firebase configuration

### 4. Backend Setup

#### 4.1 Install Dependencies
```bash
cd backend
npm install firebase-admin
```

#### 4.2 Firebase Service Account
1. Go to Firebase Console > Project Settings > Service Accounts
2. Generate new private key
3. Download the JSON file
4. Update environment variables in your backend:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY_ID=your-private-key-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=your-service-account-email@your-project-id.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID=your-client-id
   ```

### 5. Mobile App Setup

#### 5.1 Install Dependencies
```bash
cd frontend
npm install @react-native-firebase/app @react-native-firebase/messaging
```

#### 5.2 Android Configuration
1. Update `frontend/android/app/build.gradle`:
   ```gradle
   apply plugin: "com.google.gms.google-services"
   
   dependencies {
       implementation platform('com.google.firebase:firebase-bom:32.7.0')
       implementation 'com.google.firebase:firebase-messaging'
       implementation 'com.google.firebase:firebase-analytics'
   }
   ```

2. Update `frontend/android/build.gradle`:
   ```gradle
   dependencies {
       classpath('com.google.gms:google-services:4.4.0')
   }
   ```

#### 5.3 iOS Configuration
1. Add `GoogleService-Info.plist` to Xcode project
2. Enable Push Notifications capability in Xcode
3. Update `frontend/ios/Podfile`:
   ```ruby
   pod 'Firebase/Messaging'
   pod 'Firebase/Analytics'
   ```

### 6. Testing Push Notifications

#### 6.1 Test from Backend
```bash
curl -X POST https://your-backend-url/api/notifications/send-to-user \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id",
    "notification": {
      "title": "Test Notification",
      "body": "This is a test push notification",
      "data": {
        "type": "test"
      }
    }
  }'
```

#### 6.2 Test from Firebase Console
1. Go to Firebase Console > Cloud Messaging
2. Click "Send your first message"
3. Enter title and message
4. Select your app
5. Send notification

### 7. Integration with Chat System

The push notification system is already integrated with your chat system. When a new message is sent:

1. The message is saved to the database
2. A socket event is emitted for real-time updates
3. A push notification is sent to the recipient
4. The recipient receives the notification even when the app is in the background

### 8. Notification Types Supported

- **Chat Messages**: Direct messages between users
- **Group Messages**: Messages in group chats
- **Announcements**: Class announcements
- **Assignments**: New assignments posted
- **Quizzes**: New quizzes available
- **Lessons**: New lesson materials

### 9. Troubleshooting

#### Common Issues:

1. **Notifications not received on Android**:
   - Check if Google Play Services is installed
   - Verify `google-services.json` is in the correct location
   - Check notification permissions

2. **Notifications not received on iOS**:
   - Verify APNs certificate is configured
   - Check if push notifications are enabled in device settings
   - Ensure `GoogleService-Info.plist` is properly added to Xcode project

3. **Backend errors**:
   - Verify Firebase service account credentials
   - Check environment variables
   - Ensure Firebase Admin SDK is properly initialized

### 10. Production Considerations

1. **Security**:
   - Store Firebase service account key securely
   - Use environment variables for sensitive data
   - Implement proper authentication for notification endpoints

2. **Performance**:
   - Implement notification batching for multiple recipients
   - Use Firebase Cloud Functions for complex notification logic
   - Monitor notification delivery rates

3. **User Experience**:
   - Allow users to customize notification preferences
   - Implement notification categories
   - Provide clear opt-in/opt-out mechanisms

## 📱 Testing Checklist

- [ ] Firebase project created and configured
- [ ] Android app added to Firebase project
- [ ] iOS app added to Firebase project
- [ ] Configuration files downloaded and placed correctly
- [ ] Dependencies installed
- [ ] Backend environment variables set
- [ ] Test notification sent from Firebase Console
- [ ] Test notification sent from backend API
- [ ] Chat notifications working
- [ ] Background notifications working
- [ ] Foreground notifications working

## 🎉 You're Done!

Your Firebase push notification system is now set up and ready to use! Users will receive notifications for:

- New chat messages
- Group chat messages
- Announcements
- Assignments
- Quizzes
- And more!

The system is fully integrated with your existing chat system and will work seamlessly with your real-time messaging features.
