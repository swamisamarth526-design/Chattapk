import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button } from '../components/UI';
import { ConversationList } from '../components/Chat/ConversationList';
import { ChatPanel } from '../components/Chat/ChatPanel';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import * as chatService from '../services/chat';
import {
  mergeConversationState,
  normalizeMessage,
  sortConversations,
} from '../utils/chat';
import { extractApiMessage } from '../utils/errors';
import { formatDate } from '../utils/helpers';

function upsertConversation(conversations, incomingConversation) {
  const existingConversation = conversations.find(
    (conversation) => conversation.id === incomingConversation.id
  );
  const nextConversation = mergeConversationState(
    existingConversation,
    incomingConversation
  );

  return sortConversations([
    nextConversation,
    ...conversations.filter(
      (conversation) => conversation.id !== nextConversation.id
    ),
  ]);
}

function replaceConversationMessages(conversations, conversationId, messages) {
  return conversations.map((conversation) =>
    conversation.id === conversationId
      ? {
          ...conversation,
          messages,
          messagesLoaded: true,
        }
      : conversation
  );
}

function upsertMessage(messages, incomingMessage) {
  const existingMessage = messages.find((message) => message.id === incomingMessage.id);

  if (!existingMessage) {
    return [...messages, incomingMessage];
  }

  return messages.map((message) =>
    message.id === incomingMessage.id ? { ...message, ...incomingMessage } : message
  );
}

function getPresenceLabel(lastSeen, isOnline) {
  if (isOnline) {
    return 'Online';
  }

  return lastSeen ? `Last seen ${formatDate(lastSeen)}` : 'Offline';
}

function applyPresenceToConversation(conversation, payload, isOnline) {
  if (conversation.otherUser?.id !== payload?.userId) {
    return conversation;
  }

  const nextLastSeen = payload?.lastSeen || conversation.otherUser?.lastSeen || null;
  const statusLabel = getPresenceLabel(nextLastSeen, isOnline);

  return {
    ...conversation,
    status: isOnline ? 'online' : 'offline',
    statusLabel,
    otherUser: {
      ...conversation.otherUser,
      lastSeen: nextLastSeen,
      status: isOnline ? 'online' : 'offline',
      statusLabel,
    },
  };
}

function applyPresenceToUser(user, payload, isOnline) {
  if (user.id !== payload?.userId) {
    return user;
  }

  const nextLastSeen = payload?.lastSeen || user.lastSeen || null;

  return {
    ...user,
    lastSeen: nextLastSeen,
    status: isOnline ? 'online' : 'offline',
    statusLabel: getPresenceLabel(nextLastSeen, isOnline),
  };
}

function applyReadReceiptToMessages(messages, receipt, currentUserId) {
  return messages.map((message) => {
    if (message.id !== receipt.messageId) {
      return message;
    }

    const nextReadBy = Array.isArray(message.readBy)
      ? [
          ...message.readBy.filter((entry) => entry.userId !== receipt.userId),
          { userId: receipt.userId, readAt: receipt.readAt },
        ]
      : [{ userId: receipt.userId, readAt: receipt.readAt }];

    return {
      ...message,
      delivered: true,
      readBy: nextReadBy,
      delivery:
        message.senderId === currentUserId && receipt.userId !== currentUserId
          ? 'read'
          : message.delivery,
    };
  });
}

function removeUserFromTypingState(typingState, userId) {
  return Object.fromEntries(
    Object.entries(typingState).map(([conversationId, typingUsers]) => [
      conversationId,
      typingUsers.filter((typingUserId) => typingUserId !== userId),
    ])
  );
}

export function ChatPage() {
  const { user } = useAuth();
  const { socket, isConnected, socketError } = useSocket();
  const currentUserId = user?._id || user?.id || '';
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [typingByConversation, setTypingByConversation] = useState({});
  const [mobileView, setMobileView] = useState('list');
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [conversationError, setConversationError] = useState('');
  const [messageError, setMessageError] = useState('');
  const [discoverError, setDiscoverError] = useState('');
  const [creatingConversationId, setCreatingConversationId] = useState('');
  const [shouldReloadMessages, setShouldReloadMessages] = useState(false);
  const [conversationReloadNonce, setConversationReloadNonce] = useState(0);
  const deferredSearchValue = useDeferredValue(searchValue.trim());
  const conversationsRef = useRef(conversations);
  const pendingConversationFetchesRef = useRef(new Set());

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === selectedConversationId
      ) || null,
    [conversations, selectedConversationId]
  );

  const typingNames = useMemo(() => {
    if (!selectedConversationId || !selectedConversation?.otherUser) {
      return [];
    }

    const typingIds = typingByConversation[selectedConversationId] || [];

    return typingIds
      .filter((userId) => userId === selectedConversation.otherUser.id)
      .map(() => selectedConversation.otherUser.name);
  }, [selectedConversation, selectedConversationId, typingByConversation]);

  useEffect(() => {
    if (!currentUserId) {
      return undefined;
    }

    let isCancelled = false;

    const loadConversations = async () => {
      setIsLoadingConversations(true);
      setConversationError('');

      try {
        const fetchedConversations = await chatService.fetchConversations(
          currentUserId
        );

        if (isCancelled) {
          return;
        }

        startTransition(() => {
          setConversations((currentConversations) =>
            sortConversations(
              fetchedConversations.map((conversation) =>
                mergeConversationState(
                  currentConversations.find(
                    (currentConversation) =>
                      currentConversation.id === conversation.id
                  ),
                  conversation
                )
              )
            )
          );

          setSelectedConversationId((currentSelectedId) => {
            if (
              currentSelectedId &&
              fetchedConversations.some(
                (conversation) => conversation.id === currentSelectedId
              )
            ) {
              return currentSelectedId;
            }

            return fetchedConversations[0]?.id || null;
          });
        });
      } catch (error) {
        if (!isCancelled) {
          setConversationError(
            extractApiMessage(error, 'Unable to load conversations right now.')
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingConversations(false);
        }
      }
    };

    loadConversations();

    return () => {
      isCancelled = true;
    };
  }, [conversationReloadNonce, currentUserId]);

  useEffect(() => {
    if (!currentUserId) {
      return undefined;
    }

    let isCancelled = false;

    const loadUsers = async () => {
      setIsSearchingUsers(true);
      setDiscoverError('');

      try {
        const users =
          deferredSearchValue.length >= 2
            ? await chatService.searchUsers(deferredSearchValue)
            : await chatService.fetchDiscoverUsers();

        if (isCancelled) {
          return;
        }

        startTransition(() => {
          setDiscoverUsers(users);
        });
      } catch (error) {
        if (!isCancelled) {
          setDiscoverError(
            extractApiMessage(error, 'Unable to load users right now.')
          );
        }
      } finally {
        if (!isCancelled) {
          setIsSearchingUsers(false);
        }
      }
    };

    loadUsers();

    return () => {
      isCancelled = true;
    };
  }, [currentUserId, deferredSearchValue]);

  useEffect(() => {
    if (!selectedConversationId || !currentUserId) {
      return undefined;
    }

    if (!shouldReloadMessages && selectedConversation?.messagesLoaded) {
      return undefined;
    }

    let isCancelled = false;

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      setMessageError('');

      try {
        const messages = await chatService.fetchMessages(
          selectedConversationId,
          currentUserId
        );

        if (isCancelled) {
          return;
        }

        startTransition(() => {
          setConversations((currentConversations) =>
            replaceConversationMessages(
              currentConversations,
              selectedConversationId,
              messages
            )
          );
        });

        const incomingMessages = messages.filter(
          (message) => message.senderId !== currentUserId
        );

        incomingMessages.forEach((message) => {
          if (isConnected) {
            socket.markMessageRead(message.id, selectedConversationId);
            return;
          }

          void chatService.markMessageAsRead(message.id, currentUserId);
        });
      } catch (error) {
        if (!isCancelled) {
          setMessageError(extractApiMessage(error, 'Unable to load messages.'));
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingMessages(false);
          setShouldReloadMessages(false);
        }
      }
    };

    loadMessages();

    return () => {
      isCancelled = true;
    };
  }, [
    currentUserId,
    isConnected,
    selectedConversation?.messagesLoaded,
    selectedConversationId,
    shouldReloadMessages,
    socket,
  ]);

  useEffect(() => {
    if (!isConnected || conversations.length === 0) {
      return;
    }

    socket.syncConversationRooms(conversations.map((conversation) => conversation.id));
  }, [conversations, isConnected, socket]);

  useEffect(() => {
    if (!isConnected || !selectedConversationId) {
      return undefined;
    }

    socket.joinConversation(selectedConversationId);

    return () => {
      socket.stopTyping(selectedConversationId);
    };
  }, [isConnected, selectedConversationId, socket]);

  const handlePresenceChange = useEffectEvent((payload, isOnline) => {
    if (!payload?.userId) {
      return;
    }

    startTransition(() => {
      setConversations((currentConversations) =>
        currentConversations.map((conversation) =>
          applyPresenceToConversation(conversation, payload, isOnline)
        )
      );
      setDiscoverUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          applyPresenceToUser(currentUser, payload, isOnline)
        )
      );

      if (!isOnline) {
        setTypingByConversation((currentTyping) =>
          removeUserFromTypingState(currentTyping, payload.userId)
        );
      }
    });
  });

  const handleTypingStarted = useEffectEvent((payload) => {
    if (!payload?.conversationId || payload.userId === currentUserId) {
      return;
    }

    const nextTypingIds = Array.from(
      new Set([
        ...(payload.typingUsers || []).filter((userId) => userId !== currentUserId),
        payload.userId,
      ])
    );

    setTypingByConversation((currentTyping) => ({
      ...currentTyping,
      [payload.conversationId]: nextTypingIds,
    }));
  });

  const handleTypingStopped = useEffectEvent((payload) => {
    if (!payload?.conversationId) {
      return;
    }

    setTypingByConversation((currentTyping) => ({
      ...currentTyping,
      [payload.conversationId]: (payload.typingUsers || []).filter(
        (userId) => userId !== currentUserId
      ),
    }));
  });

  const handleReadReceipt = useEffectEvent((payload) => {
    if (!payload?.messageId) {
      return;
    }

    startTransition(() => {
      setConversations((currentConversations) =>
        currentConversations.map((conversation) => ({
          ...conversation,
          messages: applyReadReceiptToMessages(
            conversation.messages,
            payload,
            currentUserId
          ),
        }))
      );
    });
  });

  const handleReceiveMessageEvent = useEffectEvent(async (payload) => {
    const incomingMessage = normalizeMessage(payload, currentUserId);
    const conversationId = incomingMessage.conversationId;

    if (!conversationId) {
      return;
    }

    const existingConversation = conversationsRef.current.find(
      (conversation) => conversation.id === conversationId
    );
    const isSelectedConversation = conversationId === selectedConversationId;

    if (!existingConversation) {
      if (pendingConversationFetchesRef.current.has(conversationId)) {
        return;
      }

      pendingConversationFetchesRef.current.add(conversationId);

      try {
        const fetchedConversation = await chatService.fetchConversation(
          conversationId,
          currentUserId
        );

        startTransition(() => {
          setConversations((currentConversations) =>
            upsertConversation(currentConversations, {
              ...fetchedConversation,
              lastMessage:
                incomingMessage.senderId === currentUserId
                  ? `You: ${incomingMessage.text}`
                  : incomingMessage.text,
              updatedAt: incomingMessage.createdAt,
              unreadCount:
                incomingMessage.senderId === currentUserId || isSelectedConversation
                  ? 0
                  : 1,
              messages: isSelectedConversation ? [incomingMessage] : [],
              messagesLoaded: isSelectedConversation,
            })
          );
        });
      } catch (error) {
        console.error('Failed to sync realtime conversation:', error);
      } finally {
        pendingConversationFetchesRef.current.delete(conversationId);
      }
    } else {
      startTransition(() => {
        setConversations((currentConversations) => {
          const activeConversation = currentConversations.find(
            (conversation) => conversation.id === conversationId
          );

          if (!activeConversation) {
            return currentConversations;
          }

          return upsertConversation(currentConversations, {
            ...activeConversation,
            lastMessage:
              incomingMessage.senderId === currentUserId
                ? `You: ${incomingMessage.text}`
                : incomingMessage.text,
            updatedAt: incomingMessage.createdAt,
            unreadCount:
              incomingMessage.senderId === currentUserId || isSelectedConversation
                ? 0
                : activeConversation.unreadCount + 1,
            messages:
              activeConversation.messagesLoaded || isSelectedConversation
                ? upsertMessage(activeConversation.messages, incomingMessage)
                : activeConversation.messages,
            messagesLoaded:
              activeConversation.messagesLoaded || isSelectedConversation,
          });
        });
      });
    }

    if (incomingMessage.senderId !== currentUserId && isSelectedConversation) {
      if (isConnected) {
        socket.markMessageRead(incomingMessage.id, conversationId);
      } else {
        void chatService.markMessageAsRead(incomingMessage.id, currentUserId);
      }
    }
  });

  useEffect(() => {
    const unsubscribeMessage = socket.on(
      'chat:receive_message',
      handleReceiveMessageEvent
    );
    const unsubscribeOnline = socket.on('chat:user_online', (payload) =>
      handlePresenceChange(payload, true)
    );
    const unsubscribeOffline = socket.on('chat:user_offline', (payload) =>
      handlePresenceChange(payload, false)
    );
    const unsubscribeTypingStart = socket.on(
      'chat:typing_started',
      handleTypingStarted
    );
    const unsubscribeTypingStop = socket.on(
      'chat:typing_stopped',
      handleTypingStopped
    );
    const unsubscribeReadReceipt = socket.on(
      'chat:receive_read_receipt',
      handleReadReceipt
    );
    const unsubscribeDisconnect = socket.on('socket:disconnected', () => {
      setTypingByConversation({});
    });

    return () => {
      unsubscribeMessage();
      unsubscribeOnline();
      unsubscribeOffline();
      unsubscribeTypingStart();
      unsubscribeTypingStop();
      unsubscribeReadReceipt();
      unsubscribeDisconnect();
    };
  }, [socket]);

  const handleSelectConversation = (conversation) => {
    setConversations((currentConversations) =>
      currentConversations.map((currentConversation) =>
        currentConversation.id === conversation.id
          ? { ...currentConversation, unreadCount: 0 }
          : currentConversation
      )
    );
    setSelectedConversationId(conversation.id);
    setMessageError('');
    setShouldReloadMessages(true);
    setMobileView('chat');
  };

  const handleRetryMessages = () => {
    setMessageError('');
    setShouldReloadMessages(true);
  };

  const handleRetryConversations = () => {
    setConversationError('');
    setConversationReloadNonce((current) => current + 1);
  };

  const handleSelectUser = async (selectedUser) => {
    setCreatingConversationId(selectedUser.id);
    setDiscoverError('');

    try {
      const conversation = await chatService.createOrFetchConversation(
        selectedUser.id,
        currentUserId
      );

      startTransition(() => {
        setConversations((currentConversations) =>
          upsertConversation(currentConversations, conversation)
        );
        setSelectedConversationId(conversation.id);
        setSearchValue('');
        setMessageError('');
        setShouldReloadMessages(true);
        setMobileView('chat');
      });
    } catch (error) {
      setDiscoverError(
        extractApiMessage(error, 'Unable to open a conversation with that user.')
      );
    } finally {
      setCreatingConversationId('');
    }
  };

  const handleSendMessage = async (text) => {
    if (!selectedConversation) {
      return;
    }

    setIsSending(true);
    setMessageError('');

    try {
      const sentMessage = await chatService.sendConversationMessage(
        selectedConversation.id,
        text,
        currentUserId
      );

      startTransition(() => {
        setConversations((currentConversations) => {
          const activeConversation = currentConversations.find(
            (conversation) => conversation.id === selectedConversation.id
          );

          if (!activeConversation) {
            return currentConversations;
          }

          return upsertConversation(currentConversations, {
            ...activeConversation,
            lastMessage: `You: ${sentMessage.text}`,
            updatedAt: sentMessage.createdAt,
            unreadCount: 0,
            messages: upsertMessage(activeConversation.messages, sentMessage),
            messagesLoaded: true,
          });
        });
      });
    } catch (error) {
      setMessageError(extractApiMessage(error, 'Unable to send your message.'));
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  const handleTypingStart = () => {
    if (!selectedConversationId) {
      return;
    }

    socket.startTyping(selectedConversationId);
  };

  const handleTypingStop = () => {
    if (!selectedConversationId) {
      return;
    }

    socket.stopTyping(selectedConversationId);
  };

  return (
    <div className="mx-auto flex h-full min-h-[calc(100vh-7rem)] max-w-[1640px] flex-col gap-4 px-3 sm:px-5 lg:px-8">
      {socketError ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Realtime updates are having trouble connecting. Chat history still works,
          but live presence and messages may lag until the socket reconnects.
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 md:hidden">
        <div className="inline-flex rounded-2xl border border-slate-800 bg-slate-900/70 p-1">
          <Button
            variant={mobileView === 'list' ? 'primary' : 'ghost'}
            size="sm"
            className="rounded-xl px-4"
            onClick={() => setMobileView('list')}
          >
            Chats
          </Button>
          <Button
            variant={mobileView === 'chat' ? 'primary' : 'ghost'}
            size="sm"
            className="rounded-xl px-4"
            onClick={() => setMobileView('chat')}
          >
            Thread
          </Button>
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-16rem)] flex-1 gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className={mobileView === 'chat' ? 'hidden md:block h-full' : 'block h-full'}>
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
            isLoading={isLoadingConversations}
            error={conversationError}
            onRetry={handleRetryConversations}
            discoverUsers={discoverUsers}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            isSearchingUsers={isSearchingUsers}
            discoverError={discoverError}
            onSelectUser={handleSelectUser}
            creatingConversationId={creatingConversationId}
          />
        </div>

        <div className={mobileView === 'list' ? 'hidden md:block h-full' : 'block h-full'}>
          <ChatPanel
            key={selectedConversation?.id || 'empty'}
            conversation={selectedConversation}
            currentUserId={currentUserId}
            isLoading={isLoadingMessages}
            isSending={isSending}
            error={messageError}
            typingNames={typingNames}
            onRetry={handleRetryMessages}
            onSendMessage={handleSendMessage}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
            onBack={() => setMobileView('list')}
            mobileOnly
          />
        </div>
      </div>
    </div>
  );
}
