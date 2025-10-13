// UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from AsyncStorage on app start
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

  // Save user to AsyncStorage when it changes
  const updateUser = async (userData) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      console.log('User saved to storage:', userData);
    } catch (error) {
      console.error('Error saving user to storage:', error);
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
      console.log('User and token saved to storage:', userData);
    } catch (error) {
      console.error('Error saving user and token to storage:', error);
      throw error;
    }
  };

  // Alias for updateUser (used by some components)
  const updateUserAlias = updateUser;

  // Logout function (alias for clearUser)
  const logout = clearUser;

  const value = {
    user,
    loading,
    setUser: updateUser,
    updateUser: updateUserAlias,
    clearUser,
    logout,
    setUserAndToken,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
