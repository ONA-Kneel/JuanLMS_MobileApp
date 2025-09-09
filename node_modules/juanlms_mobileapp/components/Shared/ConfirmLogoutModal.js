import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';

export default function ConfirmLogoutModal({ visible, onCancel, onConfirm }) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: '80%', backgroundColor: 'white', borderRadius: 12, padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8, color: '#111' }}>Log Out</Text>
          <Text style={{ fontSize: 14, color: '#444', marginBottom: 16 }}>
            Are you sure you want to log out?
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <TouchableOpacity onPress={onCancel} style={{ paddingVertical: 10, paddingHorizontal: 16, marginRight: 8 }}>
              <Text style={{ color: '#555', fontSize: 14, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#c62828', borderRadius: 6 }}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}


