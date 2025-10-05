import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

/**
 * Simple secure storage service that uses Keychain for credentials
 * and AsyncStorage for preferences
 */
class SecureStorage {
  // Remember Me Preference (AsyncStorage - gets cleared with cache)
  static async setRememberMe(enabled) {
    try {
      await AsyncStorage.setItem('rememberMeEnabled', enabled ? 'true' : 'false');
      console.log(`✅ Remember me preference set to: ${enabled}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error setting remember me:', error);
      return { success: false, error: error.message };
    }
  }

  static async getRememberMe() {
    try {
      const value = await AsyncStorage.getItem('rememberMeEnabled');
      const isEnabled = value === 'true';
      console.log(`✅ Remember me preference: ${isEnabled}`);
      return { success: true, enabled: isEnabled };
    } catch (error) {
      console.error('❌ Error getting remember me:', error);
      return { success: false, enabled: false };
    }
  }

  // Credentials (Keychain - survives cache clearing)
  static async saveCredentials(email, password) {
    try {
      await Keychain.setInternetCredentials('juanlms_credentials', email, password);
      console.log('✅ Credentials saved to Keychain');
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving credentials:', error);
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
      console.error('❌ Error getting credentials:', error);
      return { success: false, email: null, password: null };
    }
  }

  static async clearCredentials() {
    try {
      await Keychain.resetInternetCredentials('juanlms_credentials');
      console.log('✅ Credentials cleared from Keychain');
      return { success: true };
    } catch (error) {
      console.error('❌ Error clearing credentials:', error);
      return { success: false };
    }
  }

  // Auth Data (AsyncStorage - gets cleared with cache)
  static async saveAuthData(user, token) {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('jwtToken', token);
      console.log('✅ Auth data saved to AsyncStorage');
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving auth data:', error);
      return { success: false };
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
      return { success: false, user: null, token: null };
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
      return { success: false };
    }
  }

  // Cache clearing detection
  static async detectCacheClearing() {
    try {
      const rememberResult = await this.getRememberMe();
      const authResult = await this.getAuthData();
      
      // If remember me is enabled but auth data is missing, cache was cleared
      const wasCleared = rememberResult.success && 
                        rememberResult.enabled && 
                        (!authResult.token || !authResult.user);
      
      if (wasCleared) {
        console.log('⚠️ Cache clearing detected - auth data missing but remember me enabled');
      }
      
      return { success: true, wasCleared };
    } catch (error) {
      console.error('❌ Error detecting cache clearing:', error);
      return { success: false, wasCleared: false };
    }
  }

  // Complete logout
  static async logout() {
    try {
      await Promise.all([
        this.clearAuthData(),
        this.clearCredentials(),
        this.setRememberMe(false)
      ]);
      console.log('✅ Complete logout - all data cleared');
      return { success: true };
    } catch (error) {
      console.error('❌ Error during logout:', error);
      return { success: false };
    }
  }
}

export default SecureStorage;
