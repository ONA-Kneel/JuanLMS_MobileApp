// useUserState.js - Simple user state hook without UserContext dependency
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useUserState = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from AsyncStorage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          console.log('User loaded from storage:', parsedUser);
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Update user state
  const updateUser = async (userData) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      console.log('User updated:', userData);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  // Clear user data (for logout)
  const clearUser = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('jwtToken');
      setUser(null);
      console.log('User cleared from storage');
    } catch (error) {
      console.error('Error clearing user from storage:', error);
    }
  };

  // Set user and token together (for login)
  const setUserAndToken = async (userData, token) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('jwtToken', token);
      setUser(userData);
      console.log('User and token saved:', userData);
    } catch (error) {
      console.error('Error saving user and token:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    setUser: updateUser,
    updateUser,
    clearUser,
    logout: clearUser,
    setUserAndToken,
  };
};
