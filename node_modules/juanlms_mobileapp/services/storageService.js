import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

class StorageService {
  // Keychain operations for secure credential storage
  static async saveCredentials(email, password) {
    try {
      await Keychain.setInternetCredentials('juanlms_credentials', email, password);
      console.log('✅ Credentials saved securely to Keychain');
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving credentials to Keychain:', error);
      return { success: false, error: error.message };
    }
  }
  
  static async getCredentials() {
    try {
      const credentials = await Keychain.getInternetCredentials('juanlms_credentials');
      if (credentials) {
        console.log('✅ Credentials retrieved from Keychain');
        return {
          success: true,
          email: credentials.username,
          password: credentials.password
        };
      }
      return { success: true, email: null, password: null };
    } catch (error) {
      console.error('❌ Error retrieving credentials from Keychain:', error);
      return { success: false, error: error.message };
    }
  }
  
  static async clearCredentials() {
    try {
      await Keychain.resetInternetCredentials('juanlms_credentials');
      console.log('✅ Credentials cleared from Keychain');
      return { success: true };
    } catch (error) {
      console.error('❌ Error clearing credentials from Keychain:', error);
      return { success: false, error: error.message };
    }
  }
  
  // AsyncStorage operations for app preferences
  static async setRememberMe(enabled) {
    try {
      await AsyncStorage.setItem('rememberMeEnabled', enabled ? 'true' : 'false');
      console.log(`✅ Remember me preference set to: ${enabled}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error setting remember me preference:', error);
      return { success: false, error: error.message };
    }
  }
  
  static async getRememberMe() {
    try {
      const value = await AsyncStorage.getItem('rememberMeEnabled');
      const isEnabled = value === 'true';
      console.log(`✅ Remember me preference retrieved: ${isEnabled}`);
      return { success: true, enabled: isEnabled };
    } catch (error) {
      console.error('❌ Error getting remember me preference:', error);
      return { success: false, error: error.message, enabled: false };
    }
  }
  
  // Authentication data operations
  static async saveAuthData(user, token) {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('jwtToken', token);
      console.log('✅ Auth data saved to AsyncStorage');
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving auth data:', error);
      return { success: false, error: error.message };
    }
  }
  
  static async getAuthData() {
    try {
      const [user, token] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('jwtToken')
      ]);
      
      return {
        success: true,
        user: user ? JSON.parse(user) : null,
        token: token || null
      };
    } catch (error) {
      console.error('❌ Error getting auth data:', error);
      return { success: false, error: error.message, user: null, token: null };
    }
  }
  
  static async clearAuthData() {
    try {
      await Promise.all([
        AsyncStorage.removeItem('user'),
        AsyncStorage.removeItem('jwtToken')
      ]);
      console.log('✅ Auth data cleared from AsyncStorage');
      return { success: true };
    } catch (error) {
      console.error('❌ Error clearing auth data:', error);
      return { success: false, error: error.message };
    }
  }
  
  // FCM Token operations
  static async saveFCMToken(token) {
    try {
      await AsyncStorage.setItem('fcmToken', token);
      console.log('✅ FCM token saved to AsyncStorage');
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving FCM token:', error);
      return { success: false, error: error.message };
    }
  }
  
  static async getFCMToken() {
    try {
      const token = await AsyncStorage.getItem('fcmToken');
      return { success: true, token: token || null };
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
      return { success: false, error: error.message, token: null };
    }
  }
  
  static async clearFCMToken() {
    try {
      await AsyncStorage.removeItem('fcmToken');
      console.log('✅ FCM token cleared from AsyncStorage');
      return { success: true };
    } catch (error) {
      console.error('❌ Error clearing FCM token:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Cache clearing detection
  static async detectCacheClearing() {
    try {
      const [rememberResult, authResult] = await Promise.all([
        this.getRememberMe(),
        this.getAuthData()
      ]);
      
      // If remember me was enabled but auth data is missing, cache was likely cleared
      const wasCacheCleared = rememberResult.success && 
                             rememberResult.enabled && 
                             (!authResult.token || !authResult.user);
      
      if (wasCacheCleared) {
        console.log('⚠️ Cache clearing detected - remember me enabled but auth data missing');
        // Reset remember me preference since credentials are gone
        await this.setRememberMe(false);
      }
      
      return { success: true, wasCleared: wasCacheCleared };
    } catch (error) {
      console.error('❌ Error detecting cache clearing:', error);
      return { success: false, error: error.message, wasCleared: false };
    }
  }
  
  // Complete logout - clears both auth data and credentials
  static async logout() {
    try {
      await Promise.all([
        this.clearAuthData(),
        this.clearFCMToken(),
        this.clearCredentials(),
        this.setRememberMe(false)
      ]);
      console.log('✅ Complete logout - all data cleared');
      return { success: true };
    } catch (error) {
      console.error('❌ Error during complete logout:', error);
      return { success: false, error: error.message };
    }
  }
}

export default StorageService;
