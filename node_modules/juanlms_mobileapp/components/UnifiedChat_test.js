import React, { useEffect, useState, useRef } from "react";
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
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useUser } from './UserContext';
import io from 'socket.io-client';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AdminChatStyle from './styles/administrator/AdminChatStyle';
import * as DocumentPicker from 'expo-document-picker';
import { getAuthHeaders, handleApiError } from '../utils/apiUtils';


const API_URL = 'https://juanlms-webapp-server.onrender.com';
const SOCKET_URL = 'https://juanlms-webapp-server.onrender.com';
const ALLOWED_ROLES = ['students', 'director', 'admin', 'faculty'];

export default function UnifiedChat() {
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedUser, selectedGroup, setRecentChats } = route.params || {};
  const { user, setUser } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [groupMemberSearch, setGroupMemberSearch] = useState('');

  const [allUsers, setAllUsers] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [recentChatsList, setRecentChatsList] = useState([]); // unified recent individual chats
  const [dmMessages, setDmMessages] = useState({}); // per-user messages cache
  const [groupMsgsById, setGroupMsgsById] = useState({}); // per-group messages cache
  const [lastMessages, setLastMessages] = useState({}); // preview text per chat/group
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('groups'); // 'groups', 'individual', 'create', 'join'
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const socketRef = useRef(null);
  const scrollViewRef = useRef();

  const isGroupChat = !!selectedGroup;
  const chatTarget = isGroupChat ? selectedGroup : selectedUser;
  const RECENTS_KEY = 'recentChats_mobile';

  useEffect(() => {
    if (!user || !user._id) {
      console.log('No user found, going back');
      navigation.goBack();
      return;
    }

    console.log('UnifiedChat useEffect - selectedUser:', selectedUser, 'selectedGroup:', selectedGroup);

    // If no specific chat is selected, show the chat list
    if (!selectedUser && !selectedGroup) {
      console.log('No specific chat selected, fetching users and groups');
      setIsLoading(true);
      Promise.all([fetchUsers(), fetchUserGroups(), loadRecentChats()])
        .then(() => fetchRecentConversations())
        .finally(() => { setIsLoading(false); });
      return;
    }

    // Validate that we have a valid selectedUser for individual chat
    if (selectedUser && (!selectedUser._id || !selectedUser.firstname)) {
      console.log('Invalid selectedUser, going back');
      navigation.goBack();
      return;
    }

    // Validate that we have a valid selectedGroup for group chat
    if (selectedGroup && (!selectedGroup._id || !selectedGroup.name)) {
      console.log('Invalid selectedGroup, going back');
      navigation.goBack();
      return;
    }

    // Validate if both users have allowed roles for individual chat
    if (selectedUser && (
      !ALLOWED_ROLES.includes((user?.role || '').toLowerCase()) ||
      !ALLOWED_ROLES.includes((selectedUser?.role || '').toLowerCase())
    )) {
      Alert.alert(
        "Access Denied",
        "You cannot chat with this user due to role restrictions.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      return;
    }

    console.log('Current user:', user);
    console.log('Chat target:', chatTarget);

    if (isGroupChat) {
      // Fetch group messages (WebApp route)
      (async () => {
        try {
          const token = await AsyncStorage.getItem('jwtToken');
          const headers = { 'Authorization': `Bearer ${token || ''}` };
          const res = await axios.get(`${API_URL}/group-messages/${selectedGroup._id}?userId=${user._id}`, {
            headers
          });
          setMessages(res.data);
        } catch (err) {
          console.log('Error fetching group messages:', err);
          // Try alternative endpoint
          try {
            const res2 = await axios.get(`${API_URL}/group-chats/${selectedGroup._id}/messages?userId=${user._id}`, {
              headers
            });
            setMessages(res2.data);
          } catch (err2) {
            console.log('Error fetching group messages from alternative endpoint:', err2);
            setMessages([]);
          }
        }
      })();

      // Fetch group members
      fetchGroupMembers();
    } else {
      // Fetch individual messages (WebApp route)
      (async () => {
        try {
          const token = await AsyncStorage.getItem('jwtToken');
          const headers = { 'Authorization': `Bearer ${token || ''}` };
          const res = await axios.get(`${API_URL}/messages/${user._id}/${selectedUser._id}`, {
            headers
          });
          setMessages(res.data);
        } catch (err) {
          console.log('Error fetching messages:', err);
          setMessages([]);
        }
      })();
    }

    // Setup socket connection
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnectionAttempts: 5,
        timeout: 10000,
      });
      socketRef.current.emit('addUser', user._id);
    }

    if (isGroupChat) {
      socketRef.current.emit('joinGroup', { userId: user._id, groupId: selectedGroup._id });
      socketRef.current.on('getGroupMessage', (data) => {
        // Stamp device time for immediate UI
        const incoming = { ...data, createdAt: new Date().toISOString() };
        setMessages(prev => [...prev, incoming]);
        setGroupMsgsById(prev => ({
          ...prev,
          [data.groupId]: [ ...(prev[data.groupId] || []), incoming ]
        }));
        setUserGroups(prev => {
          const arr = [...prev];
          const idx = arr.findIndex(g => g._id === data.groupId);
          if (idx > -1) { const g = arr.splice(idx,1)[0]; return [g, ...arr]; }
          return prev;
        });
        const text = incoming.message ? incoming.message : (incoming.fileUrl ? 'File sent' : '');
        setLastMessages(prev => ({ ...prev, [data.groupId]: { prefix: incoming.senderId === user._id ? 'You: ' : `${incoming.senderFirstname || 'Unknown'} ${incoming.senderLastname || 'User'}: `, text } }));
      });
    } else {
      // WebApp delivers direct messages to receiver; no joinChat room needed
      socketRef.current.on('getMessage', (data) => {
        const incoming = {
          senderId: data.senderId,
          receiverId: user._id,
          message: data.text,
          fileUrl: data.fileUrl || null,
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, incoming]);
        setDmMessages(prev => {
          const list = prev[data.senderId] || [];
          return { ...prev, [data.senderId]: [...list, incoming] };
        });
        const u = allUsers.find(x => x._id === data.senderId);
        const entry = { _id: data.senderId, firstname: u?.firstname || '', lastname: u?.lastname || '', profilePic: u?.profilePic || u?.profilePicture || null, lastMessageTime: new Date().toISOString() };
        setRecentChatsList(prev => {
          const filtered = prev.filter(c => c._id !== entry._id);
          const updated = [entry, ...filtered];
          AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(updated)).catch(() => {});
          return updated;
        });
        const text = incoming.message ? incoming.message : (incoming.fileUrl ? 'File sent' : '');
        setLastMessages(prev => ({ ...prev, [entry._id]: { prefix: 'You: ' , text } }));
      });
    }

    return () => {
      if (socketRef.current) {
        if (isGroupChat) {
          socketRef.current.off('receiveGroupMessage');
        } else {
          socketRef.current.off('receiveMessage');
        }
      }
    };
  }, [selectedUser, selectedGroup, user]);

  const fetchUsers = async () => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await axios.get(`${API_URL}/users`, {
        headers
      });
      
      if (response.data) {
        const userArray = Array.isArray(response.data) ? response.data : (response.data?.users || response.data?.data || []);
        // Do NOT filter by role here; we need all users to reconstruct conversations
        const otherUsers = userArray.filter(u => u._id !== user._id);
        console.log('Loaded users:', otherUsers.length);
        setAllUsers(otherUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      let errorMessage = 'Failed to fetch users';
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      Alert.alert('Error', errorMessage);
    }
  };

  const loadRecentChats = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENTS_KEY);
      if (!stored) { setRecentChatsList([]); return; }
      const parsed = JSON.parse(stored);
      const cleaned = (Array.isArray(parsed) ? parsed : []).filter(chat => chat && chat._id && chat.firstname && chat.lastname && chat.firstname !== 'undefined' && chat.lastname !== 'undefined');
      if (cleaned.length !== (Array.isArray(parsed) ? parsed.length : 0)) {
        await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(cleaned));
      }
      setRecentChatsList(cleaned);
    } catch {
      setRecentChatsList([]);
    }
  };

  const fetchRecentConversations = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return;
      
      let allMsgs = [];
      try {
        const res = await axios.get(`${API_URL}/messages/user/${user._id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        allMsgs = Array.isArray(res.data) ? res.data : [];
      } catch (e) {
        for (const u of allUsers) {
          if (u._id === user._id) continue;
          try {
            const r = await axios.get(`${API_URL}/messages/${user._id}/${u._id}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (Array.isArray(r.data) && r.data.length > 0) {
              allMsgs.push(...r.data);
              setDmMessages(prev => ({ ...prev, [u._id]: r.data }));
            }
          } catch {}
        }
      }
      if (allMsgs.length === 0) {
        // Try fallback using dmMessages already loaded and any messages fetched per user
        const list = [];
        (allUsers || []).forEach(u => {
          const msgs = dmMessages[u._id] || [];
          if (msgs.length > 0) {
            const last = msgs[msgs.length - 1];
            list.push({ _id: u._id, firstname: u.firstname, lastname: u.lastname, profilePic: u.profilePic || u.profilePicture || null, lastMessageTime: last.createdAt || last.updatedAt });
            const text = last.message ? last.message : (last.fileUrl ? 'File sent' : '');
            const prefix = last.senderId === user._id ? 'You: ' : `${u.firstname || 'Unknown'} ${u.lastname || 'User'}: `;
            setLastMessages(prev => ({ ...prev, [u._id]: { prefix, text } }));
          }
        });
        list.sort((a,b)=> new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
        setRecentChatsList(list);
        AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(list)).catch(() => {});
        return;
      }
      const map = new Map();
      allMsgs.forEach(m => {
        const otherId = m.senderId === user._id ? m.receiverId : m.senderId;
        if (!map.has(otherId)) map.set(otherId, []);
        map.get(otherId).push(m);
      });
      const list = [];
      map.forEach((msgs, otherUserId) => {
        const u = allUsers.find(x => x._id === otherUserId);
        if (!u) return;
        msgs.sort((a,b)=> new Date(a.createdAt||a.updatedAt) - new Date(b.createdAt||b.updatedAt));
        const last = msgs[msgs.length-1];
        list.push({ _id: otherUserId, firstname: u.firstname, lastname: u.lastname, profilePic: u.profilePic || u.profilePicture || null, lastMessageTime: last.createdAt || last.updatedAt });
      });
      list.sort((a,b)=> new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
      setRecentChatsList(list);
      AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(list)).catch(() => {});
    } catch (e) {
      console.log('Error building recent conversations', e);
      setRecentChatsList([]);
    }
  };

  // Recompute recents after users load on the list view
  useEffect(() => {
    if (!selectedUser && !selectedGroup && user && (allUsers || []).length > 0) {
      fetchRecentConversations();
    }
  }, [allUsers, userGroups]);

  const fetchUserGroups = async () => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await axios.get(`${API_URL}/group-chats/user/${user._id}`, {
        headers
      });
      
      if (response.data) {
        setUserGroups(response.data);
        try {
          (response.data || []).forEach(g => socketRef.current?.emit('joinGroup', { userId: user._id, groupId: g._id }));
        } catch {}
        // Preload group messages and compute last message
        const allGroupMessages = {};
        for (const group of (response.data || [])) {
          try {
            // Try primary endpoint first
            let gres;
            try {
              gres = await axios.get(`${API_URL}/group-messages/${group._id}?userId=${user._id}`, {
                headers
              });
            } catch (err) {
              // Try alternative endpoint
              gres = await axios.get(`${API_URL}/group-chats/${group._id}/messages?userId=${user._id}`, {
                headers
              });
            }
            allGroupMessages[group._id] = Array.isArray(gres.data) ? gres.data : [];
            if (allGroupMessages[group._id].length > 0) {
              const last = allGroupMessages[group._id][allGroupMessages[group._id].length - 1];
              const text = last.message ? last.message : (last.fileUrl ? 'File sent' : '');
              const prefix = last.senderId === user._id ? 'You: ' : `${last.senderFirstname || 'Unknown'} ${last.senderLastname || 'User'}: `;
              setLastMessages(prev => ({ ...prev, [group._id]: { prefix, text } }));
            }
          } catch (err) {
            console.log('Error fetching messages for group:', group._id, err);
          }
        }
        setGroupMsgsById(allGroupMessages);
      }
    } catch (error) {
      console.error('Error fetching user groups:', error);
      const errorMessage = handleApiError(error, 'Failed to fetch user groups');
      Alert.alert('Error', errorMessage);
    }
  };



  const fetchGroupMembers = async () => {
    if (!selectedGroup) return;
    
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const headers = { 'Authorization': `Bearer ${token}` };
      const memberPromises = selectedGroup.participants.map(async (participantId) => {
        try {
          const response = await axios.get(`${API_URL}/users/${participantId}`, {
            headers
          });
          return response.data;
        } catch (err) {
          console.log('Error fetching user:', participantId, err);
          // Return a placeholder user object
          return {
            _id: participantId,
            firstname: 'Unknown',
            lastname: 'User',
            profilePicture: null
          };
        }
      });
      const members = await Promise.all(memberPromises);
      setGroupMembers(members);
    } catch (error) {
      console.error('Error fetching group members:', error);
      const errorMessage = handleApiError(error, 'Failed to fetch group members');
      Alert.alert('Error', errorMessage);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !chatTarget) return;
    
    if (isGroupChat) {
      // Send group message via WebApp endpoint
      const form = new FormData();
      form.append('groupId', selectedGroup._id);
      form.append('senderId', user._id);
      form.append('message', input);
      if (selectedFile) {
        form.append('file', {
          uri: selectedFile.uri,
          name: selectedFile.name || 'attachment',
          type: selectedFile.mimeType || 'application/octet-stream',
        });
      }
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Try primary endpoint first
        let res;
        try {
          res = await axios.post(`${API_URL}/group-messages`, form, {
            headers, 'Content-Type': 'multipart/form-data'
          });
        } catch (err) {
          // Try alternative endpoint
          res = await axios.post(`${API_URL}/group-chats/${selectedGroup._id}/messages`, form, {
            headers, 'Content-Type': 'multipart/form-data'
          });
        }
        
        const sentMessage = res.data;
        // Emit to socket for real-time
        socketRef.current.emit('sendGroupMessage', {
          senderId: user._id,
          groupId: selectedGroup._id,
          text: sentMessage.message,
          fileUrl: sentMessage.fileUrl || null,
          senderName: `${user.firstname} ${user.lastname}`,
        });
        // Local append
        setMessages(prev => [...prev, sentMessage]);
        setGroupMsgsById(prev => ({ ...prev, [selectedGroup._id]: [ ...(prev[selectedGroup._id] || []), sentMessage ] }));
        const text = sentMessage.message ? sentMessage.message : (sentMessage.fileUrl ? 'File sent' : '');
        setLastMessages(prev => ({ ...prev, [selectedGroup._id]: { prefix: 'You: ', text } }));
        setSelectedFile(null);
      } catch (err) {
        console.log('Error saving group message:', err);
        Alert.alert('Error', 'Failed to send message. Please try again.');
        return;
      }
    } else {
      // Send individual message
      if (!ALLOWED_ROLES.includes(user.role.toLowerCase()) || !ALLOWED_ROLES.includes(selectedUser.role.toLowerCase())) {
        Alert.alert("Error", "You cannot send messages to this user due to role restrictions.");
        return;
      }

      try {
        const form = new FormData();
        form.append('senderId', user._id);
        form.append('receiverId', selectedUser._id);
        form.append('message', input);
        if (selectedFile) {
          form.append('file', {
            uri: selectedFile.uri,
            name: selectedFile.name || 'attachment',
            type: selectedFile.mimeType || 'application/octet-stream',
          });
        }
        const token = await AsyncStorage.getItem('jwtToken');
        const headers = { 'Authorization': `Bearer ${token}` };
        const res = await axios.post(`${API_URL}/messages`, form, {
          headers, 'Content-Type': 'multipart/form-data'
        });
        const sentMessage = res.data;
        // Emit to socket for real-time
        socketRef.current.emit('sendMessage', {
          senderId: user._id,
          receiverId: selectedUser._id,
          text: sentMessage.message,
          fileUrl: sentMessage.fileUrl || null,
        });
        // Local append
        setMessages(prev => [...prev, sentMessage]);
        setSelectedFile(null);
        const entry = { _id: selectedUser._id, firstname: selectedUser.firstname, lastname: selectedUser.lastname, profilePic: selectedUser.profilePicture || null, lastMessageTime: sentMessage.createdAt || sentMessage.updatedAt || new Date().toISOString() };
        setRecentChatsList(prev => {
          const filtered = prev.filter(c => c._id !== entry._id);
          const updated = [entry, ...filtered];
          AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(updated)).catch(() => {});
          return updated;
        });
        const text2 = sentMessage.message ? sentMessage.message : (sentMessage.fileUrl ? 'File sent' : '');
        setLastMessages(prev => ({ ...prev, [entry._id]: { prefix: 'You: ', text: text2 } }));
      } catch (err) {
        console.log('Error saving message:', err);
        Alert.alert('Error', 'Failed to send message. Please try again.');
        return;
      }

             // Update unread count in recentChats and move to top
       if (setRecentChats && typeof setRecentChats === 'function') {
         setRecentChats(prev => {
           let found = false;
           const updated = prev.map(chat => {
             if (chat.partnerId === selectedUser._id) {
               found = true;
               return { ...chat, unreadCount: 0, lastMessage: msg };
             }
             return chat;
           });
           // If not found, add new chat entry
           if (!found) {
             updated.push({ partnerId: selectedUser._id, lastMessage: msg, unreadCount: 0 });
           }
           // Sort by most recent lastMessage
           return updated.sort((a, b) =>
             new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
           );
         });
       }
    }

    setInput('');
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedParticipants.length === 0) {
      Alert.alert('Error', 'Please enter a group name and select at least one member.');
      return;
    }

    if (selectedParticipants.length > 49) { // 49 + creator = 50 max
      Alert.alert('Error', 'Group cannot have more than 50 participants.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Use the correct API endpoint that matches the backend
      const response = await axios.post(`${API_URL}/group-chats`, {
        name: groupName.trim(),
        description: groupDescription.trim(),
        createdBy: user._id,
        participants: selectedParticipants
      }, { headers });

      if (response.data) {
        const newGroup = response.data;
        
        // Join the group in socket
        socketRef.current?.emit('joinGroup', { userId: user._id, groupId: newGroup._id });
        
        Alert.alert('Success', 'Group chat created successfully!', [
          { text: 'OK', onPress: () => {
            setShowCreateGroupModal(false);
            setGroupName('');
            setGroupDescription('');
            setSelectedParticipants([]);
            // Refresh the groups list
            fetchUserGroups();
            // Navigate back to chat home page to refresh the list
            navigation.goBack();
          }}
        ]);
      }
    } catch (error) {
      console.error('Error creating group:', error);
      let errorMessage = 'Failed to create group';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.error || 'Invalid group data. Please check your input.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      Alert.alert('Error', errorMessage);
    }
  };



  const handleLeaveGroup = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const headers = { 'Authorization': `Bearer ${token}` };
      await axios.post(`${API_URL}/group-chats/${selectedGroup._id}/leave`, {
        userId: user._id,
      }, { headers });

      // Leave the group in socket
      socketRef.current?.emit('leaveGroup', { userId: user._id, groupId: selectedGroup._id });
      
      Alert.alert("Success", "You have left the group", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error leaving group:', error);
      let errorMessage = 'Failed to leave group. Please try again.';
      if (error.response?.status === 400 && error.response?.data?.error?.includes('creator')) {
        errorMessage = "Group creator cannot leave the group.";
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      Alert.alert("Error", errorMessage);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const headers = { 'Authorization': `Bearer ${token}` };
      await axios.post(`${API_URL}/group-chats/${selectedGroup._id}/remove-member`, {
        userId: user._id,
        memberId: memberId,
      }, { headers });

      // Refresh group members
      fetchGroupMembers();
      Alert.alert("Success", "Member removed from group");
    } catch (error) {
      console.error('Error removing member:', error);
      let errorMessage = 'Failed to remove member. Please try again.';
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Only group creator can remove members.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      Alert.alert("Error", errorMessage);
    }
  };

  const toggleParticipantSelection = (userId) => {
    setSelectedParticipants(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Sort messages by timestamp
  const safeMessages = Array.isArray(messages)
    ? [...messages].sort((a, b) => new Date(a.createdAt || a.updatedAt || a.timestamp) - new Date(b.createdAt || b.updatedAt || b.timestamp))
    : [];

  // Unified chat list similar to WebApp components

  // Additional group search results for search functionality

  const additionalGroupSearchResults = (userGroups || [])
    .filter(g => (g.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()))
    .map(g => ({ ...g, type: 'group' }));

  const searchResults = (searchQuery || '').trim() === '' ? [] : [
    ...allGroups.filter(group => (group.name || '').toLowerCase().includes((searchQuery || '').toLowerCase())),
    ...individualConversations.filter(chat => 
      (chat.firstname || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
      (chat.lastname || '').toLowerCase().includes((searchQuery || '').toLowerCase())
    ),
    ...(allUsers || [])
      .filter(userObj => userObj._id !== user._id)
      .filter(userObj => !individualConversations.some(c => c._id === userObj._id))
      .filter(userObj => !allGroups.some(g => g._id === userObj._id))
      .filter(userObj => !dmUserIds.has(userObj._id)) // Exclude users with chat history
      .filter(userObj => (`${userObj.firstname} ${userObj.lastname}`).toLowerCase().includes((searchQuery || '').toLowerCase()))
      .map(userObj => ({ ...userObj, type: 'new_user', isNewUser: true }))
  ];

  // Build comprehensive individual conversations (not just recent):
  const dmUserIds = new Set(Object.keys(dmMessages || {}));
  
  const individualConversations = (() => {
    const map = new Map();
    // From cached dmMessages - show ALL users with messages
    dmUserIds.forEach(id => {
      const msgs = dmMessages[id] || [];
      const u = (allUsers || []).find(x => x._id === id);
      if (!u) return;
      
      if (msgs.length > 0) {
        // User has messages - show as active conversation
        const last = msgs[msgs.length - 1];
        map.set(id, {
          _id: id,
          firstname: u.firstname,
          lastname: u.lastname,
          profilePic: u.profilePic || u.profilePicture || null,
          lastMessageTime: last.createdAt || last.updatedAt || 0,
          hasMessages: true
        });
        if (!lastMessages[id]) {
          const text = last.message ? last.message : (last.fileUrl ? 'File sent' : '');
          const prefix = last.senderId === user._id ? 'You: ' : `${u.firstname || 'Unknown'} ${u.lastname || 'User'}: `;
          lastMessages[id] = { prefix, text };
        }
      }
    });
    
    // Merge in what we discovered from API recents
    (recentChatsList || []).forEach(c => {
      if (!map.has(c._id)) {
        map.set(c._id, { ...c, hasMessages: true });
      }
    });
    
    return Array.from(map.values()).sort((a,b)=> new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0));
  })();

  // Get all users WITHOUT existing conversations for easy access
  const allUsersWithoutChats = (allUsers || [])
    .filter(u => u._id !== user._id && !individualConversations.some(c => c._id === u._id))
    .filter(u => !dmUserIds.has(u._id)) // Exclude users who have any message history
    .sort((a, b) => `${a.firstname} ${a.lastname}`.localeCompare(`${b.firstname} ${b.lastname}`));

  // Show ALL groups regardless of message content
  const allGroups = (userGroups || []).map(group => ({ ...group, type: 'group' }));
  allGroups.sort((a, b) => {
    let aTime = 0;
    let bTime = 0;
    
    const aGroupMessages = groupMsgsById[a._id] || [];
    aTime = aGroupMessages.length > 0 
      ? new Date(aGroupMessages[aGroupMessages.length - 1]?.createdAt || 0).getTime() 
      : (a.createdAt ? new Date(a.createdAt).getTime() : Date.now());
    
    const bGroupMessages = groupMsgsById[b._id] || [];
    bTime = bGroupMessages.length > 0 
      ? new Date(bGroupMessages[bGroupMessages.length - 1]?.createdAt || 0).getTime() 
      : (b.createdAt ? new Date(b.createdAt).getTime() : Date.now());
    
    return bTime - aTime;
  });

  // Helper function to format time ago
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!user || !user._id) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading chat...</Text>
      </View>
    );
  }

  // If no specific chat is selected, show the chat list
  if (!selectedUser && !selectedGroup) {
    console.log('Rendering chat list view');
    return (
      <View style={{ flex: 1, backgroundColor: '#f3f3f3' }}>
        {/* Blue Header */}
        <View style={AdminChatStyle.blueHeaderBackground}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 40, paddingHorizontal: 16 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
              <Text style={{ fontSize: 22, color: '#fff' }}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Chats</Text>
          </View>
        </View>

        {/* Search + Tabs */}
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12 }}>
          <TextInput
            placeholder="Search users or groups..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 10,
              backgroundColor: 'white',
              marginBottom: 10
            }}
          />
        </View>
                    <View style={{ flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16 }}>
              <TouchableOpacity
                onPress={() => setActiveTab('groups')}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderBottomWidth: 2,
                  borderBottomColor: activeTab === 'groups' ? '#00418b' : 'transparent'
                }}
              >
                <Text style={{ color: activeTab === 'groups' ? '#00418b' : '#666', fontWeight: 'bold' }}>Groups</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('individual')}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderBottomWidth: 2,
                  borderBottomColor: activeTab === 'individual' ? '#00418b' : 'transparent'
                }}
              >
                <Text style={{ color: activeTab === 'individual' ? '#666', fontWeight: 'bold' }}>Individual</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('create')}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderBottomWidth: 2,
                  borderBottomColor: activeTab === 'create' ? '#00418b' : 'transparent'
                }}
              >
                <Text style={{ color: activeTab === 'create' ? '#00418b' : '#666', fontWeight: 'bold' }}>Create</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('join')}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderBottomWidth: 2,
                  borderBottomColor: activeTab === 'join' ? '#00418b' : 'transparent'
                }}
              >
                <Text style={{ color: activeTab === 'join' ? '#666', fontWeight: 'bold' }}>Join</Text>
              </TouchableOpacity>
            </View>

        <ScrollView style={{ flex: 1, padding: 16 }}>
          {isLoading && (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 }}>
              <Text>Loading...</Text>
            </View>
          )}
          {!isLoading && activeTab === 'groups' && (
            <View>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20 }}>Groups</Text>
              
              {allGroups.length > 0 ? (
                allGroups.map(group => (
                  <TouchableOpacity
                    key={group._id}
                    onPress={() => navigation.navigate('UnifiedChat', { selectedGroup: group })}
                    style={{ backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#00418b', marginRight: 12, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{(group.name || '').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{group.name}</Text>
                      {!!lastMessages[group._id] ? (
                        <Text style={{ color: '#666', fontSize: 12 }} numberOfLines={1}>
                          {lastMessages[group._id].prefix}{lastMessages[group._id].text}
                        </Text>
                      ) : (
                        <Text style={{ color: '#666', fontSize: 12 }} numberOfLines={1 }}>
                          {(group.participants || []).length} participants • No messages yet
                        </Text>
                      )}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: '#00418b', fontSize: 11, marginBottom: 2 }}>Group</Text>
                      <Text style={{ color: '#999', fontSize: 10 }}>
                        {(() => {
                          const groupMsgs = groupMsgsById[group._id] || [];
                          const lastMsg = groupMsgs[groupMsgs.length - 1];
                          if (lastMsg) {
                            return formatTimeAgo(lastMsg.createdAt || lastMsg.updatedAt);
                          } else {
                            return group.createdAt ? formatTimeAgo(group.createdAt) : 'New';
                          }
                        })()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={{ alignItems: 'center', marginTop: 50 }}>
                  <Text style={{ color: '#888', fontSize: 16, marginBottom: 10 }}>No groups yet</Text>
                  <Text style={{ color: '#666', fontSize: 14, textAlign: 'center' }}>
                    Create a group or join one to get started
                  </Text>
                </View>
              )}
            </View>
          )}

          {!isLoading && activeTab === 'individual' && (
            <View>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20 }}>Active Conversations</Text>
              
              {individualConversations.length > 0 ? (
                individualConversations.map(chat => (
                  <TouchableOpacity
                    key={chat._id}
                    onPress={() => navigation.navigate('UnifiedChat', { selectedUser: { _id: chat._id, firstname: chat.firstname, lastname: chat.lastname, profilePicture: chat.profilePic, role: chat.role || 'students' } })}
                    style={{ backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 }}
                  >
                    <Image source={chat.profilePic ? { uri: chat.profilePic } : require('../assets/profile-icon (2).png')} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{chat.firstname} {chat.lastname}</Text>
                      {!!lastMessages[chat._id] ? (
                        <Text style={{ color: '#666', fontSize: 12 }} numberOfLines={1}>
                          {lastMessages[chat._id].prefix}{lastMessages[chat._id].text}
                        </Text>
                      ) : (
                        <Text style={{ color: '#999', fontSize: 12 }}>Start a conversation</Text>
                      )}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: '#0a7', fontSize: 11, marginBottom: 2 }}>Individual</Text>
                      <Text style={{ color: '#999', fontSize: 10 }}>
                        {formatTimeAgo(chat.lastMessageTime)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={{ alignItems: 'center', marginTop: 50 }}>
                  <Text style={{ color: '#888', fontSize: 16, marginBottom: 10 }}>No conversations yet</Text>
                  <Text style={{ color: '#666', fontSize: 14, textAlign: 'center' }}>
                    Start chatting with someone to see your conversations here
                  </Text>
                </View>
              )}

              <View style={{ marginTop: 30 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15 }}>All Users</Text>
                <Text style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>Click to start new chat</Text>
                
                {allUsersWithoutChats.length > 0 ? (
                  allUsersWithoutChats.map(user => (
                    <TouchableOpacity
                      key={user._id}
                      onPress={() => navigation.navigate('UnifiedChat', { selectedUser: { _id: user._id, firstname: user.firstname, lastname: user.lastname, profilePicture: user.profilePic, role: user.role || 'students' } })}
                      style={{ backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 }}
                    >
                      <Image source={user.profilePic ? { uri: user.profilePic } : require('../assets/profile-icon (2).png')} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{user.firstname} {user.lastname}</Text>
                        <Text style={{ color: '#0a7', fontSize: 12 }}>Click to start new chat</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={{ color: '#888', textAlign: 'center' }}>No users available</Text>
                )}
              </View>
            </View>
          )}

          {!isLoading && activeTab === 'search' && (
            <View>
              {/* Search Users for New Messages */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>Start New Chat</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    placeholder="Search people by name..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: '#ccc',
                      borderRadius: 8,
                      padding: 12,
                      backgroundColor: 'white',
                      fontSize: 16,
                      marginRight: 10
                    }}
                  />
                  {searchQuery && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery('')}
                      style={{
                        backgroundColor: '#ff4444',
                        padding: 12,
                        borderRadius: 8,
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <Text style={{ color: 'white', fontWeight: 'bold' }}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Recent Contacts Section */}
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>
                Recent Contacts
                {searchQuery && (
                  <Text style={{ fontSize: 14, color: '#666', fontWeight: 'normal' }}>
                    {' '}({individualConversations.filter(c => (`${c.firstname} ${c.lastname}`).toLowerCase().includes((searchQuery || '').toLowerCase())).length} found)
                  </Text>
                )}
              </Text>
              {((searchQuery || '').trim() === ''
                ? individualConversations
                : individualConversations.filter(c => (`${c.firstname} ${c.lastname}`).toLowerCase().includes((searchQuery || '').toLowerCase()))
              ).map(chat => (
                <TouchableOpacity
                  key={chat._id}
                  onPress={() => navigation.navigate('UnifiedChat', { selectedUser: { _id: chat._id, firstname: chat.firstname, lastname: chat.lastname, profilePicture: chat.profilePic, role: 'students' } })}
                  style={{ backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 }}
                >
                  <Image source={chat.profilePic ? { uri: chat.profilePic } : require('../assets/profile-icon (2).png')} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{chat.firstname} {chat.lastname}</Text>
                    {!!lastMessages[chat._id] && (
                      <Text style={{ color: '#666', fontSize: 12 }} numberOfLines={1}>
                        {lastMessages[chat._id].prefix}{lastMessages[chat._id].text}
                      </Text>
                    )}
                  </View>
                  <Text style={{ color: '#00418b', fontSize: 11, marginLeft: 8 }}>Active</Text>
                </TouchableOpacity>
              ))}
              {((searchQuery || '').trim() !== '' && individualConversations.filter(c => (`${c.firstname} ${c.lastname}`).toLowerCase().includes((searchQuery || '').toLowerCase())).length === 0) && (
                <Text style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>No direct messages found</Text>
              )}
              {/* Show message when no active conversations */}
              {((searchQuery || '').trim() === '' && (individualConversations || []).length === 0) && (
                <Text style={{ color: '#888', textAlign: 'center', marginTop: 20, marginBottom: 20 }}>No active conversations yet</Text>
              )}

              {/* All Users Section - Always visible for easy access */}
              <View style={{ marginTop: 20 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>
                  All People
                  {searchQuery && (
                    <Text style={{ fontSize: 14, color: '#666', fontWeight: 'normal' }}>
                      {' '}({(() => {
                        const list = (allUsers || [])
                          .filter(u => u._id !== user._id && !individualConversations.some(c => c._id === u._id))
                          .filter(u => (`${u.firstname} ${u.lastname}`).toLowerCase().includes((searchQuery || '').toLowerCase()));
                        return list;
                      })()?.length || 0} found)
                    </Text>
                  )}
                </Text>
                {(() => {
                  const list = (allUsers || [])
                    .filter(u => u._id !== user._id && !individualConversations.some(c => c._id === u._id))
                    .filter(u => (searchQuery || '').trim() === '' || (`${u.firstname} ${u.lastname}`).toLowerCase().includes((searchQuery || '').toLowerCase()));
                  if (list.length === 0) return null;
                  return list;
                })()?.map(u => (
                  <TouchableOpacity
                    key={u._id}
                    onPress={() => navigation.navigate('UnifiedChat', { selectedUser: u })}
                    style={{ backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 }}
                  >
                    <Image source={u.profilePicture ? { uri: u.profilePicture } : require('../assets/profile-icon (2).png')} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{u.firstname} {u.lastname}</Text>
                      <Text style={{ color: '#0a7', fontSize: 12 }}>Click to start new chat</Text>
                    </View>
                    <Text style={{ color: '#0a7', fontSize: 11, marginLeft: 8 }}>New</Text>
                  </TouchableOpacity>
                ))}
                
                {/* Show message when no users found in search */}
                {((searchQuery || '').trim() !== '' && (() => {
                  const list = (allUsers || [])
                    .filter(u => u._id !== user._id && !individualConversations.some(c => c._id === u._id))
                    .filter(u => (`${u.firstname} ${u.lastname}`).toLowerCase().includes((searchQuery || '').toLowerCase()));
                  return list;
                })()?.length === 0) && (
                  <Text style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>No users found matching your search</Text>
                )}
              </View>
            </View>
          )}

          {!isLoading && activeTab === 'create' && (
            <View>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Create New Group</Text>
              <TextInput
                placeholder="Group Name"
                value={groupName}
                onChangeText={setGroupName}
                style={{ 
                  borderWidth: 1, 
                  borderColor: '#ccc', 
                  borderRadius: 5, 
                  padding: 10, 
                  marginBottom: 10,
                  backgroundColor: 'white'
                }}
              />
              <TextInput
                placeholder="Group Description (Optional)"
                value={groupDescription}
                onChangeText={setGroupDescription}
                multiline
                numberOfLines={3}
                style={{ 
                  borderWidth: 1, 
                  borderColor: '#ccc', 
                  borderRadius: 5, 
                  padding: 10, 
                  marginBottom: 10,
                  backgroundColor: 'white',
                  height: 80,
                  textAlignVertical: 'top'
                }}
              />
              
              {/* Search Users for Group Creation */}
              <View style={{ marginBottom: 15 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Search Members</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    placeholder="Search users by name..."
                    value={groupMemberSearch}
                    onChangeText={setGroupMemberSearch}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: '#ccc',
                      borderRadius: 8,
                      padding: 12,
                      backgroundColor: 'white',
                      fontSize: 16,
                      marginRight: 10
                    }}
                  />
                  {groupMemberSearch && (
                    <TouchableOpacity
                      onPress={() => setGroupMemberSearch('')}
                      style={{
                        backgroundColor: '#ff4444',
                        padding: 12,
                        borderRadius: 8,
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <Text style={{ color: 'white', fontWeight: 'bold' }}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              
              <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>
                Select Members:
                {groupMemberSearch && (
                  <Text style={{ fontSize: 14, color: '#666', fontWeight: 'normal' }}>
                    {' '}({(() => {
                      const filteredUsers = (groupMemberSearch || '').trim() === '' 
                        ? allUsers.filter(u => u._id !== user._id) // Exclude current user
                        : allUsers.filter(u => 
                            u._id !== user._id && // Exclude current user
                            `${u.firstname} ${u.lastname}`.toLowerCase().includes(groupMemberSearch.toLowerCase())
                          );
                      return filteredUsers;
                    })()?.length || 0} found)
                  </Text>
                )}
              </Text>
              {(() => {
                const filteredUsers = (groupMemberSearch || '').trim() === '' 
                  ? allUsers.filter(u => u._id !== user._id) // Exclude current user
                  : allUsers.filter(u => 
                      u._id !== user._id && // Exclude current user
                      `${u.firstname} ${u.lastname}`.toLowerCase().includes(groupMemberSearch.toLowerCase())
                    );
                return filteredUsers;
              })().map(u => (
                <TouchableOpacity
                  key={u._id}
                  onPress={() => toggleParticipantSelection(u._id)}
                  style={{ 
                    backgroundColor: selectedParticipants.includes(u._id) ? '#e8f4fd' : 'white', 
                    padding: 15, 
                    borderRadius: 10, 
                    marginBottom: 5,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: selectedParticipants.includes(u._id) ? '#00418b' : '#eee'
                  }}>
                                          <Image
                          source={u.profilePicture ? { uri: u.profilePicture } : require('../assets/profile-icon (2).png')}
                          style={{ width: 30, height: 30, borderRadius: 15, marginRight: 10 }}
                          resizeMode="cover"
                        />
                  <Text style={{ flex: 1 }}>{u.firstname} {u.lastname}</Text>
                  {selectedParticipants.includes(u._id) && (
                    <Text style={{ color: '#00418b', fontWeight: 'bold' }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={handleCreateGroup}
                style={{ 
                  backgroundColor: '#00418b', 
                  padding: 15, 
                  borderRadius: 10, 
                  marginTop: 10,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Create Group</Text>
              </TouchableOpacity>
            </View>
          )}


        </ScrollView>
      </View>
    );
  }

  const isCreator = selectedGroup && selectedGroup.createdBy === user._id;

  // Ensure we have a valid chat target
  if (!chatTarget) {
    console.log('No chat target found, going back');
    navigation.goBack();
    return null;
  }

  console.log('Rendering chat interface for:', chatTarget);

  return (
    <View style={{ flex: 1, backgroundColor: '#f3f3f3' }}>
      {/* Blue Header */}
      <View style={AdminChatStyle.blueHeaderBackground}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 40, paddingHorizontal: 16 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 22, color: '#fff' }}>{'<'}</Text>
          </TouchableOpacity>
          {isGroupChat ? (
            <>
              <View style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 20, 
                backgroundColor: '#fff', 
                marginRight: 12,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#00418b' }}>
                  {selectedGroup.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
                  {selectedGroup.name}
                </Text>
                <Text style={{ color: '#e0e0e0', fontSize: 12 }}>
                  {groupMembers.length} members
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowMembersModal(true)}
                style={{ marginRight: 8 }}
              >
                <Text style={{ color: '#fff', fontSize: 16 }}>👥</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowLeaveModal(true)}>
                <Text style={{ color: '#fff', fontSize: 16 }}>❌</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
                                                <Image
                  source={selectedUser.profilePicture ? { uri: selectedUser.profilePicture } : require('../assets/profile-icon (2).png')}
                  style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12, borderWidth: 2, borderColor: '#fff' }}
                />
              <View>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{selectedUser.firstname} {selectedUser.lastname}</Text>
                <Text style={{ color: '#e0e0e0', fontSize: 12 }}>{selectedUser.role}</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
        style={{ flex: 1, paddingHorizontal: 10, marginTop: 10 }}
      >
        {safeMessages.map((msg, idx) => {
          const isMe = String(msg.senderId) === String(user._id);
          
          if (isGroupChat) {
            const sender = groupMembers.find(member => member._id === msg.senderId);
            return (
              <View
                key={idx}
                style={{
                  flexDirection: 'row',
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                  marginVertical: 4,
                }}
              >
                {!isMe && (
                  <Image
                    source={sender?.profilePicture ? { uri: sender.profilePicture } : require('../assets/profile-icon (2).png')}
                    style={{ width: 28, height: 28, borderRadius: 14, marginRight: 6, alignSelf: 'flex-end' }}
                  />
                )}
                <View
                  style={{
                    backgroundColor: isMe ? '#00418b' : '#e5e5ea',
                    borderRadius: 18,
                    padding: 12,
                    maxWidth: '75%',
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    shadowColor: '#000',
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    marginLeft: isMe ? 40 : 0,
                    marginRight: isMe ? 0 : 4,
                  }}
                >
                  {!isMe && (
                    <Text style={{ color: isMe ? '#fff' : '#222', fontWeight: '500', marginBottom: 2, fontSize: 12 }}>
                      {msg.senderName || sender?.firstname || 'Unknown'}
                    </Text>
                  )}
                  <Text style={{ color: isMe ? '#fff' : '#222' }}>{msg.message}</Text>
                  <Text style={{ color: isMe ? '#d1eaff' : '#888', fontSize: 10, alignSelf: 'flex-end', marginTop: 4 }}>
                    {(() => { const ts = msg.createdAt || msg.updatedAt || msg.timestamp; return ts ? new Date(ts).toLocaleTimeString() : ''; })()}
                  </Text>
                </View>
              </View>
            );
          } else {
            return (
              <View
                key={idx}
                style={{
                  flexDirection: 'row',
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                  marginVertical: 4,
                }}
              >
                {!isMe && (
                  <Image
                    source={selectedUser.profilePicture ? { uri: selectedUser.profilePicture } : require('../assets/profile-icon (2).png')}
                    style={{ width: 28, height: 28, borderRadius: 14, marginRight: 6, alignSelf: 'flex-end' }}
                  />
                )}
                <View
                  style={{
                    backgroundColor: isMe ? '#00418b' : '#e5e5ea',
                    borderRadius: 18,
                    padding: 12,
                    maxWidth: '75%',
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    shadowColor: '#000',
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    marginLeft: isMe ? 40 : 0,
                    marginRight: isMe ? 0 : 4,
                  }}
                >
                  <Text style={{ color: isMe ? '#fff' : '#222', fontWeight: '500', marginBottom: 2 }}>
                    {isMe ? 'You' : selectedUser.firstname}
                  </Text>
                  <Text style={{ color: isMe ? '#fff' : '#222' }}>{msg.message}</Text>
                  <Text style={{ color: isMe ? '#d1eaff' : '#888', fontSize: 10, alignSelf: 'flex-end', marginTop: 4 }}>
                    {(() => { const ts = msg.createdAt || msg.updatedAt || msg.timestamp; return ts ? new Date(ts).toLocaleTimeString() : ''; })()}
                  </Text>
                </View>
              </View>
            );
          }
        })}
      </ScrollView>

      {/* Input */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderTopWidth: 1,
        borderColor: '#eee',
        backgroundColor: '#fff',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
      }}>
        <TouchableOpacity onPress={async () => {
          try {
            const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
            if (!result.canceled) {
              const file = result.assets?.[0];
              if (file) setSelectedFile(file);
            }
          } catch {}
        }} style={{ marginRight: 8 }}>
          <Text style={{ fontSize: 18 }}>📎</Text>
        </TouchableOpacity>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 20,
            paddingHorizontal: 15,
            paddingVertical: 10,
            marginRight: 8,
            backgroundColor: '#f9f9f9',
            fontSize: 15,
          }}
        />
        <TouchableOpacity onPress={handleSend} style={{
          backgroundColor: '#00418b',
          borderRadius: 20,
          padding: 12,
        }}>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>➤</Text>
        </TouchableOpacity>
      </View>
      {selectedFile && (
        <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
          <Text style={{ fontSize: 12, color: '#666' }}>Attached: {selectedFile.name || 'file'}</Text>
        </View>
      )}

      {/* Group Members Modal */}
      {isGroupChat && (
        <Modal
          visible={showMembersModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowMembersModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: 'white', borderRadius: 10, padding: 20, width: '90%', maxHeight: '80%' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Group Members</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 12, color: '#555' }}>Group ID: <Text style={{ fontFamily: 'monospace' }}>{selectedGroup?._id}</Text></Text>
                <TouchableOpacity onPress={() => { try { navigator.clipboard?.writeText?.(selectedGroup?._id || ''); } catch {} }}>
                  <Text style={{ color: '#00418b', fontSize: 12 }}>Copy</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={groupMembers}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                          <Image
                      source={item.profilePicture ? { uri: item.profilePicture } : require('../assets/profile-icon (2).png')}
                      style={{ width: 30, height: 30, borderRadius: 15, marginRight: 10 }}
                    />
                      <Text>{item.firstname} {item.lastname}</Text>
                      {item._id === selectedGroup.createdBy && (
                        <Text style={{ color: '#00418b', fontSize: 12, marginLeft: 5 }}>(Creator)</Text>
                      )}
                      {selectedGroup.admins?.includes?.(item._id) && (
                        <Text style={{ color: '#0ea5e9', fontSize: 12, marginLeft: 5 }}>(Admin)</Text>
                      )}
                    </View>
                    {isCreator && item._id !== user._id && (
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert(
                            "Remove Member",
                            `Are you sure you want to remove ${item.firstname} ${item.lastname}?`,
                            [
                              { text: "Cancel", style: "cancel" },
                              { text: "Remove", style: "destructive", onPress: () => handleRemoveMember(item._id) }
                            ]
                          );
                        }}
                        style={{ backgroundColor: '#ff4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 }}
                      >
                        <Text style={{ color: 'white', fontSize: 12 }}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              />
              <TouchableOpacity
                onPress={() => setShowMembersModal(false)}
                style={{ backgroundColor: '#00418b', padding: 10, borderRadius: 5, marginTop: 15 }}
              >
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Leave Group Modal */}
      {isGroupChat && (
        <Modal
          visible={showLeaveModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowLeaveModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: 'white', borderRadius: 10, padding: 20, width: '90%' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Leave Group</Text>
              <Text style={{ marginBottom: 20 }}>
                Are you sure you want to leave "{selectedGroup.name}"? You will no longer be able to send or receive messages in this group.
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity
                  onPress={() => setShowLeaveModal(false)}
                  style={{ backgroundColor: '#ccc', padding: 10, borderRadius: 5, flex: 1, marginRight: 10 }}
                >
                  <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleLeaveGroup}
                  style={{ backgroundColor: '#ff4444', padding: 10, borderRadius: 5, flex: 1, marginLeft: 10 }}
                >
                  <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Leave Group</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
} 