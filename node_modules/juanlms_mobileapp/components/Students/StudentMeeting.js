import React, { useState, useEffect } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

const { width } = Dimensions.get('window');

const API_BASE = 'https://juanlms-webapp-server.onrender.com';

export default function StudentMeeting() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [academicYear, setAcademicYear] = useState(null);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [showClassSelector, setShowClassSelector] = useState(false);

  // Fetch academic year
  useEffect(() => {
    const fetchAcademicYear = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        const yearRes = await fetch(`${API_BASE}/api/schoolyears/active`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (yearRes.ok) {
          const year = await yearRes.json();
          console.log("Student Meeting - Fetched academic year:", year);
          setAcademicYear(year);
        }
      } catch (err) {
        console.error("Failed to fetch academic year", err);
      }
    };
    fetchAcademicYear();
  }, []);

  // Fetch active term for year
  useEffect(() => {
    const fetchActiveTermForYear = async () => {
      if (!academicYear) return;
      try {
        const schoolYearName = `${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}`;
        const token = await AsyncStorage.getItem('jwtToken');
        const res = await fetch(`${API_BASE}/api/terms/schoolyear/${schoolYearName}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const terms = await res.json();
          const active = terms.find(term => term.status === 'active');
          setCurrentTerm(active || null);
        } else {
          setCurrentTerm(null);
        }
      } catch (err) {
        console.error("Student Meeting - Error fetching terms:", err);
        setCurrentTerm(null);
      }
    };
    fetchActiveTermForYear();
  }, [academicYear]);

  // Fetch student's classes for the current active term
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        if (!token) return;
        
        // Only fetch classes if we have both an active school year AND an active term
        if (!academicYear || !currentTerm) {
          setClasses([]);
          setSelectedClass(null);
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/api/classes/my-classes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Filter classes to only show those active for the current term
          const activeClasses = data.filter(cls => {
            // MUST have termName and match current term
            if (!cls.termName || cls.termName !== currentTerm.termName) {
              return false;
            }
            // MUST have academicYear and match current academic year
            if (!cls.academicYear || !academicYear) {
              return false;
            }
            const expectedYear = `${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}`;
            if (cls.academicYear !== expectedYear) {
              return false;
            }
            // MUST be not archived
            if (cls.isArchived === true) {
              return false;
            }
            return true;
          });
          
          setClasses(activeClasses || []);
          if (activeClasses && activeClasses.length > 0) {
            setSelectedClass(activeClasses[0]);
            fetchMeetings(activeClasses[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch student classes', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [currentTerm, academicYear]);

  // Fetch meetings for selected class
  const fetchMeetings = async (classId) => {
    if (!classId) return;
    
    try {
      setMeetingsLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE}/api/meetings/class/${classId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setMeetings(result || []);
      } else {
        console.error('Failed to fetch meetings');
        setMeetings([]);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setMeetings([]);
    } finally {
      setMeetingsLoading(false);
    }
  };

  const handleJoinMeeting = async (meeting) => {
    try {
      console.log('[DEBUG] Student handleJoinMeeting received:', meeting);
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE}/api/meetings/${meeting._id}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (response.ok && result.roomUrl) {
        // For mobile, we'll open the meeting URL in a web browser or handle it differently
        Alert.alert(
          'Join Meeting',
          'Meeting room is ready. Would you like to join?',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Join',
              onPress: () => {
                // Here you would typically open the video meeting
                // For now, we'll show an alert
                Alert.alert('Meeting', 'Video meeting functionality will be implemented here.');
              }
            }
          ]
        );
        
        // Refresh meetings to update participant count
        fetchMeetings(selectedClass._id);
      } else {
        Alert.alert('Error', result.message || 'Failed to join meeting');
      }
    } catch (error) {
      console.error('Error joining meeting:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (selectedClass) {
        await fetchMeetings(selectedClass._id);
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
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
      return { label: 'Ended', color: '#9CA3AF', bgColor: '#F3F4F6' };
    }
    
    if (meeting.meetingType === 'instant') {
      if (meeting.isActive) {
        return { label: 'Live', color: '#DC2626', bgColor: '#FEE2E2' };
      } else {
        return { label: 'Not Started', color: '#D97706', bgColor: '#FEF3C7' };
      }
    }
    
    if (meeting.isCurrentlyActive) {
      return { label: 'Live', color: '#DC2626', bgColor: '#FEE2E2' };
    }
    
    const now = new Date();
    const scheduledTime = new Date(meeting.scheduledTime);
    
    if (scheduledTime > now) {
      return { label: 'Scheduled', color: '#2563EB', bgColor: '#DBEAFE' };
    } else {
      return { label: 'Ended', color: '#9CA3AF', bgColor: '#F3F4F6' };
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
        <Text style={styles.loadingText}>Loading classes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meeting</Text>
        <Text style={styles.headerSubtitle}>
          {academicYear ? `${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}` : "Loading..."} | 
          {currentTerm ? `${currentTerm.termName}` : "Loading..."} | 
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>

      {!academicYear ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="calendar" size={64} color="#ccc" />
          <Text style={styles.emptyStateTitle}>No Active School Year</Text>
          <Text style={styles.emptyStateText}>There is no active school year configured.</Text>
          <Text style={styles.emptyStateSubtext}>Please ask the administrator to activate a school year.</Text>
        </View>
      ) : !currentTerm ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="calendar" size={64} color="#ccc" />
          <Text style={styles.emptyStateTitle}>No Active Term</Text>
          <Text style={styles.emptyStateText}>There is no active term for the current academic year.</Text>
          <Text style={styles.emptyStateSubtext}>Please ask the administrator to activate a term.</Text>
        </View>
      ) : classes.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="account-group" size={64} color="#ccc" />
          <Text style={styles.emptyStateTitle}>No Active Classes</Text>
          <Text style={styles.emptyStateText}>There are no active classes to set meetings in for the current academic year.</Text>
          <Text style={styles.emptyStateSubtext}>Please ask the administrator to activate a school year and enroll you in classes.</Text>
        </View>
      ) : (
        <>
          {/* Class Selector */}
          <View style={styles.classSelectorContainer}>
            <View style={styles.classSelectorHeader}>
              <Text style={styles.classSelectorTitle}>Select Class</Text>
              <TouchableOpacity 
                style={styles.classSelectorButton}
                onPress={() => setShowClassSelector(!showClassSelector)}
              >
                <Text style={styles.classSelectorButtonText}>
                  {selectedClass ? selectedClass.className || selectedClass.name : 'Select Class'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Class Dropdown */}
            {showClassSelector && (
              <View style={styles.classDropdown}>
                {classes.map((classItem) => (
                  <TouchableOpacity
                    key={classItem._id}
                    style={[
                      styles.classOption,
                      selectedClass?._id === classItem._id && styles.classOptionSelected
                    ]}
                    onPress={() => {
                      setSelectedClass(classItem);
                      setShowClassSelector(false);
                      fetchMeetings(classItem._id);
                    }}
                  >
                    <View style={styles.classOptionContent}>
                      <MaterialCommunityIcons 
                        name="account-group" 
                        size={20} 
                        color={selectedClass?._id === classItem._id ? "#00418b" : "#666"} 
                      />
                      <View style={styles.classOptionText}>
                        <Text style={[
                          styles.classOptionName,
                          selectedClass?._id === classItem._id && styles.classOptionNameSelected
                        ]}>
                          {classItem.className || classItem.name}
                        </Text>
                        <Text style={styles.classOptionCode}>
                          {classItem.classCode || classItem._id}
                        </Text>
                        <Text style={styles.classOptionStudents}>
                          {(classItem.members?.length || 0)} students
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Meeting List */}
          {selectedClass && (
            <View style={styles.meetingsContainer}>
              <View style={styles.meetingsHeader}>
                <View style={styles.meetingsTitleContainer}>
                  <MaterialIcons name="video-call" size={24} color="#00418b" />
                  <Text style={styles.meetingsTitle}>
                    Meetings for {selectedClass.className || selectedClass.name}
                  </Text>
                </View>
                <Text style={styles.meetingsSubtitle}>
                  Class ID: {selectedClass._id}
                </Text>
              </View>

              <ScrollView
                style={styles.meetingsList}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#00418b']}
                    tintColor="#00418b"
                  />
                }
                showsVerticalScrollIndicator={false}
              >
                {meetingsLoading ? (
                  <View style={styles.meetingsLoading}>
                    <ActivityIndicator size="small" color="#00418b" />
                    <Text style={styles.meetingsLoadingText}>Loading meetings...</Text>
                  </View>
                ) : meetings.length === 0 ? (
                  <View style={styles.noMeetings}>
                    <MaterialIcons name="video-call" size={48} color="#ccc" />
                    <Text style={styles.noMeetingsText}>No meetings scheduled for this class</Text>
                  </View>
                ) : (
                  <MeetingList 
                    meetings={meetings}
                    onJoinMeeting={handleJoinMeeting}
                    groupMeetingsByDate={groupMeetingsByDate}
                    getGroupTitle={getGroupTitle}
                    getMeetingStatus={getMeetingStatus}
                    formatDateTime={formatDateTime}
                  />
                )}
              </ScrollView>
            </View>
          )}
        </>
      )}
    </View>
  );
}

// MeetingList Component
const MeetingList = ({ meetings, onJoinMeeting, groupMeetingsByDate, getGroupTitle, getMeetingStatus, formatDateTime }) => {
  const groupedMeetings = groupMeetingsByDate(meetings);

  return (
    <View style={styles.meetingListContainer}>
      {Object.entries(groupedMeetings).map(([groupKey, groupMeetings]) => (
        <View key={groupKey} style={styles.meetingGroup}>
          <Text style={styles.meetingGroupTitle}>
            {getGroupTitle(groupKey)}
          </Text>
          <View style={styles.meetingGroupContent}>
            {groupMeetings.map((meeting) => {
              const status = getMeetingStatus(meeting);
              
              return (
                <View key={meeting._id} style={styles.meetingCard}>
                  <View style={styles.meetingCardHeader}>
                    <Text style={styles.meetingTitle}>{meeting.title}</Text>
                    <View style={[styles.meetingStatus, { backgroundColor: status.bgColor }]}>
                      <Text style={[styles.meetingStatusText, { color: status.color }]}>
                        {status.label}
                      </Text>
                    </View>
                  </View>
                  
                  {meeting.description && (
                    <Text style={styles.meetingDescription}>{meeting.description}</Text>
                  )}
                  
                  <View style={styles.meetingDetails}>
                    <View style={styles.meetingDetail}>
                      <MaterialIcons name="event" size={16} color="#666" />
                      <Text style={styles.meetingDetailText}>
                        {formatDateTime(meeting.scheduledTime)}
                      </Text>
                    </View>
                    <View style={styles.meetingDetail}>
                      <MaterialIcons name="access-time" size={16} color="#666" />
                      <Text style={styles.meetingDetailText}>
                        {meeting.duration} min
                      </Text>
                    </View>
                    <View style={styles.meetingDetail}>
                      <MaterialIcons name="people" size={16} color="#666" />
                      <Text style={styles.meetingDetailText}>
                        {meeting.participantCount || 0} participants
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.joinButton}
                    onPress={() => onJoinMeeting(meeting)}
                  >
                    <MaterialIcons name="play-arrow" size={20} color="white" />
                    <Text style={styles.joinButtonText}>Join</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#00418b',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
  },
  classSelectorContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  classSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classSelectorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  classSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  classSelectorButtonText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  classDropdown: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 16,
  },
  classOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  classOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  classOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  classOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  classOptionNameSelected: {
    color: '#00418b',
  },
  classOptionCode: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  classOptionStudents: {
    fontSize: 12,
    color: '#999',
  },
  meetingsContainer: {
    flex: 1,
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  meetingsHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  meetingsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  meetingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  meetingsSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  meetingsList: {
    flex: 1,
  },
  meetingsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  meetingsLoadingText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#666',
  },
  noMeetings: {
    alignItems: 'center',
    padding: 40,
  },
  noMeetingsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  meetingListContainer: {
    padding: 20,
  },
  meetingGroup: {
    marginBottom: 24,
  },
  meetingGroupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  meetingGroupContent: {
    gap: 12,
  },
  meetingCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  meetingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  meetingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  meetingStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  meetingStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  meetingDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  meetingDetails: {
    marginBottom: 16,
  },
  meetingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  meetingDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00418b',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  joinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});
