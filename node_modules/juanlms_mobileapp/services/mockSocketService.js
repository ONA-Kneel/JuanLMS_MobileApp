// Mock Socket Service - Fallback when socket.io is not available
class MockSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.userId = null;
    this.currentClassId = null;
  }

  async initialize(userId) {
    console.log('[MockSocketService] Socket.IO not available, using mock service');
    this.userId = userId;
    return null;
  }

  setupConnectionListeners() {
    // No-op for mock service
  }

  joinClass(classId) {
    console.log(`[MockSocketService] Mock join class: ${classId}`);
    this.currentClassId = classId;
  }

  leaveClass(classId) {
    console.log(`[MockSocketService] Mock leave class: ${classId}`);
  }

  addEventListener(event, callback) {
    console.log(`[MockSocketService] Mock add listener for: ${event}`);
    // Store listener for consistency but don't actually listen
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  removeEventListener(event, callback) {
    console.log(`[MockSocketService] Mock remove listener for: ${event}`);
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  removeAllListeners(event) {
    console.log(`[MockSocketService] Mock remove all listeners for: ${event}`);
    if (this.listeners.has(event)) {
      this.listeners.delete(event);
    }
  }

  cleanup() {
    console.log('[MockSocketService] Mock cleanup');
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

export default MockSocketService;
