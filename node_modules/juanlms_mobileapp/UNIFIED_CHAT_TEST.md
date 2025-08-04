# UnifiedChat Component Test Guide

## Current Issues Fixed:
1. ✅ Changed "New Chat" button to "+" button in all chat components
2. ✅ Removed "Individual" tab from UnifiedChat component
3. ✅ Fixed asset path references (changed from `../assets/` to `../../assets/`)
4. ✅ Added loading states and better error handling
5. ✅ Added console logging for debugging

## Testing Steps:

### 1. Test the "+" Button
- Navigate to any chat section (Students, Faculty, Directors, Admin)
- Press the "+" button in the header
- Should navigate to UnifiedChat and show the group chat interface

### 2. Test Tab Navigation
- The UnifiedChat should show 3 tabs: Groups, Create, Join
- "Individual" tab should be removed
- Default tab should be "Groups"

### 3. Test Loading States
- When first loading UnifiedChat, should show "Loading..." message
- Should fetch users and groups in the background

### 4. Test Group Creation
- Go to "Create" tab
- Enter group name and description
- Select members
- Create group should work

### 5. Test Group Joining
- Go to "Join" tab
- Enter a valid group ID
- Should be able to join the group

### 6. Test Group Chat
- Click on any group in the "Groups" tab
- Should open the group chat interface
- Should be able to send messages

## Debug Information:
- Check console logs for debugging information
- Look for "UnifiedChat useEffect" messages
- Check for "Fetching users" and "Fetching user groups" messages
- Verify "Rendering chat list view" appears when no specific chat is selected

## Common Issues:
1. **Blank Page**: Usually caused by missing parameters or failed API calls
2. **Asset Errors**: Fixed by updating asset paths
3. **Navigation Issues**: Ensure UnifiedChat is properly registered in App.js

## Backend Requirements:
- Ensure backend server is running on localhost:5000
- Verify `/users` endpoint is working
- Verify `/api/group-chats/user/:userId` endpoint is working
- Check Socket.IO connection is established 