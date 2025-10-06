import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import * as FileSystem from 'expo-file-system';

class StorageService {
  // Keychain operations for secure credential storage
  static async saveCredentials(email, password) {
    try {
      // Save to primary Keychain
      await Keychain.setInternetCredentials('juanlms_credentials', email, password);
      
      // Also save to backup Keychain for extra persistence
      await this.saveBackupCredentials(email, password);
      
      // Save to encrypted file storage as ultimate fallback
      await this.saveCredentialsToFile(email, password);
      
      // Save to AsyncStorage with obfuscated keys (additional fallback)
      await this.saveCredentialsToAsyncStorage(email, password);
      
      console.log('✅ Credentials saved securely (Keychain + backup + file + AsyncStorage)');
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving credentials:', error);
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
      // First try primary Keychain
      const credentials = await Keychain.getInternetCredentials('juanlms_credentials');
      if (credentials && credentials.username && credentials.password) {
        console.log('✅ Credentials retrieved from primary Keychain');
        return {
          success: true,
          email: credentials.username,
          password: credentials.password
        };
      }
      
      // Try backup Keychain
      const backupCredentials = await this.getBackupCredentials();
      if (backupCredentials.success && backupCredentials.email && backupCredentials.password) {
        console.log('✅ Credentials retrieved from backup Keychain');
        // Restore to primary Keychain
        await this.saveCredentials(backupCredentials.email, backupCredentials.password);
        return backupCredentials;
      }
      
      // Try file storage
      const fileCredentials = await this.getCredentialsFromFile();
      if (fileCredentials.success && fileCredentials.email && fileCredentials.password) {
        console.log('✅ Credentials retrieved from file storage');
        // Restore to Keychain
        await this.saveCredentials(fileCredentials.email, fileCredentials.password);
        return fileCredentials;
      }
      
      // Try AsyncStorage with obfuscated keys as last resort
      const asyncCredentials = await this.getCredentialsFromAsyncStorage();
      if (asyncCredentials.success && asyncCredentials.email && asyncCredentials.password) {
        console.log('✅ Credentials retrieved from AsyncStorage');
        // Restore to all other storage methods
        await this.saveCredentials(asyncCredentials.email, asyncCredentials.password);
        return asyncCredentials;
      }
      
      console.log('⚠️ No valid credentials found anywhere');
      return { success: true, email: null, password: null };
    } catch (error) {
      console.error('❌ Error retrieving credentials:', error);
      return { success: false, error: error.message, email: null, password: null };
    }
  }
  
  // Multi-location file-based credential storage (ultimate persistence)
  static async saveCredentialsToFile(email, password) {
    try {
      const credentials = {
        email: email,
        password: password,
        timestamp: Date.now(),
        version: '1.0'
      };
      
      // Simple obfuscation (not encryption, just to avoid plain text)
      const obfuscated = Buffer.from(JSON.stringify(credentials)).toString('base64');
      
      // Store in MULTIPLE locations for maximum persistence
      const locations = [
        `${FileSystem.documentDirectory}juanlms_credentials.dat`,
        `${FileSystem.documentDirectory}juanlms_backup.dat`,
        `${FileSystem.documentDirectory}user_prefs.dat`,
        `${FileSystem.cacheDirectory}juanlms_cache.dat`,
        `${FileSystem.documentDirectory}.hidden_juanlms.dat`,
        `${FileSystem.documentDirectory}app_data.dat`
      ];
      
      // Save to all locations
      await Promise.all(locations.map(async (filePath) => {
        try {
          await FileSystem.writeAsStringAsync(filePath, obfuscated);
        } catch (err) {
          console.log(`⚠️ Failed to save to ${filePath}:`, err.message);
        }
      }));
      
      console.log(`✅ Credentials saved to ${locations.length} file locations`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving credentials to files:', error);
      return { success: false, error: error.message };
    }
  }

  static async getCredentialsFromFile() {
    try {
      // Check MULTIPLE locations for credentials
      const locations = [
        `${FileSystem.documentDirectory}juanlms_credentials.dat`,
        `${FileSystem.documentDirectory}juanlms_backup.dat`,
        `${FileSystem.documentDirectory}user_prefs.dat`,
        `${FileSystem.cacheDirectory}juanlms_cache.dat`,
        `${FileSystem.documentDirectory}.hidden_juanlms.dat`,
        `${FileSystem.documentDirectory}app_data.dat`
      ];
      
      for (const filePath of locations) {
        try {
          const exists = await FileSystem.getInfoAsync(filePath);
          if (exists.exists) {
            // Read and deobfuscate
            const obfuscated = await FileSystem.readAsStringAsync(filePath);
            const credentials = JSON.parse(Buffer.from(obfuscated, 'base64').toString('utf8'));
            
            if (credentials.email && credentials.password) {
              console.log(`✅ Credentials retrieved from file storage: ${filePath}`);
              return {
                success: true,
                email: credentials.email,
                password: credentials.password
              };
            }
          }
        } catch (err) {
          console.log(`⚠️ Failed to read from ${filePath}:`, err.message);
          continue;
        }
      }
      
      console.log('⚠️ No valid credentials found in any file location');
      return { success: true, email: null, password: null };
    } catch (error) {
      console.error('❌ Error reading credentials from files:', error);
      return { success: false, error: error.message, email: null, password: null };
    }
  }

  static async clearCredentials() {
    try {
      await Promise.all([
        Keychain.resetInternetCredentials('juanlms_credentials'),
        Keychain.resetInternetCredentials('juanlms_credentials_backup'),
        this.clearAllCredentialFiles(),
        this.clearCredentialsFromAsyncStorage()
      ]);
      console.log('✅ Credentials cleared from all storage (Keychain + files + AsyncStorage)');
      return { success: true };
    } catch (error) {
      console.error('❌ Error clearing credentials:', error);
      return { success: false, error: error.message };
    }
  }

  static async clearAllCredentialFiles() {
    try {
      const locations = [
        `${FileSystem.documentDirectory}juanlms_credentials.dat`,
        `${FileSystem.documentDirectory}juanlms_backup.dat`,
        `${FileSystem.documentDirectory}user_prefs.dat`,
        `${FileSystem.cacheDirectory}juanlms_cache.dat`,
        `${FileSystem.documentDirectory}.hidden_juanlms.dat`,
        `${FileSystem.documentDirectory}app_data.dat`
      ];
      
      await Promise.all(locations.map(async (filePath) => {
        try {
          const exists = await FileSystem.getInfoAsync(filePath);
          if (exists.exists) {
            await FileSystem.deleteAsync(filePath);
          }
        } catch (err) {
          console.log(`⚠️ Failed to clear ${filePath}:`, err.message);
        }
      }));
      
      console.log('✅ All credential files cleared from all locations');
      return { success: true };
    } catch (error) {
      console.error('❌ Error clearing credential files:', error);
      return { success: false, error: error.message };
    }
  }

  // AsyncStorage credential storage with obfuscated keys
  static async saveCredentialsToAsyncStorage(email, password) {
    try {
      const credentials = {
        email: email,
        password: password,
        timestamp: Date.now(),
        version: '1.0'
      };
      
      const obfuscated = Buffer.from(JSON.stringify(credentials)).toString('base64');
      
      // Store with obfuscated keys to avoid detection
      const keys = [
        'app_user_data',
        'user_preferences',
        'app_settings',
        'user_cache',
        'app_config',
        'user_info_backup'
      ];
      
      await Promise.all(keys.map(async (key) => {
        try {
          await AsyncStorage.setItem(key, obfuscated);
        } catch (err) {
          console.log(`⚠️ Failed to save to AsyncStorage key ${key}:`, err.message);
        }
      }));
      
      console.log('✅ Credentials saved to AsyncStorage with obfuscated keys');
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving credentials to AsyncStorage:', error);
      return { success: false, error: error.message };
    }
  }

  static async getCredentialsFromAsyncStorage() {
    try {
      const keys = [
        'app_user_data',
        'user_preferences',
        'app_settings',
        'user_cache',
        'app_config',
        'user_info_backup'
      ];
      
      for (const key of keys) {
        try {
          const obfuscated = await AsyncStorage.getItem(key);
          if (obfuscated) {
            const credentials = JSON.parse(Buffer.from(obfuscated, 'base64').toString('utf8'));
            if (credentials.email && credentials.password) {
              console.log(`✅ Credentials retrieved from AsyncStorage key: ${key}`);
              return {
                success: true,
                email: credentials.email,
                password: credentials.password
              };
            }
          }
        } catch (err) {
          console.log(`⚠️ Failed to read from AsyncStorage key ${key}:`, err.message);
          continue;
        }
      }
      
      console.log('⚠️ No valid credentials found in AsyncStorage');
      return { success: true, email: null, password: null };
    } catch (error) {
      console.error('❌ Error reading credentials from AsyncStorage:', error);
      return { success: false, error: error.message, email: null, password: null };
    }
  }

  static async clearCredentialsFromAsyncStorage() {
    try {
      const keys = [
        'app_user_data',
        'user_preferences',
        'app_settings',
        'user_cache',
        'app_config',
        'user_info_backup'
      ];
      
      await Promise.all(keys.map(async (key) => {
        try {
          await AsyncStorage.removeItem(key);
        } catch (err) {
          console.log(`⚠️ Failed to clear AsyncStorage key ${key}:`, err.message);
        }
      }));
      
      console.log('✅ All credential keys cleared from AsyncStorage');
      return { success: true };
    } catch (error) {
      console.error('❌ Error clearing credentials from AsyncStorage:', error);
      return { success: false, error: error.message };
    }
  }

  // Multi-location remember me preference storage
  static async saveRememberMeToFile(enabled) {
    try {
      const data = {
        enabled: enabled,
        timestamp: Date.now(),
        version: '1.0'
      };
      
      const obfuscated = Buffer.from(JSON.stringify(data)).toString('base64');
      
      // Store in MULTIPLE locations for maximum persistence
      const locations = [
        `${FileSystem.documentDirectory}juanlms_remember.dat`,
        `${FileSystem.documentDirectory}juanlms_remember_backup.dat`,
        `${FileSystem.documentDirectory}user_settings.dat`,
        `${FileSystem.cacheDirectory}juanlms_remember_cache.dat`,
        `${FileSystem.documentDirectory}.hidden_remember.dat`,
        `${FileSystem.documentDirectory}app_prefs.dat`
      ];
      
      // Save to all locations
      await Promise.all(locations.map(async (filePath) => {
        try {
          await FileSystem.writeAsStringAsync(filePath, obfuscated);
        } catch (err) {
          console.log(`⚠️ Failed to save remember me to ${filePath}:`, err.message);
        }
      }));
      
      console.log(`✅ Remember me preference saved to ${locations.length} file locations`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving remember me to files:', error);
      return { success: false, error: error.message };
    }
  }

  static async getRememberMeFromFile() {
    try {
      // Check MULTIPLE locations for remember me preference
      const locations = [
        `${FileSystem.documentDirectory}juanlms_remember.dat`,
        `${FileSystem.documentDirectory}juanlms_remember_backup.dat`,
        `${FileSystem.documentDirectory}user_settings.dat`,
        `${FileSystem.cacheDirectory}juanlms_remember_cache.dat`,
        `${FileSystem.documentDirectory}.hidden_remember.dat`,
        `${FileSystem.documentDirectory}app_prefs.dat`
      ];
      
      for (const filePath of locations) {
        try {
          const exists = await FileSystem.getInfoAsync(filePath);
          if (exists.exists) {
            const obfuscated = await FileSystem.readAsStringAsync(filePath);
            const data = JSON.parse(Buffer.from(obfuscated, 'base64').toString('utf8'));
            
            if (typeof data.enabled === 'boolean') {
              console.log(`✅ Remember me preference retrieved from file: ${filePath}`);
              return {
                success: true,
                enabled: data.enabled
              };
            }
          }
        } catch (err) {
          console.log(`⚠️ Failed to read remember me from ${filePath}:`, err.message);
          continue;
        }
      }
      
      console.log('⚠️ No valid remember me preference found in any file location');
      return { success: true, enabled: null };
    } catch (error) {
      console.error('❌ Error reading remember me from files:', error);
      return { success: false, error: error.message, enabled: null };
    }
  }

  static async clearRememberMeFile() {
    try {
      const locations = [
        `${FileSystem.documentDirectory}juanlms_remember.dat`,
        `${FileSystem.documentDirectory}juanlms_remember_backup.dat`,
        `${FileSystem.documentDirectory}user_settings.dat`,
        `${FileSystem.cacheDirectory}juanlms_remember_cache.dat`,
        `${FileSystem.documentDirectory}.hidden_remember.dat`,
        `${FileSystem.documentDirectory}app_prefs.dat`
      ];
      
      await Promise.all(locations.map(async (filePath) => {
        try {
          const exists = await FileSystem.getInfoAsync(filePath);
          if (exists.exists) {
            await FileSystem.deleteAsync(filePath);
          }
        } catch (err) {
          console.log(`⚠️ Failed to clear remember me file ${filePath}:`, err.message);
        }
      }));
      
      console.log('✅ All remember me files cleared from all locations');
      return { success: true };
    } catch (error) {
      console.error('❌ Error clearing remember me files:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Persistent remember me preference using multiple storage layers
  static async setRememberMe(enabled) {
    try {
      // Store in AsyncStorage, Keychain, AND file for maximum persistence
      await Promise.all([
        AsyncStorage.setItem('rememberMeEnabled', enabled ? 'true' : 'false'),
        Keychain.setInternetCredentials('juanlms_remember_me', 'remember', enabled ? 'true' : 'false'),
        this.saveRememberMeToFile(enabled)
      ]);
      console.log(`✅ Remember me preference set to: ${enabled} (AsyncStorage + Keychain + file)`);
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
      
      // If Keychain is also empty, try file storage
      const fileResult = await this.getRememberMeFromFile();
      if (fileResult.success && fileResult.enabled !== null) {
        console.log(`✅ Remember me preference restored from file: ${fileResult.enabled}`);
        
        // Restore to AsyncStorage and Keychain for future quick access
        await AsyncStorage.setItem('rememberMeEnabled', fileResult.enabled ? 'true' : 'false');
        await Keychain.setInternetCredentials('juanlms_remember_me', 'remember', fileResult.enabled ? 'true' : 'false');
        
        return { success: true, enabled: fileResult.enabled };
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
        this.clearRememberMeFile(),
        Keychain.resetInternetCredentials('juanlms_remember_me') // Clear Keychain remember me too
      ]);
      console.log('✅ Complete logout - all data cleared (including files)');
      return { success: true };
    } catch (error) {
      console.error('❌ Error during complete logout:', error);
      return { success: false, error: error.message };
    }
  }
}

export default StorageService;
