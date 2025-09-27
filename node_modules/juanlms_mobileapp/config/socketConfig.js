// Socket configuration for mobile app
import Constants from 'expo-constants';

// Enhanced logging utility for socket debugging
const socketLog = (level, component, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}][${level.toUpperCase()}][${component}] ${message}`;
  
  if (level === 'error') {
    console.error(logMessage, data || '');
  } else if (level === 'warn') {
    console.warn(logMessage, data || '');
  } else if (level === 'debug') {
    console.log(logMessage, data || '');
  } else {
    console.log(logMessage, data || '');
  }
};

// Get socket URL from environment variables or fallback to web backend
export const getSocketURL = () => {
  try {
    socketLog('debug', 'SOCKET_CONFIG', 'Determining socket URL...');
    
    // Try to get from Expo constants first
    const fromConstants = Constants?.expoConfig?.extra?.SOCKET_URL;
    if (fromConstants) {
      socketLog('info', 'SOCKET_CONFIG', `Using socket URL from Expo constants: ${fromConstants}`);
      return fromConstants;
    }
    
    // Try to get from environment variables
    const fromEnv = process.env.EXPO_PUBLIC_SOCKET_URL;
    if (fromEnv) {
      socketLog('info', 'SOCKET_CONFIG', `Using socket URL from environment: ${fromEnv}`);
      return fromEnv;
    }
    
    // Fallback to web backend URL
    const fallbackUrl = 'https://juanlms-webapp-server.onrender.com';
    socketLog('info', 'SOCKET_CONFIG', `Using fallback socket URL: ${fallbackUrl}`);
    return fallbackUrl;
  } catch (error) {
    socketLog('error', 'SOCKET_CONFIG', 'Error getting socket URL', error);
    const fallbackUrl = 'https://juanlms-webapp-server.onrender.com';
    socketLog('warn', 'SOCKET_CONFIG', `Using emergency fallback URL: ${fallbackUrl}`);
    return fallbackUrl;
  }
};

// Export the logging utility for use in other socket-related files
export { socketLog };

export const SOCKET_CONFIG = {
  CONNECTION_OPTIONS: {
    transports: ['websocket'],
    reconnection: true,
    timeout: 10000,
    forceNew: false,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    maxReconnectionAttempts: 5,
    randomizationFactor: 0.5,
  },
  
  // Events that the mobile app listens for
  EVENTS: {
    // Class-related events
    NEW_ANNOUNCEMENT: 'newAnnouncement',
    ANNOUNCEMENT_UPDATED: 'announcementUpdated',
    ANNOUNCEMENT_DELETED: 'announcementDeleted',
    
    NEW_ASSIGNMENT: 'newAssignment',
    ASSIGNMENT_UPDATED: 'assignmentUpdated', 
    ASSIGNMENT_DELETED: 'assignmentDeleted',
    
    NEW_QUIZ: 'newQuiz',
    QUIZ_UPDATED: 'quizUpdated',
    QUIZ_DELETED: 'quizDeleted',
    
    NEW_LESSON: 'newLesson',
    LESSON_UPDATED: 'lessonUpdated',
    LESSON_DELETED: 'lessonDeleted',
    
    // Chat-related events
    RECEIVE_MESSAGE: 'receiveMessage',
    RECEIVE_GROUP_MESSAGE: 'receiveGroupMessage',
    
    // Connection events
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    CONNECT_ERROR: 'connect_error',
    RECONNECT: 'reconnect',
    RECONNECT_ERROR: 'reconnect_error',
    
    // Test events
    TEST_RESPONSE: 'testResponse',
  },
  
  // Events that the mobile app emits
  EMIT_EVENTS: {
    // User management
    ADD_USER: 'addUser',
    
    // Class management
    JOIN_CLASS: 'joinClass',
    LEAVE_CLASS: 'leaveClass',
    
    // Chat management
    JOIN_CHAT: 'joinChat',
    LEAVE_CHAT: 'leaveChat',
    SEND_MESSAGE: 'sendMessage',
    
    JOIN_GROUP: 'joinGroup',
    LEAVE_GROUP: 'leaveGroup',
    SEND_GROUP_MESSAGE: 'sendGroupMessage',
    
    // Test
    TEST: 'test',
  }
};

export default {
  getSocketURL,
  SOCKET_CONFIG
};
