// components/Faculty/FacultyChats.js
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import axios from 'axios';
import FacultyChatStyle from '../styles/faculty/FacultyChatStyle';

const SOCKET_URL = 'https://juanlms-webapp-server.onrender.com';
const ALLOWED_ROLES = ['students', 'director', 'admin', 'faculty'];

export default function FacultyChats() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [recentChats, setRecentChats] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    if (!user || !user._id) return;

    // Fetch all users for reference
    axios.get(`${SOCKET_URL}/users`)
      .then(res => {
        const userMap = {};
        const filteredUsers = res.data.filter(u => 
          u._id !== user._id && 
          ALLOWED_ROLES.includes(u.role.toLowerCase())
        );
        
        filteredUsers.forEach(u => {
          userMap[u._id] = u;
        });
        setUsers(userMap);
        setAllUsers(filteredUsers);
      })
      .catch(() => {
        setUsers({});
        setAllUsers([]);
      });

    // Fetch recent chats
    axios.get(`${SOCKET_URL}/api/messages/recent/${user._id}`)
      .then(res => setRecentChats(res.data))
      .catch(() => setRecentChats([]));

    // Fetch user's groups
    axios.get(`${SOCKET_URL}/api/group-chats/user/${user._id}`)
      .then(res => setGroups(res.data))
      .catch(() => setGroups([]));
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

  // Filter groups by search term
  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter users for new chat search
  const filteredUsers = allUsers.filter(u => 
    `${u.firstname} ${u.lastname}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchFocus = () => {
    setShowSearchResults(true);
  };

  const handleSearchBlur = () => {
    // Delay hiding search results to allow for touch events
    setTimeout(() => setShowSearchResults(false), 200);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f3f3f3' }}>
      {/* Blue background */}
      <View style={FacultyChatStyle.blueHeaderBackground} />
      {/* White card header */}
      <View style={FacultyChatStyle.whiteHeaderCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={FacultyChatStyle.headerTitle}>Chats</Text>
            <Text style={FacultyChatStyle.headerSubtitle}>Messages</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('GroupManagement')}
              style={{ 
                backgroundColor: '#00418b', 
                paddingHorizontal: 12, 
                paddingVertical: 6, 
                borderRadius: 15, 
                marginRight: 10 
              }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>Groups</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('FProfile')}>
              <Image 
                source={require('../../assets/profile-icon (2).png')} 
                style={{ width: 36, height: 36, borderRadius: 18 }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {/* Search Bar */}
      <TextInput
        placeholder="Search users..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        onFocus={handleSearchFocus}
        onBlur={handleSearchBlur}
        style={{ margin: 16, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 8 }}
      />
      
      {/* Search Results */}
      {showSearchResults && searchTerm && (
        <View style={{ 
          position: 'absolute', 
          top: 180, 
          left: 16, 
          right: 16, 
          backgroundColor: 'white',
          borderRadius: 10,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          zIndex: 1000,
          maxHeight: 300
        }}>
          <ScrollView>
            {filteredUsers.length > 0 || filteredGroups.length > 0 ? (
              <>
                {/* Show groups first */}
                {filteredGroups.map(group => (
                  <TouchableOpacity
                    key={group._id}
                    onPress={() => {
                      navigation.navigate('GroupChat', { selectedGroup: group, setRecentChats });
                      setSearchTerm('');
                      setShowSearchResults(false);
                    }}
                    style={{ 
                      padding: 15, 
                      borderBottomWidth: 1, 
                      borderBottomColor: '#eee',
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}>
                    <View style={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: 20, 
                      backgroundColor: '#00418b', 
                      marginRight: 12,
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                        {group.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{group.name}</Text>
                      <Text style={{ color: '#666', fontSize: 12 }}>Group • {group.participants.length} members</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                
                {/* Then show users */}
                {filteredUsers.map(u => (
                  <TouchableOpacity
                    key={u._id}
                    onPress={() => {
                      navigation.navigate('Chat', { selectedUser: u, setRecentChats });
                      setSearchTerm('');
                      setShowSearchResults(false);
                    }}
                    style={{ 
                      padding: 15, 
                      borderBottomWidth: 1, 
                      borderBottomColor: '#eee',
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}>
                    <Image 
                      source={u.profilePicture ? { uri: u.profilePicture } : require('../../assets/profile-icon (2).png')} 
                      style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
                      resizeMode="cover"
                    />
                    <View>
                      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{u.firstname} {u.lastname}</Text>
                      <Text style={{ color: '#666', fontSize: 12 }}>{u.role}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#666', fontSize: 16 }}>No users or groups found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Chat List */}
      <View style={{ padding: 16 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 22, marginBottom: 10 }}>Recent Chats</Text>
        <ScrollView>
          {/* Individual Chats */}
          {recentChats.map(chat => {
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
                  resizeMode="cover"
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

          {/* Group Chats */}
          {groups.length > 0 && (
            <>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginTop: 20, marginBottom: 10, color: '#00418b' }}>
                Group Chats
              </Text>
              {groups.map(group => (
                <TouchableOpacity
                  key={group._id}
                  onPress={() => navigation.navigate('GroupChat', { selectedGroup: group, setRecentChats })}
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
                  <View style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 20, 
                    backgroundColor: '#00418b', 
                    marginRight: 12,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                      {group.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{group.name}</Text>
                      <View style={{ 
                        backgroundColor: '#e8f4fd', 
                        borderRadius: 12, 
                        paddingHorizontal: 8, 
                        paddingVertical: 2 
                      }}>
                        <Text style={{ color: '#00418b', fontSize: 12 }}>Group</Text>
                      </View>
                    </View>
                    <Text style={{ color: '#666', fontSize: 12 }}>{group.participants.length} members</Text>
                    <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }} numberOfLines={1}>
                      Join code: {group.joinCode}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
