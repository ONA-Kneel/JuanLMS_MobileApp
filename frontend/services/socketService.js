import AsyncStorage from '@react-native-async-storage/async-storage';
import SafeSocketService from './safeSocketService.js';

const SOCKET_URL = 'https://juanlms-webapp-server.onrender.com';

// Try to import socket.io-client, fallback to null if not available
let io = null;
let socketAvailable = false;

try {
  // Try different import methods for React Native
  if (typeof require !== 'undefined') {
    try {
      io = require('socket.io-client');
    } catch (requireError) {
      console.warn('[SocketService] require() failed, trying dynamic import');
      io = null;
    }
  }
  
  // Check if io is actually a function
  if (io && typeof io === 'function') {
    socketAvailable = true;
    console.log('[SocketService] Socket.IO client loaded successfully');
  } else {
    socketAvailable = false;
    console.warn('[SocketService] Socket.IO client not properly loaded, using fallback');
  }
} catch (error) {
  socketAvailable = false;
  console.warn('[SocketService] Socket.IO client not available:', error.message);
}

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.userId = null;
    this.currentClassId = null;
    this.initializationAttempted = false;
    this.connectionTimeout = null;
  }

  async initialize(userId) {
    // Prevent multiple initialization attempts
    if (this.initializationAttempted) {
      console.log('[SocketService] Initialization already attempted');
      return this.socket;
    }

    this.initializationAttempted = true;

    try {
      // Check if socket.io is available
      if (!socketAvailable || !io || typeof io !== 'function') {
        console.warn('[SocketService] Socket.IO client not available, real-time features disabled');
        return null;
      }

      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        console.log('[SocketService] No token found, cannot initialize socket');
        return null;
      }

      this.userId = userId;
      
      console.log('[SocketService] Initializing socket connection...');
      
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'], // Add polling as fallback
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        timeout: 15000,
        forceNew: true,
        auth: {
          token: token,
          userId: userId
        }
      });

      this.setupConnectionListeners();
      
      // Set a timeout to handle connection issues
      this.connectionTimeout = setTimeout(() => {
        if (!this.isConnected) {
          console.warn('[SocketService] Connection timeout, falling back to safe mode');
          this.cleanup();
        }
      }, 20000);

      return this.socket;
    } catch (error) {
      console.error('[SocketService] Error initializing socket:', error);
      this.initializationAttempted = false;
      return null;
    }
  }

  setupConnectionListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[SocketService] Connected to server');
      this.isConnected = true;
      
      // Clear connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      // Register user with server
      try {
        this.socket.emit('addUser', this.userId);
      } catch (error) {
        console.error('[SocketService] Error emitting addUser:', error);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[SocketService] Disconnected from server:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SocketService] Connection error:', error);
      this.isConnected = false;
      
      // Clear connection timeout on error
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('[SocketService] Reconnected to server after', attemptNumber, 'attempts');
      this.isConnected = true;
      
      // Re-register user
      try {
        this.socket.emit('addUser', this.userId);
      } catch (error) {
        console.error('[SocketService] Error emitting addUser on reconnect:', error);
      }
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('[SocketService] Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('[SocketService] Reconnection failed, giving up');
      this.isConnected = false;
    });
  }

  // Join a class room for real-time updates
  joinClass(classId) {
    if (!this.socket || !this.isConnected) {
      console.log('[SocketService] Socket not connected, cannot join class');
      return false;
    }

    if (!classId) {
      console.warn('[SocketService] No classId provided for joinClass');
      return false;
    }

    try {
      // Leave previous class if any
      if (this.currentClassId && this.currentClassId !== classId) {
        this.leaveClass(this.currentClassId);
      }

      this.socket.emit('joinClass', classId);
      this.currentClassId = classId;
      console.log(`[SocketService] Joined class room: ${classId}`);
      return true;
    } catch (error) {
      console.error('[SocketService] Error joining class:', error);
      return false;
    }
  }

  // Leave a class room
  leaveClass(classId) {
    if (!this.socket || !this.isConnected) {
      console.log('[SocketService] Socket not connected, cannot leave class');
      return false;
    }

    if (!classId) {
      console.warn('[SocketService] No classId provided for leaveClass');
      return false;
    }

    try {
      this.socket.emit('leaveClass', classId);
      if (this.currentClassId === classId) {
        this.currentClassId = null;
      }
      console.log(`[SocketService] Left class room: ${classId}`);
      return true;
    } catch (error) {
      console.error('[SocketService] Error leaving class:', error);
      return false;
    }
  }

  // Add event listener for real-time updates
  addEventListener(event, callback) {
    if (!this.socket) {
      console.log('[SocketService] Socket not initialized, cannot add listener');
      return false;
    }

    if (!event || typeof callback !== 'function') {
      console.warn('[SocketService] Invalid event or callback provided');
      return false;
    }

    try {
      // Store listener for cleanup
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);

      this.socket.on(event, callback);
      console.log(`[SocketService] Added listener for event: ${event}`);
      return true;
    } catch (error) {
      console.error('[SocketService] Error adding event listener:', error);
      return false;
    }
  }

  // Remove specific event listener
  removeEventListener(event, callback) {
    if (!this.socket) {
      console.log('[SocketService] Socket not initialized, cannot remove listener');
      return false;
    }

    if (!event || typeof callback !== 'function') {
      console.warn('[SocketService] Invalid event or callback provided for removal');
      return false;
    }

    try {
      this.socket.off(event, callback);
      
      if (this.listeners.has(event)) {
        const listeners = this.listeners.get(event);
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
      console.log(`[SocketService] Removed listener for event: ${event}`);
      return true;
    } catch (error) {
      console.error('[SocketService] Error removing event listener:', error);
      return false;
    }
  }

  // Remove all listeners for an event
  removeAllListeners(event) {
    if (!this.socket) {
      console.log('[SocketService] Socket not initialized, cannot remove listeners');
      return false;
    }

    try {
      this.socket.removeAllListeners(event);
      if (this.listeners.has(event)) {
        this.listeners.delete(event);
      }
      console.log(`[SocketService] Removed all listeners for event: ${event}`);
      return true;
    } catch (error) {
      console.error('[SocketService] Error removing all listeners:', error);
      return false;
    }
  }

  // Clean up all listeners and disconnect
  cleanup() {
    try {
      // Clear connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }
      
      this.isConnected = false;
      this.listeners.clear();
      this.userId = null;
      this.currentClassId = null;
      this.initializationAttempted = false;
      
      console.log('[SocketService] Cleaned up socket connection');
    } catch (error) {
      console.error('[SocketService] Error during cleanup:', error);
    }
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }

  // Check if connected
  isSocketConnected() {
    try {
      return this.isConnected && this.socket && this.socket.connected;
    } catch (error) {
      console.error('[SocketService] Error checking connection status:', error);
      return false;
    }
  }

  // Check if socket.io is available
  isSocketAvailable() {
    return socketAvailable;
  }

  // Get connection status info
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketExists: !!this.socket,
      socketConnected: this.socket ? this.socket.connected : false,
      currentClassId: this.currentClassId,
      userId: this.userId,
      socketAvailable: socketAvailable
    };
  }
}

// Create singleton instance with proper fallback
const socketService = socketAvailable ? new SocketService() : new SafeSocketService();
export default socketService;
