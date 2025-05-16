// components/Students/StudentsChats.js
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import io from 'socket.io-client';
import axios from 'axios';

const SOCKET_URL = 'http://localhost:5000';

export default function StudentsChats() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const socketRef = useRef(null);
  const scrollViewRef = useRef();

  console.log('user from useUser:', user);

  // Fetch all users except self
  useEffect(() => {
    if (!user || !user._id) return;
    axios.get(`${SOCKET_URL}/users`)
      .then(res => {
        console.log('Fetched users:', res.data);
        setUsers(res.data.filter(u => u._id !== user._id));
      })
      .catch((err) => {
        console.log('Error fetching users:', err);
        setUsers([]);
      });
  }, [user && user._id]);

  // Fetch messages with selected user
  useEffect(() => {
    if (!selectedUser || !user || !user._id) return;
    axios.get(`${SOCKET_URL}/api/messages/${user._id}/${selectedUser._id}`)
      .then(res => setMessages(res.data))
      .catch(() => setMessages([]));
    // Connect to socket
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

  const handleSend = () => {
    if (!input.trim() || !selectedUser) return;
    const msg = {
      chatId: [user._id, selectedUser._id].sort().join('-'),
      senderId: user._id,
      receiverId: selectedUser._id,
      message: input,
      timestamp: new Date(),
    };
    socketRef.current.emit('sendMessage', msg);
    setMessages(prev => [...prev, msg]);
    setInput('');
  };

  const handleSelectUser = (user) => {
    navigation.navigate('Chat', { selectedUser: user });
  };

  if (!user || !user._id) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading user...</Text>
      </View>
    );
  }

  // Filter users by search term
  const filteredUsers = users.filter(u =>
    `${u.firstname} ${u.lastname}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <View style={{ flex: 1, padding: 10 }}>
      {/* Search Bar */}
      <TextInput
        placeholder="Search users..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        style={{ marginBottom: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 8 }}
      />
      {/* User List */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 22 }}>Users</Text>
        <ScrollView>
          {(Array.isArray(filteredUsers) ? filteredUsers : []).map(u => (
            <TouchableOpacity
              key={u._id}
              onPress={() => handleSelectUser(u)}
              style={{ backgroundColor: 'lightgray', padding: 15, borderRadius: 10, marginBottom: 10 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{u.firstname} {u.lastname}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
