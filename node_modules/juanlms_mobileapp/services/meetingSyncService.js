import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import meetingApiService from './meetingApiService';

class MeetingSyncService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  // Initialize socket connection
  async initialize() {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Connect to your backend socket server
      this.socket = io('https://juanlms-webapp-server.onrender.com', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.setupEventListeners();
      
      return new Promise((resolve, reject) => {
        this.socket.on('connect', () => {
          console.log('Meeting sync service connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('Meeting sync connection error:', error);
          reject(error);
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      });
    } catch (error) {
      console.error('Failed to initialize meeting sync service:', error);
      throw error;
    }
  }

  // Setup socket event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection', { status: 'connected' });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.emit('connection', { status: 'disconnected', reason });
      this.handleReconnection();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.emit('connection', { status: 'error', error: error.message });
    });

    // Meeting events
    this.socket.on('meeting:created', (data) => {
      console.log('Meeting created:', data);
      this.emit('meeting:created', data);
    });

    this.socket.on('meeting:updated', (data) => {
      console.log('Meeting updated:', data);
      this.emit('meeting:updated', data);
    });

    this.socket.on('meeting:deleted', (data) => {
      console.log('Meeting deleted:', data);
      this.emit('meeting:deleted', data);
    });

    this.socket.on('meeting:joined', (data) => {
      console.log('User joined meeting:', data);
      this.emit('meeting:joined', data);
    });

    this.socket.on('meeting:left', (data) => {
      console.log('User left meeting:', data);
      this.emit('meeting:left', data);
    });

    this.socket.on('meeting:status_changed', (data) => {
      console.log('Meeting status changed:', data);
      this.emit('meeting:status_changed', data);
    });

    // Participant events
    this.socket.on('participant:joined', (data) => {
      console.log('Participant joined:', data);
      this.emit('participant:joined', data);
    });

    this.socket.on('participant:left', (data) => {
      console.log('Participant left:', data);
      this.emit('participant:left', data);
    });

    this.socket.on('participant:updated', (data) => {
      console.log('Participant updated:', data);
      this.emit('participant:updated', data);
    });

    // Chat events
    this.socket.on('chat:message', (data) => {
      console.log('Chat message received:', data);
      this.emit('chat:message', data);
    });

    this.socket.on('chat:reaction', (data) => {
      console.log('Chat reaction received:', data);
      this.emit('chat:reaction', data);
    });

    // Screen share events
    this.socket.on('screenshare:started', (data) => {
      console.log('Screen share started:', data);
      this.emit('screenshare:started', data);
    });

    this.socket.on('screenshare:stopped', (data) => {
      console.log('Screen share stopped:', data);
      this.emit('screenshare:stopped', data);
    });

    // Recording events
    this.socket.on('recording:started', (data) => {
      console.log('Recording started:', data);
      this.emit('recording:started', data);
    });

    this.socket.on('recording:stopped', (data) => {
      console.log('Recording stopped:', data);
      this.emit('recording:stopped', data);
    });
  }

  // Handle reconnection logic
  handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      this.emit('connection', { status: 'failed' });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (this.socket && !this.isConnected) {
        this.socket.connect();
      }
    }, delay);
  }

  // Join a meeting room for real-time updates
  async joinMeetingRoom(meetingId) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    try {
      this.socket.emit('meeting:join', { meetingId });
      console.log(`Joined meeting room: ${meetingId}`);
    } catch (error) {
      console.error('Failed to join meeting room:', error);
      throw error;
    }
  }

  // Leave a meeting room
  async leaveMeetingRoom(meetingId) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    try {
      this.socket.emit('meeting:leave', { meetingId });
      console.log(`Left meeting room: ${meetingId}`);
    } catch (error) {
      console.error('Failed to leave meeting room:', error);
    }
  }

  // Send meeting status update
  async updateMeetingStatus(meetingId, status, data = {}) {
    if (!this.socket || !this.isConnected) {
      // Fallback to API call
      return meetingApiService.updateMeetingStatus(meetingId, status);
    }

    try {
      this.socket.emit('meeting:status_update', {
        meetingId,
        status,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update meeting status:', error);
      throw error;
    }
  }

  // Send participant update
  async updateParticipant(meetingId, participantData) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    try {
      this.socket.emit('participant:update', {
        meetingId,
        participant: participantData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update participant:', error);
      throw error;
    }
  }

  // Send chat message
  async sendChatMessage(meetingId, message) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    try {
      this.socket.emit('chat:send', {
        meetingId,
        message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to send chat message:', error);
      throw error;
    }
  }

  // Send reaction
  async sendReaction(meetingId, reaction) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    try {
      this.socket.emit('chat:reaction', {
        meetingId,
        reaction,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to send reaction:', error);
      throw error;
    }
  }

  // Notify screen share status
  async notifyScreenShare(meetingId, isSharing) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    try {
      this.socket.emit('screenshare:status', {
        meetingId,
        isSharing,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to notify screen share status:', error);
    }
  }

  // Notify recording status
  async notifyRecording(meetingId, isRecording) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    try {
      this.socket.emit('recording:status', {
        meetingId,
        isRecording,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to notify recording status:', error);
    }
  }

  // Add event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  // Emit event to listeners
  emit(event, data) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id
    };
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.listeners.clear();
  }

  // Cleanup
  cleanup() {
    this.disconnect();
  }
}

// Export singleton instance
export default new MeetingSyncService();
