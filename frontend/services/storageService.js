import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

class StorageService {
  // Keychain operations for secure credential storage
  static async saveCredentials(email, password) {
    try {
      // Save to primary Keychain
      await Keychain.setInternetCredentials('juanlms_credentials', email, password);
      
      // Also save to backup Keychain for extra persistence
      await this.saveBackupCredentials(email, password);
      
      console.log('✅ Credentials saved securely to Keychain (primary + backup)');
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving credentials to Keychain:', error);
      return { success: false, error: error.message };
    }
  }

  // Backup credential storage - more persistent than regular Keychain
  static async saveBackupCredentials(email, password) {
    try {
      // Use a different service name for backup
      await Keychain.setInternetCredentials('juanlms_credentials_backup', email, password);
      console.log('✅ Backup credentials saved to Keychain');
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving backup credentials:', error);
      return { success: false, error: error.message };
    }
  }

  static async getBackupCredentials() {
    try {
      const credentials = await Keychain.getInternetCredentials('juanlms_credentials_backup');
      if (credentials && credentials.username && credentials.password) {
        console.log('✅ Backup credentials retrieved from Keychain');
        return {
          success: true,
          email: credentials.username,
          password: credentials.password
        };
      }
      console.log('⚠️ No backup credentials found in Keychain');
      return { success: true, email: null, password: null };
    } catch (error) {
      console.error('❌ Error retrieving backup credentials from Keychain:', error);
      return { success: false, error: error.message, email: null, password: null };
    }
  }
  
  static async getCredentials() {
    try {
      const credentials = await Keychain.getInternetCredentials('juanlms_credentials');
      if (credentials && credentials.username && credentials.password) {
        console.log('✅ Credentials retrieved from Keychain');
        return {
          success: true,
          email: credentials.username,
          password: credentials.password
        };
      }
      console.log('⚠️ No valid credentials found in Keychain');
      return { success: true, email: null, password: null };
    } catch (error) {
      console.error('❌ Error retrieving credentials from Keychain:', error);
      return { success: false, error: error.message, email: null, password: null };
    }
  }
  
  static async clearCredentials() {
    try {
      await Promise.all([
        Keychain.resetInternetCredentials('juanlms_credentials'),
        Keychain.resetInternetCredentials('juanlms_credentials_backup')
      ]);
      console.log('✅ Credentials cleared from Keychain (primary + backup)');
      return { success: true };
    } catch (error) {
      console.error('❌ Error clearing credentials from Keychain:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Persistent remember me preference using Keychain (survives cache clears)
  static async setRememberMe(enabled) {
    try {
      // Store in both AsyncStorage (for quick access) and Keychain (for persistence)
      await Promise.all([
        AsyncStorage.setItem('rememberMeEnabled', enabled ? 'true' : 'false'),
        Keychain.setInternetCredentials('juanlms_remember_me', 'remember', enabled ? 'true' : 'false')
      ]);
      console.log(`✅ Remember me preference set to: ${enabled} (AsyncStorage + Keychain)`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error setting remember me preference:', error);
      return { success: false, error: error.message };
    }
  }
  
  static async getRememberMe() {
    try {
      // First try AsyncStorage (faster)
      const asyncValue = await AsyncStorage.getItem('rememberMeEnabled');
      if (asyncValue !== null) {
        const isEnabled = asyncValue === 'true';
        console.log(`✅ Remember me preference retrieved from AsyncStorage: ${isEnabled}`);
        return { success: true, enabled: isEnabled };
      }
      
      // If AsyncStorage is empty (cache cleared), try Keychain
      const keychainResult = await Keychain.getInternetCredentials('juanlms_remember_me');
      if (keychainResult && keychainResult.password) {
        const isEnabled = keychainResult.password === 'true';
        console.log(`✅ Remember me preference restored from Keychain: ${isEnabled}`);
        
        // Restore to AsyncStorage for future quick access
        await AsyncStorage.setItem('rememberMeEnabled', isEnabled ? 'true' : 'false');
        
        return { success: true, enabled: isEnabled };
      }
      
      console.log('⚠️ No remember me preference found anywhere');
      return { success: true, enabled: false };
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
  
  // Cache clearing detection - Messenger-style persistence
  static async detectCacheClearing() {
    try {
      const [rememberResult, authResult, credentialsResult] = await Promise.all([
        this.getRememberMe(),
        this.getAuthData(),
        this.getCredentials()
      ]);
      
      // If remember me was enabled but auth data is missing, cache was likely cleared
      const wasCacheCleared = rememberResult.success && 
                             rememberResult.enabled && 
                             (!authResult.token || !authResult.user);
      
      if (wasCacheCleared) {
        console.log('⚠️ Cache clearing detected - remember me enabled but auth data missing');
        
        // Check if credentials are still available in Keychain
        const hasValidCredentials = credentialsResult.success && 
                                   credentialsResult.email && 
                                   credentialsResult.password;
        
        if (!hasValidCredentials) {
          console.log('⚠️ Credentials missing from Keychain - attempting to restore from backup');
          // Try to restore credentials from backup storage (more persistent)
          const backupResult = await this.getBackupCredentials();
          if (backupResult.success && backupResult.email && backupResult.password) {
            console.log('✅ Credentials restored from backup storage');
            // Restore credentials to primary Keychain
            await this.saveCredentials(backupResult.email, backupResult.password);
            return { success: true, wasCleared: true, credentialsLost: false, restored: true };
          } else {
            console.log('⚠️ No backup credentials found - this is unusual for persistent remember me');
            // Only reset remember me if we're absolutely sure there are no credentials anywhere
            return { success: true, wasCleared: true, credentialsLost: true };
          }
        } else {
          console.log('✅ Credentials still available in Keychain - can auto-login');
          // Credentials are still available, user can auto-login
          return { success: true, wasCleared: true, credentialsLost: false };
        }
      }
      
      return { success: true, wasCleared: false, credentialsLost: false };
    } catch (error) {
      console.error('❌ Error detecting cache clearing:', error);
      return { success: false, error: error.message, wasCleared: false, credentialsLost: false };
    }
  }
  
  // Validate credential persistence across cache clears
  static async validateCredentialPersistence() {
    try {
      const [rememberResult, credentialsResult] = await Promise.all([
        this.getRememberMe(),
        this.getCredentials()
      ]);
      
      const isValid = rememberResult.success && 
                     rememberResult.enabled && 
                     credentialsResult.success && 
                     credentialsResult.email && 
                     credentialsResult.password;
      
      console.log('🔍 Credential persistence validation:', {
        rememberEnabled: rememberResult.enabled,
        hasCredentials: !!(credentialsResult.email && credentialsResult.password),
        isValid
      });
      
      return { success: true, isValid };
    } catch (error) {
      console.error('❌ Error validating credential persistence:', error);
      return { success: false, error: error.message, isValid: false };
    }
  }

  // Force restore credentials from backup (Messenger-style recovery)
  static async forceRestoreCredentials() {
    try {
      console.log('🔄 Force restoring credentials from backup...');
      
      const [rememberResult, backupResult] = await Promise.all([
        this.getRememberMe(),
        this.getBackupCredentials()
      ]);
      
      if (rememberResult.success && rememberResult.enabled && 
          backupResult.success && backupResult.email && backupResult.password) {
        
        // Restore credentials to primary storage
        await this.saveCredentials(backupResult.email, backupResult.password);
        
        console.log('✅ Credentials force restored successfully');
        return { 
          success: true, 
          email: backupResult.email, 
          password: backupResult.password 
        };
      }
      
      console.log('⚠️ Cannot restore credentials - missing data');
      return { success: false, error: 'No backup credentials available' };
    } catch (error) {
      console.error('❌ Error force restoring credentials:', error);
      return { success: false, error: error.message };
    }
  }

  // Complete logout - clears both auth data and credentials
  static async logout() {
    try {
      await Promise.all([
        this.clearAuthData(),
        this.clearFCMToken(),
        this.clearCredentials(),
        this.setRememberMe(false),
        Keychain.resetInternetCredentials('juanlms_remember_me') // Clear Keychain remember me too
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
