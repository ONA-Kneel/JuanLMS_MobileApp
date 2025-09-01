import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import UnifiedChat from '../UnifiedChat';
import { useUser } from '../UserContext';

export default function AdminChats() {
  const { user } = useUser();

  useEffect(() => {
    console.log('AdminChats rendered with user:', user);
  }, [user]);

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f3f3' }}>
        <Text style={{ fontSize: 16, color: '#666' }}>Loading admin chat...</Text>
      </View>
    );
  }

  return <UnifiedChat />;
}
