import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://juanlms-webapp-server.onrender.com';

const InvitedMeetings = ({ onJoinMeeting, refreshTrigger = 0 }) => {
  const [invitedMeetings, setInvitedMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInvitedMeetings();
  }, [refreshTrigger]);

  const fetchInvitedMeetings = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return;

      console.log('[INVITED-MEETINGS] Fetching invited meetings');
      
      const response = await fetch(`${API_BASE}/api/meetings/invited`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const meetings = await response.json();
        
        // Deduplicate meetings by _id to prevent duplicates
        const uniqueMeetings = meetings.filter((meeting, index, self) => 
          index === self.findIndex(m => m._id === meeting._id)
        );
        
        console.log(`[INVITED-MEETINGS] Found ${meetings.length} meetings, ${uniqueMeetings.length} unique after deduplication`);
        setInvitedMeetings(uniqueMeetings);
        setError('');
      } else {
        setError('Failed to fetch invited meetings');
      }
    } catch (error) {
      console.error('Error fetching invited meetings:', error);
      setError('Error loading invited meetings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvitedMeetings();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMeetingStatus = (meeting) => {
    if (!meeting.scheduledTime) return 'instant';
    const now = new Date();
    const scheduled = new Date(meeting.scheduledTime);
    const endTime = new Date(scheduled.getTime() + (meeting.duration || 60) * 60000);
    
    if (now < scheduled) return 'upcoming';
    if (now >= scheduled && now <= endTime) return 'live';
    return 'ended';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return { color: '#059669', bgColor: '#d1fae5' };
      case 'upcoming': return { color: '#2563eb', bgColor: '#dbeafe' };
      case 'instant': return { color: '#7c3aed', bgColor: '#ede9fe' };
      case 'ended': return { color: '#6b7280', bgColor: '#f3f4f6' };
      default: return { color: '#6b7280', bgColor: '#f3f4f6' };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'live': return 'videocam';
      case 'upcoming': return 'schedule';
      case 'instant': return 'videocam';
      case 'ended': return 'event';
      default: return 'event';
    }
  };

  const handleJoinMeeting = async (meeting) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE}/api/meetings/${meeting._id}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const enriched = { ...meeting, roomUrl: result.roomUrl, meetingId: String(meeting._id) };
        
        if (onJoinMeeting) {
          onJoinMeeting(enriched);
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

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Direct Invitations</Text>
          <Text style={styles.headerSubtitle}>Loading invited meetings...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading invited meetings...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Direct Invitations</Text>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="error" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchInvitedMeetings}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Direct Invitations</Text>
        <Text style={styles.headerSubtitle}>{invitedMeetings.length} meeting(s)</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {invitedMeetings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="videocam" size={48} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No direct invitations</Text>
            <Text style={styles.emptySubtitle}>
              You haven't been invited to any meetings by VPE or Principal yet.
            </Text>
          </View>
        ) : (
          <View style={styles.meetingsList}>
            {invitedMeetings.map((meeting) => {
              const status = getMeetingStatus(meeting);
              const statusStyle = getStatusColor(status);
              const canJoin = status === 'live' || status === 'instant' || status === 'upcoming';
              
              return (
                <View key={meeting._id} style={styles.meetingCard}>
                  <View style={styles.meetingHeader}>
                    <View style={styles.meetingTitleContainer}>
                      <Text style={styles.meetingTitle}>{meeting.title}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bgColor }]}>
                        <Icon name={getStatusIcon(status)} size={16} color={statusStyle.color} />
                        <Text style={[styles.statusText, { color: statusStyle.color }]}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  {meeting.description && (
                    <Text style={styles.meetingDescription}>{meeting.description}</Text>
                  )}
                  
                  <View style={styles.meetingDetails}>
                    <View style={styles.detailItem}>
                      <Icon name="person" size={16} color="#6b7280" />
                      <Text style={styles.detailText}>
                        Created by: {meeting.createdBy?.firstName} {meeting.createdBy?.lastName}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Icon name="event" size={16} color="#6b7280" />
                      <Text style={styles.detailText}>{formatDate(meeting.scheduledTime)}</Text>
                    </View>
                    {meeting.duration && (
                      <View style={styles.detailItem}>
                        <Icon name="schedule" size={16} color="#6b7280" />
                        <Text style={styles.detailText}>{meeting.duration} minutes</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.meetingActions}>
                    {canJoin ? (
                      <TouchableOpacity
                        style={styles.joinButton}
                        onPress={() => handleJoinMeeting(meeting)}
                      >
                        <Icon name="play-arrow" size={20} color="white" />
                        <Text style={styles.joinButtonText}>
                          {status === 'live' ? 'Join Now' : status === 'upcoming' ? 'Join When Ready' : 'Join Meeting'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.endedButton}>
                        <Text style={styles.endedButtonText}>Meeting Ended</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  meetingsList: {
    padding: 16,
  },
  meetingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  meetingHeader: {
    marginBottom: 12,
  },
  meetingTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  meetingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  meetingDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  meetingDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  meetingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  endedButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  endedButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default InvitedMeetings;

