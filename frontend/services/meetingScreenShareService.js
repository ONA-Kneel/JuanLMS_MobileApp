import { Platform, Alert, NativeModules } from 'react-native';
import meetingSyncService from './meetingSyncService';

class MeetingScreenShareService {
  constructor() {
    this.isScreenSharing = false;
    this.screenShareStartTime = null;
    this.screenShareCallbacks = new Map();
    this.screenShareOptions = {
      includeAudio: true,
      includeVideo: true,
      quality: 'high', // 'low', 'medium', 'high'
      frameRate: 30
    };
  }

  // Start screen sharing
  async startScreenShare(meetingId, options = {}) {
    try {
      if (this.isScreenSharing) {
        throw new Error('Screen sharing is already active');
      }

      // Merge options
      const screenShareOptions = {
        ...this.screenShareOptions,
        ...options
      };

      // Validate screen sharing permissions
      await this.validateScreenSharePermissions();

      // Start screen sharing
      this.isScreenSharing = true;
      this.screenShareStartTime = new Date();

      // Platform-specific screen share start
      if (Platform.OS === 'ios') {
        await this.startIOSScreenShare(screenShareOptions);
      } else if (Platform.OS === 'android') {
        await this.startAndroidScreenShare(screenShareOptions);
      }

      // Notify sync service
      await meetingSyncService.notifyScreenShare(meetingId, true);

      // Emit screen share started event
      this.emit('screenshare:started', {
        meetingId,
        options: screenShareOptions,
        startTime: this.screenShareStartTime
      });

      console.log('Screen sharing started for meeting:', meetingId);
      return true;

    } catch (error) {
      console.error('Failed to start screen sharing:', error);
      this.isScreenSharing = false;
      this.screenShareStartTime = null;
      throw error;
    }
  }

  // Stop screen sharing
  async stopScreenShare(meetingId) {
    try {
      if (!this.isScreenSharing) {
        throw new Error('No screen sharing in progress');
      }

      const screenShareData = {
        meetingId,
        duration: this.getScreenShareDuration(),
        startTime: this.screenShareStartTime,
        endTime: new Date()
      };

      // Platform-specific screen share stop
      if (Platform.OS === 'ios') {
        await this.stopIOSScreenShare();
      } else if (Platform.OS === 'android') {
        await this.stopAndroidScreenShare();
      }

      // Stop screen sharing
      this.isScreenSharing = false;
      this.screenShareStartTime = null;

      // Notify sync service
      await meetingSyncService.notifyScreenShare(meetingId, false);

      // Emit screen share stopped event
      this.emit('screenshare:stopped', screenShareData);

      console.log('Screen sharing stopped for meeting:', meetingId);
      return screenShareData;

    } catch (error) {
      console.error('Failed to stop screen sharing:', error);
      throw error;
    }
  }

  // iOS screen share start
  async startIOSScreenShare(options) {
    try {
      // iOS screen sharing implementation
      // This would typically involve:
      // 1. Requesting screen recording permissions
      // 2. Starting a broadcast extension
      // 3. Capturing screen content
      
      console.log('Starting iOS screen share with options:', options);
      
      // Placeholder for actual implementation
      // In a real implementation, you would:
      // - Use RPSystemBroadcastPickerView for iOS 12+
      // - Or use ReplayKit for older versions
      // - Handle the broadcast extension lifecycle
      
    } catch (error) {
      console.error('iOS screen share start error:', error);
      throw error;
    }
  }

  // Android screen share start
  async startAndroidScreenShare(options) {
    try {
      // Android screen sharing implementation
      // This would typically involve:
      // 1. Requesting screen capture permissions
      // 2. Starting a foreground service
      // 3. Using MediaProjection API
      
      console.log('Starting Android screen share with options:', options);
      
      // Placeholder for actual implementation
      // In a real implementation, you would:
      // - Request RECORD_AUDIO and SYSTEM_ALERT_WINDOW permissions
      // - Use MediaProjectionManager to capture screen
      // - Handle the foreground service lifecycle
      
    } catch (error) {
      console.error('Android screen share start error:', error);
      throw error;
    }
  }

  // iOS screen share stop
  async stopIOSScreenShare() {
    try {
      console.log('Stopping iOS screen share');
      
      // Placeholder for actual implementation
      // In a real implementation, you would:
      // - Stop the broadcast extension
      // - Clean up resources
      
    } catch (error) {
      console.error('iOS screen share stop error:', error);
      throw error;
    }
  }

  // Android screen share stop
  async stopAndroidScreenShare() {
    try {
      console.log('Stopping Android screen share');
      
      // Placeholder for actual implementation
      // In a real implementation, you would:
      // - Stop the foreground service
      // - Release MediaProjection resources
      
    } catch (error) {
      console.error('Android screen share stop error:', error);
      throw error;
    }
  }

  // Validate screen sharing permissions
  async validateScreenSharePermissions() {
    if (Platform.OS === 'ios') {
      // Check for screen recording permissions
      // This is typically handled by the system when the user tries to start screen recording
      console.log('Validating iOS screen recording permissions');
    } else if (Platform.OS === 'android') {
      // Check for screen capture permissions
      const { PermissionsAndroid } = require('react-native');
      
      const permissions = [
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.SYSTEM_ALERT_WINDOW
      ];

      const results = await PermissionsAndroid.requestMultiple(permissions);
      
      const deniedPermissions = Object.entries(results)
        .filter(([permission, result]) => result !== PermissionsAndroid.RESULTS.GRANTED)
        .map(([permission]) => permission);

      if (deniedPermissions.length > 0) {
        throw new Error(`Required permissions denied: ${deniedPermissions.join(', ')}`);
      }
    }
  }

  // Get screen share status
  getScreenShareStatus() {
    return {
      isScreenSharing: this.isScreenSharing,
      startTime: this.screenShareStartTime,
      duration: this.getScreenShareDuration(),
      options: this.screenShareOptions
    };
  }

  // Get screen share duration
  getScreenShareDuration() {
    if (!this.isScreenSharing || !this.screenShareStartTime) {
      return 0;
    }
    return Date.now() - this.screenShareStartTime.getTime();
  }

  // Format screen share duration
  formatScreenShareDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  }

  // Set screen share options
  setScreenShareOptions(options) {
    this.screenShareOptions = {
      ...this.screenShareOptions,
      ...options
    };
  }

  // Show screen share confirmation dialog
  showScreenShareConfirmation(meetingId, onConfirm, onCancel) {
    Alert.alert(
      'Start Screen Sharing',
      'This will share your screen with all meeting participants. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: onCancel
        },
        {
          text: 'Start Sharing',
          style: 'default',
          onPress: () => {
            this.startScreenShare(meetingId)
              .then(() => onConfirm && onConfirm())
              .catch(error => {
                Alert.alert('Screen Share Error', error.message);
              });
          }
        }
      ]
    );
  }

  // Show stop screen share confirmation dialog
  showStopScreenShareConfirmation(meetingId, onConfirm, onCancel) {
    const duration = this.formatScreenShareDuration(this.getScreenShareDuration());
    
    Alert.alert(
      'Stop Screen Sharing',
      `Screen sharing duration: ${duration}\n\nStop sharing your screen?`,
      [
        {
          text: 'Continue Sharing',
          style: 'cancel',
          onPress: onCancel
        },
        {
          text: 'Stop Sharing',
          style: 'destructive',
          onPress: () => {
            this.stopScreenShare(meetingId)
              .then(() => onConfirm && onConfirm())
              .catch(error => {
                Alert.alert('Screen Share Error', error.message);
              });
          }
        }
      ]
    );
  }

  // Check if screen sharing is supported
  isScreenShareSupported() {
    if (Platform.OS === 'ios') {
      // iOS 12+ supports screen recording
      return Platform.Version >= 12;
    } else if (Platform.OS === 'android') {
      // Android 5.0+ supports screen capture
      return Platform.Version >= 21;
    }
    return false;
  }

  // Get screen share capabilities
  getScreenShareCapabilities() {
    return {
      supported: this.isScreenShareSupported(),
      includeAudio: true,
      includeVideo: true,
      qualityOptions: ['low', 'medium', 'high'],
      frameRateOptions: [15, 30, 60],
      platform: Platform.OS,
      version: Platform.Version
    };
  }

  // Add event listener
  on(event, callback) {
    if (!this.screenShareCallbacks.has(event)) {
      this.screenShareCallbacks.set(event, []);
    }
    this.screenShareCallbacks.get(event).push(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (!this.screenShareCallbacks.has(event)) return;
    
    const callbacks = this.screenShareCallbacks.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  // Emit event
  emit(event, data) {
    if (!this.screenShareCallbacks.has(event)) return;
    
    const callbacks = this.screenShareCallbacks.get(event);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in screen share event listener for ${event}:`, error);
      }
    });
  }

  // Cleanup
  cleanup() {
    this.isScreenSharing = false;
    this.screenShareStartTime = null;
    this.screenShareCallbacks.clear();
  }
}

// Export singleton instance
export default new MeetingScreenShareService();
