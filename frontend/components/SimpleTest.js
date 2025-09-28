import React from 'react';
import { View, Text } from 'react-native';

export default function SimpleTest() {
  console.log('🔥 SimpleTest rendering...');
  
  return (
    <View style={{ flex: 1, backgroundColor: 'red', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: 'white', fontSize: 30, fontWeight: 'bold' }}>
        SIMPLE TEST
      </Text>
      <Text style={{ color: 'white', fontSize: 16, marginTop: 10 }}>
        If you see this red screen, React Native is working!
      </Text>
    </View>
  );
}
