import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import UnifiedChat from '../UnifiedChat';
import { useUser } from '../../UserContext';

export default function VPEChats() {
  const { user, loading: userLoading } = useUser();

  // Add safety check to prevent white screen when user is null (during logout)
  // This must be placed AFTER all hooks to avoid "Rendered fewer hooks than expected" error
  if (userLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f9fa' }}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666', fontFamily: 'Poppins-Regular' }}>
          Loading user data...
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f9fa' }}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666', fontFamily: 'Poppins-Regular' }}>
          Redirecting to login...
        </Text>
      </View>
    );
  }

  return <UnifiedChat />;
}
