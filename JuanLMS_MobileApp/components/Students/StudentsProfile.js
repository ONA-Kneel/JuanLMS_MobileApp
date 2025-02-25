import { StatusBar } from 'expo-status-bar';
import { LoginStyleheet, Text, TouchableOpacity, View } from 'react-native';
import { CheckBox, Image, ImageBackground, ProgressBar, ScrollView, TextInput } from 'react-native-web';
import * as React from 'react'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import StudentActsStyle from '../styles/Stud/StudentActsStyle';

const Tab = createMaterialTopTabNavigator()


export default function StudentsProfile() {
  //navigation
  const changeScreen = useNavigation();
    
  const back =()=>{
        changeScreen.navigate("SDash")
      }

  return (
    <View>
      


    </View>

    // <NavigationContainer>
    //   <Tabs />
    // </NavigationContainer>
  );
}