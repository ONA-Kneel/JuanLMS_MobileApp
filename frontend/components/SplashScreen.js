import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MyStyles from './styles/MyStyles';
import StorageService from '../services/storageService';

export default function SplashScreen() {
  const navigation = useNavigation();
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    console.log('✅ SplashScreen mounted successfully');
    console.log('🔍 Navigation object:', !!navigation);
    console.log('🌍 API URL:', process.env.EXPO_PUBLIC_API_URL);
    console.log('📱 Platform:', Platform.OS);
    console.log('🔧 Environment:', __DEV__ ? 'Development' : 'Production');
    
    // Countdown display
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        console.log('⏱️ Countdown:', prev);
        return prev - 1;
      });
    }, 1000);
    
    const timer = setTimeout(async () => {
      console.log('⏰ Timer fired - attempting navigation');
      try {
        if (!navigation) {
          throw new Error('Navigation object is null');
        }

        // Check for cache clearing and get auth data
        const cacheResult = await StorageService.detectCacheClearing();
        const authResult = await StorageService.getAuthData();
        const rememberResult = await StorageService.getRememberMe();
        
        const user = authResult.user;
        const token = authResult.token;
        const remember = rememberResult.enabled;

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

        // Auto-enter if remember me is enabled and we have valid auth data
        const canAutoEnter = remember && !!token && !!user && !!user.role;
        if (canAutoEnter) {
          const target = roleNavigationMap[user.role];
          if (target) {
            console.log('🔐 Auto-enter with remember me. Role:', user.role, '→', target);
            navigation.reset({ index: 0, routes: [{ name: target }] });
            return;
          }
        }

        // If cache was cleared but remember me is still enabled, go to login for auto-login
        if (cacheResult.wasCleared && remember) {
          if (cacheResult.restored) {
            console.log('✅ Cache clearing detected but credentials restored - going to login for auto-login');
          } else {
            console.log('⚠️ Cache clearing detected but remember me enabled - going to login for auto-login');
          }
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }

        console.log('🎯 Fallback to Login');
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      } catch (error) {
        console.error('❌ Navigation failed:', error);
        console.error('❌ Error stack:', error.stack);
        setError(error.message);
        Alert.alert('Navigation Error', `Failed to navigate: ${error.message}`);
      }
    }, 1500);

    return () => {
      console.log('🧹 SplashScreen cleanup');
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [navigation]);

  return (
    <View style={[MyStyles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }]}>
      <Image 
        source={require('../assets/JuanLMS-LogoV1.png')} 
        style={{ width: 200, height: 200, marginBottom: 20 }}
        resizeMode="contain"
      />
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#007AFF' }}>JuanLMS</Text>
      <Text style={{ fontSize: 16, marginTop: 10, color: '#666' }}>
        Loading... {countdown > 0 ? countdown : 'Navigating...'}
      </Text>
      {error && (
        <Text style={{ fontSize: 14, marginTop: 20, color: 'red', textAlign: 'center' }}>
          Runtime Error: {error}
        </Text>
      )}
      <StatusBar style="auto" />
    </View>
  );
}