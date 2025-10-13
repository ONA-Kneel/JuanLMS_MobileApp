import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

class HermesErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      recoveryAttempts: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('HermesErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      isHermesError: this.isHermesRelatedError(error)
    });
    
    this.setState({ 
      error, 
      errorInfo,
      recoveryAttempts: this.state.recoveryAttempts + 1
    });
  }

  isHermesRelatedError = (error) => {
    const errorMessage = error.message || '';
    const errorStack = error.stack || '';
    
    return errorMessage.includes('Hermes') || 
           errorMessage.includes('IRBuilder') ||
           errorMessage.includes('ESTreeIRGen') ||
           errorMessage.includes('createStoreFrameInst') ||
           errorStack.includes('hermes') ||
           errorStack.includes('IRBuilder');
  };

  handleRetry = () => {
    // Reset error state and attempt recovery
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  handleRestart = () => {
    // Force app restart by clearing storage and reloading
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      AsyncStorage.clear().then(() => {
        // This will cause the app to restart
        const { DevSettings } = require('react-native');
        if (DevSettings && DevSettings.reload) {
          DevSettings.reload();
        }
      });
    } catch (error) {
      console.error('Failed to restart app:', error);
    }
  };

  render() {
    if (this.state.hasError) {
      const isHermesError = this.isHermesRelatedError(this.state.error);
      const maxRetries = 3;
      const canRetry = this.state.recoveryAttempts < maxRetries;
      
      return (
        <View style={styles.container}>
          <Text style={styles.title}>
            {isHermesError ? '⚠️ Engine Error Detected' : '⚠️ Something went wrong'}
          </Text>
          
          <Text style={styles.message}>
            {isHermesError 
              ? 'A JavaScript engine error occurred. This is usually temporary and can be resolved by restarting the app.'
              : 'An unexpected error occurred. Please try again.'
            }
          </Text>
          
          {this.state.error && (
            <View style={styles.errorDetails}>
              <Text style={styles.errorText}>
                {this.state.error.message || 'Unknown error occurred'}
              </Text>
            </View>
          )}
          
          <View style={styles.buttonContainer}>
            {canRetry && (
              <TouchableOpacity
                style={styles.button}
                onPress={this.handleRetry}
              >
                <Text style={styles.buttonText}>Try Again</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.button, styles.restartButton]}
              onPress={this.handleRestart}
            >
              <Text style={styles.buttonText}>Restart App</Text>
            </TouchableOpacity>
          </View>
          
          {isHermesError && (
            <Text style={styles.helpText}>
              If this error persists, please restart the app completely or contact support.
            </Text>
          )}
          
          {!canRetry && (
            <Text style={styles.maxRetriesText}>
              Maximum retry attempts reached. Please restart the app.
            </Text>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  errorDetails: {
    backgroundColor: '#ffe6e6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
    maxWidth: 300,
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#00418b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  restartButton: {
    backgroundColor: '#d32f2f',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 16,
  },
  maxRetriesText: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default HermesErrorBoundary;
