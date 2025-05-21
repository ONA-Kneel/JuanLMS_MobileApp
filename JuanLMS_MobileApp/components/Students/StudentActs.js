import { StatusBar } from 'expo-status-bar';
import { Text, TouchableOpacity, View } from 'react-native';
import { CheckBox, Image, ImageBackground, ProgressBar, ScrollView, TextInput } from 'react-native-web';
import * as React from 'react'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import StudentActsStyle from '../styles/Stud/StudentActsStyle';

const Tab = createMaterialTopTabNavigator()



//Upcoming Components
function Upcoming() {
  const acts = [
    { name: 'Quiz 1', due: "Due at 11:59 pm", class: "Introduction to Computing", points: "25 points" },
    { name: 'Act 1', due: "Due at 11:59 pm", class: "Introduction to Computing", points: "15 points" }
  ];

  return (
    <ScrollView style={StudentActsStyle.container}>
      <Text style={StudentActsStyle.title}>February 28</Text>

      {acts.map((course, index) => (
        <View key={index} style={StudentActsStyle.card}>
          <View style={StudentActsStyle.cardHeader}>
            <Text style={StudentActsStyle.courseTitle}>{course.name}</Text>
            <Text style={StudentActsStyle.courseCode}>{course.points}</Text>
          </View>
          <Text style={StudentActsStyle.courseCode}>{course.due}</Text>

          <Text style={StudentActsStyle.courseCode}>{course.class}</Text>
        </View>
      ))}
    </ScrollView>
  )
}

function Past() {
  return (
    <View style={StudentActsStyle.container}>
      <Text style={{ textAlign: "center", marginTop: 'auto', marginBottom: 'auto' }}>No Past Due</Text>
    </View>
  )
}

function Completed() {
  return (
    <View style={StudentActsStyle.container}>
      <Text style={{ textAlign: "center", marginTop: 'auto', marginBottom: 'auto' }}>No Completed Tasks yet</Text>
    </View>
  )
}

function Tabs() {
  return (
    <Tab.Navigator
      initialRouteName='Upcoming'
      style={{
        backgroundColor: '#fff',
        borderRadius: 20,
        marginHorizontal: 18,
        marginTop: 5,
      }}
    >
      <Tab.Screen name='Upcoming' component={Upcoming} options={{ tabBarLabel: "Upcoming" }} />
      <Tab.Screen name='Past' component={Past} options={{ tabBarLabel: "Past Due" }} />
      <Tab.Screen name='Completed' component={Completed} options={{ tabBarLabel: "Completed" }} />
    </Tab.Navigator>
  );
}

export default function StudentActs() {
  //navigation
  const changeScreen = useNavigation();

  return (
    <View style={{ flex: 1, backgroundColor: '#f3f3f3' }}>
      {/* Blue background */}
      <View style={StudentActsStyle.blueHeaderBackground} />
      {/* White card header */}
      <View style={StudentActsStyle.whiteHeaderCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={StudentActsStyle.headerTitle}>Activities</Text>
            <Text style={StudentActsStyle.headerSubtitle}>Date and Time</Text>
          </View>
          <TouchableOpacity onPress={() => changeScreen.navigate('SProfile')}>
            <Image source={require('../../assets/profile-icon (2).png')} style={{ width: 36, height: 36, borderRadius: 18 }} />
          </TouchableOpacity>
        </View>
      </View>
      <Tabs />
    </View>
  );
}