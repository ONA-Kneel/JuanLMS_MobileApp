import { registerRootComponent } from 'expo';
import messaging from '@react-native-firebase/messaging';
import { navigate } from './navigationRef';

// Initialize Firebase before importing App
import './config/firebase';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// Background/quit state message handler (must be in the entry file)
messaging().setBackgroundMessageHandler(async remoteMessage => {
  try {
    console.log('Background FCM message:', remoteMessage);
    // Perform background processing if needed
  } catch (error) {
    console.log('Background handler error:', error);
  }
});

// When the app is opened from a background state by tapping a notification
messaging().onNotificationOpenedApp(remoteMessage => {
  try {
    const screen = remoteMessage?.data?.screen;
    const params = remoteMessage?.data?.params ? JSON.parse(remoteMessage.data.params) : undefined;
    if (screen) navigate(screen, params);
  } catch (e) {
    console.log('onNotificationOpenedApp navigation error:', e);
  }
});

// When the app is opened from a quit state by tapping a notification
messaging()
  .getInitialNotification()
  .then(remoteMessage => {
    if (remoteMessage) {
      try {
        const screen = remoteMessage?.data?.screen;
        const params = remoteMessage?.data?.params ? JSON.parse(remoteMessage.data.params) : undefined;
        if (screen) navigate(screen, params);
      } catch (e) {
        console.log('getInitialNotification navigation error:', e);
      }
    }
  })
  .catch(e => console.log('getInitialNotification error:', e));
