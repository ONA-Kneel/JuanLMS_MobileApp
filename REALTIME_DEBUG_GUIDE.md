# Real-Time Functionality Debug Guide

## Overview

This guide provides comprehensive debugging information for the real-time Socket.IO integration between the mobile app and web backend. The mobile app connects to the web backend at `https://juanlms-webapp-server.onrender.com` to receive real-time updates for announcements, assignments, quizzes, and lessons.

## Architecture

```
Web Backend (Socket.IO Server) ←→ Mobile Frontend (Socket.IO Client)
https://juanlms-webapp-server.onrender.com    React Native App
```

## Enhanced Error Handling Components

### 1. Socket Configuration (`frontend/config/socketConfig.js`)

**Features:**
- Enhanced logging utility with timestamps and structured logging
- Automatic fallback URL detection
- Comprehensive connection options
- Event definitions for consistency

**Key Functions:**
- `getSocketURL()` - Determines the correct socket URL with fallbacks
- `socketLog(level, component, message, data)` - Structured logging for debugging

**Debug Commands:**
```javascript
// Check current socket URL
console.log(getSocketURL());

// Test logging
socketLog('info', 'TEST', 'This is a test message', { test: true });
```

### 2. Class Socket Service (`frontend/services/classSocketService.js`)

**Enhanced Features:**
- Comprehensive connection monitoring
- Detailed error reporting for each event
- Connection state tracking
- Automatic reconnection with detailed logging

**Key Methods:**
- `initialize(userId)` - Initialize socket with enhanced error handling
- `joinClass(classId)` - Join class room with validation
- `leaveClass(classId)` - Leave class room with cleanup
- `isSocketConnected()` - Check connection status

**Debug Commands:**
```javascript
// Check connection status
console.log(classSocketService.isSocketConnected());

// Check current class
console.log(classSocketService.currentClassId);

// Manual socket test
classSocketService.socket?.emit('test', { message: 'Manual test' });
```

### 3. Student Module (`frontend/components/Students/StudentModule.js`)

**Enhanced Features:**
- Comprehensive socket initialization logging
- Detailed event handler error tracking
- Connection verification with timeout
- Proper cleanup on unmount

**Socket Events Handled:**
- `newAnnouncement` - Real-time announcement updates
- `announcementUpdated` - Announcement modifications
- `announcementDeleted` - Announcement removals
- `newAssignment` - New assignment notifications
- `newQuiz` - New quiz notifications
- `newLesson` - New lesson notifications

### 4. Student Activities (`frontend/components/Students/StudentActs.js`)

**Enhanced Features:**
- Activity-specific socket integration
- Automatic refresh on real-time updates
- Error handling for each activity type
- Connection status monitoring

**Socket Events Handled:**
- `newAssignment` - Refreshes activity list
- `assignmentUpdated` - Updates specific assignment
- `assignmentDeleted` - Removes assignment from list
- `newQuiz` - Refreshes activity list
- `quizUpdated` - Updates specific quiz
- `quizDeleted` - Removes quiz from list

### 5. Socket Debugger (`frontend/components/SocketDebugger.js`)

**Features:**
- Real-time log monitoring
- Connection status indicator
- Manual socket testing tools
- Event simulation capabilities
- Log export functionality

**Usage:**
1. Import and add to your navigation stack
2. Initialize socket connection
3. Join test classes
4. Send test messages
5. Monitor logs in real-time

## Debugging Workflow

### Step 1: Check Basic Connectivity

1. **Verify Socket URL:**
```javascript
import { getSocketURL } from '../config/socketConfig';
console.log('Socket URL:', getSocketURL());
```

2. **Check JWT Token:**
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
AsyncStorage.getItem('jwtToken').then(token => {
  console.log('JWT Token present:', !!token);
  console.log('Token length:', token?.length);
});
```

3. **Test Basic Connection:**
```javascript
import classSocketService from '../services/classSocketService';
classSocketService.initialize(user._id).then(socket => {
  console.log('Socket initialized:', !!socket);
  console.log('Socket connected:', socket?.connected);
});
```

### Step 2: Monitor Connection Events

**Look for these log patterns:**

✅ **Successful Connection:**
```
[INFO][CLASS_SOCKET_SERVICE] Connected to server successfully. Socket ID: abc123
[DEBUG][CLASS_SOCKET_SERVICE] Emitting addUser with userId: user123
[INFO][CLASS_SOCKET_SERVICE] Test response received from server
```

❌ **Connection Failures:**
```
[ERROR][CLASS_SOCKET_SERVICE] Connection error (attempt 1/5)
[ERROR][CLASS_SOCKET_SERVICE] No JWT token found in storage
[ERROR][CLASS_SOCKET_SERVICE] Failed to create socket instance
```

### Step 3: Test Class Room Functionality

1. **Join a Class:**
```javascript
classSocketService.joinClass('C883');
// Look for: [INFO][CLASS_SOCKET_SERVICE] Joining class: C883
```

2. **Monitor Class Events:**
```javascript
classSocketService.addEventListener('newAnnouncement', (data) => {
  console.log('Received announcement:', data);
});
```

### Step 4: Verify Real-Time Updates

1. **Create Test Content:** Use the web backend to create announcements/assignments
2. **Monitor Mobile Logs:** Check if events are received
3. **Verify UI Updates:** Ensure UI reflects the changes

## Common Issues and Solutions

### Issue 1: Socket Not Connecting

**Symptoms:**
- `Socket not connected` errors
- No real-time updates received
- Connection status shows "Disconnected"

**Debug Steps:**
1. Check internet connectivity
2. Verify JWT token exists and is valid
3. Check if backend server is running
4. Verify socket URL is correct

**Solution:**
```javascript
// Force reconnection
classSocketService.disconnect();
await classSocketService.initialize(user._id);
```

### Issue 2: Events Not Received

**Symptoms:**
- Socket connects but no events received
- UI doesn't update in real-time

**Debug Steps:**
1. Check if joined correct class room
2. Verify event listeners are properly set up
3. Check backend logs for event emission
4. Test with Socket Debugger component

**Solution:**
```javascript
// Re-join class room
classSocketService.leaveClass(classId);
classSocketService.joinClass(classId);

// Re-setup event listeners
classSocketService.addEventListener('newAnnouncement', handler);
```

### Issue 3: Authentication Errors

**Symptoms:**
- Connection rejected by server
- `401 Unauthorized` errors
- Frequent disconnections

**Debug Steps:**
1. Check JWT token validity
2. Verify user permissions
3. Check token format and structure

**Solution:**
```javascript
// Refresh token and reconnect
await AsyncStorage.removeItem('jwtToken');
// Re-login user to get fresh token
// Then reinitialize socket
```

### Issue 4: Memory Leaks

**Symptoms:**
- App performance degrades over time
- Multiple socket connections
- Event listeners not cleaned up

**Debug Steps:**
1. Check for proper cleanup in useEffect
2. Verify event listeners are removed
3. Monitor socket connection count

**Solution:**
```javascript
// Proper cleanup in useEffect
useEffect(() => {
  // Setup
  return () => {
    // Cleanup
    classSocketService.removeEventListener('newAnnouncement', handler);
    classSocketService.leaveClass(classId);
  };
}, []);
```

## Testing Checklist

### Pre-Flight Checks
- [ ] JWT token is present in AsyncStorage
- [ ] User object contains valid `_id`
- [ ] Internet connectivity is available
- [ ] Backend server is running and accessible

### Connection Tests
- [ ] Socket initializes without errors
- [ ] Connection status shows "Connected"
- [ ] Test response is received from server
- [ ] Socket ID is generated

### Class Room Tests
- [ ] Can join class successfully
- [ ] Can leave class successfully
- [ ] Class ID is tracked correctly
- [ ] Multiple class operations work

### Event Tests
- [ ] New announcement events are received
- [ ] Announcement updates are processed
- [ ] Announcement deletions are handled
- [ ] Assignment events work correctly
- [ ] Quiz events work correctly
- [ ] Lesson events work correctly

### UI Integration Tests
- [ ] StudentModule updates in real-time
- [ ] StudentActs refreshes automatically
- [ ] Error states are handled gracefully
- [ ] Loading states are shown appropriately

## Log Analysis

### Successful Flow Example:
```
[INFO][SOCKET_CONFIG] Using fallback socket URL: https://juanlms-webapp-server.onrender.com
[INFO][CLASS_SOCKET_SERVICE] Initializing Socket.IO connection for user: 64f5a1b2c3d4e5f6789012ab
[DEBUG][CLASS_SOCKET_SERVICE] JWT token found, creating socket connection...
[INFO][CLASS_SOCKET_SERVICE] Connected to server successfully. Socket ID: abc123def456
[DEBUG][CLASS_SOCKET_SERVICE] Emitting addUser with userId: 64f5a1b2c3d4e5f6789012ab
[INFO][CLASS_SOCKET_SERVICE] Test response received from server
[INFO][CLASS_SOCKET_SERVICE] Joining class: C883
[DEBUG][CLASS_SOCKET_SERVICE] Emitted joinClass event for class: C883
[INFO][CLASS_SOCKET_SERVICE] New announcement received
[INFO][StudentModule] New announcement received: { classID: 'C883', announcement: { title: 'Test' } }
```

### Error Flow Example:
```
[ERROR][CLASS_SOCKET_SERVICE] No JWT token found in storage
[ERROR][StudentModule] Socket initialization returned null - check connection and authentication
[WARN][StudentModule] Socket connection verification failed
```

## Performance Monitoring

### Key Metrics to Track:
- Connection establishment time
- Event processing latency
- Memory usage over time
- Battery impact
- Network usage

### Optimization Tips:
1. **Lazy Load Sockets:** Only initialize when needed
2. **Batch Updates:** Group multiple events together
3. **Debounce Refreshes:** Avoid excessive API calls
4. **Clean Up:** Always remove event listeners
5. **Connection Pooling:** Reuse existing connections

## Support and Troubleshooting

### Enable Verbose Logging:
```javascript
// In socketConfig.js, set debug level
const DEBUG_LEVEL = 'verbose'; // 'error', 'warn', 'info', 'debug', 'verbose'
```

### Export Logs for Analysis:
Use the Socket Debugger component to export logs for detailed analysis.

### Contact Information:
- For backend issues: Check web backend logs
- For mobile issues: Use React Native debugger
- For socket issues: Use Socket Debugger component

---

## Quick Reference

### Important Files:
- `frontend/config/socketConfig.js` - Socket configuration and logging
- `frontend/services/classSocketService.js` - Main socket service
- `frontend/components/SocketDebugger.js` - Debug utility
- `frontend/components/Students/StudentModule.js` - Class module integration
- `frontend/components/Students/StudentActs.js` - Activities integration

### Key Commands:
```javascript
// Check connection
classSocketService.isSocketConnected()

// Manual test
classSocketService.socket?.emit('test', { message: 'test' })

// Join class
classSocketService.joinClass('C883')

// Check logs
// Use SocketDebugger component for real-time monitoring
```

This comprehensive debug setup should help you identify and resolve any issues with the real-time functionality between your mobile app and web backend.

