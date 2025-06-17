import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Modal, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ParentProfileStyle from '../styles/parent/ParentProfileStyle';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addAuditLog } from '../Admin/auditTrailUtils';
import profileService from '../../services/profileService';
import { updateUser } from '../UserContext';

export default function ParentProfile() {
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
          source={user.profilePic ? { uri: API_URL + user.profilePic } : require('../../assets/profile-icon (2).png')}
          style={ParentProfileStyle.avatar}
          resizeMode="cover"
        />
        <TouchableOpacity onPress={() => setIsEditModalVisible(true)} style={ParentProfileStyle.editAvatarBtn}>
          <Feather name="edit" size={20} color="#00418b" />
        </TouchableOpacity>
      </View>
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={ParentProfileStyle.modalContainer}>
          <View style={ParentProfileStyle.modalContent}>
            <Text style={ParentProfileStyle.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={pickImage} style={ParentProfileStyle.imagePicker}>
              <Image
                source={editedUser?.newProfilePicAsset
                  ? { uri: editedUser.newProfilePicAsset.uri }
                  : editedUser?.profilePic
                    ? { uri: API_URL + editedUser.profilePic }
                    : require('../../assets/profile-icon (2).png')}
                style={ParentProfileStyle.avatar}
                resizeMode="cover"
              />
              <Text style={ParentProfileStyle.imagePickerText}>change photo</Text>
            </TouchableOpacity>
            <View style={ParentProfileStyle.modalButtons}>
              <TouchableOpacity 
                style={[ParentProfileStyle.modalButton, ParentProfileStyle.cancelButton]} 
                onPress={() => setIsEditModalVisible(false)}
                disabled={isLoading}
              >
                <Text style={ParentProfileStyle.buttonText}>cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[ParentProfileStyle.modalButton, ParentProfileStyle.saveButton]} 
                onPress={handleSaveProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#00418b" />
                ) : (
                  <Text style={ParentProfileStyle.buttonText}>save changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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