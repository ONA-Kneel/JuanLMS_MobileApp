import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import meetingService from './services/meetingService';

// Meeting Context
const MeetingContext = createContext();

// Meeting Action Types
const MEETING_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_MEETING_STATE: 'SET_MEETING_STATE',
  SET_PARTICIPANTS: 'SET_PARTICIPANTS',
  SET_IS_HOST: 'SET_IS_HOST',
  SET_IS_MUTED: 'SET_IS_MUTED',
  SET_IS_VIDEO_ON: 'SET_IS_VIDEO_ON',
  SET_IS_SCREEN_SHARING: 'SET_IS_SCREEN_SHARING',
  SET_IS_JOINING: 'SET_IS_JOINING',
  SET_IS_IN_MEETING: 'SET_IS_IN_MEETING',
  RESET_MEETING_STATE: 'RESET_MEETING_STATE',
};

// Initial State
const initialState = {
  // Meeting Status
  isJoining: false,
  isInMeeting: false,
  error: null,
  loading: false,
  
  // Meeting Data
  currentMeeting: null,
  participants: [],
  isHost: false,
  
  // Media Controls
  isMuted: false,
  isVideoOn: true,
  isScreenSharing: false,
  
  // Network Status
  isOnline: true,
  
  // Meeting Settings
  settings: {
    enableNoiseCancellation: true,
    enableBackgroundBlur: false,
    enableRecording: false,
    enableChat: true,
    enableReactions: true,
  }
};

// Reducer
const meetingReducer = (state, action) => {
  switch (action.type) {
    case MEETING_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case MEETING_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case MEETING_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    
    case MEETING_ACTIONS.SET_MEETING_STATE:
      return { ...state, ...action.payload };
    
    case MEETING_ACTIONS.SET_PARTICIPANTS:
      return { ...state, participants: action.payload };
    
    case MEETING_ACTIONS.SET_IS_HOST:
      return { ...state, isHost: action.payload };
    
    case MEETING_ACTIONS.SET_IS_MUTED:
      return { ...state, isMuted: action.payload };
    
    case MEETING_ACTIONS.SET_IS_VIDEO_ON:
      return { ...state, isVideoOn: action.payload };
    
    case MEETING_ACTIONS.SET_IS_SCREEN_SHARING:
      return { ...state, isScreenSharing: action.payload };
    
    case MEETING_ACTIONS.SET_IS_JOINING:
      return { ...state, isJoining: action.payload };
    
    case MEETING_ACTIONS.SET_IS_IN_MEETING:
      return { ...state, isInMeeting: action.payload };
    
    case MEETING_ACTIONS.RESET_MEETING_STATE:
      return { ...initialState, settings: state.settings };
    
    default:
      return state;
  }
};

// Meeting Provider Component
export const MeetingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(meetingReducer, initialState);

  // Initialize meeting service
  useEffect(() => {
    const initializeService = async () => {
      try {
        await meetingService.initialize();
      } catch (error) {
        dispatch({ type: MEETING_ACTIONS.SET_ERROR, payload: error.message });
      }
    };

    initializeService();

    return () => {
      meetingService.cleanup();
    };
  }, []);

  // Request permissions for Android
  const requestPermissions = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const cameraPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to your camera to join video meetings.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        const microphonePermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone to join video meetings.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (cameraPermission !== PermissionsAndroid.RESULTS.GRANTED || 
            microphonePermission !== PermissionsAndroid.RESULTS.GRANTED) {
          throw new Error('Camera and microphone permissions are required to join meetings');
        }
      } catch (error) {
        throw error;
      }
    }
  }, []);

  // Create or join meeting
  const createOrJoinMeeting = useCallback(async (meetingData, isHost = false) => {
    try {
      dispatch({ type: MEETING_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: MEETING_ACTIONS.CLEAR_ERROR });

      // Request permissions first
      await requestPermissions();

      // Create or join meeting
      const result = await meetingService.createOrJoinMeeting(meetingData, isHost);
      
      dispatch({
        type: MEETING_ACTIONS.SET_MEETING_STATE,
        payload: {
          currentMeeting: meetingData,
          isInMeeting: true,
          isHost: isHost,
          participants: result.meetingState.participants || [],
          isMuted: result.meetingState.isMuted || false,
          isVideoOn: result.meetingState.isVideoOn !== false,
          isScreenSharing: result.meetingState.isScreenSharing || false,
        }
      });

      return result;
    } catch (error) {
      dispatch({ type: MEETING_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: MEETING_ACTIONS.SET_LOADING, payload: false });
    }
  }, [requestPermissions]);

  // Leave meeting
  const leaveMeeting = useCallback(async () => {
    try {
      dispatch({ type: MEETING_ACTIONS.SET_LOADING, payload: true });
      
      await meetingService.leaveMeeting();
      
      dispatch({ type: MEETING_ACTIONS.RESET_MEETING_STATE });
    } catch (error) {
      dispatch({ type: MEETING_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: MEETING_ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  // Toggle microphone
  const toggleMicrophone = useCallback(async () => {
    try {
      await meetingService.toggleMicrophone();
      const newState = meetingService.getMeetingState();
      dispatch({ type: MEETING_ACTIONS.SET_IS_MUTED, payload: newState.isMuted });
    } catch (error) {
      dispatch({ type: MEETING_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    try {
      await meetingService.toggleCamera();
      const newState = meetingService.getMeetingState();
      dispatch({ type: MEETING_ACTIONS.SET_IS_VIDEO_ON, payload: newState.isVideoOn });
    } catch (error) {
      dispatch({ type: MEETING_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);

  // Toggle screen sharing
  const toggleScreenShare = useCallback(async () => {
    try {
      await meetingService.toggleScreenShare();
      const newState = meetingService.getMeetingState();
      dispatch({ type: MEETING_ACTIONS.SET_IS_SCREEN_SHARING, payload: newState.isScreenSharing });
    } catch (error) {
      dispatch({ type: MEETING_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);

  // End meeting for all (host only)
  const endMeetingForAll = useCallback(async () => {
    try {
      if (!state.isHost) {
        throw new Error('Only the host can end the meeting for everyone');
      }

      await meetingService.endMeetingForAll();
      dispatch({ type: MEETING_ACTIONS.RESET_MEETING_STATE });
    } catch (error) {
      dispatch({ type: MEETING_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.isHost]);

  // Update settings
  const updateSettings = useCallback((newSettings) => {
    dispatch({
      type: MEETING_ACTIONS.SET_MEETING_STATE,
      payload: {
        settings: { ...state.settings, ...newSettings }
      }
    });
  }, [state.settings]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: MEETING_ACTIONS.CLEAR_ERROR });
  }, []);

  // Get meeting statistics
  const getMeetingStats = useCallback(() => {
    return {
      participantCount: state.participants.length,
      isHost: state.isHost,
      isMuted: state.isMuted,
      isVideoOn: state.isVideoOn,
      isScreenSharing: state.isScreenSharing,
      meetingDuration: state.currentMeeting ? 
        Date.now() - new Date(state.currentMeeting.createdAt).getTime() : 0,
    };
  }, [state]);

  // Context value
  const value = {
    // State
    ...state,
    
    // Actions
    createOrJoinMeeting,
    leaveMeeting,
    toggleMicrophone,
    toggleCamera,
    toggleScreenShare,
    endMeetingForAll,
    updateSettings,
    clearError,
    getMeetingStats,
  };

  return (
    <MeetingContext.Provider value={value}>
      {children}
    </MeetingContext.Provider>
  );
};

// Custom hook to use meeting context
export const useMeeting = () => {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeeting must be used within a MeetingProvider');
  }
  return context;
};

// Export action types for external use
export { MEETING_ACTIONS };
