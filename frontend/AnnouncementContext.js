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
  // TODO: Make this configurable based on environment
  const API_BASE = 'https://juanlms-webapp-server.onrender.com';
  
  // Fallback API base URL for local development
  const FALLBACK_API_BASE = 'http://localhost:5000';
  
  // Get API base URL from environment or use default
  const getApiBaseUrl = () => {
    // Check if we're in development mode
    if (__DEV__) {
      return FALLBACK_API_BASE;
    }
    return API_BASE;
  };

  // Fetch announcements based on user role
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      
      if (!token) {
        console.log('No JWT token found for announcements');
        return;
      }
      
      const apiUrl = getApiBaseUrl();
      console.log('Fetching announcements from:', `${apiUrl}/api/general-announcements`);
      let response = await fetch(`${apiUrl}/api/general-announcements`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Announcements response status:', response.status);
      
      // Try fallback URL if primary fails
      if (!response.ok && (response.status >= 500 || response.status === 404)) {
        const fallbackUrl = apiUrl === API_BASE ? FALLBACK_API_BASE : API_BASE;
        console.log('Primary API failed, trying fallback:', `${fallbackUrl}/api/general-announcements`);
        response = await fetch(`${fallbackUrl}/api/general-announcements`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        console.log('Fallback announcements response status:', response.status);
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched announcements:', data.length);
        
        // Get user role for filtering
        const userStr = await AsyncStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const userRole = user?.role?.toLowerCase() || '';
        
        // Apply role-based filtering like web app
        const filtered = (data || []).filter((announcement) => {
          const creatorRole = (announcement?.createdBy?.role || "").toLowerCase();
          
          // For students: show announcements from Principal OR VPE
          if (userRole.includes('student')) {
            const fromPrincipal = creatorRole.includes("principal");
            const fromVPE = creatorRole.includes("vice") && creatorRole.includes("education");
            return fromPrincipal || fromVPE;
          }
          
          // For faculty: show announcements from Principal OR VPE
          if (userRole.includes('faculty') || userRole.includes('teacher')) {
            const fromPrincipal = creatorRole.includes("principal");
            const fromVPE = creatorRole.includes("vice") && creatorRole.includes("education");
            return fromPrincipal || fromVPE;
          }
          
          // For VPE: show announcements from Principal
          if (userRole.includes('vpe') || userRole.includes('vice president')) {
            return creatorRole.includes("principal");
          }
          
          // For Principal: show announcements from VPE
          if (userRole.includes('principal')) {
            return creatorRole.includes("vice") && creatorRole.includes("education");
          }
          
          // For Admin: show all announcements
          if (userRole.includes('admin')) {
            return true;
          }
          
          // Default: show all
          return true;
        });
        
        console.log('Filtered announcements for role:', userRole, 'count:', filtered.length);
        setAnnouncements(filtered);
      } else {
        console.error('Failed to fetch announcements, status:', response.status);
        setAnnouncements([]);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
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
      
      if (!token) {
        console.log('No JWT token found for acknowledged announcements');
        return;
      }
      
      const apiUrl = getApiBaseUrl();
      console.log('Fetching acknowledged announcements from:', `${apiUrl}/api/general-announcements/acknowledged`);
      let response = await fetch(`${apiUrl}/api/general-announcements/acknowledged`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Acknowledged announcements response status:', response.status);
      
      // Try fallback URL if primary fails
      if (!response.ok && (response.status >= 500 || response.status === 404)) {
        const fallbackUrl = apiUrl === API_BASE ? FALLBACK_API_BASE : API_BASE;
        console.log('Primary API failed, trying fallback:', `${fallbackUrl}/api/general-announcements/acknowledged`);
        response = await fetch(`${fallbackUrl}/api/general-announcements/acknowledged`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        console.log('Fallback acknowledged announcements response status:', response.status);
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched acknowledged announcements:', data.length);
        console.log('Acknowledged announcements data:', data);
        setAcknowledgedAnnouncements(data);
      } else {
        console.error('Failed to fetch acknowledged announcements, status:', response.status);
        setAcknowledgedAnnouncements([]);
      }
    } catch (error) {
      console.error('Error fetching acknowledged announcements:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
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
    const initializeAnnouncements = async () => {
      try {
        await fetchAnnouncements();
        await fetchAcknowledgedAnnouncements();
      } catch (error) {
        console.error('Error initializing announcements:', error);
        // Set empty state to prevent render errors
        setAnnouncements([]);
        setAcknowledgedAnnouncements([]);
      }
    };

    // Add a small delay to prevent race conditions
    const timeoutId = setTimeout(initializeAnnouncements, 200);
    return () => clearTimeout(timeoutId);
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
