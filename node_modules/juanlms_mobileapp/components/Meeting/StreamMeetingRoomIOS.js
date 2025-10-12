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
  Dimensions,
  NativeModules,
  NativeEventEmitter
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');
const { StreamVideoBridge } = NativeModules;

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
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [callState, setCallState] = useState('disconnected');
  const [participants, setParticipants] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const eventEmitter = useRef(null);
  const callId = useRef(null);

  // Initialize event emitter
  useEffect(() => {
    if (StreamVideoBridge) {
      eventEmitter.current = new NativeEventEmitter(StreamVideoBridge);
      
      const subscription1 = eventEmitter.current.addListener('onCallStateChanged', (event) => {
        console.log('Call state changed:', event);
        setCallState(event.state);
      });
      
      const subscription2 = eventEmitter.current.addListener('onParticipantJoined', (event) => {
        console.log('Participant joined:', event);
        setParticipants(prev => [...prev, event.participant]);
      });
      
      const subscription3 = eventEmitter.current.addListener('onParticipantLeft', (event) => {
        console.log('Participant left:', event);
        setParticipants(prev => prev.filter(p => p.id !== event.participant.id));
      });
      
      const subscription4 = eventEmitter.current.addListener('onCallEnded', (event) => {
        console.log('Call ended:', event);
        handleLeave();
      });

      return () => {
        subscription1.remove();
        subscription2.remove();
        subscription3.remove();
        subscription4.remove();
      };
    }
  }, []);

  // Initialize StreamVideo when modal opens
  useEffect(() => {
    if (!isOpen || !credentials || isInitialized) return;

    const initializeStreamVideo = async () => {
      try {
        setIsConnecting(true);
        setError(null);

        const config = {
          apiKey: credentials.apiKey,
          userId: credentials.userId,
          token: credentials.token,
          userName: currentUser?.name || 'User'
        };

        const result = await StreamVideoBridge.initializeStreamVideo(config);
        console.log('StreamVideo initialized:', result);
        
        setIsInitialized(true);
        
        // Join call after initialization
        await joinCall();
        
      } catch (error) {
        console.error('Failed to initialize StreamVideo:', error);
        setError(error.message || 'Failed to initialize StreamVideo');
      } finally {
        setIsConnecting(false);
      }
    };

    initializeStreamVideo();
  }, [isOpen, credentials, isInitialized]);

  const joinCall = async () => {
    try {
      const callConfig = {
        callId: credentials.callId || meetingData?.meetingId || meetingData?._id,
        callType: 'default'
      };

      callId.current = callConfig.callId;
      const result = await StreamVideoBridge.joinCall(callConfig);
      console.log('Joined call:', result);
      
    } catch (error) {
      console.error('Failed to join call:', error);
      setError(error.message || 'Failed to join call');
    }
  };

  const handleLeave = useCallback(async () => {
    try {
      if (callId.current) {
        await StreamVideoBridge.leaveCall(callId.current);
      }
    } catch (error) {
      console.error('Error leaving call:', error);
    } finally {
      setIsInitialized(false);
      callId.current = null;
      if (onLeave) onLeave();
      if (onClose) onClose();
    }
  }, [onLeave, onClose]);

  const toggleMicrophone = async () => {
    try {
      const newMutedState = !isMuted;
      await StreamVideoBridge.toggleMicrophone(!newMutedState);
      setIsMuted(newMutedState);
    } catch (error) {
      console.error('Error toggling microphone:', error);
      Alert.alert('Error', 'Failed to toggle microphone');
    }
  };

  const toggleCamera = async () => {
    try {
      const newVideoState = !isVideoOn;
      await StreamVideoBridge.toggleCamera(!newVideoState);
      setIsVideoOn(newVideoState);
    } catch (error) {
      console.error('Error toggling camera:', error);
      Alert.alert('Error', 'Failed to toggle camera');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal 
      visible={isOpen} 
      animationType="slide" 
      onRequestClose={handleLeave} 
      transparent={false}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>
              {meetingData?.title || 'Video Call'}
            </Text>
            <Text style={styles.subtitle}>
              {participants.length + 1} participant{participants.length !== 0 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLeave} style={styles.leaveButton}>
            <Icon name="phone-hangup" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Video Content Area */}
        <View style={styles.videoContainer}>
          {isConnecting || !isInitialized ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>
                {isConnecting ? 'Connecting...' : 'Initializing...'}
              </Text>
            </View>
          ) : error ? (
            <View style={styles.centerContent}>
              <Icon name="alert-circle" size={48} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={handleLeave} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.videoPlaceholder}>
              <Icon name="video" size={64} color="#9CA3AF" />
              <Text style={styles.videoPlaceholderText}>
                Video call in progress
              </Text>
              <Text style={styles.callStateText}>
                State: {callState}
              </Text>
            </View>
          )}
        </View>

        {/* Controls */}
        {isInitialized && !error && (
          <View style={styles.controls}>
            <TouchableOpacity
              onPress={toggleMicrophone}
              style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            >
              <Icon 
                name={isMuted ? "microphone-off" : "microphone"} 
                size={24} 
                color={isMuted ? "white" : "#374151"} 
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleCamera}
              style={[styles.controlButton, !isVideoOn && styles.controlButtonActive]}
            >
              <Icon 
                name={isVideoOn ? "video" : "video-off"} 
                size={24} 
                color={!isVideoOn ? "white" : "#374151"} 
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLeave}
              style={[styles.controlButton, styles.leaveControlButton]}
            >
              <Icon name="phone-hangup" size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>
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
