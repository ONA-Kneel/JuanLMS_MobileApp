// components/Students/StudentsChats.js
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import io from 'socket.io-client';
import axios from 'axios';
import { Image } from 'react-native-web';
import StudentChatStyle from '../styles/Stud/StudentChatsStyle';

const SOCKET_URL = 'http://localhost:5000';
const ALLOWED_ROLES = ['students', 'director', 'admin', 'faculty'];

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
        // Filter out users with restricted roles and current user
        const filteredUsers = res.data.filter(u => 
          u._id !== user._id && 
          ALLOWED_ROLES.includes(u.role.toLowerCase())
        );
        setUsers(filteredUsers);
      })
      .catch(() => setUsers([]));
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
    <View style={{ flex: 1, backgroundColor: '#f3f3f3' }}>
      {/* Blue background */}
      <View style={StudentChatStyle.blueHeaderBackground} />
      {/* White card header */}
      <View style={StudentChatStyle.whiteHeaderCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={StudentChatStyle.headerTitle}>Chats</Text>
            <Text style={StudentChatStyle.headerSubtitle}>Messages</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('SProfile')}>
            <Image source={require('../../assets/profile-icon (2).png')} style={{ width: 36, height: 36, borderRadius: 18 }} />
          </TouchableOpacity>
        </View>
      </View>
      {/* Search Bar */}
      <TextInput
        placeholder="Search users..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        style={{ margin: 16, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 8 }}
      />
      {/* User List */}
      <View style={{ flex: 1, marginHorizontal: 16 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 22, marginBottom: 10 }}>Users</Text>
        <ScrollView>
          {(Array.isArray(filteredUsers) ? filteredUsers : []).map(u => (
            <TouchableOpacity
              key={u._id}
              onPress={() => navigation.navigate('Chat', { selectedUser: u })}
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
              <Image 
                source={u.profilePicture ? { uri: u.profilePicture } : require('../../assets/profile-icon (2).png')} 
                style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} 
              />
              <View>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{u.firstname} {u.lastname}</Text>
                <Text style={{ color: '#666', fontSize: 12 }}>{u.role}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
