import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, Image, TextInput, ImageBackground, Platform, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LoginStyle from './styles/LoginStyle';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-root-toast';
import { useUser } from '../UserContext';
import { addAuditLog } from './Admin/auditTrailUtils';
import StorageService from '../services/storageService';
import { decode } from 'base-64';

// Set your public backend URL here (replace with your actual deployed backend URL)
const BACKEND_URL = 'https://juanlms-webapp-server.onrender.com/login'; // Update this to your actual backend URL

export default function Login() {
  console.log('🔐 Login component rendering...');
  //mema commit na lang para lang may kulay ako today
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownTimer, setCooldownTimer] = useState(0);
  const [rememberClicks, setRememberClicks] = useState(0);
  const [isDisabledByRememberClicks, setIsDisabledByRememberClicks] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const { setUserAndToken } = useUser();

  useEffect(() => {
    console.log('🔐 Login useEffect running...');
    const loadLockoutState = async () => {
      // Load lockout state from AsyncStorage (not affected by cache clearing)
      const attempts = await AsyncStorage.getItem('failedAttempts');
      const cooldownEnd = await AsyncStorage.getItem('cooldownEndTime');
      const currentTime = Date.now();

      if (cooldownEnd && parseInt(cooldownEnd) > currentTime) {
        const remaining = Math.floor((parseInt(cooldownEnd) - currentTime) / 1000);
        startCooldown(remaining);
      }

      if (attempts) {
        setFailedAttempts(parseInt(attempts));
      }

      // Check for cache clearing and load remember me preference
      const cacheResult = await StorageService.detectCacheClearing();
      const rememberResult = await StorageService.getRememberMe();
      const isRememberEnabled = rememberResult.enabled;
      setRememberMe(isRememberEnabled);

      if (isRememberEnabled) {
        // Load credentials from secure storage
        const credentialsResult = await StorageService.getCredentials();
        if (credentialsResult.success && credentialsResult.email && credentialsResult.password) {
          setEmail(credentialsResult.email);
          setPassword(credentialsResult.password);
          
          // Auto-login if credentials exist (even after cache clearing)
          loginWithCredentials(credentialsResult.email, credentialsResult.password);
        } else if (cacheResult.wasCleared && cacheResult.restored) {
          // Credentials were restored from backup, try auto-login
          showToast('Credentials restored. Logging in...', 'success');
        } else if (cacheResult.wasCleared) {
          // If cache was cleared but remember me is still enabled, show message but don't reset
          showToast('App data was cleared. Please log in again.', 'info');
        }
      }
    };

    loadLockoutState();
  }, []);

  const showToast = (message, type = 'info') => {
    let backgroundColor = '#333';
    if (type === 'error') backgroundColor = '#D9534F';      // red
    if (type === 'success') backgroundColor = '#0275D8';     // blue

    Toast.show(message, {
      duration: 5000, // 5 seconds
      position: Toast.positions.BOTTOM,
      shadow: true,
      animation: true,
      hideOnPress: true,
      backgroundColor,
      textColor: 'white',
      delay: 0,
    });
  };

  const startCooldown = (durationInSeconds) => {
    setIsCooldown(true);
    setCooldownTimer(durationInSeconds);

    const interval = setInterval(() => {
      setCooldownTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsCooldown(false);
          setFailedAttempts(0);
          AsyncStorage.removeItem('cooldownEndTime');
          AsyncStorage.setItem('failedAttempts', '0');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const persistRememberPreference = async (enabled) => {
    try {
      await StorageService.setRememberMe(enabled);
      if (enabled && email && password) {
        // Save current credentials to secure storage
        await StorageService.saveCredentials(email, password);
      } else if (!enabled) {
        // Clear credentials from secure storage
        await StorageService.clearCredentials();
      }
    } catch (err) {
      console.error('Persist remember preference error:', err);
    }
  };

  const onToggleRememberMe = async () => {
    const next = !rememberMe;
    setRememberMe(next);
    await persistRememberPreference(next);
  };

  const saveCredentialsIfRemembered = async (currentEmail, currentPassword) => {
    try {
      if (rememberMe) {
        // Save remember me preference and credentials securely
        await StorageService.setRememberMe(true);
        await StorageService.saveCredentials(currentEmail, currentPassword);
      } else {
        // Clear remember me preference and credentials
        await StorageService.setRememberMe(false);
        await StorageService.clearCredentials();
      }
    } catch (err) {
      console.error('Saving credentials error:', err);
    }
  };

  const fetchWithTimeout = async (url, options = {}, timeoutMs = 15000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, { ...options, signal: controller.signal });
      return resp;
    } finally {
      clearTimeout(id);
    }
  };

  const loginWithCredentials = async (emailArg, passwordArg) => {
    // This path avoids the triple-click disable logic and uses provided credentials
    if (isCooldown) {
      showToast(`Please wait ${cooldownTimer} seconds before trying again.`, 'error');
      setErrorMessage(`Please wait ${cooldownTimer} seconds before trying again.`);
      return;
    }

    if (!emailArg.trim() || !passwordArg.trim()) {
      showToast('Please enter both email and password.', 'error');
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const loginUrl = BACKEND_URL;
      const response = await fetchWithTimeout(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          email: emailArg.trim().toLowerCase(), 
          password: passwordArg.trim() 
        })
      });

      let data;
      const responseText = await response.text();
      try { data = JSON.parse(responseText); } catch (_) { showToast('Server error: ' + responseText, 'error'); return; }

      if (response.ok) {
        setFailedAttempts(0);
        await AsyncStorage.setItem('failedAttempts', '0');
        showToast('Login successful!', 'success');
        setErrorMessage('');

        const tokenPayload = JSON.parse(decode(data.token.split('.')[1]));
        const role = tokenPayload.role;
        const userId = tokenPayload.id;

        const userRes = await fetchWithTimeout(`${loginUrl.replace('/login', '')}/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!userRes.ok) throw new Error(`Failed to fetch user data: ${userRes.status}`);
        const userData = await userRes.json();

        await setUserAndToken(userData, data.token);

        // Save or clear credentials depending on remember setting
        await saveCredentialsIfRemembered(emailArg, passwordArg);

        const roleNavigationMap = {
          'students': 'SDash',
          'faculty': 'FDash',
          'admin': 'ADash',
          'parent': 'PDash',
          'director': 'DDash',
          'vpe': 'VPEDash',
          'vice president of education': 'VPEDash',
          'vicepresident': 'VPEDash',
          'vice president': 'VPEDash',
          'principal': 'PrincipalDash'
        };
        const targetRoute = roleNavigationMap[role];
        if (targetRoute) navigation.navigate(targetRoute);

        // Fire-and-forget audit logging after navigation
        addAuditLog({
          userId: userData._id,
          userName: userData.firstname + ' ' + userData.lastname,
          userRole: role,
          action: 'Login',
          details: `User ${userData.email} logged in.`,
          timestamp: new Date().toISOString(),
        }).catch(() => {});
      } else {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        await AsyncStorage.setItem('failedAttempts', newAttempts.toString());
        if (newAttempts >= 3) {
          const cooldownSeconds = 30;
          const cooldownEndTime = Date.now() + cooldownSeconds * 1000;
          await AsyncStorage.setItem('cooldownEndTime', cooldownEndTime.toString());
          startCooldown(cooldownSeconds);
          showToast('Too many failed attempts. Wait 2 minutes.', 'error');
          setErrorMessage('Too many failed attempts. Please wait and try again.');
        } else {
          const message = data.message || 'Invalid email or password';
          showToast(message, 'error');
          setErrorMessage(message);
        }
      }
    } catch (error) {
      console.error('Auto-login error:', error);
      showToast('An error occurred while logging in. Please check your connection.', 'error');
      setErrorMessage('An error occurred while logging in. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const btnLogin = async () => {
    // Block if already disabled by prior triple-click with Remember Me or currently loading
    if (isCooldown || isDisabledByRememberClicks || isLoading) {
      showToast(`Please wait ${cooldownTimer} seconds before trying again.`, 'error');
      setErrorMessage(`Please wait ${cooldownTimer} seconds before trying again.`);
      return;
    }

    // Track Remember Me rapid clicks and disable starting on the third click
    if (rememberMe) {
      const nextClicks = rememberClicks + 1;
      setRememberClicks(nextClicks);
      if (nextClicks === 3) {
        // Disable the button but still allow this very click to proceed
        setIsDisabledByRememberClicks(true);
        showToast('Login disabled due to multiple clicks. Proceeding...', 'error');
      }
    }

    if (!email.trim() || !password.trim()) {
      showToast('Please enter both email and password.', 'error');
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      console.log('Attempting login with:', { 
        email: email.trim().toLowerCase(),
        // Don't log actual password in production
        hasPassword: !!password 
      });

      // Use the public backend URL
      const loginUrl = BACKEND_URL;
      console.log('Using backend URL:', loginUrl);

      const response = await fetchWithTimeout(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password: password.trim() 
        })
      });

      console.log('Response status:', response.status);
      let data;
      const responseText = await response.text();
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Non-JSON response:', responseText);
        showToast('Server error: ' + responseText, 'error');
        return;
      }
      console.log('Response data:', {
        success: !!data.token,
        message: data.message
      });

      if (response.ok) {
        setFailedAttempts(0);
        await AsyncStorage.setItem('failedAttempts', '0');
        showToast('Login successful!', 'success');
        setErrorMessage('');

        const tokenPayload = JSON.parse(decode(data.token.split('.')[1]));
        console.log('Token payload:', {
          role: tokenPayload.role,
          userId: tokenPayload.id
        });

        const role = tokenPayload.role;
        const userId = tokenPayload.id;

        console.log('Processing login for role:', role);

        // Fetch user data
        console.log('Fetching user data for ID:', userId);
        const userRes = await fetchWithTimeout(`${loginUrl.replace('/login', '')}/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!userRes.ok) {
          throw new Error(`Failed to fetch user data: ${userRes.status}`);
        }
        
        const userData = await userRes.json();
        console.log('User data fetched:', {
          id: userData._id,
          role: userData.role,
          email: userData.email,
          firstname: userData.firstname,
          lastname: userData.lastname
        });

        // Ensure we use the MongoDB _id for consistency
        if (!userData._id) {
          console.error('User data missing _id field:', userData);
          throw new Error('Invalid user data received from server');
        }

        await setUserAndToken(userData, data.token);

        // FCM registration removed per request

        // Save or clear credentials depending on remember setting
        await saveCredentialsIfRemembered(email.trim().toLowerCase(), password.trim());

        // Role mapping for navigation
        const roleNavigationMap = {
          'students': 'SDash',
          'faculty': 'FDash',
          'admin': 'ADash',
          'parent': 'PDash',
          'director': 'DDash',
          'vpe': 'VPEDash',
          'vice president of education': 'VPEDash',
          'vicepresident': 'VPEDash',
          'vice president': 'VPEDash',
          'principal': 'PrincipalDash'
        };

        const targetRoute = roleNavigationMap[role];
        if (targetRoute) {
          console.log(`Navigating to ${targetRoute} for role: ${role}`);
          console.log('User data for navigation:', {
            id: userData._id,
            role: userData.role,
            email: userData.email,
            firstname: userData.firstname,
            lastname: userData.lastname
          });
          navigation.navigate(targetRoute);
        } else {
          console.error('Unknown role:', role);
          console.error('Available roles in mapping:', Object.keys(roleNavigationMap));
          showToast(`Unknown role: ${role}. Please contact administrator.`, 'error');
        }

        // Fire-and-forget audit logging after navigation
        addAuditLog({
          userId: userData._id,
          userName: userData.firstname + ' ' + userData.lastname,
          userRole: role,
          action: 'Login',
          details: `User ${userData.email} logged in.`,
          timestamp: new Date().toISOString(),
        }).catch(() => {});
      } else {
        console.error('Login failed:', data.message);
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        await AsyncStorage.setItem('failedAttempts', newAttempts.toString());

        if (newAttempts >= 3) {
          const cooldownSeconds = 30;
          const cooldownEndTime = Date.now() + cooldownSeconds * 1000;
          await AsyncStorage.setItem('cooldownEndTime', cooldownEndTime.toString());
          startCooldown(cooldownSeconds);
          showToast('Too many failed attempts. Wait 2 minutes.', 'error');
          setErrorMessage('Too many failed attempts. Please wait and try again.');
        } else {
          const message = data.message || 'Invalid email or password';
          showToast(message, 'error');
          setErrorMessage(message);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('An error occurred while logging in. Please check your connection.', 'error');
      setErrorMessage('An error occurred while logging in. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={LoginStyle.container}>
      <View style={LoginStyle.topSection}>
        <Image 
          source={require('../assets/JuanLMS-LogoV1.png')} 
          style={LoginStyle.logo} 
          resizeMode="contain"
        />
        <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Text style={LoginStyle.text1}>Where faith and reason are</Text>
          <Text style={LoginStyle.text1}>expressed in Charity</Text>
        </View>
      </View>
      <View style={LoginStyle.card}>
        <Text style={LoginStyle.loginTitle}>Login</Text>
        <Text style={LoginStyle.label}>Email</Text>
        <TextInput
          style={LoginStyle.inputUnderline}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#999"
          editable={!isLoading}
        />
        <Text style={LoginStyle.label}>Password</Text>
        <View style={LoginStyle.passwordContainerUnderline}>
          <TextInput
            style={LoginStyle.passwordInput}
            placeholder="Password"
            value={password}
            secureTextEntry={!showPassword}
            onChangeText={setPassword}
            placeholderTextColor="#999"
            editable={!isLoading}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={LoginStyle.eyeIcon}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off' : 'eye'}
              size={24}
              color="#888"
            />
          </TouchableOpacity>
        </View>
        <View style={LoginStyle.rowBetween}>
          <TouchableOpacity
            style={LoginStyle.rememberRow}
            onPress={onToggleRememberMe}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <TouchableOpacity
              onPress={onToggleRememberMe}
              style={LoginStyle.checkbox}
            >
              {rememberMe && (
                <MaterialCommunityIcons name="check" size={18} color="#1976d2" />
              )}
            </TouchableOpacity>
            <Text style={LoginStyle.rememberText}>Remember Me</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('ForgotPassword')}
            disabled={isLoading}
          >
            <Text style={LoginStyle.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
        {errorMessage && (
          <Text style={LoginStyle.errorText}>{errorMessage}</Text>
        )}
        <TouchableOpacity
          onPress={btnLogin}
          style={[
            LoginStyle.loginButton,
            (isCooldown || isDisabledByRememberClicks || isLoading) && { backgroundColor: 'gray' }
          ]}
          disabled={isCooldown || isDisabledByRememberClicks || isLoading}
        >
          {isLoading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
              <Text style={LoginStyle.loginButtonText}>Connecting...</Text>
            </View>
          ) : (
            <Text style={LoginStyle.loginButtonText}>
              {isCooldown
                ? `Locked (${cooldownTimer}s)`
                : isDisabledByRememberClicks
                  ? 'Disabled'
                  : 'Login'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}