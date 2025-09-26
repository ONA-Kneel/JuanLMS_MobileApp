// Safe Socket Service - Completely avoids socket.io imports
import AsyncStorage from '@react-native-async-storage/async-storage';

class SafeSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.userId = null;
    this.currentClassId = null;
    this.socketAvailable = false;
  }

  async initialize(userId) {
    console.log('[SafeSocketService] Real-time features disabled - socket.io not available');
    this.userId = userId;
    return null;
  }

  setupConnectionListeners() {
    // No-op
  }

  joinClass(classId) {
    console.log(`[SafeSocketService] Mock join class: ${classId}`);
    this.currentClassId = classId;
  }

  leaveClass(classId) {
    console.log(`[SafeSocketService] Mock leave class: ${classId}`);
  }

  addEventListener(event, callback) {
    console.log(`[SafeSocketService] Mock add listener for: ${event}`);
    // Store listener for consistency but don't actually listen
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  removeEventListener(event, callback) {
    console.log(`[SafeSocketService] Mock remove listener for: ${event}`);
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  removeAllListeners(event) {
    console.log(`[SafeSocketService] Mock remove all listeners for: ${event}`);
    if (this.listeners.has(event)) {
      this.listeners.delete(event);
    }
  }

  cleanup() {
    console.log('[SafeSocketService] Mock cleanup');
    this.socket = null;
    this.isConnected = false;
    this.listeners.clear();
    this.userId = null;
    this.currentClassId = null;
  }

  getSocket() {
    return null;
  }

  isSocketConnected() {
    return false;
  }

  isSocketAvailable() {
    return false;
  }
}

export default SafeSocketService;
