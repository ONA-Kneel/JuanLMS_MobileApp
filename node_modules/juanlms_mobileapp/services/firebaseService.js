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
      
      // Set up token refresh listener
      this.setupTokenRefreshListener();
      
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  // Setup token refresh listener
  setupTokenRefreshListener() {
    messaging().onTokenRefresh(async (token) => {
      console.log('FCM Token refreshed:', token);
      this.fcmToken = token;
      
      // Store new token
      await AsyncStorage.setItem('fcmToken', token);
      
      // Send new token to backend
      await this.sendTokenToBackend(token);
    });
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
    console.log('Navigate based on notification data:', data);
    
    // Import navigation reference (this will be set by the app)
    if (this.navigationRef) {
      try {
        switch (data.type) {
          case NOTIFICATION_TYPES.MESSAGE:
            // Navigate to individual chat
            if (data.senderId) {
              this.navigationRef.navigate('Chat', { 
                userId: data.senderId,
                senderName: data.senderName 
              });
            }
            break;
            
          case NOTIFICATION_TYPES.GROUP_MESSAGE:
            // Navigate to group chat
            if (data.groupId) {
              this.navigationRef.navigate('GroupChat', { 
                groupId: data.groupId,
                groupName: data.groupName 
              });
            }
            break;
            
          case NOTIFICATION_TYPES.ANNOUNCEMENT:
            // Navigate to announcements based on user role
            const userRole = data.userRole || 'student';
            if (userRole === 'student') {
              this.navigationRef.navigate('SDash');
            } else if (userRole === 'faculty') {
              this.navigationRef.navigate('FDash');
            } else if (userRole === 'admin') {
              this.navigationRef.navigate('AdminDash');
            } else if (userRole === 'vpe') {
              this.navigationRef.navigate('VPEDash');
            } else if (userRole === 'principal') {
              this.navigationRef.navigate('PrincipalDash');
            }
            break;
            
          case NOTIFICATION_TYPES.ASSIGNMENT:
            // Navigate to assignment detail
            if (data.assignmentId) {
              this.navigationRef.navigate('AssignmentDetail', { 
                assignmentId: data.assignmentId 
              });
            } else {
              // Navigate to assignments list
              this.navigationRef.navigate('SActs');
            }
            break;
            
          case NOTIFICATION_TYPES.QUIZ:
            // Navigate to quiz
            if (data.quizId) {
              this.navigationRef.navigate('QuizView', { 
                quizId: data.quizId 
              });
            } else {
              this.navigationRef.navigate('SActs');
            }
            break;
            
          case NOTIFICATION_TYPES.LESSON:
            // Navigate to lesson
            if (data.lessonId) {
              this.navigationRef.navigate('SModule', { 
                lessonId: data.lessonId 
              });
            } else {
              this.navigationRef.navigate('SModule');
            }
            break;
            
          default:
            // Navigate to dashboard based on user role
            const role = data.userRole || 'student';
            if (role === 'student') {
              this.navigationRef.navigate('SDash');
            } else if (role === 'faculty') {
              this.navigationRef.navigate('FDash');
            } else if (role === 'admin') {
              this.navigationRef.navigate('AdminDash');
            } else if (role === 'vpe') {
              this.navigationRef.navigate('VPEDash');
            } else if (role === 'principal') {
              this.navigationRef.navigate('PrincipalDash');
            }
            break;
        }
      } catch (error) {
        console.error('Error navigating from notification:', error);
        // Fallback to dashboard
        this.navigationRef.navigate('SDash');
      }
    } else {
      console.warn('Navigation reference not set');
    }
  }

  // Set navigation reference
  setNavigationRef(ref) {
    this.navigationRef = ref;
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
