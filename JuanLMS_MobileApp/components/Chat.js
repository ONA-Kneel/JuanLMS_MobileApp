import React, { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useUser } from './UserContext';
import io from 'socket.io-client';
import axios from 'axios';
import AdminChatStyle from './styles/administrator/AdminChatStyle';

const SOCKET_URL = 'https://juanlms-mobileapp.onrender.com';

const ALLOWED_ROLES = ['students', 'director', 'admin', 'faculty'];

export default function Chat() {
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedUser, setRecentChats } = route.params;
  const { user, setUser } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const socketRef = useRef(null);
  const scrollViewRef = useRef();

  useEffect(() => {
    // Validate if both users have allowed roles
    if (!selectedUser || !user) {
      navigation.goBack();
      return;
    }

    if (!ALLOWED_ROLES.includes(user.role.toLowerCase()) || !ALLOWED_ROLES.includes(selectedUser.role.toLowerCase())) {
      Alert.alert(
        "Access Denied",
        "You cannot chat with this user due to role restrictions.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      return;
    }

    console.log('Current user:', user);
    console.log('Selected user:', selectedUser);
    console.log('Fetching messages for:', user._id, selectedUser._id);

    // Fetch messages
    axios.get(`${SOCKET_URL}/api/messages/${user._id}/${selectedUser._id}`)
      .then(res => setMessages(res.data))
      .catch((err) => {
        console.log('Error fetching messages:', err);
        setMessages([]);
      });

    // Mark messages as read
    axios.put(`${SOCKET_URL}/api/messages/read/${user._id}/${selectedUser._id}`)
      .then(() => {
        if (setRecentChats) {
          setRecentChats(prev => {
            const updated = prev.map(chat =>
              chat.partnerId === selectedUser._id
                ? { ...chat, unreadCount: 0 }
                : chat
            );
            // Sort by most recent lastMessage
            return updated.sort((a, b) =>
              new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
            );
          });
        }
      })
      .catch(err => console.log('Error marking messages as read:', err));

    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL);
    }
    socketRef.current.emit('joinChat', [user._id, selectedUser._id].sort().join('-'));
    socketRef.current.on('receiveMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off('receiveMessage');
      }
    };
  }, [selectedUser, user]);

  const handleSend = async () => {
    if (!input.trim() || !selectedUser) return;
    
    // Validate roles before sending
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

    // 1. Emit to socket for real-time
    socketRef.current.emit('sendMessage', msg);

    // 2. Save to database
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

    // 3. Add to local state for instant UI feedback
    setMessages(prev => [...prev, msg]);
    setInput('');

    // Update unread count in recentChats and move to top
    if (setRecentChats) {
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
  };

  // Sort messages by timestamp (oldest first, newest last)
  const safeMessages = Array.isArray(messages)
    ? [...messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    : [];

  if (!user || !user._id || !selectedUser) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading chat...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f3f3f3' }}>
      {/* Blue Header */}
      <View style={AdminChatStyle.blueHeaderBackground}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 40, paddingHorizontal: 16 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 22, color: '#fff' }}>{'<'}</Text>
          </TouchableOpacity>
          <Image
            source={selectedUser.profilePicture ? { uri: selectedUser.profilePicture } : require('../assets/profile-icon (2).png')}
            style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12, borderWidth: 2, borderColor: '#fff' }}
          />
          <View>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{selectedUser.firstname} {selectedUser.lastname}</Text>
            <Text style={{ color: '#e0e0e0', fontSize: 12 }}>{selectedUser.role}</Text>
          </View>
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
    </View>
  );
}
