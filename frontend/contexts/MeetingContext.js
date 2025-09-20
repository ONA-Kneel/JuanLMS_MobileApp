import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform, AppState } from 'react-native';
import meetingSyncService from '../services/meetingSyncService';

const MeetingContext = createContext();

export const useMeeting = () => {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeeting must be used within a MeetingProvider');
  }
  return context;
};

export const MeetingProvider = ({ children }) => {
  const [meetings, setMeetings] = useState([]);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'error'

  // Initialize meeting sync
  useEffect(() => {
    meetingSyncService.startSync();
    
    return () => {
      meetingSyncService.stopSync();
    };
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        // App became active, sync meetings
        syncMeetings();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, []);

  // Sync meetings with backend
  const syncMeetings = useCallback(async () => {
    try {
      setSyncStatus('syncing');
      setError(null);
      
      // Get cached meetings first for immediate display
      const cachedMeetings = await meetingSyncService.getCachedMeetings();
      if (cachedMeetings.length > 0) {
        setMeetings(cachedMeetings);
      }
      
      // Then sync with backend
      await meetingSyncService.syncMeetings();
      
      // Update with fresh data
      const freshMeetings = await meetingSyncService.getCachedMeetings();
      setMeetings(freshMeetings);
      
      setSyncStatus('idle');
    } catch (err) {
      console.error('Error syncing meetings:', err);
      setError(err.message);
      setSyncStatus('error');
    }
  }, []);

  // Join meeting
  const joinMeeting = useCallback(async (meetingId, userInfo) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await meetingSyncService.joinMeeting(meetingId, userInfo);
      
      setActiveMeeting({
        id: meetingId,
        ...result,
        userInfo,
        platform: Platform.OS,
        joinedAt: new Date().toISOString(),
      });
      
      return result;
    } catch (err) {
      console.error('Error joining meeting:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Leave meeting
  const leaveMeeting = useCallback(async (meetingId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await meetingSyncService.leaveMeeting(meetingId);
      
      if (success) {
        setActiveMeeting(null);
      }
      
      return success;
    } catch (err) {
      console.error('Error leaving meeting:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create meeting
  const createMeeting = useCallback(async (meetingData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await meetingSyncService.createMeeting(meetingData);
      
      // Refresh meetings list
      await syncMeetings();
      
      return result;
    } catch (err) {
      console.error('Error creating meeting:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [syncMeetings]);

  // Delete meeting
  const deleteMeeting = useCallback(async (meetingId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await meetingSyncService.deleteMeeting(meetingId);
      
      if (success) {
        // Refresh meetings list
        await syncMeetings();
      }
      
      return success;
    } catch (err) {
      console.error('Error deleting meeting:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [syncMeetings]);

  // Get class meetings
  const getClassMeetings = useCallback(async (classId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const classMeetings = await meetingSyncService.getClassMeetings(classId);
      
      return classMeetings;
    } catch (err) {
      console.error('Error getting class meetings:', err);
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if meeting is active
  const isMeetingActive = useCallback(async (meetingId) => {
    try {
      return await meetingSyncService.isMeetingActive(meetingId);
    } catch (err) {
      console.error('Error checking meeting status:', err);
      return false;
    }
  }, []);

  // Get active participants count
  const getActiveParticipantsCount = useCallback(async (meetingId) => {
    try {
      return await meetingSyncService.getActiveParticipantsCount(meetingId);
    } catch (err) {
      console.error('Error getting participants count:', err);
      return 0;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async (meetingId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await meetingSyncService.startRecording(meetingId);
      
      return result;
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(async (meetingId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await meetingSyncService.stopRecording(meetingId);
      
      return success;
    } catch (err) {
      console.error('Error stopping recording:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get meeting by ID
  const getMeetingById = useCallback((meetingId) => {
    return meetings.find(meeting => meeting._id === meetingId);
  }, [meetings]);

  // Get meetings by class
  const getMeetingsByClass = useCallback((classId) => {
    return meetings.filter(meeting => meeting.classID === classId);
  }, [meetings]);

  // Get active meetings
  const getActiveMeetings = useCallback(() => {
    return meetings.filter(meeting => meeting.status === 'ongoing');
  }, [meetings]);

  // Get scheduled meetings
  const getScheduledMeetings = useCallback(() => {
    return meetings.filter(meeting => meeting.status === 'scheduled');
  }, [meetings]);

  // Get ended meetings
  const getEndedMeetings = useCallback(() => {
    return meetings.filter(meeting => meeting.status === 'ended');
  }, [meetings]);

  const value = {
    // State
    meetings,
    activeMeeting,
    isLoading,
    error,
    syncStatus,
    
    // Actions
    syncMeetings,
    joinMeeting,
    leaveMeeting,
    createMeeting,
    deleteMeeting,
    getClassMeetings,
    isMeetingActive,
    getActiveParticipantsCount,
    startRecording,
    stopRecording,
    clearError,
    
    // Getters
    getMeetingById,
    getMeetingsByClass,
    getActiveMeetings,
    getScheduledMeetings,
    getEndedMeetings,
    
    // Setters
    setActiveMeeting,
    setMeetings,
  };

  return (
    <MeetingContext.Provider value={value}>
      {children}
    </MeetingContext.Provider>
  );
};

export default MeetingContext;
