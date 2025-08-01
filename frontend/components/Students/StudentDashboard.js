import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, View, ScrollView, Image, ActivityIndicator } from 'react-native';
import StudentDashStyle from '../styles/Stud/StudentDashStyle';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import CustomBottomNav from '../CustomBottomNav';
import StudentDashboardStyle from '../styles/Stud/StudentDashStyle';
import { useUser } from '../UserContext';

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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Fetch classes for the logged-in student
    const fetchClasses = async () => {
      if (!user || !user._id) {
        console.log('No user ID available');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching classes for user:', user._id);
        const response = await fetch(`https://juanlms-mobileapp.onrender.com/api/student-classes?studentID=${user._id}`, {
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
          // Calculate completion percentage based on completed property if it exists
          const completedCount = data.classes.filter(c => c.completed).length;
          const totalCount = data.classes.length;
          setCompletedClassesPercent(totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0);
          setError(null);
        } else {
          console.error('Invalid API Response:', data);
          setClasses([]);
          setCompletedClassesPercent(0);
          setError(data.error || 'Failed to fetch classes');
        }
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
        
        const response = await fetch(`https://juanlms-mobileapp.onrender.com/api/student-assignments?studentID=${user._id}&date=${todayStr}`);
        const data = await response.json();
        
        if (data.success) {
          setAssignmentsToday(data.assignments);
          const completed = data.assignments.filter(a => a.completed).length;
          setAssignmentsCompletedToday(completed);
          setCompletedAssignmentsPercent(data.assignments.length === 0 ? 100 : Math.round((completed / data.assignments.length) * 100));
        } else {
          setAssignmentsToday([]);
          setAssignmentsCompletedToday(0);
          setCompletedAssignmentsPercent(100);
        }
      } catch (error) {
        setAssignmentsToday([]);
        setAssignmentsCompletedToday(0);
        setCompletedAssignmentsPercent(100);
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
    changeScreen.navigate("SModule", { course });
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
            <Text style={StudentDashboardStyle.headerSubtitle}>{formatDateTime(currentDateTime)}</Text>
          </View>
          <TouchableOpacity onPress={() => changeScreen.navigate('SProfile')}>
            <Image 
              source={require('../../assets/profile-icon (2).png')} 
              style={{ width: 36, height: 36, borderRadius: 18 }}
              resizeMode="cover"
            />
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
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, fontFamily: 'Poppins-Bold' }}>{completedClassesPercent}%</Text>
            <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center', fontFamily: 'Poppins-Regular' }}>Completed Classes</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#00418b', borderRadius: 16, alignItems: 'center', padding: 16, marginLeft: 8, elevation: 2 }}>
            <Icon name="pencil" size={32} color="#fff" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, fontFamily: 'Poppins-Bold' }}>{completedAssignmentsPercent}%</Text>
            <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center', fontFamily: 'Poppins-Regular' }}>Completed Assignments</Text>
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
        <Text style={StudentDashboardStyle.sectionTitle}>Your Classes</Text>
        
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
          </View>
        ) : (
          classes.map((course, index) => (
            <TouchableOpacity 
              key={index} 
              style={StudentDashStyle.card}
              onPress={() => modules(course)}>
              <View style={StudentDashStyle.cardHeader}>
                <Text style={[StudentDashStyle.courseTitle, { fontFamily: 'Poppins-Bold' }]}>
                  {course.className || course.name}
                </Text>
                <Text style={[StudentDashStyle.courseCode, { fontFamily: 'Poppins-Regular' }]}>
                  {course.classCode || course.code}
                </Text>
              </View>
              <View style={StudentDashStyle.arrowButton}>
                <Icon name="arrow-right" size={24} color="white" />
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Completed Classes Section */}
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 24, marginBottom: 8, fontFamily: 'Poppins-Bold' }}>Completed Classes</Text>
      </ScrollView>
    </View>
  );
} 