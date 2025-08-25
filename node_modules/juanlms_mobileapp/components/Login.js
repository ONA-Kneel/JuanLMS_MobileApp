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

// ---- Hermes-safe atob polyfill (JWT decode) ----
import { decode as atob } from 'base-64';
if (!global.atob) global.atob = atob;
// ------------------------------------------------

const BACKEND_URL = 'https://juanlms-webapp-server.onrender.com/login';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownTimer, setCooldownTimer] = useState(0);
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
      if (attempts) setFailedAttempts(parseInt(attempts, 10));
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

  const btnLogin = async () => {
    if (isCooldown) {
      showToast(`Please wait ${cooldownTimer} seconds before trying again.`, 'error');
      return;
    }
    if (!email.trim() || !password.trim()) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    try {
      const loginUrl = BACKEND_URL;
      const response = await fetch(loginUrl, {
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

        const tokenPayload = JSON.parse(atob(data.token.split('.')[1]));
        const role = tokenPayload.role;
        const userId = tokenPayload.id;

        // fetch user
        const userRes = await fetch(`${loginUrl.replace('/login', '')}/users/${userId}`, {
          headers: { 'Authorization': `Bearer ${data.token}`, 'Content-Type': 'application/json' }
        });
        if (!userRes.ok) throw new Error(`Failed to fetch user data: ${userRes.status}`);
        const userData = await userRes.json();

        await setUserAndToken(userData, data.token);

        await addAuditLog({
          userId: userData._id,
          userName: `${userData.firstname} ${userData.lastname}`,
          userRole: role,
          action: 'Login',
          details: `User ${userData.email} logged in.`,
          timestamp: new Date().toISOString(),
        });

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
        if (targetRoute) navigation.navigate(targetRoute);
        else showToast(`Unknown role: ${role}. Please contact administrator.`, 'error');
      } else {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        await AsyncStorage.setItem('failedAttempts', String(newAttempts));

        if (newAttempts >= 3) {
          const cooldownSeconds = 30; // your message says 2 mins; adjust if desired
          await AsyncStorage.setItem('cooldownEndTime', String(Date.now() + cooldownSeconds * 1000));
          startCooldown(cooldownSeconds);
          showToast('Too many failed attempts. Wait 2 minutes.', 'error');
        } else {
          showToast(data.message || 'Invalid email or password', 'error');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      showToast('An error occurred while logging in. Please check your connection.', 'error');
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

        <TouchableOpacity
          onPress={btnLogin}
          style={[LoginStyle.loginButton, isCooldown && { backgroundColor: 'gray' }]}
          disabled={isCooldown}
        >
          <Text style={LoginStyle.loginButtonText}>
            {isCooldown ? `Locked (${cooldownTimer}s)` : 'Login'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
