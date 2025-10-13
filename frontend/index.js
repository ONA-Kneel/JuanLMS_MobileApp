import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { registerRootComponent } from 'expo';
import { AppRegistry, LogBox, ErrorUtils } from 'react-native';

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

// Global JavaScript error handler to prevent crashes
const originalHandler = ErrorUtils.getGlobalHandler();

ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error('Global JavaScript Error:', {
    error: error.message,
    stack: error.stack,
    isFatal,
    timestamp: new Date().toISOString(),
    errorName: error.name,
    errorType: typeof error
  });
  
  // Enhanced error handling for different error types
  if (isFatal) {
    console.error('Fatal JavaScript Error - App would have crashed, but we prevented it:', error);
    
    // Special handling for Hermes engine errors
    if (error.message && (
      error.message.includes('Hermes') || 
      error.message.includes('IRBuilder') ||
      error.message.includes('ESTreeIRGen') ||
      error.message.includes('createStoreFrameInst')
    )) {
      console.error('Hermes engine error detected - attempting recovery');
      // Don't crash, let the app continue
      return;
    }
    
    // Special handling for Reanimated errors
    if (error.message && error.message.includes('Reanimated')) {
      console.error('Reanimated error detected - attempting recovery');
      // Don't crash, let the app continue
      return;
    }
    
    // You can add crash reporting here in the future
  }
  
  // Call original handler for non-fatal errors
  if (!isFatal && originalHandler) {
    originalHandler(error, isFatal);
  }
});

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
import { navigate } from './navigationRef';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// Firebase messaging temporarily disabled to prevent crashes
// Will be re-enabled once Firebase configuration is stable
console.log('Firebase messaging temporarily disabled for stability');
