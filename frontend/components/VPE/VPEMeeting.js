import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function VPEMeeting() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [academicContext, setAcademicContext] = useState('2025-2026 | Term 1');

  useEffect(() => {
    fetchAllMeetings();
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

      // Fetch all meetings across all classes
      const response = await fetch('https://juanlms-webapp-server.onrender.com/api/meetings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter meetings for current academic year and term
        const filteredMeetings = data.filter(meeting => {
          // You might need to adjust this filtering based on your data structure
          return meeting;
        });
        setMeetings(filteredMeetings);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
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
        Alert.alert('Meeting', `Joining meeting: ${meeting.title}`);
        // You can implement actual meeting joining logic here
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
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Meeting Overview</Text>
          <Text style={styles.subtitle}>{academicContext} | {new Date().toLocaleDateString()}</Text>
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
    </ScrollView>
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
