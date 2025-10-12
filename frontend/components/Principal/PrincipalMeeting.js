import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
  Platform,
  PermissionsAndroid,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '../../NotificationContext';
import NotificationCenter from '../NotificationCenter';

const { width } = Dimensions.get('window');

let StreamMeetingRoomNative = null;
let SimpleStreamMeetingRoom = null;
if (Platform.OS !== 'web') {
  try {
    StreamMeetingRoomNative = require('../Meeting/StreamMeetingRoomNative').default;
    SimpleStreamMeetingRoom = require('../Meeting/SimpleStreamMeetingRoom').default;
  } catch (e) { /* noop on web */ }
}

export default function PrincipalMeeting() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [academicContext, setAcademicContext] = useState('2025-2026 | Term 1');
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRoles, setExpandedRoles] = useState({});
  const [creating, setCreating] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDescription, setMeetingDescription] = useState('');
  const [meetingType, setMeetingType] = useState('instant');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState('');
  
  // Notification states
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  let unreadCount = 0;
  try {
    const { unreadCount: count } = useNotifications();
    unreadCount = count || 0;
  } catch (error) {
    console.error('Error accessing notifications:', error);
    unreadCount = 0;
  }

  useEffect(() => {
    fetchAllMeetings();
    fetchAllUsers();
  }, []);

  const fetchAllMeetings = async () => {
    if (!user || !user._id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      
      // Get academic year and term
      const academicResponse = await fetch('https://juanlms-webapp-server.onrender.com/api/academic-year/active', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      let activeYear = '2025-2026';
      let activeTerm = 'Term 1';
      
      if (academicResponse.ok) {
        const academicData = await academicResponse.json();
        if (academicData.success && academicData.academicYear) {
          activeYear = academicData.academicYear.year;
          activeTerm = academicData.academicYear.currentTerm;
        }
      }
      
      setAcademicContext(`${activeYear} | ${activeTerm}`);

      // Fetch direct-invite meetings for Principal
      const response = await fetch('https://juanlms-webapp-server.onrender.com/api/meetings/direct-invite', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMeetings(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch('https://juanlms-webapp-server.onrender.com/users/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const users = await response.json();
        const currentUserId = user?._id;
        const filtered = Array.isArray(users)
          ? users.filter(u => u && u._id && u._id !== currentUserId && u.status !== 'inactive')
          : [];
        setAllUsers(filtered);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  const toggleUserSelection = (u) => {
    setSelectedUsers(prev => {
      const exists = prev.some(p => p._id === u._id);
      if (exists) return prev.filter(p => p._id !== u._id);
      return [...prev, u];
    });
  };

  const toggleRoleExpansion = (role) => {
    setExpandedRoles(prev => ({
      ...prev,
      [role]: !prev[role]
    }));
  };

  const clearSelection = () => {
    setSelectedUsers([]);
    setSearchTerm('');
  };

  const usersByRole = allUsers
    .filter(u => {
      const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
      const email = (u.email || '').toLowerCase();
      const role = (u.role || '').toLowerCase();
      const q = searchTerm.toLowerCase();
      return name.includes(q) || email.includes(q) || role.includes(q);
    })
    .reduce((acc, u) => {
      const role = u.role || 'unknown';
      if (!acc[role]) acc[role] = [];
      acc[role].push(u);
      return acc;
    }, {});

  const handleCreateDirectInvite = async () => {
    if (selectedUsers.length === 0) return;
    if (!meetingTitle.trim()) {
      Alert.alert('Meeting Title Required', 'Please enter a meeting title.');
      return;
    }
    if (meetingType === 'scheduled') {
      if (!scheduledDate || !scheduledTime) {
        Alert.alert('Schedule Required', 'Please provide date and time for scheduled meeting.');
        return;
      }
    }
    try {
      setCreating(true);
      const token = await AsyncStorage.getItem('jwtToken');
      let scheduledIso = new Date().toISOString();
      if (meetingType === 'scheduled') {
        const composed = new Date(`${scheduledDate}T${scheduledTime}:00`);
        if (!isNaN(composed.getTime())) {
          scheduledIso = composed.toISOString();
        }
      }

      const body = {
        title: meetingTitle.trim(),
        description: meetingDescription.trim(),
        meetingType,
        classID: 'direct-invite',
        participants: selectedUsers.map(u => u._id),
        scheduledTime: scheduledIso,
        duration: duration ? parseInt(duration) : null,
      };
      const response = await fetch('https://juanlms-webapp-server.onrender.com/api/meetings/direct-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create meeting');
      }
      const newMeeting = await response.json();
      setSelectedUsers([]);
      setMeetingTitle('');
      setMeetingDescription('');
      setMeetingType('instant');
      setScheduledDate('');
      setScheduledTime('');
      setDuration('');
      fetchAllMeetings();
      if (newMeeting && newMeeting.meetingType === 'instant') {
        handleJoinMeeting(newMeeting);
      } else {
        Alert.alert('Success', 'Meeting created');
      }
    } catch (e) {
      console.error('Create direct-invite error:', e);
      Alert.alert('Error', e.message || 'Failed to create meeting');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinMeeting = async (meeting) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`https://juanlms-webapp-server.onrender.com/api/meetings/${meeting._id}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const enriched = { ...meeting, roomUrl: result.roomUrl, meetingId: String(meeting._id) };
        if (Platform.OS === 'web') {
          try { window.open(result.roomUrl, '_blank'); } catch (e) { Alert.alert('Meeting', 'Open this link: ' + result.roomUrl); }
        } else {
          try {
            if (Platform.OS === 'android') {
              const cam = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
              const mic = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
              if (cam !== PermissionsAndroid.RESULTS.GRANTED || mic !== PermissionsAndroid.RESULTS.GRANTED) {
                Alert.alert('Permissions required', 'Camera and microphone permissions are needed to join the meeting.');
                return;
              }
            }
          } catch (e) { /* ignore */ }
          if (!StreamMeetingRoomNative && !SimpleStreamMeetingRoom) {
            Alert.alert('Meeting', 'Native meeting module is unavailable. Make sure you run a development build (not Expo Go).');
            return;
          }
          setActiveMeeting(enriched);
        }
      } else {
        const result = await response.json();
        Alert.alert('Error', result.message || 'Failed to join meeting');
      }
    } catch (error) {
      console.error('Error joining meeting:', error);
      Alert.alert('Error', 'Failed to join meeting');
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'No scheduled time';
    
    const date = new Date(dateString);
    const now = new Date();
    
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    let dateLabel = '';
    if (isToday) {
      dateLabel = 'Today';
    } else if (isTomorrow) {
      dateLabel = 'Tomorrow';
    } else {
      dateLabel = date.toLocaleDateString();
    }
    
    const timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return `${dateLabel} at ${timeLabel}`;
  };

  const getMeetingStatus = (meeting) => {
    if (meeting.status === 'ended') {
      return { label: 'Ended', color: '#9CA3AF' };
    }
    
    if (meeting.meetingType === 'instant') {
      if (meeting.isActive) {
        return { label: 'Live', color: '#EF4444' };
      } else {
        return { label: 'Not Started', color: '#F59E0B' };
      }
    }
    
    if (meeting.isCurrentlyActive) {
      return { label: 'Live', color: '#EF4444' };
    }
    
    const now = new Date();
    const scheduledTime = new Date(meeting.scheduledTime);
    
    if (scheduledTime > now) {
      return { label: 'Scheduled', color: '#3B82F6' };
    } else {
      return { label: 'Ended', color: '#9CA3AF' };
    }
  };

  const groupMeetingsByDate = (meetings) => {
    const groups = {};
    const now = new Date();
    
    meetings.forEach(meeting => {
      let groupKey;
      
      if (meeting.meetingType === 'instant') {
        groupKey = 'instant';
      } else if (meeting.scheduledTime) {
        const meetingDate = new Date(meeting.scheduledTime);
        const isToday = meetingDate.toDateString() === now.toDateString();
        const isTomorrow = meetingDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
        
        if (isToday) {
          groupKey = 'today';
        } else if (isTomorrow) {
          groupKey = 'tomorrow';
        } else {
          groupKey = meetingDate.toDateString();
        }
      } else {
        groupKey = 'no-date';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(meeting);
    });
    
    // Sort meetings within each group
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        if (a.scheduledTime && b.scheduledTime) {
          return new Date(a.scheduledTime) - new Date(b.scheduledTime);
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    });
    
    return groups;
  };

  const getGroupTitle = (groupKey) => {
    switch (groupKey) {
      case 'instant':
        return 'Instant Meetings';
      case 'today':
        return 'Today';
      case 'tomorrow':
        return 'Tomorrow';
      case 'no-date':
        return 'No Scheduled Time';
      default:
        return new Date(groupKey).toLocaleDateString([], { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={styles.loadingText}>Loading meetings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Blue background */}
        <View style={{
          backgroundColor: '#00418b',
          height: 90,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        }} />
        {/* White card header */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          marginHorizontal: 16,
          marginTop: -40,
          padding: 20,
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          zIndex: 2,
          marginBottom: 16,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{
                fontSize: 22,
                color: '#222',
                fontFamily: 'Poppins-Bold',
              }}>
                Meeting Overview
              </Text>
              <Text style={{
                color: '#888',
                fontSize: 14,
                fontFamily: 'Poppins-Regular',
                marginTop: 4,
              }}>
                {academicContext}
              </Text>
              <Text style={{
                color: '#666',
                fontSize: 12,
                fontFamily: 'Poppins-Regular',
                marginTop: 6,
              }}>
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })} | {new Date().toLocaleTimeString("en-US", {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </Text>
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
              <TouchableOpacity onPress={() => navigation.navigate('PrincipalProfile')}>
                {user?.profilePicture ? (
                  <Image 
                    source={{ uri: user.profilePicture }} 
                    style={{ width: 36, height: 36, borderRadius: 18 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Image 
                    source={require('../../assets/profile-icon (2).png')} 
                    style={{ width: 36, height: 36, borderRadius: 18 }}
                    resizeMode="cover"
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

      {/* Meeting List */}
      <View style={styles.meetingSection}>
        <View style={styles.meetingHeader}>
          <View>
            <Text style={styles.meetingTitle}>All School Meetings</Text>
            <Text style={styles.meetingSubtitle}>
              Monitor meetings across all classes
            </Text>
          </View>
        </View>

        <View style={styles.meetingList}>
          {meetings.length === 0 ? (
            <View style={styles.noMeetings}>
              <Icon name="video" size={48} color="#9CA3AF" />
              <Text style={styles.noMeetingsText}>No meetings scheduled</Text>
              <Text style={styles.noMeetingsSubtext}>Check back later for scheduled meetings</Text>
            </View>
          ) : (
            <View style={styles.meetingsContainer}>
              {Object.entries(groupMeetingsByDate(meetings)).map(([groupKey, groupMeetings]) => (
                <View key={groupKey} style={styles.meetingGroup}>
                  <Text style={styles.groupTitle}>{getGroupTitle(groupKey)}</Text>
                  <View style={styles.groupMeetings}>
                    {groupMeetings.map((meeting) => {
                      const status = getMeetingStatus(meeting);
                      return (
                        <View key={meeting._id} style={styles.meetingCard}>
                          <View style={styles.meetingInfo}>
                            <View style={styles.meetingHeaderRow}>
                              <Text style={styles.meetingName}>{meeting.title}</Text>
                              <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                                <Text style={[styles.statusText, { color: status.color }]}>
                                  {status.label}
                                </Text>
                              </View>
                            </View>
                            
                            {meeting.description && (
                              <Text style={styles.meetingDescription}>{meeting.description}</Text>
                            )}
                            
                            <View style={styles.meetingDetails}>
                              <View style={styles.detailItem}>
                                <Icon name="calendar" size={16} color="#6B7280" />
                                <Text style={styles.detailText}>{formatDateTime(meeting.scheduledTime)}</Text>
                              </View>
                              <View style={styles.detailItem}>
                                <Icon name="clock-outline" size={16} color="#6B7280" />
                                <Text style={styles.detailText}>{meeting.duration || 'No limit'} min</Text>
                              </View>
                              <View style={styles.detailItem}>
                                <Icon name="account-group" size={16} color="#6B7280" />
                                <Text style={styles.detailText}>{meeting.participantCount || 0} participants</Text>
                              </View>
                              {meeting.classID && (
                                <View style={styles.detailItem}>
                                  <Icon name="school" size={16} color="#6B7280" />
                                  <Text style={styles.detailText}>Class: {meeting.classID}</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          
                          <View style={styles.meetingActions}>
                            <TouchableOpacity
                              onPress={() => handleJoinMeeting(meeting)}
                              style={styles.joinButton}
                            >
                              <Icon name="play" size={16} color="white" />
                              <Text style={styles.joinButtonText}>Join</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Direct Invite - User Selection */}
      <View style={styles.selectionCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={styles.sectionTitle}>Select Meeting Participants</Text>
          <TouchableOpacity
            disabled={selectedUsers.length === 0 || creating || !meetingTitle.trim() || (meetingType === 'scheduled' && (!scheduledDate || !scheduledTime))}
            onPress={handleCreateDirectInvite}
            style={[styles.createButton, (selectedUsers.length === 0 || creating || !meetingTitle.trim()) && { opacity: 0.6 }]}
          >
            <Icon name="plus" size={18} color="#fff" />
            <Text style={styles.createButtonText}>Create ({selectedUsers.length})</Text>
          </TouchableOpacity>
        </View>

        {/* Inline inputs */}
        <View style={{ gap: 8 }}>
          <View style={styles.textInputRow}>
            <Icon name="format-title" size={18} color="#6B7280" />
            <Text style={styles.textLabel}>Title</Text>
          </View>
          <View style={styles.inputField}>
            <Text
              style={styles.inputFieldText}
              onPress={() => setMeetingTitle(prompt('Title', meetingTitle) || '')}
            >{meetingTitle || 'Add a meeting title'}</Text>
          </View>

          <View style={styles.textInputRow}>
            <Icon name="text" size={18} color="#6B7280" />
            <Text style={styles.textLabel}>Description (optional)</Text>
          </View>
          <View style={styles.inputField}>
            <Text
              style={styles.inputFieldText}
              onPress={() => setMeetingDescription(prompt('Description (optional)', meetingDescription) || '')}
            >{meetingDescription || 'Add a description (optional)'}</Text>
          </View>

          {/* Meeting type toggle */}
          <View style={styles.typeToggleRow}>
            <TouchableOpacity onPress={() => setMeetingType('instant')} style={[styles.typePill, meetingType === 'instant' && styles.typePillActive]}>
              <Text style={[styles.typePillText, meetingType === 'instant' && styles.typePillTextActive]}>Instant</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMeetingType('scheduled')} style={[styles.typePill, meetingType === 'scheduled' && styles.typePillActive]}>
              <Text style={[styles.typePillText, meetingType === 'scheduled' && styles.typePillTextActive]}>Scheduled</Text>
            </TouchableOpacity>
          </View>

          {meetingType === 'scheduled' && (
            <View style={{ gap: 8 }}>
              <View style={styles.inlineRow}>
                <Icon name="calendar" size={18} color="#6B7280" />
                <Text style={styles.inlineLabel}>Date (YYYY-MM-DD)</Text>
              </View>
              <View style={styles.inputField}>
                <Text
                  style={styles.inputFieldText}
                  onPress={() => setScheduledDate(prompt('Date (YYYY-MM-DD)', scheduledDate) || '')}
                >{scheduledDate || 'e.g. 2025-10-05'}</Text>
              </View>

              <View style={styles.inlineRow}>
                <Icon name="clock-outline" size={18} color="#6B7280" />
                <Text style={styles.inlineLabel}>Time (HH:mm)</Text>
              </View>
              <View style={styles.inputField}>
                <Text
                  style={styles.inputFieldText}
                  onPress={() => setScheduledTime(prompt('Time (HH:mm)', scheduledTime) || '')}
                >{scheduledTime || 'e.g. 14:30'}</Text>
              </View>

              <View style={styles.inlineRow}>
                <Icon name="timer" size={18} color="#6B7280" />
                <Text style={styles.inlineLabel}>Duration (minutes)</Text>
              </View>
              <View style={styles.inputField}>
                <Text
                  style={styles.inputFieldText}
                  onPress={() => setDuration(prompt('Duration (minutes)', duration) || '')}
                >{duration || 'optional'}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <Icon name="magnify" size={18} color="#6B7280" />
          <Text style={styles.searchPlaceholder}>{searchTerm || 'Search users by name, email, or role...'}</Text>
          <TouchableOpacity onPress={() => setSearchTerm(prompt('Search', searchTerm) || '')}>
            <Text style={{ color: '#2563EB', fontWeight: '500' }}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.selectedTitle}>Selected Participants ({selectedUsers.length})</Text>
              <TouchableOpacity onPress={clearSelection}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {selectedUsers.map(u => (
                <TouchableOpacity key={u._id} onPress={() => toggleUserSelection(u)} style={styles.chip}>
                  <Text style={styles.chipText}>{(u.firstName || u.firstname || '?')[0]}{(u.lastName || u.lastname || '?')[0]} · {u.firstName || u.firstname} {u.lastName || u.lastname}</Text>
                  <Text style={styles.chipRemove}>×</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* User List by Role with Collapsible Dropdowns */}
        <View style={{ gap: 12 }}>
          {Object.entries(usersByRole).map(([role, list]) => {
            const isExpanded = expandedRoles[role];
            const selectedInRole = list.filter(u => selectedUsers.some(s => s._id === u._id)).length;
            
            return (
              <View key={role} style={styles.roleDropdown}>
                <TouchableOpacity
                  onPress={() => toggleRoleExpansion(role)}
                  style={styles.roleDropdownHeader}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Icon 
                      name={isExpanded ? "chevron-down" : "chevron-right"} 
                      size={20} 
                      color="#6B7280" 
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.roleHeader}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Text>
                    <Text style={styles.roleSelectionCount}>
                      ({selectedInRole}/{list.length} selected)
                    </Text>
                  </View>
                  <Text style={styles.roleUserCount}>{list.length} users</Text>
                </TouchableOpacity>
                
                {isExpanded && (
                  <View style={styles.roleContent}>
                    <View style={{ gap: 8 }}>
                      {list.map(u => {
                        const isSelected = selectedUsers.some(s => s._id === u._id);
                        return (
                          <TouchableOpacity 
                            key={u._id} 
                            onPress={() => toggleUserSelection(u)} 
                            style={[styles.userRow, isSelected && styles.userRowSelected]}
                          >
                            <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
                              <Text style={[styles.avatarText, isSelected && styles.avatarTextSelected]}>
                                {(u.firstName || u.firstname || '?')[0]}{(u.lastName || u.lastname || '?')[0]}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.userName}>{u.firstName || u.firstname} {u.lastName || u.lastname}</Text>
                              <Text style={styles.userEmail}>{u.email}</Text>
                              <Text style={styles.userRole}>{u.role}</Text>
                            </View>
                            {isSelected && <Icon name="check-circle" size={20} color="#2563EB" />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
      {activeMeeting && Platform.OS !== 'web' && SimpleStreamMeetingRoom && (
        <SimpleStreamMeetingRoom
          isOpen={!!activeMeeting}
          onClose={() => setActiveMeeting(null)}
          onLeave={() => setActiveMeeting(null)}
          meetingData={activeMeeting}
          currentUser={{ name: user?.name || user?.username || 'Host' }}
          credentials={{
            apiKey: 'mmhfdzb5evj2',
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Byb250by5nZXRzdHJlYW0uaW8iLCJzdWIiOiJ1c2VyL0Fib3VuZGluZ19Qb3Bjb3JuIiwidXNlcl9pZCI6IkFib3VuZGluZ19Qb3Bjb3JuIiwidmFsaWRpdHlfaW5fc2Vjb25kcyI6NjA0ODAwLCJpYXQiOjE3NjAyNDMyNjYsImV4cCI6MTc2MDg0ODA2Nn0.OtFBJIHfa8Ojp3kFl47A2Z1_HWvkHiWKvM1sdumOoeQ',
            userId: 'Abounding_Popcorn',
            callId: 'cOYIirg4DL6tCrwXxVXx5',
          }}
          isHost={true}
          hostUserId={'Abounding_Popcorn'}
        />
      )}
      
      {/* Notification Center */}
      <NotificationCenter 
        visible={showNotificationCenter} 
        onClose={() => setShowNotificationCenter(false)} 
      />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  selectionCard: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  createButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textLabel: {
    color: '#374151',
    fontWeight: '500',
  },
  inputField: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputFieldText: {
    color: '#111827',
    fontSize: 14,
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  typePill: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFF',
  },
  typePillActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD',
  },
  typePillText: {
    color: '#374151',
    fontWeight: '500',
  },
  typePillTextActive: {
    color: '#1D4ED8',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineLabel: {
    color: '#374151',
    fontWeight: '500',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  searchPlaceholder: {
    color: '#6B7280',
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    color: '#1D4ED8',
    fontSize: 12,
    marginRight: 6,
  },
  chipRemove: {
    color: '#1D4ED8',
    fontSize: 14,
    fontWeight: '700',
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  clearAllText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  roleDropdown: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: 'white',
  },
  roleDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  roleHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
  },
  roleSelectionCount: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  roleUserCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  roleContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 10,
    backgroundColor: 'white',
  },
  userRowSelected: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelected: {
    backgroundColor: '#DBEAFE',
  },
  avatarText: {
    color: '#374151',
    fontWeight: '600',
  },
  avatarTextSelected: {
    color: '#1D4ED8',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  userEmail: {
    fontSize: 12,
    color: '#6B7280',
  },
  userRole: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'capitalize',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  meetingSection: {
    margin: 16,
  },
  meetingHeader: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  meetingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  meetingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  meetingList: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noMeetings: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noMeetingsText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  noMeetingsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  meetingsContainer: {
    gap: 24,
  },
  meetingGroup: {
    gap: 16,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  groupMeetings: {
    gap: 12,
  },
  meetingCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  meetingInfo: {
    flex: 1,
  },
  meetingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  meetingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  meetingDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  meetingDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  meetingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 16,
  },
  joinButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  joinButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 4,
  },
});
