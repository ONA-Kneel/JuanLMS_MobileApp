import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import meetingSyncService from './meetingSyncService';
import meetingErrorHandler from './meetingErrorHandler';

const API_BASE = 'https://juanlms-webapp-server.onrender.com';

// Stream Video Configuration
const STREAM_CONFIG = {
  apiKey: 'mmhfdzb5evj2', // Your Stream API key
  // Note: In production, these should be fetched from your backend
  // and managed securely per user session
};

class MeetingService {
  constructor() {
    this.client = null;
    this.currentCall = null;
    this.isConnected = false;
    this.networkListeners = [];
    this.meetingState = {
      isJoining: false,
      isInMeeting: false,
      error: null,
      participants: [],
      isHost: false,
      isScreenSharing: false,
      isMuted: false,
      isVideoOn: true,
    };
  }

  // Initialize the service
  async initialize() {
    try {
      // Check network connectivity
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        throw new Error('No internet connection');
      }

      // Set up network monitoring
      this.setupNetworkMonitoring();
      
      // Initialize sync service
      await meetingSyncService.initialize();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize meeting service:', error);
      throw error;
    }
  }

  // Set up network monitoring
  setupNetworkMonitoring() {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasConnected = this.isConnected;
      this.isConnected = state.isConnected && state.isInternetReachable !== false;
      
      if (wasConnected && !this.isConnected) {
        this.handleNetworkDisconnection();
      } else if (!wasConnected && this.isConnected) {
        this.handleNetworkReconnection();
      }
    });
    
    this.networkListeners.push(unsubscribe);
  }

  // Handle network disconnection
  handleNetworkDisconnection() {
    console.log('Network disconnected - attempting to maintain meeting...');
    // The Stream SDK handles reconnection automatically
  }

  // Handle network reconnection
  handleNetworkReconnection() {
    console.log('Network reconnected');
    // Refresh meeting state if needed
  }

  // Get user credentials from storage
  async getUserCredentials() {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (!token || !userData) {
        throw new Error('User not authenticated');
      }

      const user = JSON.parse(userData);
      
      // In production, you should fetch Stream credentials from your backend
      // For now, using the same credentials as your current implementation
      return {
        apiKey: STREAM_CONFIG.apiKey,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Byb250by5nZXRzdHJlYW0uaW8iLCJzdWIiOiJ1c2VyL1dvb2xseV9QYXRjaCIsInVzZXJfaWQiOiJXb29sbHlfUGF0Y2giLCJ2YWxpZGl0eV9pbl9zZWNvbmRzIjo2MDQ4MDAsImlhdCI6MTc1NzM0MDk5OCwiZXhwIjoxNzU3OTQ1Nzk4fQ.nsL1ALmGwSTl8QUawile5zJdsCjGPW8lOkDy5vRWm2I',
        userId: 'Woolly_Patch',
        callId: '9IH1mIBCkfbdP9y4q34W2',
        userInfo: {
          id: user._id || 'anonymous_user',
          name: user.name || user.username || 'User',
        }
      };
    } catch (error) {
      console.error('Failed to get user credentials:', error);
      throw error;
    }
  }

  // Create or join a meeting
  async createOrJoinMeeting(meetingData, isHost = false) {
    try {
      this.meetingState.isJoining = true;
      this.meetingState.error = null;

      const credentials = await this.getUserCredentials();
      
      // Import Stream SDK dynamically to avoid issues
      const { StreamVideoClient } = await import('@stream-io/video-react-native-sdk');
      
      // Create client if not exists
      if (!this.client) {
        this.client = new StreamVideoClient({ apiKey: credentials.apiKey });
      }

      // Connect user
      await this.client.connectUser(credentials.userInfo, credentials.token);

      // Create or get call
      const callId = meetingData.meetingId || meetingData._id || credentials.callId;
      this.currentCall = this.client.call('default', callId);

      // Join the call
      await this.currentCall.join({ create: true });

      // Set up call event listeners
      this.setupCallEventListeners();

      // Join meeting room for real-time sync
      const meetingId = meetingData.meetingId || meetingData._id;
      if (meetingId) {
        await meetingSyncService.joinMeetingRoom(meetingId);
        await meetingSyncService.updateMeetingStatus(meetingId, 'ongoing');
      }

      this.meetingState.isInMeeting = true;
      this.meetingState.isHost = isHost;
      this.meetingState.isJoining = false;

      return {
        client: this.client,
        call: this.currentCall,
        meetingState: this.meetingState
      };

    } catch (error) {
      console.error('Failed to create or join meeting:', error);
      
      // Process error with error handler
      const errorInfo = await meetingErrorHandler.processError(error);
      this.meetingState.error = errorInfo.userMessage;
      this.meetingState.isJoining = false;
      
      // Log error for debugging
      meetingErrorHandler.logError(error, { 
        action: 'createOrJoinMeeting',
        meetingData 
      });
      
      throw error;
    }
  }

  // Set up call event listeners
  setupCallEventListeners() {
    if (!this.currentCall) return;

    // Participant joined
    this.currentCall.on('call.session_participant_joined', (event) => {
      console.log('Participant joined:', event);
      this.updateParticipants();
    });

    // Participant left
    this.currentCall.on('call.session_participant_left', (event) => {
      console.log('Participant left:', event);
      this.updateParticipants();
    });

    // Call ended
    this.currentCall.on('call.ended', () => {
      console.log('Call ended');
      this.handleCallEnded();
    });

    // Screen share started
    this.currentCall.on('call.screen_share_started', () => {
      this.meetingState.isScreenSharing = true;
    });

    // Screen share stopped
    this.currentCall.on('call.screen_share_stopped', () => {
      this.meetingState.isScreenSharing = false;
    });
  }

  // Update participants list
  async updateParticipants() {
    if (!this.currentCall) return;

    try {
      const participants = this.currentCall.state.participants;
      this.meetingState.participants = Object.values(participants);
    } catch (error) {
      console.error('Failed to update participants:', error);
    }
  }

  // Handle call ended
  handleCallEnded() {
    this.meetingState.isInMeeting = false;
    this.meetingState.participants = [];
    this.currentCall = null;
  }

  // Leave meeting
  async leaveMeeting() {
    try {
      // Update meeting status before leaving
      const meetingId = this.currentCall?.id;
      if (meetingId) {
        await meetingSyncService.updateMeetingStatus(meetingId, 'ended');
        await meetingSyncService.leaveMeetingRoom(meetingId);
      }

      if (this.currentCall) {
        await this.currentCall.leave();
      }
      
      if (this.client) {
        await this.client.disconnectUser();
      }

      this.handleCallEnded();
    } catch (error) {
      console.error('Failed to leave meeting:', error);
      throw error;
    }
  }

  // Toggle microphone
  async toggleMicrophone() {
    try {
      if (!this.currentCall) return;

      if (this.currentCall.microphone) {
        await this.currentCall.microphone.toggle();
        this.meetingState.isMuted = !this.meetingState.isMuted;
      }
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
      throw error;
    }
  }

  // Toggle camera
  async toggleCamera() {
    try {
      if (!this.currentCall) return;

      if (this.currentCall.camera) {
        await this.currentCall.camera.toggle();
        this.meetingState.isVideoOn = !this.meetingState.isVideoOn;
      }
    } catch (error) {
      console.error('Failed to toggle camera:', error);
      throw error;
    }
  }

  // Toggle screen sharing
  async toggleScreenShare() {
    try {
      if (!this.currentCall) return;

      if (this.currentCall.camera) {
        if (this.meetingState.isScreenSharing) {
          await this.currentCall.camera.stopScreenShare();
        } else {
          await this.currentCall.camera.startScreenShare();
        }
        this.meetingState.isScreenSharing = !this.meetingState.isScreenSharing;
      }
    } catch (error) {
      console.error('Failed to toggle screen share:', error);
      throw error;
    }
  }

  // End meeting for all (host only)
  async endMeetingForAll() {
    try {
      if (!this.currentCall || !this.meetingState.isHost) {
        throw new Error('Only host can end meeting for all');
      }

      await this.currentCall.endCall();
      this.handleCallEnded();
    } catch (error) {
      console.error('Failed to end meeting for all:', error);
      throw error;
    }
  }

  // Get meeting state
  getMeetingState() {
    return { ...this.meetingState };
  }

  // Cleanup
  cleanup() {
    // Remove network listeners
    this.networkListeners.forEach(unsubscribe => unsubscribe());
    this.networkListeners = [];

    // Leave meeting if active
    if (this.meetingState.isInMeeting) {
      this.leaveMeeting().catch(console.error);
    }

    // Cleanup sync service
    meetingSyncService.cleanup();
  }
}

// Export singleton instance
export default new MeetingService();
