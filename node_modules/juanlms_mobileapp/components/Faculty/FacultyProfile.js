import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Modal, ActivityIndicator, Alert, Platform } from 'react-native';
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
import * as FileSystem from 'expo-file-system';
import NotificationCenter from '../NotificationCenter';
import PasswordChangeModal from '../Shared/PasswordChangeModal';
import Constants from 'expo-constants';

// Get API URL from environment variables or fallback to default
const getApiUrl = () => {
  try {
    const fromConstants = Constants?.expoConfig?.extra?.API_URL;
    if (fromConstants) return fromConstants;
    
    const fromEnv = process.env.EXPO_PUBLIC_API_URL;
    if (fromEnv) return fromEnv;
    
    return 'https://juanlms-webapp-server.onrender.com';
  } catch (error) {
    console.warn('Error getting API URL:', error);
    return 'https://juanlms-webapp-server.onrender.com';
  }
};

const API_URL = getApiUrl();

const buildImageUri = (pathOrUrl) => {
  if (!pathOrUrl) return null;
  if (typeof pathOrUrl === 'string' && (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://'))) {
    return pathOrUrl;
  }
  const relative = typeof pathOrUrl === 'string' && pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return API_URL + relative;
};

export default function FacultyProfile() {
  const { user, updateUser, logout: logoutFromContext } = useUser();
  const navigation = useNavigation();
  const { unreadCount } = useNotifications();
  const { announcements } = useAnnouncements();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const fileInputRef = useRef(null);
  const [webPreviewUrl, setWebPreviewUrl] = useState(null);

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
    await logoutFromContext?.();
    const remember = await AsyncStorage.getItem('rememberMeEnabled');
    if (remember !== 'true') {
      await AsyncStorage.removeItem('savedEmail');
      await AsyncStorage.removeItem('savedPassword');
    }
    setShowLogoutConfirm(false);
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
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

  // Web: handle file input change
  const handleWebFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setEditedUser(prev => ({
        ...prev,
        newProfilePicAsset: file,
      }));
      setWebPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Web: trigger file input
  const pickImageWeb = () => {
    fileInputRef.current?.click();
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      console.log('=== FacultyProfile Upload Debug Start ===');
      console.log('Platform.OS:', Platform.OS);
      console.log('User ID:', user._id || user.userID);
      console.log('API_URL:', API_URL);
      console.log('Edited User:', editedUser);
      
      // Test network connectivity first
      try {
        console.log('Testing network connectivity to backend...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const testResponse = await fetch('https://juanlms-webapp-server.onrender.com/api/health', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        console.log('Network test response status:', testResponse.status);
        console.log('Network test response ok:', testResponse.ok);
        const testData = await testResponse.text();
        console.log('Network test response data:', testData);
        
        // Test the upload endpoint specifically
        console.log('Testing upload endpoint accessibility...');
        try {
          const uploadTestResponse = await fetch(`${API_URL}/users/${user._id || user.userID}/upload-profile`, {
            method: 'OPTIONS', // Use OPTIONS to test if endpoint exists
            headers: {
              'Content-Type': 'application/json',
            },
          });
          console.log('Upload endpoint test status:', uploadTestResponse.status);
        } catch (uploadTestError) {
          console.error('Upload endpoint test failed:', uploadTestError);
        }
      } catch (networkError) {
        console.error('Network connectivity test failed:', networkError);
        console.error('Network error message:', networkError.message);
        console.error('Network error code:', networkError.code);
        console.error('Network error type:', networkError.type);
        console.error('Network error name:', networkError.name);
        
        if (networkError.name === 'AbortError') {
          Alert.alert('Network Timeout', 'Connection to server timed out. Please check your internet connection.');
        } else {
          Alert.alert('Network Error', `Cannot connect to server: ${networkError.message}`);
        }
        return;
      }
      
      let profilePicPath = editedUser?.profilePic;
      let data;
      
      if (editedUser?.newProfilePicAsset) {
        // Use the correct user ID format (prefer _id, fallback to userID)
        const userId = user._id || user.userID;
        if (!userId) {
          throw new Error('User ID not found');
        }
        
        if (Platform.OS === 'web') {
          console.log('Web platform detected, using web upload method');
          console.log('File asset:', editedUser.newProfilePicAsset);
          // Pass File directly; service will append as 'image'
          data = await profileService.uploadProfilePicture(userId, editedUser.newProfilePicAsset, true);
        } else {
          console.log('Mobile platform detected, using mobile upload method');
          let asset = editedUser.newProfilePicAsset;
          console.log('Original asset:', asset);
          let localUri = asset.uri;
          console.log('Original URI:', localUri);
          
          // Handle Android content:// URIs and base64 data
          if (!localUri.startsWith('file://') && asset.base64) {
            console.log('Converting base64 to file URI');
            const fileUri = FileSystem.cacheDirectory + (asset.fileName || 'profile.jpg');
            console.log('Target file URI:', fileUri);
            await FileSystem.writeAsStringAsync(fileUri, asset.base64, { encoding: FileSystem.EncodingType.Base64 });
            localUri = fileUri;
            console.log('New local URI:', localUri);
          }
          
          const patchedAsset = {
            uri: localUri,
            fileName: asset.fileName || 'profile.jpg',
            type: asset.type || 'image/jpeg',
          };
          console.log('Patched asset for upload:', patchedAsset);
          
          console.log('Calling profileService.uploadProfilePicture...');
          data = await profileService.uploadProfilePicture(userId, patchedAsset, false);
          console.log('Upload response:', data);
        }
        
        const updated = data?.user;
        if (updated?.profilePic) {
          profilePicPath = updated.profilePic;
          console.log('Updated profile pic path:', profilePicPath);
        }
      }
      
      // Always update user context/state with the new profilePic
      console.log('Updating user context with profile pic:', profilePicPath);
      await updateUser({
        ...user,
        profilePic: profilePicPath,
        profilePicture: profilePicPath,
      });
      
      setIsEditModalVisible(false);
      console.log('=== FacultyProfile Upload Debug End - Success ===');
      Alert.alert('Profile Updated', 'Your profile picture has been changed successfully.');
    } catch (error) {
      console.error('=== FacultyProfile Upload Debug End - Error ===');
      console.error('Profile upload error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error response:', error.response);
      
      // Show user-friendly error message
      let errorMessage = 'Failed to update profile picture. Please try again.';
      
      if (error.message) {
        if (error.message.includes('Network request failed')) {
          errorMessage = 'Network connection failed. Please check your internet connection and try again.';
        } else if (error.message.includes('Cannot connect to server')) {
          errorMessage = 'Cannot connect to server. Please check your internet connection and try again.';
        } else if (error.message.includes('Authentication failed')) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (error.message.includes('File too large')) {
          errorMessage = 'Image file is too large. Please choose a smaller image.';
        } else if (error.message.includes('Invalid file type')) {
          errorMessage = 'Invalid file type. Please upload a valid image file (JPG, JPEG, PNG).';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Error', errorMessage);
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
        animationType="fade"
        transparent={true}
      >
        <View style={[FacultyProfileStyle.modalContainer, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
          <View style={FacultyProfileStyle.modalContent}>
            <Text style={[FacultyProfileStyle.modalTitle, { fontFamily: 'Poppins-Bold' }]}>Edit Profile</Text>
            <TouchableOpacity
              onPress={Platform.OS === 'web' ? pickImageWeb : pickImage}
              style={FacultyProfileStyle.imagePicker}
            >
              <Image
                source={
                  Platform.OS === 'web'
                    ? webPreviewUrl
                      ? { uri: webPreviewUrl }
                      : editedUser?.profilePic
                        ? { uri: buildImageUri(editedUser.profilePic) }
                        : require('../../assets/profile-icon (2).png')
                    : editedUser?.newProfilePicAsset
                      ? { uri: editedUser.newProfilePicAsset.uri }
                      : editedUser?.profilePic
                        ? { uri: buildImageUri(editedUser.profilePic) }
                        : require('../../assets/profile-icon (2).png')
                }
                style={FacultyProfileStyle.avatar}
                resizeMode="cover"
              />
              <Text style={[FacultyProfileStyle.imagePickerText, { fontFamily: 'Poppins-Regular' }]}>change photo</Text>
            </TouchableOpacity>
            {Platform.OS === 'web' && (
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleWebFileChange}
              />
            )}
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
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
          onPress={() => setIsEditModalVisible(true)}
        >
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