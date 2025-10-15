import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform, PermissionsAndroid, Alert, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Firebase modules are optional; load dynamically when available
let messaging;
let getApp;
try {
  const { NativeModules } = require('react-native');
  if (NativeModules && (NativeModules.RNFBMessagingModule || NativeModules.RNFBAppModule)) {
    try {
      messaging = require('@react-native-firebase/messaging').default;
    } catch {}
    try {
      ({ getApp } = require('@react-native-firebase/app'));
    } catch {}
  }
} catch {}
import Toast from 'react-native-root-toast';
import { registerDeviceToken } from './services/notificationService';
import { apiGet, apiPatch } from './utils/apiUtils';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState(null);

  // Check if Firebase is initialized
  const checkFirebaseInitialization = () => {
    try {
      if (!getApp) return false;
      const app = getApp();
      console.log('Firebase app initialized:', app.name);
      return true;
    } catch (error) {
      console.warn('Firebase not initialized:', error?.message || error);
      return false;
    }
  };

  // Function to register FCM token with backend after login
  const registerFCMTokenAfterLogin = async (userId) => {
    try {
      const token = await AsyncStorage.getItem('fcmToken');
      if (token && userId) {
        console.log('Registering FCM token after login for user:', userId);
        const success = await registerDeviceToken(userId, token);
        if (success) {
          console.log('FCM token registered successfully after login');
          return true;
        } else {
          console.warn('Failed to register FCM token after login');
          return false;
        }
      } else {
        console.log('No FCM token or user ID available for registration');
        return false;
      }
    } catch (error) {
      console.error('Error registering FCM token after login:', error);
      return false;
    }
  };

  // Auto-fetch notifications when context is initialized
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const user = await AsyncStorage.getItem('user');
        if (user) {
          const userData = JSON.parse(user);
          console.log('User data from AsyncStorage:', userData);
          // Try _id first, then userID as fallback
          const userId = userData._id || userData.userID;
          if (userId) {
            console.log('Using user ID for notifications:', userId);
            await fetchNotifications(userId);
          }
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
        // Set empty state to prevent render errors
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    // Add a small delay to prevent race conditions
    const timeoutId = setTimeout(initializeNotifications, 100);
    return () => clearTimeout(timeoutId);
    
    // Set up interval to refresh notifications every 30 seconds (like web app)
    const interval = setInterval(async () => {
      try {
        const user = await AsyncStorage.getItem('user');
        if (user) {
          const userData = JSON.parse(user);
          const userId = userData._id || userData.userID;
          if (userId) {
            await fetchNotifications(userId);
          }
        }
      } catch (error) {
        console.error('Error refreshing notifications:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Firebase Cloud Messaging: permissions, token, and foreground listener
  useEffect(() => {
    const requestNotificationPermissionAndroid = async () => {
      try {
        if (Platform.OS === 'android' && Platform.Version >= 33) {
          // Optional rationale before system prompt
          // You can customize this with your own UI modal if needed
          // For now, a simple Alert as rationale
          try {
            Alert && Alert.alert && Alert.alert(
              'Enable Notifications',
              'Allow notifications to receive updates about messages, grades, and announcements.'
            );
          } catch {}
          const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          if (result !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert && Alert.alert && Alert.alert('Permission Denied', 'Notifications may be limited.');
            return false;
          }
        }
        return true;
      } catch (error) {
        console.log('Android permission error:', error);
        return false;
      }
    };

    const requestNotificationPermissionIOS = async () => {
      try {
        if (!messaging) return false;
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (!enabled) {
          return false;
        }
        return true;
      } catch (error) {
        console.log('iOS permission error:', error);
        return false;
      }
    };

    const registerAndGetToken = async () => {
      try {
        // Check if Firebase is initialized before using messaging
        if (!messaging || !checkFirebaseInitialization()) {
          console.error('Firebase not initialized, cannot get FCM token');
          return;
        }
        
        await messaging().registerDeviceForRemoteMessages();
        const token = await messaging().getToken();
        if (token) {
          setFcmToken(token);
          console.log('FCM token obtained:', token.substring(0, 20) + '...');
          try { 
            await AsyncStorage.setItem('fcmToken', token); 
            console.log('FCM token stored in AsyncStorage');
          } catch (storageErr) {
            console.error('Failed to store FCM token:', storageErr);
          }
          // Store FCM token locally but don't register with backend yet
          // Backend registration will happen after successful login
          console.log('FCM token obtained and stored locally. Backend registration will happen after login.');
        } else {
          console.warn('No FCM token received');
        }
      } catch (error) {
        console.error('FCM token error:', error);
      }
    };

    const setupForegroundListener = () => {
      // Check if Firebase is initialized before setting up listeners
      if (!messaging || !checkFirebaseInitialization()) {
        console.error('Firebase not initialized, cannot setup foreground listener');
        return null;
      }
      
      const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
        try {
          console.log('Foreground FCM message:', remoteMessage);
          const title = remoteMessage?.notification?.title || 'New notification';
          const body = remoteMessage?.notification?.body || '';
          Toast.show(`${title}${body ? ': ' + body : ''}`, {
            duration: Toast.durations.SHORT,
            position: Toast.positions.TOP,
          });
        } catch (e) {
          console.log('Toast error:', e);
        }
      });
      return unsubscribeOnMessage;
    };

    let unsubscribeOnMessage;
    let unsubscribeOnTokenRefresh;
    (async () => {
      const granted = Platform.OS === 'ios'
        ? await requestNotificationPermissionIOS()
        : await requestNotificationPermissionAndroid();
      if (granted) {
        await registerAndGetToken();
        unsubscribeOnMessage = setupForegroundListener();
        if (messaging) {
          unsubscribeOnTokenRefresh = messaging().onTokenRefresh(async token => {
          setFcmToken(token);
          console.log('FCM token refreshed:', token.substring(0, 20) + '...');
          try { 
            await AsyncStorage.setItem('fcmToken', token); 
            console.log('Refreshed FCM token stored in AsyncStorage');
          } catch (storageErr) {
            console.error('Failed to store refreshed FCM token:', storageErr);
          }
          try {
            const storedUser = await AsyncStorage.getItem('user');
            const userData = storedUser ? JSON.parse(storedUser) : null;
            const userId = userData?._id || userData?.userID;
            if (userId) {
              console.log('Registering refreshed FCM token for user:', userId);
              const success = await registerDeviceToken(userId, token);
              if (success) {
                console.log('Refreshed FCM token registered successfully');
              } else {
                console.warn('Failed to register refreshed FCM token');
              }
            } else {
              console.warn('No user ID found for refreshed FCM token registration');
            }
          } catch (syncErr) {
            console.error('Token refresh sync error:', syncErr);
          }
          });
        }
      }
    })();

    return () => {
      if (unsubscribeOnMessage) unsubscribeOnMessage();
      if (unsubscribeOnTokenRefresh) unsubscribeOnTokenRefresh();
    };
  }, []);

  // Handle app state changes to re-register tokens when app becomes active
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === 'active') {
        try {
          const storedUser = await AsyncStorage.getItem('user');
          const fcmToken = await AsyncStorage.getItem('fcmToken');
          
          if (storedUser && fcmToken) {
            const userData = JSON.parse(storedUser);
            const userId = userData._id || userData.userID;
            
            if (userId) {
              console.log('App became active, re-registering FCM token for user:', userId);
              const success = await registerDeviceToken(userId, fcmToken);
              if (success) {
                console.log('FCM token re-registered successfully on app resume');
              } else {
                console.warn('Failed to re-register FCM token on app resume');
              }
            }
          }
        } catch (error) {
          console.error('Error re-registering FCM token on app resume:', error);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // API base URL handled by apiUtils

  // Fetch notifications for a user
  const fetchNotifications = async (userId) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      
      if (!token || !userId) return;
      
      // Primary attempt with /api prefix
      let data;
      try {
        console.log(`Fetching notifications for user: ${userId}`);
        console.log(`User ID type:`, typeof userId);
        data = await apiGet(`/api/notifications/${userId}`);
        console.log(`API response data:`, data);
      } catch (err) {
        console.log(`API error:`, err.status, err.message);
        // If 404, retry without /api for deployments that mount routes at root
        if (err && err.status === 404) {
          console.log('Retrying without /api prefix...');
          data = await apiGet(`/notifications/${userId}`);
          console.log(`Fallback response data:`, data);
        } else {
          throw err;
        }
      }
      
      // Ensure data is an array
      const notificationsArray = Array.isArray(data) ? data : [];
      console.log(`Setting notifications:`, notificationsArray.length, 'items');
      setNotifications(notificationsArray);
      updateUnreadCount(notificationsArray);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      console.log('Server may be unavailable. Setting empty notifications.');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      
      if (!token) return false;
      
      let updated;
      try {
        updated = await apiPatch(`/api/notifications/${notificationId}/read`);
      } catch (err) {
        if (err && err.status === 404) {
          updated = await apiPatch(`/notifications/${notificationId}/read`);
        } else {
          throw err;
        }
      }
      if (updated) {
        setNotifications(prev => 
          prev.map(n => 
            n._id === notificationId ? { ...n, read: true } : n
          )
        );
        updateUnreadCount(notifications);
        return true;
      } else {
        console.error('Failed to mark notification as read');
        return false;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async (userId) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      
      if (!token || !userId) return false;
      
      let result;
      try {
        result = await apiPatch(`/api/notifications/${userId}/read-all`);
      } catch (err) {
        if (err && err.status === 404) {
          result = await apiPatch(`/notifications/${userId}/read-all`);
        } else {
          throw err;
        }
      }
      if (result?.success || result?.updatedCount >= 0) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        return true;
      } else {
        console.error('Failed to mark all notifications as read');
        return false;
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  };

  // Update unread count
  const updateUnreadCount = (notificationList) => {
    const unread = notificationList.filter(n => !n.read).length;
    setUnreadCount(unread);
  };

  // Refresh notifications
  const refreshNotifications = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        const userId = userData._id || userData.userID;
        if (userId) {
          await fetchNotifications(userId);
        }
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  };

  // Get current user ID
  const getCurrentUserId = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        return userData._id || userData.userID;
      }
      return null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    fcmToken,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    getCurrentUserId,
    registerFCMTokenAfterLogin,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
