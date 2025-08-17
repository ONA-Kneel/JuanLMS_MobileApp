import React, { useState, useEffect } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StudentActsStyle from '../styles/Stud/StudentActsStyle';

const API_BASE = 'https://juanlms-webapp-server.onrender.com';

// Upcoming Activities Component
function Upcoming({ activities, onActivityPress }) {
  if (activities.length === 0) {
    return (
      <View style={styles.emptyTabContainer}>
        <MaterialCommunityIcons name="calendar-clock" size={64} color="#ccc" />
        <Text style={styles.emptyTabTitle}>No Upcoming Activities</Text>
        <Text style={styles.emptyTabText}>
          You have no upcoming assignments or activities due.
        </Text>
        {/* Debug section - remove in production */}
        <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
          <Text style={{ fontSize: 12, color: '#666', fontFamily: 'monospace' }}>
            Debug: Check console for activities data
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.contentTabContainer} showsVerticalScrollIndicator={false}>
      {activities.map((activity, index) => (
        <TouchableOpacity
          key={index}
          style={styles.activityCard}
          onPress={() => onActivityPress(activity)}
        >
          <View style={styles.activityHeader}>
            <View style={styles.activityIconContainer}>
              <MaterialIcons 
                name={activity.type === 'quiz' ? 'quiz' : 'assignment'} 
                size={24} 
                color={activity.type === 'quiz' ? '#9C27B0' : '#FF9800'} 
              />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityClass}>{activity.className}</Text>
              <Text style={styles.activityDue}>
                Due: {new Date(activity.dueDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </Text>
            </View>
            <View style={styles.activityPoints}>
              <Text style={styles.pointsText}>{activity.points || 0} pts</Text>
            </View>
          </View>
          
          {activity.description && (
            <Text style={styles.activityDescription} numberOfLines={2}>
              {activity.description}
            </Text>
          )}
          
          <View style={styles.activityFooter}>
            <View style={styles.activityStatus}>
              <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.statusText}>Upcoming</Text>
            </View>
            <View style={styles.attachmentsInfo}>
              <MaterialIcons name="info" size={16} color="#666" />
              <Text style={styles.attachmentsText}>Tap to view details</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// Past Due Activities Component
function PastDue({ activities, onActivityPress }) {
  if (activities.length === 0) {
    return (
      <View style={styles.emptyTabContainer}>
        <MaterialCommunityIcons name="calendar-remove" size={64} color="#ccc" />
        <Text style={styles.emptyTabTitle}>No Past Due Activities</Text>
        <Text style={styles.emptyTabText}>
          Great! You have no overdue assignments.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.contentTabContainer} showsVerticalScrollIndicator={false}>
      {activities.map((activity, index) => (
        <TouchableOpacity
          key={index}
          style={styles.activityCard}
          onPress={() => onActivityPress(activity)}
        >
          <View style={styles.activityHeader}>
            <View style={styles.activityIconContainer}>
              <MaterialIcons 
                name={activity.type === 'quiz' ? 'quiz' : 'assignment'} 
                size={24} 
                color="#f44336" 
              />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityClass}>{activity.className}</Text>
              <Text style={[styles.activityDue, { color: '#f44336' }]}>
                Overdue since: {new Date(activity.dueDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </View>
            <View style={styles.activityPoints}>
              <Text style={styles.pointsText}>{activity.points || 0} pts</Text>
            </View>
          </View>
          
          {activity.description && (
            <Text style={styles.activityDescription} numberOfLines={2}>
              {activity.description}
            </Text>
          )}
          
          <View style={styles.activityFooter}>
            <View style={styles.activityStatus}>
              <View style={[styles.statusDot, { backgroundColor: '#f44336' }]} />
              <Text style={[styles.statusText, { color: '#f44336' }]}>Past Due</Text>
            </View>
            
            <View style={styles.latePenalty}>
              <Text style={styles.latePenaltyText}>Late penalty may apply</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// Completed Activities Component
function Completed({ activities, onActivityPress }) {
  if (activities.length === 0) {
  return (
      <View style={styles.emptyTabContainer}>
        <MaterialCommunityIcons name="check-circle" size={64} color="#ccc" />
        <Text style={styles.emptyTabTitle}>No Completed Activities</Text>
        <Text style={styles.emptyTabText}>
          Complete some assignments to see them here.
        </Text>
    </View>
    );
}

  return (
    <ScrollView style={styles.contentTabContainer} showsVerticalScrollIndicator={false}>
      {activities.map((activity, index) => (
        <TouchableOpacity
          key={index}
          style={styles.activityCard}
          onPress={() => onActivityPress(activity)}
        >
          <View style={styles.activityHeader}>
            <View style={styles.activityIconContainer}>
              <MaterialIcons 
                name={activity.type === 'quiz' ? 'quiz' : 'assignment'} 
                size={24} 
                color="#4CAF50" 
              />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityClass}>{activity.className}</Text>
              <Text style={styles.activityDue}>
                Completed: {new Date(activity.submittedAt || activity.completedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </View>
            <View style={styles.activityPoints}>
              <Text style={styles.pointsText}>{activity.points || 0} pts</Text>
            </View>
          </View>
          
          {activity.description && (
            <Text style={styles.activityDescription} numberOfLines={2}>
              {activity.description}
            </Text>
          )}
          
          <View style={styles.activityFooter}>
            <View style={styles.activityStatus}>
              <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={[styles.statusText, { color: '#4CAF50' }]}>Completed</Text>
            </View>
            
            {activity.score !== undefined && (
              <View style={styles.scoreInfo}>
                <Text style={styles.scoreText}>
                  Score: {activity.score}/{activity.points || 100}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// Main StudentActs Component
export default function StudentActs() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchActivities();
  }, []);

  // Add focus listener to refresh activities when returning to this screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Refresh activities when screen comes into focus (e.g., after submission)
      fetchActivities();
    });

    return unsubscribe;
  }, [navigation]);

  // Add submission status checking for each activity
  const checkSubmissionStatuses = async (activitiesList) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const updatedActivities = await Promise.all(
        activitiesList.map(async (activity) => {
          if (activity.type === 'assignment') {
            try {
              // Check submission status for assignments
              const response = await fetch(`${API_BASE}/assignments/${activity._id}/submissions`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (response.ok) {
                const submissions = await response.json();
                console.log(`Submissions for assignment ${activity.title}:`, submissions);
                console.log(`Looking for student ID: ${user._id}`);
                
                // Check if any submission exists for this student
                const studentSubmission = submissions.find(sub => {
                  console.log(`Comparing submission student: ${sub.student} (type: ${typeof sub.student}) with user ID: ${user._id} (type: ${typeof user._id})`);
                  console.log(`Submission student object:`, sub.student);
                  console.log(`User object:`, user);
                  
                  // Try different ways to compare the IDs
                  const submissionStudentId = sub.student._id || sub.student;
                  const userId = user._id;
                  
                  console.log(`Comparing: ${submissionStudentId} === ${userId}`);
                  const isMatch = submissionStudentId === userId || submissionStudentId === userId.toString();
                  console.log(`Is match: ${isMatch}`);
                  
                  return isMatch;
                });
                
                if (studentSubmission) {
                  console.log(`Assignment ${activity.title} is already submitted:`, studentSubmission);
                  return { 
                    ...activity, 
                    submittedAt: studentSubmission.submittedAt || new Date(), 
                    status: 'submitted',
                    submissionId: studentSubmission._id,
                    isSubmitted: true
                  };
                }
              }
            } catch (error) {
              console.error('Error checking submission status:', error);
            }
          } else if (activity.type === 'quiz') {
            try {
              // Check submission status for quizzes
              const response = await fetch(`${API_BASE}/api/quizzes/${activity._id}/response/${user._id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (response.ok) {
                const quizResponse = await response.json();
                if (quizResponse) {
                  console.log(`Quiz ${activity.title} is already submitted:`, quizResponse);
                  return { 
                    ...activity, 
                    submittedAt: quizResponse.submittedAt || quizResponse.createdAt || new Date(), 
                    status: 'submitted',
                    submissionId: quizResponse._id,
                    isSubmitted: true
                  };
                }
              }
            } catch (error) {
              console.error('Error checking quiz response status:', error);
            }
          }
          return { ...activity, isSubmitted: false };
        })
      );
      
      console.log('Activities with submission status:', updatedActivities);
      return updatedActivities;
    } catch (error) {
      console.error('Error checking submission statuses:', error);
      return activitiesList;
    }
  };

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError('');
      const token = await AsyncStorage.getItem('jwtToken');
      
      // Fetch user's enrolled classes first
      const classesResponse = await fetch(`${API_BASE}/classes/my-classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!classesResponse.ok) {
        throw new Error('Failed to fetch classes');
      }
      
      const classes = await classesResponse.json();
      console.log('Classes for user:', classes);
      
      let allActivities = [];
      
      if (Array.isArray(classes)) {
        for (const cls of classes) {
          console.log('for class:', cls.className);
          
          // Fetch assignments for each class
          const assignmentsResponse = await fetch(`${API_BASE}/assignments?classID=${cls.classID}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (assignmentsResponse.ok) {
            const assignments = await assignmentsResponse.json();
            console.log('Assignments for class', cls.className + ':', assignments);
            const assignmentsWithType = assignments.map(assignment => ({
              ...assignment,
              type: 'assignment',
              className: cls.className,
              classCode: cls.classCode
            }));
            allActivities.push(...assignmentsWithType);
          }
          
          // Fetch quizzes for each class
          const quizzesResponse = await fetch(`${API_BASE}/api/quizzes?classID=${cls.classID}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (quizzesResponse.ok) {
            const quizzes = await quizzesResponse.json();
            console.log('Quizzes for class', cls.className + ':', quizzes);
            const quizzesWithType = quizzes.map(quiz => ({
              ...quiz,
              type: 'quiz',
              className: cls.className,
              classCode: cls.classCode
            }));
            allActivities.push(...quizzesWithType);
          }
        }
      }
      
      // Check submission statuses for all activities
      const activitiesWithStatus = await checkSubmissionStatuses(allActivities);
      
      // Sort by due date
      activitiesWithStatus.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      
      console.log('Fetched activities for StudentActs:', activitiesWithStatus);
      console.log('Total activities count:', activitiesWithStatus.length);
      setActivities(activitiesWithStatus);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

  // Force refresh activities (called when returning from submission screens)
  const refreshActivities = () => {
    console.log('Refreshing activities...');
    fetchActivities();
  };

  // Force complete refresh with submission status checking
  const forceRefresh = async () => {
    console.log('Force refreshing activities with submission status...');
    setRefreshing(true);
    try {
      await fetchActivities();
    } finally {
      setRefreshing(false);
    }
  };

  // Debug function to check submission status manually
  const debugSubmissionStatus = async () => {
    if (activities.length === 0) return;
    
    const activity = activities[0];
    console.log('Debugging submission status for:', activity.title);
    
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE}/assignments/${activity._id}/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const submissions = await response.json();
        console.log('All submissions for this assignment:', submissions);
        console.log('Current user ID:', user._id);
        
        const studentSubmission = submissions.find(sub => 
          sub.student === user._id || sub.student._id === user._id
        );
        
        if (studentSubmission) {
          console.log('Found student submission:', studentSubmission);
          console.log('Submitted at:', studentSubmission.submittedAt);
          console.log('Status:', studentSubmission.status);
        } else {
          console.log('No submission found for this student');
        }
      }
    } catch (error) {
      console.error('Error debugging submission status:', error);
    }
  };

  // Add this to the navigation listener to refresh when returning from submission
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Refresh activities when screen comes into focus (e.g., after submission)
      refreshActivities();
    });

    return unsubscribe;
  }, [navigation]);

  const handleActivityPress = (activity) => {
    setSelectedActivity(activity);
    setShowActivityModal(true);
  };

  const navigateToActivity = (activity) => {
    setShowActivityModal(false);
    
    if (activity.type === 'quiz') {
      navigation.navigate('QuizView', { quizId: activity._id });
    } else {
      // Navigate to assignment detail or submission
      console.log('Navigating to AssignmentDetail with callback:', refreshActivities);
      navigation.navigate('AssignmentDetail', { 
        assignmentId: activity._id,
        assignment: activity,
        onSubmissionComplete: () => {
          console.log('Submission completed, refreshing activities...');
          // Force immediate refresh
          setTimeout(() => {
            refreshActivities();
          }, 100);
        }
      });
    }
  };

  const formatDateTime = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getUpcomingActivities = () => {
    const now = new Date();
    const upcoming = activities.filter(activity => {
      const dueDate = new Date(activity.dueDate);
      // Only show as upcoming if not submitted and due date is in the future
      return dueDate > now && !activity.isSubmitted;
    });
    console.log('Upcoming activities:', upcoming);
    return upcoming;
  };

  const getPastDueActivities = () => {
    const now = new Date();
    const pastDue = activities.filter(activity => {
      const dueDate = new Date(activity.dueDate);
      // Show as past due if not submitted and due date has passed
      return dueDate < now && !activity.isSubmitted;
    });
    console.log('Past due activities:', pastDue);
    return pastDue;
  };

  const getCompletedActivities = () => {
    const completed = activities.filter(activity => {
      // Show as completed if submitted (regardless of due date)
      return activity.isSubmitted;
    });
    console.log('Completed activities:', completed);
    return completed;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <Upcoming activities={getUpcomingActivities()} onActivityPress={handleActivityPress} />;
      case 1:
        return <PastDue activities={getPastDueActivities()} onActivityPress={handleActivityPress} />;
      case 2:
        return <Completed activities={getCompletedActivities()} onActivityPress={handleActivityPress} />;
      default:
        return <Upcoming activities={getUpcomingActivities()} onActivityPress={handleActivityPress} />;
    }
  };

  // Calculate counts once to avoid multiple function calls in render
  const upcomingCount = getUpcomingActivities().length;
  const pastDueCount = getPastDueActivities().length;
  const completedCount = getCompletedActivities().length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={styles.loadingText}>Loading activities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activities</Text>
        <Text style={styles.headerSubtitle}>
          {formatDateTime(currentDateTime)}
        </Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={refreshActivities}
        >
          <MaterialIcons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 0 && styles.activeTab]}
            onPress={() => setActiveTab(0)}
          >
            <Text style={[styles.tabText, activeTab === 0 && styles.activeTabText]}>
              Upcoming ({upcomingCount})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 1 && styles.activeTab]}
            onPress={() => setActiveTab(1)}
          >
            <Text style={[styles.tabText, activeTab === 1 && styles.activeTabText]}>
              Past Due ({pastDueCount})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 2 && styles.activeTab]}
            onPress={() => setActiveTab(2)}
          >
            <Text style={[styles.tabText, activeTab === 2 && styles.activeTabText]}>
              Completed ({completedCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={64} color="#f44336" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchActivities}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
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
            {renderTabContent()}
            {/* Debug section - remove in production */}
            <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: '#666', fontFamily: 'monospace' }}>
                Debug: Check console for activities data
              </Text>
              <Text style={{ fontSize: 10, color: '#888', fontFamily: 'monospace', marginTop: 4 }}>
                Total: {activities.length} | Upcoming: {upcomingCount} | Past Due: {pastDueCount} | Completed: {completedCount}
              </Text>
              {activities.length > 0 && (
                <Text style={{ fontSize: 10, color: '#888', fontFamily: 'monospace', marginTop: 4 }}>
                  First activity: {activities[0]?.title} - Status: {activities[0]?.status || 'unknown'} - Submitted: {activities[0]?.isSubmitted ? 'Yes' : 'No'} - SubmittedAt: {activities[0]?.submittedAt ? new Date(activities[0].submittedAt).toLocaleString() : 'N/A'}
                </Text>
              )}
              <TouchableOpacity 
                style={{ marginTop: 8, backgroundColor: '#00418b', padding: 8, borderRadius: 4, alignItems: 'center' }}
                onPress={forceRefresh}
              >
                <Text style={{ color: 'white', fontSize: 12 }}>Force Refresh</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ marginTop: 8, backgroundColor: '#ff9800', padding: 8, borderRadius: 4, alignItems: 'center' }}
                onPress={debugSubmissionStatus}
              >
                <Text style={{ color: 'white', fontSize: 12 }}>Debug Submission Status</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>

      {/* Activity Details Modal */}
      <Modal
        visible={showActivityModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActivityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Activity Details</Text>
              <TouchableOpacity onPress={() => setShowActivityModal(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedActivity && (
              <ScrollView style={styles.modalContent}>
                <View style={styles.modalActivityHeader}>
                  <MaterialIcons 
                    name={selectedActivity.type === 'quiz' ? 'quiz' : 'assignment'} 
                    size={32} 
                    color={selectedActivity.type === 'quiz' ? '#9C27B0' : '#FF9800'} 
                  />
                  <Text style={styles.modalActivityTitle}>{selectedActivity.title}</Text>
                  <Text style={styles.modalActivityType}>
                    {selectedActivity.type === 'quiz' ? 'Quiz' : 'Assignment'}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Details</Text>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Class:</Text>
                    <Text style={styles.modalDetailValue}>{selectedActivity.className}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Due Date:</Text>
                    <Text style={styles.modalDetailValue}>
                      {new Date(selectedActivity.dueDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Points:</Text>
                    <Text style={styles.modalDetailValue}>{selectedActivity.points || 0} points</Text>
                  </View>
                </View>

                {selectedActivity.description && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Description</Text>
                    <Text style={styles.modalDescription}>{selectedActivity.description}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.modalActionButton}
                  onPress={() => navigateToActivity(selectedActivity)}
                >
                  <Text style={styles.modalActionButtonText}>
                    {selectedActivity.type === 'quiz' ? 'Take Quiz' : 'View Assignment'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#00418b',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  refreshButton: {
    padding: 8,
  },
  tabContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#00418b',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#00418b',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  contentTabContainer: {
    flex: 1,
    padding: 20,
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
    marginRight: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  activityClass: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  activityDue: {
    fontSize: 12,
    color: '#999',
  },
  activityPoints: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00418b',
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  attachmentsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  latePenalty: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  latePenaltyText: {
    fontSize: 12,
    color: '#f44336',
    fontWeight: '500',
  },
  scoreInfo: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  emptyTabContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTabTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyTabText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#00418b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    padding: 20,
  },
  modalActivityHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalActivityTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalActivityType: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalDetailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  modalDetailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalActionButton: {
    backgroundColor: '#00418b',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  modalActionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
};