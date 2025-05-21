import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import StudentsProfileStyle from '../styles/Stud/StudentsProfileStyle';
import { useUser } from '../UserContext';
import { useNavigation } from '@react-navigation/native';

export default function StudentsProfile() {
  const { user } = useUser();
  const changeScreen = useNavigation();

  if (!user) {
    return (
      <View style={StudentsProfileStyle.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Back button handler
  const goBack = () => {
    changeScreen.goBack();
  };

  const goToSupportCenter = () => {
    changeScreen.navigate('SReq');
  };

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
        />
      </View>
      {/* Card */}
      <View style={StudentsProfileStyle.card}>
        <Text style={StudentsProfileStyle.name}>{user.firstname} {user.lastname} <Text style={StudentsProfileStyle.emoji}>🎓</Text></Text>
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
          <TouchableOpacity style={StudentsProfileStyle.actionBtn}>
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
      {/* Settings List */}
      <ScrollView style={StudentsProfileStyle.settingsList}>
        <TouchableOpacity style={StudentsProfileStyle.settingsItem}>
          <Text style={StudentsProfileStyle.settingsText}>Profile Settings</Text>
          <Feather name="chevron-right" size={20} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={StudentsProfileStyle.settingsItem}>
          <Text style={StudentsProfileStyle.settingsText}>Change Password</Text>
          <Feather name="chevron-right" size={20} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={StudentsProfileStyle.settingsItem}>
          <Text style={StudentsProfileStyle.settingsText}>Notification</Text>
          <Feather name="chevron-right" size={20} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={StudentsProfileStyle.settingsItem}>
          <Text style={StudentsProfileStyle.settingsText}>Transaction History</Text>
          <Feather name="chevron-right" size={20} color="#888" />
        </TouchableOpacity>
      </ScrollView>
      {/* Logout Button */}
      <TouchableOpacity style={StudentsProfileStyle.logout} onPress={() => changeScreen.navigate('Login')}>
        <Text style={StudentsProfileStyle.logoutText} >Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}