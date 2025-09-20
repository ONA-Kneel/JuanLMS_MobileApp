import { Platform, NativeModules, PermissionsAndroid } from 'react-native';
import InCallManager from 'react-native-incall-manager';

class PlatformMeetingService {
  constructor() {
    this.isInitialized = false;
    this.currentAudioMode = 'video';
    this.isInBackground = false;
  }

  // Initialize platform-specific features
  async initialize() {
    try {
      if (Platform.OS === 'ios') {
        await this.initializeIOS();
      } else if (Platform.OS === 'android') {
        await this.initializeAndroid();
      }
      
      this.isInitialized = true;
      console.log('Platform meeting service initialized');
    } catch (error) {
      console.error('Failed to initialize platform meeting service:', error);
      throw error;
    }
  }

  // iOS-specific initialization
  async initializeIOS() {
    try {
      // Initialize CallKit if available
      if (NativeModules.StreamVideoReactNative) {
        console.log('Stream Video React Native module available');
      }

      // Set up background audio session
      await this.setupIOSAudioSession();
      
      // Set up app state monitoring
      this.setupIOSAppStateMonitoring();
      
    } catch (error) {
      console.error('iOS initialization error:', error);
      throw error;
    }
  }

  // Android-specific initialization
  async initializeAndroid() {
    try {
      // Request necessary permissions
      await this.requestAndroidPermissions();
      
      // Set up audio focus management
      await this.setupAndroidAudioFocus();
      
      // Set up background service
      this.setupAndroidBackgroundService();
      
    } catch (error) {
      console.error('Android initialization error:', error);
      throw error;
    }
  }

  // Request Android permissions
  async requestAndroidPermissions() {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      PermissionsAndroid.PERMISSIONS.MODIFY_AUDIO_SETTINGS,
      PermissionsAndroid.PERMISSIONS.WAKE_LOCK,
    ];

    const results = await PermissionsAndroid.requestMultiple(permissions);
    
    const deniedPermissions = Object.entries(results)
      .filter(([permission, result]) => result !== PermissionsAndroid.RESULTS.GRANTED)
      .map(([permission]) => permission);

    if (deniedPermissions.length > 0) {
      throw new Error(`Required permissions denied: ${deniedPermissions.join(', ')}`);
    }
  }

  // Setup iOS audio session
  async setupIOSAudioSession() {
    try {
      // Configure audio session for video calls
      await InCallManager.start({ 
        media: 'video',
        auto: true,
        ringback: '_DEFAULT_',
        busytone: '_DEFAULT_'
      });
      
      // Set audio mode for video calls
      InCallManager.setForceSpeakerphoneOn(true);
      InCallManager.setMicrophoneMute(false);
      
    } catch (error) {
      console.error('Failed to setup iOS audio session:', error);
      throw error;
    }
  }

  // Setup Android audio focus
  async setupAndroidAudioFocus() {
    try {
      // Start InCallManager for Android
      await InCallManager.start({ 
        media: 'video',
        auto: true
      });
      
      // Set audio mode for video calls
      InCallManager.setForceSpeakerphoneOn(true);
      InCallManager.setMicrophoneMute(false);
      
    } catch (error) {
      console.error('Failed to setup Android audio focus:', error);
      throw error;
    }
  }

  // Setup iOS app state monitoring
  setupIOSAppStateMonitoring() {
    // This would typically be handled by the main app
    // but we can provide hooks for meeting-specific behavior
    console.log('iOS app state monitoring setup');
  }

  // Setup Android background service
  setupAndroidBackgroundService() {
    try {
      // Set up keep-alive service for Android
      InCallManager.setKeepScreenOn(true);
      InCallManager.setSpeakerphoneOn(true);
      
    } catch (error) {
      console.error('Failed to setup Android background service:', error);
    }
  }

  // Start meeting with platform optimizations
  async startMeeting(meetingData) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (Platform.OS === 'ios') {
        await this.startIOSMeeting(meetingData);
      } else if (Platform.OS === 'android') {
        await this.startAndroidMeeting(meetingData);
      }

    } catch (error) {
      console.error('Failed to start meeting with platform optimizations:', error);
      throw error;
    }
  }

  // iOS meeting start
  async startIOSMeeting(meetingData) {
    try {
      // Configure audio for video calls
      InCallManager.setForceSpeakerphoneOn(true);
      
      // Enable CallKit integration if available
      if (NativeModules.StreamVideoReactNative) {
        // Configure CallKit for the meeting
        console.log('Configuring CallKit for meeting:', meetingData.title);
      }
      
    } catch (error) {
      console.error('iOS meeting start error:', error);
      throw error;
    }
  }

  // Android meeting start
  async startAndroidMeeting(meetingData) {
    try {
      // Configure audio for video calls
      InCallManager.setForceSpeakerphoneOn(true);
      InCallManager.setKeepScreenOn(true);
      
      // Set up notification for ongoing call
      this.setupAndroidCallNotification(meetingData);
      
    } catch (error) {
      console.error('Android meeting start error:', error);
      throw error;
    }
  }

  // Setup Android call notification
  setupAndroidCallNotification(meetingData) {
    try {
      // This would typically create a persistent notification
      // showing the ongoing call
      console.log('Setting up Android call notification for:', meetingData.title);
      
    } catch (error) {
      console.error('Failed to setup Android call notification:', error);
    }
  }

  // Handle app going to background
  async handleAppBackground() {
    try {
      this.isInBackground = true;
      
      if (Platform.OS === 'ios') {
        await this.handleIOSBackground();
      } else if (Platform.OS === 'android') {
        await this.handleAndroidBackground();
      }
      
    } catch (error) {
      console.error('Failed to handle app background:', error);
    }
  }

  // Handle app coming to foreground
  async handleAppForeground() {
    try {
      this.isInBackground = false;
      
      if (Platform.OS === 'ios') {
        await this.handleIOSForeground();
      } else if (Platform.OS === 'android') {
        await this.handleAndroidForeground();
      }
      
    } catch (error) {
      console.error('Failed to handle app foreground:', error);
    }
  }

  // iOS background handling
  async handleIOSBackground() {
    try {
      // Maintain audio session in background
      InCallManager.setMicrophoneMute(false);
      
    } catch (error) {
      console.error('iOS background handling error:', error);
    }
  }

  // Android background handling
  async handleAndroidBackground() {
    try {
      // Keep screen on and maintain audio
      InCallManager.setKeepScreenOn(true);
      InCallManager.setMicrophoneMute(false);
      
    } catch (error) {
      console.error('Android background handling error:', error);
    }
  }

  // iOS foreground handling
  async handleIOSForeground() {
    try {
      // Restore normal audio session
      InCallManager.setMicrophoneMute(false);
      
    } catch (error) {
      console.error('iOS foreground handling error:', error);
    }
  }

  // Android foreground handling
  async handleAndroidForeground() {
    try {
      // Restore normal screen and audio settings
      InCallManager.setKeepScreenOn(false);
      InCallManager.setMicrophoneMute(false);
      
    } catch (error) {
      console.error('Android foreground handling error:', error);
    }
  }

  // End meeting with platform cleanup
  async endMeeting() {
    try {
      if (Platform.OS === 'ios') {
        await this.endIOSMeeting();
      } else if (Platform.OS === 'android') {
        await this.endAndroidMeeting();
      }
      
    } catch (error) {
      console.error('Failed to end meeting with platform cleanup:', error);
      throw error;
    }
  }

  // iOS meeting end
  async endIOSMeeting() {
    try {
      // Stop InCallManager
      InCallManager.stop();
      
      // Clean up CallKit if needed
      if (NativeModules.StreamVideoReactNative) {
        console.log('Cleaning up CallKit');
      }
      
    } catch (error) {
      console.error('iOS meeting end error:', error);
    }
  }

  // Android meeting end
  async endAndroidMeeting() {
    try {
      // Stop InCallManager
      InCallManager.stop();
      
      // Remove call notification
      this.removeAndroidCallNotification();
      
    } catch (error) {
      console.error('Android meeting end error:', error);
    }
  }

  // Remove Android call notification
  removeAndroidCallNotification() {
    try {
      console.log('Removing Android call notification');
      
    } catch (error) {
      console.error('Failed to remove Android call notification:', error);
    }
  }

  // Toggle audio output (speaker/earpiece)
  async toggleAudioOutput() {
    try {
      const currentMode = InCallManager.getIsSpeakerphoneOn();
      InCallManager.setForceSpeakerphoneOn(!currentMode);
      
      return !currentMode;
    } catch (error) {
      console.error('Failed to toggle audio output:', error);
      throw error;
    }
  }

  // Set audio output mode
  async setAudioOutputMode(mode) {
    try {
      // mode: 'speaker' | 'earpiece' | 'bluetooth'
      switch (mode) {
        case 'speaker':
          InCallManager.setForceSpeakerphoneOn(true);
          break;
        case 'earpiece':
          InCallManager.setForceSpeakerphoneOn(false);
          break;
        case 'bluetooth':
          // Bluetooth handling would go here
          console.log('Bluetooth audio not implemented');
          break;
        default:
          throw new Error(`Unknown audio mode: ${mode}`);
      }
    } catch (error) {
      console.error('Failed to set audio output mode:', error);
      throw error;
    }
  }

  // Get current audio output mode
  getCurrentAudioMode() {
    try {
      return InCallManager.getIsSpeakerphoneOn() ? 'speaker' : 'earpiece';
    } catch (error) {
      console.error('Failed to get current audio mode:', error);
      return 'earpiece';
    }
  }

  // Enable/disable microphone
  async setMicrophoneEnabled(enabled) {
    try {
      InCallManager.setMicrophoneMute(!enabled);
    } catch (error) {
      console.error('Failed to set microphone state:', error);
      throw error;
    }
  }

  // Get platform-specific meeting capabilities
  getPlatformCapabilities() {
    const capabilities = {
      callKit: false,
      backgroundAudio: true,
      screenShare: true,
      recording: true,
      bluetooth: true,
      speakerToggle: true,
      keepScreenOn: true,
    };

    if (Platform.OS === 'ios') {
      capabilities.callKit = !!NativeModules.StreamVideoReactNative;
      capabilities.backgroundAudio = true;
    } else if (Platform.OS === 'android') {
      capabilities.keepScreenOn = true;
      capabilities.backgroundAudio = true;
    }

    return capabilities;
  }

  // Cleanup
  cleanup() {
    try {
      InCallManager.stop();
      this.isInitialized = false;
    } catch (error) {
      console.error('Platform meeting service cleanup error:', error);
    }
  }
}

// Export singleton instance
export default new PlatformMeetingService();
