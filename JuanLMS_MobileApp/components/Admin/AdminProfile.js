import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import AdminProfileStyle from '../styles/administrator/AdminProfileStyle';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addAuditLog } from './auditTrailUtils';


export default function AdminProfile() {
  const { user } = useUser();
  const navigation = useNavigation();

  const logout = async () => {
    if (user) {
      await addAuditLog({
        userId: user._id,
        userName: user.firstname + ' ' + user.lastname,
        userRole: user.role || 'admin',
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
      <View style={AdminProfileStyle.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const goBack = () => navigation.goBack();

  const goToSupportCenter = () => {
    navigation.navigate('SupportCenter');
  }; 

  return (
    <View style={AdminProfileStyle.container}>
      {/* Back Button */}
      <TouchableOpacity style={{ position: 'absolute', top: 40, left: 20, zIndex: 10 }} onPress={goBack}>
        <MaterialIcons name="arrow-back" size={28} color="#fff" />
      </TouchableOpacity>
      {/* Top curved background */}
      <View style={AdminProfileStyle.topBackground} />
      {/* Profile Image */}
      <View style={AdminProfileStyle.avatarWrapper}>
        <Image
          source={user.profilePicture ? { uri: user.profilePicture } : require('../../assets/profile-icon (2).png')}
          style={AdminProfileStyle.avatar}
        />
      </View>
      {/* Card */}
      <View style={AdminProfileStyle.card}>
        <Text style={AdminProfileStyle.name}>{user.firstname} {user.lastname} <Text style={AdminProfileStyle.emoji}>🎓</Text></Text>
        <Text style={AdminProfileStyle.email}>{user.email}</Text>
        <View style={AdminProfileStyle.row}>
          <View style={AdminProfileStyle.infoBox}>
            <Text style={AdminProfileStyle.infoLabel}>College</Text>
            <Text style={AdminProfileStyle.infoValue}>{user.college || 'N/A'}</Text>
          </View>
          <View style={AdminProfileStyle.infoBox}>
            <Text style={AdminProfileStyle.infoLabel}>Role</Text>
            <Text style={AdminProfileStyle.infoValue}>Admin</Text>
          </View>
        </View>
        <View style={AdminProfileStyle.actionRow}>
          <TouchableOpacity style={AdminProfileStyle.actionBtn}>
            <Feather name="edit" size={20} color="#00418b" />
            <Text style={AdminProfileStyle.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={AdminProfileStyle.actionBtn}>
            <Feather name="lock" size={20} color="#00418b" />
            <Text style={AdminProfileStyle.actionText}>Password</Text>
          </TouchableOpacity>
          <TouchableOpacity style={AdminProfileStyle.actionBtn}>
            <Feather name="bell" size={20} color="#00418b" />
            <Text style={AdminProfileStyle.actionText}>Notify</Text>
          </TouchableOpacity>
          <TouchableOpacity style={AdminProfileStyle.actionBtn} onPress={goToSupportCenter}>
            <Feather name="help-circle" size={20} color="#00418b" />
            <Text style={AdminProfileStyle.actionText}>Support Center</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Settings List (optional) */}
      {/* <ScrollView style={AdminProfileStyle.settingsList}>
        <TouchableOpacity style={AdminProfileStyle.settingsItem}>
          <Text style={AdminProfileStyle.settingsText}>Profile Settings</Text>
          <Feather name="chevron-right" size={20} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={AdminProfileStyle.settingsItem}>
          <Text style={AdminProfileStyle.settingsText}>Change Password</Text>
          <Feather name="chevron-right" size={20} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={AdminProfileStyle.settingsItem}>
          <Text style={AdminProfileStyle.settingsText}>Notification</Text>
          <Feather name="chevron-right" size={20} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={AdminProfileStyle.settingsItem}>
          <Text style={AdminProfileStyle.settingsText}>Transaction History</Text>
          <Feather name="chevron-right" size={20} color="#888" />
        </TouchableOpacity>
      </ScrollView> */}
      {/* Logout Button */}
      <TouchableOpacity style={AdminProfileStyle.logout} onPress={logout}>
        <Text style={AdminProfileStyle.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}