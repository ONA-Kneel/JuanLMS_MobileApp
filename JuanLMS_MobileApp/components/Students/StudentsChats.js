import { StatusBar } from 'expo-status-bar';
import { LoginStyleheet, Text, TouchableOpacity, View } from 'react-native';
import { CheckBox, Image, ImageBackground, ProgressBar, ScrollView, TextInput } from 'react-native-web';
import * as React from 'react'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import StudentActsStyle from '../styles/Stud/StudentActsStyle';


const Tab = createMaterialTopTabNavigator()


export default function StudentChats() {
  //navigation
  const changeScreen = useNavigation();
    
  const back =()=>{
        changeScreen.navigate("SDash")
      }

  const goChat=()=>{
    changeScreen.navigate("Chats")
  }
  return (
    <View>
      <View style={{margin:20}}>
        <Text  style={{fontWeight:'bold'}}>Chats</Text>

        <View style={{margin:20,}}>
          <TouchableOpacity 
          onPress={goChat}
          style={{backgroundColor:'lightgray', borderRadius:10, marginTop:10}}>
            <View  style={{margin:10, borderBottomColor:'black'}}> 
              <Text style={{fontWeight:'bold'}}>Chat 1</Text>
              <Text>Hello</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
          onPress={goChat}
          style={{backgroundColor:'lightgray', borderRadius:10, marginTop:10}}>
            <View  style={{margin:10, borderBottomColor:'black'}}> 
              <Text style={{fontWeight:'bold'}}>Chat 2</Text>
              <Text>HII</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>

    // <NavigationContainer>
    //   <Tabs />
    // </NavigationContainer>
  );
}