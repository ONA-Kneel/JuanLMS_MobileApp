import { registerRootComponent } from 'expo';
import { AppRegistry, LogBox } from 'react-native';

// Suppress specific warnings that can cause crashes
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested',
  'Warning: componentWillReceiveProps',
  'Warning: componentWillMount',
  'Warning: componentWillUpdate',
]);

// Initialize Firebase before importing App
try {
  require('./config/firebase');
} catch (error) {
  console.warn('Firebase initialization failed:', error);
}

import messaging from '@react-native-firebase/messaging';
import { navigate } from './navigationRef';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// Background/quit state message handler (must be in the entry file)
try {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    try {
      console.log('Background FCM message:', remoteMessage);
      // Perform background processing if needed
    } catch (error) {
      console.log('Background handler error:', error);
    }
  });
} catch (error) {
  console.warn('Failed to set background message handler:', error);
}

// When the app is opened from a background state by tapping a notification
try {
  messaging().onNotificationOpenedApp(remoteMessage => {
    try {
      const screen = remoteMessage?.data?.screen;
      const params = remoteMessage?.data?.params ? JSON.parse(remoteMessage.data.params) : undefined;
      if (screen) navigate(screen, params);
    } catch (e) {
      console.log('onNotificationOpenedApp navigation error:', e);
    }
  });
} catch (error) {
  console.warn('Failed to set notification opened app handler:', error);
}

// When the app is opened from a quit state by tapping a notification
try {
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
} catch (error) {
  console.warn('Failed to get initial notification:', error);
}
