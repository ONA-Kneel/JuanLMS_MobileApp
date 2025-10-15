import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('DashboardErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
    
    this.setState({ 
      error, 
      errorInfo,
      retryCount: this.state.retryCount + 1 
    });
  }

  handleRetry = () => {
    // Reset error state
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
      const maxRetries = 3;
      const canRetry = this.state.retryCount < maxRetries;
      
      return (
        <View style={styles.container}>
          <Icon name="alert-circle" size={64} color="#f44336" />
          <Text style={styles.title}>⚠️ Dashboard Error</Text>
          <Text style={styles.message}>
            The dashboard encountered an error and couldn't load properly. This might be due to a network issue or a temporary problem.
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
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',
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
    fontFamily: 'Poppins-Bold',
  },
  maxRetriesText: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: 'Poppins-Regular',
  },
});

export default DashboardErrorBoundary;
