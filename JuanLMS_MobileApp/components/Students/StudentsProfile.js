import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import StudentsProfileStyle from '../styles/Stud/StudentsProfileStyle';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addAuditLog } from '../Admin/auditTrailUtils';
import profileService from '../../services/profileService';
import * as ImagePicker from 'expo-image-picker';
import { updateUser } from '../UserContext';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Helper to capitalize first letter of each word
function capitalizeWords(str) {
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

const API_URL = 'https://juanlms-mobileapp.onrender.com'; // or your production URL

export default function StudentsProfile() {
  const { user, loading } = useUser();
  const navigation = useNavigation();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [webPreviewUrl, setWebPreviewUrl] = useState(null);

  const logout = async () => {
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
      await AsyncStorage.removeItem('user');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const goToSupportCenter = () => {
    navigation.navigate('SReq');
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant permission to access your photos');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: false,
    });
    if (!result.canceled) {
      setEditedUser(prev => ({
        ...prev,
        newProfilePicAsset: result.assets[0], // store the asset for upload
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
        if (Platform.OS === 'web') {
          const formData = new FormData();
          formData.append('profilePicture', editedUser.newProfilePicAsset);
          data = await profileService.uploadProfilePicture(user._id, formData, true);
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
          data = await profileService.uploadProfilePicture(user._id, patchedAsset);
        }
        if (data.success && (data.profilePic || data.profile_picture)) {
          profilePicPath = data.profilePic || data.profile_picture;
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
      {/* Profile Image */}
      <View style={StudentsProfileStyle.avatarWrapper}>
        <Image
          source={
            user.profilePic
              ? { uri: API_URL + user.profilePic }
              : require('../../assets/profile-icon.png')
          }
          style={StudentsProfileStyle.avatar}
          resizeMode="cover"
        />
      </View>
      {/* Card */}
      <View style={StudentsProfileStyle.card}>
        <Text style={StudentsProfileStyle.name}>
          {capitalizeWords(`${user.firstname} ${user.lastname}`)}
          <Text style={StudentsProfileStyle.emoji}>👨‍🎓</Text>
        </Text>
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
          <TouchableOpacity 
            style={StudentsProfileStyle.actionBtn}
            onPress={() => setIsEditModalVisible(true)}
          >
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
      {/* Logout Button */}
      <TouchableOpacity style={StudentsProfileStyle.logout} onPress={logout}>
        <Text style={StudentsProfileStyle.logoutText}>Log Out</Text>
      </TouchableOpacity>
      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={StudentsProfileStyle.modalContainer}>
          <View style={StudentsProfileStyle.modalContent}>
            <Text style={StudentsProfileStyle.modalTitle}>Edit Profile</Text>
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
                        ? { uri: API_URL + editedUser.profilePic }
                        : require('../../assets/profile-icon.png')
                    : editedUser?.newProfilePicAsset
                      ? { uri: editedUser.newProfilePicAsset.uri }
                      : editedUser?.profilePic
                        ? { uri: API_URL + editedUser.profilePic }
                        : require('../../assets/profile-icon.png')
                }
                style={StudentsProfileStyle.avatar}
                resizeMode="cover"
              />
              <Text style={StudentsProfileStyle.imagePickerText}>change photo</Text>
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
                <Text style={StudentsProfileStyle.buttonText}>cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[StudentsProfileStyle.modalButton, StudentsProfileStyle.saveButton]} 
                onPress={handleSaveProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#00418b" />
                ) : (
                  <Text style={StudentsProfileStyle.buttonText}>save changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}