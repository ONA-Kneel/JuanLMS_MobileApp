# Enhanced Meeting System Integration

This document describes the comprehensive meeting system integration that provides seamless video calling between your mobile app and web application.

## 🚀 Features Implemented

### ✅ Core Meeting Features
- **Enhanced Stream Video Integration**: Full Stream Video SDK integration with custom UI components
- **Real-time Synchronization**: WebSocket-based real-time sync between mobile and web apps
- **Cross-platform Compatibility**: Works seamlessly on iOS, Android, and Web
- **Advanced Error Handling**: Comprehensive error recovery and user-friendly error messages
- **Platform-specific Optimizations**: iOS CallKit and Android-specific features

### ✅ Meeting Controls
- **Audio/Video Toggle**: Mute/unmute microphone and camera
- **Screen Sharing**: Share screen with meeting participants
- **Meeting Recording**: Record meetings (host only)
- **Participant Management**: View and manage meeting participants
- **Custom UI Components**: Beautiful, responsive meeting interface

### ✅ State Management
- **Global Meeting Context**: Centralized meeting state management
- **Real-time Updates**: Live participant updates and meeting status changes
- **Network Monitoring**: Automatic reconnection and offline handling
- **Permission Management**: Automatic permission requests and validation

### ✅ Synchronization with Web App
- **Unified Meeting Data**: Same meeting data structure across platforms
- **Real-time Events**: Live updates for participant joins/leaves, status changes
- **Cross-platform Chat**: Synchronized chat messages and reactions
- **Meeting Status Sync**: Live meeting status updates across platforms

## 📁 File Structure

```
frontend/
├── services/
│   ├── meetingService.js              # Core meeting service
│   ├── meetingApiService.js           # API service for meeting operations
│   ├── meetingSyncService.js          # Real-time synchronization service
│   ├── meetingErrorHandler.js         # Error handling and recovery
│   ├── platformMeetingService.js     # Platform-specific optimizations
│   ├── meetingRecordingService.js    # Recording functionality
│   └── meetingScreenShareService.js  # Screen sharing functionality
├── components/Meeting/
│   ├── EnhancedMeetingRoom.js        # Main enhanced meeting component
│   ├── CustomCallControls.js         # Custom meeting controls
│   ├── MeetingHeader.js              # Meeting header component
│   ├── ParticipantGrid.js            # Participant management
│   ├── MeetingSettings.js            # Meeting settings modal
│   └── ErrorBoundary.js              # Error boundary component
├── MeetingContext.js                  # Global meeting state management
└── components/Meeting/StreamMeetingRoomNative.js  # Updated legacy component
```

## 🔧 Integration Steps

### 1. Update Your App.js
```javascript
import { MeetingProvider } from './MeetingContext';

export default function App() {
  return (
    <MeetingProvider>
      {/* Your existing app components */}
    </MeetingProvider>
  );
}
```

### 2. Use Enhanced Meeting Component
```javascript
import StreamMeetingRoomNative from './components/Meeting/StreamMeetingRoomNative';

// In your meeting component
<StreamMeetingRoomNative
  isOpen={!!activeMeeting}
  onClose={() => setActiveMeeting(null)}
  onLeave={() => setActiveMeeting(null)}
  meetingData={activeMeeting}
  currentUser={{ name: user?.name || 'User' }}
  credentials={{
    apiKey: 'your-stream-api-key',
    token: 'your-stream-token',
    userId: 'user-id',
    callId: 'meeting-id',
  }}
  isHost={true}
  hostUserId={'host-user-id'}
  useEnhancedUI={true} // Enable enhanced UI
/>
```

### 3. Backend Integration
The system expects your backend to support the following endpoints:

```javascript
// Meeting endpoints
POST /api/meetings                    // Create meeting
GET /api/meetings/class/:classId      // Get class meetings
GET /api/meetings/direct-invite       // Get direct invite meetings
GET /api/meetings/invited             // Get invited meetings
POST /api/meetings/:id/join           // Join meeting
POST /api/meetings/:id/leave          // Leave meeting
DELETE /api/meetings/:id              // Delete meeting
PATCH /api/meetings/:id/status        // Update meeting status

// WebSocket events
meeting:created
meeting:updated
meeting:deleted
meeting:joined
meeting:left
meeting:status_changed
participant:joined
participant:left
participant:updated
chat:message
chat:reaction
screenshare:started
screenshare:stopped
recording:started
recording:stopped
```

## 🎯 Key Features Explained

### Real-time Synchronization
The system uses WebSocket connections to keep mobile and web apps in sync:
- Meeting status changes are broadcast to all connected clients
- Participant joins/leaves are synchronized in real-time
- Chat messages and reactions are shared across platforms
- Screen sharing and recording status are synchronized

### Error Handling and Recovery
Comprehensive error handling with automatic recovery:
- Network errors: Automatic reconnection with exponential backoff
- Permission errors: User-friendly prompts to grant permissions
- Authentication errors: Automatic re-authentication flow
- Stream errors: Graceful degradation and retry mechanisms

### Platform-specific Optimizations
- **iOS**: CallKit integration, background audio session management
- **Android**: Foreground service, keep-alive, notification management
- **Cross-platform**: Unified API with platform-specific implementations

### Meeting Controls
- **Audio Controls**: Mute/unmute, speaker/earpiece toggle
- **Video Controls**: Camera on/off, video quality settings
- **Screen Sharing**: Share screen with audio/video options
- **Recording**: Record meetings with quality and format options
- **Participant Management**: View participants, mute others (host)

## 🔄 Migration from Legacy System

The enhanced system is backward compatible with your existing implementation:

1. **Legacy Mode**: Set `useEnhancedUI={false}` to use the original UI
2. **Enhanced Mode**: Set `useEnhancedUI={true}` to use the new enhanced UI
3. **Gradual Migration**: You can migrate components one by one

## 📱 Usage Examples

### Basic Meeting Integration
```javascript
import { useMeeting } from './MeetingContext';

function MyMeetingComponent() {
  const {
    createOrJoinMeeting,
    leaveMeeting,
    toggleMicrophone,
    toggleCamera,
    isInMeeting,
    participants,
    error
  } = useMeeting();

  const handleJoinMeeting = async (meetingData) => {
    try {
      await createOrJoinMeeting(meetingData, true); // true = isHost
    } catch (error) {
      console.error('Failed to join meeting:', error);
    }
  };

  return (
    // Your meeting UI
  );
}
```

### Custom Meeting Controls
```javascript
import CustomCallControls from './components/Meeting/CustomCallControls';

<CustomCallControls
  isMuted={isMuted}
  isVideoOn={isVideoOn}
  isScreenSharing={isScreenSharing}
  isRecording={isRecording}
  isHost={isHost}
  onToggleMic={handleToggleMic}
  onToggleCamera={handleToggleCamera}
  onToggleScreenShare={handleToggleScreenShare}
  onStartRecording={handleStartRecording}
  onStopRecording={handleStopRecording}
  onLeave={handleLeave}
  onEndForAll={handleEndForAll}
/>
```

## 🛠️ Configuration

### Stream Video Configuration
Update your Stream Video credentials in `meetingService.js`:

```javascript
const STREAM_CONFIG = {
  apiKey: 'your-stream-api-key',
  // In production, fetch these from your backend
};
```

### WebSocket Configuration
Update the WebSocket URL in `meetingSyncService.js`:

```javascript
this.socket = io('your-backend-url', {
  auth: { token: token },
  transports: ['websocket', 'polling'],
});
```

## 🐛 Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure camera and microphone permissions are granted
2. **Network Errors**: Check internet connection and WebSocket connectivity
3. **Authentication Errors**: Verify Stream Video credentials and user tokens
4. **Platform Issues**: Check platform-specific requirements (iOS 12+, Android 5.0+)

### Debug Mode
Enable debug logging by setting `__DEV__ = true` in your app.

## 📈 Performance Considerations

- **Memory Management**: Automatic cleanup of meeting resources
- **Network Optimization**: Efficient WebSocket usage with reconnection
- **Battery Optimization**: Platform-specific power management
- **Bandwidth Management**: Adaptive quality based on connection

## 🔒 Security Considerations

- **Token Management**: Secure token storage and refresh
- **Permission Validation**: Proper permission checking before meeting operations
- **Data Encryption**: All meeting data is encrypted in transit
- **User Authentication**: Proper user authentication and authorization

## 🚀 Future Enhancements

- **AI-powered Features**: Noise cancellation, background blur
- **Advanced Analytics**: Meeting analytics and insights
- **Integration APIs**: Third-party service integrations
- **Custom Themes**: Customizable meeting UI themes

## 📞 Support

For issues or questions about the meeting system integration:
1. Check the troubleshooting section above
2. Review the error logs in the console
3. Verify your backend API endpoints are working
4. Test with the Stream Video dashboard

---

This enhanced meeting system provides a production-ready solution for video calling that works seamlessly between your mobile app and web application, with comprehensive error handling, real-time synchronization, and platform-specific optimizations.
