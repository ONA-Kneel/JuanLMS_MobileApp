import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, Image, TextInput, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LoginStyle from './styles/LoginStyle';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CheckBox } from 'react-native-web';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-root-toast';
import { useUser } from './UserContext';
import { addAuditLog } from './Admin/auditTrailUtils';

export default function Login() {
  //mema commit na lang para lang may kulay ako today
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownTimer, setCooldownTimer] = useState(0);
  const navigation = useNavigation();
  const { setUser } = useUser();

  useEffect(() => {
    const loadLockoutState = async () => {
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
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        setFailedAttempts(0);
        await AsyncStorage.setItem('failedAttempts', '0');
        showToast('Login successful!', 'success');

        const tokenPayload = JSON.parse(atob(data.token.split('.')[1]));
        const role = tokenPayload.role;
        const userId = tokenPayload.id;

        // Fetch user data
        const userRes = await fetch(`http://localhost:5000/users/${userId}`);
        const userData = await userRes.json();
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        // Add audit log for login
        await addAuditLog({
          userId: userData._id,
          userName: userData.firstname + ' ' + userData.lastname,
          userRole: role,
          action: 'Login',
          details: `User ${userData.email} logged in.`,
          timestamp: new Date().toISOString(),
        });

        switch (role) {
          case 'student': navigation.navigate('SDash'); break;
          case 'faculty': navigation.navigate('FDash'); break;
          case 'admin': navigation.navigate('ADash'); break;
          case 'parent': navigation.navigate('PDash'); break;
          case 'director': navigation.navigate('DDash'); break;
          default: showToast('Unknown role!', 'error'); break;
        }
      } else {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        await AsyncStorage.setItem('failedAttempts', newAttempts.toString());

        if (newAttempts >= 3) {
          const cooldownSeconds = 120;
          const cooldownEndTime = Date.now() + cooldownSeconds * 1000;
          await AsyncStorage.setItem('cooldownEndTime', cooldownEndTime.toString());
          startCooldown(cooldownSeconds);
          showToast('Too many failed attempts. Wait 2 minutes.', 'error');
        } else {
          showToast(data.message || 'Invalid email or password', 'error');
        }
      }
    } catch (error) {
      console.error(error);
      showToast('An error occurred while logging in.', 'error');
    }
  };

  return (
    <View>
      <ImageBackground
        source={require('../assets/JuanLMS - bg.png')}
        style={LoginStyle.background}
        resizeMode="cover"
      >
        <View style={LoginStyle.logoContainer}>
          <Image source={require('../assets/LOGO.svg')} style={LoginStyle.logo} />
          <Text style={LoginStyle.text1}>Where faith and reason are expressed</Text>
          <Text style={LoginStyle.text1}>in Charity</Text>
        </View>

        <View style={LoginStyle.loginContainer}>
          <Text style={LoginStyle.loginTitle}>Login</Text>

          <Text style={LoginStyle.label}>Email</Text>
          <TextInput
            style={LoginStyle.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#999"
          />

          <Text style={LoginStyle.label}>Password</Text>
          <View style={LoginStyle.passwordContainer}>
            <TextInput
              style={LoginStyle.passwordInput}
              placeholder="Password"
              value={password}
              secureTextEntry={!showPassword}
              onChangeText={setPassword}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={LoginStyle.eyeIcon}
              activeOpacity={0.7}
            >
              <Icon
                name={showPassword ? 'eye-off' : 'eye'}
                size={24}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          <View style={LoginStyle.rememberContainer}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center' }}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <CheckBox
                value={rememberMe}
                onValueChange={setRememberMe}
              />
              <Text style={LoginStyle.rememberText}>Remember Me</Text>

              <TouchableOpacity style={{ marginLeft: 'auto' }}>
              <Text style={LoginStyle.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
            
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
      </ImageBackground>
    </View>
  );
}