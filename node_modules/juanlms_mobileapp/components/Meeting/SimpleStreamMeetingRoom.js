import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  SpeakerLayout,
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
          console.log('Call status:', event.call.state.status);
          // Reset connecting state when call is updated (connected)
          if (event.call.state.status === 'joined' || event.call.state.status === 'active') {
            setIsConnecting(false);
          }
        });

        // Listen for call session started event
        callInstance.on('call.session_started', () => {
          console.log('Call session started');
          setIsConnecting(false);
        });

        // Listen for call joined event
        callInstance.on('call.joined', () => {
          console.log('Call joined');
          setIsConnecting(false);
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
        });

        callInstance.on('call.screen_share.stopped', () => {
          setIsScreenSharing(false);
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

        // Set a timeout to ensure connecting state is reset
        setTimeout(() => {
          setIsConnecting(false);
        }, 5000); // 5 second timeout

      } catch (err) {
        console.error('Error initializing Stream client:', err);
        setError(err.message || 'Failed to initialize meeting');
      } finally {
        // Don't set isConnecting to false here as we want to wait for the call to join
        // setIsConnecting(false);
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
  }, [isOpen, credentials]);

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
      setIsMuted(false);
      setIsVideoOn(true);
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
      if (call) {
        if (isScreenSharing) {
          await call.stopScreenShare();
        } else {
          await call.startScreenShare();
        }
      }
    } catch (err) {
      console.error('Error toggling screen share:', err);
      Alert.alert('Error', 'Failed to toggle screen sharing');
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
              
              {layout === 'speaker' && (
                <SpeakerLayout
                  style={styles.speakerLayout}
                />
              )}
            </View>

            {/* Top Controls */}
            <View style={styles.topControls}>
              <View style={styles.meetingInfo}>
                <Text style={styles.meetingTitle}>{meetingData?.title || 'Meeting'}</Text>
                <Text style={styles.participantCount}>
                  {participantCount} participant{participantCount !== 1 ? 's' : ''}
                </Text>
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
                  style={[styles.controlButton, isScreenSharing && styles.controlButtonActive]}
                  onPress={toggleScreenShare}
                >
                  <Icon 
                    name="monitor-share" 
                    size={24} 
                    color={isScreenSharing ? "#3B82F6" : "#fff"} 
                  />
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
                
                <TouchableOpacity
                  style={[styles.layoutButton, layout === 'speaker' && styles.layoutButtonActive]}
                  onPress={() => changeLayout('speaker')}
                >
                  <Icon name="account" size={20} color={layout === 'speaker' ? '#3B82F6' : '#fff'} />
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
                  <CallParticipantsList />
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
  participantsGrid: {
    flex: 1,
  },
  participantsSpotlight: {
    flex: 1,
  },
  speakerLayout: {
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
