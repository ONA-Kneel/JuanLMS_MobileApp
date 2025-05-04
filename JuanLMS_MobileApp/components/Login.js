import React, { useState } from 'react';
import {
  Alert,
  Text,
  TouchableOpacity,
  View,
  Image,
  TextInput,
  ImageBackground
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LoginStyle from './styles/LoginStyle';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CheckBox } from 'react-native-web';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  const btnLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password.');
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
        Alert.alert('Success', 'Login successful!');

        // Decode JWT token to extract role
        const tokenPayload = JSON.parse(atob(data.token.split('.')[1]));
        const role = tokenPayload.role;

        // Navigate to appropriate screen
        switch (role) {
          case 'student':
            navigation.navigate('SDash');
            break;
          case 'faculty':
            navigation.navigate('FDash');
            break;
          case 'admin':
            navigation.navigate('ADash');
            break;
          case 'parent':
            navigation.navigate('PDash');
            break;
          case 'director':
            navigation.navigate('DDash');
            break;
          default:
            Alert.alert('Error', 'Unknown role!');
            break;
        }

        // Optionally store token
        // await AsyncStorage.setItem('token', data.token);
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid email or password');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while logging in.');
    }
  };

  return (
    <View>
      <ImageBackground
        source={require('../assets/JuanLMS - bg.png')}
        style={LoginStyle.background}
        resizeMode="cover"
      >
        <Image source={require('../assets/Logo4.svg')} style={LoginStyle.logo} />
        <Text style={LoginStyle.text1}>
          Where faith and reason are expressed in Charity
        </Text>

        <View style={LoginStyle.loginContainer}>
          <Text style={LoginStyle.loginTitle}>Login</Text>

          <TextInput
            style={LoginStyle.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View style={LoginStyle.passwordContainer}>
            <TextInput
              style={LoginStyle.input}
              placeholder="Password"
              value={password}
              secureTextEntry={!showPassword}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon name={showPassword ? 'eye-off' : 'eye'} size={20} />
            </TouchableOpacity>
          </View>

          <View style={LoginStyle.rememberContainer}>
            <CheckBox
              value={rememberMe}
              onValueChange={setRememberMe}
            />
            <Text style={LoginStyle.rememberText}>Remember Me</Text>
            <TouchableOpacity>
              <Text style={LoginStyle.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={btnLogin} style={LoginStyle.loginButton}>
            <Text style={LoginStyle.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}