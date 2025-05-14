import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ParentProfileStyle from '../styles/parent/ParentProfileStyle';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ParentProfile() {
  const { user } = useUser();
  const changeScreen = useNavigation();

  const logout = async () => {
    await AsyncStorage.removeItem('user');
    changeScreen.navigate('Login');
  };

  if (!user) {
    return (
      <View style={ParentProfileStyle.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={ParentProfileStyle.container}>
      <View style={ParentProfileStyle.card}>
        <View style={ParentProfileStyle.profileContainer}>
          {user.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={ParentProfileStyle.avatar} />
          ) : (
            <View style={ParentProfileStyle.avatar} />
          )}
          <Text style={ParentProfileStyle.name}>{`${user.lastname}, ${user.firstname}`}</Text>
          <Text style={ParentProfileStyle.info}>Parent</Text>
          <Text style={ParentProfileStyle.info}>{user.college || `Parent of Student: ${user.childName || ''}`}</Text>
          <TouchableOpacity style={ParentProfileStyle.button}>
            <MaterialIcons name="camera-alt" size={16} color="white" />
            <Text style={ParentProfileStyle.buttonText}> Update Photo</Text>
          </TouchableOpacity>
        </View>
        <View style={ParentProfileStyle.contactContainer}>
          <Text style={ParentProfileStyle.contactTitle}>Contact</Text>
          <View style={ParentProfileStyle.contactRow}>
            <MaterialIcons name="email" size={16} color="#555" />
            <Text style={ParentProfileStyle.contactText}>{user.email}</Text>
          </View>
          <View style={ParentProfileStyle.contactRow}>
            <MaterialIcons name="phone" size={16} color="#555" />
            <Text style={ParentProfileStyle.contactText}>{user.contactno}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={ParentProfileStyle.logout} onPress={logout}>
        <Text style={ParentProfileStyle.buttonText}>Log-Out</Text>
      </TouchableOpacity>
    </View>
  );
}