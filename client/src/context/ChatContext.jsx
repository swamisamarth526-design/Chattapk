/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useState } from 'react';

export const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const addMessage = useCallback((conversationId, message) => {
    setMessages((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), message],
    }));
  }, []);

  const updateMessage = useCallback((conversationId, messageId, updates) => {
    setMessages((prev) => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map((msg) =>
        msg._id === messageId ? { ...msg, ...updates } : msg
      ),
    }));
  }, []);

  const setConversationMessages = useCallback((conversationId, msgs) => {
    setMessages((prev) => ({
      ...prev,
      [conversationId]: msgs,
    }));
  }, []);

  const updateTypingUsers = useCallback((conversationId, typingUserIds) => {
    setTypingUsers((prev) => {
      const newMap = new Map(prev);
      newMap.set(conversationId, typingUserIds);
      return newMap;
    });
  }, []);

  const value = {
    conversations,
    setConversations,
    selectedConversation,
    setSelectedConversation,
    messages,
    setMessages,
    addMessage,
    updateMessage,
    setConversationMessages,
    typingUsers,
    updateTypingUsers,
    isLoadingConversations,
    setIsLoadingConversations,
    isLoadingMessages,
    setIsLoadingMessages,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}
