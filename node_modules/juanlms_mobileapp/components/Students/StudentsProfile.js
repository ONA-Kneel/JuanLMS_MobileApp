import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import StudentsProfileStyle from '../styles/Stud/StudentsProfileStyle';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import ConfirmLogoutModal from '../Shared/ConfirmLogoutModal';
import { useNotifications } from '../../NotificationContext';
import { useAnnouncements } from '../../AnnouncementContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addAuditLog } from '../Admin/auditTrailUtils';
import profileService from '../../services/profileService';
import * as ImagePicker from 'expo-image-picker';
import { updateUser } from '../UserContext';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import NotificationCenter from '../NotificationCenter';
import PasswordChangeModal from '../Shared/PasswordChangeModal';
import Constants from 'expo-constants';

// Helper to capitalize first letter of each word
function capitalizeWords(str) {
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

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

export default function StudentsProfile() {
  const { user, loading, updateUser, logout: logoutFromContext } = useUser();
  const navigation = useNavigation();
  const { unreadCount } = useNotifications();
  const { announcements } = useAnnouncements();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [webPreviewUrl, setWebPreviewUrl] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const computeStrand = (u) => {
    if (!u) return 'Not specified';
    if (u.strand && typeof u.strand === 'string') return u.strand;
    if (u.track && typeof u.track === 'string') return u.track;
    const source = [u.course, u.program, u.section, u.gradeLevel]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!source) return 'Not specified';
    const tvlKeywords = ['tvl', 'ict', 'home economics', 'he', 'industrial arts', 'ia', 'agri', 'agri-fishery', 'af'];
    const academicKeywords = ['academic', 'stem', 'abm', 'humss', 'gas'];
    if (tvlKeywords.some(k => source.includes(k))) return 'TVL';
    if (academicKeywords.some(k => source.includes(k))) return 'Academic';
    return 'General';
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const logout = () => setShowLogoutConfirm(true);
  const handleConfirmLogout = async () => {
    try {
      if (user) {
        await addAuditLog({
          userId: user._id,
          userName: user.firstname + ' ' + user.lastname,
          userRole: user.role || 'student',
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
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const goToSupportCenter = () => {
    navigation.navigate('SReq');
  };

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
        newProfilePicAsset: file, // store the File object
      }));
      setWebPreviewUrl(URL.createObjectURL(file)); // Add preview URL for web
    }
  };

  // Web: trigger file input
  const pickImageWeb = () => {
    fileInputRef.current?.click();
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
      console.error('Profile upload error:', error);
      Alert.alert('Error', `Failed to update profile picture: ${error.message || 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[StudentsProfileStyle.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={{ marginTop: 10, fontSize: 16, color: '#666' }}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[StudentsProfileStyle.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 16, color: '#666' }}>No user data found. Please login again.</Text>
        <TouchableOpacity 
          style={[StudentsProfileStyle.logout, { marginTop: 20 }]} 
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={StudentsProfileStyle.logoutText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const goBack = () => navigation.goBack();

  return (
    <View style={StudentsProfileStyle.container}>
      {/* Back Button */}
      <TouchableOpacity style={{ position: 'absolute', top: 40, left: 20, zIndex: 10 }} onPress={goBack}>
        <MaterialIcons name="arrow-back" size={28} color="#fff" />
      </TouchableOpacity>
      {/* Top curved background */}
      <View style={StudentsProfileStyle.topBackground} />
      {/* Profile Image / Initials */}
      <View style={StudentsProfileStyle.avatarWrapper}>
        {user.profilePic ? (
          <Image
            source={{ uri: buildImageUri(user.profilePic) }}
            style={StudentsProfileStyle.avatar}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: StudentsProfileStyle.avatar?.width || 100,
              height: StudentsProfileStyle.avatar?.height || 100,
              borderRadius: (StudentsProfileStyle.avatar?.width || 100) / 2,
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
      {/* Card */}
      <View style={StudentsProfileStyle.card}>
        <Text style={[StudentsProfileStyle.name, { fontFamily: 'Poppins-Bold' }]}>
          {capitalizeWords(`${user.firstname} ${user.lastname}`)}
          <Text style={StudentsProfileStyle.emoji}></Text>
        </Text>
        <Text style={[StudentsProfileStyle.email, { fontFamily: 'Poppins-Regular' }]}>{user.email}</Text>
        <View style={StudentsProfileStyle.row}>
          <View style={StudentsProfileStyle.infoBox}>
            <Text style={[StudentsProfileStyle.infoLabel, { fontFamily: 'Poppins-Regular' }]}>Strand</Text>
            <Text style={[StudentsProfileStyle.infoValue, { fontFamily: 'Poppins-SemiBold' }]}>{computeStrand(user)}</Text>
          </View>
          <View style={StudentsProfileStyle.infoBox}>
            <Text style={[StudentsProfileStyle.infoLabel, { fontFamily: 'Poppins-Regular' }]}>Role</Text>
            <Text style={[StudentsProfileStyle.infoValue, { fontFamily: 'Poppins-SemiBold' }]}>Student</Text>
          </View>
        </View>
        <View style={StudentsProfileStyle.actionRow}>
          <TouchableOpacity 
            style={StudentsProfileStyle.actionBtn}
            onPress={() => setIsEditModalVisible(true)}
          >
            <Feather name="edit" size={20} color="#00418b" />
            <Text style={[StudentsProfileStyle.actionText, { fontFamily: 'Poppins-Regular' }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={StudentsProfileStyle.actionBtn} onPress={() => setShowPasswordModal(true)}>
            <Feather name="lock" size={20} color="#00418b" />
            <Text style={[StudentsProfileStyle.actionText, { fontFamily: 'Poppins-Regular' }]}>Password</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={StudentsProfileStyle.actionBtn}
            onPress={() => setShowNotificationCenter(true)}
          >
            <Feather name="bell" size={20} color="#00418b" />
            <Text style={[StudentsProfileStyle.actionText, { fontFamily: 'Poppins-Regular' }]}>Notifications</Text>
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
          <TouchableOpacity style={StudentsProfileStyle.actionBtn} onPress={goToSupportCenter}>
            <Feather name="help-circle" size={20} color="#00418b" />
            <Text style={[StudentsProfileStyle.actionText, { fontFamily: 'Poppins-Regular' }]}>Support Center</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Logout Button */}
      <TouchableOpacity style={StudentsProfileStyle.logout} onPress={logout}>
        <Text style={[StudentsProfileStyle.logoutText, { fontFamily: 'Poppins-Regular' }]}>Log Out</Text>
      </TouchableOpacity>
      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={StudentsProfileStyle.modalContainer}>
          <View style={StudentsProfileStyle.modalContent}>
            <Text style={[StudentsProfileStyle.modalTitle, { fontFamily: 'Poppins-Bold' }]}>Edit Profile</Text>
            <TouchableOpacity
              onPress={Platform.OS === 'web' ? pickImageWeb : pickImage}
              style={StudentsProfileStyle.imagePicker}
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
                style={StudentsProfileStyle.avatar}
                resizeMode="cover"
              />
              <Text style={[StudentsProfileStyle.imagePickerText, { fontFamily: 'Poppins-Regular' }]}>change photo</Text>
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
            <View style={StudentsProfileStyle.modalButtons}>
              <TouchableOpacity 
                style={[StudentsProfileStyle.modalButton, StudentsProfileStyle.cancelButton]} 
                onPress={() => setIsEditModalVisible(false)}
                disabled={isLoading}
              >
                <Text style={[StudentsProfileStyle.buttonText, { fontFamily: 'Poppins-Regular' }]}>cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[StudentsProfileStyle.modalButton, StudentsProfileStyle.saveButton]} 
                onPress={handleSaveProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#00418b" />
                ) : (
                  <Text style={[StudentsProfileStyle.buttonText, { fontFamily: 'Poppins-Regular' }]}>save changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
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