# Stream Video iOS SDK Integration

This document describes the integration of the Stream Video iOS SDK into the JuanLMS mobile application to provide native iOS video calling capabilities.

## Overview

The integration adds native iOS video calling support using the Stream Video iOS SDK alongside the existing React Native implementation. The app now uses:

- **iOS Native SDK**: For iOS devices using Swift and native iOS components
- **React Native SDK**: For Android devices and fallback scenarios
- **Web SDK**: For web platform

## Architecture

### Components Added

1. **iOS Native Module Bridge** (`StreamVideoBridge.swift`)
   - Bridges between React Native and native iOS Stream Video SDK
   - Handles call initialization, joining, leaving, and device controls

2. **React Native Wrapper** (`StreamMeetingRoomIOS.js`)
   - Provides React Native interface for iOS native video calls
   - Manages state and event handling

3. **Configuration** (`StreamVideoConfig.swift`)
   - Centralized configuration for Stream Video settings
   - Audio/video session management

### Integration Points

The following components have been updated to use the iOS native SDK:

- `FacultyMeeting.js` - Faculty meeting interface
- `PrincipalMeeting.js` - Principal meeting interface  
- `StudentMeeting.js` - Student meeting interface
- `VPEMeeting.js` - VPE meeting interface

## Setup Instructions

### 1. Install Dependencies

The iOS SDK is already added to the Podfile:

```ruby
pod 'StreamVideo', :path => '../../node_modules/@stream-io/video-react-native-sdk/ios'
```

### 2. Run Pod Install

```bash
cd frontend/ios
pod install
```

### 3. Build iOS Project

```bash
cd frontend
npx expo run:ios
```

## Features

### iOS Native Features

- **Native Video Rendering**: Uses iOS native video rendering for better performance
- **Hardware Acceleration**: Leverages iOS hardware acceleration for video processing
- **CallKit Integration**: Native iOS calling experience with CallKit support
- **Background Audio**: Continues audio during background app state
- **Picture-in-Picture**: Native iOS PiP support for video calls

### Device Controls

- **Microphone Toggle**: Enable/disable microphone
- **Camera Toggle**: Enable/disable camera
- **Speaker/Earpiece**: Audio routing control
- **Background Audio**: Continues audio when app is backgrounded

### Permissions

The following iOS permissions have been configured:

- **Camera**: `NSCameraUsageDescription` - For video calls and profile pictures
- **Microphone**: `NSMicrophoneUsageDescription` - For video calls and audio features
- **Photo Library**: `NSPhotoLibraryUsageDescription` - For sharing in video calls
- **Background Modes**: `audio`, `background-fetch`, `voip` - For background audio and VoIP

## Usage

### Automatic Platform Detection

The app automatically detects the platform and uses the appropriate SDK:

```javascript
// iOS devices use native SDK
if (Platform.OS === 'ios' && StreamMeetingRoomIOS) {
  // Use iOS native implementation
}

// Android devices use React Native SDK  
if (Platform.OS !== 'web' && Platform.OS !== 'ios' && SimpleStreamMeetingRoom) {
  // Use React Native implementation
}
```

### Meeting Room Component

The `StreamMeetingRoomIOS` component provides:

```javascript
<StreamMeetingRoomIOS
  isOpen={!!activeMeeting}
  onClose={() => setActiveMeeting(null)}
  onLeave={() => setActiveMeeting(null)}
  meetingData={activeMeeting}
  currentUser={{ name: user?.name || user?.username || 'Host' }}
  credentials={{
    apiKey: 'mmhfdzb5evj2',
    token: 'your-stream-token',
    userId: 'user-id',
    callId: 'call-id',
  }}
  isHost={true}
  hostUserId={'host-user-id'}
/>
```

## Configuration

### Stream Video Settings

The `StreamVideoConfig.swift` file contains:

- API key configuration
- Audio/video settings
- Call settings
- Audio session configuration

### Credentials

The app uses Stream Video credentials:

- **API Key**: `mmhfdzb5evj2`
- **Base URL**: `https://pronto.getstream.io`
- **Token**: JWT token for authentication
- **User ID**: Unique user identifier
- **Call ID**: Unique call identifier

## Troubleshooting

### Common Issues

1. **Module Not Found**
   - Ensure `pod install` was run successfully
   - Check that the iOS project builds without errors

2. **Permissions Denied**
   - Verify permissions are configured in `app.json`
   - Check iOS Settings > Privacy for the app

3. **Audio Issues**
   - Ensure audio session is properly configured
   - Check device audio settings

4. **Video Issues**
   - Verify camera permissions
   - Check device camera functionality

### Debug Mode

Enable debug logging by setting:

```swift
StreamVideo.shared.logger.level = .debug
```

## Performance Considerations

### iOS Native Benefits

- **Better Performance**: Native iOS rendering is more efficient
- **Lower Battery Usage**: Optimized for iOS hardware
- **Smoother UI**: Native iOS animations and transitions
- **Better Audio Quality**: Native iOS audio processing

### Memory Management

The iOS native module properly manages memory by:

- Cleaning up call instances on component unmount
- Releasing audio/video resources
- Handling background/foreground transitions

## Future Enhancements

### Planned Features

1. **CallKit Integration**: Native iOS calling interface
2. **Picture-in-Picture**: Native iOS PiP support
3. **Screen Sharing**: iOS screen sharing capabilities
4. **Recording**: Call recording functionality
5. **Live Streaming**: Live streaming support

### Customization

The native iOS implementation can be customized by:

- Modifying `StreamVideoConfig.swift` for settings
- Updating `StreamVideoBridge.swift` for functionality
- Customizing `StreamMeetingRoomIOS.js` for UI

## Support

For issues related to:

- **Stream Video SDK**: Check [Stream Video iOS Documentation](https://getstream.io/video/sdk/ios/)
- **React Native Integration**: Check React Native documentation
- **iOS Development**: Check Apple Developer documentation

## Testing

### Test Scenarios

1. **Join Meeting**: Test joining meetings from different user roles
2. **Device Controls**: Test microphone/camera toggles
3. **Background Audio**: Test audio continuation in background
4. **Network Changes**: Test behavior during network changes
5. **Permission Handling**: Test permission requests and denials

### Test Devices

Test on various iOS devices:

- iPhone (different screen sizes)
- iPad
- Different iOS versions (13.4+)
- Different network conditions
