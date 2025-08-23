import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Modal, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import AdminProfileStyle from '../styles/administrator/AdminProfileStyle';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import { useNotifications } from '../../NotificationContext';
import { useAnnouncements } from '../../AnnouncementContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addAuditLog } from './auditTrailUtils';
import profileService from '../../services/profileService';
import { updateUser } from '../UserContext';
import * as ImagePicker from 'expo-image-picker';
import NotificationCenter from '../NotificationCenter';

const API_URL = 'https://juanlms-webapp-server.onrender.com';


export default function AdminProfile() {
  const { user } = useUser();
  const navigation = useNavigation();
  const { unreadCount } = useNotifications();
  const { announcements } = useAnnouncements();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const logout = async () => {
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
    await AsyncStorage.removeItem('user');
    navigation.navigate('Login');
  };

  if (!user) {
    return (
      <View style={AdminProfileStyle.container}>
        <Text>Loading...</Text>
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
            source={{ uri: user.profilePic.startsWith('http') ? user.profilePic : API_URL + user.profilePic }}
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
        animationType="slide"
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
                    ? { uri: editedUser.profilePic.startsWith('http') ? editedUser.profilePic : API_URL + editedUser.profilePic }
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
            onPress={() => navigation.navigate('ChangePassword')}
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
    </View>
  );
}