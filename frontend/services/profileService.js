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
console.log('🔧 ProfileService initialized with API_URL:', API_URL);

const profileService = {
  // Test server connectivity
  async testServerConnection() {
    try {
      console.log('🔍 Testing server connection to:', API_URL);
      
      const response = await fetch(`${API_URL}/api/health`, {
        method: 'GET',
        timeout: 10000,
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Server is responding:', data);
        return { success: true, data };
      } else {
        console.error('❌ Server responded with error:', response.status, response.statusText);
        return { success: false, error: `Server error: ${response.status}` };
      }
    } catch (error) {
      console.error('❌ Server connection test failed:', error);
      return { success: false, error: error.message };
    }
  },

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
      
       // Test network connectivity first
       try {
         console.log('Testing connectivity to:', `${API_URL}/api/health`);
         console.log('Current API_URL:', API_URL);
         
         const controller = new AbortController();
         const timeoutId = setTimeout(() => controller.abort(), 10000);
         
         const testResponse = await fetch(`${API_URL}/api/health`, {
           method: 'GET',
           signal: controller.signal,
           headers: {
             'Accept': 'application/json',
             'Content-Type': 'application/json',
           },
         });
         
         clearTimeout(timeoutId);
         console.log('Network connectivity test:', testResponse.status, testResponse.statusText);
         
         if (!testResponse.ok) {
           const errorText = await testResponse.text();
           console.error('Health check response:', errorText);
           throw new Error(`Server health check failed: ${testResponse.status} - ${errorText}`);
         }
         
         const healthData = await testResponse.json();
         console.log('✅ Network connectivity verified:', healthData);
       } catch (networkError) {
         console.error('❌ Network connectivity test failed:', networkError);
         console.error('Network error details:', {
           message: networkError.message,
           name: networkError.name,
           stack: networkError.stack
         });
         
         // Try multiple fallback endpoints
         const fallbackEndpoints = [
           `${API_URL}/`,
           `${API_URL}/users`,
           `${API_URL}/api/health`
         ];
         
         let connectivityVerified = false;
         for (const endpoint of fallbackEndpoints) {
           try {
             console.log(`🔄 Trying fallback endpoint: ${endpoint}`);
             const fallbackResponse = await fetch(endpoint, {
               method: 'GET',
               timeout: 5000,
             });
             console.log(`✅ Fallback endpoint ${endpoint} responded:`, fallbackResponse.status);
             connectivityVerified = true;
             break;
           } catch (fallbackError) {
             console.error(`❌ Fallback endpoint ${endpoint} failed:`, fallbackError.message);
           }
         }
         
         if (!connectivityVerified) {
           console.error('🚨 All connectivity tests failed - server may be down');
           throw new Error('Cannot connect to server. The server may be temporarily unavailable. Please try again later.');
         }
       }
      
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
      if (isNative) {
        const fetchHeaders = {
          // Do NOT set Content-Type; RN fetch will add correct multipart boundary
          // Do NOT set Authorization header - matches web app behavior
        };
         const controller = new AbortController();
         const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
         
         console.log('🚀 Sending upload request to:', `${API_URL}/users/${userId}/upload-profile`);
         console.log('📤 Request headers:', fetchHeaders);
         console.log('📦 FormData keys:', Array.from(formData._parts?.map(p => p[0]) || []));
         console.log('🔗 Full upload URL:', `${API_URL}/users/${userId}/upload-profile`);
         
         let fetchResp;
         let retryCount = 0;
         const maxRetries = 3;
         let lastError;
         
         while (retryCount < maxRetries) {
           try {
             console.log(`🔄 Upload attempt ${retryCount + 1}/${maxRetries}`);
             fetchResp = await fetch(`${API_URL}/users/${userId}/upload-profile`, {
               method: 'POST',
               headers: fetchHeaders,
               body: formData,
               signal: controller.signal,
             });
             console.log('📥 Upload response status:', fetchResp.status, fetchResp.statusText);
             break; // Success, exit retry loop
           } catch (attemptError) {
             lastError = attemptError;
             retryCount++;
             console.error(`❌ Upload attempt ${retryCount} failed:`, attemptError.message);
             
             if (attemptError.message.includes('Network request failed') && retryCount < maxRetries) {
               console.log(`⏳ Retrying in ${retryCount * 1000}ms...`);
               await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
               continue;
             }
             
             // Try axios fallback for Android "Network request failed" errors
             if (attemptError.message.includes('Network request failed') && Platform.OS === 'android') {
               console.log('🔄 Trying axios fallback for Android...');
               try {
                 const axiosResponse = await axios.post(`${API_URL}/users/${userId}/upload-profile`, formData, {
                   headers: {
                     // Do NOT set Authorization header - matches web app behavior
                     'Content-Type': 'multipart/form-data',
                   },
                   timeout: 30000,
                 });
                 console.log('✅ Axios fallback successful');
                 fetchResp = {
                   ok: true,
                   status: axiosResponse.status,
                   statusText: axiosResponse.statusText,
                   headers: new Map(Object.entries(axiosResponse.headers)),
                   json: () => Promise.resolve(axiosResponse.data),
                 };
                 break; // Success, exit retry loop
               } catch (axiosError) {
                 console.error('❌ Axios fallback also failed:', axiosError);
                 throw attemptError; // Throw original fetch error
               }
             }
             
             throw attemptError;
           }
         }
         
         if (!fetchResp) {
           throw lastError || new Error('All upload attempts failed');
         }
        
        clearTimeout(timeoutId);
        if (!fetchResp.ok) {
          const text = await fetchResp.text();
          throw new Error(text || `Upload failed with status ${fetchResp.status}`);
        }
         const json = await fetchResp.json();
         console.log('Backend response:', json);
         
         // Handle the actual backend response structure
         let profilePicUrl = null;
         if (json?.user?.profilePic) {
           profilePicUrl = json.user.profilePic;
         } else if (json?.imageFilename) {
           profilePicUrl = json.imageFilename;
         } else if (json?.profile_picture) {
           profilePicUrl = json.profile_picture;
         } else if (json?.url) {
           profilePicUrl = json.url;
         }
         
         if (profilePicUrl) {
           console.log('✅ Profile picture URL extracted:', profilePicUrl);
           return { user: { profilePic: profilePicUrl } };
         } else {
           console.warn('⚠️ No profile picture URL found in response:', json);
           return json;
         }
      } else {
        // Use axios for web
        const response = await axios.post(`${API_URL}/users/${userId}/upload-profile`, formData, {
          headers: {
            // Do NOT set Authorization header - matches web app behavior
            // Do NOT set Content-Type manually for multipart; let axios set boundary
            Accept: 'application/json',
          },
        });
         // Normalize response to expected shape used by callers
         console.log('Axios response:', response.data);
         
         let profilePicUrl = null;
         if (response?.data?.user?.profilePic) {
           profilePicUrl = response.data.user.profilePic;
         } else if (response?.data?.imageFilename) {
           profilePicUrl = response.data.imageFilename;
         } else if (response?.data?.profile_picture) {
           profilePicUrl = response.data.profile_picture;
         } else if (response?.data?.url) {
           profilePicUrl = response.data.url;
         }
         
         if (profilePicUrl) {
           console.log('✅ Profile picture URL extracted (axios):', profilePicUrl);
           return { user: { profilePic: profilePicUrl } };
         } else {
           console.warn('⚠️ No profile picture URL found in axios response:', response.data);
           return response.data;
         }
      }
    } catch (error) {
      console.error('=== ProfileService Upload Debug End - Error ===');
      console.error('Error uploading profile picture:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      
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
      
       // Handle network errors with more specific guidance
       if (error.message && error.message.includes('Network request failed')) {
         console.error('🔍 Network request failed - possible causes:');
         console.error('1. Backend server is down:', API_URL);
         console.error('2. Network connectivity issues');
         console.error('3. CORS issues');
         console.error('4. Firewall blocking the request');
         
         throw new Error('Network connection failed. Please check your internet connection and try again. If the problem persists, the server may be temporarily unavailable.');
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