import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Load user from AsyncStorage on mount
    AsyncStorage.getItem('user').then(storedUser => {
      if (storedUser) setUser(JSON.parse(storedUser));
    });
    console.log('UserProvider rendered');
  }, []);

  // Function to update user data
  const updateUser = async (newUserData) => {
    try {
      const updatedUser = { ...user, ...newUserData };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
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
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('jwtToken', token);
      return { success: true };
    } catch (error) {
      console.error('Error setting user and token:', error);
      return { success: false, error: error.message };
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, updateUser, setUserAndToken }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
