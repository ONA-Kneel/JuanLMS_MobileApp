# Popup Notification System

## Overview
The popup notification system provides prominent, in-app notifications for important events like new assignments, quizzes, announcements, and activities. Unlike the previous Toast notifications, these popups are more visible and provide better user interaction.

## Features

### Visual Design
- **Prominent Display**: Appears at the top of the screen with smooth animations
- **Type-Specific Icons**: Different icons and colors for each notification type:
  - 🔴 Assignment: Orange color with assignment icon
  - 🟢 Quiz: Green color with quiz icon  
  - 🔵 Announcement: Blue color with bullhorn icon
  - 🟣 Activity: Purple color with activity icon
- **Auto-Hide**: Automatically disappears after 5 seconds
- **Manual Dismiss**: Users can tap the X button to close immediately

### Interaction
- **Tap to Navigate**: Tapping the notification navigates to the relevant screen
- **Smart Routing**: Automatically routes to appropriate screens based on notification type
- **Non-Intrusive**: Doesn't block app functionality

## Implementation Details

### Components

#### 1. PopupNotification.js
- Main popup component with animations
- Handles different notification types
- Provides tap-to-navigate functionality

#### 2. NotificationContext.js (Modified)
- Added popup notification state management
- Enhanced foreground message handler
- Provides popup notification functions to the app

#### 3. App.js (Modified)
- Added global PopupNotificationWrapper
- Ensures popups appear across all screens

### Notification Types Supported
- `assignment`: New assignments posted
- `quiz`: New quizzes available
- `announcement`: Important announcements
- `activity`: New activities added

### Backend Integration
The system works with the existing notification infrastructure:
- Uses FCM (Firebase Cloud Messaging) for push notifications
- Leverages the existing notification watcher service
- Maintains compatibility with current notification system

## Usage

### For Developers
The popup notification system is automatically integrated and requires no additional setup. When notifications are sent from the backend with the appropriate type, popups will automatically appear.

### For Users
- Popups appear automatically when new content is posted
- Tap the popup to navigate to the relevant content
- Tap the X button to dismiss immediately
- Popups auto-hide after 5 seconds

## Testing
Use the `test-popup-notifications.js` file to verify the system works correctly with different notification types.

## Configuration
- Auto-hide duration: 5 seconds (configurable in PopupNotification.js)
- Animation duration: 300ms in, 200ms out
- Position: Top of screen with safe area consideration
- Z-index: 9999 to ensure visibility

## Fallback Behavior
- Non-critical notifications still use Toast messages
- System gracefully handles missing data
- Maintains existing notification functionality for unsupported types

