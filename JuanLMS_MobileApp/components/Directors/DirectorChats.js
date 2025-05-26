// components/Students/StudentsChats.js
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import axios from 'axios';
import { Image } from 'react-native-web';
import DirectorChatStyle from '../styles/directors/DirectorChatStyle';

const SOCKET_URL = 'http://localhost:5000';

export default function DirectorChats() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || !user._id) return;
    axios.get(`${SOCKET_URL}/users`)
      .then(res => {
        setUsers(res.data.filter(u => u._id !== user._id));
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
      <View style={DirectorChatStyle.blueHeaderBackground} />
      {/* White card header */}
      <View style={DirectorChatStyle.whiteHeaderCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={DirectorChatStyle.headerTitle}>Chats</Text>
            <Text style={DirectorChatStyle.headerSubtitle}>Messages</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('DProfile')}>
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
              style={{ backgroundColor: 'lightgray', padding: 15, borderRadius: 10, marginBottom: 10 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{u.firstname} {u.lastname}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
