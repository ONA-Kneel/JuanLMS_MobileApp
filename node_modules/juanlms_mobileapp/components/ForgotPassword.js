// ForgotPassword.js
// Handles the password reset process: requests OTP, verifies OTP, and sets new password.
// Step-based UI: 1) request OTP, 2) enter OTP, 3) enter new password, 4) success message.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const API_BASE = 'https://juanlms-webapp-server.onrender.com'; // Use the same backend as the web app

export default function ForgotPassword({ navigation }) {
  // --- STATE ---
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: request OTP, 2: enter OTP, 3: enter new password
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpLockout, setOtpLockout] = useState(false);
  const [otpLockoutTime, setOtpLockoutTime] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  // Lockout timer effect
  useEffect(() => {
    let timer;
    if (otpLockout && otpLockoutTime > 0) {
      timer = setInterval(() => {
        setOtpLockoutTime(prev => {
          if (prev <= 1) {
            setOtpLockout(false);
            setOtpAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpLockout, otpLockoutTime]);

  // Cooldown timer for resend
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // --- HANDLER: Request OTP to be sent to user's email ---
  const handleRequestOTP = async () => {
    if (otpLockout) return;
    setError('');
    setMessage('');
    
    // Frontend email format validation
    const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailPattern.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message || 'If your email is registered, a reset link or OTP has been sent.');
        setStep(2); // Move to next step
        setCooldown(20); // 20s cooldown
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER: Validate OTP ---
  const handleValidateOTP = async () => {
    if (otpLockout) return;
    setLoading(true);
    setError('');
    setMessage('');
    
    // Debug logging
    console.log('Validating OTP with:', { email, otp });
    
    try {
      const response = await fetch(`${API_BASE}/validate-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // send both to be compatible with either backend key
          email: email,
          personalemail: email,
          otp,
        }),
      });
      
      // Debug logging
      console.log('Request body sent:', JSON.stringify({
        email: email,
        personalemail: email,
        otp,
      }));
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage('OTP validated. Please enter your new password.');
        setStep(3);
        setOtpAttempts(0); // reset attempts on success
      } else {
        setOtpAttempts(prev => {
          const newAttempts = prev + 1;
          if (newAttempts >= 5) {
            setOtpLockout(true);
            setOtpLockoutTime(5 * 60);
          }
          return newAttempts;
        });
        setError(data.message || 'Invalid or expired OTP.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER: Reset password using OTP (step 3) ---
  const handleResetPassword = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    
    // Minimum password length check to mirror web app UX
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalemail: email,
          otp,
          newPassword,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message || 'Password reset successful.');
        setStep(4); // Show success message
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER ---
  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#1976d2" />
          </TouchableOpacity>
          <Text style={styles.title}>Forgot Password</Text>
        </View>

        <View style={styles.card}>
          {/* Step 1: Request OTP */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.label}>Enter your registered email</Text>
              <TextInput
                style={styles.input}
                placeholder="username@gmail.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRequestOTP}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Sending...' : 'Send Reset Link/OTP'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: Enter OTP */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.label}>Enter the OTP sent to your email</Text>
              <TextInput
                style={[styles.input, otpLockout && styles.inputDisabled]}
                placeholder="Enter OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
                placeholderTextColor="#999"
                disabled={otpLockout}
              />
              <TouchableOpacity
                style={[styles.button, (loading || otpLockout) && styles.buttonDisabled]}
                onPress={handleValidateOTP}
                disabled={loading || otpLockout}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Validating...' : 'Validate OTP'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  (cooldown > 0 || loading || otpLockout) && styles.buttonDisabled
                ]}
                onPress={handleRequestOTP}
                disabled={cooldown > 0 || loading || otpLockout}
              >
                <Text style={styles.secondaryButtonText}>
                  {otpLockout
                    ? `Locked (${otpLockoutTime}s)`
                    : cooldown > 0
                      ? `Resend OTP in ${cooldown}s`
                      : loading
                        ? 'Sending OTP...'
                        : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
              
              {otpLockout && (
                <Text style={styles.errorText}>
                  Too many failed attempts. Try again in {otpLockoutTime}s.
                </Text>
              )}
            </View>
          )}

          {/* Step 3: Enter new password */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                placeholder="New password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholderTextColor="#999"
              />
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 4: Success message */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <Icon name="check-circle" size={64} color="#4caf50" style={styles.successIcon} />
              <Text style={styles.successText}>{message}</Text>
              <TouchableOpacity 
                style={styles.button}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.buttonText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Show message or error if not on step 4 */}
          {message && step !== 4 && <Text style={styles.messageText}>{message}</Text>}
          {error && <Text style={styles.errorText}>{error}</Text>}
          
          {/* Back to login button (not on step 4) */}
          {step !== 4 && (
            <TouchableOpacity 
              style={styles.backToLoginButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.backToLoginText}>Back to Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stepContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#1976d2',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: 'white',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
  },
  button: {
    backgroundColor: '#1976d2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  messageText: {
    color: '#4caf50',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  backToLoginButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  backToLoginText: {
    color: '#1976d2',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  successIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  successText: {
    color: '#4caf50',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
});
