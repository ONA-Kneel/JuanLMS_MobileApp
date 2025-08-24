import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MyStyles from './styles/MyStyles';

export default function SplashScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 2000); // Navigate to Login after 2 seconds

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={[MyStyles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }]}>
      <Image 
        source={require('../assets/JuanLMS-LogoV1.png')} 
        style={{ width: 200, height: 200, marginBottom: 20 }}
        resizeMode="contain"
      />
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#007AFF' }}>JuanLMS</Text>
      <Text style={{ fontSize: 16, marginTop: 10, color: '#666' }}>Loading...</Text>
      <StatusBar style="auto" />
    </View>
  );
}