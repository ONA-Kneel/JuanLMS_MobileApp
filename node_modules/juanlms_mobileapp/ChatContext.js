// ChatContext.js
import React, { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([
    // Pre-existing role-based chats
    {
      id: 1,
      name: 'Student Chat',
      participants: ['Student'],
      messages: [
        { text: 'Hello Student!', sender: 'Student', timestamp: new Date().toLocaleTimeString() },
      ],
    },
    {
      id: 2,
      name: 'Faculty Chat',
      participants: ['Faculty'],
      messages: [
        { text: 'Hello Faculty!', sender: 'Faculty', timestamp: new Date().toLocaleTimeString() },
      ],
    },
    {
      id: 3,
      name: 'Admin Chat',
      participants: ['Admin'],
      messages: [
        { text: 'Hello Admin!', sender: 'Admin', timestamp: new Date().toLocaleTimeString() },
      ],
    },
    {
      id: 4,
      name: 'Director Chat',
      participants: ['Director'],
      messages: [
        { text: 'Hello Director!', sender: 'Director', timestamp: new Date().toLocaleTimeString() },
      ],
    },
  ]);

  const [currentChatId, setCurrentChatId] = useState(null);

  // Add a new message to the appropriate chat based on the role
  const sendMessage = (text, senderRole) => {
    const timestamp = new Date().toLocaleTimeString();
    const updatedChats = chats.map((chat) => {
      if (chat.participants.includes(senderRole)) {
        return {
          ...chat,
          messages: [...chat.messages, { text, sender: senderRole, timestamp }],
        };
      }
      return chat;
    });
    setChats(updatedChats);
  };

  return (
    <ChatContext.Provider value={{ chats, currentChatId, setCurrentChatId, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
