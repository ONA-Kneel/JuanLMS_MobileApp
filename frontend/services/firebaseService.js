import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import { firebaseConfig, notificationConfig, NOTIFICATION_TYPES } from '../firebase.config';

class FirebaseService {
  constructor() {
    this.fcmToken = null;
    this.isInitialized = false;
  }

  // Initialize Firebase messaging
  async initialize() {
    try {
      if (this.isInitialized) return;

      console.log('Initializing Firebase messaging...');
      
      // Request permission for notifications
      const authStatus = await messaging().requestPermission();
      const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Notification permission granted');
        
        // Get FCM token
        await this.getFCMToken();
        
        // Set up message handlers
        this.setupMessageHandlers();
        
        this.isInitialized = true;
        console.log('Firebase messaging initialized successfully');
      } else {
        console.log('Notification permission denied');
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device settings to receive important updates.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error initializing Firebase messaging:', error);
    }
  }

  // Get FCM token
  async getFCMToken() {
    try {
      const token = await messaging().getToken();
      this.fcmToken = token;
      
      // Store token in AsyncStorage
      await AsyncStorage.setItem('fcmToken', token);
      
      console.log('FCM Token:', token);
      
      // Send token to backend
      await this.sendTokenToBackend(token);
      
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  // Send FCM token to backend
  async sendTokenToBackend(token) {
    try {
      const user = await AsyncStorage.getItem('user');
      if (!user) return;

      const userData = JSON.parse(user);
      const userId = userData._id || userData.userID;
      
      if (!userId) return;

      const response = await fetch('https://juanlms-webapp-server.onrender.com/api/notifications/register-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('jwtToken')}`
        },
        body: JSON.stringify({
          userId,
          fcmToken: token,
          platform: Platform.OS,
          appVersion: '1.0.0' // You can get this from package.json
        })
      });

      if (response.ok) {
        console.log('FCM token registered with backend');
      } else {
        console.error('Failed to register FCM token with backend');
      }
    } catch (error) {
      console.error('Error sending FCM token to backend:', error);
    }
  }

  // Setup message handlers
  setupMessageHandlers() {
    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message received:', remoteMessage);
      // Handle background message here
      return Promise.resolve();
    });

    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message received:', remoteMessage);
      this.handleForegroundMessage(remoteMessage);
    });

    // Handle notification opened app
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened app:', remoteMessage);
      this.handleNotificationOpened(remoteMessage);
    });

    // Handle initial notification (app was opened by notification)
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('App opened by notification:', remoteMessage);
          this.handleNotificationOpened(remoteMessage);
        }
      });
  }

  // Handle foreground messages
  handleForegroundMessage(remoteMessage) {
    const { notification, data } = remoteMessage;
    
    if (notification) {
      // Show local notification or update UI
      this.showLocalNotification(notification, data);
    }
  }

  // Handle notification opened
  handleNotificationOpened(remoteMessage) {
    const { data } = remoteMessage;
    
    if (data) {
      // Navigate to appropriate screen based on notification type
      this.handleNotificationNavigation(data);
    }
  }

  // Show local notification
  showLocalNotification(notification, data) {
    // For foreground messages, you might want to show a custom in-app notification
    // or update the UI directly instead of showing a system notification
    
    if (data?.type === NOTIFICATION_TYPES.MESSAGE || data?.type === NOTIFICATION_TYPES.GROUP_MESSAGE) {
      // Handle chat message notification
      console.log('Chat message notification:', notification);
      // You can emit an event or update context here
    } else {
      // Handle other notification types
      console.log('Other notification:', notification);
    }
  }

  // Handle notification navigation
  handleNotificationNavigation(data) {
    // This will be implemented based on your navigation structure
    console.log('Navigate based on notification data:', data);
    
    // Example navigation logic:
    // if (data.type === NOTIFICATION_TYPES.MESSAGE) {
    //   // Navigate to chat screen
    // } else if (data.type === NOTIFICATION_TYPES.ANNOUNCEMENT) {
    //   // Navigate to announcements screen
    // }
  }

  // Subscribe to topic
  async subscribeToTopic(topic) {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`Error subscribing to topic ${topic}:`, error);
    }
  }

  // Unsubscribe from topic
  async unsubscribeFromTopic(topic) {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`Error unsubscribing from topic ${topic}:`, error);
    }
  }

  // Get current FCM token
  getCurrentToken() {
    return this.fcmToken;
  }

  // Refresh FCM token
  async refreshToken() {
    try {
      await messaging().deleteToken();
      const newToken = await this.getFCMToken();
      return newToken;
    } catch (error) {
      console.error('Error refreshing FCM token:', error);
      return null;
    }
  }

  // Check if notifications are enabled
  async areNotificationsEnabled() {
    try {
      const authStatus = await messaging().hasPermission();
      return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
             authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return false;
    }
  }

  // Request notification permission
  async requestPermission() {
    try {
      const authStatus = await messaging().requestPermission();
      return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
             authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new FirebaseService();
