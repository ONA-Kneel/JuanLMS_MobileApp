// Disabled Socket Service - Completely disables real-time features to prevent crashes
import AsyncStorage from '@react-native-async-storage/async-storage';

class DisabledSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.userId = null;
    this.currentClassId = null;
    this.socketAvailable = false;
  }

  async initialize(userId) {
    console.log('[DisabledSocketService] Real-time features disabled to prevent crashes');
    this.userId = userId;
    return null;
  }

  setupConnectionListeners() {
    // No-op
  }

  joinClass(classId) {
    console.log(`[DisabledSocketService] Mock join class: ${classId}`);
    this.currentClassId = classId;
  }

  leaveClass(classId) {
    console.log(`[DisabledSocketService] Mock leave class: ${classId}`);
  }

  addEventListener(event, callback) {
    console.log(`[DisabledSocketService] Mock add listener for: ${event}`);
    // Store listener for consistency but don't actually listen
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  removeEventListener(event, callback) {
    console.log(`[DisabledSocketService] Mock remove listener for: ${event}`);
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  removeAllListeners(event) {
    console.log(`[DisabledSocketService] Mock remove all listeners for: ${event}`);
    if (this.listeners.has(event)) {
      this.listeners.delete(event);
    }
  }

  cleanup() {
    console.log('[DisabledSocketService] Mock cleanup');
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

export default DisabledSocketService;
