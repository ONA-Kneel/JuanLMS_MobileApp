import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import profileService from '../../services/profileService';

export default function PasswordChangeModal({ visible, onClose, userId }) {
  const [step, setStep] = useState(1); // 1 request, 2 validate, 3 change, 4 success
  const [otp, setOtp] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    }
    return () => timer && clearInterval(timer);
  }, [cooldown]);

  const handleRequestOtp = async () => {
    setError('');
    setLoading(true);
    try {
      await profileService.requestPasswordChangeOtp(userId);
      setStep(2);
      setCooldown(20);
    } catch (e) {
      setError(e.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateOtp = async () => {
    setError('');
    if (!otp) return setError('Enter the OTP sent to your email');
    setLoading(true);
    try {
      await profileService.validatePasswordChangeOtp(userId, otp);
      setStep(3);
    } catch (e) {
      setError(e.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setError('');
    if (!currentPassword || !newPassword || !confirmPassword) return setError('All fields are required');
    if (newPassword !== confirmPassword) return setError('Passwords do not match');
    if (newPassword.length < 8) return setError('New password must be at least 8 characters');
    setLoading(true);
    try {
      await profileService.changePassword(userId, currentPassword, newPassword);
      setStep(4);
    } catch (e) {
      setError(e.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setOtp('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setCooldown(0);
    onClose?.();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={resetAndClose}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: 16 }}>
        <View style={{ width: '95%', maxWidth: 420, backgroundColor: 'white', borderRadius: 16, padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Change Password</Text>
          {!!error && <Text style={{ color: '#b00020', marginBottom: 8 }}>{error}</Text>}

          {step === 1 && (
            <>
              <Text style={{ marginBottom: 12 }}>Request an OTP to your personal email.</Text>
              <TouchableOpacity onPress={handleRequestOtp} disabled={loading} style={{ backgroundColor: '#00418b', padding: 12, borderRadius: 8, alignItems: 'center' }}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send OTP</Text>}
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <>
              <TextInput value={otp} onChangeText={setOtp} placeholder="Enter OTP" keyboardType="number-pad" style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12 }} />
              <TouchableOpacity onPress={handleValidateOtp} disabled={loading} style={{ backgroundColor: '#00418b', padding: 12, borderRadius: 8, alignItems: 'center' }}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>Next</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRequestOtp} disabled={loading || cooldown > 0} style={{ marginTop: 10, backgroundColor: cooldown > 0 ? '#ccc' : '#2e7d32', padding: 12, borderRadius: 8, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 3 && (
            <>
              <TextInput value={currentPassword} onChangeText={setCurrentPassword} placeholder="Current Password" secureTextEntry style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 8 }} />
              <TextInput value={newPassword} onChangeText={setNewPassword} placeholder="New Password (min 8)" secureTextEntry style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 8 }} />
              <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm New Password" secureTextEntry style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12 }} />
              <TouchableOpacity onPress={handleChangePassword} disabled={loading} style={{ backgroundColor: '#00418b', padding: 12, borderRadius: 8, alignItems: 'center' }}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>Change</Text>}
              </TouchableOpacity>
            </>
          )}

          {step === 4 && (
            <>
              <Text style={{ color: '#2e7d32', marginBottom: 12 }}>Password changed successfully!</Text>
              <TouchableOpacity onPress={resetAndClose} style={{ backgroundColor: '#00418b', padding: 12, borderRadius: 8, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={resetAndClose} style={{ marginTop: 12, alignItems: 'center' }}>
            <Text style={{ color: '#00418b' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}


