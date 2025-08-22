import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import io from 'socket.io-client';

const NotificationContext = createContext();

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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
  const [expoPushToken, setExpoPushToken] = useState('');
  const [socket, setSocket] = useState(null);

  // API base URL
  const API_BASE = 'http://localhost:5000/api';

  // Initialize notifications
  useEffect(() => {
    initializeNotifications();
    setupSocketConnection();
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Setup Socket.io connection for real-time updates
  const setupSocketConnection = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (token) {
        const newSocket = io(API_BASE, {
          auth: { token }
        });

        newSocket.on('connect', () => {
          console.log('Connected to notification socket');
        });

        newSocket.on('newNotification', (notification) => {
          console.log('Received real-time notification:', notification);
          addNotification(notification);
          showInAppNotification(notification);
        });

        newSocket.on('notificationRead', (notificationId) => {
          console.log('Notification marked as read:', notificationId);
          markAsRead(notificationId);
        });

        newSocket.on('disconnect', () => {
          console.log('Disconnected from notification socket');
        });

        setSocket(newSocket);
      }
    } catch (error) {
      console.error('Error setting up socket connection:', error);
    }
  };

  // Initialize notifications system
  const initializeNotifications = async () => {
    try {
      await requestPermissions();
      await registerForPushNotifications();
      await fetchNotifications();
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  // Request notification permissions
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
  };

  // Register for push notifications
  const registerForPushNotifications = async () => {
    try {
      if (Device.isDevice) {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: 'your-expo-project-id', // You'll need to set this
        });
        setExpoPushToken(token.data);
        await sendTokenToBackend(token.data);
      } else {
        console.log('Must use physical device for Push Notifications');
      }
    } catch (error) {
      console.error('Error getting push token:', error);
    }
  };

  // Send push token to backend
  const sendTokenToBackend = async (token) => {
    try {
      const userToken = await AsyncStorage.getItem('jwtToken');
      const user = await AsyncStorage.getItem('user');
      
      if (userToken && user) {
        const userData = JSON.parse(user);
        await fetch(`${API_BASE}/users/push-token`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ expoPushToken: token }),
        });
      }
    } catch (error) {
      console.error('Error sending push token to backend:', error);
    }
  };

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      const user = await AsyncStorage.getItem('user');
      
      if (!token || !user) return;
      
      const userData = JSON.parse(user);
      const response = await fetch(`${API_BASE}/notifications/${userData._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        updateUnreadCount(data);
      } else {
        console.error('Failed to fetch notifications');
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Add new notification
  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    updateUnreadCount([notification, ...notifications]);
  };

  // Update unread count
  const updateUnreadCount = (notificationList) => {
    const unread = notificationList.filter(n => !n.read).length;
    setUnreadCount(unread);
  };

  // Show in-app notification toast
  const showInAppNotification = (notification) => {
    // This will be handled by the UI components
    console.log('Show in-app notification:', notification);
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
        );
        updateUnreadCount(notifications);
        
        // Emit read status via socket
        if (socket) {
          socket.emit('markNotificationRead', notificationId);
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const user = await AsyncStorage.getItem('user');
      
      if (!token || !user) return;
      
      const userData = JSON.parse(user);
      const response = await fetch(`${API_BASE}/notifications/${userData._id}/read-all`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Refresh notifications
  const refreshNotifications = () => {
    fetchNotifications();
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    expoPushToken,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
