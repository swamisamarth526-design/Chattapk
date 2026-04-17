# Message API Documentation

Complete documentation for message-related endpoints in ChatX API.

## Overview

All message endpoints are **protected routes** that require JWT authentication via `Authorization: Bearer <token>` header.

Message endpoints include:
- Conversation participant authentication
- Paginated message retrieval
- Real-time message sending
- Read receipt tracking
- Socket.IO ready (events can be emitted when connected)

---

## API Endpoints

### 1. Get Messages (Paginated)

**Endpoint:** `GET /api/messages/:conversationId?page=1&limit=20`

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `conversationId` (required): MongoDB ObjectId of the conversation

**Query Parameters:**
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Messages per page (default: 20, max: 100)

**Request Example:**
```bash
curl -X GET "http://localhost:5000/api/messages/507f1f77bcf86cd799439011?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "_id": "607f1f77bcf86cd799439020",
        "conversation": "507f1f77bcf86cd799439011",
        "sender": {
          "_id": "507f1f77bcf86cd799439010",
          "name": "Alice Johnson",
          "email": "alice@example.com",
          "avatar": "https://example.com/avatar1.jpg"
        },
        "text": "Hey, how are you?",
        "delivered": true,
        "readBy": [
          {
            "userId": "507f1f77bcf86cd799439012",
            "readAt": "2026-03-30T10:35:00.000Z"
          }
        ],
        "createdAt": "2026-03-30T10:30:00.000Z",
        "updatedAt": "2026-03-30T10:35:00.000Z"
      },
      {
        "_id": "607f1f77bcf86cd799439021",
        "conversation": "507f1f77bcf86cd799439011",
        "sender": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Bob Smith",
          "email": "bob@example.com",
          "avatar": null
        },
        "text": "I'm doing great! How about you?",
        "delivered": true,
        "readBy": [
          {
            "userId": "507f1f77bcf86cd799439010",
            "readAt": "2026-03-30T10:36:00.000Z"
          }
        ],
        "createdAt": "2026-03-30T10:32:00.000Z",
        "updatedAt": "2026-03-30T10:36:00.000Z"
      }
    ],
    "pagination": {
      "total": 42,
      "limit": 20,
      "page": 1,
      "pages": 3,
      "hasMore": true
    }
  },
  "message": "Messages retrieved successfully",
  "statusCode": 200
}
```

**Response Details:**
- **messages**: Array of message objects, oldest to newest (chat-friendly order)
- **sender**: Sender details with `_id`, `name`, `email`, `avatar`
- **delivered**: Whether message was delivered to recipient
- **readBy**: Array of users who read the message with read timestamps
- **pagination**: Page info with `total`, `pages`, and `hasMore` flag

**Error Responses:**

**400 - Invalid Conversation ID:**
```json
{
  "success": false,
  "message": "Invalid conversation ID format",
  "statusCode": 400,
  "errors": {
    "id": "Invalid conversation ID format"
  }
}
```

**403 - Unauthorized (Not Participant):**
```json
{
  "success": false,
  "message": "Unauthorized access to conversation",
  "statusCode": 403
}
```

**404 - Conversation Not Found:**
```json
{
  "success": false,
  "message": "Conversation not found",
  "statusCode": 404
}
```

**Key Features:**
- ✅ Messages sorted oldest to newest (chat-friendly)
- ✅ Paginated for performance
- ✅ Access control (403 if not participant)
- ✅ Includes sender details
- ✅ Includes delivery and read status

---

### 2. Send Message

**Endpoint:** `POST /api/messages`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "conversationId": "507f1f77bcf86cd799439011",
  "text": "Hello! How are you doing?"
}
```

**Request Example:**
```bash
curl -X POST "http://localhost:5000/api/messages" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "507f1f77bcf86cd799439011",
    "text": "Hello! How are you doing?"
  }'
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "607f1f77bcf86cd799439022",
    "conversation": "507f1f77bcf86cd799439011",
    "sender": {
      "_id": "507f1f77bcf86cd799439010",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "avatar": "https://example.com/avatar1.jpg"
    },
    "text": "Hello! How are you doing?",
    "delivered": false,
    "readBy": [],
    "createdAt": "2026-03-30T10:40:00.000Z",
    "updatedAt": "2026-03-30T10:40:00.000Z"
  },
  "message": "Message sent successfully",
  "statusCode": 201
}
```

**Error Responses:**

**400 - Missing Required Fields:**
```json
{
  "success": false,
  "message": "Validation failed",
  "statusCode": 400,
  "errors": {
    "conversationId": "Conversation ID is required",
    "text": "Message text is required"
  }
}
```

**400 - Text Too Long:**
```json
{
  "success": false,
  "message": "Validation failed",
  "statusCode": 400,
  "errors": {
    "text": "Message cannot exceed 5000 characters"
  }
}
```

**403 - Not Conversation Participant:**
```json
{
  "success": false,
  "message": "Unauthorized to send message in this conversation",
  "statusCode": 403
}
```

**404 - Conversation Not Found:**
```json
{
  "success": false,
  "message": "Conversation not found",
  "statusCode": 404
}
```

**Key Features:**
- ✅ Validates conversationId exists and user is participant
- ✅ Validates text is 1-5000 characters
- ✅ Trims whitespace automatically
- ✅ Updates conversation `lastMessage` field
- ✅ Sets message status to not delivered (for Socket.IO update)
- ✅ Socket.IO ready (commented hooks for real-time broadcast)
- ✅ Returns 201 Created status

---

### 3. Mark Message as Read

**Endpoint:** `PATCH /api/messages/:id/read`

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `id` (required): MongoDB ObjectId of the message

**Request Body:** None (empty body)

**Request Example:**
```bash
curl -X PATCH "http://localhost:5000/api/messages/607f1f77bcf86cd799439022/read" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "607f1f77bcf86cd799439022",
    "conversation": "507f1f77bcf86cd799439011",
    "sender": {
      "_id": "507f1f77bcf86cd799439010",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "avatar": "https://example.com/avatar1.jpg"
    },
    "text": "Hello! How are you doing?",
    "delivered": true,
    "readBy": [
      {
        "userId": "507f1f77bcf86cd799439012",
        "readAt": "2026-03-30T10:42:00.000Z"
      }
    ],
    "createdAt": "2026-03-30T10:40:00.000Z",
    "updatedAt": "2026-03-30T10:42:00.000Z"
  },
  "message": "Message marked as read",
  "statusCode": 200
}
```

**Error Responses:**

**400 - Invalid Message ID:**
```json
{
  "success": false,
  "message": "Invalid message ID format",
  "statusCode": 400,
  "errors": {
    "id": "Invalid message ID format"
  }
}
```

**403 - Not Conversation Participant:**
```json
{
  "success": false,
  "message": "Unauthorized",
  "statusCode": 403
}
```

**404 - Message Not Found:**
```json
{
  "success": false,
  "message": "Message not found",
  "statusCode": 404
}
```

**Key Features:**
- ✅ Marks message as read for current user
- ✅ Adds user to `readBy` array with timestamp
- ✅ Sets `delivered` flag if not already set
- ✅ Idempotent (calling multiple times safe)
- ✅ Validates user is conversation participant
- ✅ Socket.IO ready (commented hook for real-time updates)

---

## Authentication

### Getting a JWT Token

First, register or login to get a token:

```bash
# Register
curl -X POST "http://localhost:5000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Password123",
    "confirmPassword": "Password123"
  }'

# Or login
curl -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

Response includes `token`:
```json
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

Use the token in all message API requests:
```bash
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Data Model

### Message Object

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | MongoDB unique message ID |
| `conversation` | ObjectId | Conversation this message belongs to |
| `sender` | Object | Sender user details (name, email, avatar) |
| `text` | String | Message content (1-5000 characters) |
| `delivered` | Boolean | Whether message was delivered |
| `readBy` | Array | Users who have read the message |
| `createdAt` | ISO 8601 | When message was sent |
| `updatedAt` | ISO 8601 | Last update timestamp |

### Sender Details
```json
{
  "_id": "507f1f77bcf86cd799439010",
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "avatar": "https://example.com/avatar.jpg"
}
```

### Read Receipt
```json
{
  "userId": "507f1f77bcf86cd799439012",
  "readAt": "2026-03-30T10:35:00.000Z"
}
```

### Pagination Object
```json
{
  "pagination": {
    "total": 100,        // Total messages in conversation
    "limit": 20,         // Messages per page
    "page": 1,           // Current page number
    "pages": 5,          // Total pages
    "hasMore": true      // More messages available?
  }
}
```

---

## Use Cases

### 1. Load Chat History

When opening a conversation, load message history:

```bash
# Get first 20 messages
curl -X GET "http://localhost:5000/api/messages/CONV_ID?page=1&limit=20" \
  -H "Authorization: Bearer ${TOKEN}"
```

Response has `messages` from oldest to newest (for chat display) and `hasMore` to know if more to load.

### 2. Load More Messages (Infinite Scroll)

When user scrolls up to load older messages:

```bash
# Get next page (page 2)
curl -X GET "http://localhost:5000/api/messages/CONV_ID?page=2&limit=20" \
  -H "Authorization: Bearer ${TOKEN}"
```

Check `hasMore: true` to continue showing "Load More" button.

### 3. Send Message

When user types and sends a message:

```bash
curl -X POST "http://localhost:5000/api/messages" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "CONV_ID",
    "text": "Hello there!"
  }'
```

Frontend immediately displays message locally (optimistic rendering), then updates with server response including `_id` for future operations.

### 4. Mark as Read

When user reads a message (comes into viewport):

```bash
curl -X PATCH "http://localhost:5000/api/messages/MSG_ID/read" \
  -H "Authorization: Bearer ${TOKEN}"
```

Adds user to `readBy` array. Use debouncing to avoid too many requests.

---

## Important Notes

### Message Order

Messages are returned **oldest to newest** (natural chat order):
- Database: sorts by `createdAt: -1` (newest first)
- Response: reversed to show oldest first
- Frontend: append new messages to bottom, load old at top

### Pagination

Uses page-based pagination (not cursor):
```
page=1, limit=20   →  messages 1-20
page=2, limit=20   →  messages 21-40
page=3, limit=20   →  messages 41-60
```

Check `hasMore: true` to continue loading.

### Read Receipts

Each message tracks who read it:
```json
{
  "readBy": [
    { "userId": "alice-id", "readAt": "2026-03-30T10:35:00" },
    { "userId": "bob-id", "readAt": "2026-03-30T10:36:00" }
  ]
}
```

Frontend can show who read the message and when.

### Delivered vs Read

- **delivered**: Message reached the recipient (set automatically)
- **readBy**: User explicitly opened/read the message (via PATCH endpoint)

### Socket.IO Ready

Code includes commented-out hooks for Socket.IO events:
```javascript
// TODO: Emit Socket.IO event to conversation room
// const io = req.app.locals.io;
// if (io) {
//   io.to(`conversation-${conversationId}`).emit('message-sent', responseMessage);
// }
```

When Socket.IO is connected, uncomment these to broadcast real-time updates.

---

## Error Handling

### Common Errors

**401 Unauthorized - Missing Token:**
```json
{
  "success": false,
  "message": "No token provided",
  "statusCode": 401
}
```

**400 Bad Request - Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "statusCode": 400,
  "errors": {
    "text": "Message text is required"
  }
}
```

**403 Forbidden - Not Participant:**
```json
{
  "success": false,
  "message": "Unauthorized access to conversation",
  "statusCode": 403
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Conversation not found",
  "statusCode": 404
}
```

---

## Testing Checklist

### Prerequisites
- MongoDB running
- Server running: `npm run dev`
- Valid JWT tokens from auth endpoints
- Conversation IDs from conversation API

### Test Cases

**1.1 - Get messages (page 1)**
```bash
curl -X GET "http://localhost:5000/api/messages/CONV_ID?page=1&limit=20" \
  -H "Authorization: Bearer ${TOKEN}"
```
✓ Returns messages array (oldest to newest)
✓ Pagination info included
✓ Sender details populated

**1.2 - Get messages (next page)**
```bash
curl -X GET "http://localhost:5000/api/messages/CONV_ID?page=2&limit=20"
```
✓ Returns next 20 messages
✓ hasMore indicates if more available
✓ No duplicate messages between pages

**1.3 - Get messages (invalid conversation ID)**
✓ Returns 400 or 404 error

**1.4 - Get messages (unauthorized user)**
- Get conversation between Alice and Bob
- Try accessing with Charlie's token
✓ Returns 403 Forbidden

**2.1 - Send message (valid)**
```bash
curl -X POST "http://localhost:5000/api/messages" \
  -d '{"conversationId": "...", "text": "Hello"}'
```
✓ Returns 201 status
✓ Message has _id
✓ Conversation.lastMessage updated

**2.2 - Send message (updates lastMessage)**
- Get conversation before
- Send message
- Get conversation after
✓ lastMessage changed to new message ID

**2.3 - Send message (validation)**
- Missing conversationId
- Missing text
- Text too long (>5000)
✓ Returns 400 with field errors

**2.4 - Send message (unauthorized)**
- Send in conversation user not part of
✓ Returns 403 Forbidden

**3.1 - Mark as read (valid)**
```bash
curl -X PATCH "http://localhost:5000/api/messages/MSG_ID/read"
```
✓ Returns 200 status
✓ User added to readBy array
✓ delivered set to true

**3.2 - Mark as read (idempotent)**
- Mark same message as read twice
✓ First call adds to readBy
✓ Second call doesn't duplicate (or updates gracefully)

**3.3 - Mark as read (invalid ID)**
✓ Returns 400 error

**3.4 - Mark as read (unauthorized)**
- Mark message in conversation user not participant of
✓ Returns 403 Forbidden

**4.1 - Missing authorization**
```bash
curl -X GET "http://localhost:5000/api/messages/CONV_ID"
```
✓ Returns 401 error

---

## Response Format

All endpoints follow consistent response format:

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Success message",
  "statusCode": 200
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "statusCode": 400,
  "errors": { /* validation errors if applicable */ }
}
```

---

## Related Documentation

- [Conversation APIs](./CONVERSATION_API.md) - Create/manage conversations
- [User APIs](./USER_API.md) - Search users, find contacts
- [Authentication](./AUTH_API_TESTING.md) - Register, login, tokens
- [Database Models](./MODELS_COMPLETE.md) - Message schema
- [Socket.IO Integration](./SOCKET_IO_GUIDE.md) - Real-time events (coming next)
