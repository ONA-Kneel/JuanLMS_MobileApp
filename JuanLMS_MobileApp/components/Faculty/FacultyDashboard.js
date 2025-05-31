import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, View, ScrollView, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import FacultyDashStyle from '../styles/faculty/FacultyDashStyle';
import { useUser } from '../UserContext';

export default function FacultyDashboard() {
  const classes = [
    { name: 'Introduction to Computing', students: 10 },
    { name: 'Fundamentals of Programming', students: 30 },
  ];
  const navigation = useNavigation();
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
    navigation.navigate('FMod');
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
      {/* Blue background */}
      <View style={FacultyDashStyle.blueHeaderBackground} />
      {/* White card header */}
      <View style={FacultyDashStyle.whiteHeaderCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={FacultyDashStyle.headerTitle}>Hello, <Text style={{ fontWeight: 'bold', fontFamily: 'Poppins-Bold' }}>{user?.firstname || 'Faculty'}!</Text></Text>
            <Text style={FacultyDashStyle.headerSubtitle}>{formatDateTime(currentDateTime)}</Text>
          </View>
          <TouchableOpacity onPress={goToProfile}>
            <Image source={require('../../assets/profile-icon (2).png')} style={{ width: 36, height: 36, borderRadius: 18 }} />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 20, paddingTop: 10 }}>
        {/* Stats Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: '#00418b', borderRadius: 16, alignItems: 'center', padding: 16, marginRight: 8, elevation: 2 }}>
            <Icon name="book" size={32} color="#fff" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, fontFamily: 'Poppins-Bold' }}>2</Text>
            <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center', fontFamily: 'Poppins-Regular' }}>My Classes</Text>
          </View>
          
        </View>
        {/* Create Classes and Progression Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <TouchableOpacity onPress={createClasses} style={{ flex: 1, backgroundColor: '#e3eefd', borderRadius: 16, alignItems: 'center', padding: 16, marginRight: 8, elevation: 2 }}>
            <Icon name="plus" size={32} color="#00418b" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#00418b', fontWeight: 'bold', fontSize: 16, fontFamily: 'Poppins-Bold' }}>Create Classes</Text>
          </TouchableOpacity>
          
        </View>
        {/* Your Classes */}
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 24, marginBottom: 8, fontFamily: 'Poppins-Bold' }}>Your Classes</Text>
        {classes.map((course, index) => (
          <View key={index} style={FacultyDashStyle.card}>
            <View style={FacultyDashStyle.cardHeader}>
              <Text style={[FacultyDashStyle.courseTitle, { fontFamily: 'Poppins-Bold' }]}>{course.name}</Text>
              <Text style={[FacultyDashStyle.courseCode, { fontFamily: 'Poppins-Regular' }]}>FAC-CLASS</Text>
            </View>
            <Text style={[FacultyDashStyle.progressText, { fontFamily: 'Poppins-Regular' }]}>{course.students} Students</Text>
            <View style={{ height: 10, backgroundColor: 'white', borderRadius: 50, marginTop: 5, overflow: 'hidden' }}>
              <View style={{ height: 10, backgroundColor: '#04061f', borderRadius: 50, width: `${(course.students / 30) * 100}%` }} />
            </View>
            <TouchableOpacity onPress={modules} style={FacultyDashStyle.arrowButton}>
              <Icon name="arrow-right" size={24} color="white" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}