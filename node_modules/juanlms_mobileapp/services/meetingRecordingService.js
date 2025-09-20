import { Platform, Alert } from 'react-native';
import meetingSyncService from './meetingSyncService';

class MeetingRecordingService {
  constructor() {
    this.isRecording = false;
    this.recordingStartTime = null;
    this.recordingDuration = 0;
    this.recordingQuality = 'high'; // 'low', 'medium', 'high'
    this.recordingFormat = 'mp4'; // 'mp4', 'webm'
    this.recordingCallbacks = new Map();
  }

  // Start recording
  async startRecording(meetingId, options = {}) {
    try {
      if (this.isRecording) {
        throw new Error('Recording is already in progress');
      }

      const recordingOptions = {
        quality: options.quality || this.recordingQuality,
        format: options.format || this.recordingFormat,
        includeAudio: options.includeAudio !== false,
        includeVideo: options.includeVideo !== false,
        ...options
      };

      // Validate recording permissions
      await this.validateRecordingPermissions();

      // Start recording
      this.isRecording = true;
      this.recordingStartTime = new Date();
      this.recordingDuration = 0;

      // Notify sync service
      await meetingSyncService.notifyRecording(meetingId, true);

      // Emit recording started event
      this.emit('recording:started', {
        meetingId,
        options: recordingOptions,
        startTime: this.recordingStartTime
      });

      console.log('Recording started for meeting:', meetingId);
      return true;

    } catch (error) {
      console.error('Failed to start recording:', error);
      this.isRecording = false;
      this.recordingStartTime = null;
      throw error;
    }
  }

  // Stop recording
  async stopRecording(meetingId) {
    try {
      if (!this.isRecording) {
        throw new Error('No recording in progress');
      }

      const recordingData = {
        meetingId,
        duration: this.recordingDuration,
        startTime: this.recordingStartTime,
        endTime: new Date(),
        quality: this.recordingQuality,
        format: this.recordingFormat
      };

      // Stop recording
      this.isRecording = false;
      const endTime = new Date();
      this.recordingDuration = endTime - this.recordingStartTime;

      // Notify sync service
      await meetingSyncService.notifyRecording(meetingId, false);

      // Emit recording stopped event
      this.emit('recording:stopped', recordingData);

      console.log('Recording stopped for meeting:', meetingId);
      return recordingData;

    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }

  // Pause recording
  async pauseRecording(meetingId) {
    try {
      if (!this.isRecording) {
        throw new Error('No recording in progress');
      }

      // Pause recording logic would go here
      // This is a placeholder for future implementation

      this.emit('recording:paused', { meetingId });
      console.log('Recording paused for meeting:', meetingId);

    } catch (error) {
      console.error('Failed to pause recording:', error);
      throw error;
    }
  }

  // Resume recording
  async resumeRecording(meetingId) {
    try {
      if (!this.isRecording) {
        throw new Error('No recording in progress');
      }

      // Resume recording logic would go here
      // This is a placeholder for future implementation

      this.emit('recording:resumed', { meetingId });
      console.log('Recording resumed for meeting:', meetingId);

    } catch (error) {
      console.error('Failed to resume recording:', error);
      throw error;
    }
  }

  // Validate recording permissions
  async validateRecordingPermissions() {
    if (Platform.OS === 'android') {
      // Check for storage permissions
      const { PermissionsAndroid } = require('react-native');
      
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'This app needs access to storage to save recordings.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error('Storage permission is required for recording');
      }
    }
  }

  // Get recording status
  getRecordingStatus() {
    return {
      isRecording: this.isRecording,
      startTime: this.recordingStartTime,
      duration: this.recordingDuration,
      quality: this.recordingQuality,
      format: this.recordingFormat
    };
  }

  // Set recording quality
  setRecordingQuality(quality) {
    if (!['low', 'medium', 'high'].includes(quality)) {
      throw new Error('Invalid recording quality. Must be low, medium, or high');
    }
    this.recordingQuality = quality;
  }

  // Set recording format
  setRecordingFormat(format) {
    if (!['mp4', 'webm'].includes(format)) {
      throw new Error('Invalid recording format. Must be mp4 or webm');
    }
    this.recordingFormat = format;
  }

  // Get recording duration
  getRecordingDuration() {
    if (!this.isRecording || !this.recordingStartTime) {
      return 0;
    }
    return Date.now() - this.recordingStartTime.getTime();
  }

  // Format recording duration
  formatRecordingDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  }

  // Show recording confirmation dialog
  showRecordingConfirmation(meetingId, onConfirm, onCancel) {
    Alert.alert(
      'Start Recording',
      'This meeting will be recorded. All participants will be notified. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: onCancel
        },
        {
          text: 'Start Recording',
          style: 'default',
          onPress: () => {
            this.startRecording(meetingId)
              .then(() => onConfirm && onConfirm())
              .catch(error => {
                Alert.alert('Recording Error', error.message);
              });
          }
        }
      ]
    );
  }

  // Show stop recording confirmation dialog
  showStopRecordingConfirmation(meetingId, onConfirm, onCancel) {
    const duration = this.formatRecordingDuration(this.getRecordingDuration());
    
    Alert.alert(
      'Stop Recording',
      `Recording duration: ${duration}\n\nStop recording this meeting?`,
      [
        {
          text: 'Continue Recording',
          style: 'cancel',
          onPress: onCancel
        },
        {
          text: 'Stop Recording',
          style: 'destructive',
          onPress: () => {
            this.stopRecording(meetingId)
              .then(() => onConfirm && onConfirm())
              .catch(error => {
                Alert.alert('Recording Error', error.message);
              });
          }
        }
      ]
    );
  }

  // Add event listener
  on(event, callback) {
    if (!this.recordingCallbacks.has(event)) {
      this.recordingCallbacks.set(event, []);
    }
    this.recordingCallbacks.get(event).push(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (!this.recordingCallbacks.has(event)) return;
    
    const callbacks = this.recordingCallbacks.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  // Emit event
  emit(event, data) {
    if (!this.recordingCallbacks.has(event)) return;
    
    const callbacks = this.recordingCallbacks.get(event);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in recording event listener for ${event}:`, error);
      }
    });
  }

  // Cleanup
  cleanup() {
    this.isRecording = false;
    this.recordingStartTime = null;
    this.recordingDuration = 0;
    this.recordingCallbacks.clear();
  }
}

// Export singleton instance
export default new MeetingRecordingService();
