import React, { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, Platform } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useUser } from './UserContext';
import io from 'socket.io-client';
import axios from 'axios';
import AdminChatStyle from './styles/administrator/AdminChatStyle';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthHeaders, handleApiError } from '../utils/apiUtils';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

const API_URL = 'https://juanlms-webapp-server.onrender.com';
const SOCKET_URL = 'https://juanlms-webapp-server.onrender.com';

// Role restrictions removed: all roles may use direct messages

export default function Chat() {
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedUser, setRecentChats } = route.params;
  const { user, setUser } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const socketRef = useRef(null);
  const scrollViewRef = useRef();

  useEffect(() => {
    // Validate if both users have allowed roles
    if (!selectedUser || !user) {
      navigation.goBack();
      return;
    }

    // Role restrictions removed: allow DM regardless of role

    console.log('Current user:', user);
    console.log('Selected user:', selectedUser);
    console.log('Fetching messages for:', user._id, selectedUser._id);

    (async () => {
      const token = await AsyncStorage.getItem('jwtToken');
      axios.get(`${API_URL}/messages/${user._id}/${selectedUser._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => setMessages(res.data))
        .catch((err) => {
          console.log('Error fetching messages:', err);
          setMessages([]);
        });
      axios.put(`${API_URL}/messages/read/${user._id}/${selectedUser._id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(() => {
          if (setRecentChats) {
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
    })();

    if (!socketRef.current) {
      console.log('Creating new socket connection in Chat.js to:', SOCKET_URL);
      socketRef.current = io(SOCKET_URL);
      
      // Add connection event listeners
      socketRef.current.on('connect', () => {
        console.log('Socket connected successfully in Chat.js');
      });
      
      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected in Chat.js');
      });
      
      socketRef.current.on('connect_error', (error) => {
        console.log('Socket connection error in Chat.js:', error);
      });
    }
    
    const chatId = [user._id, selectedUser._id].sort().join('-');
    console.log('Setting up direct chat in Chat.js for chatId:', chatId);
    socketRef.current.emit('addUser', user._id);
    socketRef.current.emit('joinChat', chatId);
    console.log('Emitted addUser and joinChat in Chat.js');
    
    // Remove existing listener to avoid duplicates
    socketRef.current.off('receiveMessage');
    
    socketRef.current.on('receiveMessage', (msg) => {
      console.log('Received direct message in Chat.js:', msg);
      console.log('Adding message to state in Chat.js');
      setMessages(prev => {
        const newMessages = [...prev, msg];
        console.log('Updated messages array length in Chat.js:', newMessages.length);
        console.log('Previous messages count in Chat.js:', prev.length);
        console.log('New messages count in Chat.js:', newMessages.length);
        // Force UI update
        setTimeout(() => {
          console.log('Forcing UI update in Chat.js');
        }, 100);
        return newMessages;
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off('receiveMessage');
      }
    };
  }, [selectedUser, user]);

  const handleSend = async () => {
    if (!selectedUser || (!input.trim() && !selectedFile)) return;
    
    // No role validation required before sending

    const buildUploadFile = async (asset) => {
      if (!asset) return null;
      let uploadUri = asset.uri;
      try {
        if (Platform.OS === 'android' && typeof uploadUri === 'string' && uploadUri.startsWith('content://')) {
          const targetPath = FileSystem.cacheDirectory + (asset.name || asset.fileName || 'attachment');
          await FileSystem.copyAsync({ from: uploadUri, to: targetPath });
          uploadUri = targetPath;
        }
      } catch (copyErr) {
        if (!String(uploadUri || '').startsWith('file://')) {
          throw new Error('Unable to process file for upload');
        }
      }
      const fileName = asset.name || asset.fileName || 'attachment';
      const mimeType = asset.mimeType || asset.type || 'application/octet-stream';
      return { uri: uploadUri, name: fileName, type: mimeType };
    };

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (selectedFile) {
        const headers = { 'Authorization': `Bearer ${token}` };
        const form = new FormData();
        form.append('senderId', user._id);
        form.append('receiverId', selectedUser._id);
        form.append('message', input || '');
        const uploadFile = await buildUploadFile(selectedFile);
        if (uploadFile) form.append('file', uploadFile);
        const res = await axios.post(`${API_URL}/messages`, form, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
        const sentMessage = res.data;
        socketRef.current.emit('sendMessage', {
          chatId: [user._id, selectedUser._id].sort().join('-'),
          senderId: user._id,
          receiverId: selectedUser._id,
          message: sentMessage.message,
          timestamp: sentMessage.timestamp || new Date(),
        });
        setMessages(prev => [...prev, sentMessage]);
        setInput('');
        setSelectedFile(null);
      } else {
        const res = await axios.post(`${API_URL}/messages`, {
          senderId: user._id,
          receiverId: selectedUser._id,
          message: input
        }, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const sentMessage = res.data;
        socketRef.current.emit('sendMessage', {
          chatId: [user._id, selectedUser._id].sort().join('-'),
          senderId: user._id,
          receiverId: selectedUser._id,
          message: sentMessage.message,
          timestamp: sentMessage.timestamp || new Date(),
        });
        setMessages(prev => [...prev, sentMessage]);
        setInput('');
      }
    } catch (err) {
      console.log('Error saving message:', err);
      console.log('Error response:', err.response?.data);
      console.log('Error status:', err.response?.status);
      Alert.alert("Error", `Failed to send message: ${err.response?.data?.error || err.message}`);
      return;
    }

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
                {msg.message ? (
                  <Text style={{ color: isMe ? '#fff' : '#222' }}>{msg.message}</Text>
                ) : null}
                {msg.fileUrl ? (
                  <TouchableOpacity onPress={() => {
                    try {
                      const url = String(msg.fileUrl).startsWith('http') ? msg.fileUrl : `${API_URL.replace(/\/$/, '')}/${String(msg.fileUrl).replace(/^\//, '')}`;
                      const Linking = require('react-native').Linking;
                      Linking.openURL(url);
                    } catch {}
                  }}>
                    <Text style={{ color: isMe ? '#d1eaff' : '#666', fontSize: 12, marginTop: msg.message ? 6 : 0 }}>
                      📎 {String(msg.fileUrl).split('/').pop()}
                    </Text>
                  </TouchableOpacity>
                ) : null}
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
