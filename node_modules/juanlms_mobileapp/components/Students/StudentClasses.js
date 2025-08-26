import React, { useState, useEffect } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Image,
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

export default function StudentClasses() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const [classStats, setClassStats] = useState({});

  const API_BASE = 'https://juanlms-webapp-server.onrender.com';

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
        const token = await AsyncStorage.getItem('jwtToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

        console.log('Fetching classes for student:', user._id);
        
      const response = await fetch(`${API_BASE}/classes/my-classes`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response from /my-classes:', data);
        
        // The my-classes endpoint already filters classes based on user role and membership
        const userClasses = Array.isArray(data) ? data : [];
        console.log('User classes:', userClasses);
        setClasses(userClasses);
      
      // Fetch class statistics for each class
      await fetchClassStats(userClasses, token);
      
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError(error.message || 'Failed to fetch classes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchClassStats = async (userClasses, token) => {
    try {
      const stats = {};
      
      for (const classItem of userClasses) {
        const classId = classItem._id || classItem.classID;
        
        // Fetch lessons count
        const lessonsResponse = await fetch(`${API_BASE}/lessons?classID=${classId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (lessonsResponse.ok) {
          const lessons = await lessonsResponse.json();
          stats[classId] = {
            lessons: Array.isArray(lessons) ? lessons.length : 0,
            assignments: 0,
            announcements: 0
          };
        }
        
              // Fetch assignments count
      const assignmentsResponse = await fetch(`${API_BASE}/assignments?classID=${classId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (assignmentsResponse.ok) {
          const assignments = await assignmentsResponse.json();
          if (stats[classId]) {
            stats[classId].assignments = Array.isArray(assignments) ? assignments.length : 0;
          }
        }
        
        // Fetch announcements count
        const announcementsResponse = await fetch(`${API_BASE}/announcements?classID=${classId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (announcementsResponse.ok) {
          const announcements = await announcementsResponse.json();
          if (stats[classId]) {
            stats[classId].announcements = Array.isArray(announcements) ? announcements.length : 0;
          }
        }
      }
      
      setClassStats(stats);
      } catch (error) {
      console.error('Error fetching class stats:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchClasses();
  };

  const handleClassPress = (classItem) => {
    setSelectedClass(classItem);
    setShowClassModal(true);
  };

  const navigateToClassContent = (classItem) => {
    setShowClassModal(false);
    navigation.navigate('ClassContent', {
      classId: classItem._id || classItem.classID,
      className: classItem.className,
      isFaculty: false
    });
  };

  const navigateToClassModule = (classItem) => {
    setShowClassModal(false);
    navigation.navigate('StudentModule', {
      classId: classItem._id || classItem.classID,
      className: classItem.className
    });
  };

  const getClassStatus = (classItem) => {
    if (classItem.isArchived) {
      return { status: 'archived', color: '#999', text: 'Archived' };
    }
    
    const now = new Date();
    const startDate = new Date(classItem.startDate);
    const endDate = new Date(classItem.endDate);
    
    if (now < startDate) {
      return { status: 'upcoming', color: '#FF9800', text: 'Upcoming' };
    } else if (now > endDate) {
      return { status: 'ended', color: '#f44336', text: 'Ended' };
    } else {
      return { status: 'active', color: '#4CAF50', text: 'Active' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderClassCard = (classItem, index) => {
    const status = getClassStatus(classItem);
    const classId = classItem._id || classItem.classID;
    const stats = classStats[classId] || { lessons: 0, assignments: 0, announcements: 0 };

  return (
      <TouchableOpacity
        key={index}
        style={styles.classCard}
        onPress={() => handleClassPress(classItem)}
      >
        <View style={styles.classHeader}>
          <View style={styles.classInfo}>
            <Text style={styles.className}>{classItem.className}</Text>
            <Text style={styles.classCode}>{classItem.classCode || classItem.subjectCode}</Text>
            <Text style={styles.facultyName}>
              {classItem.facultyName || 'Faculty TBD'}
          </Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
            <Text style={styles.statusText}>{status.text}</Text>
          </View>
        </View>

        <View style={styles.classDetails}>
          <View style={styles.detailRow}>
            <MaterialIcons name="schedule" size={16} color="#666" />
            <Text style={styles.detailText}>
              {formatDate(classItem.startDate)} - {formatDate(classItem.endDate)}
        </Text>
      </View>

          {classItem.schedule && (
            <View style={styles.detailRow}>
              <MaterialIcons name="access-time" size={16} color="#666" />
              <Text style={styles.detailText}>{classItem.schedule}</Text>
            </View>
          )}
          
          {classItem.room && (
            <View style={styles.detailRow}>
              <MaterialIcons name="room" size={16} color="#666" />
              <Text style={styles.detailText}>{classItem.room}</Text>
            </View>
          )}
        </View>

        <View style={styles.classStats}>
          <View style={styles.statItem}>
            <MaterialIcons name="description" size={16} color="#00418b" />
            <Text style={styles.statText}>{stats.lessons} Lessons</Text>
          </View>
          
          <View style={styles.statItem}>
            <MaterialIcons name="assignment" size={16} color="#FF9800" />
            <Text style={styles.statText}>{stats.assignments} Assignments</Text>
          </View>
          
          <View style={styles.statItem}>
            <MaterialIcons name="announcement" size={16} color="#4CAF50" />
            <Text style={styles.statText}>{stats.announcements} Announcements</Text>
          </View>
        </View>

        <View style={styles.classActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigateToClassContent(classItem)}
          >
            <MaterialIcons name="folder" size={20} color="#00418b" />
            <Text style={styles.actionButtonText}>Content</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigateToClassModule(classItem)}
          >
            <MaterialIcons name="school" size={20} color="#00418b" />
            <Text style={styles.actionButtonText}>Module</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="school-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Classes Found</Text>
      <Text style={styles.emptyText}>
        You are not enrolled in any classes yet. Please contact your administrator.
        </Text>
    </View>
  );

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
        <Text style={styles.headerTitle}>My Classes</Text>
        <Text style={styles.headerSubtitle}>
          Manage your enrolled classes and access course materials
        </Text>
      </View>

      {/* Classes List */}
      {error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={64} color="#f44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchClasses}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : classes.length > 0 ? (
        <ScrollView
          style={styles.classesList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#00418b']}
              tintColor="#00418b"
            />
          }
        >
          {classes.map((classItem, index) => renderClassCard(classItem, index))}
        </ScrollView>
      ) : (
        renderEmptyState()
      )}

      {/* Class Details Modal */}
      <Modal
        visible={showClassModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowClassModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Class Details</Text>
              <TouchableOpacity onPress={() => setShowClassModal(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedClass && (
              <ScrollView style={styles.modalContent}>
                <Text style={styles.modalClassName}>{selectedClass.className}</Text>
                <Text style={styles.modalClassCode}>{selectedClass.classCode || selectedClass.subjectCode}</Text>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Class Information</Text>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Faculty:</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedClass.facultyName || 'Faculty TBD'}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Schedule:</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedClass.schedule || 'Not specified'}
            </Text>
          </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Room:</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedClass.room || 'Not specified'}
            </Text>
          </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Duration:</Text>
                    <Text style={styles.modalDetailValue}>
                      {formatDate(selectedClass.startDate)} - {formatDate(selectedClass.endDate)}
            </Text>
          </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalActionButton}
                    onPress={() => navigateToClassContent(selectedClass)}
                  >
                    <MaterialIcons name="folder" size={20} color="white" />
                    <Text style={styles.modalActionButtonText}>View Content</Text>
                  </TouchableOpacity>
                  
              <TouchableOpacity 
                    style={styles.modalActionButton}
                    onPress={() => navigateToClassModule(selectedClass)}
                  >
                    <MaterialIcons name="school" size={20} color="white" />
                    <Text style={styles.modalActionButtonText}>Access Module</Text>
                  </TouchableOpacity>
                </View>
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
  classesList: {
    flex: 1,
    padding: 20,
  },
  classCard: {
    backgroundColor: 'white',
    borderRadius: 12,
                  padding: 20,
    marginBottom: 16,
    elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
                  marginBottom: 16,
  },
  classInfo: {
    flex: 1,
    marginRight: 12,
  },
  className: {
                      fontSize: 18, 
                      fontWeight: 'bold', 
                      color: '#333',
    marginBottom: 4,
  },
  classCode: {
                      fontSize: 14, 
                      color: '#666',
    marginBottom: 4,
  },
  facultyName: {
    fontSize: 14,
    color: '#00418b',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
            fontWeight: 'bold', 
  },
  classDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  classStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
            marginBottom: 16, 
  },
  statItem: {
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  classActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00418b',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#00418b',
    fontWeight: '500',
    marginLeft: 4,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
              marginTop: 16, 
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
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
  modalClassName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalClassCode: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
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
  modalActions: {
    gap: 12,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00418b',
    paddingVertical: 16,
    borderRadius: 8,
  },
  modalActionButtonText: {
    color: 'white',
              fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}; 