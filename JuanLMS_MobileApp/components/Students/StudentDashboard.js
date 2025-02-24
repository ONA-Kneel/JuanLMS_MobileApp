import { StatusBar } from 'expo-status-bar';
import { LoginStyleheet, Text, TouchableOpacity, View } from 'react-native';
import { CheckBox, Image, ImageBackground, ProgressBar, ScrollView, TextInput } from 'react-native-web';
import { useState } from 'react';
import StudentDashStyle from '../styles/Stud/StudentDashStyle';


import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';


export default function StudentDashboard() {
    const classes = [
        { name: 'Introduction to Computing', progress: 0 },
        { name: 'Fundamentals of Programming', progress: 0 },
        { name: 'Physical Education', progress: 0 },
        { name: 'Ethics', progress: 1 },
      ];
      const changeScreen = useNavigation();

      const modules =()=>{
        changeScreen.navigate("SModule")
      }

      return (
        <View style={StudentDashStyle.container}>
            <View>
                
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
                <ProgressBar progress={course.progress} color={course.progress === 1 ? 'black' : 'white'} style={StudentDashStyle.progressBar} />
                <TouchableOpacity 
                  onPress={modules}
                  style={StudentDashStyle.arrowButton}>
                  <Icon name="arrow-right" size={24} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
  );
}