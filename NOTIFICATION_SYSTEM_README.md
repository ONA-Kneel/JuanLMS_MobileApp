# Notification System Implementation

## Overview
This document describes the notification system implemented in the JuanLMS Mobile App, which provides real-time notifications across web and mobile platforms.

## Features Implemented

### 1. In-App Notifications
- **Toast Notifications**: Slide-in notifications that appear at the top of the screen
- **Notification Center**: Modal that displays all notifications grouped by type
- **Real-time Updates**: Instant notification delivery via Socket.io
- **Badge Counts**: Unread notification indicators on navigation tabs

### 2. Push Notifications (Mobile Only)
- **Expo Push Service**: Integration with Expo's push notification system
- **Background Notifications**: Notifications received when app is closed
- **Token Management**: Automatic push token storage and updates

### 3. Cross-Platform Sync
- **Unified Backend**: Same notification data for web and mobile
- **Real-time Updates**: Changes sync instantly across all platforms
- **Consistent UI**: Same notification experience everywhere

## Components Created

### 1. NotificationContext (`frontend/NotificationContext.js`)
- **State Management**: Global notification state and functions
- **API Integration**: Fetches notifications from web app backend
- **Socket.io**: Real-time notification updates
- **Push Token Management**: Handles Expo push token registration

### 2. NotificationCenter (`frontend/components/NotificationCenter.js`)
- **Modal Interface**: Full-screen notification viewer
- **Grouped Display**: Notifications organized by type
- **Actions**: Mark as read, mark all as read
- **Navigation**: Tap notifications to go to relevant screens

### 3. NotificationBadge (`frontend/components/NotificationBadge.js`)
- **Badge Display**: Shows unread count with red indicator
- **Icon States**: Different icons for read/unread states
- **Sizes**: Small, medium, and large badge variants

### 4. NotificationToast (`frontend/components/NotificationToast.js`)
- **In-App Alerts**: Animated toast notifications
- **Auto-hide**: Disappears after 5 seconds
- **Rich Content**: Shows notification type, title, message, and metadata

## How to Test

### 1. Start the Mobile App
```bash
cd frontend
npm run web
```
This opens the mobile app in your browser at `http://localhost:19006`

### 2. Test In-App Notifications
1. **Login to the app** as any user
2. **Navigate to Student Dashboard** (or any dashboard)
3. **Click "Test Notification" button** to see a toast notification
4. **Check the notification badge** on the bottom navigation
5. **Tap the notification bell** to open the notification center

### 3. Test Real-Time Updates
1. **Open web app** in another browser tab
2. **Create content** (announcement, assignment, etc.) as faculty
3. **Watch mobile app** for instant notification updates
4. **Check notification center** for new notifications

### 4. Test Cross-Platform Sync
1. **Mark notification as read** in mobile app
2. **Check web app** - should show as read
3. **Mark as read** in web app
4. **Check mobile app** - should show as read

## API Endpoints

### 1. Get Notifications
```
GET /notifications/:userId
Authorization: Bearer <token>
```

### 2. Mark as Read
```
PATCH /notifications/:notificationId/read
Authorization: Bearer <token>
```

### 3. Mark All as Read
```
PATCH /notifications/:userId/read-all
Authorization: Bearer <token>
```

### 4. Store Push Token
```
POST /users/:id/push-token
Authorization: Bearer <token>
Body: { expoPushToken: "string" }
```

## Socket.io Events

### 1. Client → Server
- `markNotificationRead`: Mark notification as read

### 2. Server → Client
- `newNotification`: New notification created
- `notificationRead`: Notification marked as read

## Configuration

### 1. Expo Project ID
Update the `projectId` in `NotificationContext.js`:
```javascript
const token = await Notifications.getExpoPushTokenAsync({
  projectId: 'your-expo-project-id', // Replace with your actual project ID
});
```

### 2. Backend URL
The system uses the web app backend at:
```
https://juanLMS-webapp-server.onrender.com
```

## Dependencies Added

### 1. New Packages
```bash
npm install expo-notifications expo-device
```

### 2. Existing Dependencies Used
- `socket.io-client`: Real-time communication
- `@react-native-async-storage/async-storage`: Local storage
- `react-native-vector-icons`: Icons

## File Structure

```
frontend/
├── NotificationContext.js          # Main notification logic
├── components/
│   ├── NotificationCenter.js       # Notification modal
│   ├── NotificationBadge.js        # Badge component
│   └── NotificationToast.js        # Toast notifications
└── App.js                          # Updated with providers

backend/
└── routes/
    └── userRoutes.js               # Added push token endpoint
```

## Troubleshooting

### 1. Notifications Not Appearing
- Check browser console for errors
- Verify backend API is accessible
- Check Socket.io connection status

### 2. Push Notifications Not Working
- Ensure `expo-notifications` is properly installed
- Check Expo project ID configuration
- Verify device permissions are granted

### 3. Real-time Updates Not Working
- Check Socket.io connection in browser dev tools
- Verify backend Socket.io server is running
- Check authentication token validity

## Next Steps

### 1. Production Deployment
- Set up proper Expo project ID
- Configure push notification certificates
- Test on physical devices

### 2. Advanced Features
- Notification preferences
- Sound and vibration settings
- Scheduled notifications
- Rich media notifications

### 3. Analytics
- Notification delivery tracking
- User engagement metrics
- Performance monitoring

## Support

For issues or questions about the notification system:
1. Check browser console for error messages
2. Verify all dependencies are installed
3. Test with the provided test button
4. Check backend API endpoints are accessible
