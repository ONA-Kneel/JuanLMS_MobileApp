import { Text, TouchableOpacity, View } from 'react-native';
import { Image, ProgressBar, ScrollView } from 'react-native-web';
import { useState } from 'react';
import StudentDashStyle from '../styles/Stud/StudentDashStyle';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';


export default function FacultyDashboard() {
  const classes = [
    { name: 'Introduction to Computing', progress: 0 },
    { name: 'Fundamentals of Programming', progress: 0 },
    { name: 'Physical Education', progress: 0 },
    { name: 'Ethics', progress: 1 },
  ];
  const changeScreen = useNavigation();

//   const modules = () => {
//     changeScreen.navigate("SModule")
//   }

//   const grades = () => {
//     changeScreen.navigate("SGrade")
//   }

//   const activities = () =>
//   {
//     changeScreen.navigate("SActs")
//   }

//   const progress = () =>
//   {
//     changeScreen.navigate("SProg")
//   }

  return (
    <View style={StudentDashStyle.container}>
      <View style={StudentDashStyle.header}>
        <Image source={require('../../assets/Logo3.svg')} style={StudentDashStyle.logo} />
      </View>
      <View style={StudentDashStyle.iconsContainer}>
        <TouchableOpacity style={StudentDashStyle.iconWrapper} >
          <Icon name="star" size={40} color="#f3f3f3" style={{ backgroundColor: "#00418b", padding: 10, borderRadius: 50 }} />
          <Text style={{ fontWeight: "bold", margin: 5 }}>My Grades</Text>
        </TouchableOpacity>
        <TouchableOpacity style={StudentDashStyle.iconWrapper} >
          <Icon name="book" size={40} color="#f3f3f3" style={{ backgroundColor: "#00418b", padding: 10, borderRadius: 50 }} />
          <Text style={{ fontWeight: "bold", margin: 5 }}>Activities</Text>
        </TouchableOpacity>
        <TouchableOpacity style={StudentDashStyle.iconWrapper} >
          <Icon name="chart-bar" size={40} color="#f3f3f3" style={{ backgroundColor: "#00418b", padding: 10, borderRadius: 50 }} />
          <Text style={{ fontWeight: "bold", margin: 5 }}>My Progressions</Text>
        </TouchableOpacity>
      </View>

      <Text style={StudentDashStyle.title}>Your Classes</Text>
      <ScrollView>
        {classes.map((course, index) => (
          <View key={index} style={StudentDashStyle.card}>
            <View style={StudentDashStyle.cardHeader}>
              <Text style={StudentDashStyle.courseTitle}>{course.name}</Text>
              <Text style={StudentDashStyle.courseCode}>CCINCOM1</Text>
            </View>
            <Text style={StudentDashStyle.progressText}>{course.progress === 1 ? '100% Completed' : '0% Resume'}</Text>
            <ProgressBar progress={course.progress} color={course.progress === 1 ? '#04061f' : 'white'} style={StudentDashStyle.progressBar} />
            <TouchableOpacity
              style={StudentDashStyle.arrowButton}>
              <Icon name="arrow-right" size={24} color="white" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}