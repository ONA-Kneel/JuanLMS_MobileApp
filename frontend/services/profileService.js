import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

const API_URL = 'https://juanlms-webapp-server.onrender.com'; // Your actual backend URL

const profileService = {
  async updateProfile(userId, profileData) {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await axios.post(`${API_URL}/users/${userId}/upload-profile`, profileData, {
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
      const response = await axios.post(`${API_URL}/users/${userId}/request-password-change-otp`, {}, {
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
      const response = await axios.post(`${API_URL}/users/${userId}/validate-otp`, { otp }, {
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
      const response = await axios.patch(`${API_URL}/users/${userId}/change-password`, {
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
      const token = await AsyncStorage.getItem('jwtToken');
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
      console.log('=== ProfileService Upload Debug Start ===');
      console.log('API_URL:', API_URL);
      console.log('userId:', userId);
      console.log('isWeb:', isWeb);
      console.log('imageAsset:', imageAsset);
      
      const token = await AsyncStorage.getItem('jwtToken');
      console.log('Token exists:', !!token);
      console.log('Token length:', token ? token.length : 0);
      
      // Enforce same constraints as WebApp: image types only, max 5MB
      const MAX_BYTES = 5 * 1024 * 1024;
      const formData = new FormData();
      if (isWeb) {
        // imageAsset is a File from an <input type="file"/>
        // Web endpoint expects field name 'image'
        if (!imageAsset?.type || !String(imageAsset.type).startsWith('image/')) {
          throw new Error('Only image files are allowed (JPG, JPEG, PNG).');
        }
        if (typeof imageAsset.size === 'number' && imageAsset.size > MAX_BYTES) {
          throw new Error('Image is too large. Maximum size is 5MB.');
        }
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
        // Check file size on native (best-effort)
        try {
          const info = await FileSystem.getInfoAsync(uploadUri);
          if (info?.size && info.size > MAX_BYTES) {
            throw new Error('Image is too large. Maximum size is 5MB.');
          }
        } catch (_) {
          // Ignore if size check fails; server will still enforce limits
        }
        // Web endpoint expects field name 'image'
        formData.append('image', {
          uri: uploadUri,
          name,
          type,
        });
      }
      // Use fetch instead of axios for React Native multipart uploads
      const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
      console.log('Platform is native:', isNative);
      
      if (isNative) {
        const fetchHeaders = {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          // Do NOT set Content-Type; RN fetch will add correct multipart boundary
        };
        console.log('Fetch headers:', fetchHeaders);
        console.log('Upload URL:', `${API_URL}/users/${userId}/upload-profile`);
        
        const fetchResp = await fetch(`${API_URL}/users/${userId}/upload-profile`, {
          method: 'POST',
          headers: fetchHeaders,
          body: formData,
        });
        
        console.log('Fetch response status:', fetchResp.status);
        console.log('Fetch response ok:', fetchResp.ok);
        console.log('Fetch response headers:', fetchResp.headers);
        
        if (!fetchResp.ok) {
          const text = await fetchResp.text();
          console.error('Upload failed response text:', text);
          throw new Error(text || `Upload failed with status ${fetchResp.status}`);
        }
        const json = await fetchResp.json();
        console.log('Upload response JSON:', json);
        
        if (json?.profile_picture || json?.url) {
          const pic = json.profile_picture || json.url;
          console.log('Profile picture URL:', pic);
          return { user: { profilePic: pic } };
        }
        return json;
      } else {
        // Use axios for web
        const response = await axios.post(`${API_URL}/users/${userId}/upload-profile`, formData, {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            // Do NOT set Content-Type manually for multipart; let axios set boundary
            Accept: 'application/json',
          },
        });
        // Normalize response to expected shape used by callers
        if (response?.data?.profile_picture || response?.data?.url) {
          const pic = response.data.profile_picture || response.data.url;
          return { user: { profilePic: pic } };
        }
        return response.data;
      }
    } catch (error) {
      console.error('=== ProfileService Upload Debug End - Error ===');
      console.error('Error uploading profile picture:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to upload profile picture');
      }
      throw new Error('Network error while uploading profile picture');
    }
  },

  async updateTrack(userId, track) {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await axios.post(`${API_URL}/users/${userId}/track`, { track }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default profileService; 