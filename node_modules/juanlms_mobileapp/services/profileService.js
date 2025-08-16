import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = 'http://localhost:5000'; // Update this with your actual API URL

const profileService = {
  async updateProfile(userId, profileData) {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(`${API_URL}/users/${userId}/profile`, profileData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async changePassword(userId, passwordData) {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(`${API_URL}/users/${userId}/password`, passwordData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async updateNotifications(userId, notificationSettings) {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(`${API_URL}/users/${userId}/notifications`, notificationSettings, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async uploadProfilePicture(userId, imageAsset, isWeb = false) {
    try {
      const token = await AsyncStorage.getItem('token');
      let formData;
      if (isWeb) {
        formData = imageAsset; // already FormData
      } else {
        const getMimeType = (uri) => {
          if (uri.endsWith('.png')) return 'image/png';
          if (uri.endsWith('.jpg') || uri.endsWith('.jpeg')) return 'image/jpeg';
          return 'image/jpeg';
        };
        formData = new FormData();
        formData.append('profilePicture', {
          uri: imageAsset.uri,
          name: imageAsset.fileName || 'profile.jpg',
          type: imageAsset.type || getMimeType(imageAsset.uri),
        });
      }
      const response = await axios.put(`${API_URL}/users/${userId}/profile-picture`, formData, {
        headers: {
          Authorization: `Bearer ${token}`
        },
      });
      if (response.data && response.data.profile_picture) {
        // Update the local storage with the new profile picture URL
        await AsyncStorage.setItem('userProfilePicture', response.data.profile_picture);
      }
      return response.data;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to upload profile picture');
      }
      throw new Error('Network error while uploading profile picture');
    }
  },
};

export default profileService; 