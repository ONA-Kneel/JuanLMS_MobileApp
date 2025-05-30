// components/Admin/AdminChats.js
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
  const [recentChats, setRecentChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState({});

  useEffect(() => {
    if (!user || !user._id) return;

    // Fetch all users for reference
    axios.get(`${SOCKET_URL}/users`)
      .then(res => {
        const userMap = {};
        res.data.forEach(u => {
          if (u._id !== user._id && ALLOWED_ROLES.includes(u.role.toLowerCase())) {
            userMap[u._id] = u;
          }
        });
        setUsers(userMap);
      })
      .catch(() => setUsers({}));

    // Fetch recent chats
    axios.get(`${SOCKET_URL}/api/messages/recent/${user._id}`)
      .then(res => setRecentChats(res.data))
      .catch(() => setRecentChats([]));
  }, [user && user._id]);

  if (!user || !user._id) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading user...</Text>
      </View>
    );
  }

  // Filter chats by search term
  const filteredChats = recentChats.filter(chat => {
    const partner = users[chat.partnerId];
    if (!partner) return false;
    return `${partner.firstname} ${partner.lastname}`.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
      {/* Chat List */}
      <View style={{ padding: 16 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 22, marginBottom: 10 }}>Recent Chats</Text>
        <ScrollView>
          {filteredChats.map(chat => {
            const partner = users[chat.partnerId];
            if (!partner) return null;
            
            return (
              <TouchableOpacity
                key={chat.partnerId}
                onPress={() => navigation.navigate('Chat', { selectedUser: partner, setRecentChats })}
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
                  source={partner.profilePicture ? { uri: partner.profilePicture } : require('../../assets/profile-icon (2).png')} 
                  style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} 
                />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{partner.firstname} {partner.lastname}</Text>
                    {chat.unreadCount > 0 && (
                      <View style={{ 
                        backgroundColor: '#00418b', 
                        borderRadius: 12, 
                        paddingHorizontal: 8, 
                        paddingVertical: 2 
                      }}>
                        <Text style={{ color: 'white', fontSize: 12 }}>{chat.unreadCount} unread</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: '#666', fontSize: 12 }}>{partner.role}</Text>
                  <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }} numberOfLines={1}>
                    {chat.lastMessage.message}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}
