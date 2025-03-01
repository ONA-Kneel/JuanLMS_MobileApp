import { Text, TouchableOpacity, View } from 'react-native';
import { Image, ProgressBar, ScrollView } from 'react-native-web';
import { useState } from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import FacultyDashStyle from '../styles/faculty/FacultyDashStyle';



export default function FacultyDashboard() {
  const classes = [
    { name: 'Introduction to Computing', students: 10 },
    { name: 'Fundamentals of Programming', students: 30},
  ];
  const changeScreen = useNavigation();

  const modules = () => {
    changeScreen.navigate("FMod")
  }

    const createClasses = () => {
        changeScreen.navigate('CClass')
    }
    const studProg = () => {
        changeScreen.navigate('FSProg')
    }

  return (
    <View style={FacultyDashStyle.container}>
      <View style={FacultyDashStyle.header}>
        <Image source={require('../../assets/Logo3.svg')} style={FacultyDashStyle.logo} />
      </View>
      <View style={FacultyDashStyle.iconsContainer}>
        
        <TouchableOpacity 
            onPress={createClasses}
            style={FacultyDashStyle.iconWrapper} >
          <Icon name="plus" size={40} color="#f3f3f3" style={{ backgroundColor: "#00418b", padding: 10, borderRadius: 50 }} />
          <Text style={{ fontWeight: "bold", margin: 5 }}>Create Classes</Text>
        </TouchableOpacity>
        <TouchableOpacity 
            onPress={studProg}
            style={FacultyDashStyle.iconWrapper} >
          <Icon name="chart-bar" size={40} color="#f3f3f3" style={{ backgroundColor: "#00418b", padding: 10, borderRadius: 50 }} />
          <Text style={{ fontWeight: "bold", margin: 5 }}>My Progressions</Text>
        </TouchableOpacity>
      </View>

      <Text style={FacultyDashStyle.title}>Your Classes</Text>
      <ScrollView>
        {classes.map((course, index) => (
          <View key={index} style={FacultyDashStyle.card}>
            <View style={FacultyDashStyle.cardHeader}>
              <Text style={FacultyDashStyle.courseTitle}>{course.name}</Text>
            </View>
            <Text style={FacultyDashStyle.progressText}>{course.students} Students</Text>
            <TouchableOpacity
              onPress={modules}
              style={FacultyDashStyle.arrowButton}>
              <Icon name="arrow-right" size={24} color="white" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}