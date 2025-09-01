import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MyStyles from './styles/MyStyles';

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
        // Add extra safety checks
        if (!navigation) {
          throw new Error('Navigation object is null');
        }
        
        console.log('🔄 Attempting navigation.replace...');
        console.log('🎯 Target screen: Login');
        navigation.replace('Login');
        console.log('✅ Navigation successful');
        
      } catch (error) {
        console.error('❌ Navigation failed:', error);
        console.error('❌ Error stack:', error.stack);
        setError(error.message);
        
        // Show user-friendly error
        Alert.alert(
          'Navigation Error', 
          `Failed to navigate: ${error.message}`,
          [
            {
              text: 'Try Again',
              onPress: () => {
                try {
                  console.log('🔄 Retry navigation...');
                  navigation.navigate('Login');
                } catch (e) {
                  console.error('Second navigation attempt failed:', e);
                }
              }
            }
          ]
        );
      }
    }, 3000);

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