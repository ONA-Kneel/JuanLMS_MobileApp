import { Alert, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

class MeetingErrorHandler {
  constructor() {
    this.errorTypes = {
      NETWORK_ERROR: 'NETWORK_ERROR',
      PERMISSION_ERROR: 'PERMISSION_ERROR',
      AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
      STREAM_ERROR: 'STREAM_ERROR',
      MEETING_ERROR: 'MEETING_ERROR',
      UNKNOWN_ERROR: 'UNKNOWN_ERROR'
    };

    this.recoveryStrategies = {
      [this.errorTypes.NETWORK_ERROR]: this.handleNetworkError.bind(this),
      [this.errorTypes.PERMISSION_ERROR]: this.handlePermissionError.bind(this),
      [this.errorTypes.AUTHENTICATION_ERROR]: this.handleAuthenticationError.bind(this),
      [this.errorTypes.STREAM_ERROR]: this.handleStreamError.bind(this),
      [this.errorTypes.MEETING_ERROR]: this.handleMeetingError.bind(this),
      [this.errorTypes.UNKNOWN_ERROR]: this.handleUnknownError.bind(this)
    };
  }

  // Categorize error type
  categorizeError(error) {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || '';

    // Network errors
    if (errorMessage.includes('network') || 
        errorMessage.includes('connection') || 
        errorMessage.includes('timeout') ||
        errorCode === 'NETWORK_ERROR') {
      return this.errorTypes.NETWORK_ERROR;
    }

    // Permission errors
    if (errorMessage.includes('permission') || 
        errorMessage.includes('camera') || 
        errorMessage.includes('microphone') ||
        errorCode === 'PERMISSION_DENIED') {
      return this.errorTypes.PERMISSION_ERROR;
    }

    // Authentication errors
    if (errorMessage.includes('unauthorized') || 
        errorMessage.includes('authentication') || 
        errorMessage.includes('token') ||
        errorCode === 'AUTH_ERROR') {
      return this.errorTypes.AUTHENTICATION_ERROR;
    }

    // Stream-specific errors
    if (errorMessage.includes('stream') || 
        errorMessage.includes('webrtc') || 
        errorMessage.includes('media') ||
        errorCode === 'STREAM_ERROR') {
      return this.errorTypes.STREAM_ERROR;
    }

    // Meeting-specific errors
    if (errorMessage.includes('meeting') || 
        errorMessage.includes('call') || 
        errorMessage.includes('room') ||
        errorCode === 'MEETING_ERROR') {
      return this.errorTypes.MEETING_ERROR;
    }

    return this.errorTypes.UNKNOWN_ERROR;
  }

  // Handle network errors
  async handleNetworkError(error) {
    console.log('Handling network error:', error);

    // Check current network status
    const networkState = await NetInfo.fetch();
    
    if (!networkState.isConnected) {
      return {
        canRecover: true,
        recoveryAction: 'wait_for_connection',
        userMessage: 'No internet connection. Please check your network and try again.',
        retryAfter: 5000
      };
    }

    if (networkState.isInternetReachable === false) {
      return {
        canRecover: true,
        recoveryAction: 'wait_for_connection',
        userMessage: 'Internet connection is not available. Please check your network and try again.',
        retryAfter: 10000
      };
    }

    return {
      canRecover: true,
      recoveryAction: 'retry',
      userMessage: 'Network error occurred. Retrying...',
      retryAfter: 3000
    };
  }

  // Handle permission errors
  async handlePermissionError(error) {
    console.log('Handling permission error:', error);

    return {
      canRecover: true,
      recoveryAction: 'request_permissions',
      userMessage: 'Camera and microphone permissions are required to join the meeting. Please grant permissions in your device settings.',
      retryAfter: 0,
      showSettingsAlert: true
    };
  }

  // Handle authentication errors
  async handleAuthenticationError(error) {
    console.log('Handling authentication error:', error);

    return {
      canRecover: false,
      recoveryAction: 'reauthenticate',
      userMessage: 'Authentication failed. Please log in again.',
      retryAfter: 0,
      requiresReauth: true
    };
  }

  // Handle Stream errors
  async handleStreamError(error) {
    console.log('Handling Stream error:', error);

    // Check if it's a recoverable Stream error
    const errorMessage = error.message?.toLowerCase() || '';
    
    if (errorMessage.includes('join') || errorMessage.includes('connection')) {
      return {
        canRecover: true,
        recoveryAction: 'retry',
        userMessage: 'Failed to connect to the meeting. Retrying...',
        retryAfter: 5000
      };
    }

    if (errorMessage.includes('media') || errorMessage.includes('device')) {
      return {
        canRecover: true,
        recoveryAction: 'check_devices',
        userMessage: 'Media device error. Please check your camera and microphone.',
        retryAfter: 0
      };
    }

    return {
      canRecover: false,
      recoveryAction: 'none',
      userMessage: 'Video service error. Please try again later.',
      retryAfter: 0
    };
  }

  // Handle meeting errors
  async handleMeetingError(error) {
    console.log('Handling meeting error:', error);

    const errorMessage = error.message?.toLowerCase() || '';

    if (errorMessage.includes('not found') || errorMessage.includes('ended')) {
      return {
        canRecover: false,
        recoveryAction: 'none',
        userMessage: 'This meeting has ended or is no longer available.',
        retryAfter: 0
      };
    }

    if (errorMessage.includes('full') || errorMessage.includes('capacity')) {
      return {
        canRecover: false,
        recoveryAction: 'none',
        userMessage: 'This meeting is full and cannot accept more participants.',
        retryAfter: 0
      };
    }

    if (errorMessage.includes('host') || errorMessage.includes('permission')) {
      return {
        canRecover: false,
        recoveryAction: 'none',
        userMessage: 'You do not have permission to perform this action.',
        retryAfter: 0
      };
    }

    return {
      canRecover: true,
      recoveryAction: 'retry',
      userMessage: 'Meeting error occurred. Retrying...',
      retryAfter: 3000
    };
  }

  // Handle unknown errors
  async handleUnknownError(error) {
    console.log('Handling unknown error:', error);

    return {
      canRecover: true,
      recoveryAction: 'retry',
      userMessage: 'An unexpected error occurred. Retrying...',
      retryAfter: 5000
    };
  }

  // Process error and get recovery strategy
  async processError(error) {
    try {
      const errorType = this.categorizeError(error);
      const recoveryStrategy = await this.recoveryStrategies[errorType](error);
      
      return {
        errorType,
        originalError: error,
        ...recoveryStrategy
      };
    } catch (processingError) {
      console.error('Error processing error:', processingError);
      return {
        errorType: this.errorTypes.UNKNOWN_ERROR,
        originalError: error,
        canRecover: false,
        recoveryAction: 'none',
        userMessage: 'An unexpected error occurred.',
        retryAfter: 0
      };
    }
  }

  // Show error alert to user
  showErrorAlert(errorInfo) {
    const { userMessage, canRecover, recoveryAction, showSettingsAlert } = errorInfo;

    if (showSettingsAlert) {
      Alert.alert(
        'Permissions Required',
        userMessage,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Open Settings',
            onPress: () => {
              // Open device settings
              if (Platform.OS === 'ios') {
                // iOS settings
                console.log('Opening iOS settings...');
              } else {
                // Android settings
                console.log('Opening Android settings...');
              }
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Meeting Error',
        userMessage,
        canRecover ? [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Retry',
            onPress: () => {
              // Retry logic will be handled by the calling component
              return true;
            }
          }
        ] : [
          {
            text: 'OK',
            style: 'default'
          }
        ]
      );
    }
  }

  // Create retry function with exponential backoff
  createRetryFunction(fn, maxRetries = 3, baseDelay = 1000) {
    return async (...args) => {
      let lastError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await fn(...args);
        } catch (error) {
          lastError = error;
          
          if (attempt === maxRetries) {
            throw error;
          }

          const errorInfo = await this.processError(error);
          
          if (!errorInfo.canRecover) {
            throw error;
          }

          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      throw lastError;
    };
  }

  // Log error for debugging
  logError(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      code: error.code,
      timestamp: new Date().toISOString(),
      context,
      platform: Platform.OS,
      version: Platform.Version
    };

    console.error('Meeting Error:', errorInfo);
    
    // In production, you might want to send this to a logging service
    // this.sendToLoggingService(errorInfo);
  }

  // Get user-friendly error message
  getUserFriendlyMessage(error) {
    const errorMessage = error.message?.toLowerCase() || '';
    
    const friendlyMessages = {
      'network': 'Please check your internet connection and try again.',
      'permission': 'Please grant camera and microphone permissions to join the meeting.',
      'unauthorized': 'Please log in again to continue.',
      'not found': 'This meeting is no longer available.',
      'full': 'This meeting is full and cannot accept more participants.',
      'timeout': 'The request timed out. Please try again.',
      'server': 'Server error occurred. Please try again later.'
    };

    for (const [key, message] of Object.entries(friendlyMessages)) {
      if (errorMessage.includes(key)) {
        return message;
      }
    }

    return 'An unexpected error occurred. Please try again.';
  }
}

// Export singleton instance
export default new MeetingErrorHandler();
