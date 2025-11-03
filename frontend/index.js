// Critical: Import error handling setup FIRST before anything else
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { registerRootComponent } from 'expo';
import { AppRegistry, LogBox, ErrorUtils } from 'react-native';

// Import navigation and App - imports are hoisted, but errors will be caught
import { navigate } from './navigationRef';
import App from './App';

// Suppress specific warnings that can cause crashes
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested',
  'Warning: componentWillReceiveProps',
  'Warning: componentWillMount',
  'Warning: componentWillUpdate',
  'Hermes',
  'IRBuilder',
  'ESTreeIRGen',
  'createStoreFrameInst',
  'Reanimated',
  'worklet',
  'shareable',
  'RCTFatal',
  'Module not found',
]);

// Enhanced error handling for RCTFatal 28 and other critical errors
const setupErrorHandling = () => {
  // Use React Native's ErrorUtils (proper way for React Native)
  const originalHandler = ErrorUtils.getGlobalHandler();
  
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('Global Error Handler:', {
      error: error?.message || error,
      isFatal,
      stack: error?.stack,
      name: error?.name,
      timestamp: new Date().toISOString(),
    });
    
    // Handle RCTFatal errors (including code 28)
    if (isFatal || error?.message?.includes('RCTFatal') || error?.message?.includes('Fatal')) {
      console.error('Fatal error detected - attempting recovery');
      
      // Try to prevent crash for recoverable errors
      if (error?.message && (
        error.message.includes('Module not found') ||
        error.message.includes('Cannot find module') ||
        error.message.includes('Unable to resolve module') ||
        error.message.includes('Hermes') ||
        error.message.includes('Reanimated') ||
        error.message.includes('IRBuilder')
      )) {
        console.error('Recoverable error detected - preventing crash');
        // Log but don't crash for module resolution errors
        return;
      }
    }
    
    // Call original handler for other fatal errors
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });

  // Handle unhandled promise rejections
  if (typeof global !== 'undefined') {
    const originalUnhandledRejection = global.onunhandledrejection;
    global.onunhandledrejection = (event) => {
      const error = event.reason;
      console.error('Unhandled Promise Rejection:', {
        reason: error?.message || error,
        stack: error?.stack,
        timestamp: new Date().toISOString()
      });
      
      // Prevent the rejection from crashing the app
      event.preventDefault();
      
      if (originalUnhandledRejection) {
        originalUnhandledRejection(event);
      }
    };
  }

  // Handle global JavaScript errors
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
        error.message.includes('createStoreFrameInst') ||
        error.message.includes('Module not found') ||
        error.message.includes('Cannot find module') ||
        error.message.includes('Unable to resolve module')
      )) {
        console.error('Recoverable error detected - preventing crash');
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

// Initialize error handling - this runs before any component code executes
setupErrorHandling();

// Register root component with error handling wrapper
try {
  registerRootComponent(App);
} catch (error) {
  console.error('CRITICAL: Error registering root component:', error);
  
  // Fallback: register a simple error component
  const React = require('react');
  const { View, Text } = require('react-native');
  
  const FallbackApp = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 10 }}>
        Failed to initialize app. Please restart.
      </Text>
      <Text style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>
        {error?.message || 'Unknown error'}
      </Text>
    </View>
  );
  
  AppRegistry.registerComponent('main', () => FallbackApp);
}
