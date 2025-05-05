import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useChat } from "../ChatContext"; // ✅
import { useUser } from '../UserContext'; // ✅

export default function Chat() {
  const { chats, currentChatId, sendMessage, addChat } = useChat();
  const { user } = useUser();
  const navigation = useNavigation();
  const [inputText, setInputText] = useState("");

  // Check if currentChatId exists and is valid
  const currentChat = chats.find((c) => c.id === currentChatId);

  // If no chat is selected, return early or show a message
  if (!currentChat) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>No chat selected</Text>
      </View>
    );
  }

  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage(inputText.trim(), user.role); // ✅ Sender is current user role
      setInputText("");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 15, backgroundColor: "lightgray" }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={{ fontWeight: "bold", fontSize: 18 }}>{currentChat?.name}</Text>
        <TouchableOpacity onPress={addChat}>
          <Icon name="plus" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView style={{ flex: 1, padding: 10 }}>
        {currentChat?.messages.map((msg, idx) => (
          <View key={idx} style={{
            alignSelf: "flex-end",
            backgroundColor: "lightblue",
            padding: 10,
            borderRadius: 10,
            marginBottom: 10,
            maxWidth: "70%"
          }}>
            <Text style={{ fontWeight: 'bold' }}>{msg.sender}</Text>
            <Text>{msg.text}</Text>
            <Text style={{ fontSize: 10 }}>{msg.timestamp}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={{ flexDirection: "row", padding: 10, backgroundColor: "lightgray" }}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          style={{ flex: 1, backgroundColor: "white", padding: 10, borderRadius: 10 }}
        />
        <TouchableOpacity onPress={handleSend} style={{ marginLeft: 10, backgroundColor: "blue", padding: 10, borderRadius: 10 }}>
          <Text style={{ color: "white", fontWeight: "bold" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
