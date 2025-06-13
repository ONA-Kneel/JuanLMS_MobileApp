import React, { useState } from 'react';
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

// Helper to capitalize first letter of each word
function capitalizeWords(str) {
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

const API_URL = 'http://localhost:5000'; // or your production URL

export default function StudentsProfile() {
  const { user, loading } = useUser();
  const navigation = useNavigation();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
    });
    if (!result.canceled) {
      setEditedUser(prev => ({
        ...prev,
        newProfilePicAsset: result.assets[0], // store the asset for upload
      }));
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      let profilePicPath = editedUser.profilePic;
      // If a new image was picked, upload it
      if (editedUser.newProfilePicAsset) {
        const data = await profileService.uploadProfilePicture(user._id, editedUser.newProfilePicAsset);
        if (data.success && data.profilePic) {
          profilePicPath = data.profilePic;
        }
      }
      // Save other profile fields
      await profileService.updateProfile(user._id, {
        firstname: editedUser.firstname,
        lastname: editedUser.lastname,
        college: editedUser.college,
      });
      // Update user state in context
      await updateUser({
        ...user,
        firstname: editedUser.firstname,
        lastname: editedUser.lastname,
        college: editedUser.college,
        profilePic: profilePicPath,
      });
      setIsEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
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
          source={editedUser?.newProfilePicAsset
            ? { uri: editedUser.newProfilePicAsset.uri }
            : editedUser?.profilePic
              ? { uri: API_URL + editedUser.profilePic }
              : require('../../assets/profile-icon (2).png')}
          style={StudentsProfileStyle.avatar}
          onError={(e) => {
            console.log('Image loading error:', e.nativeEvent.error);
            Alert.alert('Error', 'Failed to load profile picture');
          }}
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
            <TouchableOpacity onPress={pickImage} style={StudentsProfileStyle.imagePicker}>
              <Image
                source={editedUser?.newProfilePicAsset
                  ? { uri: editedUser.newProfilePicAsset.uri }
                  : editedUser?.profilePic
                    ? { uri: API_URL + editedUser.profilePic }
                    : require('../../assets/profile-icon (2).png')}
                style={StudentsProfileStyle.avatar}
              />
              <Text style={StudentsProfileStyle.imagePickerText}>Change Photo</Text>
            </TouchableOpacity>
            <TextInput
              style={StudentsProfileStyle.input}
              placeholder="First Name"
              value={editedUser?.firstname}
              onChangeText={text => setEditedUser(prev => ({ ...prev, firstname: text }))}
              editable={!isLoading}
            />
            <TextInput
              style={StudentsProfileStyle.input}
              placeholder="Last Name"
              value={editedUser?.lastname}
              onChangeText={text => setEditedUser(prev => ({ ...prev, lastname: text }))}
              editable={!isLoading}
            />
            <TextInput
              style={StudentsProfileStyle.input}
              placeholder="College"
              value={editedUser?.college}
              onChangeText={text => setEditedUser(prev => ({ ...prev, college: text }))}
              editable={!isLoading}
            />
            <View style={StudentsProfileStyle.modalButtons}>
              <TouchableOpacity 
                style={[StudentsProfileStyle.modalButton, StudentsProfileStyle.cancelButton]} 
                onPress={() => setIsEditModalVisible(false)}
                disabled={isLoading}
              >
                <Text style={StudentsProfileStyle.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[StudentsProfileStyle.modalButton, StudentsProfileStyle.saveButton]} 
                onPress={handleSaveProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={StudentsProfileStyle.buttonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}