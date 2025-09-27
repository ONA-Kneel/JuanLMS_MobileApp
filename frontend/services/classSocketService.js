import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocketURL, SOCKET_CONFIG, socketLog } from '../config/socketConfig';

const SOCKET_URL = getSocketURL();

class ClassSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.userId = null;
    this.currentClassId = null;
    this.pendingJoinClassId = null;
    this.socketAvailable = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  async initialize(userId) {
    try {
      socketLog('info', 'CLASS_SOCKET_SERVICE', `Initializing Socket.IO connection for user: ${userId}`);
      socketLog('debug', 'CLASS_SOCKET_SERVICE', `Socket URL: ${SOCKET_URL}`);
      
      if (!userId) {
        socketLog('error', 'CLASS_SOCKET_SERVICE', 'No userId provided for socket initialization');
        return null;
      }

      this.userId = userId;
      
      // Get token from storage
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        socketLog('error', 'CLASS_SOCKET_SERVICE', 'No JWT token found in storage');
        return null;
      }

      socketLog('debug', 'CLASS_SOCKET_SERVICE', 'JWT token found, creating socket connection...');
      socketLog('debug', 'CLASS_SOCKET_SERVICE', 'Connection options', SOCKET_CONFIG.CONNECTION_OPTIONS);

      // Create socket connection with enhanced error tracking
      this.socket = io(SOCKET_URL, {
        auth: { 
          token,
          userId: userId,
          timestamp: Date.now()
        },
        ...SOCKET_CONFIG.CONNECTION_OPTIONS,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      if (!this.socket) {
        socketLog('error', 'CLASS_SOCKET_SERVICE', 'Failed to create socket instance');
        return null;
      }

      socketLog('debug', 'CLASS_SOCKET_SERVICE', 'Socket instance created, setting up listeners...');
      this.setupConnectionListeners();
      this.setupClassEventListeners();
      
      socketLog('info', 'CLASS_SOCKET_SERVICE', 'Socket.IO initialized successfully');
      return this.socket;
    } catch (error) {
      socketLog('error', 'CLASS_SOCKET_SERVICE', 'Failed to initialize socket', {
        error: error.message,
        stack: error.stack,
        userId,
        socketUrl: SOCKET_URL
      });
      this.socketAvailable = false;
      return null;
    }
  }

  setupConnectionListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      socketLog('info', 'CLASS_SOCKET_SERVICE', `Connected to server successfully. Socket ID: ${this.socket.id}`);
      this.isConnected = true;
      this.socketAvailable = true;
      this.reconnectAttempts = 0;
      // Notify UI consumers
      this.emitToListeners('connected', { socketId: this.socket.id, userId: this.userId });
      
      // Re-authenticate on reconnect
      socketLog('debug', 'CLASS_SOCKET_SERVICE', `Emitting addUser with userId: ${this.userId}`);
      this.socket.emit('addUser', this.userId);
      
      // If a join was requested before connection, perform it now
      if (this.pendingJoinClassId) {
        socketLog('info', 'CLASS_SOCKET_SERVICE', `Processing pending join for class ${this.pendingJoinClassId}`);
        this.joinClass(this.pendingJoinClassId);
        this.pendingJoinClassId = null;
      }
      // Test the connection immediately
      this.socket.emit('test', {
        userId: this.userId,
        timestamp: Date.now(),
        message: 'Connection test from mobile app'
      });
    });

    this.socket.on('disconnect', (reason) => {
      socketLog('warn', 'CLASS_SOCKET_SERVICE', `Disconnected from server. Reason: ${reason}`);
      this.isConnected = false;
      this.emitToListeners('disconnected', { reason });
      
      // Log additional details based on disconnect reason
      if (reason === 'io server disconnect') {
        socketLog('warn', 'CLASS_SOCKET_SERVICE', 'Server initiated disconnect - will not auto-reconnect');
      } else if (reason === 'io client disconnect') {
        socketLog('info', 'CLASS_SOCKET_SERVICE', 'Client initiated disconnect');
      } else {
        socketLog('warn', 'CLASS_SOCKET_SERVICE', 'Unexpected disconnect - will attempt to reconnect');
      }
    });

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++;
      socketLog('error', 'CLASS_SOCKET_SERVICE', `Connection error (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`, {
        error: error.message,
        type: error.type,
        description: error.description,
        context: error.context,
        socketUrl: SOCKET_URL
      });
      this.isConnected = false;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        socketLog('error', 'CLASS_SOCKET_SERVICE', 'Max reconnection attempts reached');
        this.socketAvailable = false;
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      socketLog('info', 'CLASS_SOCKET_SERVICE', `Successfully reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.socketAvailable = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_error', (error) => {
      socketLog('error', 'CLASS_SOCKET_SERVICE', `Reconnection error`, {
        error: error.message,
        attempt: this.reconnectAttempts
      });
    });

    this.socket.on('reconnect_failed', () => {
      socketLog('error', 'CLASS_SOCKET_SERVICE', 'All reconnection attempts failed');
      this.socketAvailable = false;
    });

    // Listen for test response to verify connection
    this.socket.on('testResponse', (data) => {
      socketLog('info', 'CLASS_SOCKET_SERVICE', 'Test response received from server', data);
    });

    // Generic error handler
    this.socket.on('error', (error) => {
      socketLog('error', 'CLASS_SOCKET_SERVICE', 'Socket error occurred', error);
    });
  }

  setupClassEventListeners() {
    if (!this.socket) return;

    // Assignment events with enhanced error handling
    this.socket.on('newAssignment', (data) => {
      try {
        socketLog('info', 'CLASS_SOCKET_SERVICE', 'New assignment received', {
          assignmentId: data?.assignment?._id,
          classID: data?.classID,
          title: data?.assignment?.title
        });
      this.emitToListeners('newAssignment', data);
      } catch (error) {
        socketLog('error', 'CLASS_SOCKET_SERVICE', 'Error handling newAssignment event', { error: error.message, data });
      }
    });

    this.socket.on('assignmentUpdated', (data) => {
      try {
        socketLog('info', 'CLASS_SOCKET_SERVICE', 'Assignment updated', {
          assignmentId: data?.assignment?._id,
          classID: data?.classID,
          title: data?.assignment?.title
        });
      this.emitToListeners('assignmentUpdated', data);
      } catch (error) {
        socketLog('error', 'CLASS_SOCKET_SERVICE', 'Error handling assignmentUpdated event', { error: error.message, data });
      }
    });

    this.socket.on('assignmentDeleted', (data) => {
      try {
        socketLog('info', 'CLASS_SOCKET_SERVICE', 'Assignment deleted', {
          assignmentId: data?.assignmentId,
          classID: data?.classID
        });
      this.emitToListeners('assignmentDeleted', data);
      } catch (error) {
        socketLog('error', 'CLASS_SOCKET_SERVICE', 'Error handling assignmentDeleted event', { error: error.message, data });
      }
    });

    // Announcement events with enhanced error handling
    this.socket.on('newAnnouncement', (data) => {
      try {
        socketLog('info', 'CLASS_SOCKET_SERVICE', 'New announcement received', {
          announcementId: data?.announcement?._id,
          classID: data?.classID,
          title: data?.announcement?.title
        });
      this.emitToListeners('newAnnouncement', data);
      } catch (error) {
        socketLog('error', 'CLASS_SOCKET_SERVICE', 'Error handling newAnnouncement event', { error: error.message, data });
      }
    });

    this.socket.on('announcementUpdated', (data) => {
      try {
        socketLog('info', 'CLASS_SOCKET_SERVICE', 'Announcement updated', {
          announcementId: data?.announcement?._id,
          classID: data?.classID,
          title: data?.announcement?.title
        });
      this.emitToListeners('announcementUpdated', data);
      } catch (error) {
        socketLog('error', 'CLASS_SOCKET_SERVICE', 'Error handling announcementUpdated event', { error: error.message, data });
      }
    });

    this.socket.on('announcementDeleted', (data) => {
      try {
        socketLog('info', 'CLASS_SOCKET_SERVICE', 'Announcement deleted', {
          announcementId: data?.announcementId,
          classID: data?.classID
        });
      this.emitToListeners('announcementDeleted', data);
      } catch (error) {
        socketLog('error', 'CLASS_SOCKET_SERVICE', 'Error handling announcementDeleted event', { error: error.message, data });
      }
    });

    // Quiz events with enhanced error handling
    this.socket.on('newQuiz', (data) => {
      try {
        socketLog('info', 'CLASS_SOCKET_SERVICE', 'New quiz received', {
          quizId: data?.quiz?._id,
          classID: data?.classID,
          title: data?.quiz?.title
        });
      this.emitToListeners('newQuiz', data);
      } catch (error) {
        socketLog('error', 'CLASS_SOCKET_SERVICE', 'Error handling newQuiz event', { error: error.message, data });
      }
    });

    this.socket.on('quizUpdated', (data) => {
      try {
        socketLog('info', 'CLASS_SOCKET_SERVICE', 'Quiz updated', {
          quizId: data?.quiz?._id,
          classID: data?.classID,
          title: data?.quiz?.title
        });
      this.emitToListeners('quizUpdated', data);
      } catch (error) {
        socketLog('error', 'CLASS_SOCKET_SERVICE', 'Error handling quizUpdated event', { error: error.message, data });
      }
    });

    this.socket.on('quizDeleted', (data) => {
      try {
        socketLog('info', 'CLASS_SOCKET_SERVICE', 'Quiz deleted', {
          quizId: data?.quizId,
          classID: data?.classID
        });
      this.emitToListeners('quizDeleted', data);
      } catch (error) {
        socketLog('error', 'CLASS_SOCKET_SERVICE', 'Error handling quizDeleted event', { error: error.message, data });
      }
    });

    // Lesson events with enhanced error handling
    this.socket.on('newLesson', (data) => {
      try {
        socketLog('info', 'CLASS_SOCKET_SERVICE', 'New lesson received', {
          lessonId: data?.lesson?._id,
          classID: data?.classID,
          title: data?.lesson?.title
        });
      this.emitToListeners('newLesson', data);
      } catch (error) {
        socketLog('error', 'CLASS_SOCKET_SERVICE', 'Error handling newLesson event', { error: error.message, data });
      }
    });

    this.socket.on('lessonUpdated', (data) => {
      try {
        socketLog('info', 'CLASS_SOCKET_SERVICE', 'Lesson updated', {
          lessonId: data?.lesson?._id,
          classID: data?.classID,
          title: data?.lesson?.title
        });
      this.emitToListeners('lessonUpdated', data);
      } catch (error) {
        socketLog('error', 'CLASS_SOCKET_SERVICE', 'Error handling lessonUpdated event', { error: error.message, data });
      }
    });

    this.socket.on('lessonDeleted', (data) => {
      try {
        socketLog('info', 'CLASS_SOCKET_SERVICE', 'Lesson deleted', {
          lessonId: data?.lessonId,
          classID: data?.classID
        });
      this.emitToListeners('lessonDeleted', data);
      } catch (error) {
        socketLog('error', 'CLASS_SOCKET_SERVICE', 'Error handling lessonDeleted event', { error: error.message, data });
      }
    });

    // Grade events
    this.socket.on('gradePosted', (data) => {
      console.log('[ClassSocketService] Grade posted:', data);
      this.emitToListeners('gradePosted', data);
    });

    this.socket.on('gradeUpdated', (data) => {
      console.log('[ClassSocketService] Grade updated:', data);
      this.emitToListeners('gradeUpdated', data);
    });

    // General class events
    this.socket.on('classUpdated', (data) => {
      console.log('[ClassSocketService] Class updated:', data);
      this.emitToListeners('classUpdated', data);
    });

    // Notification events
    this.socket.on('newNotification', (data) => {
      console.log('[ClassSocketService] New notification received:', data);
      this.emitToListeners('newNotification', data);
    });

    // Test events
    this.socket.on('testResponse', (data) => {
      console.log('[ClassSocketService] Test response received:', data);
      this.emitToListeners('testResponse', data);
    });
  }

  joinClass(classId) {
    try {
      if (!classId) {
        socketLog('error', 'CLASS_SOCKET_SERVICE', 'Cannot join class - no classId provided');
        return;
      }

      if (!this.socket) {
        socketLog('error', 'CLASS_SOCKET_SERVICE', 'Cannot join class - socket is null');
        return;
      }

      if (!this.isConnected) {
        socketLog('warn', 'CLASS_SOCKET_SERVICE', `Socket not connected. Queuing join for class ${classId} until connected.`);
        this.pendingJoinClassId = classId;
        return;
      }

      socketLog('info', 'CLASS_SOCKET_SERVICE', `Joining class: ${classId}`);
    this.currentClassId = classId;
    this.socket.emit('joinClass', classId);
      socketLog('debug', 'CLASS_SOCKET_SERVICE', `Emitted joinClass event for class: ${classId}`);
    } catch (error) {
      socketLog('error', 'CLASS_SOCKET_SERVICE', `Error joining class ${classId}`, error);
    }
  }

  leaveClass(classId) {
    try {
      if (!this.socket) {
        socketLog('warn', 'CLASS_SOCKET_SERVICE', 'Cannot leave class - socket is null');
        return;
      }

      if (!this.isConnected) {
        socketLog('warn', 'CLASS_SOCKET_SERVICE', `Cannot leave class ${classId} - socket not connected`);
        return;
      }

      if (!classId) {
        socketLog('warn', 'CLASS_SOCKET_SERVICE', 'Cannot leave class - no classId provided');
      return;
    }

      socketLog('info', 'CLASS_SOCKET_SERVICE', `Leaving class: ${classId}`);
    this.socket.emit('leaveClass', classId);
      socketLog('debug', 'CLASS_SOCKET_SERVICE', `Emitted leaveClass event for class: ${classId}`);
    
    if (this.currentClassId === classId) {
      this.currentClassId = null;
        socketLog('debug', 'CLASS_SOCKET_SERVICE', 'Cleared current class ID');
      }
    } catch (error) {
      socketLog('error', 'CLASS_SOCKET_SERVICE', `Error leaving class ${classId}`, error);
    }
  }

  addEventListener(event, callback) {
    console.log(`[ClassSocketService] Adding listener for: ${event}`);
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  removeEventListener(event, callback) {
    console.log(`[ClassSocketService] Removing listener for: ${event}`);
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  removeAllListeners(event) {
    console.log(`[ClassSocketService] Removing all listeners for: ${event}`);
    if (this.listeners.has(event)) {
      this.listeners.delete(event);
    }
  }

  emitToListeners(event, data) {
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event);
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[ClassSocketService] Error in listener for ${event}:`, error);
        }
      });
    }
  }

  // Emit custom events
  emit(event, data) {
    if (!this.socket || !this.isConnected) {
      console.log(`[ClassSocketService] Socket not connected, cannot emit: ${event}`);
      return;
    }

    console.log(`[ClassSocketService] Emitting event: ${event}`, data);
    this.socket.emit(event, data);
  }

  // Test connection
  testConnection() {
    if (!this.socket || !this.isConnected) {
      console.log('[ClassSocketService] Socket not connected, cannot test');
      return;
    }

    console.log('[ClassSocketService] Testing connection...');
    this.socket.emit('test', { 
      message: 'Hello from mobile app class service',
      timestamp: new Date().toISOString(),
      userId: this.userId 
    });
  }

  cleanup() {
    console.log('[ClassSocketService] Cleaning up...');
    
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.listeners.clear();
    this.userId = null;
    this.currentClassId = null;
    this.socketAvailable = false;
    this.reconnectAttempts = 0;
  }

  getSocket() {
    return this.socket;
  }

  getSocketId() {
    return this.socket ? this.socket.id : null;
  }

  isSocketConnected() {
    return this.socket && this.isConnected;
  }

  isSocketAvailable() {
    return this.socketAvailable;
  }

  getCurrentClassId() {
    return this.currentClassId;
  }

  getUserId() {
    return this.userId;
  }
}

// Create singleton instance
const classSocketService = new ClassSocketService();
export default classSocketService;


