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
        console.log('UserContext - Loading user from AsyncStorage...');
        const userData = await AsyncStorage.getItem('user');
        console.log('UserContext - Raw user data from storage:', userData);
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          console.log('UserContext - User loaded from storage:', { id: parsedUser._id, name: parsedUser.firstname, role: parsedUser.role });
        } else {
          console.log('UserContext - No user data found in storage');
        }
      } catch (error) {
        console.error('UserContext - Error loading user from storage:', error);
      } finally {
        setLoading(false);
        console.log('UserContext - Loading completed');
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

  // Set user and token together (for login)
  const setUserAndToken = async (userData, token) => {
    try {
      console.log('UserContext - setUserAndToken called with:', { user: userData, hasToken: !!token });
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('jwtToken', token);
      setUser(userData);
      console.log('UserContext - User and token saved to storage:', { id: userData._id, name: userData.firstname, role: userData.role, hasToken: !!token });
    } catch (error) {
      console.error('UserContext - Error saving user and token to storage:', error);
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

  const value = {
    user,
    loading,
    setUser: updateUser,
    setUserAndToken,
    clearUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
