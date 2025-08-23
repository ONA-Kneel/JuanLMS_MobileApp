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
          <Text style={styles.pointsText}>{activity.points || 0} pts</Text>
        </View>
      </View>
      
      <View style={styles.activityFooter}>
        <View style={styles.activityStats}>
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
          {activity.isFullyGraded && (
            <View style={styles.statItem}>
              <MaterialIcons name="done-all" size={16} color="#4CAF50" />
              <Text style={styles.statText}>Complete</Text>
            </View>
          )}
        </View>
        
        <View style={styles.actionButtons}>
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

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      
      console.log('DEBUG: Token retrieved:', token ? 'Token exists' : 'No token');
      
      if (!user || !user._id) {
        throw new Error('User data not found');
      }

      console.log('DEBUG: Fetching activities for faculty:', user._id);

      // First, get all classes taught by this faculty member
      const classesResponse = await fetch(`${API_BASE}/api/classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!classesResponse.ok) {
        throw new Error('Failed to fetch classes');
      }

      const classesData = await classesResponse.json();
      // Backend stores Class.facultyID as the public faculty code (user.userID), not Mongo _id
      const facultyIdentifier = user?.userID || user?._id;
      const facultyClasses = Array.isArray(classesData) 
        ? classesData.filter(cls => cls.facultyID === facultyIdentifier)
        : (classesData.success && classesData.classes) 
          ? classesData.classes.filter(cls => cls.facultyID === facultyIdentifier)
          : [];

      console.log('DEBUG: Faculty classes found:', facultyClasses.length);
      console.log('DEBUG: Faculty classes:', facultyClasses);

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

      // Fetch both assignments and quizzes per class (EXACT SAME LOGIC AS CLASSWORK TAB)
      const perClassPromises = facultyClassIDs.map((cid) => [
        // Fetch assignments - using the SAME endpoint as Classwork tab
        fetch(`${API_BASE}/assignments?classID=${encodeURIComponent(cid)}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => (res.ok ? res.json() : []))
          .then(assignments => {
            console.log(`DEBUG: Fetched ${assignments.length} assignments for class ${cid}`);
            return assignments.map(item => ({ ...item, type: 'assignment' }));
          })
          .catch(() => []),
        // Fetch quizzes - using the SAME endpoint as Classwork tab
        fetch(`${API_BASE}/api/quizzes?classID=${encodeURIComponent(cid)}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => (res.ok ? res.json() : []))
          .then(quizzes => {
            console.log(`DEBUG: Fetched ${quizzes.length} quizzes for class ${cid}`);
            return quizzes.map(item => ({ ...item, type: 'quiz' }));
          })
          .catch(() => [])
      ]);

      // Flatten the nested promises and wait for all
      const flattenedPromises = perClassPromises.flat();
      const perClassResults = await Promise.all(flattenedPromises);
      let merged = [];
      perClassResults.forEach((list, index) => {
        if (Array.isArray(list)) {
          console.log(`DEBUG: Class ${Math.floor(index/2)} result ${index % 2 === 0 ? 'assignments' : 'quizzes'}:`, list.length, 'items');
          merged.push(...list);
        }
      });
      
      console.log('DEBUG: Total merged items before normalization:', merged.length);
      console.log('DEBUG: Sample merged items:', merged.slice(0, 3).map(item => ({
        _id: item._id,
        title: item.title,
        type: item.type,
        questions: item.questions,
        hasQuestions: !!item.questions
      })));

      // Normalize and enrich with class info for display
      const normalized = merged.map(item => ({
        ...item,
        type: item.type || (item.questions ? 'quiz' : 'assignment'),
        className: item.classInfo?.className || item.className || 'Unknown Class',
        classCode: item.classInfo?.classCode || item.classCode || 'N/A',
        classID: item.classID || item.classInfo?.classID || (item.assignedTo && item.assignedTo[0]?.classID)
      }));

      // Deduplicate by _id to avoid multiple entries if a quiz is returned for several classes
      const dedup = new Map();
      normalized.forEach(it => {
        if (it && it._id && !dedup.has(it._id)) dedup.set(it._id, it);
      });
      let allActivities = Array.from(dedup.values());

      // Sort by due date ascending
      allActivities.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
      
      console.log('DEBUG: Final activities after normalization and deduplication:', allActivities.length);
      console.log('DEBUG: Final activities by type:', allActivities.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {}));
      
      setActivities(allActivities);
      
      // Categorize activities by grading status
      await categorizeActivities(allActivities);
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
  });

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
        <Text style={styles.headerTitle}>My Activities</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={refreshGradingStatus}
          >
            <MaterialIcons name="refresh" size={20} color="#fff" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setCreateMenuVisible(v => !v)}
          >
            <MaterialIcons name="add" size={24} color="#fff" />
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
        </View>
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

      {/* Search and Filters */}
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

      {/* Grading Tabs - compact segmented control */}
      <View style={styles.gradingTabsContainer}>
        <View style={styles.gradingTabsBar}>
        {[
            { key: 'all', label: 'All', count: activities.length },
            { key: 'ready', label: 'Ready', count: readyToGradeActivities.length },
          { key: 'graded', label: 'Graded', count: gradedActivities.length }
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

      {/* Compact Filter Dropdown */}
      <View style={styles.filterContainer}>
          <TouchableOpacity
          style={styles.filterDropdownButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Text style={styles.filterDropdownText}>
            {selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)}
            </Text>
          <MaterialIcons name="arrow-drop-down" size={20} color="#333" />
          </TouchableOpacity>
      </View>

      {/* Activities List */}
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
          filteredActivities.map((activity, index) => (
            <ActivityCard
              key={`${activity._id}_${index}`}
              activity={activity}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewSubmissions={handleViewSubmissions}
            />
          ))
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00418b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  createButtonText: {
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
  filterContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#fff',
  },
  filterDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f7fb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterDropdownText: {
    color: '#333',
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
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
  filterOption: {
    paddingVertical: 10,
  },
  filterOptionText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins-Regular',
  },
  filterCancelBtn: {
    marginTop: 8,
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  filterCancelText: {
    color: '#00418b',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 2,
    justifyContent: 'center',
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
