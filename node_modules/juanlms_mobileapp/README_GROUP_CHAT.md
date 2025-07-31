# Group Chat Implementation for JuanLMS Mobile App

This document describes the group chat functionality that has been implemented in the JuanLMS Mobile App, based on the web application's Faculty_Chats.jsx implementation.

## Features Implemented

### 1. Group Chat Models
- **GroupChat.js**: Model for group chat data including name, creator, participants, and join code
- **GroupMessage.js**: Model for group chat messages with sender info and group ID

### 2. Server-Side API Routes
- **groupChats.js**: Complete REST API for group chat operations:
  - `POST /api/group-chats` - Create new group
  - `GET /api/group-chats/user/:userId` - Get user's groups
  - `POST /api/group-chats/:joinCode/join` - Join group with code
  - `POST /api/group-chats/:groupId/leave` - Leave group
  - `POST /api/group-chats/:groupId/remove-member` - Remove member (creator only)
  - `GET /api/group-chats/:groupId/messages` - Get group messages
  - `POST /api/group-chats/:groupId/messages` - Send group message

### 3. Real-time Communication
- Socket.IO integration for real-time messaging
- Group-specific socket rooms for message broadcasting
- Support for both individual and group chat events

### 4. Mobile App Components

#### GroupChat.js
- Full group chat interface with message display
- Member management (view members, remove members for creators)
- Leave group functionality (with creator restrictions)
- Real-time message sending and receiving
- Group member list modal

#### GroupManagement.js
- Create new groups with member selection
- Join existing groups using join codes
- User search and selection interface
- Tab-based interface for create/join operations

#### Updated FacultyChats.js
- Integrated group chat display alongside individual chats
- Search functionality for both users and groups
- Group creation/management button
- Unified chat list with group indicators

### 5. Navigation Integration
- Added GroupChat and GroupManagement screens to navigation
- Seamless integration with existing chat system

## Key Features

### Group Creation
- Users can create groups with custom names
- Member selection from all available users
- Automatic join code generation
- Creator is automatically added as participant

### Group Joining
- Join groups using 6-character join codes
- Validation to prevent duplicate memberships
- Error handling for invalid codes

### Group Management
- **For All Members:**
  - View group members list
  - Leave group (except creator)
  - Real-time messaging

- **For Group Creator:**
  - Remove members from group
  - Cannot leave group (must transfer ownership first)
  - Full administrative control

### Real-time Messaging
- Instant message delivery via Socket.IO
- Message persistence in database
- Sender name display in group messages
- Timestamp tracking

### User Interface
- Clean, intuitive mobile interface
- Group indicators and member counts
- Search functionality for users and groups
- Modal-based member management

## Technical Implementation

### Database Schema
```javascript
// GroupChat Schema
{
  name: String,
  createdBy: String,
  participants: [String],
  joinCode: String,
  createdAt: Date,
  updatedAt: Date
}

// GroupMessage Schema
{
  senderId: String,
  groupId: String,
  message: String,
  fileUrl: String,
  senderName: String,
  timestamp: Date
}
```

### Socket Events
- `joinGroup`: Join group socket room
- `leaveGroup`: Leave group socket room
- `sendGroupMessage`: Send message to group
- `receiveGroupMessage`: Receive group message

### API Endpoints
All endpoints include proper error handling and validation:
- Input validation for required fields
- Authorization checks for group membership
- Creator-only operations protection
- Database transaction safety

## Usage Instructions

### For Faculty Users:
1. Navigate to Chats section
2. Tap "Groups" button to access group management
3. Create new groups or join existing ones
4. Select group from chat list to start messaging
5. Use member management features as needed

### For All Users:
1. Join groups using provided join codes
2. Participate in group discussions
3. Leave groups if no longer needed
4. View group member information

## Security Features
- Role-based access control
- Creator-only member removal
- Creator cannot leave group protection
- Input validation and sanitization
- Proper error handling and user feedback

## Future Enhancements
- File sharing in group chats
- Group message notifications
- Group admin transfer functionality
- Message editing and deletion
- Group chat search functionality
- Message reactions and replies

## Dependencies
- socket.io-client: Real-time communication
- axios: HTTP requests
- react-navigation: Screen navigation
- All existing JuanLMS dependencies

This implementation provides a complete group chat solution that matches the functionality of the web application while being optimized for mobile use. 