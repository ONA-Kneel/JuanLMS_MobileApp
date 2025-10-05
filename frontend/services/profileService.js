import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

// Get API URL from environment variables or fallback to default
const getApiUrl = () => {
  try {
    // Try to get from Expo constants first
    const fromConstants = Constants?.expoConfig?.extra?.API_URL;
    if (fromConstants) return fromConstants;
    
    // Try to get from environment variables
    const fromEnv = process.env.EXPO_PUBLIC_API_URL;
    if (fromEnv) return fromEnv;
    
    // Fallback to default
    return 'https://juanlms-webapp-server.onrender.com';
  } catch (error) {
    console.warn('Error getting API URL:', error);
    return 'https://juanlms-webapp-server.onrender.com';
  }
};

const API_URL = getApiUrl();

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

  async uploadProfilePicture(userId, imageAsset, isWeb = false, onLoadingChange = null, retryCount = 0) {
    const maxRetries = 2;
    const retryDelay = 1000; // 1 second
    
    try {
      console.log('=== ProfileService Upload Debug Start ===');
      console.log('API_URL:', API_URL);
      console.log('userId:', userId);
      console.log('isWeb:', isWeb);
      console.log('imageAsset:', imageAsset);
      console.log('Retry attempt:', retryCount + 1);
      
      // Notify UI that upload is starting
      if (onLoadingChange) {
        onLoadingChange(true);
      }
      
      const token = await AsyncStorage.getItem('jwtToken');
      console.log('Token exists:', !!token);
      console.log('Token length:', token ? token.length : 0);
      
      // Quick network connectivity check
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const testResponse = await fetch(`${API_URL}/health`, { 
          method: 'GET',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (testResponse.ok) {
          console.log('Network connectivity check passed:', testResponse.status);
        } else {
          console.warn('Network connectivity check returned non-OK status:', testResponse.status);
        }
      } catch (connectivityError) {
        console.warn('Network connectivity check failed:', connectivityError.message);
        // Continue with upload attempt anyway, as this is just a pre-check
      }
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
      if (isNative) {
        const fetchHeaders = {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          // Do NOT set Content-Type; RN fetch will add correct multipart boundary
        };
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for large uploads
        
        console.log('=== Network Request Debug ===');
        console.log('Request URL:', `${API_URL}/users/${userId}/upload-profile`);
        console.log('Request method: POST');
        console.log('Headers:', fetchHeaders);
        console.log('FormData keys:', Array.from(formData._parts ? formData._parts.keys() : []));
        console.log('Token present:', !!token);
        console.log('Token prefix:', token ? token.substring(0, 10) + '...' : 'None');
        
        let fetchResp;
        try {
          fetchResp = await fetch(`${API_URL}/users/${userId}/upload-profile`, {
            method: 'POST',
            headers: fetchHeaders,
            body: formData,
            signal: controller.signal,
          });
          
          console.log('Fetch request completed successfully');
        } catch (fetchError) {
          clearTimeout(timeoutId);
          console.error('=== Fetch Error Details ===');
          console.error('Error name:', fetchError.name);
          console.error('Error message:', fetchError.message);
          console.error('Error code:', fetchError.code);
          console.error('Error stack:', fetchError.stack);
          console.error('API_URL:', API_URL);
          console.error('Request URL:', `${API_URL}/users/${userId}/upload-profile`);
          console.error('=== End Fetch Error Details ===');
          
          // Enhanced error handling for different types of fetch errors
          if (fetchError.name === 'AbortError') {
            throw new Error('Upload timeout. Please check your connection and try again.');
          } else if (fetchError.message.includes('Network request failed')) {
            throw new Error('Network connection failed. Please check your internet connection and try again.');
          } else if (fetchError.message.includes('fetch')) {
            throw new Error('Unable to reach server. Please check your internet connection.');
          } else {
            throw new Error(`Network error: ${fetchError.message}`);
          }
        }
        
        clearTimeout(timeoutId);
        console.log('Response status:', fetchResp.status);
        console.log('Response status text:', fetchResp.statusText);
        console.log('Response headers:', Object.fromEntries(fetchResp.headers.entries()));
        
        if (!fetchResp.ok) {
          let errorText;
          try {
            errorText = await fetchResp.text();
            console.error('Error response text:', errorText);
            
            // Try to parse as JSON for better error handling
            try {
              const errorJson = JSON.parse(errorText);
              console.error('Parsed error response:', errorJson);
              throw new Error(errorJson.message || errorJson.error || `Upload failed with status ${fetchResp.status}`);
            } catch (parseError) {
              // If not JSON, use the text as is
              throw new Error(errorText || `Upload failed with status ${fetchResp.status}`);
            }
          } catch (textError) {
            console.error('Failed to read error response:', textError);
            throw new Error(`Upload failed with status ${fetchResp.status}: ${textError.message}`);
          }
        }
        
        const json = await fetchResp.json();
        console.log('Upload response JSON:', json);
        
        // Notify UI that upload is complete
        if (onLoadingChange) {
          onLoadingChange(false);
        }
        
        if (json?.profile_picture || json?.url) {
          const pic = json.profile_picture || json.url;
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
        
        // Notify UI that upload is complete
        if (onLoadingChange) {
          onLoadingChange(false);
        }
        
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
      
      // Check if we should retry
      const shouldRetry = retryCount < maxRetries && (
        error.message.includes('Network request failed') ||
        error.message.includes('Network connection failed') ||
        error.message.includes('timeout') ||
        error.message.includes('fetch')
      );
      
      if (shouldRetry) {
        console.log(`Retrying upload in ${retryDelay}ms... (attempt ${retryCount + 2}/${maxRetries + 1})`);
        
        // Notify UI that we're retrying
        if (onLoadingChange) {
          onLoadingChange(false);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        // Retry the upload
        return this.uploadProfilePicture(userId, imageAsset, isWeb, onLoadingChange, retryCount + 1);
      }
      
      // Notify UI that upload failed and loading should stop
      if (onLoadingChange) {
        onLoadingChange(false);
      }
      
      // Handle different types of errors
      if (error.message && error.message.includes('Cannot connect to server')) {
        throw new Error('Cannot connect to server. Please check your internet connection and try again.');
      }
      
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error || 'Failed to upload profile picture';
        
        switch (status) {
          case 401:
            throw new Error('Authentication failed. Please log in again.');
          case 403:
            throw new Error('Access denied. You do not have permission to upload profile pictures.');
          case 413:
            throw new Error('Image file is too large. Please choose a smaller image.');
          case 415:
            throw new Error('Invalid file type. Please upload a valid image file (JPG, JPEG, PNG).');
          case 500:
            throw new Error('Server error. Please try again later.');
          default:
            throw new Error(message);
        }
      }
      
      // Handle network errors
      if (error.message && error.message.includes('Network request failed')) {
        throw new Error('Network connection failed. Please check your internet connection and try again.');
      }
      
      if (error.message && error.message.includes('timeout')) {
        throw new Error('Upload timeout. Please try again with a smaller image or better connection.');
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