import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ParentProfileStyle from '../styles/parent/ParentProfileStyle';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addAuditLog } from '../Admin/auditTrailUtils';

export default function ParentProfile() {
  const { user } = useUser();
  const navigation = useNavigation();

  const logout = async () => {
    if (user) {
      await addAuditLog({
        userId: user._id,
        userName: user.firstname + ' ' + user.lastname,
        userRole: user.role || 'parent',
        action: 'Logout',
        details: `User ${user.email} logged out.`,
        timestamp: new Date().toISOString(),
      });
    }
    await AsyncStorage.removeItem('user');
    navigation.navigate('Login');
  };

  if (!user) {
    return (
      <View style={ParentProfileStyle.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const goBack = () => navigation.goBack();

  return (
    <View style={ParentProfileStyle.container}>
      {/* Back Button */}
      <TouchableOpacity style={{ position: 'absolute', top: 40, left: 20, zIndex: 10 }} onPress={goBack}>
        <MaterialIcons name="arrow-back" size={28} color="#fff" />
      </TouchableOpacity>
      {/* Top curved background */}
      <View style={ParentProfileStyle.topBackground} />
      {/* Profile Image */}
      <View style={ParentProfileStyle.avatarWrapper}>
        <Image
          source={user.profilePicture ? { uri: user.profilePicture } : require('../../assets/profile-icon (2).png')}
          style={ParentProfileStyle.avatar}
        />
      </View>
      {/* Card */}
      <View style={ParentProfileStyle.card}>
        <Text style={ParentProfileStyle.name}>{user.firstname} {user.lastname} <Text style={ParentProfileStyle.emoji}>🎓</Text></Text>
        <Text style={ParentProfileStyle.email}>{user.email}</Text>
        <View style={ParentProfileStyle.row}>
          <View style={ParentProfileStyle.infoBox}>
            <Text style={ParentProfileStyle.infoLabel}>College</Text>
            <Text style={ParentProfileStyle.infoValue}>{user.college || `Parent of Student: ${user.childName || ''}`}</Text>
          </View>
          <View style={ParentProfileStyle.infoBox}>
            <Text style={ParentProfileStyle.infoLabel}>Role</Text>
            <Text style={ParentProfileStyle.infoValue}>Parent</Text>
          </View>
        </View>
        <View style={ParentProfileStyle.actionRow}>
          <TouchableOpacity style={ParentProfileStyle.actionBtn}>
            <Feather name="edit" size={20} color="#00418b" />
            <Text style={ParentProfileStyle.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ParentProfileStyle.actionBtn}>
            <Feather name="lock" size={20} color="#00418b" />
            <Text style={ParentProfileStyle.actionText}>Password</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ParentProfileStyle.actionBtn}>
            <Feather name="bell" size={20} color="#00418b" />
            <Text style={ParentProfileStyle.actionText}>Notify</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Settings List (optional) */}
      {/* <ScrollView style={ParentProfileStyle.settingsList}>
        <TouchableOpacity style={ParentProfileStyle.settingsItem}>
          <Text style={ParentProfileStyle.settingsText}>Profile Settings</Text>
          <Feather name="chevron-right" size={20} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={ParentProfileStyle.settingsItem}>
          <Text style={ParentProfileStyle.settingsText}>Change Password</Text>
          <Feather name="chevron-right" size={20} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={ParentProfileStyle.settingsItem}>
          <Text style={ParentProfileStyle.settingsText}>Notification</Text>
          <Feather name="chevron-right" size={20} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={ParentProfileStyle.settingsItem}>
          <Text style={ParentProfileStyle.settingsText}>Transaction History</Text>
          <Feather name="chevron-right" size={20} color="#888" />
        </TouchableOpacity>
      </ScrollView> */}
      {/* Logout Button */}
      <TouchableOpacity style={ParentProfileStyle.logout} onPress={logout}>
        <Text style={ParentProfileStyle.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}