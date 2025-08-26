import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import MyStyles from './styles/MyStyles';

export default function SplashScreen() {
  return (
    <View style={MyStyles.container}>
      <Text style={styles.loadingText}>Loading JuanLMS...</Text>
      <ActivityIndicator size="large" color="#00418b" style={styles.spinner} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingText: {
    fontSize: 18,
    fontFamily: 'Poppins-Regular',
    color: '#333',
    marginBottom: 20,
  },
  spinner: {
    marginTop: 10,
  },
});