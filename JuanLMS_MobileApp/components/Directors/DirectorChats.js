// components/Students/StudentsChats.js
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import axios from 'axios';

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

  const filteredUsers = users.filter(u =>
    `${u.firstname} ${u.lastname}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <TextInput
        placeholder="Search users..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        style={{ marginBottom: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 8 }}
      />
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
