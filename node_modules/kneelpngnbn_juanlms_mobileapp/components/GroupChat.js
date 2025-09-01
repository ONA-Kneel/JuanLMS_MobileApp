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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthHeaders, handleApiError } from '../utils/apiUtils';

const SOCKET_URL = 'https://juanlms-webapp-server.onrender.com';

export default function GroupChat() {
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedGroup, setRecentChats } = route.params;
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const socketRef = useRef(null);
  const scrollViewRef = useRef();

  useEffect(() => {
    if (!selectedGroup || !user) {
      navigation.goBack();
      return;
    }

    console.log('Current user:', user);
    console.log('Selected group:', selectedGroup);

    (async () => {
      const token = await AsyncStorage.getItem('jwtToken');
      const headers = await getAuthHeaders(token);
      try {
        const response = await axios.get(`${SOCKET_URL}/api/group-chats/${selectedGroup._id}/messages?userId=${user._id}`, {
          headers
        });
        if (response.data) {
          setMessages(response.data);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        const errorMessage = handleApiError(error, 'Failed to fetch messages');
        Alert.alert('Error', errorMessage);
      }
      fetchGroupMembers(token);
    })();

    // Setup socket connection
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL);
    }
    
    socketRef.current.emit('joinGroup', { userId: user._id, groupId: selectedGroup._id });
    socketRef.current.on('receiveGroupMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off('receiveGroupMessage');
      }
    };
  }, [selectedGroup, user]);

  const fetchGroupMembers = async (token) => {
    try {
      const headers = await getAuthHeaders(token);
      const memberPromises = selectedGroup.participants.map(async (participantId) => {
        const response = await axios.get(`${SOCKET_URL}/users/${participantId}`, {
          headers
        });
        return response.data;
      });
      const members = await Promise.all(memberPromises);
      setGroupMembers(members);
    } catch (error) {
      console.error('Error fetching group members:', error);
      const errorMessage = handleApiError(error, 'Failed to fetch group members');
      Alert.alert('Error', errorMessage);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedGroup) return;

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
      const token = await AsyncStorage.getItem('jwtToken');
      const headers = await getAuthHeaders(token);
      await axios.post(`${SOCKET_URL}/api/group-chats/${selectedGroup._id}/messages`, {
        senderId: user._id,
        message: input,
      }, { headers });
    } catch (err) {
      console.log('Error saving group message:', err);
      Alert.alert("Error", "Failed to send message. Please try again.");
      return;
    }

    // Add to local state for instant UI feedback
    setMessages(prev => [...prev, msg]);
    setInput('');
  };

  const handleLeaveGroup = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const headers = await getAuthHeaders(token);
      await axios.post(`${SOCKET_URL}/api/group-chats/${selectedGroup._id}/leave`, {
        userId: user._id,
      }, { headers });

      // Leave the group in socket
      socketRef.current?.emit('leaveGroup', { userId: user._id, groupId: selectedGroup._id });
      
      Alert.alert("Success", "You have left the group", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error leaving group:', error);
      const errorMessage = handleApiError(error, 'Failed to leave group');
      Alert.alert('Error', errorMessage);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const headers = await getAuthHeaders(token);
      await axios.post(`${SOCKET_URL}/api/group-chats/${selectedGroup._id}/remove-member`, {
        userId: user._id,
        memberId: memberId,
      }, { headers });

      // Refresh group members
      fetchGroupMembers();
      Alert.alert("Success", "Member removed from group");
    } catch (error) {
      console.error('Error removing member:', error);
      const errorMessage = handleApiError(error, 'Failed to remove member');
      Alert.alert('Error', errorMessage);
    }
  };

  // Sort messages by timestamp
  const safeMessages = Array.isArray(messages)
    ? [...messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    : [];

  if (!user || !user._id || !selectedGroup) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading group chat...</Text>
      </View>
    );
  }

  const isCreator = selectedGroup.createdBy === user._id;

  return (
    <View style={{ flex: 1, backgroundColor: '#f3f3f3' }}>
      {/* Blue Header */}
      <View style={AdminChatStyle.blueHeaderBackground}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 40, paddingHorizontal: 16 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 22, color: '#fff' }}>{'<'}</Text>
          </TouchableOpacity>
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

      {/* Members Modal */}
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

      {/* Leave Group Modal */}
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
    </View>
  );
} 