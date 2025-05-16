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
  }, []);

  console.log('UserProvider rendered');

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
