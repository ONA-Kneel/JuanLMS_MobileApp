import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Modal, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import AdminProfileStyle from '../styles/administrator/AdminProfileStyle';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../../UserContext';
import ConfirmLogoutModal from '../Shared/ConfirmLogoutModal.js';
import { useNotifications } from '../../NotificationContext';
import { useAnnouncements } from '../../AnnouncementContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addAuditLog } from './auditTrailUtils';
import profileService from '../../services/profileService';
import * as ImagePicker from 'expo-image-picker';
import NotificationCenter from '../NotificationCenter';
import PasswordChangeModal from '../Shared/PasswordChangeModal.js';

const API_URL = 'https://juanlms-webapp-server.onrender.com';

const buildImageUri = (pathOrUrl) => {
  if (!pathOrUrl) return null;
  if (typeof pathOrUrl === 'string' && (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://'))) {
    return pathOrUrl;
  }
  const relative = typeof pathOrUrl === 'string' && pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return API_URL + relative;
};


export default function AdminProfile() {
  const { user, updateUser, logout: logoutFromContext, loading: userLoading } = useUser();
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
        userRole: user.role || 'admin',
        action: 'Logout',
        details: `User ${user.email} logged out.`,
        timestamp: new Date().toISOString(),
      });
    }
    await logoutFromContext?.();
    const remember = await AsyncStorage.getItem('rememberMeEnabled');
    if (remember !== 'true') {
      await AsyncStorage.removeItem('savedEmail');
      await AsyncStorage.removeItem('savedPassword');
    }
    setShowLogoutConfirm(false);
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  // Add safety check to prevent white screen when user is null (during logout)
  // This must be placed AFTER all hooks to avoid "Rendered fewer hooks than expected" error
  if (userLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f9fa' }}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666', fontFamily: 'Poppins-Regular' }}>
          Loading user data...
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f9fa' }}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666', fontFamily: 'Poppins-Regular' }}>
          Redirecting to login...
        </Text>
      </View>
    );
  }

  const goBack = () => navigation.goBack();

  const pickImage = async () => {
    // Ask for permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'Permission to access camera roll is required!');
      return;
    }
    // Launch image picker
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
      let data;
      
      if (editedUser?.newProfilePicAsset) {
        // Use the correct user ID format (prefer _id, fallback to userID)
        const userId = user._id || user.userID;
        if (!userId) {
          throw new Error('User ID not found');
        }
        
        if (Platform.OS === 'web') {
          // Pass File directly; service will append as 'image'
          data = await profileService.uploadProfilePicture(userId, editedUser.newProfilePicAsset, true);
        } else {
          let asset = editedUser.newProfilePicAsset;
          let localUri = asset.uri;
          if (!localUri.startsWith('file://') && asset.base64) {
            const fileUri = FileSystem.cacheDirectory + (asset.fileName || 'profile.jpg');
            await FileSystem.writeAsStringAsync(fileUri, asset.base64, { encoding: FileSystem.EncodingType.Base64 });
            localUri = fileUri;
          }
          const patchedAsset = {
            uri: localUri,
            fileName: asset.fileName || 'profile.jpg',
            type: asset.type || 'image/jpeg',
          };
          data = await profileService.uploadProfilePicture(userId, patchedAsset, false);
        }
        const updated = data?.user;
        if (updated?.profilePic) {
          profilePicPath = updated.profilePic;
        }
      }
      
      // Always update user context/state with the new profilePic
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
    <View style={AdminProfileStyle.container}>
      {/* Back Button */}
      <TouchableOpacity style={{ position: 'absolute', top: 40, left: 20, zIndex: 10 }} onPress={goBack}>
        <MaterialIcons name="arrow-back" size={28} color="#fff" />
      </TouchableOpacity>
      {/* Top curved background */}
      <View style={AdminProfileStyle.topBackground} />
      {/* Profile Image / Initials */}
      <View style={AdminProfileStyle.avatarWrapper}>
        {user.profilePic ? (
          <Image
            source={{ uri: buildImageUri(user.profilePic) }}
            style={AdminProfileStyle.avatar}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: AdminProfileStyle.avatar?.width || 100,
              height: AdminProfileStyle.avatar?.height || 100,
              borderRadius: (AdminProfileStyle.avatar?.width || 100) / 2,
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
        <TouchableOpacity onPress={() => setIsEditModalVisible(true)} style={AdminProfileStyle.editAvatarBtn}>
          <Feather name="edit" size={20} color="#00418b" />
        </TouchableOpacity>
      </View>
      <Modal
        visible={isEditModalVisible}
        animationType="fade"
        transparent={true}
      >
        <View style={AdminProfileStyle.modalContainer}>
          <View style={AdminProfileStyle.modalContent}>
            <Text style={[AdminProfileStyle.modalTitle, { fontFamily: 'Poppins-Bold' }]}>Edit Profile</Text>
            <TouchableOpacity onPress={pickImage} style={AdminProfileStyle.imagePicker}>
              <Image
                source={editedUser?.newProfilePicAsset
                  ? { uri: editedUser.newProfilePicAsset.uri }
                  : editedUser?.profilePic
                    ? { uri: buildImageUri(editedUser.profilePic) }
                    : require('../../assets/profile-icon (2).png')}
                style={AdminProfileStyle.avatar}
                resizeMode="cover"
              />
              <Text style={[AdminProfileStyle.imagePickerText, { fontFamily: 'Poppins-Regular' }]}>change photo</Text>
            </TouchableOpacity>
            <View style={AdminProfileStyle.modalButtons}>
              <TouchableOpacity 
                style={[AdminProfileStyle.modalButton, AdminProfileStyle.cancelButton]} 
                onPress={() => setIsEditModalVisible(false)}
                disabled={isLoading}
              >
                <Text style={[AdminProfileStyle.buttonText, { fontFamily: 'Poppins-Regular' }]}>cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[AdminProfileStyle.modalButton, AdminProfileStyle.saveButton]} 
                onPress={handleSaveProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#00418b" />
                ) : (
                  <Text style={[AdminProfileStyle.buttonText, { fontFamily: 'Poppins-Regular' }]}>save changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Card */}
      <View style={AdminProfileStyle.card}>
        <Text style={[AdminProfileStyle.name, { fontFamily: 'Poppins-Bold' }]}>{user.firstname} {user.lastname} <Text style={AdminProfileStyle.emoji}>🎓</Text></Text>
        <Text style={[AdminProfileStyle.email, { fontFamily: 'Poppins-Regular' }]}>{user.email}</Text>
        
        <View style={AdminProfileStyle.actionRow}>
          <TouchableOpacity 
            style={AdminProfileStyle.actionBtn}
            onPress={() => setIsEditModalVisible(true)}
          >
            <Feather name="edit" size={20} color="#00418b" />
            <Text style={[AdminProfileStyle.actionText, { fontFamily: 'Poppins-Regular' }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={AdminProfileStyle.actionBtn}
            onPress={() => setShowPasswordModal(true)}
          >
            <Feather name="lock" size={20} color="#00418b" />
            <Text style={[AdminProfileStyle.actionText, { fontFamily: 'Poppins-Regular' }]}>Password</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={AdminProfileStyle.actionBtn}
            onPress={() => setShowNotificationCenter(true)}
          >
            <Feather name="bell" size={20} color="#00418b" />
            <Text style={[AdminProfileStyle.actionText, { fontFamily: 'Poppins-Regular' }]}>Notifications</Text>
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
        <Text style={[AdminProfileStyle.logoutText, { fontFamily: 'Poppins-Regular' }]}>Log Out</Text>
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