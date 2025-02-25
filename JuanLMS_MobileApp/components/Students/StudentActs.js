import { StatusBar } from 'expo-status-bar';
import { LoginStyleheet, Text, TouchableOpacity, View } from 'react-native';
import { CheckBox, Image, ImageBackground, ProgressBar, ScrollView, TextInput } from 'react-native-web';
import * as React from 'react'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import StudentActsStyle from '../styles/Stud/StudentActsStyle';

const Tab = createMaterialTopTabNavigator()

//Upcoming Components
function Upcoming() {
  const acts = [
    { name: 'Quiz 1', due: "Due at 11:59 pm", class:"Introduction to Computing", points:"25 points" },
    { name: 'Act 1', due: "Due at 11:59 pm", class:"Introduction to Computing", points:"15 points" }
  ];

  return (
    <View style={StudentActsStyle.container}>
      <Text style={StudentActsStyle.title}>February 28</Text>

      {acts.map((course, index) => (
          <View key={index} style={StudentActsStyle.card}>
            <View style={StudentActsStyle.cardHeader}>
              <Text style={StudentActsStyle.courseTitle}>{course.name}</Text>
              <Text style={StudentActsStyle.courseCode}>{course.points}</Text>
            </View>
            <Text style={StudentActsStyle.courseCode}>{course.due}</Text>

            <Text style={StudentActsStyle.courseCode}>{course.class}</Text>
            
            {/* <TouchableOpacity
              // onPress={modules}
              style={StudentActsStyle.arrowButton}>
              <Icon name="arrow-right" size={24} color="white" />
            </TouchableOpacity> */}
          </View>
        ))}



      

    </View>
  )
}

function Past() {
  return (
    <View style={StudentActsStyle.container}>
      <Text style={{textAlign:"center", marginTop:'auto',marginBottom:'auto'}}>No Past Due</Text>

    </View>
  )
}

function Completed() {
  return (
    <View style={StudentActsStyle.container}>
      <Text style={{textAlign:"center", marginTop:'auto',marginBottom:'auto'}}>No Completed Tasks yet</Text>
    </View>
  )
}


function Tabs() {
  return (
    <Tab.Navigator
      initialRouteName='Upcoming'
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
    
  const back =()=>{
        changeScreen.navigate("SDash")
      }

  return (
    <View>
      <View style={StudentActsStyle.header}>
      <TouchableOpacity onPress={back}><Icon name="arrow-left" size={24} color="black" /></TouchableOpacity>
        <View>
          <Text style={StudentActsStyle.title}>My Activities</Text>
        </View>

      </View>

      <Tabs />


    </View>

    // <NavigationContainer>
    //   <Tabs />
    // </NavigationContainer>
  );
}