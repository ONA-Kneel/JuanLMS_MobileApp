import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DirectorProfileStyle from '../styles/directors/DirectorProfileStyle.js';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DirectorProfile() {
  const { user } = useUser();
  const changeScreen = useNavigation();

  const logout = async () => {
    await AsyncStorage.removeItem('user');
    changeScreen.navigate('Login');
  };
  const helpCenter = () => {
    changeScreen.navigate('DScMain');
  };

  if (!user) {
    return (
      <View style={DirectorProfileStyle.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={DirectorProfileStyle.container}>
      <View style={DirectorProfileStyle.card}>
        <View style={DirectorProfileStyle.profileContainer}>
          {user.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={DirectorProfileStyle.avatar} />
          ) : (
            <View style={DirectorProfileStyle.avatar} />
          )}
          <Text style={DirectorProfileStyle.name}>{`${user.lastname}, ${user.firstname}`}</Text>
          <Text style={DirectorProfileStyle.info}>Director</Text>
          <Text style={DirectorProfileStyle.info}>{user.college || 'College'}</Text>
          <TouchableOpacity style={DirectorProfileStyle.button}>
            <MaterialIcons name="camera-alt" size={16} color="white" />
            <Text style={DirectorProfileStyle.buttonText}> Update Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={helpCenter} style={DirectorProfileStyle.button}>
            <MaterialIcons name="help" size={16} color="white" />
            <Text style={DirectorProfileStyle.buttonText}>Support Center</Text>
          </TouchableOpacity>
        </View>
        <View style={DirectorProfileStyle.contactContainer}>
          <Text style={DirectorProfileStyle.contactTitle}>Contact</Text>
          <View style={DirectorProfileStyle.contactRow}>
            <MaterialIcons name="email" size={16} color="#555" />
            <Text style={DirectorProfileStyle.contactText}>{user.email}</Text>
          </View>
          <View style={DirectorProfileStyle.contactRow}>
            <MaterialIcons name="phone" size={16} color="#555" />
            <Text style={DirectorProfileStyle.contactText}>{user.contactno}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={DirectorProfileStyle.logout} onPress={logout}>
        <Text style={DirectorProfileStyle.buttonText}>Log-Out</Text>
      </TouchableOpacity>
    </View>
  );
}