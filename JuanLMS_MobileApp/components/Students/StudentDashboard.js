import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, View, ScrollView, Image } from 'react-native';
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
      if (!user || !user.studentID) return;
      setLoading(true);
      try {
        const response = await fetch(`https://juanlms-mobileapp.onrender.com/student-classes?studentID=${user.studentID}`);
        const data = await response.json();
        if (data.success) {
          setClasses(data.classes);
          // Calculate completed classes percent (10% per class)
          setCompletedClassesPercent(data.classes.length * 10);
        } else {
          setClasses([]);
          setCompletedClassesPercent(0);
        }
      } catch (error) {
        setClasses([]);
        setCompletedClassesPercent(0);
      }
      setLoading(false);
    };
    fetchClasses();
  }, [user]);

  useEffect(() => {
    // Fetch assignments for today and calculate completion
    const fetchAssignments = async () => {
      if (!user || !user.studentID) return;
      try {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        // Replace with your actual endpoint for assignments
        const response = await fetch(`https://juanlms-mobileapp.onrender.com/student-assignments?studentID=${user.studentID}&date=${todayStr}`);
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

  const modules = () => {
    changeScreen.navigate("SModule")
  }

  return (
    <View style={StudentDashboardStyle.container}>
      {/* Blue background */}
      <View style={StudentDashboardStyle.blueHeaderBackground} />
      {/* White card header */}
      <View style={StudentDashboardStyle.whiteHeaderCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={StudentDashboardStyle.headerTitle}>Hello, <Text style={{ fontWeight: 'bold', fontFamily: 'Poppins-Bold' }}>{user?.firstname || 'Student'}!</Text></Text>
            <Text style={StudentDashboardStyle.headerSubtitle}>{formatDateTime(currentDateTime)}</Text>
          </View>
          <TouchableOpacity onPress={() => changeScreen.navigate('SProfile')}>
            <Image 
              source={require('../../assets/profile-icon.png')} 
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
        {/* Stats Row - now functional */}
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
        {/* Assignment Due Card - only if there are assignments today */}
        {assignmentsToday.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0e0e0', borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <Icon name="calendar" size={32} color="#00418b" />
            <Text style={{ marginLeft: 12, color: '#222', fontSize: 15, fontWeight: 'bold', fontFamily: 'Poppins-Bold' }}>You have a due assignment today</Text>
          </View>
        )}
        {/* Your Classes */}
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 24, marginBottom: 8, fontFamily: 'Poppins-Bold' }}>Your Classes</Text>
        <View>
          {loading ? (
            <Text>Loading...</Text>
          ) : classes.length === 0 ? (
            <Text>You have no classes yet.</Text>
          ) : (
            classes.map((course, index) => (
              <View key={index} style={StudentDashStyle.card}>
                <View style={StudentDashStyle.cardHeader}>
                  <Text style={[StudentDashStyle.courseTitle, { fontFamily: 'Poppins-Bold' }]}>{course.className}</Text>
                  <Text style={[StudentDashStyle.courseCode, { fontFamily: 'Poppins-Regular' }]}>{course.classCode}</Text>
                </View>
                {/* You can add progress logic here if available */}
                <TouchableOpacity
                  onPress={modules}
                  style={StudentDashStyle.arrowButton}>
                  <Icon name="arrow-right" size={24} color="white" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
        {/* Completed Classes Section (optional) */}
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 24, marginBottom: 8, fontFamily: 'Poppins-Bold' }}>Completed Classes</Text>
        {/* You can map completed classes here if needed */}
      </ScrollView>
    </View>
  );
}