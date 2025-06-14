import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Modal, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DirectorProfileStyle from '../styles/directors/DirectorProfileStyle.js';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addAuditLog } from '../Admin/auditTrailUtils';
import profileService from '../../services/profileService';
import { updateUser } from '../UserContext';

export default function DirectorProfile() {
  const { user } = useUser();
  const navigation = useNavigation();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const pickImage = () => {
    // Implementation of pickImage function
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      let profilePicPath = editedUser?.profilePic;
      if (editedUser?.newProfilePicAsset) {
        const data = await profileService.uploadProfilePicture(user._id, editedUser.newProfilePicAsset);
        if (data.success && data.profilePic) {
          profilePicPath = data.profilePic;
        }
      }
      await updateUser({
        ...user,
        profilePic: profilePicPath,
        profilePicture: profilePicPath,
      });
      setIsEditModalVisible(false);
      Alert.alert('Profile Updated', 'Your profile picture has been changed successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
          source={user.profilePic ? { uri: API_URL + user.profilePic } : require('../../assets/profile-icon (2).png')}
          style={DirectorProfileStyle.avatar}
        />
        <TouchableOpacity onPress={() => setIsEditModalVisible(true)} style={DirectorProfileStyle.editAvatarBtn}>
          <Feather name="edit" size={20} color="#00418b" />
        </TouchableOpacity>
      </View>
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={DirectorProfileStyle.modalContainer}>
          <View style={DirectorProfileStyle.modalContent}>
            <Text style={DirectorProfileStyle.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={pickImage} style={DirectorProfileStyle.imagePicker}>
              <Image
                source={editedUser?.newProfilePicAsset
                  ? { uri: editedUser.newProfilePicAsset.uri }
                  : editedUser?.profilePic
                    ? { uri: API_URL + editedUser.profilePic }
                    : require('../../assets/profile-icon (2).png')}
                style={DirectorProfileStyle.avatar}
              />
              <Text style={DirectorProfileStyle.imagePickerText}>change photo</Text>
            </TouchableOpacity>
            <View style={DirectorProfileStyle.modalButtons}>
              <TouchableOpacity 
                style={[DirectorProfileStyle.modalButton, DirectorProfileStyle.cancelButton]} 
                onPress={() => setIsEditModalVisible(false)}
                disabled={isLoading}
              >
                <Text style={DirectorProfileStyle.buttonText}>cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[DirectorProfileStyle.modalButton, DirectorProfileStyle.saveButton]} 
                onPress={handleSaveProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#00418b" />
                ) : (
                  <Text style={DirectorProfileStyle.buttonText}>save changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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