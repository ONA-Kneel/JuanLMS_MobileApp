import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SecureStorage from '../services/secureStorage';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Load user from secure storage on mount
    const loadUser = async () => {
      const authResult = await SecureStorage.getAuthData();
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
      const authResult = await SecureStorage.getAuthData();
      if (authResult.success && authResult.token) {
        await SecureStorage.saveAuthData(updatedUser, authResult.token);
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
      await SecureStorage.saveAuthData(userData, token);
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
      // Use SecureStorage for complete logout (clears auth data but preserves remember me if enabled)
      const rememberResult = await SecureStorage.getRememberMe();
      if (rememberResult.success && rememberResult.enabled) {
        // Only clear auth data, keep remember me and credentials
        await SecureStorage.clearAuthData();
      } else {
        // Complete logout - clear everything
        await SecureStorage.logout();
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
