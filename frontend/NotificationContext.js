import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGet, apiPatch } from './utils/apiUtils';
import io from 'socket.io-client';

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
  const [socket, setSocket] = useState(null);
  const [messageNotifications, setMessageNotifications] = useState([]);

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
            await fetchNotifications(userId);
          }
        }
      } catch (error) {
        console.error('Error refreshing notifications:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Setup global socket connection for message notifications
  useEffect(() => {
    const setupSocket = async () => {
      try {
        const user = await AsyncStorage.getItem('user');
        if (user) {
          const userData = JSON.parse(user);
          const userId = userData._id || userData.userID;
          
          if (userId && !socket) {
            const newSocket = io('https://juanlms-webapp-server.onrender.com', {
              transports: ['websocket'],
              reconnectionAttempts: 5,
              timeout: 10000,
            });
            
            newSocket.on('connect', () => {
              console.log('Global notification socket connected');
              newSocket.emit('addUser', userId);
            });
            
            newSocket.on('getMessage', (msg) => {
              console.log('Global message notification received:', msg);
              setMessageNotifications(prev => [...prev, {
                id: msg._id || Date.now(),
                type: 'message',
                senderId: msg.senderId,
                message: msg.message || msg.text,
                timestamp: msg.timestamp || new Date().toISOString(),
                isGroup: false
              }]);
            });
            
            newSocket.on('getGroupMessage', (msg) => {
              console.log('Global group message notification received:', msg);
              setMessageNotifications(prev => [...prev, {
                id: msg._id || Date.now(),
                type: 'group_message',
                senderId: msg.senderId,
                groupId: msg.groupId,
                message: msg.message || msg.text,
                senderName: msg.senderName,
                timestamp: msg.timestamp || new Date().toISOString(),
                isGroup: true
              }]);
            });
            
            setSocket(newSocket);
          }
        }
      } catch (error) {
        console.error('Error setting up global socket:', error);
      }
    };
    
    setupSocket();
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

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
    messageNotifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    getCurrentUserId,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
