import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AnnouncementContext = createContext();

export const useAnnouncements = () => {
  const context = useContext(AnnouncementContext);
  if (!context) {
    throw new Error('useAnnouncements must be used within an AnnouncementProvider');
  }
  return context;
};

export const AnnouncementProvider = ({ children }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [acknowledgedAnnouncements, setAcknowledgedAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAcknowledged, setLoadingAcknowledged] = useState(false);

  // API base URL - Use the same render server as the web application
  const API_BASE = 'https://juanlms-webapp-server.onrender.com';

  // Fetch announcements based on user role
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      
      if (!token) return;
      
      const response = await fetch(`${API_BASE}/api/general-announcements`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
      } else {
        console.error('Failed to fetch announcements');
        setAnnouncements([]);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch acknowledged announcements
  const fetchAcknowledgedAnnouncements = async () => {
    try {
      setLoadingAcknowledged(true);
      const token = await AsyncStorage.getItem('jwtToken');
      
      if (!token) return;
      
      const response = await fetch(`${API_BASE}/api/general-announcements/acknowledged`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAcknowledgedAnnouncements(data);
      } else {
        console.error('Failed to fetch acknowledged announcements');
        setAcknowledgedAnnouncements([]);
      }
    } catch (error) {
      console.error('Error fetching acknowledged announcements:', error);
      setAcknowledgedAnnouncements([]);
    } finally {
      setLoadingAcknowledged(false);
    }
  };

  // Acknowledge an announcement
  const acknowledgeAnnouncement = async (announcementId) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      
      if (!token) return false;
      
      const response = await fetch(`${API_BASE}/api/general-announcements/${announcementId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Remove from unacknowledged announcements
        setAnnouncements(prev => prev.filter(a => a._id !== announcementId));
        // Refresh acknowledged announcements
        await fetchAcknowledgedAnnouncements();
        return true;
      } else {
        console.error('Failed to acknowledge announcement');
        return false;
      }
    } catch (error) {
      console.error('Error acknowledging announcement:', error);
      return false;
    }
  };

  // Refresh all announcements
  const refreshAnnouncements = () => {
    fetchAnnouncements();
    fetchAcknowledgedAnnouncements();
  };

  // Initialize announcements
  useEffect(() => {
    fetchAnnouncements();
    fetchAcknowledgedAnnouncements();
  }, []);

  const value = {
    announcements,
    acknowledgedAnnouncements,
    loading,
    loadingAcknowledged,
    fetchAnnouncements,
    fetchAcknowledgedAnnouncements,
    acknowledgeAnnouncement,
    refreshAnnouncements,
  };

  return (
    <AnnouncementContext.Provider value={value}>
      {children}
    </AnnouncementContext.Provider>
  );
};
