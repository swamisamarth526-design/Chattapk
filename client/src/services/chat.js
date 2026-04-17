import api from './api';
import {
  normalizeConversation,
  normalizeMessage,
  normalizeUser,
} from '../utils/chat';

export async function fetchConversations(currentUserId) {
  const response = await api.get('/conversations');
  const conversations = response.data.data?.conversations || [];

  return conversations.map((conversation) =>
    normalizeConversation(conversation, currentUserId)
  );
}

export async function fetchConversation(conversationId, currentUserId) {
  const response = await api.get(`/conversations/${conversationId}`);
  return normalizeConversation(response.data.data?.conversation, currentUserId);
}

export async function fetchMessages(conversationId, currentUserId) {
  const response = await api.get(`/messages/${conversationId}`, {
    params: {
      page: 1,
      limit: 30,
    },
  });

  const messages = response.data.data?.messages || [];
  return messages.map((message) => normalizeMessage(message, currentUserId));
}

export async function markMessageAsRead(messageId, currentUserId) {
  const response = await api.patch(`/messages/${messageId}/read`);
  return normalizeMessage(response.data.data, currentUserId);
}

export async function fetchDiscoverUsers() {
  const response = await api.get('/users', {
    params: {
      limit: 8,
      offset: 0,
    },
  });

  const users = response.data.data?.users || [];
  return users.map(normalizeUser);
}

export async function searchUsers(query) {
  const response = await api.get('/users/search', {
    params: {
      q: query,
      limit: 8,
      offset: 0,
    },
  });

  const users = response.data.data?.users || [];
  return users.map(normalizeUser);
}

export async function createOrFetchConversation(otherUserId, currentUserId) {
  const response = await api.post('/conversations', { otherUserId });
  return normalizeConversation(response.data.data?.conversation, currentUserId);
}

export async function sendConversationMessage(
  conversationId,
  text,
  currentUserId
) {
  const response = await api.post('/messages', { conversationId, text });
  return normalizeMessage(response.data.data, currentUserId);
}
