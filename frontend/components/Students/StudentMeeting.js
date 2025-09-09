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
  PermissionsAndroid
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
let StreamMeetingRoomNative = null;
if (Platform.OS !== 'web') {
  try { StreamMeetingRoomNative = require('../Meeting/StreamMeetingRoomNative').default; } catch (e) { /* noop on web */ }
}

const { width } = Dimensions.get('window');

export default function StudentMeeting() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [academicContext, setAcademicContext] = useState('2025-2026 | Term 1');
  const [activeMeeting, setActiveMeeting] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, []);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={styles.loadingText}>Loading classes...</Text>
      </View>
    );
  }

  if (classes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="account-group" size={64} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>No Active Classes</Text>
        <Text style={styles.emptyText}>There are no active classes to join meetings in for the current academic year.</Text>
      </View>
    );
  }

  return (
    <>
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Meeting</Text>
          <Text style={styles.subtitle}>{academicContext} | {new Date().toLocaleDateString()}</Text>
        </View>
      </View>

      {/* Class Selector */}
      <View style={styles.classSelector}>
        <Text style={styles.sectionTitle}>Select Class</Text>
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
                  <Text style={styles.classCode}>{classItem.classCode || classItem._id}</Text>
                  <Text style={styles.studentCount}>
                    {classItem.members?.length || 0} students
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
    </ScrollView>
    {activeMeeting && Platform.OS !== 'web' && StreamMeetingRoomNative && (
      <StreamMeetingRoomNative
        isOpen={!!activeMeeting}
        onClose={() => setActiveMeeting(null)}
        onLeave={() => setActiveMeeting(null)}
        meetingData={activeMeeting}
        currentUser={{ name: user?.name || user?.username || 'Student' }}
        credentials={{
          apiKey: 'mmhfdzb5evj2',
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Byb250by5nZXRzdHJlYW0uaW8iLCJzdWIiOiJ1c2VyL1dvb2xseV9QYXRjaCIsInVzZXJfaWQiOiJXb29sbHlfUGF0Y2giLCJ2YWxpZGl0eV9pbl9zZWNvbmRzIjo2MDQ4MDAsImlhdCI6MTc1NzM0MDk5OCwiZXhwIjoxNzU3OTQ1Nzk4fQ.nsL1ALmGwSTl8QUawile5zJdsCjGPW8lOkDy5vRWm2I',
          userId: 'Woolly_Patch',
          callId: '9IH1mIBCkfbdP9y4q34W2',
        }}
        isHost={false}
      />
    )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
});
