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
  TextInput,
  Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '../../NotificationContext';
import NotificationCenter from '../NotificationCenter';
import InvitedMeetings from '../Meeting/InvitedMeetings';
let StreamMeetingRoomNative = null;
let SimpleStreamMeetingRoom = null;
if (Platform.OS !== 'web') {
  try { 
    StreamMeetingRoomNative = require('../Meeting/StreamMeetingRoomNative').default;
    SimpleStreamMeetingRoom = require('../Meeting/SimpleStreamMeetingRoom').default;
  } catch (e) { /* noop on web */ }
}

const { width } = Dimensions.get('window');

export default function StudentMeeting() {
  const navigation = useNavigation();
  const { user } = useUser();
  const { unreadCount } = useNotifications();
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [academicContext, setAcademicContext] = useState('2025-2026 | Term 1');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [activeTab, setActiveTab] = useState('class-meetings'); // 'class-meetings', 'invited-meetings', or 'host-meeting'
  
  // Host meeting states
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
  const [hostedMeetings, setHostedMeetings] = useState([]);
  
  // Input modal states
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [tempInputValue, setTempInputValue] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchClasses();
    fetchAllUsers();
    fetchHostedMeetings();
  }, []);

  // Refresh hosted meetings when switching to host-meeting tab
  useEffect(() => {
    if (activeTab === 'host-meeting') {
      fetchHostedMeetings();
    }
  }, [activeTab]);

  // Add safety check to prevent white screen when user is null (during logout)
  // This must be placed AFTER all hooks to avoid "Rendered fewer hooks than expected" error
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={styles.loadingText}>Redirecting to login...</Text>
      </View>
    );
  }

  const fetchClasses = async () => {
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
        } else {
          try {
            const yearRes = await fetch('https://juanlms-webapp-server.onrender.com/api/schoolyears/active', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (yearRes.ok) {
              const year = await yearRes.json();
              const schoolYearName = `${year.schoolYearStart}-${year.schoolYearEnd}`;
              activeYear = schoolYearName;
              const termsRes = await fetch(`https://juanlms-webapp-server.onrender.com/api/terms/schoolyear/${schoolYearName}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (termsRes.ok) {
                const terms = await termsRes.json();
                const active = Array.isArray(terms) ? terms.find(t => t.status === 'active') : null;
                if (active) activeTerm = active.termName;
              }
            }
          } catch (_) {}
        }
      }
      
      setAcademicContext(`${activeYear} | ${activeTerm}`);

      // Fetch student classes
      const response = await fetch('https://juanlms-webapp-server.onrender.com/classes/my-classes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        let allClasses = [];
        if (Array.isArray(data)) {
          allClasses = data;
        } else if (data.success && Array.isArray(data.classes)) {
          allClasses = data.classes;
        }

        // Filter active classes
        const activeClasses = allClasses.filter(cls => {
          if (!cls.termName || cls.termName !== activeTerm) return false;
          if (!cls.academicYear || cls.academicYear !== `${activeYear}`) return false;
          if (cls.isArchived === true) return false;
          return true;
        });

        setClasses(activeClasses);
        if (activeClasses.length > 0) {
          setSelectedClass(activeClasses[0]);
          fetchMeetings(activeClasses[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetings = async (classId) => {
    if (!classId) return;
    
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`https://juanlms-webapp-server.onrender.com/api/meetings/class/${classId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMeetings(data);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
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
        // Filter to only show other students (both 'student' and 'students' roles)
        const filtered = Array.isArray(users)
          ? users.filter(u => u && u._id && u._id !== currentUserId && (u.role === 'student' || u.role === 'students') && u.status !== 'inactive' && !u.isArchived)
          : [];
        setAllUsers(filtered);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  const fetchHostedMeetings = async () => {
    if (!user || !user._id) return;
    
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch('https://juanlms-webapp-server.onrender.com/api/meetings/direct-invite', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter to only show meetings created by the current student
        const studentHostedMeetings = Array.isArray(data) 
          ? data.filter(meeting => meeting.createdBy === user._id || meeting.createdBy._id === user._id)
          : [];
        setHostedMeetings(studentHostedMeetings);
      }
    } catch (error) {
      console.error('Error fetching hosted meetings:', error);
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
          // Request runtime permissions (Android)
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
          if (!StreamMeetingRoomNative) {
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
      const name = `${u.firstName || u.firstname || ''} ${u.lastName || u.lastname || ''}`.toLowerCase();
      const email = (u.email || '').toLowerCase();
      const role = (u.role || '').toLowerCase();
      const q = searchTerm.toLowerCase();
      return name.includes(q) || email.includes(q) || role.includes(q);
    })
    .reduce((acc, u) => {
      const role = u.role || 'student';
      if (!acc[role]) acc[role] = [];
      acc[role].push(u);
      return acc;
    }, {});

  // Input modal handlers
  const openTitleModal = () => {
    setTempInputValue(meetingTitle);
    setShowTitleModal(true);
  };

  const openDescriptionModal = () => {
    setTempInputValue(meetingDescription);
    setShowDescriptionModal(true);
  };

  const openDateModal = () => {
    setTempInputValue(scheduledDate);
    setShowDateModal(true);
  };

  const openTimeModal = () => {
    setTempInputValue(scheduledTime);
    setShowTimeModal(true);
  };

  const openDurationModal = () => {
    setTempInputValue(duration);
    setShowDurationModal(true);
  };

  const saveTitleInput = () => {
    setMeetingTitle(tempInputValue);
    setShowTitleModal(false);
  };

  const saveDescriptionInput = () => {
    setMeetingDescription(tempInputValue);
    setShowDescriptionModal(false);
  };

  const saveDateInput = () => {
    setScheduledDate(tempInputValue);
    setShowDateModal(false);
  };

  const saveTimeInput = () => {
    setScheduledTime(tempInputValue);
    setShowTimeModal(false);
  };

  const saveDurationInput = () => {
    setDuration(tempInputValue);
    setShowDurationModal(false);
  };

  const handleCreateDirectInvite = async () => {
    console.log('[DEBUG] handleCreateDirectInvite called');
    console.log('[DEBUG] selectedUsers:', selectedUsers);
    console.log('[DEBUG] meetingTitle:', meetingTitle);
    console.log('[DEBUG] meetingType:', meetingType);
    console.log('[DEBUG] scheduledDate:', scheduledDate);
    console.log('[DEBUG] scheduledTime:', scheduledTime);
    
    if (selectedUsers.length === 0) {
      Alert.alert('No Participants', 'Please select at least one student to invite.');
      return;
    }
    if (!meetingTitle.trim()) {
      Alert.alert('Meeting Title Required', 'Please enter a meeting title first.');
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
        invitedUsers: selectedUsers.map(u => ({
          userId: u._id,
          email: u.email,
          name: `${u.firstName || u.firstname} ${u.lastName || u.lastname}`,
          role: u.role
        })),
        scheduledTime: scheduledIso,
        duration: duration ? parseInt(duration) : null,
      };
      console.log('[DEBUG] Sending meeting creation request:', body);
      const response = await fetch('https://juanlms-webapp-server.onrender.com/api/meetings/direct-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      
      console.log('[DEBUG] Meeting creation response status:', response.status);
      const responseData = await response.json().catch(() => ({}));
      console.log('[DEBUG] Meeting creation response data:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Failed to create meeting');
      }
      const newMeeting = responseData;
      setSelectedUsers([]);
      setMeetingTitle('');
      setMeetingDescription('');
      setMeetingType('instant');
      setScheduledDate('');
      setScheduledTime('');
      setDuration('');
      fetchHostedMeetings();
      if (newMeeting && newMeeting.meetingType === 'instant') {
        handleJoinMeeting(newMeeting);
      } else {
        Alert.alert('Success', 'Meeting created successfully!');
      }
    } catch (e) {
      console.error('Create direct-invite error:', e);
      Alert.alert('Error', e.message || 'Failed to create meeting');
    } finally {
      setCreating(false);
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

  const resolveProfileUri = () => {
    const API_BASE = 'https://juanlms-webapp-server.onrender.com';
    const uri = user?.profilePic || user?.profilePicture;
    if (!uri) return null;
    if (typeof uri === 'string' && uri.startsWith('/uploads/')) return API_BASE + uri;
    return uri;
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={styles.loadingText}>Loading classes...</Text>
      </View>
    );
  }

  // Don't return early if no classes - still show tabs for direct invitations

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Blue background */}
        <View style={styles.blueHeaderBackground} />
        
        {/* White card header */}
        <View style={styles.whiteHeaderCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.headerTitle}>
              Meetings
            </Text>
            <Text style={styles.headerSubtitle}>{academicContext}</Text>
            <Text style={styles.headerSubtitle2}>{currentDateTime.toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}</Text>
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
            <TouchableOpacity onPress={() => navigation.navigate('SProfile')}>
              {resolveProfileUri() ? (
                <Image 
                  source={{ uri: resolveProfileUri() }} 
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

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <View style={styles.tabNavigation}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'class-meetings' && styles.activeTabButton
            ]}
            onPress={() => setActiveTab('class-meetings')}
          >
            <Icon 
              name="account-group" 
              size={20} 
              color={activeTab === 'class-meetings' ? '#3B82F6' : '#6B7280'} 
            />
            <Text style={[
              styles.tabText,
              activeTab === 'class-meetings' && styles.activeTabText
            ]}>
              Class Meetings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'invited-meetings' && styles.activeTabButton
            ]}
            onPress={() => setActiveTab('invited-meetings')}
          >
            <Icon 
              name="account-plus" 
              size={20} 
              color={activeTab === 'invited-meetings' ? '#3B82F6' : '#6B7280'} 
            />
            <Text style={[
              styles.tabText,
              activeTab === 'invited-meetings' && styles.activeTabText
            ]}>
              Direct Invitations
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'host-meeting' && styles.activeTabButton
            ]}
            onPress={() => setActiveTab('host-meeting')}
          >
            <Icon 
              name="video" 
              size={20} 
              color={activeTab === 'host-meeting' ? '#3B82F6' : '#6B7280'} 
            />
            <Text style={[
              styles.tabText,
              activeTab === 'host-meeting' && styles.activeTabText
            ]}>
              Host Meeting
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Content */}
      {activeTab === 'class-meetings' && (
        <>
          {/* Class Selector */}
          <View style={styles.classSelector}>
            <Text style={styles.sectionTitle}>Select Class</Text>
            {classes.length === 0 ? (
              <View style={styles.noClassesContainer}>
                <Icon name="account-group" size={48} color="#9CA3AF" />
                <Text style={styles.noClassesText}>No Active Classes</Text>
                <Text style={styles.noClassesSubtext}>There are no active classes to join meetings in for the current academic year.</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classScroll}>
                {classes.map((classItem) => (
                <TouchableOpacity
                  key={classItem._id}
                  onPress={() => {
                    setSelectedClass(classItem);
                    fetchMeetings(classItem._id);
                  }}
                  style={[
                    styles.classCard,
                    selectedClass?._id === classItem._id && styles.selectedClassCard
                  ]}
                >
                  <View style={styles.classCardContent}>
                    <View style={[
                      styles.classIcon,
                      selectedClass?._id === classItem._id && styles.selectedClassIcon
                    ]}>
                      <Icon name="account-group" size={20} color={selectedClass?._id === classItem._id ? '#3B82F6' : '#6B7280'} />
                    </View>
                    <View>
                      <Text style={[
                        styles.className,
                        selectedClass?._id === classItem._id && styles.selectedClassName
                      ]}>
                        {classItem.className || classItem.name}
                      </Text>
                      <Text style={styles.classCode}>{classItem.section || classItem.classCode || classItem._id}</Text>
                      <Text style={styles.studentCount}>
                        {classItem.members?.length || 0} students
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Meeting List - Join Only */}
          {selectedClass && (
        <View style={styles.meetingSection}>
          <View style={styles.meetingHeader}>
            <View>
              <Text style={styles.meetingTitle}>
                Meetings for {selectedClass.className || selectedClass.name}
              </Text>
              <Text style={styles.meetingSubtitle}>
                Class ID: {selectedClass._id}
              </Text>
            </View>
          </View>

          <View style={styles.meetingList}>
            <Text style={styles.sectionTitle}>Meeting Schedule</Text>
            {meetings.length === 0 ? (
              <View style={styles.noMeetings}>
                <Icon name="video" size={48} color="#9CA3AF" />
                <Text style={styles.noMeetingsText}>No meetings scheduled for this class</Text>
                <Text style={styles.noMeetingsSubtext}>Check back later for scheduled meetings</Text>
              </View>
            ) : (
              meetings.map((meeting) => {
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
              })
            )}
          </View>
        </View>
          )}
        </>
      )}

      {/* Invited Meetings Tab */}
      {activeTab === 'invited-meetings' && (
        <InvitedMeetings
          onJoinMeeting={handleJoinMeeting}
          refreshTrigger={0}
        />
      )}

      {/* Host Meeting Tab */}
      {activeTab === 'host-meeting' && (
        <>
          {/* Student Hosted Meetings List */}
          <View style={styles.meetingSection}>
            <View style={styles.meetingHeader}>
              <View>
                <Text style={styles.meetingTitle}>Your Hosted Meetings</Text>
                <Text style={styles.meetingSubtitle}>Instant Meetings</Text>
              </View>
            </View>

            <View style={styles.meetingList}>
              {hostedMeetings.length === 0 ? (
                <View style={styles.noMeetings}>
                  <Icon name="video" size={48} color="#9CA3AF" />
                  <Text style={styles.noMeetingsText}>No meetings hosted yet</Text>
                  <Text style={styles.noMeetingsSubtext}>Create your first meeting below</Text>
                </View>
              ) : (
                hostedMeetings.map((meeting) => {
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
                            <Text style={styles.detailText}>{meeting.invitedUsers?.length || 0} invited</Text>
                          </View>
                        </View>
                        
                        {meeting.invitedUsers && meeting.invitedUsers.length > 0 && (
                          <View style={styles.participantsList}>
                            <Text style={styles.participantsTitle}>Invited:</Text>
                            <Text style={styles.participantsText}>
                              {meeting.invitedUsers.map(p => p.name || 'Unknown').join(', ')}
                            </Text>
                          </View>
                        )}
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
                })
              )}
            </View>
          </View>

          {/* Student Selection Section */}
          <View style={styles.selectionCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.sectionTitle}>Select Students to Invite</Text>
              <TouchableOpacity
                disabled={selectedUsers.length === 0 || creating || !meetingTitle.trim() || (meetingType === 'scheduled' && (!scheduledDate || !scheduledTime))}
                onPress={handleCreateDirectInvite}
                style={[
                  styles.createButton, 
                  (selectedUsers.length === 0 || creating || !meetingTitle.trim()) && styles.createButtonDisabled
                ]}
              >
                <Icon name="plus" size={18} color="#fff" />
                <Text style={styles.createButtonText}>Create ({selectedUsers.length})</Text>
              </TouchableOpacity>
            </View>
            
            {/* Help Text */}
            {(!meetingTitle.trim() || selectedUsers.length === 0) && (
              <View style={{ marginBottom: 8 }}>
                <Text style={styles.helpText}>
                  {!meetingTitle.trim() && selectedUsers.length === 0 
                    ? 'Enter a meeting title and select students to enable creation'
                    : !meetingTitle.trim() 
                      ? 'Enter a meeting title to enable creation'
                      : 'Select students to enable creation'
                  }
                </Text>
              </View>
            )}

            {/* Meeting Form */}
            <View style={{ gap: 8, marginBottom: 16 }}>
              {/* Title */}
              <View style={styles.textInputRow}>
                <Icon name="format-title" size={18} color="#6B7280" />
                <Text style={styles.textLabel}>Title</Text>
              </View>
              <TouchableOpacity style={styles.inputField} onPress={openTitleModal}>
                <Text style={styles.inputFieldText}>
                  {meetingTitle || 'Add a meeting title'}
                </Text>
              </TouchableOpacity>

              {/* Description */}
              <View style={styles.textInputRow}>
                <Icon name="text" size={18} color="#6B7280" />
                <Text style={styles.textLabel}>Description (optional)</Text>
              </View>
              <TouchableOpacity style={styles.inputField} onPress={openDescriptionModal}>
                <Text style={styles.inputFieldText}>
                  {meetingDescription || 'Add a description (optional)'}
                </Text>
              </TouchableOpacity>

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
                  <TouchableOpacity style={styles.inputField} onPress={openDateModal}>
                    <Text style={styles.inputFieldText}>
                      {scheduledDate || 'e.g. 2025-10-05'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.inlineRow}>
                    <Icon name="clock-outline" size={18} color="#6B7280" />
                    <Text style={styles.inlineLabel}>Time (HH:mm)</Text>
                  </View>
                  <TouchableOpacity style={styles.inputField} onPress={openTimeModal}>
                    <Text style={styles.inputFieldText}>
                      {scheduledTime || 'e.g. 14:30'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.inlineRow}>
                    <Icon name="timer" size={18} color="#6B7280" />
                    <Text style={styles.inlineLabel}>Duration (minutes)</Text>
                  </View>
                  <TouchableOpacity style={styles.inputField} onPress={openDurationModal}>
                    <Text style={styles.inputFieldText}>
                      {duration || 'optional'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Search Bar */}
            <View style={styles.searchRow}>
              <Icon name="magnify" size={18} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search students by name or email..."
                placeholderTextColor="#9CA3AF"
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity onPress={() => setSearchTerm('')}>
                  <Icon name="close-circle" size={18} color="#6B7280" />
                </TouchableOpacity>
              )}
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

            {/* Student List */}
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
                      <Text style={styles.roleUserCount}>{list.length} students</Text>
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
        </>
      )}
      </ScrollView>
      
      {activeMeeting && Platform.OS !== 'web' && SimpleStreamMeetingRoom && (
      <SimpleStreamMeetingRoom
        isOpen={!!activeMeeting}
        onClose={() => setActiveMeeting(null)}
        onLeave={() => setActiveMeeting(null)}
        meetingData={activeMeeting}
        isHost={false}
        hostUserId={activeMeeting.hostName || 'Host'}
      />
    )}
    
      {/* Input Modals */}
      {/* Title Input Modal */}
      <Modal visible={showTitleModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Meeting Title</Text>
            <TextInput
              style={styles.modalInput}
              value={tempInputValue}
              onChangeText={setTempInputValue}
              placeholder="Enter meeting title"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowTitleModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={saveTitleInput}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Description Input Modal */}
      <Modal visible={showDescriptionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Meeting Description</Text>
            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
              value={tempInputValue}
              onChangeText={setTempInputValue}
              placeholder="Enter meeting description (optional)"
              multiline
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowDescriptionModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={saveDescriptionInput}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Input Modal */}
      <Modal visible={showDateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Meeting Date</Text>
            <TextInput
              style={styles.modalInput}
              value={tempInputValue}
              onChangeText={setTempInputValue}
              placeholder="YYYY-MM-DD (e.g. 2025-10-05)"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowDateModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={saveDateInput}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Time Input Modal */}
      <Modal visible={showTimeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Meeting Time</Text>
            <TextInput
              style={styles.modalInput}
              value={tempInputValue}
              onChangeText={setTempInputValue}
              placeholder="HH:mm (e.g. 14:30)"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowTimeModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={saveTimeInput}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Duration Input Modal */}
      <Modal visible={showDurationModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Meeting Duration</Text>
            <TextInput
              style={styles.modalInput}
              value={tempInputValue}
              onChangeText={setTempInputValue}
              placeholder="Duration in minutes (optional)"
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowDurationModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={saveDurationInput}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notification Center */}
      <NotificationCenter 
        visible={showNotificationCenter} 
        onClose={() => setShowNotificationCenter(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  blueHeaderBackground: {
    backgroundColor: '#00418b',
    height: 90,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  whiteHeaderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: -40,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    zIndex: 2,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    color: '#222',
    fontFamily: 'Poppins-Bold',
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  headerSubtitle2: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginTop: 2,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
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
  classSelector: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  classScroll: {
    flexDirection: 'row',
  },
  classCard: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 200,
  },
  selectedClassCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  classCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classIcon: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
  },
  selectedClassIcon: {
    backgroundColor: '#DBEAFE',
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  selectedClassName: {
    color: '#3B82F6',
  },
  classCode: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  studentCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
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
    fontSize: 20,
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
  meetingCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  // Tab Navigation Styles
  tabContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  activeTabButton: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  noClassesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noClassesText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    fontWeight: '600',
  },
  noClassesSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Host Meeting Styles
  selectionCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  createButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  inputField: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  inputFieldText: {
    fontSize: 14,
    color: '#374151',
  },
  typeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  typePill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  typePillActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  typePillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  typePillTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 0,
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  clearAllText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  chipText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
  },
  chipRemove: {
    fontSize: 16,
    color: '#1E40AF',
    fontWeight: 'bold',
  },
  roleDropdown: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  roleDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F3F4F6',
  },
  roleHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  roleSelectionCount: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  roleUserCount: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  roleContent: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    gap: 12,
  },
  userRowSelected: {
    backgroundColor: '#EFF6FF',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelected: {
    backgroundColor: '#BFDBFE',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  avatarTextSelected: {
    color: '#1E40AF',
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  userEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  participantsList: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  participantsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  participantsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#374151',
    fontWeight: '500',
    fontSize: 16,
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  modalSaveText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
