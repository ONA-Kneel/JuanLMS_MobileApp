import { Text, TouchableOpacity, View } from 'react-native';
import * as React from 'react'
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ParentProfileStyle from '../styles/parent/ParentProfileStyle';

export default function ParentProfile() {
//navigation
const changeScreen = useNavigation();
    
const logout =()=>{
      changeScreen.navigate("Login")
    }

  return (
    <View style={ParentProfileStyle.container}>
      <View style={ParentProfileStyle.card}>
        <View style={ParentProfileStyle.profileContainer}>
          <View style={ParentProfileStyle.avatar} />
          <Text style={ParentProfileStyle.name}>Doe, Johnny</Text>
          <Text style={ParentProfileStyle.info}>Parent</Text>
          <Text style={ParentProfileStyle.info}>Parent of Student: John Doe</Text>
          <TouchableOpacity style={ParentProfileStyle.button}>
            <MaterialIcons name="camera-alt" size={16} color="white" />
            <Text style={ParentProfileStyle.buttonText}> Update Photo</Text>
          </TouchableOpacity>
        </View>
        <View style={ParentProfileStyle.contactContainer}>
          <Text style={ParentProfileStyle.contactTitle}>Contact</Text>
          <View style={ParentProfileStyle.contactRow}>
            <MaterialIcons name="email" size={16} color="#555" />
            <Text style={ParentProfileStyle.contactText}>doejohnny@parents.sjddef.edu.ph</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={ParentProfileStyle.logout} onPress={logout}><Text style={ParentProfileStyle.buttonText}>Log-Out</Text></TouchableOpacity>
      </View>

  );
}