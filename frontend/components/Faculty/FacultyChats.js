// FacultyChats.js - Mobile version matching web Faculty_Chats.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Linking
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import io from 'socket.io-client';
import moment from 'moment';

const API_BASE = 'https://juanlms-webapp-server.onrender.com';
const SOCKET_URL = 'https://juanlms-webapp-server.onrender.com';

export default function FacultyChats() {
  const navigation = useNavigation();
  const { user } = useUser();
  
  // Chat states
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [lastMessages, setLastMessages] = useState({});
  const [recentChats, setRecentChats] = useState([]);
  
  // Group chat states
  const [groups, setGroups] = useState([]);
  const [groupMessages, setGroupMessages] = useState({});
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [joinGroupCode, setJoinGroupCode] = useState('');
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  
  // User management
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [showLeaveGroupModal, setShowLeaveGroupModal] = useState(false);
  const [groupToLeave, setGroupToLeave] = useState(null);
  const [showCreatorLeaveError, setShowCreatorLeaveError] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const socket = useRef(null);
  const scrollViewRef = useRef(null);

  // Helpers for attachments
  const buildFileUrl = (path) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `${API_BASE}/${path}`;
    };
  const isImageUrl = (url) => /\.(png|jpe?g|gif|webp)$/i.test(url || '');
  const getFilename = (path) => (path || '').split('/').pop();
  const handleOpenAttachment = async (path) => {
    const url = buildFileUrl(path);
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Error', 'Unable to open attachment');
    }
  };
  const handleDownloadAttachment = async (path) => {
    try {
      const url = buildFileUrl(path);
      if (!url) return;
      const filename = getFilename(path) || `file-${Date.now()}`;
      const targetUri = FileSystem.documentDirectory + filename;

      const downloadRes = await FileSystem.downloadAsync(url, targetUri);

      if (isImageUrl(filename)) {
        const perm = await MediaLibrary.requestPermissionsAsync();
        if (perm.status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(downloadRes.uri);
          Alert.alert('Downloaded', 'Image saved to your Photos.');
          return;
        }
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadRes.uri);
      }
      Alert.alert('Downloaded', `Saved to app storage as ${filename}.`);
    } catch (err) {
      console.error('Download error', err);
      Alert.alert('Error', 'Failed to download file');
    }
  };

  // Initialize socket connection
  useEffect(() => {
    if (!user?._id) return;

    socket.current = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socket.current.emit('addUser', user._id);

    socket.current.on('getMessage', (data) => {
      const incomingMessage = {
        senderId: data.senderId,
        receiverId: user._id,
        message: data.text,
        fileUrl: data.fileUrl || null,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const newMessages = {
          ...prev,
          [incomingMessage.senderId]: [
            ...(prev[incomingMessage.senderId] || []),
            incomingMessage,
          ],
        };
        return newMessages;
      });

      // Update last message for this chat
      const chat = recentChats.find(c => c._id === incomingMessage.senderId);
      if (chat) {
        const prefix = incomingMessage.senderId === user._id 
          ? 'You: ' 
          : `${chat.lastname}, ${chat.firstname}: `;
        const text = incomingMessage.message 
          ? incomingMessage.message 
          : (incomingMessage.fileUrl ? 'File sent' : '');
        setLastMessages(prev => ({
          ...prev,
          [chat._id]: { prefix, text }
        }));
      }
    });

    // Group chat message handling
    socket.current.on('getGroupMessage', (data) => {
      const incomingGroupMessage = {
        senderId: data.senderId,
        groupId: data.groupId,
        message: data.text,
        fileUrl: data.fileUrl || null,
        senderName: data.senderName || 'Unknown',
        timestamp: new Date(),
      };

      setGroupMessages((prev) => {
        const newGroupMessages = {
          ...prev,
          [incomingGroupMessage.groupId]: [
            ...(prev[incomingGroupMessage.groupId] || []),
            incomingGroupMessage,
          ],
        };
        return newGroupMessages;
      });
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [user?._id, recentChats]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user?._id) return;
      
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('jwtToken');
        const response = await fetch(`${API_BASE}/users`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const userArray = Array.isArray(data) ? data : data.users || [];
          setUsers(userArray);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user?._id]);

  // Initialize recent chats from users (like web version)
  useEffect(() => {
    if (!user?._id || users.length === 0) return;
    
    // Create recent chats from users (this is how web version works)
    const userChats = users.map(userItem => ({
      _id: userItem._id,
      partnerId: userItem._id,
      firstname: userItem.firstname,
      lastname: userItem.lastname,
      role: userItem.role
    }));
    
    setRecentChats(userChats);
  }, [user?._id, users]);

  // Fetch user groups
  useEffect(() => {
    const fetchUserGroups = async () => {
      if (!user?._id) return;
      
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        const response = await fetch(`${API_BASE}/group-chats/user/${user._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setGroups(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching user groups:', error);
      }
    };

    fetchUserGroups();
  }, [user?._id]);

  // Fetch messages for selected chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat || !user?._id) return;
      
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        const response = await fetch(`${API_BASE}/messages/${user._id}/${selectedChat._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setMessages(prev => ({
            ...prev,
            [selectedChat._id]: data
          }));
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [selectedChat, user?._id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages, selectedChat]);

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;
    if (!selectedChat || !user?._id) return;

    try {
      const token = await AsyncStorage.getItem('jwtToken');

      const formData = new FormData();
      formData.append('senderId', user._id);
      formData.append('receiverId', selectedChat._id);
      if (newMessage.trim()) {
        formData.append('message', newMessage.trim());
      }
      if (selectedFile) {
        const file = selectedFile;
        const name = file.name || `upload-${Date.now()}`;
        const type = file.mimeType || 'application/octet-stream';

        if (Platform.OS === 'web') {
          const res = await fetch(file.uri);
          const blob = await res.blob();
          formData.append('file', new File([blob], name, { type }));
        } else {
          formData.append('file', { uri: file.uri, name, type });
        }
      }

      const response = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (response.ok) {
        const saved = await response.json();

        setMessages(prev => ({
          ...prev,
          [selectedChat._id]: [
            ...(prev[selectedChat._id] || []),
            saved,
          ],
        }));

        setNewMessage('');
        setSelectedFile(null);

        if (socket.current) {
          socket.current.emit('sendMessage', {
            senderId: saved.senderId,
            receiverId: saved.receiverId,
            text: saved.message || '',
            fileUrl: saved.fileUrl || null,
          });
        }
      } else {
        const errText = await response.text();
        throw new Error(errText || 'Failed to send');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', error?.message || 'Failed to send message');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const startNewChat = (selectedUser) => {
    setSelectedChat(selectedUser);
    setShowNewChatModal(false);
    setUserSearchTerm('');
  };

  const createGroup = async () => {
    if (!newGroupName.trim() || selectedGroupMembers.length === 0) {
      Alert.alert('Error', 'Please fill in group name and select participants');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const groupData = {
        name: newGroupName.trim(),
        creatorId: user._id,
        members: selectedGroupMembers,
      };

      const response = await fetch(`${API_BASE}/group-chats`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      });

      if (response.ok) {
        const newGroup = await response.json();
        setGroups(prev => [...prev, newGroup]);
        setShowCreateGroupModal(false);
        setNewGroupName('');
        setSelectedGroupMembers([]);
        Alert.alert('Success', 'Group created successfully!');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group');
    }
  };

  const joinGroup = async () => {
    if (!joinGroupCode.trim()) {
      Alert.alert('Error', 'Please enter a group code');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
              const response = await fetch(`${API_BASE}/group-chats/${joinGroupCode}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user._id }),
      });

      if (response.ok) {
        const joinedGroup = await response.json();
        setGroups(prev => [...prev, joinedGroup]);
        setShowJoinGroupModal(false);
        setJoinGroupCode('');
        Alert.alert('Success', 'Joined group successfully!');
      }
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Error', 'Failed to join group');
    }
  };

  const filteredUsers = users.filter(u => 
    u._id !== user?._id && 
    ['students', 'admin', 'faculty', 'principal', 'vpe'].includes(u.role?.toLowerCase()) &&
    `${u.firstname} ${u.lastname}`.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const filteredRecentChats = recentChats.filter(chat => {
    const partner = users.find(u => u._id === chat.partnerId);
    if (!partner) return false;
    return `${partner.firstname} ${partner.lastname}`.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (!user?._id) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00418b" />
      </View>
    );
  }

  // Chat List View
  if (!selectedChat) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f6f7fb' }}>
        {/* Profile Header */}
        <View style={{ 
          backgroundColor: '#00418b', 
          paddingTop: 48, 
          paddingBottom: 20, 
          paddingHorizontal: 24,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontFamily: 'Poppins-Bold', color: '#fff', marginBottom: 4 }}>
                Hello, <Text style={{ fontWeight: 'bold' }}>{user?.firstname || 'Faculty'}!</Text>
              </Text>
              <Text style={{ fontSize: 14, fontFamily: 'Poppins-Regular', color: '#e3f2fd', marginBottom: 2 }}>
                Faculty Member
              </Text>
              <Text style={{ fontSize: 13, fontFamily: 'Poppins-Regular', color: '#b3e5fc' }}>
                {moment(new Date()).format('dddd, MMMM D, YYYY')}
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('FProfile')}>
              {user?.profilePicture ? (
                <Image 
                  source={{ uri: user.profilePicture }} 
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    borderWidth: 2,
                    borderColor: '#fff',
                  }}
                  resizeMode="cover"
                />
              ) : (
                <Image 
                  source={require('../../assets/profile-icon (2).png')} 
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    borderWidth: 2,
                    borderColor: '#fff',
                  }}
                />
              )}
            </TouchableOpacity>
          </View>
          
          {/* Chats Title */}
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 24, fontFamily: 'Poppins-Bold', color: '#fff', marginBottom: 8 }}>
              Chats
            </Text>
            <Text style={{ fontSize: 14, fontFamily: 'Poppins-Regular', color: '#e3f2fd' }}>
              Connect with students and colleagues
            </Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1, padding: 24 }} showsVerticalScrollIndicator={false}>
          {/* Search Bar */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ position: 'relative' }}>
              <Feather name="search" size={20} color="#999" style={{ position: 'absolute', left: 16, top: 18, zIndex: 1 }} />
              <TextInput
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  paddingVertical: 16,
                  paddingHorizontal: 48,
                  fontSize: 16,
                  fontFamily: 'Poppins-Regular',
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 5,
                  elevation: 2,
                }}
                placeholder="Search chats..."
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#9575cd',
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
              onPress={() => setShowNewChatModal(true)}
            >
              <MaterialIcons name="chat" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                New Chat
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#fff',
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                borderWidth: 2,
                borderColor: '#9575cd',
              }}
              onPress={() => setShowCreateGroupModal(true)}
            >
              <MaterialIcons name="group-add" size={20} color="#9575cd" />
              <Text style={{ color: '#9575cd', fontWeight: '600', fontSize: 16 }}>
                Create Group
              </Text>
            </TouchableOpacity>
          </View>

          {/* Recent Chats */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 }}>
              Recent Chats
            </Text>
            {filteredRecentChats.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <MaterialIcons name="chat-bubble-outline" size={64} color="#ddd" />
                <Text style={{ fontSize: 16, color: '#999', marginTop: 16 }}>
                  No recent chats
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {filteredRecentChats.map((chat) => {
                  const partner = users.find(u => u._id === chat.partnerId);
                  if (!partner) return null;
                  const initials = `${partner.firstname?.[0] || ''}${partner.lastname?.[0] || ''}`;

                  return (
                    <TouchableOpacity key={chat._id} onPress={() => setSelectedChat(partner)}>
                      <View style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: '#e3f2fd',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#dbeafe',
                      }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#00418b' }}>{initials}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* User Groups */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 }}>
              Groups
            </Text>
            {groups.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <MaterialIcons name="group" size={64} color="#ddd" />
                <Text style={{ fontSize: 16, color: '#999', marginTop: 16 }}>
                  No groups yet
                </Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {groups.map((group) => (
                  <TouchableOpacity
                    key={group._id}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 16,
                      padding: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      shadowColor: '#000',
                      shadowOpacity: 0.05,
                      shadowRadius: 5,
                      elevation: 2,
                    }}
                    onPress={() => setSelectedChat({ ...group, isGroup: true })}
                  >
                    <View style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: '#fff3e0',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                      <MaterialIcons name="group" size={24} color="#f57c00" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 }}>
                        {group.name}
                      </Text>
                      <Text style={{ fontSize: 14, color: '#666' }}>
                        {group.members?.length || 0} members
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* New Chat Modal */}
        <Modal
          visible={showNewChatModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowNewChatModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ 
              backgroundColor: '#fff', 
              borderTopLeftRadius: 20, 
              borderTopRightRadius: 20,
              padding: 24,
              maxHeight: '80%'
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#333' }}>
                  New Chat
                </Text>
                <TouchableOpacity onPress={() => setShowNewChatModal(false)}>
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  marginBottom: 24,
                }}
                placeholder="Search users..."
                value={userSearchTerm}
                onChangeText={setUserSearchTerm}
              />
              
              <ScrollView style={{ maxHeight: 400 }}>
                {filteredUsers.map((userItem) => (
                  <TouchableOpacity
                    key={userItem._id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: '#f0f0f0',
                    }}
                    onPress={() => startNewChat(userItem)}
                  >
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: '#e3f2fd',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00418b' }}>
                        {userItem.firstname?.[0]}{userItem.lastname?.[0]}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
                        {userItem.firstname} {userItem.lastname}
                      </Text>
                      <Text style={{ fontSize: 14, color: '#666' }}>
                        {userItem.role}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Create Group Modal */}
        <Modal
          visible={showCreateGroupModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCreateGroupModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ 
              backgroundColor: '#fff', 
              borderTopLeftRadius: 20, 
              borderTopRightRadius: 20,
              padding: 24,
              maxHeight: '80%'
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#333' }}>
                  Create Group
                </Text>
                <TouchableOpacity onPress={() => setShowCreateGroupModal(false)}>
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  marginBottom: 24,
                }}
                placeholder="Group name"
                value={newGroupName}
                onChangeText={setNewGroupName}
              />
              
              <TouchableOpacity
                style={{
                  backgroundColor: '#9575cd',
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                }}
                onPress={createGroup}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                  Create Group
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Chat View
  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={{ 
        backgroundColor: '#00418b', 
        paddingTop: 48, 
        paddingBottom: 16, 
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
      }}>
        <TouchableOpacity onPress={() => setSelectedChat(null)}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#fff' }}>
            {selectedChat.isGroup ? selectedChat.name : `${selectedChat.firstname} ${selectedChat.lastname}`}
          </Text>
          <Text style={{ fontSize: 14, color: '#e3f2fd' }}>
            {selectedChat.isGroup ? 'Group Chat' : selectedChat.role}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={{ flex: 1, padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {messages[selectedChat._id]?.map((message, index) => (
          <View
            key={index}
            style={{
              alignSelf: message.senderId === user._id ? 'flex-end' : 'flex-start',
              marginBottom: 16,
              maxWidth: '80%',
            }}
          >
            <View style={{
              backgroundColor: message.senderId === user._id ? '#9575cd' : '#f0f0f0',
              padding: 12,
              borderRadius: 16,
              borderBottomLeftRadius: message.senderId === user._id ? 16 : 4,
              borderBottomRightRadius: message.senderId === user._id ? 4 : 16,
            }}>
              {message.fileUrl ? (
                <View>
                  <TouchableOpacity onPress={() => handleOpenAttachment(message.fileUrl)} activeOpacity={0.8}>
                    {isImageUrl(message.fileUrl) ? (
                      <Image
                        source={{ uri: buildFileUrl(message.fileUrl) }}
                        style={{ width: 180, height: 180, borderRadius: 12 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        <MaterialIcons name="attach-file" size={24} color={message.senderId === user._id ? '#fff' : '#666'} />
                        <Text style={{ 
                          color: message.senderId === user._id ? '#fff' : '#666',
                          fontSize: 12,
                          marginTop: 4,
                        }}>
                          {getFilename(message.fileUrl)}
                        </Text>
                        <Text style={{ color: message.senderId === user._id ? '#eaeaea' : '#999', fontSize: 12 }}>Tap to view</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDownloadAttachment(message.fileUrl)} style={{ marginTop: 8, alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialIcons name="download" size={18} color={message.senderId === user._id ? '#fff' : '#666'} />
                    <Text style={{ color: message.senderId === user._id ? '#fff' : '#666', fontSize: 12 }}>Download</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={{ 
                  color: message.senderId === user._id ? '#fff' : '#333',
                  fontSize: 16,
                }}>
                  {message.message}
                </Text>
              )}
            </View>
            <Text style={{ 
              fontSize: 12, 
              color: '#999', 
              marginTop: 4,
              alignSelf: message.senderId === user._id ? 'flex-end' : 'flex-start',
            }}>
              {new Date(message.createdAt || message.timestamp || Date.now()).toLocaleTimeString()}
            </Text>
          </View>
        ))}
        <View ref={messagesEndRef} />
      </ScrollView>

      {/* Message Input */}
      <View style={{
        backgroundColor: '#fff',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}>
        <TouchableOpacity onPress={pickDocument}>
          <MaterialIcons name="attach-file" size={24} color="#9575cd" />
        </TouchableOpacity>
        
        <TextInput
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
          }}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        
        <TouchableOpacity
          style={{
            backgroundColor: '#9575cd',
            borderRadius: 20,
            padding: 12,
          }}
          onPress={sendMessage}
        >
          <MaterialIcons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* File Preview */}
      {selectedFile && (
        <View style={{
          backgroundColor: '#fff',
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}>
          <MaterialIcons name="attach-file" size={20} color="#9575cd" />
          <Text style={{ flex: 1, fontSize: 14, color: '#666' }}>
            {selectedFile.name}
          </Text>
          <TouchableOpacity onPress={() => setSelectedFile(null)}>
            <MaterialIcons name="close" size={20} color="#f44336" />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
