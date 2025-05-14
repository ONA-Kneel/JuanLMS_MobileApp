import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AdminProfileStyle from '../styles/administrator/AdminProfileStyle';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminProfile() {
  const { user } = useUser();
  const changeScreen = useNavigation();

  const logout = async () => {
    await AsyncStorage.removeItem('user');
    changeScreen.navigate('Login');
  };

  if (!user) {
    return (
      <View style={AdminProfileStyle.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={AdminProfileStyle.container}>
      <View style={AdminProfileStyle.card}>
        <View style={AdminProfileStyle.profileContainer}>
          {user.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={AdminProfileStyle.avatar} />
          ) : (
            <View style={AdminProfileStyle.avatar} />
          )}
          <Text style={AdminProfileStyle.name}>{`${user.lastname}, ${user.firstname}`}</Text>
          <Text style={AdminProfileStyle.info}>Admin</Text>
          <Text style={AdminProfileStyle.info}>{user.college || 'College'}</Text>
          <TouchableOpacity style={AdminProfileStyle.button}>
            <MaterialIcons name="camera-alt" size={16} color="white" />
            <Text style={AdminProfileStyle.buttonText}> Update Photo</Text>
          </TouchableOpacity>
        </View>
        <View style={AdminProfileStyle.contactContainer}>
          <Text style={AdminProfileStyle.contactTitle}>Contact</Text>
          <View style={AdminProfileStyle.contactRow}>
            <MaterialIcons name="email" size={16} color="#555" />
            <Text style={AdminProfileStyle.contactText}>{user.email}</Text>
          </View>
          <View style={AdminProfileStyle.contactRow}>
            <MaterialIcons name="phone" size={16} color="#555" />
            <Text style={AdminProfileStyle.contactText}>{user.contactno}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={AdminProfileStyle.logout} onPress={logout}>
        <Text style={AdminProfileStyle.buttonText}>Log-Out</Text>
      </TouchableOpacity>
    </View>
  );
}