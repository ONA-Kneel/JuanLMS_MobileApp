import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import UnifiedChat from '../UnifiedChat';
import { useUser } from '../UserContext';

export default function AdminChats() {
  const { user } = useUser();

  useEffect(() => {
    console.log('AdminChats rendered with user:', user);
  }, [user]);

  // Add safety check to prevent white screen when user is null (during logout)
  // This must be placed AFTER all hooks to avoid "Rendered fewer hooks than expected" error
  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f3f3' }}>
        <Text style={{ fontSize: 16, color: '#666' }}>Redirecting to login...</Text>
      </View>
    );
  }

  return <UnifiedChat />;
}
