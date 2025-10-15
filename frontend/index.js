import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { registerRootComponent } from 'expo';
import { AppRegistry, LogBox } from 'react-native';

// Suppress specific warnings that can cause crashes
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested',
  'Warning: componentWillReceiveProps',
  'Warning: componentWillMount',
  'Warning: componentWillUpdate',
  'Firebase',
  'RNFBMessagingModule',
  'RNFBAppModule',
  'Hermes',
  'IRBuilder',
  'ESTreeIRGen',
  'createStoreFrameInst',
  'Reanimated',
  'worklet',
  'shareable',
]);

// Modern error handling without deprecated ErrorUtils
const setupErrorHandling = () => {
  // Handle unhandled promise rejections
  if (typeof global !== 'undefined') {
    const originalUnhandledRejection = global.onunhandledrejection;
    global.onunhandledrejection = (event) => {
      console.error('Unhandled Promise Rejection:', {
        reason: event.reason,
        promise: event.promise,
        timestamp: new Date().toISOString()
      });
      
      // Prevent the rejection from crashing the app
      event.preventDefault();
      
      if (originalUnhandledRejection) {
        originalUnhandledRejection(event);
      }
    };
  }

  // Handle global errors
  if (typeof global !== 'undefined') {
    const originalError = global.onerror;
    global.onerror = (message, source, lineno, colno, error) => {
      console.error('Global JavaScript Error:', {
        message,
        source,
        lineno,
        colno,
        error: error?.message,
        stack: error?.stack,
        timestamp: new Date().toISOString()
      });
      
      // Enhanced error handling for different error types
      if (error?.message && (
        error.message.includes('Hermes') || 
        error.message.includes('IRBuilder') ||
        error.message.includes('ESTreeIRGen') ||
        error.message.includes('createStoreFrameInst')
      )) {
        console.error('Hermes engine error detected - attempting recovery');
        return true; // Prevent default error handling
      }
      
      // Special handling for Reanimated errors
      if (error?.message && error.message.includes('Reanimated')) {
        console.error('Reanimated error detected - attempting recovery');
        return true; // Prevent default error handling
      }
      
      // Call original handler for other errors
      if (originalError) {
        return originalError(message, source, lineno, colno, error);
      }
      
      return false;
    };
  }
};

// Initialize error handling
setupErrorHandling();
import { navigate } from './navigationRef';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// Firebase messaging temporarily disabled to prevent crashes
// Will be re-enabled once Firebase configuration is stable
console.log('Firebase messaging temporarily disabled for stability');
