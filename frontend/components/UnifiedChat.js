import React, { useEffect, useState, useRef } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Alert,
  Modal,
  FlatList
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useUser } from './UserContext';
import io from 'socket.io-client';
import axios from 'axios';
import AdminChatStyle from './styles/administrator/AdminChatStyle';

const SOCKET_URL = 'https://juanlms-webapp-server.onrender.com';
const ALLOWED_ROLES = ['students', 'director', 'admin', 'faculty'];

export default function UnifiedChat() {
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedUser, selectedGroup, setRecentChats } = route.params || {};
  const { user, setUser } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [joinGroupId, setJoinGroupId] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('groups'); // 'groups', 'create', 'join'
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef(null);
  const scrollViewRef = useRef();

  const isGroupChat = !!selectedGroup;
  const chatTarget = isGroupChat ? selectedGroup : selectedUser;

  useEffect(() => {
    if (!user || !user._id) {
      console.log('No user found, going back');
      navigation.goBack();
      return;
    }

    console.log('UnifiedChat useEffect - selectedUser:', selectedUser, 'selectedGroup:', selectedGroup);

    // If no specific chat is selected, show the chat list
    if (!selectedUser && !selectedGroup) {
      console.log('No specific chat selected, fetching users and groups');
      setIsLoading(true);
      Promise.all([fetchUsers(), fetchUserGroups()]).finally(() => {
        setIsLoading(false);
      });
      return;
    }

    // Validate that we have a valid selectedUser for individual chat
    if (selectedUser && (!selectedUser._id || !selectedUser.firstname)) {
      console.log('Invalid selectedUser, going back');
      navigation.goBack();
      return;
    }

    // Validate that we have a valid selectedGroup for group chat
    if (selectedGroup && (!selectedGroup._id || !selectedGroup.name)) {
      console.log('Invalid selectedGroup, going back');
      navigation.goBack();
      return;
    }

    // Validate if both users have allowed roles for individual chat
    if (selectedUser && !ALLOWED_ROLES.includes(user.role.toLowerCase()) || !ALLOWED_ROLES.includes(selectedUser.role.toLowerCase())) {
      Alert.alert(
        "Access Denied",
        "You cannot chat with this user due to role restrictions.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      return;
    }

    console.log('Current user:', user);
    console.log('Chat target:', chatTarget);

    if (isGroupChat) {
      // Fetch group messages
      axios.get(`${SOCKET_URL}/api/group-chats/${selectedGroup._id}/messages?userId=${user._id}`)
        .then(res => setMessages(res.data))
        .catch((err) => {
          console.log('Error fetching group messages:', err);
          setMessages([]);
        });

      // Fetch group members
      fetchGroupMembers();
    } else {
      // Fetch individual messages
      axios.get(`${SOCKET_URL}/api/messages/${user._id}/${selectedUser._id}`)
        .then(res => setMessages(res.data))
        .catch((err) => {
          console.log('Error fetching messages:', err);
          setMessages([]);
        });

             // Mark messages as read
       axios.put(`${SOCKET_URL}/api/messages/read/${user._id}/${selectedUser._id}`)
         .then(() => {
           if (setRecentChats && typeof setRecentChats === 'function') {
             setRecentChats(prev => {
               const updated = prev.map(chat =>
                 chat.partnerId === selectedUser._id
                   ? { ...chat, unreadCount: 0 }
                   : chat
               );
               return updated.sort((a, b) =>
                 new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
               );
             });
           }
         })
         .catch(err => console.log('Error marking messages as read:', err));
    }

    // Setup socket connection
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL);
    }

    if (isGroupChat) {
      socketRef.current.emit('joinGroup', { userId: user._id, groupId: selectedGroup._id });
      socketRef.current.on('receiveGroupMessage', (msg) => {
        setMessages(prev => [...prev, msg]);
      });
    } else {
      socketRef.current.emit('joinChat', [user._id, selectedUser._id].sort().join('-'));
      socketRef.current.on('receiveMessage', (msg) => {
        setMessages(prev => [...prev, msg]);
      });
    }

    return () => {
      if (socketRef.current) {
        if (isGroupChat) {
          socketRef.current.off('receiveGroupMessage');
        } else {
          socketRef.current.off('receiveMessage');
        }
      }
    };
  }, [selectedUser, selectedGroup, user]);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users from:', `${SOCKET_URL}/users`);
      const response = await axios.get(`${SOCKET_URL}/users`);
      console.log('Users response:', response.data);
      const filteredUsers = response.data.filter(u => 
        u._id !== user._id && 
        ALLOWED_ROLES.includes(u.role.toLowerCase())
      );
      console.log('Filtered users:', filteredUsers);
      setAllUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setAllUsers([]);
    }
  };

  const fetchUserGroups = async () => {
    try {
      console.log('Fetching user groups from:', `${SOCKET_URL}/api/group-chats/user/${user._id}`);
      const response = await axios.get(`${SOCKET_URL}/api/group-chats/user/${user._id}`);
      console.log('User groups response:', response.data);
      setUserGroups(response.data);
    } catch (error) {
      console.error('Error fetching user groups:', error);
      setUserGroups([]);
    }
  };



  const fetchGroupMembers = async () => {
    if (!selectedGroup) return;
    
    try {
      const memberPromises = selectedGroup.participants.map(async (participantId) => {
        const response = await axios.get(`${SOCKET_URL}/users/${participantId}`);
        return response.data;
      });
      const members = await Promise.all(memberPromises);
      setGroupMembers(members);
    } catch (error) {
      console.error('Error fetching group members:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !chatTarget) return;
    
    if (isGroupChat) {
      // Send group message
      const msg = {
        senderId: user._id,
        groupId: selectedGroup._id,
        message: input,
        senderName: `${user.firstname} ${user.lastname}`,
        timestamp: new Date(),
      };

      // Emit to socket for real-time
      socketRef.current.emit('sendGroupMessage', msg);

      // Save to database
      try {
        await axios.post(`${SOCKET_URL}/api/group-chats/${selectedGroup._id}/messages`, {
          senderId: user._id,
          message: input,
        });
      } catch (err) {
        console.log('Error saving group message:', err);
        Alert.alert("Error", "Failed to send message. Please try again.");
        return;
      }

      // Add to local state for instant UI feedback
      setMessages(prev => [...prev, msg]);
    } else {
      // Send individual message
      if (!ALLOWED_ROLES.includes(user.role.toLowerCase()) || !ALLOWED_ROLES.includes(selectedUser.role.toLowerCase())) {
        Alert.alert("Error", "You cannot send messages to this user due to role restrictions.");
        return;
      }

      const msg = {
        chatId: [user._id, selectedUser._id].sort().join('-'),
        senderId: user._id,
        receiverId: selectedUser._id,
        message: input,
        timestamp: new Date(),
      };

      // Emit to socket for real-time
      socketRef.current.emit('sendMessage', msg);

      // Save to database
      try {
        await axios.post(`${SOCKET_URL}/api/messages`, {
          senderId: user._id,
          receiverId: selectedUser._id,
          message: input,
          timestamp: msg.timestamp,
        });
      } catch (err) {
        console.log('Error saving message:', err);
        Alert.alert("Error", "Failed to send message. Please try again.");
        return;
      }

      // Add to local state for instant UI feedback
      setMessages(prev => [...prev, msg]);

             // Update unread count in recentChats and move to top
       if (setRecentChats && typeof setRecentChats === 'function') {
         setRecentChats(prev => {
           let found = false;
           const updated = prev.map(chat => {
             if (chat.partnerId === selectedUser._id) {
               found = true;
               return { ...chat, unreadCount: 0, lastMessage: msg };
             }
             return chat;
           });
           // If not found, add new chat entry
           if (!found) {
             updated.push({ partnerId: selectedUser._id, lastMessage: msg, unreadCount: 0 });
           }
           // Sort by most recent lastMessage
           return updated.sort((a, b) =>
             new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
           );
         });
       }
    }

    setInput('');
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedParticipants.length === 0) {
      Alert.alert('Error', 'Please enter a group name and select at least one member.');
      return;
    }

    try {
      const response = await axios.post(`${SOCKET_URL}/api/group-chats`, {
        name: groupName.trim(),
        description: groupDescription.trim(),
        createdBy: user._id,
        participants: selectedParticipants
      });

      Alert.alert('Success', 'Group chat created!', [
        { text: 'OK', onPress: () => {
          setShowCreateGroupModal(false);
          setGroupName('');
          setGroupDescription('');
          setSelectedParticipants([]);
          // Navigate back to chat home page to refresh the list
          navigation.goBack();
        }}
      ]);
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    }
  };

  const handleJoinGroup = async () => {
    if (!joinGroupId.trim()) {
      Alert.alert('Error', 'Please enter a group ID.');
      return;
    }

    try {
      await axios.post(`${SOCKET_URL}/api/group-chats/${joinGroupId}/join`, {
        userId: user._id
      });

      Alert.alert('Success', 'Successfully joined the group!', [
        { text: 'OK', onPress: () => {
          setShowJoinGroupModal(false);
          setJoinGroupId('');
          // Navigate back to chat home page to refresh the list
          navigation.goBack();
        }}
      ]);
    } catch (error) {
      console.error('Error joining group:', error);
      if (error.response?.status === 404) {
        Alert.alert('Error', 'Group not found. Please check the group ID.');
      } else if (error.response?.status === 400) {
        Alert.alert('Error', 'You are already a member of this group.');
      } else {
        Alert.alert('Error', 'Failed to join group. Please try again.');
      }
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await axios.post(`${SOCKET_URL}/api/group-chats/${selectedGroup._id}/leave`, {
        userId: user._id,
      });

      // Leave the group in socket
      socketRef.current?.emit('leaveGroup', { userId: user._id, groupId: selectedGroup._id });
      
      Alert.alert("Success", "You have left the group", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('creator')) {
        Alert.alert("Cannot Leave", "Group creator cannot leave the group.");
      } else {
        Alert.alert("Error", "Failed to leave group. Please try again.");
      }
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await axios.post(`${SOCKET_URL}/api/group-chats/${selectedGroup._id}/remove-member`, {
        userId: user._id,
        memberId: memberId,
      });

      // Refresh group members
      fetchGroupMembers();
      Alert.alert("Success", "Member removed from group");
    } catch (error) {
      Alert.alert("Error", "Failed to remove member. Please try again.");
    }
  };

  const toggleParticipantSelection = (userId) => {
    setSelectedParticipants(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Sort messages by timestamp
  const safeMessages = Array.isArray(messages)
    ? [...messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    : [];

  if (!user || !user._id) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading chat...</Text>
      </View>
    );
  }

  // If no specific chat is selected, show the chat list
  if (!selectedUser && !selectedGroup) {
    console.log('Rendering chat list view');
    return (
      <View style={{ flex: 1, backgroundColor: '#f3f3f3' }}>
        {/* Blue Header */}
        <View style={AdminChatStyle.blueHeaderBackground}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 40, paddingHorizontal: 16 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
              <Text style={{ fontSize: 22, color: '#fff' }}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Chats</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={{ flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16 }}>
          <TouchableOpacity 
            onPress={() => setActiveTab('groups')}
            style={{ 
              paddingVertical: 12, 
              paddingHorizontal: 16, 
              borderBottomWidth: 2, 
              borderBottomColor: activeTab === 'groups' ? '#00418b' : 'transparent'
            }}
          >
            <Text style={{ color: activeTab === 'groups' ? '#00418b' : '#666', fontWeight: 'bold' }}>Groups</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('create')}
            style={{ 
              paddingVertical: 12, 
              paddingHorizontal: 16, 
              borderBottomWidth: 2, 
              borderBottomColor: activeTab === 'create' ? '#00418b' : 'transparent'
            }}
          >
            <Text style={{ color: activeTab === 'create' ? '#00418b' : '#666', fontWeight: 'bold' }}>Create</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('join')}
            style={{ 
              paddingVertical: 12, 
              paddingHorizontal: 16, 
              borderBottomWidth: 2, 
              borderBottomColor: activeTab === 'join' ? '#00418b' : 'transparent'
            }}
          >
            <Text style={{ color: activeTab === 'join' ? '#00418b' : '#666', fontWeight: 'bold' }}>Join</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1, padding: 16 }}>
          {isLoading && (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 }}>
              <Text>Loading...</Text>
            </View>
          )}
          {!isLoading && activeTab === 'groups' && (
            <View>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Your Groups</Text>
              {userGroups.map(group => (
                                 <TouchableOpacity
                   key={group._id}
                   onPress={() => navigation.navigate('UnifiedChat', { selectedGroup: group, setRecentChats: setRecentChats || null })}
                  style={{ 
                    backgroundColor: 'white', 
                    padding: 15, 
                    borderRadius: 10, 
                    marginBottom: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    elevation: 2,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.2,
                    shadowRadius: 2,
                  }}>
                  <View style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 20, 
                    backgroundColor: '#00418b', 
                    marginRight: 12,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                      {group.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{group.name}</Text>
                    <Text style={{ color: '#666', fontSize: 12 }}>{group.participants.length} members</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!isLoading && activeTab === 'create' && (
            <View>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Create New Group</Text>
              <TextInput
                placeholder="Group Name"
                value={groupName}
                onChangeText={setGroupName}
                style={{ 
                  borderWidth: 1, 
                  borderColor: '#ccc', 
                  borderRadius: 5, 
                  padding: 10, 
                  marginBottom: 10,
                  backgroundColor: 'white'
                }}
              />
              <TextInput
                placeholder="Group Description (optional)"
                value={groupDescription}
                onChangeText={setGroupDescription}
                multiline
                style={{ 
                  borderWidth: 1, 
                  borderColor: '#ccc', 
                  borderRadius: 5, 
                  padding: 10, 
                  marginBottom: 10,
                  backgroundColor: 'white',
                  height: 80
                }}
              />
              <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>Select Members:</Text>
              {allUsers.map(u => (
                <TouchableOpacity
                  key={u._id}
                  onPress={() => toggleParticipantSelection(u._id)}
                  style={{ 
                    backgroundColor: selectedParticipants.includes(u._id) ? '#e8f4fd' : 'white', 
                    padding: 15, 
                    borderRadius: 10, 
                    marginBottom: 5,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: selectedParticipants.includes(u._id) ? '#00418b' : '#eee'
                  }}>
                                          <Image
                          source={u.profilePicture ? { uri: u.profilePicture } : require('../assets/profile-icon (2).png')}
                          style={{ width: 30, height: 30, borderRadius: 15, marginRight: 10 }}
                          resizeMode="cover"
                        />
                  <Text style={{ flex: 1 }}>{u.firstname} {u.lastname}</Text>
                  {selectedParticipants.includes(u._id) && (
                    <Text style={{ color: '#00418b', fontWeight: 'bold' }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={handleCreateGroup}
                style={{ 
                  backgroundColor: '#00418b', 
                  padding: 15, 
                  borderRadius: 10, 
                  marginTop: 10,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Create Group</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isLoading && activeTab === 'join' && (
            <View>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Join Group</Text>
              <TextInput
                placeholder="Enter Group ID"
                value={joinGroupId}
                onChangeText={setJoinGroupId}
                style={{ 
                  borderWidth: 1, 
                  borderColor: '#ccc', 
                  borderRadius: 5, 
                  padding: 10, 
                  marginBottom: 10,
                  backgroundColor: 'white'
                }}
              />
              <TouchableOpacity
                onPress={handleJoinGroup}
                style={{ 
                  backgroundColor: '#00418b', 
                  padding: 15, 
                  borderRadius: 10,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Join Group</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  const isCreator = selectedGroup && selectedGroup.createdBy === user._id;

  // Ensure we have a valid chat target
  if (!chatTarget) {
    console.log('No chat target found, going back');
    navigation.goBack();
    return null;
  }

  console.log('Rendering chat interface for:', chatTarget);

  return (
    <View style={{ flex: 1, backgroundColor: '#f3f3f3' }}>
      {/* Blue Header */}
      <View style={AdminChatStyle.blueHeaderBackground}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 40, paddingHorizontal: 16 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 22, color: '#fff' }}>{'<'}</Text>
          </TouchableOpacity>
          {isGroupChat ? (
            <>
              <View style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 20, 
                backgroundColor: '#fff', 
                marginRight: 12,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#00418b' }}>
                  {selectedGroup.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
                  {selectedGroup.name}
                </Text>
                <Text style={{ color: '#e0e0e0', fontSize: 12 }}>
                  {groupMembers.length} members
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowMembersModal(true)}
                style={{ marginRight: 8 }}
              >
                <Text style={{ color: '#fff', fontSize: 16 }}>👥</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowLeaveModal(true)}>
                <Text style={{ color: '#fff', fontSize: 16 }}>❌</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
                                                <Image
                  source={selectedUser.profilePicture ? { uri: selectedUser.profilePicture } : require('../assets/profile-icon (2).png')}
                  style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12, borderWidth: 2, borderColor: '#fff' }}
                />
              <View>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{selectedUser.firstname} {selectedUser.lastname}</Text>
                <Text style={{ color: '#e0e0e0', fontSize: 12 }}>{selectedUser.role}</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
        style={{ flex: 1, paddingHorizontal: 10, marginTop: 10 }}
      >
        {safeMessages.map((msg, idx) => {
          const isMe = String(msg.senderId) === String(user._id);
          
          if (isGroupChat) {
            const sender = groupMembers.find(member => member._id === msg.senderId);
            return (
              <View
                key={idx}
                style={{
                  flexDirection: 'row',
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                  marginVertical: 4,
                }}
              >
                {!isMe && (
                  <Image
                    source={sender?.profilePicture ? { uri: sender.profilePicture } : require('../assets/profile-icon (2).png')}
                    style={{ width: 28, height: 28, borderRadius: 14, marginRight: 6, alignSelf: 'flex-end' }}
                  />
                )}
                <View
                  style={{
                    backgroundColor: isMe ? '#00418b' : '#e5e5ea',
                    borderRadius: 18,
                    padding: 12,
                    maxWidth: '75%',
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    shadowColor: '#000',
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    marginLeft: isMe ? 40 : 0,
                    marginRight: isMe ? 0 : 4,
                  }}
                >
                  {!isMe && (
                    <Text style={{ color: isMe ? '#fff' : '#222', fontWeight: '500', marginBottom: 2, fontSize: 12 }}>
                      {msg.senderName || sender?.firstname || 'Unknown'}
                    </Text>
                  )}
                  <Text style={{ color: isMe ? '#fff' : '#222' }}>{msg.message}</Text>
                  <Text style={{ color: isMe ? '#d1eaff' : '#888', fontSize: 10, alignSelf: 'flex-end', marginTop: 4 }}>
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                  </Text>
                </View>
              </View>
            );
          } else {
            return (
              <View
                key={idx}
                style={{
                  flexDirection: 'row',
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                  marginVertical: 4,
                }}
              >
                {!isMe && (
                  <Image
                    source={selectedUser.profilePicture ? { uri: selectedUser.profilePicture } : require('../assets/profile-icon (2).png')}
                    style={{ width: 28, height: 28, borderRadius: 14, marginRight: 6, alignSelf: 'flex-end' }}
                  />
                )}
                <View
                  style={{
                    backgroundColor: isMe ? '#00418b' : '#e5e5ea',
                    borderRadius: 18,
                    padding: 12,
                    maxWidth: '75%',
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    shadowColor: '#000',
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    marginLeft: isMe ? 40 : 0,
                    marginRight: isMe ? 0 : 4,
                  }}
                >
                  <Text style={{ color: isMe ? '#fff' : '#222', fontWeight: '500', marginBottom: 2 }}>
                    {isMe ? 'You' : selectedUser.firstname}
                  </Text>
                  <Text style={{ color: isMe ? '#fff' : '#222' }}>{msg.message}</Text>
                  <Text style={{ color: isMe ? '#d1eaff' : '#888', fontSize: 10, alignSelf: 'flex-end', marginTop: 4 }}>
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                  </Text>
                </View>
              </View>
            );
          }
        })}
      </ScrollView>

      {/* Input */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderTopWidth: 1,
        borderColor: '#eee',
        backgroundColor: '#fff',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
      }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 20,
            paddingHorizontal: 15,
            paddingVertical: 10,
            marginRight: 8,
            backgroundColor: '#f9f9f9',
            fontSize: 15,
          }}
        />
        <TouchableOpacity onPress={handleSend} style={{
          backgroundColor: '#00418b',
          borderRadius: 20,
          padding: 12,
        }}>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>➤</Text>
        </TouchableOpacity>
      </View>

      {/* Group Members Modal */}
      {isGroupChat && (
        <Modal
          visible={showMembersModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowMembersModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: 'white', borderRadius: 10, padding: 20, width: '90%', maxHeight: '80%' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Group Members</Text>
              <FlatList
                data={groupMembers}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                          <Image
                      source={item.profilePicture ? { uri: item.profilePicture } : require('../assets/profile-icon (2).png')}
                      style={{ width: 30, height: 30, borderRadius: 15, marginRight: 10 }}
                    />
                      <Text>{item.firstname} {item.lastname}</Text>
                      {item._id === selectedGroup.createdBy && (
                        <Text style={{ color: '#00418b', fontSize: 12, marginLeft: 5 }}>(Creator)</Text>
                      )}
                    </View>
                    {isCreator && item._id !== user._id && (
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert(
                            "Remove Member",
                            `Are you sure you want to remove ${item.firstname} ${item.lastname}?`,
                            [
                              { text: "Cancel", style: "cancel" },
                              { text: "Remove", style: "destructive", onPress: () => handleRemoveMember(item._id) }
                            ]
                          );
                        }}
                        style={{ backgroundColor: '#ff4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 }}
                      >
                        <Text style={{ color: 'white', fontSize: 12 }}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              />
              <TouchableOpacity
                onPress={() => setShowMembersModal(false)}
                style={{ backgroundColor: '#00418b', padding: 10, borderRadius: 5, marginTop: 15 }}
              >
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Leave Group Modal */}
      {isGroupChat && (
        <Modal
          visible={showLeaveModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowLeaveModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: 'white', borderRadius: 10, padding: 20, width: '90%' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Leave Group</Text>
              <Text style={{ marginBottom: 20 }}>
                Are you sure you want to leave "{selectedGroup.name}"? You will no longer be able to send or receive messages in this group.
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity
                  onPress={() => setShowLeaveModal(false)}
                  style={{ backgroundColor: '#ccc', padding: 10, borderRadius: 5, flex: 1, marginRight: 10 }}
                >
                  <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleLeaveGroup}
                  style={{ backgroundColor: '#ff4444', padding: 10, borderRadius: 5, flex: 1, marginLeft: 10 }}
                >
                  <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Leave Group</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
} 