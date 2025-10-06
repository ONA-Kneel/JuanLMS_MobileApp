import { initializeApp } from '@react-native-firebase/app';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDURM7YmkIs1KEnQZ6bbsOh2RCAKAdAwzo",
  authDomain: "juanlms-pushnotf.firebaseapp.com",
  projectId: "juanlms-pushnotf",
  storageBucket: "juanlms-pushnotf.firebasestorage.app",
  messagingSenderId: "460357912009",
  appId: "1:460357912009:android:0bf527b6a35dac3f14d418"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;
