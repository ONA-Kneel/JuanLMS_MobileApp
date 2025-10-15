import React, { useEffect, useState, useCallback, useRef } from 'react';
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

  // Initialize Stream.io client
  useEffect(() => {
    if (!isOpen || !credentials) return;

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

        const streamClient = new StreamVideoClient({
          apiKey: credentials.apiKey,
          user: {
            id: credentials.userId,
            name: currentUser?.name || 'User',
            image: currentUser?.profilePic || null,
          },
          token: credentials.token,
        });

        setClient(streamClient);

        // Create call and join with mic/camera disabled by default
        const callInstance = streamClient.call('default', credentials.callId);
        await callInstance.join({ create: true });
        try {
          await callInstance.microphone?.disable?.();
        } catch (e) { /* ignore */ }
        try {
          await callInstance.camera?.disable?.();
        } catch (e) { /* ignore */ }
        setIsMuted(true);
        setIsVideoOn(false);
        setCall(callInstance);

        // Check if call is already connected
        console.log('Call state after join:', callInstance.state.status);
        if (callInstance.state.status === 'joined' || callInstance.state.status === 'active') {
          console.log('Call already joined/active');
          setIsConnecting(false);
        }

        // Set up call event listeners
        callInstance.on('call.updated', (event) => {
          console.log('Call updated:', event);
          if (event.call.state.status === 'joined' || event.call.state.status === 'active') {
            setIsConnecting(false);
          }
        });

        callInstance.on('call.session.started', () => {
          console.log('Call session started');
          setIsConnecting(false);
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

      } catch (error) {
        console.error('Failed to initialize StreamVideo:', error);
        setError(error.message || 'Failed to initialize StreamVideo');
        setIsConnecting(false);
      }
    };

    initClient();
    }, 100);

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [isOpen, credentials]);

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
