// Firebase configuration for React Native
// Replace these values with your actual Firebase project configuration

export const firebaseConfig = {
  apiKey: "AIzaSyB8Lmk6RlDMGlmpjCoPePDtOzLIitaoh_8",
  authDomain: "juanlms-88086.firebaseapp.com",
  projectId: "juanlms-88086",
  storageBucket: "juanlms-88086.firebasestorage.app",
  messagingSenderId: "960297616285",
  appId: "1:960297616285:android:5b11f4c77c557e70056574",
  // For Android
  clientId: "your-client-id",
  // For iOS
  iosClientId: "your-ios-client-id"
};

// Firebase App configuration for React Native Firebase v23+
export const firebaseAppConfig = {
  // This will be automatically configured by google-services.json and GoogleService-Info.plist
  // No manual configuration needed for React Native Firebase v23+
};

// Notification configuration
export const notificationConfig = {
  // Android notification channel settings
  android: {
    channelId: 'juanlms_notifications',
    channelName: 'JuanLMS Notifications',
    channelDescription: 'Notifications for JuanLMS app',
    importance: 'high',
    priority: 'high',
    sound: 'default',
    vibrate: true,
    lights: true,
    color: '#00418b' // Your app's primary color
  },
  // iOS notification settings
  ios: {
    sound: 'default',
    badge: true,
    alert: true
  }
};

// Notification types
export const NOTIFICATION_TYPES = {
  MESSAGE: 'message',
  GROUP_MESSAGE: 'group_message',
  ANNOUNCEMENT: 'announcement',
  ASSIGNMENT: 'assignment',
  QUIZ: 'quiz',
  LESSON: 'lesson',
  GENERAL: 'general'
};

// Notification priorities
export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
};
