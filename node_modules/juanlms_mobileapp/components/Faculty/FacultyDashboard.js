import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, View, ScrollView, Image, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import FacultyDashStyle from '../styles/faculty/FacultyDashStyle';
import { useUser } from '../UserContext';

export default function FacultyDashboard() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Fetch classes for the logged-in faculty
    const fetchClasses = async () => {
      if (!user || !user._id) {
        console.log('No user or user ID available');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching classes for faculty:', user._id);
        const response = await fetch(`http://localhost:5000/api/faculty-classes?facultyID=${user._id}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        if (data.success && Array.isArray(data.classes)) {
          console.log('Classes loaded successfully:', data.classes);
          setClasses(data.classes);
          setError(null);
        } else {
          console.error('Invalid API Response:', data);
          setClasses([]);
          setError(data.error || 'Failed to fetch classes');
        }
      } catch (error) {
        console.error('Network error fetching classes:', error);
        setClasses([]);
        setError('Network error occurred: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClasses();
  }, [user]);

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

  const modules = (course) => {
    navigation.navigate('FMod', { classId: course.classID || course._id });
  };
  
  const createClasses = () => {
    navigation.navigate('CClass');
  };
  
  const studProg = () => {
    navigation.navigate('FSProg');
  };
  
  const goToProfile = () => {
    navigation.navigate('FProfile');
  };

  return (
    <View style={FacultyDashStyle.container}>
      {/* Header */}
      <View style={FacultyDashStyle.header}>
        <View style={FacultyDashStyle.headerContent}>
          <View>
            <Text style={FacultyDashStyle.welcomeText}>Welcome back,</Text>
            <Text style={FacultyDashStyle.nameText}>{user?.firstname || 'Faculty'} {user?.lastname || 'Member'}</Text>
            <Text style={FacultyDashStyle.dateText}>{formatDateTime(currentDateTime)}</Text>
          </View>
          <TouchableOpacity onPress={goToProfile}>
            <Image 
              source={require('../../assets/profile-icon (2).png')} 
              style={{ width: 36, height: 36, borderRadius: 18 }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 20, paddingTop: 10 }}>
        {/* Stats Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ 
            flex: 1, 
            backgroundColor: '#00418b', 
            borderRadius: 16, 
            alignItems: 'center', 
            padding: 16, 
            marginRight: 8, 
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2 
          }}>
            <Icon name="book" size={32} color="#fff" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, fontFamily: 'Poppins-Bold' }}>{classes.length}</Text>
            <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center', fontFamily: 'Poppins-Regular' }}>My Classes</Text>
          </View>
          
          <View style={{ 
            flex: 1, 
            backgroundColor: '#00418b', 
            borderRadius: 16, 
            alignItems: 'center', 
            padding: 16, 
            marginLeft: 8, 
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2 
          }}>
            <Icon name="account-group" size={32} color="#fff" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, fontFamily: 'Poppins-Bold' }}>
              {classes.reduce((total, cls) => total + (cls.members ? cls.members.length : 0), 0)}
            </Text>
            <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center', fontFamily: 'Poppins-Regular' }}>Total Students</Text>
          </View>
        </View>
        
        {/* Create Classes and Progression Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <TouchableOpacity onPress={createClasses} style={{ 
            flex: 1, 
            backgroundColor: '#e3eefd', 
            borderRadius: 16, 
            alignItems: 'center', 
            padding: 16, 
            marginRight: 8, 
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2 
          }}>
            <Icon name="plus" size={32} color="#00418b" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#00418b', fontWeight: 'bold', fontSize: 16, fontFamily: 'Poppins-Bold' }}>Create Classes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={studProg} style={{ 
            flex: 1, 
            backgroundColor: '#e3eefd', 
            borderRadius: 16, 
            alignItems: 'center', 
            padding: 16, 
            marginLeft: 8, 
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2 
          }}>
            <Icon name="chart-line" size={32} color="#00418b" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#00418b', fontWeight: 'bold', fontSize: 16, fontFamily: 'Poppins-Bold' }}>Student Progress</Text>
          </TouchableOpacity>
        </View>
        
        {/* Your Classes */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', fontFamily: 'Poppins-Bold' }}>Your Classes</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('FClasses')}
            style={{ 
              backgroundColor: '#00418b', 
              paddingHorizontal: 12, 
              paddingVertical: 6, 
              borderRadius: 8 
            }}>
            <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Poppins-Bold' }}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <ActivityIndicator size="large" color="#00418b" />
            <Text style={{ marginTop: 10, color: '#666', fontFamily: 'Poppins-Regular' }}>Loading your classes...</Text>
          </View>
        ) : error ? (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <Icon name="alert-circle" size={32} color="#ff4444" />
            <Text style={{ marginTop: 10, color: '#ff4444', fontFamily: 'Poppins-Regular' }}>{error}</Text>
          </View>
        ) : classes.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <Icon name="book-open-variant" size={32} color="#666" />
            <Text style={{ marginTop: 10, color: '#666', fontFamily: 'Poppins-Regular' }}>You have no classes yet.</Text>
            <TouchableOpacity 
              onPress={createClasses}
              style={{ 
                marginTop: 10, 
                backgroundColor: '#00418b', 
                paddingHorizontal: 20, 
                paddingVertical: 10, 
                borderRadius: 8 
              }}>
              <Text style={{ color: '#fff', fontFamily: 'Poppins-Bold' }}>Create Your First Class</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {classes.slice(0, 3).map((course, index) => (
              <TouchableOpacity 
                key={index} 
                style={FacultyDashStyle.card}
                onPress={() => modules(course)}>
                <View style={FacultyDashStyle.cardHeader}>
                  <Text style={[FacultyDashStyle.courseTitle, { fontFamily: 'Poppins-Bold' }]}>
                    {course.className || course.name}
                  </Text>
                  <Text style={[FacultyDashStyle.courseCode, { fontFamily: 'Poppins-Regular' }]}>
                    {course.classCode || course.code}
                  </Text>
                </View>
                <Text style={[FacultyDashStyle.progressText, { fontFamily: 'Poppins-Regular' }]}>
                  {course.members ? course.members.length : 0} Students
                </Text>
                <View style={{ height: 10, backgroundColor: 'white', borderRadius: 50, marginTop: 5, overflow: 'hidden' }}>
                  <View style={{ 
                    height: 10, 
                    backgroundColor: '#04061f', 
                    borderRadius: 50, 
                    width: `${Math.min((course.members ? course.members.length : 0) / 30 * 100, 100)}%` 
                  }} />
                </View>
                <TouchableOpacity onPress={() => modules(course)} style={FacultyDashStyle.arrowButton}>
                  <Icon name="arrow-right" size={24} color="white" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
            {classes.length > 3 && (
              <TouchableOpacity 
                onPress={() => navigation.navigate('FClasses')}
                style={{ 
                  alignItems: 'center', 
                  padding: 16, 
                  backgroundColor: '#f0f0f0', 
                  borderRadius: 12, 
                  marginTop: 8 
                }}>
                <Text style={{ color: '#00418b', fontFamily: 'Poppins-Bold' }}>
                  View {classes.length - 3} more classes
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}