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
  FlatList,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Platform
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useUser } from './UserContext';
import classSocketService from '../services/classSocketService';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '../NotificationContext';
import NotificationCenter from './NotificationCenter';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AdminChatStyle from './styles/administrator/AdminChatStyle';
import StudentDashboardStyle from './styles/Stud/StudentDashStyle';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { getAuthHeaders, handleApiError } from '../utils/apiUtils';


const API_URL = 'https://juanlms-webapp-server.onrender.com';
const SOCKET_URL = 'https://juanlms-webapp-server.onrender.com';
// Role restrictions removed: all roles may use direct messages

export default function UnifiedChat() {
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedUser: routeSelectedUser, selectedGroup: routeSelectedGroup, setRecentChats } = route.params || {};
  const { user, setUser, loading: userLoading } = useUser();
  const [uploading, setUploading] = useState(false);
  
  // Internal state for managing selected chat (overrides route params)
  const [selectedUser, setSelectedUser] = useState(routeSelectedUser);
  const [selectedGroup, setSelectedGroup] = useState(routeSelectedGroup);
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
  const [joinGroupId, setJoinGroupId] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [recentChatsList, setRecentChatsList] = useState([]); // unified recent individual chats
  const [dmMessages, setDmMessages] = useState({}); // per-user messages cache
  const [groupMsgsById, setGroupMsgsById] = useState({}); // per-group messages cache
  const [lastMessages, setLastMessages] = useState({}); // preview text per chat/group
  const [searchQuery, setSearchQuery] = useState('');
  const [createTabSearchQuery, setCreateTabSearchQuery] = useState('');
  const [joinTabSearchQuery, setJoinTabSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('chats'); // 'chats', 'create', 'join'
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null); // Keep for backward compatibility
  const [selectedFiles, setSelectedFiles] = useState([]); // New for multiple files
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false); // Loading state for multiple files
  
  // Backend search states (similar to web app)
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  // Advanced search states
  const [advancedSearchResults, setAdvancedSearchResults] = useState([]);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [academicContext, setAcademicContext] = useState('2025-2026 | Term 1');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  
  // Notification state
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  let unreadCount = 0;
  try {
    const { unreadCount: count } = useNotifications();
    unreadCount = count;
  } catch (error) {
    console.error('Error getting notification count:', error);
  }
  const scrollViewRef = useRef();

  // Auto-refresh and highlight states (from web app)
  const [highlightedChats, setHighlightedChats] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(user?._id);
  
  // Performance optimization states
  const [fetchedGroupPreviewIds, setFetchedGroupPreviewIds] = useState(new Set());
  const [isLoadingGroupPreviews, setIsLoadingGroupPreviews] = useState(false);
  const [isRefreshingChats, setIsRefreshingChats] = useState(false);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  const isGroupChat = !!selectedGroup;
  const chatTarget = isGroupChat ? selectedGroup : selectedUser;
  const RECENTS_KEY = 'recentChats_mobile';

  // Helper function to detect if URL is an image
  const isImageUrl = (url) => {
    if (!url) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.includes(ext)) || lowerUrl.includes('image');
  };

  // Helper function to get full URL
  const getFullUrl = (url) => {
    if (!url) return null;
    return String(url).startsWith('http') ? url : `${API_URL?.replace(/\/$/, '')}/${String(url).replace(/^\//, '')}`;
  };

  // Helper function to render attachments
  const renderAttachments = (message, isMe) => {
    const attachments = message.attachments || [];
    const hasOldFile = message.fileUrl;
    
    // If new attachments exist, use them
    if (attachments.length > 0) {
      return (
        <View style={{ marginTop: message.message ? 6 : 0 }}>
          {attachments.map((attachment, index) => (
            <View key={index} style={{ marginBottom: 4 }}>
              {attachment.fileType === 'image' ? (
                <TouchableOpacity 
                  onPress={() => {
                    setSelectedImageUrl(getFullUrl(attachment.url));
                    setShowImageModal(true);
                  }}
                  style={{ marginBottom: 4 }}
                >
                  <Image 
                    source={{ uri: getFullUrl(attachment.thumbnailUrl || attachment.url) }}
                    style={{ 
                      width: 200, 
                      height: 150, 
                      borderRadius: 8,
                      backgroundColor: '#f0f0f0'
                    }}
                    resizeMode="cover"
                  />
                  <Text style={{ color: isMe ? '#d1eaff' : '#666', fontSize: 10, marginTop: 2 }}>
                    {attachment.name}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => {
                  try {
                    const Linking = require('react-native').Linking;
                    Linking.openURL(getFullUrl(attachment.url));
                  } catch {}
                }}>
                  <Text style={{ color: isMe ? '#d1eaff' : '#666', fontSize: 12 }}>
                    📎 {attachment.name}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      );
    }
    
    // Fallback to old fileUrl for backward compatibility
    if (hasOldFile) {
      const isImage = isImageUrl(message.fileUrl);
      if (isImage) {
        return (
          <TouchableOpacity 
            onPress={() => {
              setSelectedImageUrl(getFullUrl(message.fileUrl));
              setShowImageModal(true);
            }}
            style={{ marginTop: message.message ? 6 : 0 }}
          >
            <Image 
              source={{ uri: getFullUrl(message.fileUrl) }}
              style={{ 
                width: 200, 
                height: 150, 
                borderRadius: 8,
                backgroundColor: '#f0f0f0'
              }}
              resizeMode="cover"
            />
            <Text style={{ color: isMe ? '#d1eaff' : '#666', fontSize: 10, marginTop: 2 }}>
              {String(message.fileUrl).split('/').pop()}
            </Text>
          </TouchableOpacity>
        );
      } else {
        return (
          <TouchableOpacity onPress={() => {
            try {
              const Linking = require('react-native').Linking;
              Linking.openURL(getFullUrl(message.fileUrl));
            } catch {}
          }}>
            <Text style={{ color: isMe ? '#d1eaff' : '#666', fontSize: 12, marginTop: message.message ? 6 : 0 }}>
              📎 {String(message.fileUrl).split('/').pop()}
            </Text>
          </TouchableOpacity>
        );
      }
    }
    
    return null;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load highlighted chats from storage (from web app)
  useEffect(() => {
    const loadHighlightedChats = async () => {
      try {
        const stored = await AsyncStorage.getItem('highlightedChats_mobile');
        if (stored) {
          setHighlightedChats(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading highlighted chats:', error);
      }
    };
    loadHighlightedChats();
  }, []);

  // Auto-refresh recent conversations (from web app) - less aggressive to preserve chats
  useEffect(() => {
    if (!currentUserId) return;
    const id = setInterval(async () => {
      try { 
        // Only refresh if not currently in a chat and not actively searching to avoid disrupting user experience
        if (!selectedUser && !selectedGroup && !isAutoRefreshing && !searchQuery.trim()) {
          setIsAutoRefreshing(true);
          
          // Store current chat list before refresh to prevent flickering
          const currentChats = [...recentChatsList];
          
          try {
            await fetchRecentConversations(true); // preserveExisting = true
          } catch (refreshError) {
            console.error('Auto-refresh error:', refreshError);
            // Restore previous chat list if refresh fails
            setRecentChatsList(currentChats);
          }
          
          setIsAutoRefreshing(false);
        }
      } catch (error) {
        console.error('Auto-refresh error:', error);
        setIsAutoRefreshing(false);
      }
    }, 60000); // Increased to 60s to be much less aggressive
    return () => clearInterval(id);
  }, [currentUserId, selectedUser, selectedGroup, isAutoRefreshing, recentChatsList, searchQuery]);

  // Clean up corrupted data in recentChats (similar to web app) - less aggressive
  useEffect(() => {
    const cleanupCorruptedData = async () => {
      try {
        const stored = await AsyncStorage.getItem(RECENTS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // More lenient cleaning - only remove entries that are completely invalid
          const cleaned = parsed.filter(chat => 
            chat && 
            chat._id && 
            (chat.firstname || chat.lastname) && // At least one name required
            chat._id !== 'undefined' && 
            chat._id !== 'null' &&
            typeof chat._id === 'string' &&
            chat._id.length > 0
          );
          
          // Only update if we actually removed something and it's significant
          if (cleaned.length < parsed.length && (parsed.length - cleaned.length) > 0) {
            console.log(`Cleaned ${parsed.length - cleaned.length} corrupted chat entries`);
            await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(cleaned));
            setRecentChatsList(cleaned);
          }
        }
      } catch (error) {
        console.error('Error cleaning corrupted data:', error);
        // Don't remove all data on error - try to preserve what we can
        try {
          const stored = await AsyncStorage.getItem(RECENTS_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Keep the data even if it's partially corrupted
              setRecentChatsList(parsed.filter(chat => chat && chat._id));
            }
          }
        } catch {}
      }
    };
    
    cleanupCorruptedData();
  }, []);

  // Fetch active academic year and term for header context
  useEffect(() => {
    const fetchAcademicContext = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        const res = await fetch(`${API_URL}/api/academic-year/active`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          console.log('Academic context response:', data);
          if (data && data.success && data.academicYear) {
            setAcademicContext(`${data.academicYear.year} | ${data.academicYear.currentTerm}`);
          } else {
            // Fallback: try direct schoolyear + terms approach
            try {
              const yearRes = await fetch(`${API_URL}/api/schoolyears/active`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (yearRes.ok) {
                const year = await yearRes.json();
                const schoolYearName = `${year.schoolYearStart}-${year.schoolYearEnd}`;
                const termsRes = await fetch(`${API_URL}/api/terms/schoolyear/${schoolYearName}`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (termsRes.ok) {
                  const terms = await termsRes.json();
                  const active = Array.isArray(terms) ? terms.find(t => t.status === 'active') : null;
                  if (active) {
                    setAcademicContext(`${schoolYearName} | ${active.termName}`);
                  }
                }
              }
            } catch (fallbackErr) {
              console.log('Fallback academic fetch failed:', fallbackErr);
            }
          }
        }
      } catch (err) {
        console.log('Academic context fetch error:', err);
        // leave default on error
      }
    };
    fetchAcademicContext();
  }, []);

  // Refresh user directory when screen gains focus so newly created users appear
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      try { fetchUsers(); } catch {}
    });
    return unsubscribe;
  }, [navigation]);

  // Opportunistic refresh while typing a search if list is small (stale cache)
  useEffect(() => {
    if ((searchQuery || '').trim().length > 0 && (allUsers || []).length < 5) {
      try { fetchUsers(); } catch {}
    }
  }, [searchQuery]);

  // Enhanced debounced backend search with advanced results (similar to web app)
  useEffect(() => {
    const term = (searchQuery || '').trim();
    if (term === '') { 
      setSearchedUsers([]); 
      setAdvancedSearchResults([]);
      setShowSearchDropdown(false);
      setShowAdvancedSearch(false);
      return; 
    }
    
    setIsSearching(true);
    setShowSearchDropdown(true);
    setShowAdvancedSearch(true);
    
    const handle = setTimeout(async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/users/search`, {
          params: { q: term },
          headers
        });
        
        const arr = Array.isArray(response.data) ? response.data : [];
        
        // Create advanced search results similar to web app
        const advancedResults = [
          // First show existing chats/groups that match (active conversations)
          ...individualChats.filter(chat => {
            return (
              (chat.firstname || '').toLowerCase().includes(term.toLowerCase()) ||
              (chat.lastname || '').toLowerCase().includes(term.toLowerCase())
            );
          }),
          ...groupChats.filter(chat => {
            return (chat.name || '').toLowerCase().includes(term.toLowerCase());
          }),
          // Then show backend user results not already in recent chats
          ...arr
            .filter(user => user._id !== user?._id)
            .filter(user => !recentChatsList.some(chat => chat._id === user._id))
            .map(user => ({ ...user, type: 'new_user', isNewUser: true }))
        ];
        
        setAdvancedSearchResults(advancedResults);
        
        // Filter out current user and users already in recent chats for simple search
        const filteredUsers = arr.filter(user => 
          user._id !== user?._id && 
          !recentChatsList.some(chat => chat._id === user._id)
        );
        
        setSearchedUsers(filteredUsers);
      } catch (error) {
        console.error('Backend search error:', error);
        setSearchedUsers([]);
        setAdvancedSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce like web app
    
    return () => clearTimeout(handle);
  }, [searchQuery, recentChatsList, individualChats, groupChats]);

  const formatDateTime = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Chat highlighting functions (from web app)
  const addHighlightedChat = async (chatId) => {
    try {
      const newHighlights = [...highlightedChats, chatId];
      setHighlightedChats(newHighlights);
      await AsyncStorage.setItem('highlightedChats_mobile', JSON.stringify(newHighlights));
    } catch (error) {
      console.error('Error adding highlighted chat:', error);
    }
  };

  const removeHighlightedChat = async (chatId) => {
    try {
      const newHighlights = highlightedChats.filter(id => id !== chatId);
      setHighlightedChats(newHighlights);
      await AsyncStorage.setItem('highlightedChats_mobile', JSON.stringify(newHighlights));
    } catch (error) {
      console.error('Error removing highlighted chat:', error);
    }
  };

  // Remove individual chat from recent list (similar to web app)
  const removeFromRecent = async (chatId) => {
    if (!chatId) return;
    
    try {
      // Remove from recentChatsList
      setRecentChatsList(prev => {
        const updated = prev.filter(chat => chat._id !== chatId);
        AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
        return updated;
      });
      
      // Remove from dmMessages cache
      setDmMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[chatId];
        return newMessages;
      });
      
      // Remove from lastMessages cache
      setLastMessages(prev => {
        const newLastMessages = { ...prev };
        delete newLastMessages[chatId];
        return newLastMessages;
      });
      
      // Clear selection if this was the selected chat
      if (selectedUser && selectedUser._id === chatId) {
        setSelectedUser(null);
      }
      
      // Remove from highlighted chats
      removeHighlightedChat(chatId);
      
    } catch (error) {
      console.error('Error removing chat from recent:', error);
    }
  };

  // Bump chat to top of recent list (similar to web app)
  const bumpChatToTop = async (chatUser) => {
    if (!chatUser || !chatUser._id) return;
    
    try {
      setRecentChatsList(prev => {
        const existingIndex = prev.findIndex(chat => chat._id === chatUser._id);
        let updated;
        
        if (existingIndex === -1) {
          // Add new chat to the top with manuallyAdded flag
          updated = [{ ...chatUser, manuallyAdded: true }, ...prev];
        } else if (existingIndex > 0) {
          // Move existing chat to the top and mark as manually added
          updated = [
            { ...prev[existingIndex], manuallyAdded: true },
            ...prev.slice(0, existingIndex),
            ...prev.slice(existingIndex + 1)
          ];
        } else {
          // Already at top, just mark as manually added
          updated = prev.map((chat, index) => 
            index === 0 ? { ...chat, manuallyAdded: true } : chat
          );
        }
        
        AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Error bumping chat to top:', error);
    }
  };

  // Manually preserve a chat (prevent it from being auto-removed)
  const preserveChat = async (chatId) => {
    if (!chatId) return;
    
    try {
      setRecentChatsList(prev => {
        const updated = prev.map(chat => 
          chat._id === chatId ? { ...chat, manuallyAdded: true } : chat
        );
        AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Error preserving chat:', error);
    }
  };

  const isChatHighlighted = (chatId) => {
    return highlightedChats.includes(chatId);
  };

  const resolveProfileUri = () => {
    const API_BASE = 'https://juanlms-webapp-server.onrender.com';
    const uri = user?.profilePic || user?.profilePicture;
    if (!uri) return null;
    if (typeof uri === 'string' && uri.startsWith('/uploads/')) return API_BASE + uri;
    return uri;
  };

  // Socket integration for real-time messaging (similar to activities)
  const initializeSocketForMessages = async () => {
    try {
      console.log('[UnifiedChat] Initializing socket for real-time messaging');
      console.log('[UnifiedChat] User ID:', user?._id);
      
      if (!user || !user._id) {
        console.error('[UnifiedChat] Cannot initialize socket - user not found');
        return;
      }

      const socket = await classSocketService.initialize(user._id);
      
      if (!socket) {
        console.error('[UnifiedChat] Socket initialization failed');
        return;
      }

      console.log('[UnifiedChat] Socket initialized successfully');
      
      // Set up event listeners for message updates
      classSocketService.addEventListener('receiveMessage', handleReceiveMessage);
      classSocketService.addEventListener('receiveGroupMessage', handleReceiveGroupMessage);
      
      console.log('[UnifiedChat] All message event listeners set up');
      
      // Test connection
      setTimeout(() => {
        if (classSocketService.isSocketConnected()) {
          console.log('[UnifiedChat] Socket connection verified - ready for real-time messaging');
        } else {
          console.warn('[UnifiedChat] Socket connection verification failed');
        }
      }, 2000);
      
    } catch (error) {
      console.error('[UnifiedChat] Error initializing socket for messaging:', error);
      console.error('[UnifiedChat] Error details:', {
        message: error.message,
        stack: error.stack,
        userId: user?._id
      });
    }
  };

  // Socket event handlers for messages (similar to activity handlers)
  const handleReceiveMessage = (data) => {
    try {
      console.log('[UnifiedChat] New message received:', data);
      
      if (!data || !data.senderId) {
        console.error('[UnifiedChat] Invalid message data:', data);
        return;
      }

      console.log('[UnifiedChat] Adding message to state:', data);
      
      // Update messages state immediately for real-time UI
      setMessages(prev => {
        const newMessages = [...prev, data];
        console.log('[UnifiedChat] Updated messages array length:', newMessages.length);
        return newMessages;
      });

      // Update DM messages cache
      setDmMessages(prev => {
        const list = prev[data.senderId] || [];
        return { ...prev, [data.senderId]: [...list, data] };
      });

      // Update recent chats list
      const u = allUsers.find(x => x._id === data.senderId);
      const entry = { 
        _id: data.senderId, 
        firstname: u?.firstname || '', 
        lastname: u?.lastname || '', 
        profilePic: u?.profilePic || u?.profilePicture || null, 
        lastMessageTime: new Date().toISOString() 
      };
      setRecentChatsList(prev => {
        const filtered = prev.filter(c => c._id !== entry._id);
        const updated = [entry, ...filtered];
        AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });

      // Update last messages preview
      const text = data.message ? data.message : (data.fileUrl ? 'File sent' : '');
      setLastMessages(prev => ({ ...prev, [entry._id]: { prefix: 'You: ', text } }));

      // Add highlight for new message (if not from current user)
      if (data.senderId !== user._id) {
        addHighlightedChat(entry._id);
      }
      
    } catch (error) {
      console.error('[UnifiedChat] Error handling received message:', error);
    }
  };

  const handleReceiveGroupMessage = (data) => {
    try {
      console.log('[UnifiedChat] New group message received:', data);
      
      if (!data || !data.groupId) {
        console.error('[UnifiedChat] Invalid group message data:', data);
        return;
      }

      console.log('[UnifiedChat] Adding group message to state:', data);
      
      // Stamp device time for immediate UI
      const incoming = { ...data, createdAt: new Date().toISOString() };
      
      // Update messages state immediately for real-time UI
      setMessages(prev => {
        const newMessages = [...prev, incoming];
        console.log('[UnifiedChat] Updated messages array length:', newMessages.length);
        return newMessages;
      });

      // Update group messages cache
      setGroupMsgsById(prev => ({
        ...prev,
        [data.groupId]: [ ...(prev[data.groupId] || []), incoming ]
      }));

      // Update user groups order (move to top)
      setUserGroups(prev => {
        const arr = [...prev];
        const idx = arr.findIndex(g => g._id === data.groupId);
        if (idx > -1) { 
          const g = arr.splice(idx,1)[0]; 
          return [g, ...arr]; 
        }
        return prev;
      });

      // Update last messages preview
      const text = incoming.text ? incoming.text : (incoming.fileUrl ? 'File sent' : '');
      setLastMessages(prev => ({ 
        ...prev, 
        [data.groupId]: { 
          prefix: incoming.senderId === user._id ? 'You: ' : `${incoming.senderName || 'Unknown User'}: `, 
          text 
        } 
      }));

      // Add highlight for new group message (if not from current user)
      if (incoming.senderId !== user._id) {
        addHighlightedChat(data.groupId);
      }
      
    } catch (error) {
      console.error('[UnifiedChat] Error handling received group message:', error);
    }
  };

  // Update currentUserId when user changes
  useEffect(() => {
    setCurrentUserId(user?._id);
  }, [user]);

  useEffect(() => {
    if (!user || !user._id) {
      console.log('No user found, showing loading state');
      return;
    }

    console.log('UnifiedChat useEffect - selectedUser:', selectedUser, 'selectedGroup:', selectedGroup);

    // If no specific chat is selected, show the chat list
    if (!selectedUser && !selectedGroup) {
      console.log('No specific chat selected, fetching users and groups');
      console.log('Current user role:', user?.role);
      console.log('Current user ID:', user?._id);
      setIsLoading(true);
      Promise.all([fetchUsers(), fetchUserGroups(), loadRecentChats()])
        .then(() => fetchRecentConversations())
        .finally(() => { setIsLoading(false); });
      return;
    }

    // Validate that we have a valid selectedUser for individual chat
    if (selectedUser && (!selectedUser._id || !selectedUser.firstname)) {
      console.log('Invalid selectedUser, clearing selection');
      setSelectedUser(null);
      return;
    }

    // Validate that we have a valid selectedGroup for group chat
    if (selectedGroup && (!selectedGroup._id || !selectedGroup.name)) {
      console.log('Invalid selectedGroup, clearing selection');
      setSelectedGroup(null);
      return;
    }

    // Role restrictions removed: allow DM regardless of role

    console.log('Current user:', user);
    console.log('Chat target:', chatTarget);

    if (isGroupChat) {
      // Fetch group messages (mobile backend route)
      (async () => {
        try {
          console.log('Fetching group messages for groupId:', selectedGroup._id);
          const res = await axios.get(`${API_URL}/group-chats/${selectedGroup._id}/messages?userId=${user._id}`);
          console.log('Group messages fetched successfully:', res.data);
          setMessages(res.data);
        } catch (err) {
          console.log('Error fetching group messages:', err);
          console.log('Error response:', err.response?.data);
          setMessages([]);
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

    // Initialize socket service for real-time messaging
    initializeSocketForMessages();

    if (isGroupChat) {
      console.log('[UnifiedChat] Joining group chat:', selectedGroup._id);
      classSocketService.joinGroup({ userId: user._id, groupId: selectedGroup._id });
    } else {
      // Join direct chat room
      const directChatId = [user._id, selectedUser._id].sort().join('-');
      console.log('[UnifiedChat] Joining direct chat:', directChatId);
      classSocketService.joinChat(directChatId);
    }

    return () => {
      // Clean up when leaving chat
      if (isGroupChat) {
        console.log('[UnifiedChat] Leaving group chat:', selectedGroup._id);
        classSocketService.leaveGroup({ userId: user._id, groupId: selectedGroup._id });
      } else if (selectedUser) {
        const directChatId = [user._id, selectedUser._id].sort().join('-');
        console.log('[UnifiedChat] Leaving direct chat:', directChatId);
        classSocketService.leaveChat(directChatId);
      }
    };
  }, [selectedUser, selectedGroup, user]);

  const fetchUsers = async () => {
    try {
      const headers = await getAuthHeaders();
      
      // Use the same endpoint as the web app for consistency
      const response = await axios.get(`${API_URL}/users/active`, {
        headers
      });
      
      if (response.data) {
        const userArray = Array.isArray(response.data) ? response.data : (response.data?.users || response.data?.data || []);
        // Normalize and de-duplicate by id; ignore partial/undefined profiles
        const byId = new Map();
        (userArray || []).forEach(u => {
          if (!u || !u._id || u._id === user._id) return;
          const fn = (u.firstname || '').toString();
          const ln = (u.lastname || '').toString();
          if (!fn || !ln || fn === 'undefined' || ln === 'undefined') return;
          if (!byId.has(u._id)) byId.set(u._id, u);
        });
        const otherUsers = Array.from(byId.values());
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

  const fetchRecentConversations = async (preserveExisting = true) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      let allMsgs = [];
      
      // Get existing chats to preserve them - don't clear the list during refresh
      const existingChats = preserveExisting ? [...recentChatsList] : [];
      const existingChatIds = new Set(existingChats.map(chat => chat._id));
      
      // Don't clear the chat list during auto-refresh to prevent flickering
      if (!preserveExisting) {
        setRecentChatsList([]);
      }
      
      try {
        const res = await axios.get(`${API_URL}/messages/user/${user._id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        allMsgs = Array.isArray(res.data) ? res.data : [];
      } catch (e) {
        // Fallback: fetch messages per user
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
      
      // Build new chat list from API data
      const newChats = [];
      if (allMsgs.length > 0) {
        const map = new Map();
        allMsgs.forEach(m => {
          const otherId = m.senderId === user._id ? m.receiverId : m.senderId;
          if (!map.has(otherId)) map.set(otherId, []);
          map.get(otherId).push(m);
        });
        
        map.forEach((msgs, otherUserId) => {
          const u = allUsers.find(x => x._id === otherUserId);
          if (!u) return;
          msgs.sort((a,b)=> new Date(a.createdAt||a.updatedAt) - new Date(b.createdAt||b.updatedAt));
          const last = msgs[msgs.length-1];
          
          // Extended time filter: 90 days instead of 30, and always include if user manually added
          const lastMessageDate = new Date(last.createdAt || last.updatedAt);
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
          
          // Include if recent message OR if user manually added this chat
          const isRecentMessage = lastMessageDate >= ninetyDaysAgo;
          const isManuallyAdded = existingChatIds.has(otherUserId);
          
          if (isRecentMessage || isManuallyAdded) {
            newChats.push({ 
              _id: otherUserId, 
              firstname: u.firstname, 
              lastname: u.lastname, 
              profilePic: u.profilePic || u.profilePicture || null, 
              lastMessageTime: last.createdAt || last.updatedAt,
              manuallyAdded: isManuallyAdded && !isRecentMessage // Flag for manually added chats
            });
            
            // Update last message preview
            const text = last.message ? last.message : (last.fileUrl ? 'File sent' : '');
            const prefix = last.senderId === user._id ? 'You: ' : `${u.firstname || 'Unknown'} ${u.lastname || 'User'}: `;
            setLastMessages(prev => ({ ...prev, [otherUserId]: { prefix, text } }));
          }
        });
      } else {
        // Fallback: use cached messages
        (allUsers || []).forEach(u => {
          const msgs = dmMessages[u._id] || [];
          if (msgs.length > 0) {
            const last = msgs[msgs.length - 1];
            
            // Extended time filter: 90 days instead of 30
            const lastMessageDate = new Date(last.createdAt || last.updatedAt);
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            
            const isRecentMessage = lastMessageDate >= ninetyDaysAgo;
            const isManuallyAdded = existingChatIds.has(u._id);
            
            if (isRecentMessage || isManuallyAdded) {
              newChats.push({ 
                _id: u._id, 
                firstname: u.firstname, 
                lastname: u.lastname, 
                profilePic: u.profilePic || u.profilePicture || null, 
                lastMessageTime: last.createdAt || last.updatedAt,
                manuallyAdded: isManuallyAdded && !isRecentMessage
              });
              const text = last.message ? last.message : (last.fileUrl ? 'File sent' : '');
              const prefix = last.senderId === user._id ? 'You: ' : `${u.firstname || 'Unknown'} ${u.lastname || 'User'}: `;
              setLastMessages(prev => ({ ...prev, [u._id]: { prefix, text } }));
            }
          }
        });
      }
      
      // Merge existing chats with new ones, preserving manually added chats
      const mergedChats = [...newChats];
      existingChats.forEach(existingChat => {
        if (!mergedChats.some(chat => chat._id === existingChat._id)) {
          // Preserve manually added chats even if no recent messages
          mergedChats.push({
            ...existingChat,
            manuallyAdded: true
          });
        } else {
          // Update existing chat with new data while preserving manually added flag
          const existingIndex = mergedChats.findIndex(chat => chat._id === existingChat._id);
          if (existingIndex !== -1) {
            mergedChats[existingIndex] = {
              ...mergedChats[existingIndex],
              manuallyAdded: existingChat.manuallyAdded || mergedChats[existingIndex].manuallyAdded
            };
          }
        }
      });
      
      // Sort by last message time, but keep manually added chats visible
      mergedChats.sort((a, b) => {
        // Manually added chats without recent messages go to bottom but stay visible
        if (a.manuallyAdded && !a.lastMessageTime) return 1;
        if (b.manuallyAdded && !b.lastMessageTime) return -1;
        
        const aTime = new Date(a.lastMessageTime || 0).getTime();
        const bTime = new Date(b.lastMessageTime || 0).getTime();
        return bTime - aTime;
      });
      
      setRecentChatsList(mergedChats);
      AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(mergedChats)).catch(() => {});
      
    } catch (e) {
      console.log('Error building recent conversations', e);
      // Don't clear existing chats on error - preserve what we have
      if (!preserveExisting) {
        setRecentChatsList([]);
      }
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
        // Lazy load group message previews for performance (similar to web app)
        hydrateGroupPreviews(response.data.slice(0, 10)); // Load first 10 groups initially
      }
    } catch (error) {
      console.error('Error fetching user groups:', error);
      const errorMessage = handleApiError(error, 'Failed to fetch user groups');
      Alert.alert('Error', errorMessage);
    }
  };

  // Lazy load group message previews (similar to web app)
  const hydrateGroupPreviews = async (groups) => {
    if (!groups || groups.length === 0) return;
    
    setIsLoadingGroupPreviews(true);
    try {
      const headers = await getAuthHeaders();
      
      // Batch fetch previews for groups that haven't been loaded yet
      const groupsToLoad = groups.filter(group => !fetchedGroupPreviewIds.has(group._id));
      
      if (groupsToLoad.length > 0) {
        const previewPromises = groupsToLoad.map(async (group) => {
          try {
            // Try primary endpoint first
            let res;
            try {
              res = await axios.get(`${API_URL}/group-messages/${group._id}?userId=${user._id}&limit=1&sort=desc`, { headers });
            } catch {
              // Fallback to alternative endpoint
              res = await axios.get(`${API_URL}/group-chats/${group._id}/messages?userId=${user._id}&limit=1&sort=desc`, { headers });
            }
            return { groupId: group._id, messages: Array.isArray(res.data) ? res.data : [] };
          } catch {
            return { groupId: group._id, messages: [] };
          }
        });
        
        const results = await Promise.all(previewPromises);
        
        // Update last messages with previews
        const newLastMessages = { ...lastMessages };
        results.forEach(({ groupId, messages }) => {
          if (messages.length > 0) {
            const lastMessage = messages[0];
            const prefix = lastMessage.senderId === user._id ? 'You: ' : `${lastMessage.senderName || 'Unknown'}: `;
            const text = lastMessage.message ? lastMessage.message : (lastMessage.fileUrl ? 'File sent' : '');
            newLastMessages[groupId] = { prefix, text };
          }
        });
        
        setLastMessages(newLastMessages);
        
        // Mark these groups as fetched
        setFetchedGroupPreviewIds(prev => {
          const newSet = new Set(prev);
          groupsToLoad.forEach(group => newSet.add(group._id));
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error hydrating group previews:', error);
    } finally {
      setIsLoadingGroupPreviews(false);
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
    if (!chatTarget || (!input.trim() && !selectedFile && selectedFiles.length === 0)) return;
    
    const buildUploadFile = async (asset) => {
      if (!asset) return null;
      let uploadUri = asset.uri;
      try {
        if (Platform.OS === 'android' && typeof uploadUri === 'string' && uploadUri.startsWith('content://')) {
          const targetPath = FileSystem.cacheDirectory + (asset.name || asset.fileName || 'attachment');
          await FileSystem.copyAsync({ from: uploadUri, to: targetPath });
          uploadUri = targetPath;
        }
      } catch (copyErr) {
        if (!String(uploadUri || '').startsWith('file://')) {
          throw new Error('Unable to process file for upload');
        }
      }
      const fileName = asset.name || asset.fileName || 'attachment';
      const mimeType = asset.mimeType || asset.type || 'application/octet-stream';
      return { uri: uploadUri, name: fileName, type: mimeType };
    };

  // New function for multiple files - sequential upload approach
  const sendMultipleFilesSequentially = async (files, isGroup = false) => {
    const token = await AsyncStorage.getItem('jwtToken');
    const headers = { 'Authorization': `Bearer ${token}` };
    const uploadedMessages = [];
    const uploadKey = `file-upload-${Date.now()}`;
    
    setIsUploadingFiles(true);
    
    // Set uploading state
    setUploading(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadFile = await buildUploadFile(file);
        
        if (!uploadFile) continue;
        
        // Update progress
        const progress = Math.round(((i + 1) / files.length) * 100);
        // Update progress (simplified)
          
          const form = new FormData();
          
          if (isGroup) {
            form.append('groupId', selectedGroup._id);
            form.append('senderId', user._id);
            form.append('message', i === 0 ? (input || '') : ''); // Only first message gets text
            form.append('file', uploadFile);
            
            // Try both endpoints for group messages
            let res;
            try {
              res = await axios.post(`${API_URL}/group-messages`, form, { 
                headers: { ...headers, 'Content-Type': 'multipart/form-data' } 
              });
            } catch (primaryErr) {
              res = await axios.post(`${API_URL}/group-chats/${selectedGroup._id}/messages`, form, { 
                headers: { ...headers, 'Content-Type': 'multipart/form-data' } 
              });
            }
            
            const sentMessage = res.data;
            classSocketService.sendGroupMessage({
              senderId: user._id,
              groupId: selectedGroup._id,
              text: sentMessage.message,
              fileUrl: sentMessage.fileUrl || null,
              senderName: `${user.firstname} ${user.lastname}`,
            });
            uploadedMessages.push(sentMessage);
            
          } else {
            form.append('senderId', user._id);
            form.append('receiverId', selectedUser._id);
            form.append('message', i === 0 ? (input || '') : ''); // Only first message gets text
            form.append('file', uploadFile);
            
            const res = await axios.post(`${API_URL}/messages`, form, { 
              headers: { ...headers, 'Content-Type': 'multipart/form-data' } 
            });
            
            const sentMessage = res.data;
            classSocketService.sendMessage({
              chatId: [user._id, selectedUser._id].sort().join('-'),
              senderId: user._id,
              receiverId: selectedUser._id,
              message: sentMessage.message,
              timestamp: sentMessage.timestamp || new Date(),
            });
            uploadedMessages.push(sentMessage);
          }
      }
      
      // Show success
      // Upload completed
      setUploading(false);
      
      return uploadedMessages;
    } catch (error) {
      console.error('Error in sequential upload:', error);
      
      // Upload failed
      setUploading(false);
      Alert.alert('Upload Failed', 'Failed to upload files. Please try again.');
      
      throw error;
    } finally {
      setIsUploadingFiles(false);
    }
  };
    
    if (isGroupChat) {
      try {
        // Handle multiple files first (new functionality) - Sequential upload approach
        if (selectedFiles.length > 0) {
          try {
            const uploadedMessages = await sendMultipleFilesSequentially(selectedFiles, true);
            
            // Add all uploaded messages to the chat
            setMessages(prev => [...prev, ...uploadedMessages]);
            setGroupMsgsById(prev => ({ 
              ...prev, 
              [selectedGroup._id]: [ ...(prev[selectedGroup._id] || []), ...uploadedMessages ] 
            }));
            
            // Update last message with file count
            const text = input || `${selectedFiles.length} file(s) sent`;
            setLastMessages(prev => ({ ...prev, [selectedGroup._id]: { prefix: 'You: ', text } }));
            setInput('');
            setSelectedFiles([]);
          } catch (error) {
            console.error('Error uploading multiple files:', error);
            Alert.alert('Error', `Failed to upload files: ${error.message || 'Unknown error'}`);
            setSelectedFiles([]);
            return;
          }
        }
        // Handle single file (existing functionality)
        else if (selectedFile) {
          const token = await AsyncStorage.getItem('jwtToken');
          const headers = { 'Authorization': `Bearer ${token}` };
          const form = new FormData();
          form.append('groupId', selectedGroup._id);
          form.append('senderId', user._id);
          form.append('message', input || '');
          const uploadFile = await buildUploadFile(selectedFile);
          if (uploadFile) {
            form.append('file', uploadFile);
          }
          let res;
          try {
            res = await axios.post(`${API_URL}/group-messages`, form, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
          } catch (primaryErr) {
            res = await axios.post(`${API_URL}/group-chats/${selectedGroup._id}/messages`, form, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
          }
          const sentMessage = res.data;
          classSocketService.sendGroupMessage({
            senderId: user._id,
            groupId: selectedGroup._id,
            text: sentMessage.message,
            fileUrl: sentMessage.fileUrl || null,
            senderName: `${user.firstname} ${user.lastname}`,
          });
          setMessages(prev => [...prev, sentMessage]);
          setGroupMsgsById(prev => ({ ...prev, [selectedGroup._id]: [ ...(prev[selectedGroup._id] || []), sentMessage ] }));
          const text = sentMessage.message ? sentMessage.message : (sentMessage.fileUrl ? 'File sent' : '');
          setLastMessages(prev => ({ ...prev, [selectedGroup._id]: { prefix: 'You: ', text } }));
          setInput('');
          setSelectedFile(null);
        } else {
        const res = await axios.post(`${API_URL}/group-chats/${selectedGroup._id}/messages`, {
          senderId: user._id,
          message: input,
            fileUrl: null
          }, { headers: { 'Content-Type': 'application/json' } });
        const sentMessage = res.data;
        classSocketService.sendGroupMessage({
          senderId: user._id,
          groupId: selectedGroup._id,
          text: sentMessage.message,
          fileUrl: sentMessage.fileUrl || null,
          senderName: `${user.firstname} ${user.lastname}`,
        });
        setMessages(prev => [...prev, sentMessage]);
        setGroupMsgsById(prev => ({ ...prev, [selectedGroup._id]: [ ...(prev[selectedGroup._id] || []), sentMessage ] }));
        const text = sentMessage.message ? sentMessage.message : (sentMessage.fileUrl ? 'File sent' : '');
        setLastMessages(prev => ({ ...prev, [selectedGroup._id]: { prefix: 'You: ', text } }));
          setInput('');
        setSelectedFile(null);
        }
      } catch (err) {
        console.log('Error saving group message:', err);
        console.log('Error response:', err.response?.data);
        console.log('Error status:', err.response?.status);
        Alert.alert('Error', `Failed to send message: ${err.response?.data?.error || err.message}`);
        return;
      }
    } else {
      try {
        // Handle multiple files first (new functionality) - Sequential upload approach
        if (selectedFiles.length > 0) {
          try {
            const uploadedMessages = await sendMultipleFilesSequentially(selectedFiles, false);
            
            // Add all uploaded messages to the chat
            setMessages(prev => [...prev, ...uploadedMessages]);
            setInput('');
            setSelectedFiles([]);
            
            // Update recent chats with the last message
            const lastMessage = uploadedMessages[uploadedMessages.length - 1];
            const entry = { 
              _id: selectedUser._id, 
              firstname: selectedUser.firstname, 
              lastname: selectedUser.lastname, 
              profilePic: selectedUser.profilePicture || null, 
              lastMessageTime: lastMessage.createdAt || lastMessage.updatedAt || new Date().toISOString() 
            };
            setRecentChatsList(prev => {
              const filtered = prev.filter(c => c._id !== entry._id);
              const updated = [entry, ...filtered];
              AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(updated)).catch(() => {});
              return updated;
            });
            
            // Update last message with file count
            const text = input || `${selectedFiles.length} file(s) sent`;
            setLastMessages(prev => ({ ...prev, [entry._id]: { prefix: 'You: ', text } }));
          } catch (error) {
            console.error('Error uploading multiple files:', error);
            Alert.alert('Error', `Failed to upload files: ${error.message || 'Unknown error'}`);
            setSelectedFiles([]);
            return;
          }
        }
        // Handle single file (existing functionality)
        else if (selectedFile) {
        const token = await AsyncStorage.getItem('jwtToken');
        const headers = { 'Authorization': `Bearer ${token}` };
          const form = new FormData();
          form.append('senderId', user._id);
          form.append('receiverId', selectedUser._id);
          form.append('message', input || '');
          const uploadFile = await buildUploadFile(selectedFile);
          if (uploadFile) {
            form.append('file', uploadFile);
          }
          const res = await axios.post(`${API_URL}/messages`, form, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
          const sentMessage = res.data;
          classSocketService.sendMessage({
            chatId: [user._id, selectedUser._id].sort().join('-'),
            senderId: user._id,
            receiverId: selectedUser._id,
            message: sentMessage.message,
            timestamp: sentMessage.timestamp || new Date(),
          });
          setMessages(prev => [...prev, sentMessage]);
          setInput('');
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
        } else {
          const token = await AsyncStorage.getItem('jwtToken');
          const headers = { 'Authorization': `Bearer ${token}` };
        const res = await axios.post(`${API_URL}/messages`, {
          senderId: user._id,
          receiverId: selectedUser._id,
          message: input
        }, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const sentMessage = res.data;
        classSocketService.sendMessage({
          chatId: [user._id, selectedUser._id].sort().join('-'),
          senderId: user._id,
          receiverId: selectedUser._id,
          message: sentMessage.message,
          timestamp: sentMessage.timestamp || new Date(),
        });
        setMessages(prev => [...prev, sentMessage]);
          setInput('');
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
        }
      } catch (err) {
        console.log('Error saving direct message:', err);
        console.log('Error response:', err.response?.data);
        console.log('Error status:', err.response?.status);
        Alert.alert('Error', `Failed to send message: ${err.response?.data?.error || err.message}`);
        return;
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
        
        Alert.alert('Success', `Group "${groupName.trim()}" created!`, [
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

  const handleJoinGroup = async () => {
    if (!joinGroupId.trim()) {
      Alert.alert('Error', 'Please enter a group ID.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Use the correct API endpoint that matches the backend
      const response = await axios.post(`${API_URL}/group-chats/${joinGroupId.trim()}/join`, {
        userId: user._id
      }, { headers });

      if (response.data) {
        // Join the group in socket
        socketRef.current?.emit('joinGroup', { userId: user._id, groupId: joinGroupId.trim() });
        
        Alert.alert('Success', 'Successfully joined the group!', [
          { text: 'OK', onPress: () => {
            setShowJoinGroupModal(false);
            setJoinGroupId('');
            // Refresh the groups list
            fetchUserGroups();
            // Navigate back to chat home page to refresh the list
            navigation.goBack();
          }}
        ]);
      }
    } catch (error) {
      console.error('Error joining group:', error);
      let errorMessage = 'Failed to join group';
      if (error.response?.status === 404) {
        errorMessage = 'Group not found. Please check the group ID.';
      } else if (error.response?.status === 400) {
        errorMessage = 'You are already a member of this group.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
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

  // Unified chat list with individual chats at top and group chats at bottom
  const individualChats = (recentChatsList || []).map(chat => ({ ...chat, type: 'individual' }));
  const groupChats = (userGroups || []).map(group => ({ ...group, type: 'group' }));

  // Filter chats based on search query
  const filteredIndividualChats = individualChats.filter(chat => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${chat.firstname || ''} ${chat.lastname || ''}`.toLowerCase();
    return fullName.includes(query) || 
           (chat.firstname || '').toLowerCase().includes(query) ||
           (chat.lastname || '').toLowerCase().includes(query);
  });

  const filteredGroupChats = groupChats.filter(group => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (group.name || '').toLowerCase().includes(query) ||
           (group.description || '').toLowerCase().includes(query);
  });
  
  // Sort individual chats by last message time
  individualChats.sort((a, b) => {
    const aMessages = dmMessages[a._id] || [];
    const bMessages = dmMessages[b._id] || [];
    const aTime = aMessages.length > 0 ? new Date(aMessages[aMessages.length - 1]?.createdAt || 0).getTime() : (a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0);
    const bTime = bMessages.length > 0 ? new Date(bMessages[bMessages.length - 1]?.createdAt || 0).getTime() : (b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0);
    return bTime - aTime;
  });
  
  // Sort group chats by last message time
  groupChats.sort((a, b) => {
    const aMessages = groupMsgsById[a._id] || [];
    const bMessages = groupMsgsById[b._id] || [];
    const aTime = aMessages.length > 0 ? new Date(aMessages[aMessages.length - 1]?.createdAt || 0).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const bTime = bMessages.length > 0 ? new Date(bMessages[bMessages.length - 1]?.createdAt || 0).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return bTime - aTime;
  });
  
  // Combined list: individual chats first, then group chats
  const unifiedChats = [...individualChats, ...groupChats];

  const additionalGroupSearchResults = (userGroups || [])
    .filter(g => !unifiedChats.some(uc => uc._id === g._id))
    .filter(g => (g.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()))
    .map(g => ({ ...g, type: 'group' }));

  // Updated search results using backend search (similar to web app)
  const searchResults = (searchQuery || '').trim() === '' ? [] : [
    // First show existing chats/groups that match (active conversations)
    ...unifiedChats.filter(chat => {
      if (chat.type === 'individual') {
        return (
          (chat.firstname || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
          (chat.lastname || '').toLowerCase().includes((searchQuery || '').toLowerCase())
        );
      } else {
        return (chat.name || '').toLowerCase().includes((searchQuery || '').toLowerCase());
      }
    }),
    // Then show additional groups that match
    ...additionalGroupSearchResults,
    // Then show backend search results for new users
    ...searchedUsers.map(user => ({ ...user, type: 'new_user', isNewUser: true }))
  ];

  // Build comprehensive individual conversations (not just recent):
  const dmUserIds = new Set(Object.keys(dmMessages || {}));
  const individualConversations = (() => {
    const map = new Map();
    // From cached dmMessages
    dmUserIds.forEach(id => {
      const msgs = dmMessages[id] || [];
      const u = (allUsers || []).find(x => x._id === id);
      if (!u || msgs.length === 0) return;
      const last = msgs[msgs.length - 1];
      map.set(id, {
        _id: id,
        firstname: u.firstname,
        lastname: u.lastname,
        profilePic: u.profilePic || u.profilePicture || null,
        lastMessageTime: last.createdAt || last.updatedAt || 0,
      });
      if (!lastMessages[id]) {
        const text = last.message ? last.message : (last.fileUrl ? 'File sent' : '');
        const prefix = last.senderId === user._id ? 'You: ' : `${u.firstname || 'Unknown'} ${u.lastname || 'User'}: `;
        lastMessages[id] = { prefix, text };
      }
    });
    // Merge in what we discovered from API recents
    (recentChatsList || []).forEach(c => {
      if (!map.has(c._id)) map.set(c._id, c);
    });
    // Sort by last message time desc
    return Array.from(map.values()).sort((a,b)=> new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0));
  })();

  // Add safety check to prevent white screen when user is null (during logout)
  // This must be placed AFTER all hooks to avoid "Rendered fewer hooks than expected" error
  if (userLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f3f3' }}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666', fontFamily: 'Poppins-Regular' }}>
          Loading user data...
        </Text>
      </View>
    );
  }

  if (!user || !user._id) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f3f3' }}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666', fontFamily: 'Poppins-Regular' }}>
          Redirecting to login...
        </Text>
      </View>
    );
  }

  // If no specific chat is selected, show the chat list
  if (!selectedUser && !selectedGroup) {
    console.log('Rendering chat list view');
    return (
      <View style={{ flex: 1, backgroundColor: '#f3f3f3' }}>
        
        <ScrollView>
        <View style={
      {
        paddingBottom: 80,
        // paddingHorizontal: 20,
        // paddingTop: 120, // Space for fixed header
      }
      }/>
      {/* Blue background */}
      <View style={StudentDashboardStyle.blueHeaderBackground} />
      
      {/* White card header */}
      <View style={StudentDashboardStyle.whiteHeaderCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={StudentDashboardStyle.headerTitle}>
              Chats
            </Text>
                         <Text style={StudentDashboardStyle.headerSubtitle}>{academicContext}</Text>
             <Text style={StudentDashboardStyle.headerSubtitle2}>{formatDateTime(currentDateTime)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
              onPress={() => {
                try {
                  setShowNotificationCenter(true);
                } catch (error) {
                  console.error('Error opening notification center:', error);
                  Alert.alert('Notifications', 'Unable to open notifications. Please try again.');
                }
              }}
              style={{ marginRight: 12, position: 'relative' }}
            >
              <Icon name="bell" size={24} color="#00418b" />
              {unreadCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  backgroundColor: '#ff4444',
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 12,
                    fontFamily: 'Poppins-Bold',
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate(user?.role === 'faculty' ? 'FProfile' : 'SProfile')}>
              {resolveProfileUri() ? (
                <Image 
                  source={{ uri: resolveProfileUri() }} 
                  style={{ width: 36, height: 36, borderRadius: 18 }}
                  resizeMode="cover"
                />
              ) : (
                <Image 
                  source={require('../assets/profile-icon (2).png')} 
                  style={{ width: 36, height: 36, borderRadius: 18 }}
                  resizeMode="cover"
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

        {/* Search + Tabs */}
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12 }}>
          {/* Auto-refresh loading indicator */}
          {isAutoRefreshing && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f8f9fa',
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 20,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: '#e9ecef'
            }}>
              <ActivityIndicator size="small" color="#00418b" style={{ marginRight: 8 }} />
              <Text style={{ color: '#00418b', fontSize: 12, fontWeight: '500' }}>
                Auto-refreshing chats...
              </Text>
            </View>
          )}
          
          <TouchableWithoutFeedback onPress={() => setShowSearchDropdown(false)}>
            <View style={{ position: 'relative' }}>
            <TextInput
              placeholder="Search users or groups..."
              value={searchQuery}
              onChangeText={(text) => {
                console.log('Search query changed:', text);
                setSearchQuery(text);
              }}
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 10,
                backgroundColor: 'white',
                marginBottom: 10,
                minHeight: 40 // Ensure minimum height
              }}
            />
            
            </View>
          </TouchableWithoutFeedback>
        </View>
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginTop: '22%'   }}>
          <TouchableOpacity 
            onPress={() => setActiveTab('chats')}
            style={{ 
              paddingVertical: 12, 
              paddingHorizontal: 16, 
              borderBottomWidth: 2, 
              borderBottomColor: activeTab === 'chats' ? '#00418b' : 'transparent'
            }}
          >
            <Text style={{ color: activeTab === 'chats' ? '#00418b' : '#666', fontWeight: 'bold' }}>Chats</Text>
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
            <Text style={{ color: activeTab === 'join' ? '#00418b' : '#666', fontWeight: 'bold' }}>Join</Text>
          </TouchableOpacity>
        </View>

          {isLoading && (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 }}>
              <Text>Loading...</Text>
            </View>
          )}
          {!isLoading && activeTab === 'chats' && (
            <View style={{ padding:20, position: 'relative' }}>
             
             <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Recent Chats</Text>
             
             {/* Search Bar */}
             <View style={{ 
               flexDirection: 'row', 
               alignItems: 'center', 
               backgroundColor: '#f5f5f5', 
               borderRadius: 20, 
               paddingHorizontal: 15, 
               marginBottom: 15,
               borderWidth: 1,
               borderColor: '#e0e0e0'
             }}>
               <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
               <TextInput
                 value={searchQuery}
                 onChangeText={setSearchQuery}
                 placeholder="Search chats..."
                 style={{ 
                   flex: 1, 
                   paddingVertical: 10, 
                   fontSize: 14,
                   color: '#333'
                 }}
                 placeholderTextColor="#999"
               />
               {searchQuery.length > 0 && (
                 <TouchableOpacity onPress={() => setSearchQuery('')}>
                   <Text style={{ fontSize: 16, color: '#666' }}>✕</Text>
                 </TouchableOpacity>
               )}
             </View>
             
             {/* Loading overlay for auto-refresh */}
             {isAutoRefreshing && (
               <View style={{
                 position: 'absolute',
                 top: 0,
                 left: 0,
                 right: 0,
                 bottom: 0,
                 backgroundColor: 'rgba(255, 255, 255, 0.8)',
                 zIndex: 10,
                 justifyContent: 'center',
                 alignItems: 'center',
                 borderRadius: 10
               }}>
                 <View style={{
                   backgroundColor: 'white',
                   padding: 20,
                   borderRadius: 10,
                   flexDirection: 'row',
                   alignItems: 'center',
                   elevation: 5,
                   shadowColor: '#000',
                   shadowOffset: { width: 0, height: 2 },
                   shadowOpacity: 0.25,
                   shadowRadius: 3.84
                 }}>
                   <ActivityIndicator size="small" color="#00418b" style={{ marginRight: 12 }} />
                   <Text style={{ color: '#00418b', fontSize: 14, fontWeight: '500' }}>
                     Updating chat list...
                   </Text>
                 </View>
               </View>
             )}
              {(searchQuery || '').trim() === '' ? (
                (individualChats.length > 0 || groupChats.length > 0) ? (
                  <View>
                    {/* Individual Chats Section */}
                    {individualChats.length > 0 && (
                      <View style={{ marginBottom: 20 }}>
                        <View style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center', 
                          marginBottom: 12, 
                          paddingHorizontal: 4 
                        }}>
                          <Text style={{ 
                            fontWeight: 'bold', 
                            fontSize: 16, 
                            color: '#00418b',
                            flex: 1 
                          }}>
                            Individual Chats
                          </Text>
                          <View style={{ 
                            height: 1, 
                            backgroundColor: '#e0e0e0', 
                            flex: 1, 
                            marginLeft: 10 
                          }} />
                        </View>
                        {filteredIndividualChats.map(chat => (
                          <View key={chat._id} style={{ position: 'relative' }}>
                            <TouchableOpacity
                              onPress={() => {
                                // Remove highlight when chat is opened
                                if (isChatHighlighted(chat._id)) {
                                  removeHighlightedChat(chat._id);
                                }
                                
                                setSelectedUser({ _id: chat._id, firstname: chat.firstname, lastname: chat.lastname, profilePicture: chat.profilePic, role: 'students' });
                                setSelectedGroup(null);
                              }}
                              onLongPress={() => {
                                // Long press to preserve chat
                                preserveChat(chat._id);
                                Alert.alert(
                                  'Chat Preserved',
                                  `${chat.firstname} ${chat.lastname} will be kept in your chat list even without recent messages.`,
                                  [{ text: 'OK' }]
                                );
                              }}
                              style={{ 
                                backgroundColor: isChatHighlighted(chat._id) ? '#fff3cd' : 'white', 
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
                                borderLeftWidth: isChatHighlighted(chat._id) ? 4 : 0,
                                borderLeftColor: isChatHighlighted(chat._id) ? '#ffc107' : 'transparent'
                              }}
                            >
                              {(() => {
                                const raw = chat.profilePic;
                                const uri = raw && typeof raw === 'string' && raw.startsWith('/uploads/') ? (API_URL + raw) : raw;
                                return (
                                  <Image source={uri ? { uri } : require('../assets/profile-icon (2).png')} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
                                );
                              })()}
                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{`${chat.firstname} ${chat.lastname}`}</Text>
                                  {isChatHighlighted(chat._id) && (
                                    <View style={{ 
                                      width: 8, 
                                      height: 8, 
                                      borderRadius: 4, 
                                      backgroundColor: '#ffc107', 
                                      marginLeft: 8 
                                    }} />
                                  )}
                                  {chat.manuallyAdded && (
                                    <View style={{ 
                                      width: 6, 
                                      height: 6, 
                                      borderRadius: 3, 
                                      backgroundColor: '#28a745', 
                                      marginLeft: 8 
                                    }} />
                                  )}
                                </View>
                                {!!lastMessages[chat._id] && (
                                  <Text style={{ color: '#666', fontSize: 12 }} numberOfLines={1}>
                                    {lastMessages[chat._id].prefix}{lastMessages[chat._id].text}
                                  </Text>
                                )}
                                {chat.manuallyAdded && !lastMessages[chat._id] && (
                                  <Text style={{ color: '#28a745', fontSize: 11, fontStyle: 'italic' }}>
                                    Preserved chat
                                  </Text>
                                )}
                              </View>
                            </TouchableOpacity>
                            
                            {/* Remove button (X) for individual chats */}
                            <TouchableOpacity
                              onPress={() => removeFromRecent(chat._id)}
                              style={{
                                position: 'absolute',
                                right: 8,
                                top: 8,
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                backgroundColor: 'rgba(0,0,0,0.1)',
                                justifyContent: 'center',
                                alignItems: 'center'
                              }}
                            >
                              <Text style={{ color: '#666', fontSize: 16, fontWeight: 'bold' }}>×</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Group Chats Section */}
                    {groupChats.length > 0 && (
                      <View>
                        <View style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center', 
                          marginBottom: 12, 
                          paddingHorizontal: 4 
                        }}>
                          <Text style={{ 
                            fontWeight: 'bold', 
                            fontSize: 16, 
                            color: '#00418b',
                            flex: 1 
                          }}>
                            Group Chats
                          </Text>
                          <View style={{ 
                            height: 1, 
                            backgroundColor: '#e0e0e0', 
                            flex: 1, 
                            marginLeft: 10 
                          }} />
                        </View>
                        {filteredGroupChats.map(chat => (
                          <TouchableOpacity
                            key={chat._id}
                            onPress={() => {
                              // Remove highlight when chat is opened
                              if (isChatHighlighted(chat._id)) {
                                removeHighlightedChat(chat._id);
                              }
                              
                              setSelectedGroup(chat);
                              setSelectedUser(null);
                            }}
                            style={{ 
                              backgroundColor: isChatHighlighted(chat._id) ? '#fff3cd' : 'white', 
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
                              borderLeftWidth: isChatHighlighted(chat._id) ? 4 : 0,
                              borderLeftColor: isChatHighlighted(chat._id) ? '#ffc107' : 'transparent'
                            }}
                          >
                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#00418b', marginRight: 12, justifyContent: 'center', alignItems: 'center' }}>
                              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{(chat.name || '').charAt(0).toUpperCase()}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{chat.name}</Text>
                                {isChatHighlighted(chat._id) && (
                                  <View style={{ 
                                    width: 8, 
                                    height: 8, 
                                    borderRadius: 4, 
                                    backgroundColor: '#ffc107', 
                                    marginLeft: 8 
                                  }} />
                                )}
                              </View>
                              <Text style={{ color: '#666', fontSize: 12 }}>
                                {(chat.participants || []).length} participants
                              </Text>
                              {!!lastMessages[chat._id] && (
                                <Text style={{ color: '#666', fontSize: 12 }} numberOfLines={1}>
                                  {lastMessages[chat._id].prefix}{lastMessages[chat._id].text}
                                </Text>
                              )}
                            </View>
                            <Text style={{ color: '#00418b', fontSize: 11, marginLeft: 8 }}>Group</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#666', fontSize: 16 }}>No chats found</Text>
                    <Text style={{ color: '#999', fontSize: 14, marginTop: 5 }}>Create a group or start a conversation to get started!</Text>
                  </View>
                )
              ) : (
                (() => {
                  // Enhanced search results showing both groups and users with proper categorization
                  const matchingGroups = (userGroups || []).filter(group => 
                    group.name && group.name.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                  
                  const matchingUsers = (allUsers || []).filter(user => 
                    `${user.firstname} ${user.lastname}`.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                  
                  const hasResults = matchingGroups.length > 0 || matchingUsers.length > 0;
                  
                  if (!hasResults) {
                    return (
                      <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{ color: '#666', fontSize: 16 }}>No groups or users found matching "{searchQuery}"</Text>
                      </View>
                    );
                  }
                  
                  return (
                    <View>
                      {/* Show matching individual chats first */}
                      {matchingUsers.length > 0 && (
                        <View style={{ marginBottom: 20 }}>
                          <View style={{ 
                            flexDirection: 'row', 
                            alignItems: 'center', 
                            marginBottom: 12, 
                            paddingHorizontal: 4 
                          }}>
                            <Text style={{ 
                              fontWeight: 'bold', 
                              fontSize: 16, 
                              color: '#00418b',
                              flex: 1 
                            }}>
                              Individual Chats
                            </Text>
                            <View style={{ 
                              height: 1, 
                              backgroundColor: '#e0e0e0', 
                              flex: 1, 
                              marginLeft: 10 
                            }} />
                          </View>
                          {matchingUsers.map(user => {
                            const isExistingChat = individualConversations.some(c => c._id === user._id);
                            const isInGroup = userGroups.some(g => g.participants && g.participants.includes(user._id));
                            
                            return (
                              <TouchableOpacity
                                key={user._id}
                                onPress={() => {
                                  setSelectedUser(user);
                                  setSelectedGroup(null);
                                }}
                                style={{ 
                                  backgroundColor: isExistingChat ? '#f0f8ff' : 'white', 
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
                                  borderLeftWidth: 4,
                                  borderLeftColor: isExistingChat ? '#00418b' : isInGroup ? '#28a745' : 'transparent'
                                }}
                              >
                                <Image source={user.profilePicture ? { uri: user.profilePicture } : require('../assets/profile-icon (2).png')} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
                                <View style={{ flex: 1 }}>
                                  <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{user.firstname} {user.lastname}</Text>
                                  <Text style={{ color: isExistingChat ? '#00418b' : isInGroup ? '#28a745' : '#0a7', fontSize: 12 }}>
                                    {isExistingChat ? 'Existing chat' : isInGroup ? 'In your group' : 'Click to start new chat'}
                                  </Text>
                                </View>
                                {isExistingChat && <Text style={{ color: '#00418b', fontSize: 12, fontWeight: 'bold' }}>💬</Text>}
                                {isInGroup && !isExistingChat && <Text style={{ color: '#28a745', fontSize: 12, fontWeight: 'bold' }}>👥</Text>}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                      
                      {/* Show matching groups at bottom */}
                      {matchingGroups.length > 0 && (
                        <View>
                          <View style={{ 
                            flexDirection: 'row', 
                            alignItems: 'center', 
                            marginBottom: 12, 
                            paddingHorizontal: 4 
                          }}>
                            <Text style={{ 
                              fontWeight: 'bold', 
                              fontSize: 16, 
                              color: '#00418b',
                              flex: 1 
                            }}>
                              Group Chats
                            </Text>
                            <View style={{ 
                              height: 1, 
                              backgroundColor: '#e0e0e0', 
                              flex: 1, 
                              marginLeft: 10 
                            }} />
                          </View>
                          {matchingGroups.map(group => (
                            <TouchableOpacity
                              key={group._id}
                              onPress={() => {
                                setSelectedGroup(group);
                                setSelectedUser(null);
                              }}
                              style={{ backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 }}
                            >
                              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#00418b', marginRight: 12, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{(group.name || '').charAt(0).toUpperCase()}</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{group.name}</Text>
                                <Text style={{ color: '#666', fontSize: 12 }}>{(group.participants || []).length} participants</Text>
                              </View>
                              <Text style={{ color: '#00418b', fontSize: 11, marginLeft: 8 }}>Group</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })()
              )}
            </View>
          )}

          {!isLoading && activeTab === 'create' && (
            <View style={{padding: 20}}>
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
              <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>Select Members:</Text>
              
              {/* Create Tab Search for Members */}
              <TextInput
                placeholder="Search users to add..."
                value={createTabSearchQuery}
                onChangeText={setCreateTabSearchQuery}
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  backgroundColor: 'white',
                  marginBottom: 15
                }}
              />
              
              {(createTabSearchQuery || '').trim() === '' ? (
                allUsers.map(u => (
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
                  ))
                                 ) : (
                   // Show filtered users based on search
                   (() => {
                     const filteredUsers = allUsers.filter(u => 
                       `${u.firstname} ${u.lastname}`.toLowerCase().includes(createTabSearchQuery.toLowerCase())
                     );
                     
                     if (filteredUsers.length === 0) {
                       return (
                         <View style={{ padding: 20, alignItems: 'center' }}>
                           <Text style={{ color: '#666', fontSize: 16 }}>No users found matching "{createTabSearchQuery}"</Text>
                         </View>
                       );
                     }
                     
                     return filteredUsers.map(u => {
                       const isSelected = selectedParticipants.includes(u._id);
                       const isInExistingGroup = userGroups.some(g => g.participants && g.participants.includes(u._id));
                       const hasExistingChat = individualConversations.some(c => c._id === u._id);
                       
                       return (
                         <TouchableOpacity
                           key={u._id}
                           onPress={() => toggleParticipantSelection(u._id)}
                           style={{ 
                             backgroundColor: isSelected ? '#e8f4fd' : isInExistingGroup ? '#f8f9fa' : 'white', 
                             padding: 15, 
                             borderRadius: 10, 
                             marginBottom: 5,
                             flexDirection: 'row',
                             alignItems: 'center',
                             borderWidth: 1,
                             borderColor: isSelected ? '#00418b' : isInExistingGroup ? '#28a745' : '#eee',
                             borderLeftWidth: 4,
                             borderLeftColor: isSelected ? '#00418b' : isInExistingGroup ? '#28a745' : 'transparent'
                           }}>
                           <Image
                             source={u.profilePicture ? { uri: u.profilePicture } : require('../assets/profile-icon (2).png')}
                             style={{ width: 30, height: 30, borderRadius: 15, marginRight: 10 }}
                             resizeMode="cover"
                           />
                           <View style={{ flex: 1 }}>
                             <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{u.firstname} {u.lastname}</Text>
                             <Text style={{ color: isSelected ? '#00418b' : isInExistingGroup ? '#28a745' : '#666', fontSize: 12 }}>
                               {isSelected ? 'Selected' : isInExistingGroup ? 'Already in your group' : hasExistingChat ? 'Has existing chat' : 'Available to add'}
                             </Text>
                           </View>
                           {isSelected && <Text style={{ color: '#00418b', fontWeight: 'bold', fontSize: 18 }}>✓</Text>}
                           {isInExistingGroup && !isSelected && <Text style={{ color: '#28a745', fontSize: 12 }}>👥</Text>}
                           {hasExistingChat && !isSelected && !isInExistingGroup && <Text style={{ color: '#00418b', fontSize: 12 }}>💬</Text>}
                         </TouchableOpacity>
                       );
                     });
                   })()
                 )}
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

          {!isLoading && activeTab === 'join' && (
            <View style={{padding: 20}}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Join Group</Text>
              
              {/* Join Tab Search for Users */}
              <TextInput
                placeholder="Search users to chat with..."
                value={joinTabSearchQuery}
                onChangeText={setJoinTabSearchQuery}
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  backgroundColor: 'white',
                  marginBottom: 15
                }}
              />
              
              <TextInput
                placeholder="Enter Group ID"
                value={joinGroupId}
                onChangeText={setJoinGroupId}
                style={{ 
                  borderWidth: 1, 
                  borderColor: '#ccc', 
                  borderRadius: 5, 
                  padding: 10, 
                  marginBottom: 10,
                  backgroundColor: 'white'
                }}
              />
              <TouchableOpacity
                onPress={handleJoinGroup}
                style={{ 
                  backgroundColor: '#00418b', 
                  padding: 15, 
                  borderRadius: 10,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Join Group</Text>
              </TouchableOpacity>

              {/* User search results */}
              {joinTabSearchQuery.trim() !== '' && (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>Users</Text>
                  {(() => {
                    const filteredUsers = (allUsers || []).filter(u => 
                      `${u.firstname} ${u.lastname}`.toLowerCase().includes(joinTabSearchQuery.toLowerCase())
                    );
                    
                    if (filteredUsers.length === 0) {
                      return (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                          <Text style={{ color: '#666', fontSize: 16 }}>No users found matching "{joinTabSearchQuery}"</Text>
                        </View>
                      );
                    }
                    
                    return filteredUsers.map(u => {
                      const isExistingChat = individualConversations.some(c => c._id === u._id);
                      const isInGroup = userGroups.some(g => g.participants && g.participants.includes(u._id));
                      
                      return (
                        <TouchableOpacity
                          key={u._id}
                          onPress={() => {
                            setSelectedUser(u);
                            setSelectedGroup(null);
                          }}
                          style={{ 
                            backgroundColor: isExistingChat ? '#f0f8ff' : isInGroup ? '#f8f9fa' : 'white', 
                            padding: 15, 
                            borderRadius: 10, 
                            marginBottom: 10, 
                            flexDirection: 'row', 
                            alignItems: 'center',
                            borderLeftWidth: 4,
                            borderLeftColor: isExistingChat ? '#00418b' : isInGroup ? '#28a745' : 'transparent'
                          }}
                        >
                          <Image
                            source={u.profilePicture ? { uri: u.profilePicture } : require('../assets/profile-icon (2).png')}
                            style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{u.firstname} {u.lastname}</Text>
                            <Text style={{ color: isExistingChat ? '#00418b' : isInGroup ? '#28a745' : '#0a7', fontSize: 12 }}>
                              {isExistingChat ? 'Existing chat' : isInGroup ? 'In your group' : 'Click to start new chat'}
                            </Text>
                          </View>
                          {isExistingChat && <Text style={{ color: '#00418b', fontSize: 12, fontWeight: 'bold' }}>💬</Text>}
                          {isInGroup && !isExistingChat && <Text style={{ color: '#28a745', fontSize: 12, fontWeight: 'bold' }}>👥</Text>}
                        </TouchableOpacity>
                      );
                    });
                  })()}
                </View>
              )}
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
          <TouchableOpacity onPress={() => {
            setSelectedUser(null);
            setSelectedGroup(null);
          }} style={{ marginRight: 12 }}>
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
                  {msg.message ? (
                    <Text style={{ color: isMe ? '#fff' : '#222' }}>{msg.message}</Text>
                  ) : null}
                  {renderAttachments(msg, isMe)}
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
                  {msg.message ? (
                    <Text style={{ color: isMe ? '#fff' : '#222' }}>{msg.message}</Text>
                  ) : null}
                  {renderAttachments(msg, isMe)}
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
            const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: true });
            if (!result.canceled && result.assets) {
              const files = result.assets;
              if (files.length === 1) {
                // Single file - use existing logic for backward compatibility
                setSelectedFile(files[0]);
                setSelectedFiles([]);
              } else if (files.length > 1) {
                // Multiple files - use new logic
                setSelectedFiles(files);
                setSelectedFile(null);
              }
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
        <TouchableOpacity 
          onPress={handleSend} 
          disabled={isUploadingFiles}
          style={{
            backgroundColor: isUploadingFiles ? '#ccc' : '#00418b',
            borderRadius: 20,
            padding: 12,
          }}>
          {isUploadingFiles ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>➤</Text>
          )}
        </TouchableOpacity>
      </View>
      {/* Show selected files */}
      {selectedFile && (
        <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
          <Text style={{ fontSize: 12, color: '#666' }}>Attached: {selectedFile.name || 'file'}</Text>
        </View>
      )}
      {selectedFiles.length > 0 && (
        <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 12, color: '#666' }}>
              Attached ({selectedFiles.length} files):
            </Text>
            {isUploadingFiles && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                <ActivityIndicator size="small" color="#00418b" />
                <Text style={{ fontSize: 10, color: '#666', marginLeft: 4 }}>Uploading...</Text>
              </View>
            )}
          </View>
          {selectedFiles.map((file, index) => (
            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
              <Text style={{ fontSize: 11, color: '#888', flex: 1 }}>
                • {file.name || 'file'}
              </Text>
              {!isUploadingFiles && (
                <TouchableOpacity 
                  onPress={() => {
                    const newFiles = selectedFiles.filter((_, i) => i !== index);
                    if (newFiles.length === 0) {
                      setSelectedFiles([]);
                    } else {
                      setSelectedFiles(newFiles);
                    }
                  }}
                  style={{ marginLeft: 8 }}
                >
                  <Text style={{ color: '#ff4444', fontSize: 12 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
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

      {/* Full Screen Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <TouchableOpacity 
          style={{ 
            flex: 1, 
            backgroundColor: 'rgba(0,0,0,0.9)', 
            justifyContent: 'center', 
            alignItems: 'center' 
          }}
          activeOpacity={1}
          onPress={() => setShowImageModal(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <Image 
              source={{ uri: selectedImageUrl }}
              style={{ 
                width: '90%', 
                height: '80%',
                resizeMode: 'contain'
              }}
            />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setShowImageModal(false)}
            style={{ 
              position: 'absolute', 
              top: 50, 
              right: 20,
              backgroundColor: 'rgba(255,255,255,0.3)',
              borderRadius: 20,
              padding: 10
            }}
          >
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      
      <NotificationCenter 
        visible={showNotificationCenter} 
        onClose={() => setShowNotificationCenter(false)}
      />
    </View>
  );
} 