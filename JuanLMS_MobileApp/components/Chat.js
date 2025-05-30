import React, { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useUser } from './UserContext';
import io from 'socket.io-client';
import axios from 'axios';
import AdminChatStyle from './styles/administrator/AdminChatStyle';

const SOCKET_URL = 'http://localhost:5000';

export default function Chat() {
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedUser } = route.params;
  const { user, setUser } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const socketRef = useRef(null);
  const scrollViewRef = useRef();

  console.log('Current user:', user);
  console.log('Selected user:', selectedUser);
  console.log('Fetching messages for:', user._id, selectedUser._id);

  useEffect(() => {
    if (!selectedUser || !user || !user._id) return;
    axios.get(`${SOCKET_URL}/api/messages/${user._id}/${selectedUser._id}`)
      .then(res => setMessages(res.data))
      .catch((err) => {
        console.log('Error fetching messages:', err);
        setMessages([]);
      });
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
  }, [selectedUser, user && user._id]);

  const handleSend = async () => {
    if (!input.trim() || !selectedUser) return;
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
      // Optionally show an error to the user
    }

    // 3. Add to local state for instant UI feedback
    setMessages(prev => [...prev, msg]);
    setInput('');
  };

  // Sort messages by timestamp (oldest first, newest last)
  const safeMessages = Array.isArray(messages)
    ? [...messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    : [];
  console.log('Rendering chat UI', { user, selectedUser, messages });
  // if (!user || !user._id || !selectedUser) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  //       <Text>Loading chat...</Text>
  //     </View>
  //   );
  // }

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
            <Text style={{ color: '#e0e0e0', fontSize: 12 }}>Online</Text>
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
