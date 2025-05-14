import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import FacultyProfileStyle from '../styles/faculty/FacultyProfileStyle';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FacultyProfile() {
  const { user } = useUser();
  const changeScreen = useNavigation();

  const logout = async () => {
    await AsyncStorage.removeItem('user');
    changeScreen.navigate('Login');
  };

  const helpCenter = () => {
    changeScreen.navigate('FMain');
  };

  if (!user) {
    return (
      <View style={FacultyProfileStyle.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={FacultyProfileStyle.container}>
      <View style={FacultyProfileStyle.card}>
        <View style={FacultyProfileStyle.profileContainer}>
          {user.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={FacultyProfileStyle.avatar} />
          ) : (
            <View style={FacultyProfileStyle.avatar} />
          )}
          <Text style={FacultyProfileStyle.name}>{`${user.lastname}, ${user.firstname}`}</Text>
          <Text style={FacultyProfileStyle.info}>Faculty</Text>
          <Text style={FacultyProfileStyle.info}>{user.college || 'College'}</Text>
          <TouchableOpacity style={FacultyProfileStyle.button}>
            <MaterialIcons name="camera-alt" size={16} color="white" />
            <Text style={FacultyProfileStyle.buttonText}> Update Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={helpCenter} style={FacultyProfileStyle.button}>
            <MaterialIcons name="help" size={16} color="white" />
            <Text style={FacultyProfileStyle.buttonText}>Support Center</Text>
          </TouchableOpacity>
        </View>
        <View style={FacultyProfileStyle.contactContainer}>
          <Text style={FacultyProfileStyle.contactTitle}>Contact</Text>
          <View style={FacultyProfileStyle.contactRow}>
            <MaterialIcons name="email" size={16} color="#555" />
            <Text style={FacultyProfileStyle.contactText}>{user.email}</Text>
          </View>
          <View style={FacultyProfileStyle.contactRow}>
            <MaterialIcons name="phone" size={16} color="#555" />
            <Text style={FacultyProfileStyle.contactText}>{user.contactno}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={FacultyProfileStyle.logout} onPress={logout}>
        <Text style={FacultyProfileStyle.buttonText}>Log-Out</Text>
      </TouchableOpacity>
    </View>
  );
}