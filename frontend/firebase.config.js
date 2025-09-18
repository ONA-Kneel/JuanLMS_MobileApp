// Firebase configuration for React Native
// Replace these values with your actual Firebase project configuration

export const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  // For Android
  clientId: "your-client-id",
  // For iOS
  iosClientId: "your-ios-client-id"
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
