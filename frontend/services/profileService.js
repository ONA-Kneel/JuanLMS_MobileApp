import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

const API_URL = 'https://juanlms-webapp-server.onrender.com'; // Ensure this matches your backend base URL

const profileService = {
  async updateProfile(userId, profileData) {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/users/${userId}/profile`, profileData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async requestPasswordChangeOtp(userId) {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await axios.post(`${API_URL}/api/users/${userId}/request-password-change-otp`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      if (error.response) throw new Error(error.response.data?.message || 'Failed to request OTP');
      throw error;
    }
  },

  async validatePasswordChangeOtp(userId, otp) {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await axios.post(`${API_URL}/api/users/${userId}/validate-otp`, { otp }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      if (error.response) throw new Error(error.response.data?.message || 'Invalid or expired OTP');
      throw error;
    }
  },

  async changePassword(userId, currentPassword, newPassword) {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await axios.patch(`${API_URL}/api/users/${userId}/change-password`, {
        currentPassword,
        newPassword,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      if (error.response) throw new Error(error.response.data?.error || 'Failed to change password');
      throw error;
    }
  },

  async updateNotifications(userId, notificationSettings) {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/users/${userId}/notifications`, notificationSettings, {
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
      const token = await AsyncStorage.getItem('jwtToken');
      const formData = new FormData();
      if (isWeb) {
        // imageAsset is a File from an <input type="file"/>
        // Web endpoint expects field name 'image'
        formData.append('image', imageAsset);
      } else {
        let uploadUri = imageAsset?.uri;
        // Android content:// URIs cause issues for multipart uploads; copy to cache as file://
        if (Platform.OS === 'android' && typeof uploadUri === 'string' && uploadUri.startsWith('content://')) {
          try {
            const targetPath = FileSystem.cacheDirectory + (imageAsset?.fileName || 'profile.jpg');
            await FileSystem.copyAsync({ from: uploadUri, to: targetPath });
            uploadUri = targetPath;
          } catch (copyErr) {
            console.warn('Failed to copy content URI to cache, proceeding with original URI:', copyErr?.message);
            // Fallback: try to use the original URI if copy fails
            if (!uploadUri.startsWith('file://')) {
              throw new Error('Unable to process image file for upload');
            }
          }
        }
        const getMimeType = (uri, fallbackType) => {
          const lower = (uri || '').toLowerCase();
          if (lower.endsWith('.png')) return 'image/png';
          if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
          return fallbackType || 'image/jpeg';
        };
        const pickNameFromUri = (uri, fallbackName) => {
          if (typeof uri === 'string') {
            const parts = uri.split('/');
            const last = parts[parts.length - 1];
            if (last && last.indexOf('.') > -1) return last;
          }
          return fallbackName || 'profile.jpg';
        };
        const name = imageAsset?.fileName || pickNameFromUri(uploadUri, 'profile.jpg');
        const type = imageAsset?.type || getMimeType(uploadUri, undefined);
        // Web endpoint expects field name 'image'
        formData.append('image', {
          uri: uploadUri,
          name,
          type,
        });
      }
      try {
        // Use WebApp-compatible endpoint: POST /api/users/:id/upload-profile
        const response = await axios.post(`${API_URL}/api/users/${userId}/upload-profile`, formData, {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            // Do NOT set Content-Type manually for multipart; let axios/RN set boundary
            Accept: 'application/json',
          },
        });
        // Normalize response to expected shape used by callers
        if (response?.data?.profile_picture || response?.data?.url) {
          const pic = response.data.profile_picture || response.data.url;
          return { user: { profilePic: pic } };
        }
        return response.data;
      } catch (axiosErr) {
        // Fallback: On React Native, retry with fetch if Axios returns a Network Error
        const isNetworkError = !axiosErr.response;
        const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
        if (isNetworkError && isNative) {
          const fetchHeaders = {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            // Do NOT set Content-Type; RN fetch will add correct multipart boundary
          };
          const fetchResp = await fetch(`${API_URL}/api/users/${userId}/upload-profile`, {
            method: 'POST',
            headers: fetchHeaders,
            body: formData,
          });
          if (!fetchResp.ok) {
            const text = await fetchResp.text();
            throw new Error(text || `Upload failed with status ${fetchResp.status}`);
          }
          const json = await fetchResp.json();
          if (json?.profile_picture || json?.url) {
            const pic = json.profile_picture || json.url;
            return { user: { profilePic: pic } };
          }
          return json;
        }
        throw axiosErr;
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to upload profile picture');
      }
      throw new Error('Network error while uploading profile picture');
    }
  },

  async updateTrack(userId, track) {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/users/${userId}/track`, { track }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default profileService; 