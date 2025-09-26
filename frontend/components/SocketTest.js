import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import socketService from '../services/socketService';
import { useUser } from '../UserContext';

export default function SocketTest() {
  const { user } = useUser();
  const [socketStatus, setSocketStatus] = useState('Not initialized');
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');

  useEffect(() => {
    if (user?._id) {
      testSocketConnection();
    }
  }, [user?._id]);

  const testSocketConnection = async () => {
    try {
      setSocketStatus('Initializing...');
      const socket = await socketService.initialize(user._id);
      
      if (socket) {
        setSocketStatus('Initialized');
        setConnectionStatus(socketService.isSocketConnected() ? 'Connected' : 'Disconnected');
        
        // Test event listener
        socketService.addEventListener('test', (data) => {
          Alert.alert('Test Event Received', JSON.stringify(data));
        });
        
        // Emit test event
        if (socketService.isSocketConnected()) {
          socket.emit('test', { message: 'Hello from mobile app' });
        }
      } else {
        setSocketStatus('Failed to initialize');
      }
    } catch (error) {
      console.error('Socket test error:', error);
      setSocketStatus('Error: ' + error.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Socket.IO Test
      </Text>
      <Text>Status: {socketStatus}</Text>
      <Text>Connection: {connectionStatus}</Text>
      <TouchableOpacity
        onPress={testSocketConnection}
        style={{
          backgroundColor: '#007AFF',
          padding: 10,
          borderRadius: 5,
          marginTop: 10
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          Test Socket Connection
        </Text>
      </TouchableOpacity>
    </View>
  );
}
