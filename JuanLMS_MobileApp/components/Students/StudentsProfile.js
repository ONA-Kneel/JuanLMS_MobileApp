import { StatusBar } from 'expo-status-bar';
import { LoginStyleheet, Text, TouchableOpacity, View } from 'react-native';
import { CheckBox, Image, ImageBackground, ProgressBar, ScrollView, TextInput } from 'react-native-web';
import * as React from 'react'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import StudentActsStyle from '../styles/Stud/StudentActsStyle';
import StudentsProfileStyle from '../styles/Stud/StudentsProfileStyle';



export default function StudentsProfile() {


  return (
    <View style={StudentsProfileStyle.container}>
      <View style={StudentsProfileStyle.card}>
        <View style={StudentsProfileStyle.profileContainer}>
          <View style={StudentsProfileStyle.avatar} />
          <Text style={StudentsProfileStyle.name}>Doe, John</Text>
          <Text style={StudentsProfileStyle.info}>Student</Text>
          <Text style={StudentsProfileStyle.info}>College of Nursing</Text>
          <TouchableOpacity style={StudentsProfileStyle.button}>
            <MaterialIcons name="camera-alt" size={16} color="white" />
            <Text style={StudentsProfileStyle.buttonText}> Update Photo</Text>
          </TouchableOpacity>
        </View>
        <View style={StudentsProfileStyle.contactContainer}>
          <Text style={StudentsProfileStyle.contactTitle}>Contact</Text>
          <View style={StudentsProfileStyle.contactRow}>
            <MaterialIcons name="email" size={16} color="#555" />
            <Text style={StudentsProfileStyle.contactText}>doej@students.sjddef.edu.ph</Text>
          </View>
        </View>
      </View>
      </View>

  );
}