# Socket.IO Client Integration Guide

This guide covers how to integrate Socket.IO into the ChatX React frontend for real-time messaging.

## Installation

```bash
cd client
npm install socket.io-client
```

## Basic Setup

### 1. Create Socket Service

Create `src/services/socketService.js`:

```javascript
import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  /**
   * Connect to Socket.IO server with JWT token
   * @param {string} token - JWT authentication token
   * @param {string} url - Server URL (default: http://localhost:5000)
   */
  connect(token, url = 'http://localhost:5000') {
    if (this.socket?.connected) {
      console.log('[Socket] Already connected');
      return;
    }

    console.log('[Socket] Connecting to server...');

    this.socket = io(url, {
      auth: {
        token: `Bearer ${token}`,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.setupEventListeners();
  }

  /**
   * Set up core event listeners
   */
  setupEventListeners() {
    this.socket.on('connected', (data) => {
      console.log('[Socket] Connected:', data);
      this.emit('socket:connected', data);
    });

    this.socket.on('error', (error) => {
      console.error('[Socket] Error:', error);
      this.emit('socket:error', error);
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      this.emit('socket:disconnected');
    });

    // Core chat events
    this.socket.on('user_online', (data) => {
      console.log('[Socket] User online:', data);
      this.emit('chat:user_online', data);
    });

    this.socket.on('user_offline', (data) => {
      console.log('[Socket] User offline:', data);
      this.emit('chat:user_offline', data);
    });

    this.socket.on('receive_message', (message) => {
      console.log('[Socket] Message received:', message);
      this.emit('chat:receive_message', message);
    });

    this.socket.on('receive_read_receipt', (data) => {
      console.log('[Socket] Read receipt:', data);
      this.emit('chat:receive_read_receipt', data);
    });

    this.socket.on('typing_started', (data) => {
      console.log('[Socket] User typing:', data);
      this.emit('chat:typing_started', data);
    });

    this.socket.on('typing_stopped', (data) => {
      console.log('[Socket] User stopped typing:', data);
      this.emit('chat:typing_stopped', data);
    });

    this.socket.on('joined_conversation', (data) => {
      console.log('[Socket] Joined conversation:', data);
      this.emit('chat:joined_conversation', data);
    });
  }

  /**
   * Register a listener for socket events
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Returns unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Emit a custom event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach((callback) => callback(data));
  }

  // Socket.IO Events (Client → Server)

  /**
   * Join a conversation room
   * @param {string} conversationId - Conversation MongoDB ID
   */
  joinConversation(conversationId) {
    if (!this.socket?.connected) {
      console.warn('[Socket] Not connected');
      return;
    }
    this.socket.emit('join_conversation', { conversationId });
  }

  /**
   * Send a message
   * @param {string} conversationId - Conversation MongoDB ID
   * @param {string} text - Message text (1-5000 characters)
   */
  sendMessage(conversationId, text) {
    if (!this.socket?.connected) {
      console.warn('[Socket] Not connected');
      return;
    }
    this.socket.emit('send_message', { conversationId, text });
  }

  /**
   * Mark message as read
   * @param {string} messageId - Message MongoDB ID
   * @param {string} conversationId - Conversation MongoDB ID
   */
  markMessageRead(messageId, conversationId) {
    if (!this.socket?.connected) {
      console.warn('[Socket] Not connected');
      return;
    }
    this.socket.emit('read_message', { messageId, conversationId });
  }

  /**
   * Send typing indicator start
   * @param {string} conversationId - Conversation MongoDB ID
   */
  startTyping(conversationId) {
    if (!this.socket?.connected) {
      console.warn('[Socket] Not connected');
      return;
    }
    this.socket.emit('typing_start', { conversationId });
  }

  /**
   * Send typing indicator stop
   * @param {string} conversationId - Conversation MongoDB ID
   */
  stopTyping(conversationId) {
    if (!this.socket?.connected) {
      console.warn('[Socket] Not connected');
      return;
    }
    this.socket.emit('typing_stop', { conversationId });
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket?.connected) {
      this.socket.disconnect();
      console.log('[Socket] Disconnected');
    }
  }

  /**
   * Check if connected
   * @returns {boolean}
   */
  isConnected() {
    return this.socket?.connected || false;
  }

  /**
   * Get socket instance (rarely needed)
   * @returns {Object}
   */
  getSocket() {
    return this.socket;
  }
}

// Export singleton
export default new SocketService();
```

### 2. Create Socket Context (React)

Create `src/context/SocketContext.jsx`:

```javascript
import { createContext, useContext, useEffect, useState } from 'react';
import socketService from '../services/socketService';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children, token }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Map());

  useEffect(() => {
    if (token) {
      // Connect to socket server
      socketService.connect(token);

      // Listen for connection events
      const unsubConnection = socketService.on('socket:connected', () => {
        setIsConnected(true);
      });

      const unsubDisconnect = socketService.on('socket:disconnected', () => {
        setIsConnected(false);
        setOnlineUsers([]);
        setTypingUsers(new Map());
      });

      const unsubUserOnline = socketService.on('chat:user_online', (data) => {
        setOnlineUsers(data.onlineUserCount || 0);
      });

      const unsubUserOffline = socketService.on('chat:user_offline', (data) => {
        setOnlineUsers(data.onlineUserCount || 0);
      });

      const unsubTypingStart = socketService.on('chat:typing_started', (data) => {
        setTypingUsers((prev) => {
          const newMap = new Map(prev);
          const convId = data.conversationId;
          if (!newMap.has(convId)) {
            newMap.set(convId, []);
          }
          const users = newMap.get(convId);
          if (!users.includes(data.userId)) {
            users.push(data.userId);
          }
          return newMap;
        });
      });

      const unsubTypingStop = socketService.on('chat:typing_stopped', (data) => {
        setTypingUsers((prev) => {
          const newMap = new Map(prev);
          const convId = data.conversationId;
          if (newMap.has(convId)) {
            newMap.set(
              convId,
              newMap.get(convId).filter((id) => id !== data.userId)
            );
          }
          return newMap;
        });
      });

      // Cleanup
      return () => {
        unsubConnection();
        unsubDisconnect();
        unsubUserOnline();
        unsubUserOffline();
        unsubTypingStart();
        unsubTypingStop();
        socketService.disconnect();
      };
    }
  }, [token]);

  const value = {
    socket: socketService,
    isConnected,
    onlineUsers,
    typingUsers,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
```

## Usage in Components

### Chat Message Component

```javascript
import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';

export const ChatWindow = ({ conversationId, currentUserId }) => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  useEffect(() => {
    if (isConnected) {
      // Join conversation room
      socket.joinConversation(conversationId);

      // Listen for new messages
      const unsubMessage = socket.on('chat:receive_message', (message) => {
        setMessages((prev) => [...prev, message]);

        // Auto-mark as read
        socket.markMessageRead(message._id, conversationId);
      });

      // Listen for read receipts
      const unsubReadReceipt = socket.on('chat:receive_read_receipt', (data) => {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg._id === data.messageId) {
              return {
                ...msg,
                readBy: [
                  ...msg.readBy,
                  { userId: data.userId, readAt: data.readAt },
                ],
              };
            }
            return msg;
          })
        );
      });

      return () => {
        unsubMessage();
        unsubReadReceipt();
      };
    }
  }, [isConnected, conversationId]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    // Send typing indicator
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      socket.startTyping(conversationId);
    }

    // Clear timeout and set new one
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const timeout = setTimeout(() => {
      socket.stopTyping(conversationId);
      setIsTyping(false);
    }, 1000);

    setTypingTimeout(timeout);
  };

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      socket.sendMessage(conversationId, inputValue);
      setInputValue('');
      socket.stopTyping(conversationId);
      setIsTyping(false);
    }
  };

  return (
    <div className="chat-window">
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg._id} className="message">
            <div className="sender">{msg.sender?.name}</div>
            <div className="text">{msg.text}</div>
            <div className="timestamp">
              {new Date(msg.createdAt).toLocaleTimeString()}
            </div>
            <div className="read-by">
              {msg.readBy?.length > 1 && (
                <span>Read by {msg.readBy?.length - 1} other(s)</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Type a message..."
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};
```

### Typing Indicator Component

```javascript
import { useSocket } from '../context/SocketContext';

export const TypingIndicator = ({ conversationId, userNames }) => {
  const { typingUsers } = useSocket();

  const typingUserIds = typingUsers.get(conversationId) || [];
  const typingUserNamesList = typingUserIds
    .map((id) => userNames[id])
    .filter(Boolean);

  if (typingUserNamesList.length === 0) {
    return null;
  }

  return (
    <div className="typing-indicator">
      {typingUserNamesList.join(', ')} is typing...
    </div>
  );
};
```

## Initialization in App

### App.jsx

```javascript
import { useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

export default function App() {
  const { user, token } = useAuth();

  return (
    <SocketProvider token={token}>
      {/* Your app components */}
    </SocketProvider>
  );
}
```

## Testing Socket.IO Connection

### Manual Test with Browser Console

```javascript
// After page loads with token
const socket = socketService.getSocket();

// Check connection status
console.log(socket.connected); // true/false

// Check socket ID
console.log(socket.id); // socket-xxx-yyy

// Join a conversation
socketService.joinConversation('507f1f77bcf86cd799439011');

// Send a message
socketService.sendMessage('507f1f77bcf86cd799439011', 'Hello!');

// Start typing
socketService.startTyping('507f1f77bcf86cd799439011');

// Stop typing
socketService.stopTyping('507f1f77bcf86cd799439011');

// Mark message as read
socketService.markMessageRead('630c8f5c5e1f2a3b4c5d6e7f', '507f1f77bcf86cd799439011');
```

### Test Script

Create `src/test-socket.js`:

```javascript
import socketService from './services/socketService';

export const testSocket = async (token, conversationId) => {
  // Connect
  console.log('1. Connecting...');
  socketService.connect(token);

  // Wait for connection
  await new Promise((resolve) => {
    const unsub = socketService.on('socket:connected', () => {
      unsub();
      resolve();
    });
    setTimeout(() => {
      unsub();
      resolve();
    }, 5000);
  });

  console.log('2. Connected! Joining conversation...');
  socketService.joinConversation(conversationId);

  // Wait for join confirmation
  await new Promise((resolve) => {
    const unsub = socketService.on('chat:joined_conversation', (data) => {
      unsub();
      console.log('3. Joined successfully!', data);
      resolve();
    });
    setTimeout(resolve, 2000);
  });

  console.log('4. Sending test message...');
  socketService.sendMessage(conversationId, 'Test message from Socket.IO!');

  // Wait for message receipt
  await new Promise((resolve) => {
    const unsub = socketService.on('chat:receive_message', (msg) => {
      unsub();
      console.log('5. Message received!', msg);
      resolve();
    });
    setTimeout(resolve, 2000);
  });

  console.log('6. Testing typing indicators...');
  socketService.startTyping(conversationId);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  socketService.stopTyping(conversationId);

  console.log('✅ All tests passed!');
};
```

## Event Flow Diagram

```
Client                           Server                      Database
══════                          ══════                       ════════

[1] Connect with JWT
     ├─────────────────────────→ Verify token ──→ Cache userId/socketId
     │
[2] Listen for events ←──────── emit "connected"
     │
     │ [3] Join Conversation
     ├─────────────────────────→ Verify participant
     │                           Join room
     ├────────────────────────── emit "user_online"
     │
     │ [4] Send Message
     ├─────────────────────────→ Validate
     │                           Create message ──→ Save to DB
     │                           Update conversation
     ├────────────────────────── emit "receive_message" (to room)
     │
[5] Listen message
     │
     │ [6] Mark as Read
     ├─────────────────────────→ Update message ──→ Update in DB
     ├────────────────────────── emit "receive_read_receipt"
     │
     │ [7] Typing Indicators
     ├─────────────────────────→ Track in memory
     ├────────────────────────── emit "typing_started"/"typing_stopped"
     │
[8] Disconnect
     │
     ├─────────────────────────→ Cleanup connections
     │                           Remove from rooms
     ├────────────────────────── emit "user_offline"
```

## Best Practices

### 1. Connection Management
```javascript
// Always check connection before emitting
if (socket.isConnected()) {
  socket.sendMessage(conversationId, text);
}
```

### 2. Error Handling
```javascript
socket.on('chat:message_error', (error) => {
  console.error('Message error:', error);
  // Show user-friendly error message
  showToast(error.message);
});
```

### 3. Memory Leaks Prevention
```javascript
// Always unsubscribe in cleanup
useEffect(() => {
  const unsubscribe = socket.on('chat:event', handleEvent);
  return () => unsubscribe(); // Clean up
}, [socket]);
```

### 4. Typing Debouncing
```javascript
// Prevent spam of typing indicators
const TYPING_DEBOUNCE_DELAY = 1000; // 1 second

// Clear old timeout before setting new one
if (typingTimeoutRef.current) {
  clearTimeout(typingTimeoutRef.current);
}

typingTimeoutRef.current = setTimeout(() => {
  socket.stopTyping(conversationId);
}, TYPING_DEBOUNCE_DELAY);
```

### 5. Message Ordering
```javascript
// Add unique IDs to track message order
const sendMessage = (text) => {
  const tempId = Date.now();
  
  // Show optimistic message immediately
  addOptimisticMessage({ text, tempId });
  
  // Send via socket
  socket.sendMessage(conversationId, text);
  
  // On receive, update with real ID
  socket.on('chat:receive_message', (message) => {
    updateMessageId(tempId, message._id);
  });
};
```

## Performance Tips

1. **Batch Updates**: Don't update UI on every typing event
2. **Debounce Typing**: Wait 500ms before sending typing indicator
3. **Pagination**: Load messages in chunks, not all at once
4. **Memoization**: Use `useMemo` for computed typing user lists
5. **Virtual Scrolling**: Use virtual lists for large message histories

## Troubleshooting

### Connection Issues
- Check localhost:5000 is accessible
- Verify CORS settings on server
- Check browser console for WebSocket errors
- Verify token is valid

### Messages Not Received
- Ensure `chat:receive_message` listener is set up
- Verify user joined conversation with `joinConversation`
- Check server logs for message send errors
- Verify sender is conversation participant

### Typing Not Working
- Ensure `typing_start` sent before typing
- Check `typing_started` listener is registered
- Verify debounce timeout is working
- Check cleanup of typing indicators

## Debugging

Enable verbose logging:

```javascript
// In socketService.js
const DEBUG = true;

if (DEBUG) {
  socket.onAny((event, ...args) => {
    console.log(`[Socket Event] ${event}:`, args);
  });
}
```

Check Network Tab in DevTools:
- Messages tab → WebSocket connections
- See all emitted/received events
- Verify payload sizes
- Check latency

## Next Steps

1. Implement React components using examples above
2. Set up Socket.Provider in App.jsx
3. Test connection with manual Socket.IO client
4. Implement ChatWindow component
5. Add typing indicators
6. Test full message flow
7. Implement read receipts
8. Handle error cases

## Related Documentation

- [Backend Socket.IO Integration](./SOCKETIO_INTEGRATION.md)
- [Message API Reference](./MESSAGE_API.md)
- [Authentication Guide](./AUTHENTICATION_COMPLETE.md)
