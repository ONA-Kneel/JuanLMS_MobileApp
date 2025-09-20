# 🔄 Expo Account Update Guide - nochu

This guide will help you update your JuanLMS project to work with your new Expo account "nochu" and the updated Firebase versions.

## ✅ What's Already Updated

- ✅ `frontend/app.json` - Owner changed to "nochu"
- ✅ `frontend/package.json` - Firebase dependencies updated to v23.3.1
- ✅ Android permissions updated for newer Android versions
- ✅ Firebase configuration updated for v23+

## 🚀 Step-by-Step Update Process

### 1. Update Your Local Expo Session

```bash
# Navigate to frontend directory
cd frontend

# Logout from current Expo account
expo logout

# Login with your new nochu account
expo login

# Verify you're logged in as nochu
expo whoami
```

### 2. Update Firebase Project Configuration

#### 2.1 Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your existing project or create a new one
3. Go to Project Settings > General
4. Update the project name if needed

#### 2.2 Update Android App Configuration
1. In Firebase Console, go to Project Settings > Your apps
2. Select your Android app
3. Update the package name if needed: `com.kneelpngnbn.juanlms.mobileapp`
4. Download the new `google-services.json`
5. Replace the file in `frontend/android/app/google-services.json`

#### 2.3 Update iOS App Configuration
1. In Firebase Console, select your iOS app
2. Update the bundle ID if needed: `com.kneelpngnbn.juanlms.mobileapp`
3. Download the new `GoogleService-Info.plist`
4. Replace the file in `frontend/ios/GoogleService-Info.plist`

### 3. Update Backend Environment Variables

Update your backend `.env` file with the new Firebase project details:

```env
# Firebase Admin SDK (get these from Firebase Console > Project Settings > Service Accounts)
FIREBASE_PROJECT_ID=your-new-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account-email@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
```

### 4. Install Updated Dependencies

```bash
# Frontend dependencies
cd frontend
npm install

# Backend dependencies
cd ../backend
npm install firebase-admin
```

### 5. Test the Updated Configuration

#### 5.1 Test Expo Connection
```bash
cd frontend
expo start
```

#### 5.2 Test Firebase Integration
```bash
# Run the test script
node test-push-notifications.js
```

#### 5.3 Test Push Notifications
1. Build and install the app on a device
2. Send a test notification from Firebase Console
3. Verify notifications are received

### 6. Build and Deploy

#### 6.1 Development Build
```bash
cd frontend
expo run:android
# or
expo run:ios
```

#### 6.2 Production Build
```bash
# For Android
eas build --platform android --profile production

# For iOS
eas build --platform ios --profile production
```

## 🔧 Troubleshooting

### Common Issues:

1. **Expo Login Issues**:
   ```bash
   # Clear Expo cache
   expo logout
   rm -rf ~/.expo
   expo login
   ```

2. **Firebase Configuration Issues**:
   - Verify `google-services.json` and `GoogleService-Info.plist` are in correct locations
   - Check that package name/bundle ID matches Firebase configuration
   - Ensure Firebase project has Cloud Messaging enabled

3. **Build Issues**:
   ```bash
   # Clear Metro cache
   npx expo start --clear
   
   # Clear Android build cache
   cd android
   ./gradlew clean
   cd ..
   ```

4. **Push Notification Issues**:
   - Check device notification permissions
   - Verify FCM token is being generated
   - Test with Firebase Console first

## 📱 Testing Checklist

- [ ] Expo account updated to "nochu"
- [ ] Firebase project configuration updated
- [ ] Configuration files downloaded and placed correctly
- [ ] Dependencies installed successfully
- [ ] App builds without errors
- [ ] Push notifications work on device
- [ ] Chat system works with push notifications
- [ ] Background notifications work

## 🎉 You're All Set!

Your JuanLMS app is now configured for your new Expo account "nochu" with the latest Firebase versions. The push notification system should work seamlessly with your updated configuration.

### Key Benefits of the Update:

- ✅ Latest Firebase SDK (v23.3.1) with improved performance
- ✅ Better Android 13+ notification support
- ✅ Updated Expo account configuration
- ✅ Enhanced security and stability
- ✅ Improved push notification reliability

### Next Steps:

1. Test the app thoroughly on both platforms
2. Deploy to app stores when ready
3. Monitor push notification delivery rates
4. Set up analytics to track notification engagement

Happy coding! 🚀


