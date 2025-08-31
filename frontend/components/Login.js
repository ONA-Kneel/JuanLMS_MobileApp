// Login.js
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, Image, TextInput, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LoginStyle from './styles/LoginStyle';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-root-toast';
import { useUser } from './UserContext';
import { addAuditLog } from './Admin/auditTrailUtils';

<<<<<<< HEAD
// ---- Hermes-safe atob polyfill (JWT decode) ----
import { decode as atob } from 'base-64';
if (!global.atob) global.atob = atob;
// ------------------------------------------------

const BACKEND_URL = 'https://juanlms-webapp-server.onrender.com/login';
=======
// Set your public backend URL here (replace with your actual deployed backend URL)
const BACKEND_URL = 'https://juanlms-webapp-server.onrender.com/login'; // Update this to your actual backend URL
const STORAGE_KEYS = {
  remember: 'rememberMeEnabled',
  email: 'savedEmail',
  password: 'savedPassword',
};
>>>>>>> main

export default function Login() {
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
  const navigation = useNavigation();
  const { setUserAndToken } = useUser();

  useEffect(() => {
    const loadLockoutState = async () => {
      const attempts = await AsyncStorage.getItem('failedAttempts');
      const cooldownEnd = await AsyncStorage.getItem('cooldownEndTime');
      const now = Date.now();

      if (cooldownEnd && parseInt(cooldownEnd, 10) > now) {
        const remaining = Math.floor((parseInt(cooldownEnd, 10) - now) / 1000);
        startCooldown(remaining);
      }
<<<<<<< HEAD
      if (attempts) setFailedAttempts(parseInt(attempts, 10));
=======

      if (attempts) {
        setFailedAttempts(parseInt(attempts));
      }

      // Load Remember Me preference and optionally credentials
      const savedRemember = await AsyncStorage.getItem(STORAGE_KEYS.remember);
      const isRememberEnabled = savedRemember === 'true';
      setRememberMe(isRememberEnabled);

      if (isRememberEnabled) {
        const savedEmail = await AsyncStorage.getItem(STORAGE_KEYS.email);
        const savedPassword = await AsyncStorage.getItem(STORAGE_KEYS.password);
        if (savedEmail) setEmail(savedEmail);
        if (savedPassword) setPassword(savedPassword);

        // Auto-login if both credentials exist (no artificial delay)
        if (savedEmail && savedPassword) {
          loginWithCredentials(savedEmail, savedPassword);
        }
      }
>>>>>>> main
    };
    loadLockoutState();
  }, []);

  const showToast = (message, type = 'info') => {
    let backgroundColor = '#333';
    if (type === 'error') backgroundColor = '#D9534F';
    if (type === 'success') backgroundColor = '#0275D8';
    Toast.show(message, {
      duration: 5000,
      position: Toast.positions.BOTTOM,
      shadow: true,
      animation: true,
      hideOnPress: true,
      backgroundColor,
      textColor: 'white',
      delay: 0,
    });
  };

  const startCooldown = (duration) => {
    setIsCooldown(true);
    setCooldownTimer(duration);
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
      await AsyncStorage.setItem(STORAGE_KEYS.remember, enabled ? 'true' : 'false');
      if (enabled) {
        if (email) await AsyncStorage.setItem(STORAGE_KEYS.email, email);
        if (password) await AsyncStorage.setItem(STORAGE_KEYS.password, password);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.email);
        await AsyncStorage.removeItem(STORAGE_KEYS.password);
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
        await AsyncStorage.setItem(STORAGE_KEYS.remember, 'true');
        await AsyncStorage.setItem(STORAGE_KEYS.email, currentEmail);
        await AsyncStorage.setItem(STORAGE_KEYS.password, currentPassword);
      } else {
        await AsyncStorage.setItem(STORAGE_KEYS.remember, 'false');
        await AsyncStorage.removeItem(STORAGE_KEYS.email);
        await AsyncStorage.removeItem(STORAGE_KEYS.password);
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
<<<<<<< HEAD
=======

    if (!emailArg.trim() || !passwordArg.trim()) {
      showToast('Please enter both email and password.', 'error');
      setErrorMessage('Please enter both email and password.');
      return;
    }

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

        const tokenPayload = JSON.parse(atob(data.token.split('.')[1]));
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
    }
  };

  const btnLogin = async () => {
    // Block if already disabled by prior triple-click with Remember Me
    if (isCooldown || isDisabledByRememberClicks) {
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

>>>>>>> main
    if (!email.trim() || !password.trim()) {
      showToast('Please enter both email and password.', 'error');
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      const loginUrl = BACKEND_URL;
<<<<<<< HEAD
      const response = await fetch(loginUrl, {
=======
      console.log('Using backend URL:', loginUrl);

      const response = await fetchWithTimeout(loginUrl, {
>>>>>>> main
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password: password.trim() })
      });

      const responseText = await response.text();
      let data;
      try { data = JSON.parse(responseText); }
      catch { showToast('Server error: ' + responseText, 'error'); return; }

      if (response.ok) {
        setFailedAttempts(0);
        await AsyncStorage.setItem('failedAttempts', '0');
        showToast('Login successful!', 'success');
        setErrorMessage('');

        const tokenPayload = JSON.parse(atob(data.token.split('.')[1]));
        const role = tokenPayload.role;
        const userId = tokenPayload.id;

<<<<<<< HEAD
        // fetch user
        const userRes = await fetch(`${loginUrl.replace('/login', '')}/users/${userId}`, {
          headers: { 'Authorization': `Bearer ${data.token}`, 'Content-Type': 'application/json' }
=======
        console.log('Processing login for role:', role);

        // Fetch user data
        console.log('Fetching user data for ID:', userId);
        const userRes = await fetchWithTimeout(`${loginUrl.replace('/login', '')}/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json'
          }
>>>>>>> main
        });
        if (!userRes.ok) throw new Error(`Failed to fetch user data: ${userRes.status}`);
        const userData = await userRes.json();

        await setUserAndToken(userData, data.token);

<<<<<<< HEAD
        await addAuditLog({
          userId: userData._id,
          userName: `${userData.firstname} ${userData.lastname}`,
          userRole: role,
          action: 'Login',
          details: `User ${userData.email} logged in.`,
          timestamp: new Date().toISOString(),
        });
=======
        // Save or clear credentials depending on remember setting
        await saveCredentialsIfRemembered(email.trim().toLowerCase(), password.trim());
>>>>>>> main

        const roleNavigationMap = {
          students: 'SDash',
          faculty: 'FDash',
          admin: 'ADash',
          parent: 'PDash',
          director: 'DDash',
          vpe: 'VPEDash',
          'vice president of education': 'VPEDash',
          vicepresident: 'VPEDash',
          'vice president': 'VPEDash',
          principal: 'PrincipalDash',
        };

        const targetRoute = roleNavigationMap[role];
<<<<<<< HEAD
        if (targetRoute) navigation.navigate(targetRoute);
        else showToast(`Unknown role: ${role}. Please contact administrator.`, 'error');
=======
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
>>>>>>> main
      } else {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        await AsyncStorage.setItem('failedAttempts', String(newAttempts));

        if (newAttempts >= 3) {
          const cooldownSeconds = 30; // your message says 2 mins; adjust if desired
          await AsyncStorage.setItem('cooldownEndTime', String(Date.now() + cooldownSeconds * 1000));
          startCooldown(cooldownSeconds);
          showToast('Too many failed attempts. Wait 2 minutes.', 'error');
          setErrorMessage('Too many failed attempts. Please wait and try again.');
        } else {
          const message = data.message || 'Invalid email or password';
          showToast(message, 'error');
          setErrorMessage(message);
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      showToast('An error occurred while logging in. Please check your connection.', 'error');
      setErrorMessage('An error occurred while logging in. Please check your connection.');
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
          />
          <TouchableOpacity
            onPress={() => setShowPassword(s => !s)}
            style={LoginStyle.eyeIcon}
            activeOpacity={0.7}
          >
            <Icon name={showPassword ? 'eye-off' : 'eye'} size={24} color="#888" />
          </TouchableOpacity>
        </View>

        <View style={LoginStyle.rowBetween}>
<<<<<<< HEAD
          {/* Single pressable to avoid raw text nodes on Android */}
          <Pressable style={LoginStyle.rememberRow} onPress={() => setRememberMe(v => !v)}>
            <View style={LoginStyle.checkbox}>
              {rememberMe && <Icon name="check" size={18} color="#1976d2" />}
            </View>
            <Text style={LoginStyle.rememberText}>Remember Me</Text>
          </Pressable>

          <TouchableOpacity>
            <Text style={LoginStyle.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

=======
          <TouchableOpacity
            style={LoginStyle.rememberRow}
            onPress={onToggleRememberMe}
            activeOpacity={0.7}
          >
            <TouchableOpacity
              onPress={onToggleRememberMe}
              style={LoginStyle.checkbox}
            >
              {rememberMe ? (
                <Icon name="check" size={18} color="#1976d2" />
              ) : null}
            </TouchableOpacity>
            <Text style={LoginStyle.rememberText}>Remember Me</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={LoginStyle.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
        {errorMessage ? (
          <Text style={LoginStyle.errorText}>{errorMessage}</Text>
        ) : null}
>>>>>>> main
        <TouchableOpacity
          onPress={btnLogin}
          style={[
            LoginStyle.loginButton,
            (isCooldown || isDisabledByRememberClicks) && { backgroundColor: 'gray' }
          ]}
          disabled={isCooldown || isDisabledByRememberClicks}
        >
          <Text style={LoginStyle.loginButtonText}>
            {isCooldown
              ? `Locked (${cooldownTimer}s)`
              : isDisabledByRememberClicks
                ? 'Disabled'
                : 'Login'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
