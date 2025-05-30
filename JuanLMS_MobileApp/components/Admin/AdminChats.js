// components/Students/StudentsChats.js
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import axios from 'axios';
import { Image } from 'react-native-web';
import AdminChatStyle from '../styles/administrator/AdminChatStyle';

const SOCKET_URL = 'http://localhost:5000';
const ALLOWED_ROLES = ['students', 'director', 'admin', 'faculty'];

export default function AdminChats() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

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

  if (!user || !user._id) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading user...</Text>
      </View>
    );
  }

  const filteredUsers = users.filter(u =>
    `${u.firstname} ${u.lastname}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f3f3f3' }}>
      {/* Blue background */}
      <View style={AdminChatStyle.blueHeaderBackground} />
      {/* White card header */}
      <View style={AdminChatStyle.whiteHeaderCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={AdminChatStyle.headerTitle}>Chats</Text>
            <Text style={AdminChatStyle.headerSubtitle}>Messages</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('AProfile')}>
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
