import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

class FontErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Check if this is a font-related error
    const isFontError = error?.message?.includes('createTextInstance') || 
                       error?.message?.includes('font') ||
                       error?.stack?.includes('FontHooks');
    
    if (isFontError) {
      console.warn('Font error detected, using fallback rendering');
      return { hasError: true, error };
    }
    
    return null; // Let other error boundaries handle non-font errors
  }

  componentDidCatch(error, errorInfo) {
    console.error('Font Error Boundary caught an error:', error, errorInfo);
    
    // Log font-specific error details
    if (error?.message?.includes('createTextInstance')) {
      console.error('createTextInstance error detected - likely font loading issue');
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>⚠️ Font Loading Issue</Text>
          <Text style={styles.message}>
            There was a problem loading custom fonts. The app will continue with system fonts.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#00418b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default FontErrorBoundary;
