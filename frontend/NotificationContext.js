import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-root-toast';
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
  const [lastSeenNotificationId, setLastSeenNotificationId] = useState(null);
  
  // Popup notification state
  const [popupNotification, setPopupNotification] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'notification',
    data: null,
  });

  // Function to show popup notification
  const showPopupNotification = (title, message, type = 'notification', data = null) => {
    setPopupNotification({
      visible: true,
      title,
      message,
      type,
      data,
    });
  };

  // Function to hide popup notification
  const hidePopupNotification = () => {
    setPopupNotification(prev => ({
      ...prev,
      visible: false,
    }));
  };

  // Function to handle popup notification press
  const handlePopupNotificationPress = () => {
    // Close popup first
    hidePopupNotification();
    
    // Navigate based on notification type and data
    if (popupNotification.data) {
      const { screen, params } = popupNotification.data;
      if (screen) {
        // This will be handled by the component that uses this context
        console.log('Navigate to:', screen, params);
      }
    }
  };

  // Function to register device token with backend after login
  // Note: This is a placeholder for future push notification implementation
  const registerFCMTokenAfterLogin = async (userId) => {
    try {
      console.log('Device token registration not implemented yet (Firebase removed)');
      // Future: Implement native push notification token registration
      return false;
    } catch (error) {
      console.error('Error registering device token:', error);
      return false;
    }
  };

  // Auto-fetch notifications when context is initialized
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Load last seen id to avoid spamming popups on first run
        try {
          const storedLast = await AsyncStorage.getItem('lastSeenNotificationId');
          if (storedLast) setLastSeenNotificationId(storedLast);
        } catch {}

        const user = await AsyncStorage.getItem('user');
        if (user) {
          const userData = JSON.parse(user);
          console.log('User data from AsyncStorage:', userData);
          // Try _id first, then userID as fallback
          const userId = userData._id || userData.userID;
          if (userId) {
            console.log('Using user ID for notifications:', userId);
            await fetchNotifications(userId, { triggerPopups: true });
          }
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();
    
    // Set up interval to refresh notifications every 30 seconds (like web app)
    const interval = setInterval(async () => {
      try {
        const user = await AsyncStorage.getItem('user');
        if (user) {
          const userData = JSON.parse(user);
          const userId = userData._id || userData.userID;
          if (userId) {
            await fetchNotifications(userId, { triggerPopups: true });
          }
        }
      } catch (error) {
        console.error('Error refreshing notifications:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Fetch notifications for a user
  const fetchNotifications = async (userId, options = {}) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      
      if (!token || !userId) return;
      
      // apiUtils.js handles automatic retry with fallback URLs
      console.log(`Fetching notifications for user: ${userId}`);
      console.log(`User ID type:`, typeof userId);
      const data = await apiGet(`/api/notifications/${userId}`);
      console.log(`API response data:`, data);
      
      // Ensure data is an array
      const notificationsArray = Array.isArray(data) ? data : [];
      console.log(`Setting notifications:`, notificationsArray.length, 'items');
      setNotifications(notificationsArray);
      updateUnreadCount(notificationsArray);

      // Trigger in-app popups for any new items since last seen
      if (options.triggerPopups) {
        try {
          const newest = notificationsArray[0];
          if (newest && newest._id && newest._id !== lastSeenNotificationId) {
            // Find all notifications newer than lastSeenNotificationId
            const newItems = lastSeenNotificationId
              ? notificationsArray.filter(n => n._id !== lastSeenNotificationId)
              : notificationsArray.slice(0, 1);
            for (const item of newItems.reverse()) {
              const type = item?.type || 'notification';
              if (['assignment', 'quiz', 'announcement', 'activity'].includes(type)) {
                const title = item?.title || 'New notification';
                const message = item?.message || '';
                showPopupNotification(title, message, type, {
                  screen: 'NotificationsScreen',
                  params: undefined,
                });
              }
            }
            setLastSeenNotificationId(newest._id);
            try { await AsyncStorage.setItem('lastSeenNotificationId', newest._id); } catch {}
          }
        } catch (popupErr) {
          console.log('Popup trigger error:', popupErr);
        }
      }
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
      
      // apiUtils.js handles automatic retry with fallback URLs
      const updated = await apiPatch(`/api/notifications/${notificationId}/read`);
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
      
      // apiUtils.js handles automatic retry with fallback URLs
      const result = await apiPatch(`/api/notifications/${userId}/read-all`);
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
    fcmToken: null, // Not supported without Firebase
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    getCurrentUserId,
    registerFCMTokenAfterLogin,
    // Popup notification functions
    popupNotification,
    showPopupNotification,
    hidePopupNotification,
    handlePopupNotificationPress,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
