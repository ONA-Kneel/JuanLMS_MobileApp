import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  Platform,
  Alert,
  Dimensions
} from 'react-native';
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

export default function StreamMeetingRoomIOS({
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
  const [participantCount, setParticipantCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [layout, setLayout] = useState('grid'); // grid, spotlight, speaker
  const [reactions, setReactions] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const isInitialized = useRef(false);
  const initTimeoutRef = useRef(null);
  
  // Credential fetching state
  const [streamCredentials, setStreamCredentials] = useState(null);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);

  // Generate call ID from meeting data
  const generateCallId = useCallback((meetingData) => {
    if (meetingData?.meetingId) return String(meetingData.meetingId);
    if (meetingData?._id) return String(meetingData._id);
    if (meetingData?.title) return String(meetingData.title).replace(/\s+/g, '-').toLowerCase();
    return `meeting-${Date.now()}`;
  }, []);

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
  }, [isOpen, meetingData, generateCallId]);

  // Use provided credentials or fetched credentials
  const finalCredentials = useMemo(() => {
    return credentials || streamCredentials;
  }, [credentials, streamCredentials]);

  // Determine callId preference
  const resolvedCallId = useMemo(() => {
    if (finalCredentials?.callId) return String(finalCredentials.callId);
    if (meetingData?.meetingId) return String(meetingData.meetingId);
    if (meetingData?._id) return String(meetingData._id);
    return generateCallId(meetingData);
  }, [finalCredentials?.callId, meetingData, generateCallId]);

  const userInfo = useMemo(() => {
    const streamUserInfo = finalCredentials?.userInfo;
    if (streamUserInfo && streamUserInfo.name) {
      return streamUserInfo;
    }
    return {
      id: finalCredentials?.userId || currentUser?.id || 'user',
      name: currentUser?.name || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'User',
      email: currentUser?.email || '',
      image: currentUser?.profilePic || null,
    };
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
        console.log('[StreamMeetingRoomIOS] Created client with user:', userInfo);

        setClient(streamClient);

        // Create call and join with mic/camera disabled by default
        const callInstance = streamClient.call('default', resolvedCallId);
        
        // Ensure mic and camera are disabled at start
        try {
          if (callInstance.microphone && typeof callInstance.microphone.setEnabled === 'function') {
            await callInstance.microphone.setEnabled(false);
          }
        } catch (e) { /* ignore */ }
        try {
          if (callInstance.camera && typeof callInstance.camera.setEnabled === 'function') {
            await callInstance.camera.setEnabled(false);
          }
        } catch (e) { /* ignore */ }
        
        await callInstance.join({ create: true });
        
        // Double-check post-join that tracks remain disabled
        try {
          if (callInstance.microphone && typeof callInstance.microphone.setEnabled === 'function') {
            await callInstance.microphone.setEnabled(false);
          }
        } catch (e) { /* ignore */ }
        try {
          if (callInstance.camera && typeof callInstance.camera.setEnabled === 'function') {
            await callInstance.camera.setEnabled(false);
          }
        } catch (e) { /* ignore */ }
        
        setIsMuted(true);
        setIsVideoOn(false);
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
            console.log('[StreamMeetingRoomIOS] Checking call status after delay:', status);
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
          if (event.call.state.status === 'joined' || event.call.state.status === 'active') {
            setIsConnecting(false);
            cleanupConnection();
          }
        });

        callInstance.on('call.session.started', () => {
          console.log('Call session started');
          setIsConnecting(false);
          cleanupConnection();
        });
        
        callInstance.on('call.joined', () => {
          console.log('Call joined');
          setIsConnecting(false);
          cleanupConnection();
        });

        callInstance.on('call.session.ended', () => {
          console.log('Call session ended');
          handleLeave();
        });

        callInstance.on('call.ended', () => {
          console.log('Call ended');
          handleLeave();
        });

        callInstance.on('call.recording.started', () => {
          console.log('Recording started');
          setIsRecording(true);
        });

        callInstance.on('call.recording.stopped', () => {
          console.log('Recording stopped');
          setIsRecording(false);
        });

        callInstance.on('call.screen_share.started', () => {
          console.log('Screen share started');
          setIsScreenSharing(true);
        });

        callInstance.on('call.screen_share.stopped', () => {
          console.log('Screen share stopped');
          setIsScreenSharing(false);
        });

        callInstance.on('call.reaction', (event) => {
          console.log('Reaction received:', event);
          setReactions(prev => [...prev, event]);
          // Auto-remove reaction after 3 seconds
          setTimeout(() => {
            setReactions(prev => prev.filter(r => r !== event));
          }, 3000);
        });

        callInstance.on('call.chat', (event) => {
          console.log('Chat message received:', event);
          setChatMessages(prev => [...prev, event]);
        });

        // Set up participant count tracking
        const updateParticipantCount = () => {
          const count = callInstance.state.participants ? Object.keys(callInstance.state.participants).length : 0;
          setParticipantCount(count);
        };

        callInstance.on('call.participant.joined', updateParticipantCount);
        callInstance.on('call.participant.left', updateParticipantCount);
        updateParticipantCount();

        // Listen for connection errors, especially token expiration
        callInstance.on('connection.changed', (event) => {
          console.log('[StreamMeetingRoomIOS] Connection changed:', event);
          if (event.online === false) {
            console.warn('[StreamMeetingRoomIOS] Connection lost');
          }
        });

        // Listen for errors from the call
        callInstance.on('error', (err) => {
          console.error('[StreamMeetingRoomIOS] Call error:', err);
          const errorCode = err.code || err.StatusCode;
          const errorMessage = err.message || '';
          
          if (errorCode === 40 || errorCode === 401 || errorMessage.includes('token is expired') || errorMessage.includes('AuthErrorTokenExpired')) {
            console.warn('[StreamMeetingRoomIOS] Token expired during call');
            setError('Your session has expired. Please close and rejoin the meeting.');
            setIsConnecting(false);
          }
        });

        // Set a timeout to ensure connecting state is reset if call doesn't connect
        connectionTimeout = setTimeout(() => {
          console.warn('[StreamMeetingRoomIOS] Connection timeout - forcing connecting state to false');
          if (callInstance.state.status !== 'joined' && callInstance.state.status !== 'active') {
            console.warn('[StreamMeetingRoomIOS] Call not connected after timeout, status:', callInstance.state.status);
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
    }, 100);

    return () => {
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

  const handleLeave = useCallback(async () => {
    try {
      if (call) {
        await call.leave();
      }
      if (client) {
        await client.disconnectUser();
      }
    } catch (error) {
      console.error('Error leaving call:', error);
    } finally {
      setClient(null);
      setCall(null);
      isInitialized.current = false;
      if (onLeave) onLeave();
      if (onClose) onClose();
    }
  }, [call, client, onLeave, onClose]);

  if (!isOpen) return null;

  if (!client || !call) {
    return (
      <Modal 
        visible={isOpen} 
        animationType="slide" 
        onRequestClose={handleLeave} 
        transparent={false}
      >
        <View style={styles.container}>
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>
              {isConnecting ? 'Connecting...' : 'Initializing...'}
            </Text>
            {error && (
              <>
                <Icon name="alert-circle" size={48} color="#EF4444" style={{ marginTop: 20 }} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={handleLeave} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal 
      visible={isOpen} 
      animationType="slide" 
      onRequestClose={handleLeave} 
      transparent={false}
    >
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <CallContent
            CallTopView={() => (
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Text style={styles.title}>
                    {meetingData?.title || 'Video Call'}
                  </Text>
                  <Text style={styles.subtitle}>
                    {participantCount} participant{participantCount !== 1 ? 's' : ''}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleLeave} style={styles.leaveButton}>
                  <Icon name="phone-hangup" size={24} color="white" />
                </TouchableOpacity>
              </View>
            )}
            CallBottomView={() => (
              <View style={styles.controls}>
                <CallControls
                  onLeaveCallHandler={handleLeave}
                  onHangupCallHandler={handleLeave}
                />
              </View>
            )}
          />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingTop: 50, // Account for status bar
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  leaveButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'white',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    marginTop: 16,
    fontSize: 16,
    color: 'white',
  },
  callStateText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    gap: 20,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#EF4444',
  },
  leaveControlButton: {
    backgroundColor: '#EF4444',
  },
});
