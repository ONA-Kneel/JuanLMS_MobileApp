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
import { fetchActiveQuarter } from '../../utils/academicContext';

export default function StudentClasses() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeQuarter, setActiveQuarter] = useState(null);

  const API_BASE = 'https://juanlms-webapp-server.onrender.com';

  useEffect(() => {
    fetchActiveQuarterInfo();
  }, []);

  useEffect(() => {
    if (activeQuarter) {
      fetchClasses();
    }
  }, [activeQuarter]);

  const fetchActiveQuarterInfo = async () => {
    try {
      const quarterInfo = await fetchActiveQuarter();
      console.log('Active quarter info:', quarterInfo);
      setActiveQuarter(quarterInfo);
    } catch (error) {
      console.error('Error fetching active quarter info:', error);
      // Set default quarter info if fetch fails
      setActiveQuarter({
        quarterName: 'Quarter 1',
        termName: 'Term 1',
        schoolYear: '2025-2026',
        isActive: false
      });
    }
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('jwtToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      if (!activeQuarter) {
        console.log('No active quarter info available yet');
        return;
      }

      console.log('Fetching classes for student:', user._id);
      console.log('Filtering by active quarter:', activeQuarter);
        
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
        let userClasses = Array.isArray(data) ? data : [];
        console.log('User classes before quarter filtering:', userClasses);
        
        // Apply quarter filtering logic similar to web app
        const filteredClasses = userClasses.filter(cls => {
          // Filter out archived classes
          if (cls.isArchived === true) {
            console.log(`Filtering out archived class: ${cls.className || cls.classCode}`);
            return false;
          }
          
          // Filter by academic year (tolerate missing academicYear)
          if (cls.academicYear && cls.academicYear !== activeQuarter.schoolYear) {
            console.log(`Filtering out class with wrong year: ${cls.className || cls.classCode} (${cls.academicYear})`);
            return false;
          }
          
          // Filter by term (tolerate missing termName)
          if (cls.termName && cls.termName !== activeQuarter.termName) {
            console.log(`Filtering out class with wrong term: ${cls.className || cls.classCode} (${cls.termName})`);
            return false;
          }
          
          // Filter by quarter (tolerate missing quarterName)
          if (cls.quarterName && cls.quarterName !== activeQuarter.quarterName) {
            console.log(`Filtering out class with wrong quarter: ${cls.className || cls.classCode} (${cls.quarterName})`);
            return false;
          }
          
          console.log(`Including class: ${cls.className || cls.classCode}`);
          return true;
        });
        
        console.log('User classes after quarter filtering:', filteredClasses);
        setClasses(filteredClasses);
      
      
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError(error.message || 'Failed to fetch classes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const onRefresh = () => {
    setRefreshing(true);
    fetchActiveQuarterInfo().then(() => {
      // fetchClasses will be called automatically when activeQuarter state updates
    });
  };

  const navigateToClassModule = (classItem) => {
    navigation.navigate('SModule', {
      classId: classItem._id || classItem.classID,
      className: classItem.className
    });
  };


  const renderClassCard = (classItem, index) => {
    return (
      <TouchableOpacity
        key={index}
        style={styles.classCard}
        onPress={() => navigateToClassModule(classItem)}
      >
        {/* Class Image Placeholder */}
        <View style={{
          height: 120,
          backgroundColor: '#e3eefd',
          borderRadius: 12,
          marginBottom: 16,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {classItem.image ? (
            <Image
              source={{ uri: classItem.image }}
              style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
            />
          ) : (
            <MaterialCommunityIcons name="book-open-page-variant" size={48} color="#00418b" />
          )}
        </View>
        
        {/* Class Info */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: '#333',
              fontFamily: 'Poppins-Bold',
              marginBottom: 4
            }}>
              {classItem.className || classItem.name}
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#666',
              fontFamily: 'Poppins-Regular',
              marginBottom: 8
            }}>
              {classItem.section || classItem.classCode || classItem.code}
            </Text>
            <Text style={{
              fontSize: 12,
              color: '#888',
              fontFamily: 'Poppins-Regular'
            }}>
              {classItem.members ? classItem.members.length : 0} Students
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#00418b" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="school-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Classes Found</Text>
      <Text style={styles.emptyText}>
        {activeQuarter 
          ? `You are not enrolled in any classes for ${activeQuarter.quarterName} of ${activeQuarter.termName}. Please contact your administrator.`
          : 'You are not enrolled in any classes yet. Please contact your administrator.'
        }
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
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Classes</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Manage your enrolled classes and access course materials
        </Text>
        {activeQuarter && (
          <Text style={styles.quarterInfo}>
            {activeQuarter.schoolYear} | {activeQuarter.termName} | {activeQuarter.quarterName}
          </Text>
        )}
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  quarterInfo: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  classesList: {
    flex: 1,
    padding: 20,
  },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  activeQuizzesContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  activeQuizzesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  activeQuizItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeQuizText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  quizDuration: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  moreQuizzesText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
}; 