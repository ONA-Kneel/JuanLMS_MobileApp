import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import ConfirmLogoutModal from '../Shared/ConfirmLogoutModal';
import { useNotifications } from '../../NotificationContext';
import { useAnnouncements } from '../../AnnouncementContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addAuditLog } from '../Admin/auditTrailUtils';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import NotificationCenter from '../NotificationCenter';
import profileService from '../../services/profileService';
import PasswordChangeModal from '../Shared/PasswordChangeModal';

// Helper to capitalize first letter of each word
function capitalizeWords(str) {
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

const API_URL = 'https://juanlms-webapp-server.onrender.com';

const buildImageUri = (pathOrUrl) => {
  if (!pathOrUrl) return null;
  if (typeof pathOrUrl === 'string' && (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://'))) {
    return pathOrUrl;
  }
  const relative = typeof pathOrUrl === 'string' && pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return API_URL + relative;
};

export default function PrincipalProfile() {
  const { user, loading, updateUser } = useUser();
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
  const [showPhotoConfirmModal, setShowPhotoConfirmModal] = useState(false);
  const [selectedPhotoAsset, setSelectedPhotoAsset] = useState(null);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const logout = () => setShowLogoutConfirm(true);
  const handleConfirmLogout = async () => {
    try {
      if (user) {
        await addAuditLog({
          userId: user._id,
          userName: user.firstname + ' ' + user.lastname,
          userRole: user.role || 'principal',
          action: 'Logout',
          details: `User ${user.email} logged out.`,
          timestamp: new Date().toISOString(),
        });
      }
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('jwtToken');
      const remember = await AsyncStorage.getItem('rememberMeEnabled');
      if (remember !== 'true') {
        await AsyncStorage.removeItem('savedEmail');
        await AsyncStorage.removeItem('savedPassword');
      }
      setShowLogoutConfirm(false);
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const goToSupportCenter = () => {
    navigation.navigate('PrincipalSupportCenter');
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
      setSelectedPhotoAsset(result.assets[0]);
      setShowPhotoConfirmModal(true);
    }
  };

  // Web: handle file input change
  const handleWebFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedPhotoAsset(file);
      setWebPreviewUrl(URL.createObjectURL(file));
      setShowPhotoConfirmModal(true);
    }
  };

  // Web: trigger file input
  const pickImageWeb = () => {
    fileInputRef.current?.click();
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const asset = editedUser?.newProfilePicAsset;
      if (asset && user?._id) {
        const isWeb = Platform.OS === 'web';
        const resp = await profileService.uploadProfilePicture(user._id, asset, isWeb);
        const updated = resp?.user;
        if (updated?.profilePic) {
          const newUser = { ...user, profilePic: updated.profilePic, profilePicture: updated.profilePic };
          if (typeof updateUser === 'function') {
            await updateUser(newUser);
          } else {
            await AsyncStorage.setItem('user', JSON.stringify(newUser));
          }
        }
      }
      setIsEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle confirmed photo change
  const handleConfirmPhotoChange = async () => {
    if (selectedPhotoAsset) {
      setIsLoading(true);
      try {
        const isWeb = Platform.OS === 'web';
        const resp = await profileService.uploadProfilePicture(user._id, selectedPhotoAsset, isWeb);
        const updated = resp?.user;
        if (updated?.profilePic) {
          const newUser = { ...user, profilePic: updated.profilePic, profilePicture: updated.profilePic };
          if (typeof updateUser === 'function') {
            await updateUser(newUser);
          } else {
            await AsyncStorage.setItem('user', JSON.stringify(newUser));
          }
        }
        
        setShowPhotoConfirmModal(false);
        setSelectedPhotoAsset(null);
        setWebPreviewUrl(null);
        Alert.alert('Success', 'Profile updated successfully!');
      } catch (error) {
        console.error('Error updating profile picture:', error);
        Alert.alert('Error', 'Failed to update profile picture. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle cancel photo change
  const handleCancelPhotoChange = () => {
    setShowPhotoConfirmModal(false);
    setSelectedPhotoAsset(null);
    setWebPreviewUrl(null);
  };

  if (loading) {
  return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00418b" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.topBackground} />
        <View style={styles.card}>
          <Text style={styles.name}>Profile Not Available</Text>
            <TouchableOpacity
            style={[styles.logout, { marginTop: 20 }]} 
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.logoutText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
      </View>
    );
  }

  const goBack = () => navigation.goBack();

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={{ position: 'absolute', top: 40, left: 20, zIndex: 10 }} onPress={goBack}>
        <MaterialIcons name="arrow-back" size={28} color="#fff" />
      </TouchableOpacity>
      
      {/* Top curved background */}
      <View style={styles.topBackground} />
      
      {/* Profile Image / Initials */}
      <View style={styles.avatarWrapper}>
        {user.profilePic ? (
          <Image
            source={{ uri: buildImageUri(user.profilePic) }}
            style={styles.avatar}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: styles.avatar?.width || 100,
              height: styles.avatar?.height || 100,
              borderRadius: (styles.avatar?.width || 100) / 2,
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
      <View style={styles.card}>
        <Text style={styles.name}>
          {capitalizeWords(`${user.firstname || 'Dr. Michael'} ${user.lastname || 'Anderson'}`)}
          <Text style={styles.emoji}>👨‍🏫</Text>
        </Text>
        <Text style={styles.email}>{user.email || 'principal.anderson@juanlms.edu'}</Text>
        <View style={styles.row}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Department</Text>
            <Text style={styles.infoValue}>{user.department || 'Academic Administration'}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>Principal</Text>
          </View>
      </View>
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => setIsEditModalVisible(true)}
          >
            <Feather name="edit" size={20} color="#00418b" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowPasswordModal(true)}>
            <Feather name="lock" size={20} color="#00418b" />
            <Text style={styles.actionText}>Password</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => setShowNotificationCenter(true)}
          >
            <Feather name="bell" size={20} color="#00418b" />
            <Text style={styles.actionText}>Notifications</Text>
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
          <TouchableOpacity style={styles.actionBtn} onPress={goToSupportCenter}>
            <Feather name="help-circle" size={20} color="#00418b" />
            <Text style={styles.actionText}>Support</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity
              onPress={Platform.OS === 'web' ? pickImageWeb : pickImage}
              style={styles.imagePicker}
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
                style={styles.modalAvatar}
              />
              <Text style={styles.imagePickerText}>Tap to change photo</Text>
        </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#00418b" />
                ) : (
                  <Text style={styles.buttonText}>Save</Text>
                )}
        </TouchableOpacity>
      </View>
          </View>
          </View>
      </Modal>
      
      {/* Hidden file input for web */}
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleWebFileChange}
          style={{ display: 'none' }}
        />
      )}
      
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

      {/* Photo Confirmation Modal */}
      <Modal
        visible={showPhotoConfirmModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { fontFamily: 'Poppins-Bold', marginBottom: 20, textAlign: 'center' }]}>
              Confirm Profile Photo
            </Text>
            <Text style={[styles.modalSubtitle, { fontFamily: 'Poppins-Regular', marginBottom: 20, textAlign: 'center' }]}>
              Are you sure you want this photo as your profile?
            </Text>
            
            {/* Photo Preview */}
            <View style={[styles.imagePicker, { marginBottom: 30, alignSelf: 'center' }]}>
              <Image
                source={
                  Platform.OS === 'web'
                    ? webPreviewUrl
                      ? { uri: webPreviewUrl }
                      : selectedPhotoAsset
                        ? { uri: URL.createObjectURL(selectedPhotoAsset) }
                        : require('../../assets/profile-icon (2).png')
                    : selectedPhotoAsset
                      ? { uri: selectedPhotoAsset.uri }
                      : require('../../assets/profile-icon (2).png')
                }
                style={[styles.avatar, { width: 120, height: 120 }]}
                resizeMode="cover"
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={handleCancelPhotoChange}
                disabled={isLoading}
              >
                <Text style={[styles.buttonText, { fontFamily: 'Poppins-Regular' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleConfirmPhotoChange}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#00418b" />
                ) : (
                  <Text style={[styles.buttonText, { fontFamily: 'Poppins-Regular' }]}>Yes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f3f3f3',
    alignItems: 'center',
  },
  topBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 180,
    backgroundColor: '#00418b',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    zIndex: 0,
  },
  avatarWrapper: {
    position: 'absolute',
    top: 110,
    zIndex: 2,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 60,
    padding: 5,
    elevation: 5,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eee',
  },
  card: {
    marginTop: 90,
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 18,
    alignItems: 'center',
    paddingTop: '35%',
    paddingBottom: 20,
    paddingHorizontal: 20,
    elevation: 6,
    zIndex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
    color: '#222',
    marginBottom: 2,
  },
  emoji: {
    fontSize: 18,
  },
  email: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Poppins-Regular',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  infoBox: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: '#888',
    fontFamily: 'Poppins-Regular',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00418b',
    fontFamily: 'Poppins-SemiBold',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 18,
    marginBottom: 5,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  actionText: {
    fontSize: 12,
    color: '#00418b',
    fontFamily: 'Poppins-Medium',
    marginTop: 2,
  },
  logout: {
    backgroundColor: '#00418b',
    padding: 15,
    width: '90%',
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 20,
  },
  logoutText: {
    color: 'white',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 16,
  },
  modalContent: {
    width: '95%',
    maxWidth: 400,
    backgroundColor: '#00418b',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 18,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: 'white',
    fontSize: 16,
    marginBottom: 18,
    textAlign: 'center',
  },
  imagePicker: {
    alignItems: 'center',
    marginBottom: 18,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eee',
  },
  imagePickerText: {
    color: 'white',
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 18,
  },
  modalButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 30,
    paddingVertical: 12,
    marginHorizontal: 8,
    alignItems: 'center',
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: 'white',
  },
  saveButton: {
    backgroundColor: 'white',
  },
  buttonText: {
    color: '#00418b',
    fontWeight: 'bold',
    fontSize: 16,
  },
};
