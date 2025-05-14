import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import StudentsProfileStyle from '../styles/Stud/StudentsProfileStyle';
import { useUser } from '../UserContext';

export default function StudentsProfile() {
  const { user } = useUser();
  const changeScreen = useNavigation();

  const logout = async () => {
    await AsyncStorage.removeItem('user');
    changeScreen.navigate('Login');
  };

  const helpCenter = () => {
    changeScreen.navigate('SMain');
  };

  if (!user) {
    return (
      <View style={StudentsProfileStyle.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={StudentsProfileStyle.container}>
      <View style={StudentsProfileStyle.card}>
        <View style={StudentsProfileStyle.profileContainer}>
          {/* Profile Picture */}
          {user.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={StudentsProfileStyle.avatar} />
          ) : (
            <View style={StudentsProfileStyle.avatar} />
          )}
          <Text style={StudentsProfileStyle.name}>{`${user.lastname}, ${user.firstname}`}</Text>
          <Text style={StudentsProfileStyle.info}>Student</Text>
          <Text style={StudentsProfileStyle.info}>{user.college || 'College'}</Text>
          <TouchableOpacity style={StudentsProfileStyle.button}>
            <MaterialIcons name="camera-alt" size={16} color="white" />
            <Text style={StudentsProfileStyle.buttonText}> Update Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={helpCenter} style={StudentsProfileStyle.button}>
            <MaterialIcons name="help" size={16} color="white" />
            <Text style={StudentsProfileStyle.buttonText}>Support Center</Text>
          </TouchableOpacity>
        </View>
        <View style={StudentsProfileStyle.contactContainer}>
          <Text style={StudentsProfileStyle.contactTitle}>Contact</Text>
          <View style={StudentsProfileStyle.contactRow}>
            <MaterialIcons name="email" size={16} color="#555" />
            <Text style={StudentsProfileStyle.contactText}>{user.email}</Text>
          </View>
          <View style={StudentsProfileStyle.contactRow}>
            <MaterialIcons name="phone" size={16} color="#555" />
            <Text style={StudentsProfileStyle.contactText}>{user.contactno}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={StudentsProfileStyle.logout} onPress={logout}>
        <Text style={StudentsProfileStyle.buttonText}>Log-Out</Text>
      </TouchableOpacity>
    </View>
  );
}