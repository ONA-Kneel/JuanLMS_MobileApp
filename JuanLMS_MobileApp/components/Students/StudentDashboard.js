import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Image } from 'react-native-web';
import StudentDashStyle from '../styles/Stud/StudentDashStyle';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import CustomBottomNav from '../CustomBottomNav';
import StudentDashboardStyle from '../styles/Stud/StudentDashStyle';
import { useUser } from '../UserContext';

export default function StudentDashboard() {
  const classes = [
    { name: 'Introduction to Computing', progress: 0.78 },
    { name: 'Fundamentals of Programming', progress: 0.0 },
    { name: 'Physical Education', progress: 0.0 },
    { name: 'Ethics', progress: 1.0 },
  ];
  const changeScreen = useNavigation();
  const { user } = useUser();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
            <Image source={require('../../assets/profile-icon (2).png')} style={{ width: 36, height: 36, borderRadius: 18 }} />
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
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, fontFamily: 'Poppins-Bold' }}>78%</Text>
            <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center', fontFamily: 'Poppins-Regular' }}>Completed Classes</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#00418b', borderRadius: 16, alignItems: 'center', padding: 16, marginLeft: 8, elevation: 2 }}>
            <Icon name="pencil" size={32} color="#fff" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, fontFamily: 'Poppins-Bold' }}>98%</Text>
            <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center', fontFamily: 'Poppins-Regular' }}>Completed Assignments</Text>
          </View>
        </View>
        {/* Assignment Due Card */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0e0e0', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <Icon name="calendar" size={32} color="#00418b" />
          <Text style={{ marginLeft: 12, color: '#222', fontSize: 15, fontWeight: 'bold', fontFamily: 'Poppins-Bold' }}>You have a due assignment today</Text>
        </View>
        {/* Your Classes */}
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 24, marginBottom: 8, fontFamily: 'Poppins-Bold' }}>Your Classes</Text>
        <View>
          {classes.map((course, index) => (
            <View key={index} style={StudentDashStyle.card}>
              <View style={StudentDashStyle.cardHeader}>
                <Text style={[StudentDashStyle.courseTitle, { fontFamily: 'Poppins-Bold' }]}>{course.name}</Text>
                <Text style={[StudentDashStyle.courseCode, { fontFamily: 'Poppins-Regular' }]}>CCINCOM1</Text>
              </View>
              <Text style={[StudentDashStyle.progressText, { fontFamily: 'Poppins-Regular' }]}>{course.progress === 1 ? '100% Completed' : `${Math.round(course.progress * 100)}% Resume`}</Text>
              <View style={{ height: 10, backgroundColor: 'white', borderRadius: 50, marginTop: 5, overflow: 'hidden' }}>
                <View style={{ height: 10, backgroundColor: '#04061f', borderRadius: 50, width: `${course.progress * 100}%` }} />
              </View>
              <TouchableOpacity
                onPress={modules}
                style={StudentDashStyle.arrowButton}>
                <Icon name="arrow-right" size={24} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
        {/* Completed Classes Section (optional) */}
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 24, marginBottom: 8, fontFamily: 'Poppins-Bold' }}>Completed Classes</Text>
        {/* You can map completed classes here if needed */}
      </ScrollView>
  
    </View>
  );
}