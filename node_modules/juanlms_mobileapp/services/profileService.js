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

  // Test POST request capability
  async testPostCapability() {
    try {
      console.log('🔍 Testing POST request capability...');
      
      // Test with a simple POST request first
      const testFormData = new FormData();
      testFormData.append('test', 'data');
      
      const response = await fetch(`${API_URL}/api/mobile-test`, {
        method: 'POST',
        body: testFormData,
        timeout: 10000,
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ POST request test result:', response.status, data.message);
        return { success: true, status: response.status, data };
      } else {
        console.log('⚠️ POST test returned non-200 status:', response.status);
        return { success: true, status: response.status }; // Still consider it a success for testing
      }
    } catch (error) {
      console.error('❌ POST request test failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Test mobile upload capability (no file upload)
  async testMobileUpload() {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      console.log('🔍 Testing mobile upload capability...');
      
      const response = await fetch(`${API_URL}/api/mobile-upload-test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'data' }),
        timeout: 10000,
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Mobile upload test successful:', data);
        return { success: true, data };
      } else {
        const errorText = await response.text();
        console.error('❌ Mobile upload test failed:', response.status, errorText);
        return { success: false, error: `Test failed: ${response.status}` };
      }
    } catch (error) {
      console.error('❌ Mobile upload test failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Test authentication
  async testAuthentication() {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      console.log('🔍 Testing authentication...');
      
      // Try the new test endpoint first
      try {
        const response = await fetch(`${API_URL}/api/test-auth`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Authentication test successful:', data);
          return { success: true, data };
        } else {
          const errorText = await response.text();
          console.log('⚠️ Test endpoint not available, trying fallback:', response.status, errorText);
        }
      } catch (endpointError) {
        console.log('⚠️ Test endpoint not available, trying fallback:', endpointError.message);
      }
      
      // Fallback: try to access user info endpoint
      try {
        const response = await fetch(`${API_URL}/users/${await AsyncStorage.getItem('userId')}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Authentication test successful (fallback):', data.userID || data.email);
          return { success: true, data: { user: data } };
        } else {
          const errorText = await response.text();
          console.error('❌ Authentication test failed:', response.status, errorText);
          return { success: false, error: `Auth failed: ${response.status}` };
        }
      } catch (fallbackError) {
        console.error('❌ Authentication test failed:', fallbackError);
        return { success: false, error: fallbackError.message };
      }
    } catch (error) {
      console.error('❌ Authentication test failed:', error);
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
      
      const token = await AsyncStorage.getItem('jwtToken');
      console.log('Token exists:', !!token);
      console.log('Token length:', token ? token.length : 0);
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      // Quick connectivity test
      try {
        console.log('🔍 Testing server connectivity...');
        const healthResponse = await fetch(`${API_URL}/api/health`, {
          method: 'GET',
          timeout: 5000,
        });
        if (healthResponse.ok) {
          console.log('✅ Server is reachable');
        } else {
          console.log('⚠️ Server health check failed, but continuing with upload');
        }
      } catch (healthError) {
        console.log('⚠️ Server health check failed, but continuing with upload:', healthError.message);
      }
      
      // Test mobile upload capability
      try {
        const uploadTest = await this.testMobileUpload();
        if (uploadTest.success) {
          console.log('✅ Mobile upload capability verified');
        } else {
          console.log('⚠️ Mobile upload test failed, but continuing with upload:', uploadTest.error);
        }
      } catch (uploadTestError) {
        console.log('⚠️ Mobile upload test unavailable, continuing with upload:', uploadTestError.message);
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
      // Use fetch for React Native multipart uploads
      const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
      if (isNative) {
        console.log('🚀 Sending upload request to:', `${API_URL}/users/${userId}/upload-profile`);
        console.log('📦 FormData keys:', Array.from(formData._parts?.map(p => p[0]) || []));
        
        try {
          console.log('🔍 FormData details before upload:', {
            hasImage: formData._parts?.some(p => p[0] === 'image'),
            partsCount: formData._parts?.length || 0,
            imagePart: formData._parts?.find(p => p[0] === 'image')
          });
          
          const response = await fetch(`${API_URL}/users/${userId}/upload-profile`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              // Do NOT set Content-Type; React Native will add correct multipart boundary
            },
            body: formData,
          });
          
          console.log('📥 Upload response status:', response.status, response.statusText);
          console.log('📥 Upload response headers:', response.headers);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Upload failed:', response.status, errorText);
            console.error('❌ Response headers:', response.headers);
            throw new Error(`Upload failed: ${response.status} - ${errorText}`);
          }
          
          const json = await response.json();
          console.log('✅ Upload successful:', json);
          
          // Handle the backend response structure
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
        } catch (error) {
          console.error('❌ Fetch upload error:', error);
          
          // Try axios fallback for mobile
          if (error.message.includes('Network request failed') || error.message.includes('Network Error')) {
            console.log('🔄 Trying axios fallback for mobile...');
            try {
              const axiosResponse = await axios.post(`${API_URL}/users/${userId}/upload-profile`, formData, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'multipart/form-data',
                },
                timeout: 30000,
              });
              
              console.log('✅ Axios fallback successful:', axiosResponse.status);
              
              // Handle the backend response structure
              let profilePicUrl = null;
              if (axiosResponse.data?.user?.profilePic) {
                profilePicUrl = axiosResponse.data.user.profilePic;
              } else if (axiosResponse.data?.imageFilename) {
                profilePicUrl = axiosResponse.data.imageFilename;
              } else if (axiosResponse.data?.profile_picture) {
                profilePicUrl = axiosResponse.data.profile_picture;
              } else if (axiosResponse.data?.url) {
                profilePicUrl = axiosResponse.data.url;
              }
              
              if (profilePicUrl) {
                console.log('✅ Profile picture URL extracted (axios fallback):', profilePicUrl);
                return { user: { profilePic: profilePicUrl } };
              } else {
                console.warn('⚠️ No profile picture URL found in axios fallback response:', axiosResponse.data);
                return axiosResponse.data;
              }
            } catch (axiosError) {
              console.error('❌ Axios fallback also failed:', axiosError);
              throw new Error(`Network connection failed. Please check your internet connection and try again. If the problem persists, the server may be temporarily unavailable.`);
            }
          } else {
            throw new Error(`Upload failed: ${error.message}`);
          }
        }
      } else {
        // Use axios for web
        const response = await axios.post(`${API_URL}/users/${userId}/upload-profile`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
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