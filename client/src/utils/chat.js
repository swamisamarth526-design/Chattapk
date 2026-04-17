import { formatDate } from './helpers';

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

function normalizeId(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && typeof value.toString === 'function') {
    return value.toString();
  }
  return String(value);
}

function resolvePresence(user) {
  const lastSeen = user?.lastSeen;
  const isOnline =
    typeof user?.isOnline === 'boolean'
      ? user.isOnline
      : Boolean(
          lastSeen &&
            new Date(lastSeen).getTime() > Date.now() - ONLINE_WINDOW_MS
        );

  return {
    status: isOnline ? 'online' : 'offline',
    label: isOnline
      ? 'Online'
      : lastSeen
        ? `Last seen ${formatDate(lastSeen)}`
        : 'Offline',
  };
}

function resolveOtherUser(conversation, currentUserId) {
  if (conversation?.otherUser) {
    return conversation.otherUser;
  }

  if (!Array.isArray(conversation?.participants)) {
    return null;
  }

  return (
    conversation.participants.find(
      (participant) =>
        normalizeId(participant?._id || participant?.id) !== currentUserId
    ) || conversation.participants[0]
  );
}

function resolveDeliveryState(message, currentUserId) {
  const senderId = normalizeId(message?.sender?._id || message?.sender);

  if (senderId !== currentUserId) {
    return 'sent';
  }

  const readBy = Array.isArray(message?.readBy) ? message.readBy : [];
  const isReadByOtherParticipant = readBy.some(
    (entry) => normalizeId(entry?.userId) !== currentUserId
  );

  if (isReadByOtherParticipant) {
    return 'read';
  }

  if (message?.delivered) {
    return 'delivered';
  }

  return 'sent';
}

export function normalizeUser(user) {
  const presence = resolvePresence(user);

  return {
    id: normalizeId(user?._id || user?.id),
    name: user?.name || 'Unknown user',
    email: user?.email || '',
    avatar: user?.avatar || null,
    lastSeen: user?.lastSeen || null,
    status: presence.status,
    statusLabel: presence.label,
  };
}

export function normalizeMessage(message, currentUserId) {
  const sender = typeof message?.sender === 'object' ? message.sender : null;
  const readBy = Array.isArray(message?.readBy) ? message.readBy : [];
  const delivered = Boolean(message?.delivered);

  return {
    id: normalizeId(message?._id || message?.id),
    conversationId: normalizeId(message?.conversation),
    senderId: normalizeId(sender?._id || message?.sender),
    senderName: sender?.name || 'Unknown user',
    senderAvatar: sender?.avatar || null,
    text: message?.text || '',
    createdAt: message?.createdAt || new Date().toISOString(),
    delivered,
    readBy,
    delivery: resolveDeliveryState(message, currentUserId),
  };
}

export function normalizeConversation(conversation, currentUserId) {
  const otherUser = normalizeUser(resolveOtherUser(conversation, currentUserId));
  const lastMessageText = conversation?.lastMessage?.text || '';
  const isOwnLastMessage =
    normalizeId(conversation?.lastMessage?.sender?._id) === currentUserId;

  return {
    id: normalizeId(conversation?._id || conversation?.id),
    title: otherUser.name,
    avatar: otherUser.avatar,
    status: otherUser.status,
    statusLabel: otherUser.statusLabel,
    subtitle: otherUser.email || 'Direct message',
    otherUser,
    lastMessage: lastMessageText
      ? `${isOwnLastMessage ? 'You: ' : ''}${lastMessageText}`
      : 'Start your conversation here.',
    unreadCount: Number(conversation?.unreadCount || 0),
    updatedAt:
      conversation?.updatedAt ||
      conversation?.lastMessage?.createdAt ||
      conversation?.createdAt ||
      new Date().toISOString(),
    createdAt:
      conversation?.createdAt ||
      conversation?.updatedAt ||
      new Date().toISOString(),
    messages: Array.isArray(conversation?.messages) ? conversation.messages : [],
    messagesLoaded: Boolean(conversation?.messagesLoaded),
  };
}

export function mergeConversationState(existingConversation, incomingConversation) {
  if (!existingConversation) {
    return incomingConversation;
  }

  return {
    ...existingConversation,
    ...incomingConversation,
    messages: incomingConversation.messagesLoaded
      ? incomingConversation.messages
      : existingConversation.messages,
    messagesLoaded:
      incomingConversation.messagesLoaded || existingConversation.messagesLoaded,
  };
}

export function mergeMessageUpdates(messages, updatedMessages) {
  const updateMap = new Map(
    updatedMessages.map((message) => [message.id, message])
  );

  return messages.map((message) => updateMap.get(message.id) || message);
}

export function sortConversations(conversations) {
  return [...conversations].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );
}
