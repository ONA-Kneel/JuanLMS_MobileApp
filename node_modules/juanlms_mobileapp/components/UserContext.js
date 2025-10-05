import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StorageService from '../services/storageService';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Load user from secure storage on mount
    const loadUser = async () => {
      const authResult = await StorageService.getAuthData();
      if (authResult.success && authResult.user) {
        setUser(authResult.user);
      }
    };
    loadUser();
    console.log('UserProvider rendered');
  }, []);

  // Function to update user data
  const updateUser = async (newUserData) => {
    try {
      const updatedUser = { ...user, ...newUserData };
      setUser(updatedUser);
      // Get current token to preserve it
      const authResult = await StorageService.getAuthData();
      if (authResult.success && authResult.token) {
        await StorageService.saveAuthData(updatedUser, authResult.token);
      }
      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  };

  // Function to set user and token
  const setUserAndToken = async (userData, token) => {
    try {
      setUser(userData);
      await StorageService.saveAuthData(userData, token);
      return { success: true };
    } catch (error) {
      console.error('Error setting user and token:', error);
      return { success: false, error: error.message };
    }
  };

  // Centralized logout: clear state and persisted auth
  const logout = async () => {
    try {
      setUser(null);
      // Use StorageService for complete logout (clears auth data but preserves remember me if enabled)
      const rememberResult = await StorageService.getRememberMe();
      if (rememberResult.success && rememberResult.enabled) {
        // Only clear auth data, keep remember me and credentials
        await StorageService.clearAuthData();
        await StorageService.clearFCMToken();
      } else {
        // Complete logout - clear everything
        await StorageService.logout();
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, updateUser, setUserAndToken, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
