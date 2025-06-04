import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DirectorProfileStyle from '../styles/directors/DirectorProfileStyle.js';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addAuditLog } from '../Admin/auditTrailUtils';

export default function DirectorProfile() {
  const { user } = useUser();
  const navigation = useNavigation();

  const logout = async () => {
    if (user) {
      await addAuditLog({
        userId: user._id,
        userName: user.firstname + ' ' + user.lastname,
        userRole: user.role || 'director',
        action: 'Logout',
        details: `User ${user.email} logged out.`,
        timestamp: new Date().toISOString(),
      });
    }
    await AsyncStorage.removeItem('user');
    navigation.navigate('Login');
  };
  const goToSupportCenter = () => {
    navigation.navigate('DSupCent');
  };

  if (!user) {
    return (
      <View style={DirectorProfileStyle.container}>
        <Text>Loading...</Text>
      </View>
    );
  }
  const goBack = () => navigation.goBack();

  return (
    <View style={DirectorProfileStyle.container}>
      {/* Back Button */}
      <TouchableOpacity style={{ position: 'absolute', top: 40, left: 20, zIndex: 10 }} onPress={goBack}>
        <MaterialIcons name="arrow-back" size={28} color="#fff" />
      </TouchableOpacity>
      {/* Top curved background */}
      <View style={DirectorProfileStyle.topBackground} />
      {/* Profile Image */}
      <View style={DirectorProfileStyle.avatarWrapper}>
        <Image
          source={user.profilePicture ? { uri: user.profilePicture } : require('../../assets/profile-icon (2).png')}
          style={DirectorProfileStyle.avatar}
        />
      </View>
      {/* Card */}
      <View style={DirectorProfileStyle.card}>
        <Text style={DirectorProfileStyle.name}>{user.firstname} {user.lastname} <Text style={DirectorProfileStyle.emoji}>🎓</Text></Text>
        <Text style={DirectorProfileStyle.email}>{user.email}</Text>
        <View style={DirectorProfileStyle.row}>
          <View style={DirectorProfileStyle.infoBox}>
            <Text style={DirectorProfileStyle.infoLabel}>College</Text>
            <Text style={DirectorProfileStyle.infoValue}>{user.college || 'N/A'}</Text>
          </View>
          <View style={DirectorProfileStyle.infoBox}>
            <Text style={DirectorProfileStyle.infoLabel}>Role</Text>
            <Text style={DirectorProfileStyle.infoValue}>Director</Text>
          </View>
        </View>
        <View style={DirectorProfileStyle.actionRow}>
          <TouchableOpacity style={DirectorProfileStyle.actionBtn}>
            <Feather name="edit" size={20} color="#00418b" />
            <Text style={DirectorProfileStyle.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={DirectorProfileStyle.actionBtn}>
            <Feather name="lock" size={20} color="#00418b" />
            <Text style={DirectorProfileStyle.actionText}>Password</Text>
          </TouchableOpacity>
          <TouchableOpacity style={DirectorProfileStyle.actionBtn}>
            <Feather name="bell" size={20} color="#00418b" />
            <Text style={DirectorProfileStyle.actionText}>Notify</Text>
          </TouchableOpacity>
          <TouchableOpacity style={DirectorProfileStyle.actionBtn} onPress={goToSupportCenter}>
            <Feather name="help-circle" size={20} color="#00418b" />
            <Text style={DirectorProfileStyle.actionText}>Support Center</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Settings List (optional) */}
      {/* <ScrollView style={DirectorProfileStyle.settingsList}>
        <TouchableOpacity style={DirectorProfileStyle.settingsItem}>
          <Text style={DirectorProfileStyle.settingsText}>Profile Settings</Text>
          <Feather name="chevron-right" size={20} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={DirectorProfileStyle.settingsItem}>
          <Text style={DirectorProfileStyle.settingsText}>Change Password</Text>
          <Feather name="chevron-right" size={20} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={DirectorProfileStyle.settingsItem}>
          <Text style={DirectorProfileStyle.settingsText}>Notification</Text>
          <Feather name="chevron-right" size={20} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={DirectorProfileStyle.settingsItem}>
          <Text style={DirectorProfileStyle.settingsText}>Transaction History</Text>
          <Feather name="chevron-right" size={20} color="#888" />
        </TouchableOpacity>
      </ScrollView> */}
      {/* Logout Button */}
      <TouchableOpacity style={DirectorProfileStyle.logout} onPress={logout}>
        <Text style={DirectorProfileStyle.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}