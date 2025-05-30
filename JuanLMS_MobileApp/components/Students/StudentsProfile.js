import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import StudentsProfileStyle from '../styles/Stud/StudentsProfileStyle';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StudentsProfile() {
  const { user, loading } = useUser();
  const navigation = useNavigation();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const goToSupportCenter = () => {
    navigation.navigate('SupportCenter');
  };

  if (loading) {
    return (
      <View style={[StudentsProfileStyle.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={{ marginTop: 10, fontSize: 16, color: '#666' }}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[StudentsProfileStyle.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 16, color: '#666' }}>No user data found. Please login again.</Text>
        <TouchableOpacity 
          style={[StudentsProfileStyle.logout, { marginTop: 20 }]} 
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={StudentsProfileStyle.logoutText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const goBack = () => navigation.goBack();

  return (
    <View style={StudentsProfileStyle.container}>
      {/* Back Button */}
      <TouchableOpacity style={{ position: 'absolute', top: 40, left: 20, zIndex: 10 }} onPress={goBack}>
        <MaterialIcons name="arrow-back" size={28} color="#fff" />
      </TouchableOpacity>
      {/* Top curved background */}
      <View style={StudentsProfileStyle.topBackground} />
      {/* Profile Image */}
      <View style={StudentsProfileStyle.avatarWrapper}>
        <Image
          source={user.profilePicture ? { uri: user.profilePicture } : require('../../assets/profile-icon (2).png')}
          style={StudentsProfileStyle.avatar}
          onError={(e) => {
            console.log('Image loading error:', e.nativeEvent.error);
            Alert.alert('Error', 'Failed to load profile picture');
          }}
        />
      </View>
      {/* Card */}
      <View style={StudentsProfileStyle.card}>
        <Text style={StudentsProfileStyle.name}>{user.firstname} {user.lastname} <Text style={StudentsProfileStyle.emoji}>👨‍🎓</Text></Text>
        <Text style={StudentsProfileStyle.email}>{user.email}</Text>
        <View style={StudentsProfileStyle.row}>
          <View style={StudentsProfileStyle.infoBox}>
            <Text style={StudentsProfileStyle.infoLabel}>College</Text>
            <Text style={StudentsProfileStyle.infoValue}>{user.college || 'N/A'}</Text>
          </View>
          <View style={StudentsProfileStyle.infoBox}>
            <Text style={StudentsProfileStyle.infoLabel}>Role</Text>
            <Text style={StudentsProfileStyle.infoValue}>Student</Text>
          </View>
        </View>
        <View style={StudentsProfileStyle.actionRow}>
          <TouchableOpacity 
            style={StudentsProfileStyle.actionBtn}
            onPress={() => setIsEditModalVisible(true)}
          >
            <Feather name="edit" size={20} color="#00418b" />
            <Text style={StudentsProfileStyle.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={StudentsProfileStyle.actionBtn}>
            <Feather name="lock" size={20} color="#00418b" />
            <Text style={StudentsProfileStyle.actionText}>Password</Text>
          </TouchableOpacity>
          <TouchableOpacity style={StudentsProfileStyle.actionBtn}>
            <Feather name="bell" size={20} color="#00418b" />
            <Text style={StudentsProfileStyle.actionText}>Notify</Text>
          </TouchableOpacity>
          <TouchableOpacity style={StudentsProfileStyle.actionBtn} onPress={goToSupportCenter}>
            <Feather name="help-circle" size={20} color="#00418b" />
            <Text style={StudentsProfileStyle.actionText}>Support Center</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Logout Button */}
      <TouchableOpacity style={StudentsProfileStyle.logout} onPress={logout}>
        <Text style={StudentsProfileStyle.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}