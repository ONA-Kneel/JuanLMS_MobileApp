import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TestLogin() {
  console.log('🧪 TestLogin component rendering...');
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Test Login Screen</Text>
      <Text style={styles.subtext}>If you can see this, the navigation is working!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a1a4f',
  },
  text: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
});

