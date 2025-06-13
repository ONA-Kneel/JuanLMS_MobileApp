import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  async uploadProfilePicture(userId, imageAsset) {
    try {
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();
      formData.append('profilePicture', {
        uri: imageAsset.uri,
        name: imageAsset.fileName || 'profile.jpg',
        type: imageAsset.type || 'image/jpeg',
      });

      const response = await axios.post(`${API_URL}/users/${userId}/profile-picture`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default profileService; 