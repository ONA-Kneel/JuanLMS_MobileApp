import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Modal, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import FacultyProfileStyle from '../styles/faculty/FacultyProfileStyle';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addAuditLog } from '../Admin/auditTrailUtils';
import profileService from '../../services/profileService';
import { updateUser } from '../UserContext';
import * as ImagePicker from 'expo-image-picker';

export default function FacultyProfile() {
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
    navigation.navigate('FReq');
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

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'Permission to access camera roll is required!');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setEditedUser(prev => ({
        ...prev,
        newProfilePicAsset: result.assets[0],
      }));
    }
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
          source={user.profilePic ? { uri: API_URL + user.profilePic } : require('../../assets/profile-icon (2).png')}
          style={FacultyProfileStyle.avatar}
          resizeMode="cover"
        />
        <TouchableOpacity onPress={() => setIsEditModalVisible(true)} style={FacultyProfileStyle.editAvatarBtn}>
          <Feather name="edit" size={20} color="#00418b" />
        </TouchableOpacity>
      </View>
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={FacultyProfileStyle.modalContainer}>
          <View style={FacultyProfileStyle.modalContent}>
            <Text style={FacultyProfileStyle.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={pickImage} style={FacultyProfileStyle.imagePicker}>
              <Image
                source={editedUser?.newProfilePicAsset
                  ? { uri: editedUser.newProfilePicAsset.uri }
                  : editedUser?.profilePic
                    ? { uri: API_URL + editedUser.profilePic }
                    : require('../../assets/profile-icon (2).png')}
                style={FacultyProfileStyle.avatar}
                resizeMode="cover"
              />
              <Text style={FacultyProfileStyle.imagePickerText}>change photo</Text>
            </TouchableOpacity>
            <View style={FacultyProfileStyle.modalButtons}>
              <TouchableOpacity 
                style={[FacultyProfileStyle.modalButton, FacultyProfileStyle.cancelButton]} 
                onPress={() => setIsEditModalVisible(false)}
                disabled={isLoading}
              >
                <Text style={FacultyProfileStyle.buttonText}>cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[FacultyProfileStyle.modalButton, FacultyProfileStyle.saveButton]} 
                onPress={handleSaveProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#00418b" />
                ) : (
                  <Text style={FacultyProfileStyle.buttonText}>save changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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