import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_URL = 'https://juanlms-webapp-server.onrender.com';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.userId = null;
    this.currentClassId = null;
  }

  async initialize(userId) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        console.log('[SocketService] No token found, cannot initialize socket');
        return null;
      }

      this.userId = userId;
      
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnectionAttempts: 5,
        timeout: 10000,
        auth: {
          token: token,
          userId: userId
        }
      });

      this.setupConnectionListeners();
      return this.socket;
    } catch (error) {
      console.error('[SocketService] Error initializing socket:', error);
      return null;
    }
  }

  setupConnectionListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[SocketService] Connected to server');
      this.isConnected = true;
      this.socket.emit('addUser', this.userId);
    });

    this.socket.on('disconnect', () => {
      console.log('[SocketService] Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SocketService] Connection error:', error);
      this.isConnected = false;
    });

    this.socket.on('reconnect', () => {
      console.log('[SocketService] Reconnected to server');
      this.isConnected = true;
      this.socket.emit('addUser', this.userId);
    });
  }

  // Join a class room for real-time updates
  joinClass(classId) {
    if (!this.socket || !this.isConnected) {
      console.log('[SocketService] Socket not connected, cannot join class');
      return;
    }

    if (this.currentClassId) {
      this.leaveClass(this.currentClassId);
    }

    this.socket.emit('joinClass', classId);
    this.currentClassId = classId;
    console.log(`[SocketService] Joined class room: ${classId}`);
  }

  // Leave a class room
  leaveClass(classId) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('leaveClass', classId);
    console.log(`[SocketService] Left class room: ${classId}`);
  }

  // Add event listener for real-time updates
  addEventListener(event, callback) {
    if (!this.socket) {
      console.log('[SocketService] Socket not initialized, cannot add listener');
      return;
    }

    // Store listener for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    this.socket.on(event, callback);
    console.log(`[SocketService] Added listener for event: ${event}`);
  }

  // Remove specific event listener
  removeEventListener(event, callback) {
    if (!this.socket) return;

    this.socket.off(event, callback);
    
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Remove all listeners for an event
  removeAllListeners(event) {
    if (!this.socket) return;

    this.socket.removeAllListeners(event);
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        this.socket.off(event, callback);
      });
      this.listeners.delete(event);
    }
  }

  // Clean up all listeners and disconnect
  cleanup() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.listeners.clear();
    this.userId = null;
    this.currentClassId = null;
    console.log('[SocketService] Cleaned up socket connection');
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }

  // Check if connected
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;
