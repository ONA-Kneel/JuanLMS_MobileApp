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
            <Text style={styles.statText}>{activity.gradedCount || 0} graded</Text>
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => onViewSubmissions(activity)}
          >
            <MaterialIcons name="visibility" size={16} color="#2196F3" />
            <Text style={styles.viewButtonText}>Grade</Text>
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

  useEffect(() => {
    fetchActivities();
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

      // Fetch merged classwork per class (matches Classwork tab behavior)
      const perClassPromises = facultyClassIDs.map((cid) =>
        fetch(`${API_BASE}/assignments?classID=${encodeURIComponent(cid)}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => (res.ok ? res.json() : []))
          .catch(() => [])
      );

      const perClassResults = await Promise.all(perClassPromises);
      let merged = [];
      perClassResults.forEach(list => {
        if (Array.isArray(list)) merged.push(...list);
      });

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

      setActivities(allActivities);
      
      // Categorize activities by grading status
      categorizeActivities(allActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to categorize activities by grading status
  const categorizeActivities = (allActivities) => {
    // For now, we'll categorize based on due date and submission status
    // In a real implementation, you'd check actual submission and grading data
    const now = new Date();
    
    const readyToGrade = allActivities.filter(activity => {
      const dueDate = new Date(activity.dueDate);
      return dueDate < now; // Past due date - ready to grade
    });
    
    const graded = allActivities.filter(activity => {
      // This would check actual grading status from the database
      // For now, we'll show activities that are not ready to grade
      const dueDate = new Date(activity.dueDate);
      return dueDate >= now; // Not yet due - considered "graded" for demo
    });
    
    setReadyToGradeActivities(readyToGrade);
    setGradedActivities(graded);
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
        className: activity.className 
      });
    } else {
      navigation.navigate('AssignmentSubmissions', { 
        assignmentId: activity._id, 
        assignmentTitle: activity.title,
        className: activity.className 
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
        endpoint = `${API_BASE}/api/quizzes/${activity._id.replace('quiz_', '')}`;
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
        endpoint = `${API_BASE}/api/quizzes/${selectedActivity._id.replace('quiz_', '')}`;
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
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => navigation.navigate('CAct')}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
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

      {/* Grading Tabs (similar to web app) */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.gradingTabsContainer}
        contentContainerStyle={styles.gradingTabsContent}
      >
        {[
          { key: 'all', label: 'All Activities', count: activities.length },
          { key: 'ready', label: 'Ready to Grade', count: readyToGradeActivities.length },
          { key: 'graded', label: 'Graded', count: gradedActivities.length }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.gradingTab,
              activeTab === tab.key && styles.gradingTabActive
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[
              styles.gradingTabText,
              activeTab === tab.key && styles.gradingTabTextActive
            ]}>
              {tab.label}
            </Text>
            <View style={[
              styles.gradingTabCount,
              activeTab === tab.key && styles.gradingTabCountActive
            ]}>
              <Text style={[
                styles.gradingTabCountText,
                activeTab === tab.key && styles.gradingTabCountTextActive
              ]}>
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Legacy Filter Tabs (keeping for backward compatibility) */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {['all', 'active', 'past', 'quiz', 'assignment'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              selectedFilter === filter && styles.filterTabActive
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[
              styles.filterTabText,
              selectedFilter === filter && styles.filterTabTextActive
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
    padding: 16,
    paddingTop: 36,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00418b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
    fontFamily: 'Poppins-Medium',
  },
  searchContainer: {
    padding: 12,
    backgroundColor: '#fff',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  filterContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  filterContent: {
    alignItems: 'center',
  },
  gradingTabsContainer: {
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  gradingTabsContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  gradingTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f7fb',
    marginRight: 8,
  },
  gradingTabActive: {
    backgroundColor: '#00418b',
  },
  gradingTabText: {
    color: '#3a3a3a',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  gradingTabTextActive: {
    color: '#fff',
  },
  gradingTabCount: {
    backgroundColor: '#e7eef9',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 6,
  },
  gradingTabCountActive: {
    backgroundColor: '#fff',
  },
  gradingTabCountText: {
    color: '#00418b',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  gradingTabCountTextActive: {
    color: '#00418b',
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f5f7fb',
  },
  filterTabActive: {
    backgroundColor: '#00418b',
  },
  filterTabText: {
    color: '#3a3a3a',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  activitiesContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
    fontFamily: 'Poppins-Bold',
  },
  activityClass: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'Poppins-Medium',
  },
  activityDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'Poppins-Regular',
  },
  activityDueDate: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'Poppins-Regular',
  },
  activityType: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'Poppins-Medium',
    marginTop: 2,
  },
  activityPoints: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00418b',
    fontFamily: 'Poppins-Bold',
  },
  activityFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  activityStats: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 3,
    fontFamily: 'Poppins-Regular',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 3,
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
    fontSize: 11,
    marginLeft: 3,
    fontFamily: 'Poppins-Medium',
  },
  editButtonText: {
    color: '#FF9800',
    fontSize: 11,
    marginLeft: 3,
    fontFamily: 'Poppins-Medium',
  },
  deleteButtonText: {
    color: '#F44336',
    fontSize: 11,
    marginLeft: 3,
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
};

export default FacultyActs;
