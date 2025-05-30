import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import FacultyProfileStyle from '../styles/faculty/FacultyProfileStyle';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addAuditLog } from '../Admin/auditTrailUtils';

export default function FacultyProfile() {
  const { user } = useUser();
  const navigation = useNavigation();

  const logout = async () => {
    if (user) {
      await addAuditLog({
        userId: user._id,
        userName: user.firstname + ' ' + user.lastname,
        userRole: user.role || 'faculty',
        action: 'Logout',
        details: `User ${user.email} logged out.`,
        timestamp: new Date().toISOString(),
      });
    }
    await AsyncStorage.removeItem('user');
    navigation.navigate('Login');
  };

  const goToSupportCenter = () => {
    navigation.navigate('FMain');
  };

  if (!user) {
    return (
      <View style={FacultyProfileStyle.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Back button handler (optional, if you want to add it)
  const goBack = () => navigation.goBack();

  return (
    <View style={FacultyProfileStyle.container}>
      {/* Back Button */}
      <TouchableOpacity style={{ position: 'absolute', top: 40, left: 20, zIndex: 10 }} onPress={goBack}>
        <MaterialIcons name="arrow-back" size={28} color="#fff" />
      </TouchableOpacity>
      {/* Top curved background */}
      <View style={FacultyProfileStyle.topBackground} />
      {/* Profile Image */}
      <View style={FacultyProfileStyle.avatarWrapper}>
        <Image
          source={user.profilePicture ? { uri: user.profilePicture } : require('../../assets/profile-icon (2).png')}
          style={FacultyProfileStyle.avatar}
        />
      </View>
      {/* Card */}
      <View style={FacultyProfileStyle.card}>
        <Text style={FacultyProfileStyle.name}>{user.firstname} {user.lastname} <Text style={FacultyProfileStyle.emoji}>🎓</Text></Text>
        <Text style={FacultyProfileStyle.email}>{user.email}</Text>
        <View style={FacultyProfileStyle.row}>
          <View style={FacultyProfileStyle.infoBox}>
            <Text style={FacultyProfileStyle.infoLabel}>College</Text>
            <Text style={FacultyProfileStyle.infoValue}>{user.college || 'N/A'}</Text>
          </View>
          <View style={FacultyProfileStyle.infoBox}>
            <Text style={FacultyProfileStyle.infoLabel}>Role</Text>
            <Text style={FacultyProfileStyle.infoValue}>Faculty</Text>
          </View>
        </View>
        <View style={FacultyProfileStyle.actionRow}>
          <TouchableOpacity style={FacultyProfileStyle.actionBtn}>
            <Feather name="edit" size={20} color="#00418b" />
            <Text style={FacultyProfileStyle.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={FacultyProfileStyle.actionBtn}>
            <Feather name="lock" size={20} color="#00418b" />
            <Text style={FacultyProfileStyle.actionText}>Password</Text>
          </TouchableOpacity>
          <TouchableOpacity style={FacultyProfileStyle.actionBtn}>
            <Feather name="bell" size={20} color="#00418b" />
            <Text style={FacultyProfileStyle.actionText}>Notify</Text>
          </TouchableOpacity>
          <TouchableOpacity style={FacultyProfileStyle.actionBtn} onPress={goToSupportCenter}>
            <Feather name="help-circle" size={20} color="#00418b" />
            <Text style={FacultyProfileStyle.actionText}>Support Center</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Settings List (optional, can be added if you want) */}
      {/* <ScrollView style={FacultyProfileStyle.settingsList}>
        <TouchableOpacity style={FacultyProfileStyle.settingsItem}>
          <Text style={FacultyProfileStyle.settingsText}>Profile Settings</Text>
          <Feather name="chevron-right" size={20} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={FacultyProfileStyle.settingsItem}>
          <Text style={FacultyProfileStyle.settingsText}>Change Password</Text>
          <Feather name="chevron-right" size={20} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={FacultyProfileStyle.settingsItem}>
          <Text style={FacultyProfileStyle.settingsText}>Notification</Text>
          <Feather name="chevron-right" size={20} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={FacultyProfileStyle.settingsItem}>
          <Text style={FacultyProfileStyle.settingsText}>Transaction History</Text>
          <Feather name="chevron-right" size={20} color="#888" />
        </TouchableOpacity>
      </ScrollView> */}
      {/* Logout Button */}
      <TouchableOpacity style={FacultyProfileStyle.logout} onPress={logout}>
        <Text style={FacultyProfileStyle.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}