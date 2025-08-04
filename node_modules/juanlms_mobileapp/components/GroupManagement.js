import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  FlatList
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from './UserContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_URL = 'http://localhost:5000';
const ALLOWED_ROLES = ['students', 'director', 'admin', 'faculty'];

export default function GroupManagement() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'join'
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);

  useEffect(() => {
    if (!user || !user._id) return;
    (async () => {
      const token = await AsyncStorage.getItem('jwtToken');
      axios.get(`${SOCKET_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          const filteredUsers = res.data.filter(u =>
            u._id !== user._id &&
            ALLOWED_ROLES.includes(u.role.toLowerCase())
          );
          setAllUsers(filteredUsers);
        })
        .catch(err => {
          console.error('Error fetching users:', err);
          setAllUsers([]);
        });
    })();
  }, [user]);

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      Alert.alert('Error', 'Please enter a group name and select at least one member.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await axios.post(`${SOCKET_URL}/api/group-chats`, {
        name: groupName.trim(),
        createdBy: user._id,
        participants: selectedMembers
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('Success', 'Group created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter a join code.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      await axios.post(`${SOCKET_URL}/api/group-chats/${joinCode}/join`, {
        userId: user._id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('Success', 'Successfully joined the group!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error joining group:', error);
      if (error.response?.status === 404) {
        Alert.alert('Error', 'Group not found. Please check the join code.');
      } else if (error.response?.status === 400) {
        Alert.alert('Error', 'You are already a member of this group.');
      } else {
        Alert.alert('Error', 'Failed to join group. Please try again.');
      }
    }
  };

  const toggleMemberSelection = (userId) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = allUsers.filter(u =>
    `${u.firstname} ${u.lastname}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f3f3f3' }}>
      {/* Header */}
      <View style={{
        backgroundColor: '#00418b',
        paddingTop: 40,
        paddingBottom: 20,
        paddingHorizontal: 16
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 22, color: '#fff' }}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>
            Group Management
          </Text>
        </View>
      </View>

      {/* Tab Buttons */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 8,
        overflow: 'hidden'
      }}>
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 12,
            backgroundColor: activeTab === 'create' ? '#00418b' : 'transparent',
            alignItems: 'center'
          }}
          onPress={() => setActiveTab('create')}
        >
          <Text style={{
            color: activeTab === 'create' ? '#fff' : '#00418b',
            fontWeight: 'bold'
          }}>
            Create Group
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 12,
            backgroundColor: activeTab === 'join' ? '#00418b' : 'transparent',
            alignItems: 'center'
          }}
          onPress={() => setActiveTab('join')}
        >
          <Text style={{
            color: activeTab === 'join' ? '#fff' : '#00418b',
            fontWeight: 'bold'
          }}>
            Join Group
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {activeTab === 'create' ? (
          // Create Group Form
          <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
              Create New Group
            </Text>

            <TextInput
              placeholder="Group Name"
              value={groupName}
              onChangeText={setGroupName}
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                backgroundColor: '#fff'
              }}
            />

            <TouchableOpacity
              onPress={() => setShowUserSearch(true)}
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                backgroundColor: '#fff',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Text style={{ color: selectedMembers.length > 0 ? '#000' : '#999' }}>
                {selectedMembers.length > 0
                  ? `${selectedMembers.length} member(s) selected`
                  : 'Select members...'
                }
              </Text>
              <Text style={{ color: '#00418b' }}>▼</Text>
            </TouchableOpacity>

            {selectedMembers.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Selected Members:</Text>
                {selectedMembers.map(memberId => {
                  const member = allUsers.find(u => u._id === memberId);
                  return member ? (
                    <View key={memberId} style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#fff',
                      padding: 8,
                      borderRadius: 6,
                      marginBottom: 4
                    }}>
                      <Image
                        source={member.profilePicture ? { uri: member.profilePicture } : require('../assets/profile-icon (2).png')}
                        style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }}
                      />
                      <Text style={{ flex: 1 }}>{member.firstname} {member.lastname}</Text>
                      <TouchableOpacity
                        onPress={() => toggleMemberSelection(memberId)}
                        style={{ backgroundColor: '#ff4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}
                      >
                        <Text style={{ color: 'white', fontSize: 12 }}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null;
                })}
              </View>
            )}

            <TouchableOpacity
              onPress={handleCreateGroup}
              disabled={!groupName.trim() || selectedMembers.length === 0}
              style={{
                backgroundColor: (!groupName.trim() || selectedMembers.length === 0) ? '#ccc' : '#00418b',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center'
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Create Group</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Join Group Form
          <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
              Join Group
            </Text>

            <TextInput
              placeholder="Enter Join Code"
              value={joinCode}
              onChangeText={setJoinCode}
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                backgroundColor: '#fff'
              }}
            />

            <TouchableOpacity
              onPress={handleJoinGroup}
              disabled={!joinCode.trim()}
              style={{
                backgroundColor: !joinCode.trim() ? '#ccc' : '#00418b',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center'
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Join Group</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* User Selection Modal */}
      <Modal
        visible={showUserSearch}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUserSearch(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: 'white', borderRadius: 10, padding: 20, width: '90%', maxHeight: '80%' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Select Members</Text>

            <TextInput
              placeholder="Search users..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                padding: 12,
                marginBottom: 15,
                backgroundColor: '#fff'
              }}
            />

            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => toggleMemberSelection(item._id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: '#eee',
                    backgroundColor: selectedMembers.includes(item._id) ? '#e3f2fd' : 'transparent'
                  }}
                >
                  <Image
                    source={item.profilePicture ? { uri: item.profilePicture } : require('../assets/profile-icon (2).png')}
                    style={{ width: 30, height: 30, borderRadius: 15, marginRight: 10 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 'bold' }}>{item.firstname} {item.lastname}</Text>
                    <Text style={{ color: '#666', fontSize: 12 }}>{item.role}</Text>
                  </View>
                  {selectedMembers.includes(item._id) && (
                    <Text style={{ color: '#00418b', fontSize: 18 }}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 }}>
              <TouchableOpacity
                onPress={() => setShowUserSearch(false)}
                style={{ backgroundColor: '#ccc', padding: 10, borderRadius: 5, flex: 1, marginRight: 10 }}
              >
                <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowUserSearch(false)}
                style={{ backgroundColor: '#00418b', padding: 10, borderRadius: 5, flex: 1, marginLeft: 10 }}
              >
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
} 