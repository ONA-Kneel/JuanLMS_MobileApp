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
  Image,
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

// Helper function to resolve profile image URI
const resolveProfileUri = (user) => {
  const API_BASE = 'https://juanlms-webapp-server.onrender.com';
  const uri = user?.profilePic || user?.profilePicture;
  if (!uri) return null;
  if (typeof uri === 'string' && uri.startsWith('/uploads/')) return API_BASE + uri;
  return uri;
};

// Activity Card Component
function ActivityCard({ activity, onEdit, onDelete, onViewSubmissions }) {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'quiz':
        return { name: 'quiz', color: '#9C27B0' };
      case 'assignment':
        return { name: 'assignment', color: '#FF9800' };
      case 'project':
        return { name: 'work', color: '#2196F3' };
      default:
        return { name: 'school', color: '#4CAF50' };
    }
  };

  const icon = getActivityIcon(activity.type);

  return (
    <View style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <Text style={styles.activityDueTime}>
            Due at {activity.dueDate ? new Date(activity.dueDate).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            }) : '11:59 pm'}
          </Text>
          <Text style={styles.activityClass}>{activity.className || 'Unknown Class'}</Text>
        </View>
        <View style={styles.activityPoints}>
          <Text style={styles.pointsText}>{activity.points || 0} Points</Text>
        </View>
      </View>
      
      <View style={styles.activityFooter}>
        <View style={styles.activityStats}>
          <View style={styles.statItem}>
            <MaterialIcons name="schedule" size={16} color="#666" />
            <Text style={styles.statText}>
              {activity.isFullyGraded ? 'Complete' : 'Pending'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="people" size={16} color="#666" />
            <Text style={styles.statText}>{activity.totalStudents || 0} students</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
            <Text style={styles.statText}>{activity.submittedCount || 0} submitted</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="grade" size={16} color="#FF9800" />
            <Text style={styles.statText}>
              {activity.gradedCount || 0}/{activity.submittedCount || 0} graded
            </Text>
          </View>
        </View>
        
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => onViewSubmissions(activity)}
          >
            <MaterialIcons name="visibility" size={16} color="#2196F3" />
            <Text style={styles.viewButtonText}>
              {activity.isFullyGraded ? 'View Results' : 'Grade'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => onEdit(activity)}
          >
            <MaterialIcons name="edit" size={16} color="#FF9800" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => onDelete(activity)}
          >
            <MaterialIcons name="delete" size={16} color="#F44336" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const FacultyActs = () => {
  const navigation = useNavigation();
  const { user } = useUser();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    points: '',
    type: ''
  });
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [academicContext, setAcademicContext] = useState('2025-2026 | Term 1');
  
  // Add grading tab state
  const [activeTab, setActiveTab] = useState('all');
  const [gradedActivities, setGradedActivities] = useState([]);
  const [readyToGradeActivities, setReadyToGradeActivities] = useState([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [createMenuVisible, setCreateMenuVisible] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, []);

  // Add focus listener to refresh grading status when returning from grading submissions
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('DEBUG: FacultyActs screen focused, refreshing grading status...');
      if (activities.length > 0) {
        refreshGradingStatus();
      }
    });
    return unsubscribe;
  }, [navigation, activities]);

  // Update current date/time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      
      console.log('DEBUG: Token retrieved:', token ? 'Token exists' : 'No token');
      
      if (!user || !user._id) {
        throw new Error('User data not found');
      }

      console.log('DEBUG: Fetching activities for faculty:', user._id);

      // First, get all classes taught by this faculty member (match web app approach)
      const facultyKey = user?._id || user?.userID;
      const classesResponse = await fetch(`${API_BASE}/classes/faculty-classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!classesResponse.ok) {
        throw new Error('Failed to fetch faculty classes');
      }

      const classesData = await classesResponse.json();
      const facultyClasses = Array.isArray(classesData) ? classesData : [];

      console.log('DEBUG: Faculty classes found (web app approach):', facultyClasses.length);
      console.log('DEBUG: Faculty classes details:', facultyClasses.map(c => ({ classID: c.classID, className: c.className, facultyID: c.facultyID })));

      if (facultyClasses.length === 0) {
        console.log('DEBUG: No classes found for faculty');
        setActivities([]);
        setLoading(false);
        return;
      }

      // Get all class IDs for this faculty
      const facultyClassIDs = facultyClasses.map(cls => cls.classID);
      console.log('DEBUG: Faculty class IDs:', facultyClassIDs);
      console.log('DEBUG: Faculty class IDs types:', facultyClassIDs.map(id => typeof id));
      console.log('DEBUG: Faculty class details:', facultyClasses.map(cls => ({
        classID: cls.classID,
        classIDType: typeof cls.classID,
        className: cls.className,
        facultyID: cls.facultyID
      })));

      // Fetch activities and quizzes (match web app approach)
      // 1. Fetch assignments globally
      const activityRes = await fetch(`${API_BASE}/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // 2. Fetch quizzes per class (like web app does)
      const allQuizzes = [];
      for (const facultyClass of facultyClasses) {
        const quizRes = await fetch(`${API_BASE}/api/quizzes?classID=${facultyClass.classID}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (quizRes.ok) {
          const quizData = await quizRes.json();
          allQuizzes.push(...(Array.isArray(quizData) ? quizData : []));
        }
      }
      
      if (activityRes.ok) {
        const activityData = await activityRes.json();
        
        // Filter activities to only include those from faculty's classes
        const filteredActivities = activityData.filter(activity => {
          const classID = activity.classID || activity.classInfo?.classID || (activity.assignedTo && activity.assignedTo[0]?.classID);
          return facultyClassIDs.includes(classID);
        });
        
        // No filtering needed for quizzes since we fetched per class
        const filteredQuizzes = allQuizzes;
        
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

        // Sort by due date ascending
        allActivities.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
        
        console.log('DEBUG: Final merged data (web app approach):', {
          assignmentsCount: assignmentsWithType.length,
          quizzesCount: quizzesWithType.length,
          totalCount: merged.length,
          finalCount: allActivities.length
        });
        
        setActivities(allActivities);
        
        // Categorize activities by grading status
        await categorizeActivities(allActivities);
      } else {
        throw new Error('Failed to fetch assignments');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to categorize activities by grading status
  const categorizeActivities = async (allActivities) => {
    try {
      console.log('DEBUG: Categorizing activities by grading status...');
      const token = await AsyncStorage.getItem('jwtToken');
      
      // Check actual grading status for each activity
      const activitiesWithGradingStatus = await Promise.all(
        allActivities.map(async (activity) => {
          try {
            if (activity.type === 'assignment') {
              // Check assignment submissions and grading status
              const submissionsResponse = await fetch(`${API_BASE}/assignments/${activity._id}/submissions`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              if (submissionsResponse.ok) {
                const submissions = await submissionsResponse.json();
                const totalStudents = activity.totalStudents || 0;
                const submittedCount = submissions.length;
                const gradedCount = submissions.filter(sub => sub.status === 'graded').length;
                
                return {
                  ...activity,
                  totalStudents,
                  submittedCount,
                  gradedCount,
                  isFullyGraded: submittedCount > 0 && submittedCount === gradedCount,
                  hasSubmissions: submittedCount > 0
                };
              }
            } else if (activity.type === 'quiz') {
              // Check quiz responses and grading status
              const responsesResponse = await fetch(`${API_BASE}/api/quizzes/${activity._id}/responses`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              if (responsesResponse.ok) {
                const responses = await responsesResponse.json();
                const totalStudents = activity.totalStudents || 0;
                const submittedCount = responses.length;
                const gradedCount = responses.filter(resp => resp.graded).length;
                
                return {
                  ...activity,
                  totalStudents,
                  submittedCount,
                  gradedCount,
                  isFullyGraded: submittedCount > 0 && submittedCount === gradedCount,
                  hasSubmissions: submittedCount > 0
                };
              }
            }
            
            // Default values if API calls fail
            return {
              ...activity,
              totalStudents: 0,
              submittedCount: 0,
              gradedCount: 0,
              isFullyGraded: false,
              hasSubmissions: false
            };
          } catch (error) {
            console.error(`Error checking grading status for ${activity._id}:`, error);
            return {
              ...activity,
              totalStudents: 0,
              submittedCount: 0,
              gradedCount: 0,
              isFullyGraded: false,
              hasSubmissions: false
            };
          }
        })
      );
      
      console.log('DEBUG: Activities with grading status:', activitiesWithGradingStatus.map(a => ({
        id: a._id,
        title: a.title,
        type: a.type,
        submittedCount: a.submittedCount,
        gradedCount: a.gradedCount,
        isFullyGraded: a.isFullyGraded
      })));
      
      // Categorize based on actual grading status
      const now = new Date();
      
      const readyToGrade = activitiesWithGradingStatus.filter(activity => {
        const dueDate = new Date(activity.dueDate);
        const isPastDue = dueDate < now;
        const hasSubmissions = activity.hasSubmissions;
        const isNotFullyGraded = !activity.isFullyGraded;
        
        // Ready to grade if: past due date, has submissions, and not fully graded
        return isPastDue && hasSubmissions && isNotFullyGraded;
      });
      
      const graded = activitiesWithGradingStatus.filter(activity => {
        // Graded if: fully graded OR no submissions yet (not ready to grade)
        return activity.isFullyGraded || !activity.hasSubmissions;
      });
      
      console.log('DEBUG: Categorization results:', {
        readyToGrade: readyToGrade.length,
        graded: graded.length,
        total: activitiesWithGradingStatus.length
      });
      
      setReadyToGradeActivities(readyToGrade);
      setGradedActivities(graded);
      
      // Update activities with grading status
      setActivities(activitiesWithGradingStatus);
      
      // Log any activities that moved between tabs
      console.log('DEBUG: Tab movement summary:');
      readyToGrade.forEach(activity => {
        console.log(`- ${activity.title} (${activity.type}) moved to READY tab - ${activity.submittedCount} submitted, ${activity.gradedCount} graded`);
      });
      graded.forEach(activity => {
        if (activity.isFullyGraded) {
          console.log(`- ${activity.title} (${activity.type}) moved to GRADED tab - Fully graded (${activity.gradedCount}/${activity.submittedCount})`);
        } else if (!activity.hasSubmissions) {
          console.log(`- ${activity.title} (${activity.type}) moved to GRADED tab - No submissions yet`);
        }
      });
    } catch (error) {
      console.error('Error categorizing activities:', error);
      // Fallback to simple categorization
      const now = new Date();
      const readyToGrade = allActivities.filter(activity => {
        const dueDate = new Date(activity.dueDate);
        return dueDate < now;
      });
      const graded = allActivities.filter(activity => {
        const dueDate = new Date(activity.dueDate);
        return dueDate >= now;
      });
      
      setReadyToGradeActivities(readyToGrade);
      setGradedActivities(graded);
    }
  };

  // Function to refresh grading status after grading submissions
  const refreshGradingStatus = async () => {
    console.log('DEBUG: Refreshing grading status...');
    await categorizeActivities(activities);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities().finally(() => setRefreshing(false));
  };

  const handleViewSubmissions = (activity) => {
    // Navigate to submissions view for grading
    if (activity.type === 'quiz') {
      navigation.navigate('QuizSubmissions', { 
        quizId: activity._id, 
        quizTitle: activity.title,
        className: activity.className,
        onGradingComplete: refreshGradingStatus
      });
    } else {
      navigation.navigate('AssignmentSubmissions', { 
        assignmentId: activity._id, 
        assignmentTitle: activity.title,
        className: activity.className,
        onGradingComplete: refreshGradingStatus
      });
    }
  };

  const handleEdit = (activity) => {
    setSelectedActivity(activity);
    setEditForm({
      title: activity.title || '',
      description: activity.description || '',
      dueDate: activity.dueDate ? new Date(activity.dueDate).toISOString().split('T')[0] : '',
      points: activity.points?.toString() || '',
      type: activity.type || ''
    });
    setEditModalVisible(true);
  };

  const handleDelete = (activity) => {
    Alert.alert(
      'Delete Activity',
      `Are you sure you want to delete "${activity.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteActivity(activity)
        }
      ]
    );
  };

  const deleteActivity = async (activity) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      let endpoint = '';
      
      if (activity.type === 'quiz') {
        endpoint = `${API_BASE}/api/quizzes/${activity._id}`;
      } else {
        endpoint = `${API_BASE}/api/assignments/${activity._id}`;
      }

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        Alert.alert('Success', 'Activity deleted successfully');
        fetchActivities();
      } else {
        throw new Error('Failed to delete activity');
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      Alert.alert('Error', 'Failed to delete activity');
    }
  };

  const handleSaveEdit = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      let endpoint = '';
      
      if (selectedActivity.type === 'quiz') {
        endpoint = `${API_BASE}/api/quizzes/${selectedActivity._id}`;
      } else {
        endpoint = `${API_BASE}/api/assignments/${selectedActivity._id}`;
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        Alert.alert('Success', 'Activity updated successfully');
        setEditModalVisible(false);
        fetchActivities();
      } else {
        throw new Error('Failed to update activity');
      }
    } catch (error) {
      console.error('Error updating activity:', error);
      Alert.alert('Error', 'Failed to update activity');
    }
  };

  // Filter activities based on selected tab and search query
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (activity.description && activity.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (activity.className && activity.className.toLowerCase().includes(searchQuery.toLowerCase()));

    // First filter by grading tab
    if (activeTab === 'ready') {
      return readyToGradeActivities.includes(activity) && matchesSearch;
    } else if (activeTab === 'graded') {
      return gradedActivities.includes(activity) && matchesSearch;
    }
    // activeTab === 'all' - show all activities

    // Then apply legacy filters
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'active') return matchesSearch && new Date(activity.dueDate) >= new Date();
    if (selectedFilter === 'past') return matchesSearch && new Date(activity.dueDate) < new Date();
    if (selectedFilter === 'quiz') return matchesSearch && activity.type === 'quiz';
    if (selectedFilter === 'assignment') return matchesSearch && activity.type === 'assignment';
    
    return matchesSearch;
  }).sort((a, b) => new Date(b.dueDate || b.createdAt || 0) - new Date(a.dueDate || a.createdAt || 0));

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
      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Blue background */}
        <View style={styles.blueHeaderBackground} />
        {/* White card header */}
      <View style={styles.whiteHeaderCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.headerTitle}>
              My Activities
            </Text>
            <Text style={styles.headerSubtitle}>{academicContext}</Text>
            <Text style={styles.headerSubtitle2}>{formatDateTime(currentDateTime)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.navigate('FProfile')}>
              {resolveProfileUri(user) ? (
                <Image 
                  source={{ uri: resolveProfileUri(user) }} 
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

        {/* Activity Tabs */}
        <View style={styles.activityTabsContainer}>
          <View style={styles.activityTabsBar}>
            {[
              { key: 'all', label: 'All' },
              { key: 'ready', label: 'Ready to Grade' },
              { key: 'graded', label: 'Graded' }
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.activityTabSegment,
                  activeTab === tab.key && styles.activityTabSegmentActive
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[
                  styles.activityTabText,
                  activeTab === tab.key && styles.activityTabTextActive
                ]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Search Bar */}
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
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => setCreateMenuVisible(v => !v)}
              >
                <MaterialIcons name="add" size={20} color="#fff" />
              </TouchableOpacity>
              {createMenuVisible && (
            <View style={styles.createMenu}>
              <TouchableOpacity style={styles.createMenuItem} onPress={() => { setCreateMenuVisible(false); navigation.navigate('CreateAssignment'); }}>
                <Text style={styles.createMenuItemText}>Assignment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createMenuItem} onPress={() => { setCreateMenuVisible(false); navigation.navigate('CreateQuiz'); }}>
                <Text style={styles.createMenuItemText}>Quiz</Text>
              </TouchableOpacity>
            </View>
          )}
            </View>
        </View>

        {/* Activities List */}
        {filteredActivities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Activities Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery || selectedFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first activity to get started'
              }
            </Text>
            {!searchQuery && selectedFilter === 'all' && (
              <TouchableOpacity 
                style={styles.emptyCreateButton}
                onPress={() => navigation.navigate('CAct')}
              >
                <Text style={styles.emptyCreateButtonText}>Create Activity</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.activitiesList}>
            {/* Group activities by date */}
            {Object.entries(
              [...filteredActivities]
                .sort((a, b) => new Date(a.dueDate || a.createdAt || 0) - new Date(b.dueDate || b.createdAt || 0))
                .reduce((groups, activity) => {
                  const date = activity.dueDate ? new Date(activity.dueDate).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'No Date';
                  if (!groups[date]) groups[date] = [];
                  groups[date].push(activity);
                  return groups;
                }, {})
            ).map(([date, activities]) => (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateHeader}>{date}</Text>
                {activities.map((activity, index) => (
                  <ActivityCard
                    key={`${activity._id}_${index}`}
                    activity={activity}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onViewSubmissions={handleViewSubmissions}
                  />
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Activity</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Activity Title"
              value={editForm.title}
              onChangeText={(text) => setEditForm({...editForm, title: text})}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Description"
              value={editForm.description}
              onChangeText={(text) => setEditForm({...editForm, description: text})}
              multiline
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Due Date (YYYY-MM-DD)"
              value={editForm.dueDate}
              onChangeText={(text) => setEditForm({...editForm, dueDate: text})}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Points"
              value={editForm.points}
              onChangeText={(text) => setEditForm({...editForm, points: text})}
              keyboardType="numeric"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 12 }] }>
            {['all', 'active', 'past', 'quiz', 'assignment'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={styles.filterOption}
                onPress={() => {
                  setSelectedFilter(filter);
                  setFilterModalVisible(false);
                }}
              >
                <Text style={[styles.filterOptionText, selectedFilter === filter && { fontWeight: '700', color: '#00418b' }]}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.filterCancelBtn} onPress={() => setFilterModalVisible(false)}>
              <Text style={styles.filterCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  refreshButton: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  createButton: {
    backgroundColor: '#00418B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activityTabsContainer: {
    paddingVertical: 16,
    // borderBottomWidth: 1,
    // borderBottomColor: '#e0e0e0',
  },
  activityTabsBar: {
    marginHorizontal: 20,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    textAlign: 'center',
  },
  activityTabSegment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activityTabSegmentActive: {
    borderBottomColor: '#00418b',
  },
  activityTabText: {
    color: '#999',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
  activityTabTextActive: {
    color: '#333',
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingBottom: 5,
    backgroundColor: '#f5f5f5',
    marginTop: 10,
    alignItems: 'center',
    flexDirection: 'row',
    gap:5
  },
  searchBox: {
    width: '85%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',

  },
  activitiesList: {
    flex: 1,
    padding: 15,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    fontFamily: 'Poppins-Bold',
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
    fontFamily: 'Poppins-Bold',
  },
  activityDueTime: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Poppins-Regular',
  },
  activityClass: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  activityPoints: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  pointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
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
  editButton: {
    backgroundColor: '#fff3e0',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  viewButtonText: {
    color: '#2196F3',
    fontSize: 10,
    marginLeft: 2,
    fontFamily: 'Poppins-Medium',
  },
  editButtonText: {
    color: '#FF9800',
    fontSize: 10,
    marginLeft: 2,
    fontFamily: 'Poppins-Medium',
  },
  deleteButtonText: {
    color: '#F44336',
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
  emptyCreateButton: {
    backgroundColor: '#00418b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyCreateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-Medium',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#00418b',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-Medium',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-Medium',
  },
  createMenu: {
    position: 'absolute',
    right: 12,
    top: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 6,
    width: 160,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    zIndex: 30,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  createMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  createMenuItemText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins-Regular',
  },
};

export default FacultyActs;
