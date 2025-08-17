import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';

const API_BASE_URL = 'https://juanlms-webapp-server.onrender.com';

const UserItem = ({ user, onPress }) => (
  <TouchableOpacity style={styles.userItem} onPress={onPress}>
    <View style={styles.userAvatar}>
      <Icon
        name={user.role === 'Faculty' ? 'account-tie' : user.role === 'Admin' ? 'shield-account' : 'account'}
        size={24}
        color="#fff"
      />
    </View>
    <View style={styles.userInfo}>
      <Text style={styles.userName}>{user.name}</Text>
      <Text style={styles.userRole}>{user.role}</Text>
      <Text style={styles.userStatus}>{user.status}</Text>
    </View>
    <Icon name="chevron-right" size={20} color="#666" />
  </TouchableOpacity>
);

const GroupItem = ({ group, onPress }) => (
  <TouchableOpacity style={styles.groupItem} onPress={onPress}>
    <View style={styles.groupAvatar}>
      <Icon name="account-group" size={24} color="#fff" />
    </View>
    <View style={styles.groupInfo}>
      <Text style={styles.groupName}>{group.name}</Text>
      <Text style={styles.groupMembers}>{group.memberCount} members</Text>
      <Text style={styles.groupLastMessage}>{group.lastMessage}</Text>
    </View>
    <Icon name="chevron-right" size={20} color="#666" />
  </TouchableOpacity>
);

export default function PrincipalChats() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users`);
      
      if (response.data && Array.isArray(response.data)) {
        // Filter users to only show faculty, admin, and director roles
        const allowedRoles = ['faculty', 'admin', 'director'];
        const filteredUsers = response.data.filter(user => 
          allowedRoles.includes(user.role?.toLowerCase())
        );
        
        setUsers(filteredUsers);
        setFilteredUsers(filteredUsers);
      } else {
        // Use mock data as fallback
        setUsers(getMockUsers());
        setFilteredUsers(getMockUsers());
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers(getMockUsers());
      setFilteredUsers(getMockUsers());
    }
  };

  const fetchGroups = async () => {
    try {
      // For now, use mock data since we need a user ID
      // In a real app, you'd fetch groups for the current user
      setGroups(getMockGroups());
      setFilteredGroups(getMockGroups());
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups(getMockGroups());
      setFilteredGroups(getMockGroups());
    }
  };

  const getMockUsers = () => [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      role: 'Faculty',
      status: 'Online',
      department: 'Computer Science',
    },
    {
      id: 2,
      name: 'Prof. Michael Chen',
      role: 'Faculty',
      status: 'Online',
      department: 'Mathematics',
    },
    {
      id: 3,
      name: 'Admin Manager',
      role: 'Admin',
      status: 'Online',
      department: 'Administration',
    },
    {
      id: 4,
      name: 'Director Smith',
      role: 'Director',
      status: 'Away',
      department: 'Academic Affairs',
    },
    {
      id: 5,
      name: 'Dr. Emily Davis',
      role: 'Faculty',
      status: 'Offline',
      department: 'Physics',
    },
  ];

  const getMockGroups = () => [
    {
      id: 1,
      name: 'Faculty Leadership',
      memberCount: 8,
      lastMessage: 'Meeting scheduled for tomorrow',
      lastMessageTime: '2 hours ago',
    },
    {
      id: 2,
      name: 'Academic Committee',
      memberCount: 12,
      lastMessage: 'New curriculum approved',
      lastMessageTime: '1 day ago',
    },
    {
      id: 3,
      name: 'Department Heads',
      memberCount: 15,
      lastMessage: 'Budget review meeting',
      lastMessageTime: '3 days ago',
    },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUsers(), fetchGroups()]);
    setRefreshing(false);
  };

  useEffect(() => {
    if (isFocused) {
      fetchUsers();
      fetchGroups();
    }
  }, [isFocused]);

  useEffect(() => {
    if (activeTab === 'users') {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.department.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      const filtered = groups.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredGroups(filtered);
    }
  }, [searchQuery, activeTab, users, groups]);

  const startChat = (user) => {
    navigation.navigate('UnifiedChat', {
      chatType: 'direct',
      recipient: user,
      chatId: `direct_${user.id}`,
    });
  };

  const openGroupChat = (group) => {
    navigation.navigate('UnifiedChat', {
      chatType: 'group',
      group: group,
      chatId: `group_${group.id}`,
    });
  };

  const createGroup = () => {
    Alert.alert(
      'Create New Group',
      'Group creation feature coming soon!',
      [{ text: 'OK' }]
    );
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const renderUsersTab = () => (
    <FlatList
      data={filteredUsers}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <UserItem user={item} onPress={() => startChat(item)} />
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Icon name="account-search" size={48} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchQuery.length > 0 ? 'No users found for your search.' : 'No users available.'}
          </Text>
          {searchQuery.length > 0 && (
            <Text style={styles.emptySubtext}>Try adjusting your search terms.</Text>
          )}
        </View>
      }
      showsVerticalScrollIndicator={false}
    />
  );

  const renderGroupsTab = () => (
    <FlatList
      data={filteredGroups}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <GroupItem group={item} onPress={() => openGroupChat(item)} />
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Icon name="account-group" size={48} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchQuery.length > 0 ? 'No groups found for your search.' : 'No groups available.'}
          </Text>
          {searchQuery.length > 0 && (
            <Text style={styles.emptySubtext}>Try adjusting your search terms.</Text>
          )}
        </View>
      }
      showsVerticalScrollIndicator={false}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Communication</Text>
        <Text style={styles.headerSubtitle}>Chat with faculty and staff</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="magnify" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users or groups..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Icon name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
          onPress={() => setActiveTab('groups')}
        >
          <Text style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]}>
            Groups
          </Text>
        </TouchableOpacity>
      </View>

      {/* Create Group Button */}
      {activeTab === 'groups' && (
        <TouchableOpacity style={styles.createGroupButton} onPress={createGroup}>
          <Icon name="plus" size={20} color="#fff" />
          <Text style={styles.createGroupButtonText}>Create New Group</Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'users' ? renderUsersTab() : renderGroupsTab()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#00418b',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Poppins-Bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e3f2fd',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 16,
    fontFamily: 'Poppins-Regular',
  },
  clearButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#00418b',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  activeTabText: {
    color: '#00418b',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  createGroupButton: {
    backgroundColor: '#00418b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createGroupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00418b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  userRole: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'Poppins-Regular',
  },
  userStatus: {
    fontSize: 12,
    color: '#4CAF50',
    fontFamily: 'Poppins-Regular',
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF9800',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  groupMembers: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'Poppins-Regular',
  },
  groupLastMessage: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Poppins-Regular',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
});


