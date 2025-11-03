import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform, Alert, Dimensions, TextInput } from 'react-native';
import {
  StreamVideo,
  StreamVideoClient,
  Call,
  StreamCall,
  CallContent,
  CallControls,
  CallParticipantsList,
  CallParticipantsGrid,
  CallParticipantsSpotlight,
  Lobby,
  RingingCallContent,
  useCall,
  useCallStateHooks,
  useStreamVideoClient,
  useParticipantCount,
  useCallSettings,
  useCallRecordingState,
  useCallScreenShareState,
  useCallChatState,
  useCallReactionState,
} from '@stream-io/video-react-native-sdk';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Generate call ID from meeting data
const generateCallId = (meetingData) => {
  if (meetingData?.meetingId) return String(meetingData.meetingId);
  if (meetingData?._id) return String(meetingData._id);
  if (meetingData?.title) return String(meetingData.title).replace(/\s+/g, '-').toLowerCase();
  return `meeting-${Date.now()}`;
};

export default function SimpleStreamMeetingRoom({
  isOpen,
  onClose,
  onLeave,
  meetingData,
  currentUser,
  credentials,
  isHost = false,
  hostUserId = null,
}) {
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);
  const [showDocumentShare, setShowDocumentShare] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted
  const [isVideoOn, setIsVideoOn] = useState(false); // Start with video off
  const [layout, setLayout] = useState('spotlight'); // Default to spotlight for better screen sharing visibility
  const [reactions, setReactions] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const isInitialized = useRef(false);
  const initTimeoutRef = useRef(null);
  
  // Credential fetching state
  const [streamCredentials, setStreamCredentials] = useState(null);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);

  // Fetch Stream credentials from backend with retry logic
  useEffect(() => {
    const fetchCredentials = async (retryCount = 0) => {
      if (!isOpen || !meetingData) return;
      
      setIsLoadingCredentials(true);
      try {
        const callId = generateCallId(meetingData);
        
        const token = await AsyncStorage.getItem('jwtToken');
        if (!token) {
          setError('No authentication token found. Please log in again.');
          setIsLoadingCredentials(false);
          return;
        }
        
        const response = await fetch('https://juanlms-webapp-server.onrender.com/api/meetings/stream-credentials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ callId })
        });
        
        // Handle 401 Unauthorized - token expired
        if (response.status === 401) {
          console.warn('[STREAM-CREDS] Token expired, user needs to re-authenticate');
          setError('Your session has expired. Please close and rejoin the meeting.');
          setIsLoadingCredentials(false);
          return;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setStreamCredentials(data);
          console.log('[STREAM-CREDS] Successfully fetched credentials from backend');
        } else {
          console.error('[STREAM-CREDS] Failed to fetch credentials:', data.message);
          setError(data.message || 'Failed to get Stream credentials');
        }
      } catch (error) {
        console.error('[STREAM-CREDS] Error fetching credentials:', error);
        // Retry once if it's a network error
        if (retryCount === 0 && (error.message.includes('Network') || error.message.includes('fetch'))) {
          console.log('[STREAM-CREDS] Retrying credential fetch...');
          setTimeout(() => fetchCredentials(1), 1000);
          return;
        }
        setError('Failed to connect to Stream service. Please try again.');
      } finally {
        setIsLoadingCredentials(false);
      }
    };
    
    fetchCredentials();
  }, [isOpen, meetingData]);

  // Use provided credentials or fetched credentials
  const finalCredentials = useMemo(() => {
    return credentials || streamCredentials;
  }, [credentials, streamCredentials]);

  // Determine callId preference: explicit credentials.callId, then meetingData.meetingId/_id, then parsed from roomUrl
  const resolvedCallId = useMemo(() => {
    if (finalCredentials?.callId) return String(finalCredentials.callId);
    if (meetingData?.meetingId) return String(meetingData.meetingId);
    if (meetingData?._id) return String(meetingData._id);
    try {
      if (meetingData?.roomUrl) {
        const url = new URL(meetingData.roomUrl);
        const path = url.pathname || '';
        const name = path.startsWith('/') ? path.slice(1) : path;
        if (name) return decodeURIComponent(name);
      }
    } catch (e) {
      console.debug('SimpleStreamMeetingRoom: failed to parse roomUrl', e);
    }
    return generateCallId(meetingData);
  }, [finalCredentials?.callId, meetingData]);

  const userInfo = useMemo(() => {
    // Use the generated stream credentials userInfo, with fallback
    const streamUserInfo = finalCredentials?.userInfo;
    if (streamUserInfo && streamUserInfo.name) {
      console.log('[SimpleStreamMeetingRoom] Using userInfo from backend:', streamUserInfo);
      return streamUserInfo;
    }
    
    // Fallback: get user info from currentUser prop
    const fallbackUserInfo = {
      id: finalCredentials?.userId || currentUser?.id || 'user',
      name: currentUser?.name || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'User',
      email: currentUser?.email || ''
    };
    console.log('[SimpleStreamMeetingRoom] Using fallback userInfo:', fallbackUserInfo);
    return fallbackUserInfo;
  }, [finalCredentials, currentUser]);

  // Initialize Stream.io client
  useEffect(() => {
    if (!isOpen || !finalCredentials) return;

    // Prevent multiple initializations
    if (isInitialized.current || client || call) {
      console.log('Already initialized or client/call exists, skipping initialization');
      return;
    }

    isInitialized.current = true;

    // Clear any existing timeout
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
    }

    // Add a small delay to prevent rapid re-initializations
    initTimeoutRef.current = setTimeout(async () => {
      const initClient = async () => {
      try {
        setIsConnecting(true);
        setError(null);

        if (isLoadingCredentials) {
          setError('Loading Stream credentials...');
          return;
        }
        if (!finalCredentials) {
          setError('Failed to load Stream credentials');
          return;
        }
        if (!finalCredentials.apiKey || !finalCredentials.token || !finalCredentials.userId) {
          setError('Missing Stream credentials');
          return;
        }
        if (!resolvedCallId) {
          setError('Missing callId');
          return;
        }

        const streamClient = new StreamVideoClient({
          apiKey: finalCredentials.apiKey,
          user: userInfo,
          token: finalCredentials.token,
        });
        console.log('[SimpleStreamMeetingRoom] Created client with user:', userInfo);

        setClient(streamClient);

        // Create call and join with mic/camera disabled by default
        const callInstance = streamClient.call('default', resolvedCallId);
        
        // Ensure mic and camera are disabled at start for the local user
        try {
          if (callInstance.microphone && typeof callInstance.microphone.setEnabled === 'function') {
            await callInstance.microphone.setEnabled(false);
            console.log('[SimpleStreamMeetingRoom] Microphone disabled before join');
          }
        } catch (e) { console.debug('SimpleStreamMeetingRoom: pre-join mic disable error', e); }
        try {
          if (callInstance.camera && typeof callInstance.camera.setEnabled === 'function') {
            await callInstance.camera.setEnabled(false);
            console.log('[SimpleStreamMeetingRoom] Camera disabled before join');
          }
        } catch (e) { console.debug('SimpleStreamMeetingRoom: pre-join camera disable error', e); }

        await callInstance.join({ create: true });

        // Double-check post-join that tracks remain disabled
        try {
          if (callInstance.microphone && typeof callInstance.microphone.setEnabled === 'function') {
            await callInstance.microphone.setEnabled(false);
            console.log('[SimpleStreamMeetingRoom] Microphone disabled after join');
          }
        } catch (e) { console.debug('SimpleStreamMeetingRoom: post-join mic disable error', e); }
        try {
          if (callInstance.camera && typeof callInstance.camera.setEnabled === 'function') {
            await callInstance.camera.setEnabled(false);
            console.log('[SimpleStreamMeetingRoom] Camera disabled after join');
          }
        } catch (e) { console.debug('SimpleStreamMeetingRoom: post-join camera disable error', e); }
        
        // Set state to reflect muted and video off
        setIsMuted(true);
        setIsVideoOn(false);
        console.log('[SimpleStreamMeetingRoom] User joined with mic muted and camera off');
        setCall(callInstance);

        // Check if call is already connected
        console.log('Call state after join:', callInstance.state.status);
        const currentStatus = callInstance.state.status;
        if (currentStatus === 'joined' || currentStatus === 'active') {
          console.log('Call already joined/active');
          setIsConnecting(false);
        } else {
          // If not immediately connected, wait a bit and check again
          setTimeout(() => {
            const status = callInstance.state.status;
            console.log('[SimpleStreamMeetingRoom] Checking call status after delay:', status);
            if (status === 'joined' || status === 'active') {
              setIsConnecting(false);
            }
          }, 2000);
        }

        // Set up call event listeners
        // Define cleanup function before listeners
        let connectionTimeout;
        let connectionCheckInterval;
        
        const cleanupConnection = () => {
          if (connectionTimeout) clearTimeout(connectionTimeout);
          if (connectionCheckInterval) clearInterval(connectionCheckInterval);
        };
        
        callInstance.on('call.updated', (event) => {
          console.log('Call updated:', event);
          console.log('Call status:', event.call.state.status);
          console.log('Call state:', callInstance.state);
          console.log('Participants:', callInstance.state.participants);
          console.log('Screen sharing state:', callInstance.state.screenShare);
          // Reset connecting state when call is updated (connected)
          if (event.call.state.status === 'joined' || event.call.state.status === 'active') {
            setIsConnecting(false);
            cleanupConnection();
          }
        });

        // Listen for call session started event
        callInstance.on('call.session_started', () => {
          console.log('Call session started');
          setIsConnecting(false);
          cleanupConnection();
        });

        // Listen for call joined event
        callInstance.on('call.joined', () => {
          console.log('Call joined');
          setIsConnecting(false);
          cleanupConnection();
        });

        callInstance.on('call.ended', () => {
          console.log('Call ended');
          onLeave?.();
        });

        callInstance.on('call.recording.started', () => {
          setIsRecording(true);
        });

        callInstance.on('call.recording.stopped', () => {
          setIsRecording(false);
        });

        callInstance.on('call.screen_share.started', () => {
          setIsScreenSharing(true);
          setLayout('spotlight'); // Switch to spotlight when screen sharing starts
          console.log('[SimpleStreamMeetingRoom] Screen sharing started - switched to spotlight layout');
        });

        callInstance.on('call.screen_share.stopped', () => {
          setIsScreenSharing(false);
          setLayout('grid'); // Switch back to grid when screen sharing stops
          console.log('[SimpleStreamMeetingRoom] Screen sharing stopped - switched to grid layout');
        });

        // Listen for microphone and camera state changes to keep UI in sync
        callInstance.on('call.microphone_changed', (event) => {
          console.log('Microphone state changed:', event);
          setIsMuted(!event.enabled);
        });

        callInstance.on('call.camera_changed', (event) => {
          console.log('Camera state changed:', event);
          setIsVideoOn(event.enabled);
        });

        callInstance.on('call.reaction', (event) => {
          setReactions(prev => [...prev, event]);
          // Remove reaction after 3 seconds
          setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== event.id));
          }, 3000);
        });

        callInstance.on('call.chat', (event) => {
          setChatMessages(prev => [...prev, event]);
        });

        // Set up participant count tracking
        const updateParticipantCount = () => {
          const count = callInstance.state.participants?.length || 0;
          setParticipantCount(count);
        };

        callInstance.on('call.participant_joined', updateParticipantCount);
        callInstance.on('call.participant_left', updateParticipantCount);

        updateParticipantCount();

        // Listen for connection errors, especially token expiration
        callInstance.on('connection.changed', (event) => {
          console.log('[SimpleStreamMeetingRoom] Connection changed:', event);
          if (event.online === false) {
            console.warn('[SimpleStreamMeetingRoom] Connection lost');
          }
        });

        // Listen for errors from the call
        callInstance.on('error', (err) => {
          console.error('[SimpleStreamMeetingRoom] Call error:', err);
          const errorCode = err.code || err.StatusCode;
          const errorMessage = err.message || '';
          
          if (errorCode === 40 || errorCode === 401 || errorMessage.includes('token is expired') || errorMessage.includes('AuthErrorTokenExpired')) {
            console.warn('[SimpleStreamMeetingRoom] Token expired during call');
            setError('Your session has expired. Please close and rejoin the meeting.');
            setIsConnecting(false);
          }
        });

        // Set a timeout to ensure connecting state is reset if call doesn't connect
        connectionTimeout = setTimeout(() => {
          console.warn('[SimpleStreamMeetingRoom] Connection timeout - forcing connecting state to false');
          if (callInstance.state.status !== 'joined' && callInstance.state.status !== 'active') {
            console.warn('[SimpleStreamMeetingRoom] Call not connected after timeout, status:', callInstance.state.status);
            setError('Connection timeout. Please try again.');
          }
          setIsConnecting(false);
        }, 10000); // 10 second timeout

        // Check periodically and cleanup when connected
        connectionCheckInterval = setInterval(() => {
          const status = callInstance.state.status;
          if (status === 'joined' || status === 'active') {
            cleanupConnection();
          }
        }, 500);

      } catch (err) {
        console.error('Error initializing Stream client:', err);
        setIsConnecting(false); // Always reset connecting state on error
        
        // Check if error is related to token expiration
        const errorMessage = err.message || '';
        const errorCode = err.code || err.StatusCode;
        
        if (errorCode === 40 || errorCode === 401 || errorMessage.includes('token is expired') || errorMessage.includes('AuthErrorTokenExpired')) {
          console.warn('[STREAM-CREDS] Stream token expired, user needs fresh credentials');
          setError('Authentication expired. Please close and rejoin the meeting with fresh credentials.');
        } else {
          setError(err.message || 'Failed to initialize meeting');
        }
      }
    };

    initClient();
    }, 100); // 100ms delay

    return () => {
      // Clear timeout
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      
      if (call) {
        call.leave();
      }
      if (client) {
        client.disconnectUser();
      }
      // Reset initialization flag when component unmounts
      isInitialized.current = false;
    };
  }, [isOpen, finalCredentials, resolvedCallId, userInfo, isLoadingCredentials]);

  // Track screen sharing state changes
  useEffect(() => {
    if (call) {
      console.log('[SimpleStreamMeetingRoom] Screen sharing state changed:', isScreenSharing);
      console.log('[SimpleStreamMeetingRoom] Current layout:', layout);
      console.log('[SimpleStreamMeetingRoom] Call participants:', call.state.participants);
    }
  }, [isScreenSharing, layout, call]);

  // If call ends (host clicked end for everyone), auto leave/redirect
  useEffect(() => {
    if (!call) return;
    let endedInterval;
    try {
      if (typeof call.on === 'function') {
        call.on('call.ended', handleLeave);
        call.on('ended', handleLeave);
      }
    } catch (err) { void err; }
    endedInterval = setInterval(() => {
      try {
        const ended = !!(call.state?.call?.ended || call.state?.ended || call.state?.status === 'ended');
        if (ended) {
          clearInterval(endedInterval);
          handleLeave();
        }
      } catch (err) { void err; }
    }, 1500);
    return () => {
      clearInterval(endedInterval);
      try { if (typeof call.off === 'function') { call.off('call.ended', handleLeave); call.off('ended', handleLeave); } } catch (err) { void err; }
    };
  }, [handleLeave, call]);

  // Reset state when component closes
  useEffect(() => {
    if (!isOpen) {
      setIsConnecting(false);
      setError(null);
      setShowParticipants(false);
      setShowStats(false);
      setShowChat(false);
      setShowConfirmLeave(false);
      setParticipantCount(0);
      setIsRecording(false);
      setIsScreenSharing(false);
      setIsMuted(true);
      setIsVideoOn(false);
      setLayout('grid');
      setReactions([]);
      setChatMessages([]);
      setNewMessage('');
      isInitialized.current = false;
    }
  }, [isOpen]);

  const handleLeave = useCallback(async () => {
    try {
      if (call) {
        await call.leave();
      }
      onLeave?.();
    } catch (err) {
      console.error('Error leaving call:', err);
      onLeave?.();
    }
  }, [call, onLeave]);

  const handleEndCall = useCallback(async () => {
    try {
      if (call && isHost) {
        await call.endCall();
      }
      onLeave?.();
    } catch (err) {
      console.error('Error ending call:', err);
      onLeave?.();
    }
  }, [call, isHost, onLeave]);

  const toggleMute = useCallback(async () => {
    try {
      if (call) {
        await call.microphone.toggle();
        setIsMuted(!isMuted);
      }
    } catch (err) {
      console.error('Error toggling mute:', err);
    }
  }, [call, isMuted]);

  const toggleVideo = useCallback(async () => {
    try {
      if (call) {
        await call.camera.toggle();
        setIsVideoOn(!isVideoOn);
      }
    } catch (err) {
      console.error('Error toggling video:', err);
    }
  }, [call, isVideoOn]);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (!call) {
        Alert.alert('Error', 'Call not available');
        return;
      }

      // Disable screen sharing on iOS devices
      if (Platform.OS === 'ios') {
        Alert.alert(
          'Screen Sharing Not Available',
          'Screen sharing is not supported on iOS devices. Please use Android or web for screen sharing features.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (Platform.OS === 'web') {
        // For web, use the standard screen share
        if (isScreenSharing) {
          await call.stopScreenShare();
        } else {
          await call.startScreenShare();
        }
      } else {
        // For Android devices, check permissions first
        if (Platform.OS === 'android') {
          const { PermissionsAndroid } = require('react-native');
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.SYSTEM_ALERT_WINDOW,
            {
              title: 'Screen Share Permission',
              message: 'This app needs permission to share your screen during meetings.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              'Permission Required', 
              'Screen sharing requires permission to display over other apps. Please enable this permission in your device settings.',
              [{ text: 'OK' }]
            );
            return;
          }
        }

        if (isScreenSharing) {
          await call.stopScreenShare();
          Alert.alert('Success', 'Screen sharing stopped');
        } else {
          await call.startScreenShare();
          Alert.alert('Success', 'Screen sharing started');
        }
      }
    } catch (err) {
      console.error('Error toggling screen share:', err);
      let errorMessage = 'Failed to toggle screen sharing';
      
      if (err.message) {
        if (err.message.includes('permission')) {
          errorMessage = 'Screen sharing permission denied. Please check your device settings.';
        } else if (err.message.includes('not supported')) {
          errorMessage = 'Screen sharing is not supported on this device.';
        } else {
          errorMessage = `Screen sharing error: ${err.message}`;
        }
      }
      
      Alert.alert('Screen Share Error', errorMessage);
    }
  }, [call, isScreenSharing]);

  const toggleRecording = useCallback(async () => {
    try {
      if (call && isHost) {
        if (isRecording) {
          await call.stopRecording();
        } else {
          await call.startRecording();
        }
      }
    } catch (err) {
      console.error('Error toggling recording:', err);
      Alert.alert('Error', 'Failed to toggle recording');
    }
  }, [call, isRecording, isHost]);

  const sendReaction = useCallback(async (reaction) => {
    try {
      if (call) {
        await call.sendReaction(reaction);
      }
    } catch (err) {
      console.error('Error sending reaction:', err);
    }
  }, [call]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !call) return;

    try {
      await call.sendMessage({
        text: newMessage.trim(),
        type: 'text',
      });
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  }, [call, newMessage]);

  const shareDocument = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        // For web, use file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png';
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (file) {
            await call.sendMessage({
              text: `Shared document: ${file.name}`,
              type: 'text',
            });
            Alert.alert('Success', `Document "${file.name}" shared successfully`);
          }
        };
        input.click();
      } else {
        // For mobile, use document picker
        const { pickDocumentAsync } = require('../../services/safeDocumentPicker');
        const result = await pickDocumentAsync({
          type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png'],
        });
        
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const file = result.assets[0];
          await call.sendMessage({
            text: `Shared document: ${file.name}`,
            type: 'text',
          });
          Alert.alert('Success', `Document "${file.name}" shared successfully`);
        }
      }
      setShowDocumentShare(false);
    } catch (err) {
      console.error('Error sharing document:', err);
      Alert.alert('Error', 'Failed to share document');
    }
  }, [call]);

  const changeLayout = useCallback((newLayout) => {
    setLayout(newLayout);
  }, []);

  if (!isOpen) return null;

  if (isConnecting) {
    return (
      <Modal visible={isOpen} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Connecting to meeting...</Text>
        </View>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal visible={isOpen} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => setError(null)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  if (!client || !call) {
    return (
      <Modal visible={isOpen} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.errorContainer}>
          <Icon name="video-off" size={64} color="#6B7280" />
          <Text style={styles.errorTitle}>Meeting Unavailable</Text>
          <Text style={styles.errorText}>Unable to connect to the meeting</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={isOpen} animationType="slide" presentationStyle="fullScreen">
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <View style={styles.container}>
            {/* Main Call Content */}
            <View style={styles.callContent}>
              {isScreenSharing ? (
                // Use CallContent for screen sharing to ensure proper display
                <CallContent />
              ) : (
                <>
                  {layout === 'grid' && (
                    <CallParticipantsGrid
                      style={styles.participantsGrid}
                    />
                  )}
                  
                  {layout === 'spotlight' && (
                    <CallParticipantsSpotlight
                      style={styles.participantsSpotlight}
                    />
                  )}
                </>
              )}
            </View>

            {/* Top Controls */}
            <View style={styles.topControls}>
              <View style={styles.meetingInfo}>
                <Text style={styles.meetingTitle}>{meetingData?.title || 'Meeting'}</Text>
                <Text style={styles.participantCount}>
                  {participantCount} participant{participantCount !== 1 ? 's' : ''}
                </Text>
                {isScreenSharing && (
                  <View style={styles.screenShareIndicator}>
                    <Icon name="monitor" size={16} color="#10B981" />
                    <Text style={styles.screenShareText}>Screen sharing active</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.topButtons}>
                <TouchableOpacity
                  style={styles.topButton}
                  onPress={() => setShowParticipants(!showParticipants)}
                >
                  <Icon name="account-group" size={20} color="#fff" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.topButton}
                  onPress={() => setShowStats(!showStats)}
                >
                  <Icon name="chart-line" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              <View style={styles.controlButtons}>
                <TouchableOpacity
                  style={[styles.controlButton, isMuted && styles.controlButtonActive]}
                  onPress={toggleMute}
                >
                  <Icon 
                    name={isMuted ? "microphone-off" : "microphone"} 
                    size={24} 
                    color={isMuted ? "#EF4444" : "#fff"} 
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.controlButton, !isVideoOn && styles.controlButtonActive]}
                  onPress={toggleVideo}
                >
                  <Icon 
                    name={isVideoOn ? "video" : "video-off"} 
                    size={24} 
                    color={!isVideoOn ? "#EF4444" : "#fff"} 
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.controlButton, 
                    isScreenSharing && styles.controlButtonActive,
                    Platform.OS !== 'web' && styles.controlButtonLimited
                  ]}
                  onPress={Platform.OS === 'web' ? toggleScreenShare : () => setShowDocumentShare(true)}
                >
                  <Icon 
                    name={Platform.OS === 'web' ? "monitor-share" : "file-document"} 
                    size={24} 
                    color={isScreenSharing ? "#3B82F6" : Platform.OS !== 'web' ? "#6B7280" : "#fff"} 
                  />
                  {Platform.OS !== 'web' && (
                    <View style={styles.limitedBadge}>
                      <Text style={styles.limitedText}>Docs</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {isHost && (
                  <TouchableOpacity
                    style={[styles.controlButton, isRecording && styles.controlButtonActive]}
                    onPress={toggleRecording}
                  >
                    <Icon 
                      name={isRecording ? "stop" : "record-rec"} 
                      size={24} 
                      color={isRecording ? "#EF4444" : "#fff"} 
                    />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => setShowChat(!showChat)}
                >
                  <Icon name="chat" size={24} color="#fff" />
                  {chatMessages.length > 0 && (
                    <View style={styles.chatBadge}>
                      <Text style={styles.chatBadgeText}>{chatMessages.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => setShowConfirmLeave(true)}
                >
                  <Icon name="phone-hangup" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>

              {/* Layout Controls */}
              <View style={styles.layoutControls}>
                <TouchableOpacity
                  style={[styles.layoutButton, layout === 'grid' && styles.layoutButtonActive]}
                  onPress={() => changeLayout('grid')}
                >
                  <Icon name="grid" size={20} color={layout === 'grid' ? '#3B82F6' : '#fff'} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.layoutButton, layout === 'spotlight' && styles.layoutButtonActive]}
                  onPress={() => changeLayout('spotlight')}
                >
                  <Icon name="spotlight" size={20} color={layout === 'spotlight' ? '#3B82F6' : '#fff'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Reactions */}
            {reactions.length > 0 && (
              <View style={styles.reactionsContainer}>
                {reactions.map((reaction) => (
                  <View key={reaction.id} style={styles.reaction}>
                    <Text style={styles.reactionText}>{reaction.emoji}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Participants Modal */}
            {showParticipants && (
              <View style={styles.participantsModal}>
                <View style={styles.participantsContent}>
                  <View style={styles.participantsHeader}>
                    <Text style={styles.participantsTitle}>Participants ({participantCount})</Text>
                    <TouchableOpacity onPress={() => setShowParticipants(false)}>
                      <Icon name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.participantsList}>
                    {call && call.state.participants && call.state.participants.length > 0 ? (
                      call.state.participants.map((participant, index) => {
                        console.log('[SimpleStreamMeetingRoom] Participant data:', {
                          userId: participant.userId,
                          name: participant.name,
                          user: participant.user,
                          isLocal: participant.isLocal
                        });
                        return (
                        <View key={participant.userId || index} style={styles.participantItem}>
                          <View style={styles.participantAvatar}>
                            <Text style={styles.participantAvatarText}>
                              {(participant.user?.name || participant.name || 'User')[0].toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.participantInfo}>
                            <Text style={styles.participantName}>
                              {participant.user?.name || participant.name || 'User'}
                            </Text>
                            <Text style={styles.participantStatus}>
                              {participant.isSpeaking ? 'Speaking' : 
                               participant.isLocal ? 'You' : 'Connected'}
                            </Text>
                          </View>
                          <View style={styles.participantControls}>
                            {participant.publishedTracks.includes('audio') ? (
                              <Icon name="microphone" size={16} color="#10B981" />
                            ) : (
                              <Icon name="microphone-off" size={16} color="#EF4444" />
                            )}
                            {participant.publishedTracks.includes('video') ? (
                              <Icon name="video" size={16} color="#10B981" />
                            ) : (
                              <Icon name="video-off" size={16} color="#EF4444" />
                            )}
                          </View>
                        </View>
                        );
                      })
                    ) : (
                      <View style={styles.noParticipants}>
                        <Text style={styles.noParticipantsText}>No participants found</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Stats Modal */}
            {showStats && (
              <View style={styles.statsModal}>
                <View style={styles.statsContent}>
                  <View style={styles.statsHeader}>
                    <Text style={styles.statsTitle}>Meeting Stats</Text>
                    <TouchableOpacity onPress={() => setShowStats(false)}>
                      <Icon name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.statsBody}>
                    <Text style={styles.statItem}>Participants: {participantCount}</Text>
                    <Text style={styles.statItem}>Recording: {isRecording ? 'Yes' : 'No'}</Text>
                    <Text style={styles.statItem}>Screen Share: {isScreenSharing ? 'Active' : 'Inactive'}</Text>
                    <Text style={styles.statItem}>Duration: {Math.floor(Date.now() / 1000)}s</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Chat Modal */}
            {showChat && (
              <View style={styles.chatModal}>
                <View style={styles.chatContent}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.chatTitle}>Chat</Text>
                    <TouchableOpacity onPress={() => setShowChat(false)}>
                      <Icon name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.chatMessages}>
                    {chatMessages.map((message, index) => (
                      <View key={index} style={styles.chatMessage}>
                        <Text style={styles.chatMessageText}>{message.text}</Text>
                        <Text style={styles.chatMessageTime}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.chatInput}>
                    <TextInput
                      style={styles.chatInputField}
                      value={newMessage}
                      onChangeText={setNewMessage}
                      placeholder="Type a message..."
                      placeholderTextColor="#6B7280"
                    />
                    <TouchableOpacity style={styles.chatSendButton} onPress={sendMessage}>
                      <Icon name="send" size={20} color="#3B82F6" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Document Share Modal */}
            {showDocumentShare && (
              <View style={styles.confirmModal}>
                <View style={styles.confirmContent}>
                  <Text style={styles.confirmTitle}>Share Document</Text>
                  <Text style={styles.confirmText}>
                    Since screen sharing is limited on mobile devices, you can share documents instead. 
                    This will send a notification to all participants about the shared document.
                  </Text>
                  <View style={styles.confirmButtons}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setShowDocumentShare(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.leaveConfirmButton}
                      onPress={shareDocument}
                    >
                      <Text style={styles.leaveConfirmButtonText}>Share Document</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Confirm Leave Modal */}
            {showConfirmLeave && (
              <View style={styles.confirmModal}>
                <View style={styles.confirmContent}>
                  <Text style={styles.confirmTitle}>
                    {isHost ? 'End Meeting for All?' : 'Leave Meeting?'}
                  </Text>
                  <Text style={styles.confirmText}>
                    {isHost 
                      ? 'This will end the meeting for all participants.' 
                      : 'You will leave the meeting but others can continue.'
                    }
                  </Text>
                  <View style={styles.confirmButtons}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setShowConfirmLeave(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.leaveConfirmButton}
                      onPress={handleLeave}
                    >
                      <Text style={styles.leaveConfirmButtonText}>Leave</Text>
                    </TouchableOpacity>
                    {isHost && (
                      <TouchableOpacity
                        style={styles.endForAllButton}
                        onPress={handleEndCall}
                      >
                        <Text style={styles.endForAllButtonText}>End for All</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>
        </StreamCall>
      </StreamVideo>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  callContent: {
    flex: 1,
  },
  waitingHost: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  waitingCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 300,
  },
  waitingTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  waitingSub: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  participantsGrid: {
    flex: 1,
  },
  participantsSpotlight: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  meetingInfo: {
    flex: 1,
  },
  meetingTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  participantCount: {
    color: '#ccc',
    fontSize: 14,
  },
  screenShareIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  screenShareText: {
    fontSize: 10,
    color: '#10B981',
    marginLeft: 4,
    fontWeight: '600',
  },
  topButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  topButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 16,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  controlButtonLimited: {
    opacity: 0.7,
  },
  limitedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#6B7280',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  limitedText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '600',
  },
  chatBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  layoutControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  layoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  layoutButtonActive: {
    backgroundColor: 'rgba(59,130,246,0.3)',
  },
  reactionsContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  reaction: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  reactionText: {
    fontSize: 24,
  },
  participantsModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  participantsContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    minHeight: '50%',
  },
  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  participantsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  participantsList: {
    flex: 1,
    padding: 20,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  participantStatus: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 2,
  },
  participantControls: {
    flexDirection: 'row',
    gap: 8,
  },
  noParticipants: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noParticipantsText: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
  },
  statsModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  statsBody: {
    gap: 12,
  },
  statItem: {
    color: '#fff',
    fontSize: 16,
  },
  chatModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  chatContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    minHeight: '50%',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  chatMessages: {
    flex: 1,
    padding: 20,
  },
  chatMessage: {
    marginBottom: 12,
  },
  chatMessageText: {
    color: '#fff',
    fontSize: 16,
  },
  chatMessageTime: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  chatInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  chatInputField: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
  },
  chatSendButton: {
    marginLeft: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  confirmText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  leaveConfirmButton: {
    flex: 1,
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  leaveConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  endForAllButton: {
    flex: 1,
    backgroundColor: '#ff4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  endForAllButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
