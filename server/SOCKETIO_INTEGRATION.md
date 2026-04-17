# Socket.IO Real-Time Chat Integration

## Overview

Socket.IO has been fully integrated into the ChatX backend to enable real-time messaging, presence tracking, and typing indicators. The implementation includes JWT authentication, conversation rooms, and automatic cleanup on disconnect.

## Architecture

### Components

1. **sockets/index.js** - Main socket manager
   - Initializes Socket.IO with CORS config
   - Authenticates connections on initial handshake
   - Registers all event handlers
   - Manages connection lifecycle

2. **sockets/socketAuth.js** - Authentication utilities
   - `authenticateSocket(socket)` - Validates JWT on connection
   - `socketAuthMiddleware(socket, next)` - Event-level auth middleware
   - Supports multiple token sources (auth object, headers, query params)

3. **sockets/userManager.js** - Connection tracking
   - Maps userId ↔ socketId
   - Tracks users per conversation room
   - Manages typing indicators
   - Provides online presence data

4. **sockets/eventHandlers.js** - Event listeners
   - `handleJoinConversation` - User joins conversation room
   - `handleSendMessage` - Message creation and broadcast
   - `handleTypingStart` - Typing indicator start
   - `handleTypingStop` - Typing indicator end
   - `handleMessageRead` - Read receipt tracking
   - `handleDisconnect` - Cleanup on disconnect

5. **controllers/messageController.js** - REST API Socket.IO integration
   - `sendMessage` - Emits `receive_message` to conversation room
   - `markAsRead` - Emits `receive_read_receipt` to conversation room

## Event Flow

### Client → Server Events

#### 1. Join Conversation
When a user opens a chat window, they join the conversation room.

**Event:** `join_conversation`
**Data:**
```javascript
{
  conversationId: "507f1f77bcf86cd799439011"
}
```

**Server Actions:**
- Validates conversation format
- Checks user is a participant (403 if not)
- Adds user to room: `conversation-{conversationId}`
- Tracks user in userManager
- Broadcasts `user_online` to other participants

**Response:**
```javascript
{
  conversationId: "507f1f77bcf86cd799439011",
  roomUsers: ["userId1", "userId2"],
  timestamp: "2026-03-30T10:30:00Z"
}
```

#### 2. Send Message
User sends a message via Socket.IO (alternative to REST API).

**Event:** `send_message`
**Data:**
```javascript
{
  conversationId: "507f1f77bcf86cd799439011",
  text: "Hello, this is a real-time message!"
}
```

**Server Actions:**
- Validates message format (1-5000 chars)
- Verifies user is conversation participant
- Creates message in MongoDB
- Updates conversation.lastMessage
- Marks message as delivered=false initially
- Broadcasts `receive_message` to ALL room participants
- Note: Message is automatically read by sender

**Database Persistence:**
```javascript
{
  _id: ObjectId,
  conversation: ObjectId,
  sender: ObjectId,
  text: string,
  delivered: false,
  readBy: [{userId, readAt}],
  createdAt: Date,
  updatedAt: Date
}
```

**Broadcast to Room:**
```javascript
{
  _id: "630c8f5c5e1f2a3b4c5d6e7f",
  conversation: "507f1f77bcf86cd799439011",
  sender: {
    _id: "606c8f5c5e1f2a3b4c5d6e7f",
    name: "John Doe",
    email: "john@example.com",
    avatar: "https://..."
  },
  text: "Hello, this is a real-time message!",
  delivered: false,
  readBy: [{userId: "606c8f5c5e1f2a3b4c5d6e7f", readAt: Date}],
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. Typing Start
User begins typing a message.

**Event:** `typing_start`
**Data:**
```javascript
{
  conversationId: "507f1f77bcf86cd799439011"
}
```

**Server Actions:**
- Validates conversation format
- Verifies user is participant
- Adds user to typing list for this conversation
- Broadcasts `typing_started` to OTHER participants (excluding sender)

**Broadcast to Other Users:**
```javascript
{
  userId: "606c8f5c5e1f2a3b4c5d6e7f",
  conversationId: "507f1f77bcf86cd799439011",
  typingUsers: ["606c8f5c5e1f2a3b4c5d6e7f"], // Other typing users
  timestamp: Date
}
```

#### 4. Typing Stop
User stops typing.

**Event:** `typing_stop`
**Data:**
```javascript
{
  conversationId: "507f1f77bcf86cd799439011"
}
```

**Server Actions:**
- Removes user from typing list
- Broadcasts `typing_stopped` to room

**Broadcast to Room:**
```javascript
{
  userId: "606c8f5c5e1f2a3b4c5d6e7f",
  conversationId: "507f1f77bcf86cd799439011",
  typingUsers: [], // Remaining typing users
  timestamp: Date
}
```

#### 5. Read Message
User marks a message as read (can be via REST or Socket.IO).

**Event:** `read_message` (Socket.IO version)
**Data:**
```javascript
{
  messageId: "630c8f5c5e1f2a3b4c5d6e7f",
  conversationId: "507f1f77bcf86cd799439011"
}
```

**Server Actions:**
- Validates message format
- Verifies user is conversation participant
- Adds user to message.readBy array
- Sets delivered=true
- Broadcasts `receive_read_receipt` to room

**Broadcast to Room:**
```javascript
{
  messageId: "630c8f5c5e1f2a3b4c5d6e7f",
  userId: "606c8f5c5e1f2a3b4c5d6e7f",
  readAt: Date,
  timestamp: Date
}
```

### Server → Client Events

| Event | Triggered By | Recipient | Data |
|-------|--------------|-----------|------|
| `connected` | Socket connection | Connecting user | Socket info, userId, welcome msg |
| `user_online` | User joins conversation | All in conversation | userId, roomUsers, timestamp |
| `receive_message` | New message sent | All in conversation | Full message object with sender |
| `typing_started` | User starts typing | Other participants | userId, typingUsers list |
| `typing_stopped` | User stops typing | All in conversation | userId, typingUsers list |
| `receive_read_receipt` | Message marked read | All in conversation | messageId, userId, readAt |
| `user_offline` | User disconnects | All in conversations | userId, remaining roomUsers |
| `error` | Various errors | Sending user | message, error details |

## Connection Authentication

### JWT Token Handling

Socket connections are authenticated using JWT tokens from two sources:

1. **Initial Handshake** - Token provided on connection:
   ```javascript
   // Client code
   const socket = io('http://localhost:5000', {
     auth: {
       token: 'Bearer eyJhbGciOiJIUzI1NiIs...'
     }
   });
   ```

2. **Authorization Header:**
   ```javascript
   const socket = io('http://localhost:5000', {
     extraHeaders: {
       'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIs...'
     }
   });
   ```

3. **Query Parameter:**
   ```javascript
   const socket = io('http://localhost:5000?token=eyJhbGciOiJIUzI1NiIs...');
   ```

### Token Validation Flow

1. Client connects with token in handshake
2. Server calls `authenticateSocket(socket)`
3. Token is verified using `verifyToken()` from JWT utility
4. If invalid, socket is disconnected
5. If valid, `socket.userId` and `socket.user` are set
6. User is added to `userManager`

### Token Expiration

- JWT tokens expire after 7 days (configurable in .env)
- Expired tokens will be rejected on socket connection
- Client must re-authenticate by reconnecting with a new token
- Consider implementing token refresh mechanism for extended sessions

## Data Structures

### UserManager State

```javascript
// userId -> socketId mapping
onlineUsers: Map {
  "606c8f5c5e1f2a3b4c5d6e7f" => "eJ8fL4kX3mP9vQ2...",
  "5f9e9c8b7a6d5e4f3c2b1a09" => "aB2cD3eF4gH5iJ6..."
}

// socketId -> userId mapping
socketToUser: Map {
  "eJ8fL4kX3mP9vQ2..." => "606c8f5c5e1f2a3b4c5d6e7f",
  "aB2cD3eF4gH5iJ6..." => "5f9e9c8b7a6d5e4f3c2b1a09"
}

// conversation room -> users in room
roomUsers: Map {
  "conversation-507f1f77bcf86cd799439011" => Set {
    "606c8f5c5e1f2a3b4c5d6e7f",
    "5f9e9c8b7a6d5e4f3c2b1a09"
  }
}

// conversation room -> typing users
typingUsers: Map {
  "conversation-507f1f77bcf86cd799439011" => Set {
    "606c8f5c5e1f2a3b4c5d6e7f"
  }
}
```

### Message Delivery Flow

1. **Client sends message** via `send_message` event
2. **Server validates** conversation membership
3. **Database creates** message with:
   - `delivered: false` (initial)
   - `readBy: [{userId: sender, readAt: now}]` (auto-read by sender)
4. **Server broadcasts** `receive_message` to conversation room
5. **Other clients receive** and can display in UI
6. **Client calls** `read_message` when user views it
7. **Server updates** `delivered: true` and adds to `readBy`
8. **Server broadcasts** read receipt to room

### Read Receipt Flow

MongoDB Message structure:
```javascript
{
  _id: ObjectId,
  conversation: ObjectId,
  sender: ObjectId,
  text: "message content",
  delivered: true,
  readBy: [
    {
      userId: ObjectId,
      readAt: ISODate("2026-03-30T10:30:15Z")
    },
    {
      userId: ObjectId,
      readAt: ISODate("2026-03-30T10:31:20Z")
    }
  ],
  createdAt: ISODate("2026-03-30T10:30:00Z"),
  updatedAt: ISODate("2026-03-30T10:31:20Z")
}
```

## Room Management

### Conversation Rooms

Users are organized into rooms based on conversations:
- Room name format: `conversation-{conversationId}`
- Users join by calling `join_conversation` event
- Only conversation participants can join (validated server-side)
- All messages, read receipts, and typing indicators broadcast within room

### Room Access Control

**Before joining/sending/typing:**
1. Conversation must exist in MongoDB
2. User must be in conversation.participants array
3. Returns 403 Forbidden if not a participant
4. All validation happens server-side

## Disconnect Handling

When a user disconnects:

1. **Socket disconnect event triggers**
2. **Cleanup operations:**
   - Remove user from `onlineUsers` map
   - Remove from `socketToUser` map
   - Remove from all conversation rooms
   - Remove from typing lists
3. **Broadcast to remaining users:**
   - `user_offline` event to each room the user was in
   - Includes updated room member list
4. **Logging:** Disconnect event logged with user ID

### Reconnection

- If user reconnects with same token, gets new socketId
- Must call `join_conversation` again to rejoin rooms
- No messages are lost (all stored in MongoDB)

## Error Handling

### Connection Errors
- **No token provided** → Disconnected immediately
- **Invalid token** → Disconnected immediately  
- **Invalid format** → Sends `error` event to client

### Message Errors
| Error | Cause | Response |
|-------|-------|----------|
| Invalid conversation ID | Bad format | 400 validation error |
| Conversation not found | Doesn't exist | 404 not found |
| Not a participant | Unauthorized | 403 forbidden |
| Invalid message text | Empty or too long | 400 validation error |
| Message not found | Invalid message ID | 404 not found |

### Error Event Format
```javascript
{
  message: "Human-readable error message",
  code?: "optional error code"
}
```

## Performance Considerations

### Scalability Notes

1. **In-Memory Tracking** (current approach)
   - UserManager tracks connections in memory
   - Suitable for single-server deployments
   - For scaled deployments: implement Redis adapter

2. **Message Broadcasting**
   - Uses Socket.IO room broadcast
   - All connected users in room receive events
   - Efficient for small conversations

3. **Database Writes**
   - Messages persisted synchronously
   - Small latency on send_message
   - Consider async writes for high volume

4. **Typing Indicators**
   - Lightweight tracking in userManager
   - No database writes
   - Auto-cleanup on disconnect

### Optimization Opportunities

1. **Redis Adapter** (for horizontal scaling)
   ```javascript
   const { createAdapter } = require("@socket.io/redis-adapter");
   const { createClient } = require("redis");
   
   const pubClient = createClient({ host: "localhost", port: 6379 });
   const subClient = pubClient.duplicate();
   
   io.adapter(createAdapter(pubClient, subClient));
   ```

2. **Message Queuing** (for high volume)
   - Queue messages in Redis before persistence
   - Batch write to MongoDB periodically
   - Implement acknowledgments

3. **Compression**
   - Enable Socket.IO compression for large payloads
   - Reduces bandwidth for messages with long text

## Testing Socket.IO Integration

### Using Socket.IO Client Library

```javascript
// Node.js test client
const io = require('socket.io-client');

const socket = io('http://localhost:5000', {
  auth: {
    token: 'Bearer YOUR_JWT_TOKEN_HERE'
  }
});

socket.on('connected', (data) => {
  console.log('Connected:', data);
  
  // Join conversation
  socket.emit('join_conversation', {
    conversationId: '507f1f77bcf86cd799439011'
  });
});

socket.on('user_online', (data) => {
  console.log('User online:', data);
});

socket.on('joined_conversation', (data) => {
  console.log('Joined conversation:', data);
  
  // Send message
  socket.emit('send_message', {
    conversationId: '507f1f77bcf86cd799439011',
    text: 'Hello from Socket.IO!'
  });
});

socket.on('receive_message', (message) => {
  console.log('New message:', message);
  
  // Mark as read
  socket.emit('read_message', {
    messageId: message._id,
    conversationId: message.conversation
  });
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

### Using Socket.IO Web Client

```html
<script src="https://cdn.socket.io/4.8.0/socket.io.min.js"></script>
<script>
const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('token') // Get token from login
  }
});

socket.on('connected', (data) => {
  console.log('Connected to ChatX server:', data);
});

// Rest of event listeners...
</script>
```

## Comparison: REST API vs Socket.IO

### When to Use REST API for Messages

- **Simple one-off messages** (single request-response)
- **Batch operations** (getting message history)
- **External integrations** (webhooks, cronjobs)
- **Clients without WebSocket** (legacy browsers)

### When to Use Socket.IO for Messages

- **Real-time chat** (most common use case)
- **Typing indicators** (continuous state)
- **Read receipts** (instant feedback)
- **Presence tracking** (online/offline)
- **Multi-user conversations** (one message, many listeners)

### Example: REST API Still Works

```bash
# POST message via REST (still triggers Socket.IO broadcast)
curl -X POST http://localhost:5000/api/messages \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "507f1f77bcf86cd799439011",
    "text": "This message sent via REST will broadcast via Socket.IO"
  }'
```

The REST API's `sendMessage` endpoint includes Socket.IO emit code, so messages sent via REST are also broadcast in real-time to Socket.IO clients.

## Integration Checklist

- [x] Socket.IO attached to HTTP server
- [x] JWT authentication on connections
- [x] User manager tracks online users
- [x] Conversation rooms with access control
- [x] join_conversation event implemented
- [x] send_message event implemented (Socket.IO + REST emit)
- [x] typing_start/typing_stop events implemented
- [x] read_message event implemented
- [x] disconnect cleanup implemented
- [x] Error handling for all scenarios
- [x] All events properly logged
- [x] receive_message broadcasts on send
- [x] receive_read_receipt broadcasts on read
- [x] user_online broadcasts when joining
- [x] user_offline broadcasts on disconnect

## Frontend Integration Guide

See [client/SOCKETIO_CLIENT.md](../../client/SOCKETIO_CLIENT.md) for React Socket.IO client implementation.

### Key Differences from REST API

1. **Connection** instead of headers for auth
   - REST: Send token in Authorization header per request
   - Socket.IO: Authenticate once on connection

2. **Events** instead of request/response
   - REST: POST /api/messages returns message
   - Socket.IO: emit send_message, listen for receive_message

3. **Broadcasting** instead of returning data
   - REST: Only sender gets response
   - Socket.IO: All room participants get event

4. **Persistent connection** instead of per-request
   - REST: 1 connection per request
   - Socket.IO: 1 connection per session

## Configuration

### Server Environment Variables

```env
# HTTP Server
PORT=5000
NODE_ENV=development

# WebSocket CORS
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Database
MONGODB_URI=mongodb://localhost:27017/chatx
```

### Socket.IO Server Configuration

Current CORS settings in [server/index.js](./index.js):
```javascript
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
```

For production:
- Set `FRONTEND_URL` to actual frontend domain
- Consider environment-specific CORS policies
- Enable rate limiting on Socket.IO events

## Troubleshooting

### Connection Issues

**Client cannot connect:**
- Verify Socket.IO server is running on correct port
- Check CORS `origin` setting matches frontend URL
- Verify JWT token is valid and not expired
- Check browser console for WebSocket errors

**Authentication fails:**
- Ensure token is sent in auth handshake
- Verify JWT secret in .env matches token generation
- Check token expiration (default 7 days)

### Message Not Broadcasting

- Verify client joined conversation with `join_conversation`
- Check user is conversation participant
- Verify message was saved to MongoDB (check logs)
- Ensure other clients are listening for `receive_message`

### Typing Indicators Not Working

- Verify user sent `typing_start` before typing
- Check user sends `typing_stop` when done
- Ensure other clients listening for `typing_started`/`typing_stopped`
- Typing info is in-memory only (lost on server restart)

## Future Enhancements

1. **Message Search** - Full-text search across messages
2. **File Sharing** - Image/file uploads via Socket.IO
3. **Message Reactions** - Emoji reactions on messages
4. **Message Editing** - Edit sent messages
5. **Message Deletion** - Soft-delete messages
6. **Group Chat** - Extend to group conversations
7. **Voice/Video** - Integration with WebRTC
8. **Message Pins** - Pin important messages
9. **Read Markers** - Show read position in long conversations
10. **Last Seen** - Track user presence beyond online/offline

## Related Files

- [server/index.js](./index.js) - HTTP server setup
- [server/src/sockets/](./src/sockets/) - All socket modules
- [server/src/controllers/messageController.js](./src/controllers/messageController.js) - REST API with Socket.IO integration
- [client/SOCKETIO_CLIENT.md](../../client/SOCKETIO_CLIENT.md) - Frontend implementation
