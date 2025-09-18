import { useEffect, useState, useRef } from 'react';
import { Platform, Alert, Vibration } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseService from '../services/firebaseService';
import { NOTIFICATION_TYPES } from '../firebase.config';

export const usePushNotifications = () => {
  const [fcmToken, setFcmToken] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const notificationListenerRef = useRef(null);

  // Initialize push notifications
  useEffect(() => {
    const initializePushNotifications = async () => {
      try {
        console.log('Initializing push notifications...');
        
        // Initialize Firebase service
        await firebaseService.initialize();
        
        // Get FCM token
        const token = await firebaseService.getCurrentToken();
        setFcmToken(token);
        
        // Check if notifications are enabled
        const enabled = await firebaseService.areNotificationsEnabled();
        setNotificationsEnabled(enabled);
        
        // Set up message listeners
        setupMessageListeners();
        
        setIsInitialized(true);
        console.log('Push notifications initialized successfully');
      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }
    };

    initializePushNotifications();

    return () => {
      // Cleanup listeners
      if (notificationListenerRef.current) {
        notificationListenerRef.current();
      }
    };
  }, []);

  // Setup message listeners
  const setupMessageListeners = () => {
    // Foreground message listener
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message received:', remoteMessage);
      handleForegroundMessage(remoteMessage);
    });

    // Background message listener
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message received:', remoteMessage);
      return Promise.resolve();
    });

    // Notification opened app listener
    const unsubscribeOpened = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened app:', remoteMessage);
      handleNotificationOpened(remoteMessage);
    });

    // Initial notification listener
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('App opened by notification:', remoteMessage);
          handleNotificationOpened(remoteMessage);
        }
      });

    // Store cleanup function
    notificationListenerRef.current = () => {
      unsubscribeForeground();
      unsubscribeOpened();
    };
  };

  // Handle foreground messages
  const handleForegroundMessage = (remoteMessage) => {
    const { notification, data } = remoteMessage;
    
    if (notification) {
      // Show custom in-app notification
      showInAppNotification(notification, data);
    }
  };

  // Handle notification opened
  const handleNotificationOpened = (remoteMessage) => {
    const { data } = remoteMessage;
    
    if (data) {
      // Navigate based on notification type
      handleNotificationNavigation(data);
    }
  };

  // Show in-app notification
  const showInAppNotification = (notification, data) => {
    // Vibrate device
    Vibration.vibrate(100);
    
    // Show alert for important notifications
    if (data?.priority === 'high' || data?.type === NOTIFICATION_TYPES.MESSAGE) {
      Alert.alert(
        notification.title || 'New Notification',
        notification.body || 'You have a new notification',
        [
          {
            text: 'View',
            onPress: () => handleNotificationNavigation(data)
          },
          {
            text: 'Dismiss',
            style: 'cancel'
          }
        ]
      );
    }
  };

  // Handle notification navigation
  const handleNotificationNavigation = (data) => {
    // This should be implemented based on your navigation structure
    console.log('Navigate based on notification data:', data);
    
    // Example navigation logic:
    // if (data.type === NOTIFICATION_TYPES.MESSAGE) {
    //   // Navigate to chat screen
    //   // navigation.navigate('Chat', { userId: data.senderId });
    // } else if (data.type === NOTIFICATION_TYPES.GROUP_MESSAGE) {
    //   // Navigate to group chat screen
    //   // navigation.navigate('GroupChat', { groupId: data.groupId });
    // } else if (data.type === NOTIFICATION_TYPES.ANNOUNCEMENT) {
    //   // Navigate to announcements screen
    //   // navigation.navigate('Announcements');
    // }
  };

  // Subscribe to topic
  const subscribeToTopic = async (topic) => {
    try {
      await firebaseService.subscribeToTopic(topic);
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`Error subscribing to topic ${topic}:`, error);
    }
  };

  // Unsubscribe from topic
  const unsubscribeFromTopic = async (topic) => {
    try {
      await firebaseService.unsubscribeFromTopic(topic);
      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`Error unsubscribing from topic ${topic}:`, error);
    }
  };

  // Request notification permission
  const requestPermission = async () => {
    try {
      const granted = await firebaseService.requestPermission();
      setNotificationsEnabled(granted);
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  // Refresh FCM token
  const refreshToken = async () => {
    try {
      const newToken = await firebaseService.refreshToken();
      setFcmToken(newToken);
      return newToken;
    } catch (error) {
      console.error('Error refreshing FCM token:', error);
      return null;
    }
  };

  // Get current FCM token
  const getCurrentToken = () => {
    return fcmToken;
  };

  // Check if notifications are enabled
  const checkNotificationStatus = async () => {
    try {
      const enabled = await firebaseService.areNotificationsEnabled();
      setNotificationsEnabled(enabled);
      return enabled;
    } catch (error) {
      console.error('Error checking notification status:', error);
      return false;
    }
  };

  return {
    fcmToken,
    isInitialized,
    notificationsEnabled,
    subscribeToTopic,
    unsubscribeFromTopic,
    requestPermission,
    refreshToken,
    getCurrentToken,
    checkNotificationStatus,
    handleNotificationNavigation
  };
};
