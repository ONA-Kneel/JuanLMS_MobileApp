import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, View, ScrollView, Image, ActivityIndicator } from 'react-native';
import StudentDashStyle from '../styles/Stud/StudentDashStyle';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import CustomBottomNav from '../CustomBottomNav';
import StudentDashboardStyle from '../styles/Stud/StudentDashStyle';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StudentDashboard() {
  const changeScreen = useNavigation();
  const { user } = useUser();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedClassesPercent, setCompletedClassesPercent] = useState(0);
  const [completedAssignmentsPercent, setCompletedAssignmentsPercent] = useState(0);
  const [assignmentsToday, setAssignmentsToday] = useState([]);
  const [assignmentsCompletedToday, setAssignmentsCompletedToday] = useState(0);
  const [academicContext, setAcademicContext] = useState('2025-2026 | Term 1');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Fetch classes for the logged-in student
      const fetchClasses = async () => {
    if (!user || !user._id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching classes for student:', user._id);
      const token = await AsyncStorage.getItem('jwtToken');
      
      // First, get the current active academic year and term
      const academicResponse = await fetch(`https://juanlms-webapp-server.onrender.com/api/academic-year/active`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      let activeYear = '2025-2026';
      let activeTerm = 'Term 1';
      
      if (academicResponse.ok) {
        const academicData = await academicResponse.json();
        console.log('Academic year API response:', academicData);
        if (academicData.success && academicData.academicYear) {
          activeYear = academicData.academicYear.year;
          activeTerm = academicData.academicYear.currentTerm;
          console.log('Using academic year data:', activeYear, activeTerm);
        } else {
          console.log('Academic year data not in expected format:', academicData);
        }
      } else {
        console.log('Academic year API not available, using default values');
        console.log('Response status:', academicResponse.status);
      }

      console.log('Active Academic Year:', activeYear, 'Term:', activeTerm);
      
      // Update academic context for display
      setAcademicContext(`${activeYear} | ${activeTerm}`);
      
      // Use the student-classes endpoint to get only classes where the student is enrolled
      const response = await fetch(`https://juanlms-webapp-server.onrender.com/api/classes/student-classes?studentID=${user._id}`, {
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
      console.log('API Response from /student-classes:', data);
      
      let userClasses = [];
      if (data.success && Array.isArray(data.classes)) {
        userClasses = data.classes;
      } else if (Array.isArray(data)) {
        userClasses = data;
      } else {
        console.log('No classes found or invalid response structure');
        userClasses = [];
      }
      
      console.log('Classes where student is enrolled:', userClasses.length);
      
      // Only show classes where the student is actually enrolled
      if (userClasses.length === 0) {
        console.log('No classes found where student is enrolled');
        setClasses([]);
      } else {
        console.log('Classes where student is enrolled:', userClasses.length);
        setClasses(userClasses);
      }
      setError(null);
      
      // No completion percentage needed for active classes
      setCompletedClassesPercent(0);
    } catch (error) {
      console.error('Network error fetching classes:', error);
      setClasses([]);
      setCompletedClassesPercent(0);
      setError('Network error occurred: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
    
    fetchClasses();
  }, [user]);

  useEffect(() => {
    // Fetch assignments for today and calculate completion
    const fetchAssignments = async () => {
      if (!user || !user._id) return;
      
      try {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        
        const token = await AsyncStorage.getItem('jwtToken');
        const response = await fetch(`https://juanlms-webapp-server.onrender.com/api/student-assignments?studentID=${user._id}&date=${todayStr}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
          setAssignmentsToday(data.assignments);
          setAssignmentsCompletedToday(0);
          setCompletedAssignmentsPercent(0);
        } else {
          setAssignmentsToday([]);
          setAssignmentsCompletedToday(0);
          setCompletedAssignmentsPercent(0);
        }
      } catch (error) {
        setAssignmentsToday([]);
        setAssignmentsCompletedToday(0);
        setCompletedAssignmentsPercent(0);
      }
    };
    
    fetchAssignments();
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
    // Find the exact class by classID to avoid wrong navigation
    const exactClass = classes.find(c => c.classID === course.classID);
    if (exactClass) {
      changeScreen.navigate("SModule", { classId: exactClass.classID });
    } else {
      changeScreen.navigate("SModule", { classId: course.classID || course.classId || course._id });
    }
  };

  return (
    <View style={StudentDashboardStyle.container}>
      {/* Blue background */}
      <View style={StudentDashboardStyle.blueHeaderBackground} />
      
      {/* White card header */}
      <View style={StudentDashboardStyle.whiteHeaderCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={StudentDashboardStyle.headerTitle}>
              Hello, <Text style={{ fontWeight: 'bold', fontFamily: 'Poppins-Bold' }}>{user?.firstname || 'Student'}!</Text>
            </Text>
                         <Text style={StudentDashboardStyle.headerSubtitle}>{academicContext}</Text>
             <Text style={StudentDashboardStyle.headerSubtitle2}>{formatDateTime(currentDateTime)}</Text>
          </View>
          <TouchableOpacity onPress={() => changeScreen.navigate('SProfile')}>
            {user?.profilePicture ? (
              <Image 
                source={{ uri: user.profilePicture }} 
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

      <ScrollView
        contentContainerStyle={{
          paddingBottom: 80,
          paddingHorizontal: 20,
          paddingTop: 10,
        }}
      >
        {/* Stats Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: '#00418b', borderRadius: 16, alignItems: 'center', padding: 16, marginRight: 8, elevation: 2 }}>
            <Icon name="book" size={32} color="#fff" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, fontFamily: 'Poppins-Bold' }}>{classes.length}</Text>
            <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center', fontFamily: 'Poppins-Regular' }}>Active Classes</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#00418b', borderRadius: 16, alignItems: 'center', padding: 16, marginLeft: 8, elevation: 2 }}>
            <Icon name="pencil" size={32} color="#fff" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, fontFamily: 'Poppins-Bold' }}>{assignmentsToday.length}</Text>
            <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center', fontFamily: 'Poppins-Regular' }}>Due Today</Text>
          </View>
        </View>

        {/* Assignment Due Card */}
        {assignmentsToday.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0e0e0', borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <Icon name="calendar" size={32} color="#00418b" />
            <Text style={{ marginLeft: 12, color: '#222', fontSize: 15, fontWeight: 'bold', fontFamily: 'Poppins-Bold' }}>You have a due assignment today</Text>
          </View>
        )}

        {/* Your Classes Section */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', fontFamily: 'Poppins-Bold' }}>Your Classes</Text>
          {classes.length > 3 && (
            <TouchableOpacity
              onPress={() => changeScreen.navigate('SClasses')}
              style={{
                backgroundColor: '#00418b',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8
              }}>
              <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Poppins-Bold' }}>View All</Text>
            </TouchableOpacity>
          )}
        </View>

        {classes.slice(0, 3).map((course, index) => (
          <TouchableOpacity
            key={index}
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 20,
              marginBottom: 18,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
            onPress={() => modules(course)}
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
              {course.image ? (
                <Image
                  source={{ uri: course.image }}
                  style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                />
              ) : (
                <Icon name="book-open-page-variant" size={48} color="#00418b" />
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
                  {course.className || course.name}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#666',
                  fontFamily: 'Poppins-Regular',
                  marginBottom: 8
                }}>
                  {course.classCode || course.code}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: '#888',
                  fontFamily: 'Poppins-Regular'
                }}>
                  {course.members ? course.members.length : 0} Students
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color="#00418b" />
            </View>
          </TouchableOpacity>
        ))}

        {classes.length > 3 && (
          <TouchableOpacity
            onPress={() => changeScreen.navigate('SClasses')}
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


      </ScrollView>
    </View>
  );
} 