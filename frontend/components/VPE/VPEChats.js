import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { useContext } from 'react';
import { UserContext } from '../UserContext';

const API_BASE_URL = 'http://localhost:5000';

export default function VPEChats() {
  const navigation = useNavigation();
  const { user } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'groups'

  useEffect(() => {
    if (user) {
      fetchUsers();
      fetchGroups();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      // Fetch users for chat (faculty, admin, director roles)
      const response = await axios.get(`${API_BASE_URL}/api/users`);
      
      if (response.data && Array.isArray(response.data)) {
        // Filter users by role (VPE can chat with faculty, admin, director)
        const allowedRoles = ['faculty', 'admin', 'director'];
        const filteredUsers = response.data.filter(user => 
          allowedRoles.includes(user.role?.toLowerCase())
        );
        setUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Use mock data for now
      setUsers(getMockUsers());
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      if (user?._id) {
        const response = await axios.get(`${API_BASE_URL}/api/group-chats/user/${user._id}`);
        
        if (response.data && Array.isArray(response.data)) {
          setGroups(response.data);
        }
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      // Use mock data for now
      setGroups(getMockGroups());
    }
  };

  const getMockUsers = () => [
    {
      _id: '1',
      firstname: 'John',
      lastname: 'Smith',
      role: 'faculty',
      email: 'john.smith@juanlms.edu'
    },
    {
      _id: '2',
      firstname: 'Maria',
      lastname: 'Garcia',
      role: 'admin',
      email: 'maria.garcia@juanlms.edu'
    },
    {
      _id: '3',
      firstname: 'David',
      lastname: 'Johnson',
      role: 'director',
      email: 'david.johnson@juanlms.edu'
    }
  ];

  const getMockGroups = () => [
    {
      _id: '1',
      name: 'Academic Leadership',
      description: 'Group for academic leadership discussions',
      participants: ['1', '2', '3']
    },
    {
      _id: '2',
      name: 'Faculty Development',
      description: 'Group for faculty development initiatives',
      participants: ['1', '2']
    }
  ];

  const startChat = (selectedUser) => {
    navigation.navigate('UnifiedChat', { selectedUser });
  };

  const openGroupChat = (group) => {
    navigation.navigate('UnifiedChat', { selectedGroup: group });
  };

  const createGroup = () => {
    navigation.navigate('GroupManagement');
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstname} ${user.lastname}`.toLowerCase();
    const role = user.role?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || role.includes(query);
  });

  const filteredGroups = groups.filter(group => {
    const name = group.name?.toLowerCase() || '';
    const description = group.description?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return name.includes(query) || description.includes(query);
  });

  const renderUserItem = ({ item }) => (
    <TouchableOpacity style={styles.userCard} onPress={() => startChat(item)}>
      <View style={styles.userAvatar}>
        <Icon name="account-circle" size={40} color="#00418b" />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.firstname} {item.lastname}</Text>
        <Text style={styles.userRole}>{item.role}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      <Icon name="chat" size={24} color="#00418b" />
    </TouchableOpacity>
  );

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity style={styles.groupCard} onPress={() => openGroupChat(item)}>
      <View style={styles.groupAvatar}>
        <Icon name="account-group" size={40} color="#00418b" />
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.groupDescription}>{item.description}</Text>
        <Text style={styles.groupParticipants}>{item.participants?.length || 0} participants</Text>
      </View>
      <Icon name="chat" size={24} color="#00418b" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <Icon name="chat" size={28} color="#00418b" />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="magnify" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users or groups..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            Users ({filteredUsers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
          onPress={() => setActiveTab('groups')}
        >
          <Text style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]}>
            Groups ({filteredGroups.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Create Group Button */}
      {activeTab === 'groups' && (
        <TouchableOpacity style={styles.createGroupButton} onPress={createGroup}>
          <Icon name="plus" size={20} color="#fff" />
          <Text style={styles.createGroupText}>Create New Group</Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      {activeTab === 'users' ? (
        <FlatList
          data={filteredUsers}
          keyExtractor={item => item._id}
          renderItem={renderUserItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="account-search" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No users found matching your search.' : 'No users available for chat.'}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredGroups}
          keyExtractor={item => item._id}
          renderItem={renderGroupItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="account-group" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No groups found matching your search.' : 'No groups available.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fa',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00418b',
    fontFamily: 'Poppins-Bold',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Poppins-Regular',
    paddingVertical: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#00418b',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Poppins-SemiBold',
  },
  activeTabText: {
    color: '#fff',
  },
  createGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00418b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  createGroupText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  userAvatar: {
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  userRole: {
    fontSize: 14,
    color: '#00418b',
    marginBottom: 2,
    fontFamily: 'Poppins-Medium',
    textTransform: 'capitalize',
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  groupAvatar: {
    marginRight: 16,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  groupDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'Poppins-Regular',
  },
  groupParticipants: {
    fontSize: 12,
    color: '#00418b',
    fontFamily: 'Poppins-Medium',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    fontFamily: 'Poppins-Regular',
  },
});
