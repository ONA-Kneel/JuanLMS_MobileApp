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
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://juanlms-webapp-server.onrender.com';

// Helper function to format date and time
const formatDateTime = (dateString) => {
  if (!dateString) return 'No due date';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Activity Card Component
function ActivityCard({ activity, onActivityPress }) {
  const navigation = useNavigation();
  
  if (!activity || !onActivityPress) {
    console.error('DEBUG: ActivityCard received invalid props:', { activity, onActivityPress });
    return null;
  }

  if (!activity._id || !activity.type || !activity.title) {
    console.error('DEBUG: ActivityCard received invalid activity object:', activity);
    return null;
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'quiz':
        return { name: 'quiz', color: '#9C27B0' };
      case 'assignment':
        return { name: 'assignment', color: '#FF9800' };
      default:
        return { name: 'school', color: '#4CAF50' };
    }
  };

  const icon = getActivityIcon(activity.type);

  const handleViewButtonPress = () => {
    console.log('DEBUG: ActivityCard view button pressed for:', activity._id);
    try {
      onActivityPress(activity);
    } catch (error) {
      console.error('DEBUG: Error in ActivityCard view button press:', error);
    }
  };

  const handleResultsButtonPress = () => {
    console.log('DEBUG: ActivityCard results button pressed for:', activity._id);
    try {
      navigation.navigate('QuizView', { quizId: activity._id, review: true });
    } catch (error) {
      console.error('DEBUG: Error in ActivityCard results button press:', error);
    }
  };

  return (
    <View style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <View style={styles.activityIconContainer}>
          <MaterialIcons 
            name={icon.name} 
            size={24} 
            color={icon.color} 
          />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <Text style={styles.activityClass}>{activity.className || 'Unknown Class'}</Text>
          {activity.description && (
            <Text style={styles.activityDescription} numberOfLines={2}>
              {activity.description}
            </Text>
          )}
          <Text style={styles.activityDueDate}>
            Due: {formatDateTime(activity.dueDate)}
          </Text>
          <Text style={styles.activityType}>
            Type: {activity.type ? activity.type.charAt(0).toUpperCase() + activity.type.slice(1) : 'Activity'}
          </Text>
        </View>
        <View style={styles.activityPoints}>
          <Text style={styles.pointsText}>
            {activity.type === 'quiz' 
              ? (activity.totalPoints || activity.points || 0) 
              : (activity.points !== undefined && activity.points !== null ? activity.points : 0)
            } pts
          </Text>
        </View>
      </View>
      
      <View style={styles.activityFooter}>
        <View style={styles.activityStats}>
          <View style={styles.statItem}>
            <MaterialIcons name="schedule" size={16} color="#666" />
            <Text style={styles.statText}>
              {activity.isSubmitted ? 'Completed' : 'Pending'}
            </Text>
          </View>
          {activity.isSubmitted && activity.score !== undefined && (
            <View style={styles.statItem}>
              <MaterialIcons name="grade" size={16} color="#4CAF50" />
              <Text style={styles.statText}>
                Score: {activity.score}/{activity.type === 'quiz' ? (activity.totalPoints || activity.points || 100) : (activity.points || 100)}
              </Text>
            </View>
          )}
          {activity.isSubmitted && activity.type === 'quiz' && activity.percentage !== undefined && (
            <View style={styles.statItem}>
              <MaterialIcons name="percent" size={16} color="#FF9800" />
              <Text style={styles.statText}>
                {activity.percentage}%
              </Text>
            </View>
          )}
          {activity.isSubmitted && activity.type === 'quiz' && activity.timeSpent !== undefined && (
            <View style={styles.statItem}>
              <MaterialIcons name="schedule" size={16} color="#2196F3" />
              <Text style={styles.statText}>
                {Math.floor(activity.timeSpent / 60)}m {activity.timeSpent % 60}s
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtonsRow}>
          {activity.type === 'quiz' && activity.isSubmitted && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.resultsButton]}
              onPress={handleResultsButtonPress}
            >
              <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.resultsButtonText}>View Results</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.actionButton, styles.viewButton]}
            onPress={handleViewButtonPress}
          >
            <MaterialIcons name="visibility" size={16} color="#2196F3" />
            <Text style={styles.viewButtonText}>
              {activity.isSubmitted ? 'View Details' : 'Start'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Main StudentActs Component
export default function StudentActs() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [completedActivities, setCompletedActivities] = useState([]);

  useEffect(() => {
    if (user && user._id) {
      fetchActivities();
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchActivities();
    });
    return unsubscribe;
  }, [navigation]);

  const checkSubmissionStatuses = async (activitiesList) => {
    try {
      console.log('DEBUG: checkSubmissionStatuses called with', activitiesList.length, 'activities');
      const token = await AsyncStorage.getItem('jwtToken');
      const updatedActivities = await Promise.all(
        activitiesList.map(async (activity) => {
          if (activity.type === 'assignment') {
            try {
              const response = await fetch(`${API_BASE}/assignments/${activity._id}/submissions`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (response.ok) {
                const submissions = await response.json();
                console.log(`DEBUG: Submissions for assignment ${activity._id}:`, submissions.length);
                const studentSubmission = submissions.find(sub => {
                  const assignmentMatches = sub.assignment === activity._id || 
                                          sub.assignment?._id === activity._id ||
                                          sub.assignmentId === activity._id;
                  
                  if (!assignmentMatches) return false;
                  
                  let matches = false;
                  if (sub.student && typeof sub.student === 'object' && sub.student._id) {
                    matches = sub.student._id === user.userID || 
                             sub.student._id === user._id ||
                             sub.student.userID === user.userID ||
                             sub.student.studentID === user.userID;
                  } else {
                    matches = sub.student === user.userID || 
                             sub.student === user._id ||
                             sub.student === user.userID.toString() || 
                             sub.student === user._id.toString();
                  }
                  
                  console.log(`DEBUG: Assignment ${activity._id} - student match:`, matches);
                  return matches;
                });
                
                if (studentSubmission) {
                  console.log(`DEBUG: Found submission for assignment ${activity._id}`);
                  return { 
                    ...activity, 
                    submittedAt: studentSubmission.submittedAt || new Date(), 
                    status: 'submitted',
                    submissionId: studentSubmission._id,
                    isSubmitted: true,
                    score: studentSubmission.grade || 0
                  };
                } else {
                  console.log(`DEBUG: No submission found for assignment ${activity._id}`);
                  return {
                    ...activity,
                    isSubmitted: false,
                    status: 'not_submitted',
                    score: 0
                  };
                }
              }
            } catch (error) {
              console.error('Error checking submission status:', error);
            }
          } else if (activity.type === 'quiz') {
            try {
              const response = await fetch(`${API_BASE}/api/quizzes/${activity._id}/responses`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (response.ok) {
                const responseData = await response.json();
                console.log(`DEBUG: Quiz responses for ${activity._id}:`, responseData.length);
                
                if (Array.isArray(responseData)) {
                  const studentResponse = responseData.find(resp => {
                    const studentField = resp.student || resp.studentId;
                    const matchesQuiz = resp.quiz === activity._id || 
                                       resp.quiz?._id === activity._id ||
                                       resp.quizId === activity._id;
                                       
                    const matchesStudent = studentField && (
                      studentField._id === user.userID ||
                      studentField._id === user._id ||
                      studentField === user.userID ||
                      studentField === user._id ||
                      studentField.userID === user.userID ||
                      studentField.studentID === user.userID
                    );
                    
                    console.log(`DEBUG: Quiz ${activity._id} - quiz match: ${matchesQuiz}, student match: ${matchesStudent}`);
                    return matchesQuiz && matchesStudent;
                  });
                  
                  if (studentResponse) {
                    console.log(`DEBUG: Found response for quiz ${activity._id}`);
                    let percentage = studentResponse.percentage;
                    if (percentage === undefined && studentResponse.score !== undefined && studentResponse.total !== undefined) {
                      percentage = Math.round((studentResponse.score / studentResponse.total) * 100);
                    }
                    
                    activity.submittedAt = studentResponse.submittedAt || new Date();
                    activity.status = 'submitted';
                    activity.isSubmitted = true;
                    activity.score = studentResponse.score || 0;
                    activity.totalPoints = studentResponse.total || activity.points || 10;
                    activity.percentage = percentage || 0;
                    activity.timeSpent = studentResponse.timeSpent || 'N/A';
                  } else {
                    console.log(`DEBUG: No response found for quiz ${activity._id}`);
                    activity.isSubmitted = false;
                    activity.status = 'not_submitted';
                    activity.score = 0;
                    activity.totalPoints = activity.points || 10;
                    activity.percentage = 0;
                  }
                } else {
                  activity.isSubmitted = false;
                  activity.status = 'not_submitted';
                  activity.score = 0;
                  activity.totalPoints = activity.points || 10;
                  activity.percentage = 0;
                }
              } else {
                activity.isSubmitted = false;
                activity.status = 'error';
                activity.score = 0;
                activity.totalPoints = activity.points || 10;
                activity.percentage = 0;
              }
            } catch (error) {
              console.log('Error checking quiz submission for', activity._id, ':', error);
              activity.isSubmitted = false;
              activity.status = 'error';
              activity.score = 0;
              activity.totalPoints = activity.points || 10;
              activity.percentage = 0;
            }
          }
          
          return activity;
        })
      );
      
      const completed = updatedActivities.filter(a => a.isSubmitted);
      setCompletedActivities(completed);
      
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
      
      if (!user || !user._id) {
        throw new Error('User data not found');
      }

      console.log('DEBUG: Fetching activities for student:', user._id);

      // Get classes where this student is enrolled
      const classesResponse = await fetch(`${API_BASE}/classes/my-classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!classesResponse.ok) {
        throw new Error('Failed to fetch student classes');
      }

      const classesData = await classesResponse.json();
      const studentClasses = Array.isArray(classesData) ? classesData : [];

      console.log('DEBUG: Student classes found:', studentClasses.length);

      if (studentClasses.length === 0) {
        console.log('DEBUG: No classes found for student');
        setActivities([]);
        setLoading(false);
        return;
      }

      // Get all class IDs for this student
      const studentClassIDs = studentClasses.map(cls => cls.classID);
      console.log('DEBUG: Student class IDs:', studentClassIDs);

      // Fetch assignments per class (like StudentClasses.js does successfully)
      const allAssignments = [];
      for (const studentClass of studentClasses) {
        console.log(`DEBUG: Fetching assignments for class: ${studentClass.classID} (${studentClass.className})`);
        const assignmentRes = await fetch(`${API_BASE}/assignments?classID=${encodeURIComponent(studentClass.classID)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (assignmentRes.ok) {
          const assignmentData = await assignmentRes.json();
          console.log(`DEBUG: Class ${studentClass.classID} returned ${assignmentData.length} assignments`);
          allAssignments.push(...(Array.isArray(assignmentData) ? assignmentData : []));
        } else {
          console.log(`DEBUG: Failed to fetch assignments for class ${studentClass.classID}, status: ${assignmentRes.status}`);
        }
      }
      
      // Fetch quizzes per class
      const allQuizzes = [];
      for (const studentClass of studentClasses) {
        console.log(`DEBUG: Fetching quizzes for class: ${studentClass.classID} (${studentClass.className})`);
        const quizRes = await fetch(`${API_BASE}/api/quizzes?classID=${encodeURIComponent(studentClass.classID)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (quizRes.ok) {
          const quizData = await quizRes.json();
          console.log(`DEBUG: Class ${studentClass.classID} returned ${quizData.length} quizzes`);
          allQuizzes.push(...(Array.isArray(quizData) ? quizData : []));
        } else {
          console.log(`DEBUG: Failed to fetch quizzes for class ${studentClass.classID}, status: ${quizRes.status}`);
        }
      }
      
            // Since we're fetching per class, we already have the right assignments
      // No need for complex filtering - just use what we fetched
      const filteredActivities = allAssignments;
      console.log('DEBUG: Assignments fetched per class:', filteredActivities.length);
      console.log('DEBUG: Sample assignment data:', filteredActivities[0]);
      
      // For quizzes, also simplify filtering since we fetched per class
      const filteredQuizzes = allQuizzes;
      console.log('DEBUG: Quizzes fetched per class:', filteredQuizzes.length);
      console.log('DEBUG: Sample quiz data:', filteredQuizzes[0]);
      
      // Merge and normalize
      const assignmentsWithType = filteredActivities.map(a => ({ 
        ...a, 
        type: 'assignment',
        className: a.classInfo?.className || a.className || 'Unknown Class',
        classCode: a.classInfo?.classCode || a.classCode || 'N/A',
        classID: a.classID || a.classInfo?.classID || (a.assignedTo && a.assignedTo[0]?.classID)
      }));
      
      const quizzesWithType = filteredQuizzes.map(q => ({ 
        ...q, 
        type: 'quiz',
        className: q.classInfo?.className || q.className || 'Unknown Class',
        classCode: q.classInfo?.classCode || q.classCode || 'N/A',
        classID: q.classID || q.classInfo?.classID || (q.assignedTo && q.assignedTo[0]?.classID)
      }));
      
      let merged = [...assignmentsWithType, ...quizzesWithType];
      
      // Deduplicate by _id to avoid multiple entries if a quiz is returned for several classes
      const dedup = new Map();
      merged.forEach(it => {
        if (it && it._id && !dedup.has(it._id)) dedup.set(it._id, it);
      });
      let allActivities = Array.from(dedup.values());

      console.log('DEBUG: Total activities after dedup:', allActivities.length);

      // Filter for ONLY POSTED activities
      const now = new Date();
      const postedActivities = allActivities.filter(item => {
        if (item.type === 'assignment') {
          const scheduleEnabled = item?.schedulePost === true;
          const postAt = item?.postAt ? new Date(item.postAt) : null;
          if (scheduleEnabled && postAt) {
            const isPosted = postAt <= now;
            console.log('DEBUG: Assignment', item._id, 'schedulePost:', scheduleEnabled, 'postAt:', postAt, 'isPosted:', isPosted);
            return isPosted;
          }
          console.log('DEBUG: Assignment', item._id, 'no schedule, considered posted');
          return true;
        } else if (item.type === 'quiz') {
          const openEnabled = item?.timing?.openEnabled;
          const openDate = item?.timing?.open ? new Date(item.timing.open) : null;
          if (openEnabled && openDate) {
            const isPosted = openDate <= now;
            console.log('DEBUG: Quiz', item._id, 'openEnabled:', openEnabled, 'openDate:', openDate, 'isPosted:', isPosted);
            return isPosted;
          }
          console.log('DEBUG: Quiz', item._id, 'no timing, considered posted');
          return true;
        }
        return false;
      });
      
      console.log('DEBUG: Posted activities:', postedActivities.length);
      
      // Add basic class info for activities
      const postedActivitiesWithClassInfo = postedActivities.map(item => ({
        ...item,
        className: item.className || 'Unknown Class',
        classCode: item.classCode || 'N/A',
        classID: item.classID || (item.assignedTo && item.assignedTo[0]?.classID)
      }));
      
      const activitiesWithStatus = await checkSubmissionStatuses(postedActivitiesWithClassInfo);
      activitiesWithStatus.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
      console.log('DEBUG: Final activities with status:', activitiesWithStatus.length);
      console.log('DEBUG: Summary - Classes:', studentClasses.length, 'Assignments:', allAssignments.length, 'Quizzes:', allQuizzes.length, 'Final:', activitiesWithStatus.length);
      setActivities(activitiesWithStatus);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

  const handleActivityPress = (activity) => {
    try {
      if (!activity || !activity._id) {
        Alert.alert('Error', 'Invalid activity data. Please try refreshing the page.');
        return;
      }

      if (!user || !user._id) {
        Alert.alert('Error', 'User session not available. Please log in again.');
        return;
      }

      if (activity.type === 'quiz' && activity.isSubmitted) {
        setSelectedActivity(activity);
        setShowActivityModal(true);
        return;
      }
      
      if (activity.type !== 'quiz' && activity.isSubmitted) {
        Alert.alert(
          'Already Completed',
          `You have already completed this ${activity.type === 'quiz' ? 'quiz' : 'assignment'}.`,
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      setSelectedActivity(activity);
      setShowActivityModal(true);
      
    } catch (error) {
      console.error('DEBUG: Error in handleActivityPress:', error);
      Alert.alert('Error', 'Failed to open activity details. Please try again.');
    }
  };

  const navigateToActivity = (activity) => {
    try {
      if (!activity || !activity._id) {
        Alert.alert('Error', 'Invalid activity data for navigation.');
        return;
      }

      if (!navigation) {
        Alert.alert('Error', 'Navigation not available.');
        return;
      }

      setShowActivityModal(false);
      
      if (activity.type === 'quiz') {
        if (activity.isSubmitted) {
          navigation.navigate('QuizView', { quizId: activity._id, review: true });
        } else {
          navigation.navigate('QuizView', { quizId: activity._id });
        }
      } else {
        navigation.navigate('AssignmentDetail', { 
          assignmentId: activity._id,
          assignment: activity,
          onSubmissionComplete: () => {
            setTimeout(() => {
              fetchActivities();
            }, 100);
          }
        });
      }
    } catch (error) {
      console.error('DEBUG: Error in navigateToActivity:', error);
      Alert.alert('Error', 'Failed to navigate to activity. Please try again.');
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (activity.description && activity.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (activity.className && activity.className.toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeTab === 'completed') {
      return completedActivities.includes(activity) && matchesSearch;
    }

    if (activeTab === 'upcoming') {
      if (!activity.dueDate) {
        return matchesSearch && !activity.isSubmitted;
      }
      const now = new Date();
      const dueDate = new Date(activity.dueDate);
      return dueDate > now && !activity.isSubmitted && matchesSearch;
    } else if (activeTab === 'pastDue') {
      if (!activity.dueDate) {
        return false;
      }
      const now = new Date();
      const dueDate = new Date(activity.dueDate);
      return dueDate < now && !activity.isSubmitted && matchesSearch;
    }
    
    return matchesSearch;
  });

  // Enhanced debugging for filtering
  if (activities.length > 0) {
    console.log('DEBUG: Filtering details:', {
      totalActivities: activities.length,
      searchQuery,
      activeTab,
      completedCount: completedActivities.length,
      filteredCount: filteredActivities.length,
      sampleActivity: activities[0] ? {
        id: activities[0]._id,
        title: activities[0].title,
        type: activities[0].type,
        className: activities[0].className,
        isSubmitted: activities[0].isSubmitted
      } : null
    });
  }

  console.log('DEBUG: Filtered activities:', {
    total: activities.length,
    filtered: filteredActivities.length,
    activeTab,
    searchQuery,
    completedCount: completedActivities.length
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={styles.loadingText}>Loading activities...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error" size={64} color="#f44336" />
        <Text style={styles.errorTitle}>Error Loading Activities</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchActivities}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Activities</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <MaterialIcons name="refresh" size={20} color="#fff" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={() => {
              console.log('DEBUG: Current state:', {
                activities: activities.length,
                completedActivities: completedActivities.length,
                user: user?._id,
                userID: user?.userID,
                loading,
                error
              });
              console.log('DEBUG: Sample activities:', activities.slice(0, 3).map(a => ({
                id: a._id,
                title: a.title,
                type: a.type,
                className: a.className
              })));
              fetchActivities();
            }}
          >
            <MaterialIcons name="bug-report" size={20} color="#fff" />
            <Text style={styles.debugButtonText}>Debug</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search activities..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.gradingTabsContainer}>
        <View style={styles.gradingTabsBar}>
          {[
            { key: 'all', label: 'All', count: activities.length },
            { key: 'upcoming', label: 'Upcoming', count: activities.filter(a => {
              if (!a.isSubmitted) {
                if (!a.dueDate) return true;
                return new Date(a.dueDate) > new Date();
              }
              return false;
            }).length },
            { key: 'pastDue', label: 'Past Due', count: activities.filter(a => !a.isSubmitted && a.dueDate && new Date(a.dueDate) < new Date()).length },
            { key: 'completed', label: 'Completed', count: completedActivities.length }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.gradingTabSegment,
                activeTab === tab.key && styles.gradingTabSegmentActive
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[
                styles.gradingTabText,
                activeTab === tab.key && styles.gradingTabTextActive
              ]}>{`${tab.label} (${tab.count})`}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView 
        style={styles.activitiesContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredActivities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Activities Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery || activeTab !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'No activities available at this time'
              }
            </Text>
          </View>
        ) : (
          filteredActivities.map((activity, index) => (
            <ActivityCard
              key={`${activity._id}_${index}`}
              activity={activity}
              onActivityPress={handleActivityPress}
            />
          ))
        )}
      </ScrollView>

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

            {selectedActivity ? (
              <ScrollView style={styles.modalContent}>
                <View style={styles.modalActivityHeader}>
                  <MaterialIcons 
                    name={selectedActivity.type === 'quiz' ? 'quiz' : 'assignment'} 
                    size={32} 
                    color={selectedActivity.type === 'quiz' ? '#9C27B0' : '#FF9800'} 
                  />
                  <Text style={styles.modalActivityTitle}>
                    {selectedActivity.title || 'Untitled Activity'}
                  </Text>
                  <Text style={styles.modalActivityType}>
                    {selectedActivity.type === 'quiz' ? 'Quiz' : 'Assignment'}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Details</Text>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Class:</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedActivity.className || 'Unknown Class'}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Due Date:</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedActivity.dueDate ? formatDateTime(selectedActivity.dueDate) : 'No due date'}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Points:</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedActivity.type === 'quiz' 
                        ? (selectedActivity.totalPoints || selectedActivity.points || 0) 
                        : (selectedActivity.points || 0)
                      } points
                    </Text>
                  </View>
                  
                  {selectedActivity.type === 'quiz' && selectedActivity.isSubmitted && selectedActivity.score !== undefined && (
                    <>
                      <View style={styles.modalDetailRow}>
                        <Text style={styles.modalDetailLabel}>Score:</Text>
                        <Text style={styles.modalDetailValue}>
                          {selectedActivity.score}/{selectedActivity.totalPoints || selectedActivity.points || 100}
                        </Text>
                      </View>
                      {selectedActivity.percentage !== undefined && (
                        <View style={styles.modalDetailRow}>
                          <Text style={styles.modalDetailLabel}>Percentage:</Text>
                          <Text style={styles.modalDetailValue}>{selectedActivity.percentage}%</Text>
                        </View>
                      )}
                      {selectedActivity.timeSpent !== undefined && (
                        <View style={styles.modalDetailRow}>
                          <Text style={styles.modalDetailLabel}>Time Spent:</Text>
                          <Text style={styles.modalDetailValue}>
                            {Math.floor(selectedActivity.timeSpent / 60)}m {selectedActivity.timeSpent % 60}s
                          </Text>
                        </View>
                      )}
                      {selectedActivity.submittedAt && (
                        <View style={styles.modalDetailRow}>
                          <Text style={styles.modalDetailLabel}>Submitted:</Text>
                          <Text style={styles.modalDetailValue}>
                            {formatDateTime(selectedActivity.submittedAt)}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
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
                    {selectedActivity.type === 'quiz'
                      ? (selectedActivity.isSubmitted ? 'View Results' : 'Take Quiz')
                      : 'View Assignment'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <View style={styles.modalContent}>
                <Text style={styles.modalErrorText}>No activity selected</Text>
                <TouchableOpacity
                  style={styles.modalActionButton}
                  onPress={() => setShowActivityModal(false)}
                >
                  <Text style={styles.modalActionButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingTop: 18,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00418b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  refreshButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
    fontFamily: 'Poppins-Medium',
  },
  debugButton: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  debugButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
    fontFamily: 'Poppins-Medium',
  },
  searchContainer: {
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 4,
    backgroundColor: '#fff',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  gradingTabsContainer: {
    paddingVertical: 4,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  gradingTabsBar: {
    marginHorizontal: 10,
    backgroundColor: '#f1f3f8',
    borderRadius: 10,
    flexDirection: 'row',
    padding: 2,
  },
  gradingTabSegment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  gradingTabSegmentActive: {
    backgroundColor: '#00418b',
  },
  gradingTabText: {
    color: '#3a3a3a',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  gradingTabTextActive: {
    color: '#fff',
  },
  activitiesContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 0,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 1,
    fontFamily: 'Poppins-Bold',
  },
  activityClass: {
    fontSize: 12,
    color: '#666',
    marginBottom: 1,
    fontFamily: 'Poppins-Medium',
  },
  activityDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 1,
    fontFamily: 'Poppins-Regular',
  },
  activityDueDate: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'Poppins-Regular',
  },
  activityType: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'Poppins-Medium',
    marginTop: 2,
  },
  activityPoints: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  pointsText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#00418b',
    fontFamily: 'Poppins-Bold',
  },
  activityFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 6,
  },
  activityStats: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  statText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 2,
    fontFamily: 'Poppins-Regular',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-end',
  },
  viewButton: {
    backgroundColor: '#e3f2fd',
  },
  viewButtonText: {
    color: '#2196F3',
    fontSize: 10,
    marginLeft: 2,
    fontFamily: 'Poppins-Medium',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  resultsButton: {
    backgroundColor: '#e8f5e9',
    marginRight: 8,
  },
  resultsButtonText: {
    color: '#4CAF50',
    fontSize: 10,
    marginLeft: 2,
    fontFamily: 'Poppins-Medium',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    fontFamily: 'Poppins-Bold',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Poppins-Regular',
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
    fontFamily: 'Poppins-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    fontFamily: 'Poppins-Bold',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Poppins-Regular',
  },
  retryButton: {
    backgroundColor: '#00418b',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
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
    fontFamily: 'Poppins-Bold',
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
    fontFamily: 'Poppins-Bold',
  },
  modalActivityType: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
    fontFamily: 'Poppins-Regular',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    fontFamily: 'Poppins-Bold',
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
    fontFamily: 'Poppins-Medium',
  },
  modalDetailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
    fontFamily: 'Poppins-Regular',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
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
    fontFamily: 'Poppins-Bold',
  },
  modalErrorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Poppins-Regular',
  },
};
