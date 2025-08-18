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
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => onViewSubmissions(activity)}
          >
            <MaterialIcons name="visibility" size={16} color="#2196F3" />
            <Text style={styles.viewButtonText}>View</Text>
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

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!user || !user._id) {
        throw new Error('User data not found');
      }

      // Fetch activities created by the faculty member
      const response = await fetch(`${API_BASE}/api/assignments/faculty/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Fetch quiz data as well
        const quizResponse = await fetch(`${API_BASE}/api/quizzes/faculty/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        let allActivities = [...data];
        
        if (quizResponse.ok) {
          const quizData = await quizResponse.json();
          const quizzesWithType = quizData.map(quiz => ({
            ...quiz,
            type: 'quiz',
            _id: `quiz_${quiz._id}` // Prefix to avoid conflicts
          }));
          allActivities = [...allActivities, ...quizzesWithType];
        }

        // Sort by due date
        allActivities.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        
        setActivities(allActivities);
      } else {
        throw new Error('Failed to fetch activities');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities().finally(() => setRefreshing(false));
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
      const token = await AsyncStorage.getItem('token');
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

  const handleViewSubmissions = (activity) => {
    // Navigate to submissions view (you can implement this later)
    Alert.alert('View Submissions', `Viewing submissions for ${activity.title}`);
  };

  const handleSaveEdit = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
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

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (activity.className && activity.className.toLowerCase().includes(searchQuery.toLowerCase()));
    
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

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
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
    padding: 20,
    paddingTop: 60,
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
    padding: 20,
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterTabActive: {
    backgroundColor: '#00418b',
  },
  filterTabText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  activitiesContainer: {
    flex: 1,
    padding: 20,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  activityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Poppins-Bold',
  },
  activityClass: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'Poppins-Medium',
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'Poppins-Regular',
  },
  activityDueDate: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Poppins-Regular',
  },
  activityType: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Medium',
    marginTop: 2,
  },
  activityPoints: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00418b',
    fontFamily: 'Poppins-Bold',
  },
  activityFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  activityStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontFamily: 'Poppins-Regular',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
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
    fontSize: 12,
    marginLeft: 4,
    fontFamily: 'Poppins-Medium',
  },
  editButtonText: {
    color: '#FF9800',
    fontSize: 12,
    marginLeft: 4,
    fontFamily: 'Poppins-Medium',
  },
  deleteButtonText: {
    color: '#F44336',
    fontSize: 12,
    marginLeft: 4,
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
