// Completely safe socket service that will never crash the app
import AsyncStorage from '@react-native-async-storage/async-storage';

class SafeSocketServiceFinal {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.userId = null;
    this.currentClassId = null;
    this.socketAvailable = false;
    this.initializationAttempted = false;
  }

  async initialize(userId) {
    console.log('[SafeSocketServiceFinal] Real-time features disabled for stability');
    this.userId = userId;
    this.initializationAttempted = true;
    return null;
  }

  setupConnectionListeners() {
    console.log('[SafeSocketServiceFinal] Mock setupConnectionListeners');
  }

  joinClass(classId) {
    console.log(`[SafeSocketServiceFinal] Mock join class: ${classId}`);
    this.currentClassId = classId;
    return true;
  }

  leaveClass(classId) {
    console.log(`[SafeSocketServiceFinal] Mock leave class: ${classId}`);
    if (this.currentClassId === classId) {
      this.currentClassId = null;
    }
    return true;
  }

  addEventListener(event, callback) {
    console.log(`[SafeSocketServiceFinal] Mock add listener for: ${event}`);
    // Store listener for consistency but don't actually listen
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return true;
  }

  removeEventListener(event, callback) {
    console.log(`[SafeSocketServiceFinal] Mock remove listener for: ${event}`);
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
    return true;
  }

  removeAllListeners(event) {
    console.log(`[SafeSocketServiceFinal] Mock remove all listeners for: ${event}`);
    if (this.listeners.has(event)) {
      this.listeners.delete(event);
    }
    return true;
  }

  cleanup() {
    console.log('[SafeSocketServiceFinal] Mock cleanup');
    this.socket = null;
    this.isConnected = false;
    this.listeners.clear();
    this.userId = null;
    this.currentClassId = null;
    this.initializationAttempted = false;
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

  getConnectionStatus() {
    return {
      isConnected: false,
      socketExists: false,
      socketConnected: false,
      currentClassId: this.currentClassId,
      userId: this.userId,
      socketAvailable: false
    };
  }
}

export default SafeSocketServiceFinal;
