import { Text, TouchableOpacity, View } from 'react-native';
import * as React from 'react'
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DirectorProfileStyle from '../styles/directors/DirectorProfileStyle.js';


export default function DirectorProfile() {

  //navigation
  const changeScreen = useNavigation();

  const logout = () => {
    changeScreen.navigate("Login")
  }

  return (
    <View style={DirectorProfileStyle.container}>
      <View style={DirectorProfileStyle.card}>
        <View style={DirectorProfileStyle.profileContainer}>
          <View style={DirectorProfileStyle.avatar} />
          <Text style={DirectorProfileStyle.name}>James, Johnson</Text>
          <Text style={DirectorProfileStyle.info}>Director</Text>
          <Text style={DirectorProfileStyle.info}>College of Entrepreneurship</Text>
          <TouchableOpacity style={DirectorProfileStyle.button}>
            <MaterialIcons name="camera-alt" size={16} color="white" />
            <Text style={DirectorProfileStyle.buttonText}> Update Photo</Text>
          </TouchableOpacity>
        </View>
        <View style={DirectorProfileStyle.contactContainer}>
          <Text style={DirectorProfileStyle.contactTitle}>Contact</Text>
          <View style={DirectorProfileStyle.contactRow}>
            <MaterialIcons name="email" size={16} color="#555" />
            <Text style={DirectorProfileStyle.contactText}>jamesjhonson@sjddef.edu.ph</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={DirectorProfileStyle.logout} onPress={logout}><Text style={DirectorProfileStyle.buttonText}>Log-Out</Text></TouchableOpacity>
    </View>

  );
}