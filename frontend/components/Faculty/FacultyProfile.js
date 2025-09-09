import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Modal, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import FacultyProfileStyle from '../styles/faculty/FacultyProfileStyle';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import ConfirmLogoutModal from '../Shared/ConfirmLogoutModal';
import { useNotifications } from '../../NotificationContext';
import { useAnnouncements } from '../../AnnouncementContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addAuditLog } from '../Admin/auditTrailUtils';
import profileService from '../../services/profileService';
import { updateUser } from '../UserContext';
import * as ImagePicker from 'expo-image-picker';
import NotificationCenter from '../NotificationCenter';
import PasswordChangeModal from '../Shared/PasswordChangeModal';

const API_URL = 'https://juanlms-webapp-server.onrender.com';

const buildImageUri = (pathOrUrl) => {
  if (!pathOrUrl) return null;
  if (typeof pathOrUrl === 'string' && (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://'))) {
    return pathOrUrl;
  }
  const relative = typeof pathOrUrl === 'string' && pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return API_URL + relative;
};

export default function FacultyProfile() {
  const { user, updateUser } = useUser();
  const navigation = useNavigation();
  const { unreadCount } = useNotifications();
  const { announcements } = useAnnouncements();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const logout = () => setShowLogoutConfirm(true);
  const handleConfirmLogout = async () => {
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
    const remember = await AsyncStorage.getItem('rememberMeEnabled');
    if (remember !== 'true') {
      await AsyncStorage.removeItem('savedEmail');
      await AsyncStorage.removeItem('savedPassword');
    }
    setShowLogoutConfirm(false);
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
        const data = await profileService.uploadProfilePicture(user._id, editedUser.newProfilePicAsset, false);
        const updated = data?.user;
        if (updated?.profilePic) {
          profilePicPath = updated.profilePic;
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
      {/* Profile Image / Initials */}
      <View style={FacultyProfileStyle.avatarWrapper}>
        {user.profilePic ? (
          <Image
            source={{ uri: buildImageUri(user.profilePic) }}
            style={FacultyProfileStyle.avatar}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: FacultyProfileStyle.avatar?.width || 100,
              height: FacultyProfileStyle.avatar?.height || 100,
              borderRadius: (FacultyProfileStyle.avatar?.width || 100) / 2,
              backgroundColor: '#e3f2fd',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#00418b' }}>
              {(user.firstname?.[0] || '').toUpperCase()}{(user.lastname?.[0] || '').toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={FacultyProfileStyle.modalContainer}>
          <View style={FacultyProfileStyle.modalContent}>
            <Text style={[FacultyProfileStyle.modalTitle, { fontFamily: 'Poppins-Bold' }]}>Edit Profile</Text>
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
              <Text style={[FacultyProfileStyle.imagePickerText, { fontFamily: 'Poppins-Regular' }]}>change photo</Text>
            </TouchableOpacity>
            <View style={FacultyProfileStyle.modalButtons}>
              <TouchableOpacity 
                style={[FacultyProfileStyle.modalButton, FacultyProfileStyle.cancelButton]} 
                onPress={() => setIsEditModalVisible(false)}
                disabled={isLoading}
              >
                <Text style={[FacultyProfileStyle.buttonText, { fontFamily: 'Poppins-Regular' }]}>cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[FacultyProfileStyle.modalButton, FacultyProfileStyle.saveButton]} 
                onPress={handleSaveProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#00418b" />
                ) : (
                  <Text style={[FacultyProfileStyle.buttonText, { fontFamily: 'Poppins-Regular' }]}>save changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Card */}
      <View style={FacultyProfileStyle.card}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }} onPress={pickImage}>
          <Feather name="edit" size={15} color="#00418b" style={{ marginRight: 6 }} />
          <Text style={[FacultyProfileStyle.actionText, { fontFamily: 'Poppins-Regular' }]}>Change Photo</Text>
        </TouchableOpacity>
        <Text style={[FacultyProfileStyle.name, { fontFamily: 'Poppins-Bold' }]}>
          {user.firstname} {user.lastname} <Text style={FacultyProfileStyle.emoji}>🎓</Text>
        </Text>
        <Text style={[FacultyProfileStyle.email, { fontFamily: 'Poppins-Regular' }]}>{user.email}</Text>
        <View style={FacultyProfileStyle.row}>
          <View style={[FacultyProfileStyle.infoBox, { flex: 0, width: 'auto' }]}>
            <Text style={[FacultyProfileStyle.infoLabel, { fontFamily: 'Poppins-Regular' }]}>Role</Text>
            <Text style={[FacultyProfileStyle.infoValue, { fontFamily: 'Poppins-SemiBold' }]}>Faculty</Text>
          </View>
        </View>
        <View style={FacultyProfileStyle.actionRow}>
          {/* <TouchableOpacity style={FacultyProfileStyle.actionBtn}>
            <Feather name="edit" size={20} color="#00418b" />
            <Text style={FacultyProfileStyle.actionText}>Edit</Text>
          </TouchableOpacity> */}
          <TouchableOpacity style={FacultyProfileStyle.actionBtn} onPress={() => setShowPasswordModal(true)}>
            <Feather name="lock" size={20} color="#00418b" />
            <Text style={[FacultyProfileStyle.actionText, { fontFamily: 'Poppins-Regular' }]}>Password</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={FacultyProfileStyle.actionBtn}
            onPress={() => setShowNotificationCenter(true)}
          >
            <Feather name="bell" size={20} color="#00418b" />
            <Text style={[FacultyProfileStyle.actionText, { fontFamily: 'Poppins-Regular' }]}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={{
                position: 'absolute',
                top: -5,
                right: -5,
                backgroundColor: '#ff4444',
                borderRadius: 10,
                minWidth: 20,
                height: 20,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Text style={{
                  color: 'white',
                  fontSize: 12,
                  fontFamily: 'Poppins-Bold',
                }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={FacultyProfileStyle.actionBtn} onPress={goToSupportCenter}>
            <Feather name="help-circle" size={20} color="#00418b" />
            <Text style={[FacultyProfileStyle.actionText, { fontFamily: 'Poppins-Regular' }]}>Support Center</Text>
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
        <Text style={[FacultyProfileStyle.logoutText, { fontFamily: 'Poppins-Regular' }]}>Log Out</Text>
      </TouchableOpacity>
      
      {/* Notification Center */}
      <NotificationCenter 
        visible={showNotificationCenter} 
        onClose={() => setShowNotificationCenter(false)} 
      />

      <PasswordChangeModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        userId={user?._id}
      />

      <ConfirmLogoutModal
        visible={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
      />
    </View>
  );
}