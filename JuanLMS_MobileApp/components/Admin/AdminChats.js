// components/Students/StudentsChats.js
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useChat } from '../../ChatContext'; // adjust path if needed
import { useUser } from '../../UserContext'; // adjust path if needed

export default function AdminChats() {
  const navigation = useNavigation();
  const { chats, setCurrentChatId, addChat } = useChat();
  const { user } = useUser(); // user.role = "Student"

  // Show only chats where this user is a participant
  const userChats = chats.filter(chat =>
    chat.participants.includes(user.role) // Filtering chats based on the current user's role
  );

  const handleChatPress = (chatId) => {
    setCurrentChatId(chatId);
    navigation.navigate('Chats'); // Navigate to a chat detail page (adjust screen name accordingly)
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* Header with + New Chat */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 22 }}>Chats</Text>
        <TouchableOpacity
          onPress={addChat}
          style={{ backgroundColor: 'blue', padding: 10, borderRadius: 10 }}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>+ New Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Chat List */}
      <ScrollView>
        {userChats.map(chat => {
          const lastMsg = chat.messages[chat.messages.length - 1];
          return (
            <TouchableOpacity
              key={chat.id}
              onPress={() => handleChatPress(chat.id)}
              style={{ backgroundColor: 'lightgray', padding: 15, borderRadius: 10, marginBottom: 10 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{chat.name}</Text>
              <Text>{lastMsg ? `${lastMsg.sender}: ${lastMsg.text}` : 'No messages yet'}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
