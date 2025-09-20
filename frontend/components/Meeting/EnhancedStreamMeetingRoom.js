import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform, Alert } from 'react-native';
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
  BackgroundFiltersProvider,
  NoiseCancellationProvider,
  CallStatsButton,
  RecordCallButton,
  ScreenShareToggleButton,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  ToggleCameraFaceButton,
  ReactionsButton,
  HangupCallButton,
  AcceptCallButton,
  RejectCallButton,
  OutgoingCallControls,
  IncomingCallControls,
  LobbyControls,
  JoinCallButton,
  ToggleAudioPreviewButton,
  ToggleVideoPreviewButton,
  ScreenShareOverlay,
  FloatingParticipantView,
  ParticipantView,
  ParticipantLabel,
  ParticipantNetworkQualityIndicator,
  ParticipantReaction,
  ParticipantVideoFallback,
  VideoRenderer,
  useTheme,
  useI18n,
  CallingState,
  getLogger,
  type StreamReaction,
} from '@stream-io/video-react-native-sdk';
import InCallManager from 'react-native-incall-manager';
import NetInfo from '@react-native-community/netinfo';

const logger = getLogger(['EnhancedStreamMeetingRoom']);

// Enhanced Stream video meeting room with full SDK features
// Props:
// - isOpen: boolean (controls modal visibility)
// - onClose: function
// - onLeave: function
// - meetingData: object with { title, _id/meetingId, roomUrl? }
// - credentials: { apiKey, token, userId, callId? }
// - isHost: boolean
// - hostUserId: string
// - currentUser: { name, email }
// - layout: 'grid' | 'spotlight' | 'speaker'
// - enableScreenShare: boolean
// - enableRecording: boolean
// - enableChat: boolean
// - enableReactions: boolean
// - enableBackgroundFilters: boolean
// - enableNoiseCancellation: boolean
// - supportedReactions: StreamReactionType[]
export default function EnhancedStreamMeetingRoom({
  isOpen,
  onClose,
  onLeave,
  meetingData,
  credentials,
  isHost = false,
  hostUserId,
  currentUser,
  layout = 'grid',
  enableScreenShare = true,
  enableRecording = true,
  enableChat = true,
  enableReactions = true,
  enableBackgroundFilters = true,
  enableNoiseCancellation = true,
  supportedReactions = [
    { type: 'like', icon: '👍' },
    { type: 'love', icon: '❤️' },
    { type: 'laugh', icon: '😂' },
    { type: 'wow', icon: '😮' },
    { type: 'sad', icon: '😢' },
    { type: 'angry', icon: '😠' },
  ],
}) {
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);

  const apiKey = credentials?.apiKey;
  const userToken = credentials?.token;
  const userId = credentials?.userId;

  const resolvedCallId = useMemo(() => {
    if (credentials?.callId) return String(credentials.callId);
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
      logger('debug', 'Failed to parse roomUrl', e);
    }
    return '';
  }, [credentials?.callId, meetingData]);

  const userInfo = useMemo(() => {
    const displayName = currentUser?.name || userId || 'User';
    return { 
      id: String(userId || 'anonymous_user'), 
      name: String(displayName) 
    };
  }, [currentUser?.name, userId]);

  const cleanup = useCallback(async (c, cl) => {
    try { 
      if (cl) await cl.leave(); 
    } catch (e) {
      logger('debug', 'Error leaving call during cleanup', e);
    }
    try { 
      if (c) await c.disconnectUser(); 
    } catch (e) {
      logger('debug', 'Error disconnecting user during cleanup', e);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let netUnsubscribe = null;
    
    const join = async () => {
      if (!isOpen) return;
      if (!apiKey || !userToken || !userId) {
        setError('Missing Stream credentials');
        return;
      }
      if (!resolvedCallId) {
        setError('Missing callId');
        return;
      }
      
      setIsJoining(true);
      setError('');
      
      try {
        // Start audio routing
        try { 
          InCallManager.start({ media: 'video' }); 
          InCallManager.setForceSpeakerphoneOn(true); 
        } catch (e) {
          logger('debug', 'Error starting InCallManager', e);
        }

        // Track connectivity
        netUnsubscribe = NetInfo.addEventListener(state => {
          setIsOffline(!(state?.isConnected && state?.isInternetReachable !== false));
        });

        const c = new StreamVideoClient({ apiKey });
        await c.connectUser(userInfo, userToken);
        
        if (cancelled) return;
        
        const callInstance = c.call('default', resolvedCallId);
        await callInstance.join({ create: true });
        
        if (cancelled) {
          await cleanup(c, callInstance);
          return;
        }
        
        setClient(c);
        setCall(callInstance);
        
        // Set up call event listeners
        callInstance.on('call.ended', () => {
          logger('debug', 'Call ended event received');
          handleLeave();
        });
        
        callInstance.on('call.recording_started', () => {
          logger('debug', 'Recording started');
          setIsRecording(true);
        });
        
        callInstance.on('call.recording_stopped', () => {
          logger('debug', 'Recording stopped');
          setIsRecording(false);
        });
        
      } catch (e) {
        logger('error', 'Error joining call', e);
        setError(e?.message || 'Failed to join the call');
      } finally {
        if (!cancelled) setIsJoining(false);
      }
    };
    
    join();
    
    return () => {
      cancelled = true;
      cleanup(client, call);
      try { 
        if (netUnsubscribe) netUnsubscribe(); 
      } catch (e) {
        logger('debug', 'Error unsubscribing from NetInfo', e);
      }
    };
  }, [apiKey, userToken, userId, resolvedCallId, userInfo, isOpen, cleanup]);

  const handleLeave = useCallback(async () => {
    await cleanup(client, call);
    try { 
      InCallManager.stop(); 
    } catch (e) {
      logger('debug', 'Error stopping InCallManager', e);
    }
    if (onLeave) onLeave();
    if (onClose) onClose();
  }, [cleanup, client, call, onLeave, onClose]);

  const handleEndForAll = useCallback(async () => {
    try {
      if (call && isHost) {
        await call.endCall();
      }
    } catch (e) {
      logger('error', 'Error ending call for all', e);
    } finally {
      setShowConfirmLeave(false);
      await handleLeave();
    }
  }, [call, isHost, handleLeave]);

  const CustomCallControls = useCallback(() => {
    return (
      <View style={styles.customControls}>
        <CallControls
          onHangupCallHandler={handleLeave}
          landscape={false}
        />
        
        {enableScreenShare && (
          <ScreenShareToggleButton />
        )}
        
        {enableRecording && isHost && (
          <RecordCallButton />
        )}
        
        {enableReactions && (
          <ReactionsButton supportedReactions={supportedReactions} />
        )}
        
        <TouchableOpacity
          style={styles.participantsButton}
          onPress={() => setShowParticipants(!showParticipants)}
        >
          <Text style={styles.buttonText}>Participants</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.statsButton}
          onPress={() => setShowStats(!showStats)}
        >
          <Text style={styles.buttonText}>Stats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.leaveButton}
          onPress={() => setShowConfirmLeave(true)}
        >
          <Text style={styles.leaveButtonText}>Leave</Text>
        </TouchableOpacity>
      </View>
    );
  }, [handleLeave, enableScreenShare, enableRecording, isHost, enableReactions, supportedReactions, showParticipants, showStats]);

  if (!isOpen) return null;

  return (
    <Modal 
      visible={isOpen} 
      animationType="slide" 
      onRequestClose={handleLeave} 
      transparent
      presentationStyle="fullScreen"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {meetingData?.title || `Call ${resolvedCallId}`}
            </Text>
            <View style={styles.headerControls}>
              {isOffline && (
                <Text style={styles.offlineText}>Offline</Text>
              )}
              {isRecording && (
                <Text style={styles.recordingText}>Recording</Text>
              )}
            </View>
          </View>

          {/* Offline Banner */}
          {isOffline && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineBannerText}>
                You are offline. Reconnecting...
              </Text>
            </View>
          )}

          {/* Main Content */}
          <View style={styles.body}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={handleLeave} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            ) : isJoining || !client || !call ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Joining meeting...</Text>
              </View>
            ) : (
              <StreamVideo client={client}>
                <StreamCall call={call}>
                  {enableBackgroundFilters ? (
                    <BackgroundFiltersProvider>
                      {enableNoiseCancellation ? (
                        <NoiseCancellationProvider>
                          <CallContent
                            layout={layout}
                            CallControls={CustomCallControls}
                            supportedReactions={supportedReactions}
                            landscape={false}
                            iOSPiPIncludeLocalParticipantVideo={true}
                            disablePictureInPicture={false}
                          />
                        </NoiseCancellationProvider>
                      ) : (
                        <CallContent
                          layout={layout}
                          CallControls={CustomCallControls}
                          supportedReactions={supportedReactions}
                          landscape={false}
                          iOSPiPIncludeLocalParticipantVideo={true}
                          disablePictureInPicture={false}
                        />
                      )}
                    </BackgroundFiltersProvider>
                  ) : (
                    <CallContent
                      layout={layout}
                      CallControls={CustomCallControls}
                      supportedReactions={supportedReactions}
                      landscape={false}
                      iOSPiPIncludeLocalParticipantVideo={true}
                      disablePictureInPicture={false}
                    />
                  )}
                </StreamCall>
              </StreamVideo>
            )}
          </View>

          {/* Participants List Modal */}
          {showParticipants && (
            <Modal
              visible={showParticipants}
              animationType="slide"
              transparent
              onRequestClose={() => setShowParticipants(false)}
            >
              <View style={styles.participantsModal}>
                <View style={styles.participantsContent}>
                  <View style={styles.participantsHeader}>
                    <Text style={styles.participantsTitle}>Participants</Text>
                    <TouchableOpacity
                      onPress={() => setShowParticipants(false)}
                      style={styles.closeButton}
                    >
                      <Text style={styles.closeButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                  {client && call && (
                    <StreamVideo client={client}>
                      <StreamCall call={call}>
                        <CallParticipantsList />
                      </StreamCall>
                    </StreamVideo>
                  )}
                </View>
              </View>
            </Modal>
          )}

          {/* Stats Modal */}
          {showStats && (
            <Modal
              visible={showStats}
              animationType="slide"
              transparent
              onRequestClose={() => setShowStats(false)}
            >
              <View style={styles.statsModal}>
                <View style={styles.statsContent}>
                  <View style={styles.statsHeader}>
                    <Text style={styles.statsTitle}>Call Statistics</Text>
                    <TouchableOpacity
                      onPress={() => setShowStats(false)}
                      style={styles.closeButton}
                    >
                      <Text style={styles.closeButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                  {client && call && (
                    <StreamVideo client={client}>
                      <StreamCall call={call}>
                        <CallStatsButton />
                      </StreamCall>
                    </StreamVideo>
                  )}
                </View>
              </View>
            </Modal>
          )}

          {/* Confirm Leave Modal */}
          {showConfirmLeave && (
            <Modal
              visible={showConfirmLeave}
              animationType="fade"
              transparent
              onRequestClose={() => setShowConfirmLeave(false)}
            >
              <View style={styles.confirmModal}>
                <View style={styles.confirmContent}>
                  <Text style={styles.confirmTitle}>Leave Meeting?</Text>
                  <Text style={styles.confirmText}>
                    You can leave the meeting{isHost ? ', or end it for everyone if you are the host.' : '.'}
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
                        onPress={handleEndForAll}
                      >
                        <Text style={styles.endForAllButtonText}>End for Everyone</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </Modal>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  offlineText: {
    color: '#ff6b6b',
    fontSize: 12,
    fontWeight: '500',
  },
  recordingText: {
    color: '#ff4444',
    fontSize: 12,
    fontWeight: '500',
  },
  offlineBanner: {
    backgroundColor: '#ff4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  offlineBannerText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500',
  },
  body: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
  customControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  participantsButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  statsButton: {
    backgroundColor: '#7b68ee',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  leaveButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  leaveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  participantsModal: {
    flex: 1,
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
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  statsModal: {
    flex: 1,
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
  confirmModal: {
    flex: 1,
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
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
