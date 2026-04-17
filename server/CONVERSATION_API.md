# Conversation API Documentation

Complete documentation for conversation-related endpoints in ChatX API.

## Overview

All conversation endpoints are **protected routes** that require JWT authentication via `Authorization: Bearer <token>` header.

### Key Features
- ✅ Create new one-to-one conversations
- ✅ Fetch existing conversations (no duplicates)
- ✅ Get all conversations sorted by recent activity
- ✅ Include participant details and last message preview
- ✅ Include unread message counts
- ✅ Access control (only participants can view)
- ✅ One-to-one only (no group chats yet)

---

## API Endpoints

### 1. Get All Conversations

**Endpoint:** `GET /api/conversations`

**Authentication:** Required (Bearer token)

**Query Parameters:** None

**Request Example:**
```bash
curl -X GET "http://localhost:5000/api/conversations" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "otherUser": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Alice Johnson",
          "email": "alice@example.com",
          "avatar": "https://example.com/avatar1.jpg",
          "lastSeen": "2026-03-30T10:30:00.000Z"
        },
        "lastMessage": {
          "_id": "507f1f77bcf86cd799439013",
          "text": "Hey, how are you?",
          "sender": {
            "_id": "507f1f77bcf86cd799439012",
            "name": "Alice Johnson"
          },
          "createdAt": "2026-03-30T10:30:00.000Z"
        },
        "unreadCount": 2,
        "updatedAt": "2026-03-30T10:30:00.000Z",
        "createdAt": "2026-03-20T08:45:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439014",
        "otherUser": {
          "_id": "507f1f77bcf86cd799439015",
          "name": "Bob Smith",
          "email": "bob@example.com",
          "avatar": null,
          "lastSeen": "2026-03-29T20:15:00.000Z"
        },
        "lastMessage": null,
        "unreadCount": 0,
        "updatedAt": "2026-03-25T14:20:00.000Z",
        "createdAt": "2026-03-25T14:20:00.000Z"
      }
    ]
  },
  "message": "Conversations retrieved successfully",
  "statusCode": 200
}
```

**Response Details:**
- **conversations**: Array of conversation objects sorted by `updatedAt` (newest first)
- **otherUser**: The conversation partner (name, email, avatar, online status via lastSeen)
- **lastMessage**: Most recent message with sender info, null if no messages yet
- **unreadCount**: Number of unread messages for current user (0 if all read)
- **updatedAt**: Last activity in conversation (message sent or received)
- **createdAt**: When conversation was created

**Notes:**
- Conversations sorted by most recent activity (newest first)
- Only one-to-one conversations returned
- Current user excluded from otherUser field
- Perfect for sidebar chat list

---

### 2. Create One-to-One Conversation

**Endpoint:** `POST /api/conversations`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "otherUserId": "507f1f77bcf86cd799439012"
}
```

**Request Example:**
```bash
curl -X POST "http://localhost:5000/api/conversations" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "otherUserId": "507f1f77bcf86cd799439012"
  }'
```

**Success Response - New Conversation (201):**
```json
{
  "success": true,
  "data": {
    "conversation": {
      "_id": "507f1f77bcf86cd799439016",
      "otherUser": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Alice Johnson",
        "email": "alice@example.com",
        "avatar": "https://example.com/avatar1.jpg",
        "lastSeen": "2026-03-30T10:30:00.000Z"
      },
      "lastMessage": null,
      "unreadCount": 0,
      "updatedAt": "2026-03-30T12:00:00.000Z",
      "createdAt": "2026-03-30T12:00:00.000Z"
    }
  },
  "message": "Conversation created successfully",
  "statusCode": 201
}
```

**Success Response - Existing Conversation (200):**
```json
{
  "success": true,
  "data": {
    "conversation": {
      "_id": "507f1f77bcf86cd799439011",
      "otherUser": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Alice Johnson",
        "email": "alice@example.com",
        "avatar": "https://example.com/avatar1.jpg",
        "lastSeen": "2026-03-30T10:30:00.000Z"
      },
      "lastMessage": {
        "_id": "507f1f77bcf86cd799439013",
        "text": "Hey, how are you?",
        "sender": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Alice Johnson"
        },
        "createdAt": "2026-03-30T10:30:00.000Z"
      },
      "unreadCount": 2,
      "updatedAt": "2026-03-30T10:30:00.000Z",
      "createdAt": "2026-03-20T08:45:00.000Z"
    }
  },
  "message": "Conversation retrieved successfully",
  "statusCode": 200
}
```

**Error Responses:**

**400 - Missing User ID:**
```json
{
  "success": false,
  "message": "Validation failed",
  "statusCode": 400,
  "errors": {
    "otherUserId": "User ID is required"
  }
}
```

**400 - Invalid User ID Format:**
```json
{
  "success": false,
  "message": "Validation failed",
  "statusCode": 400,
  "errors": {
    "otherUserId": "Invalid user ID format"
  }
}
```

**400 - Cannot Chat with Self:**
```json
{
  "success": false,
  "message": "Cannot create conversation with yourself",
  "statusCode": 400
}
```

**404 - User Not Found:**
```json
{
  "success": false,
  "message": "User not found",
  "statusCode": 404
}
```

**Key Behaviors:**
- ✅ Automatically creates conversation if doesn't exist
- ✅ Returns existing conversation if already exists (idempotent)
- ✅ Prevents self-conversations
- ✅ Verifies other user exists before creating
- ✅ Status 201 for new creation, 200 for existing
- ✅ Initializes unread counts for both users

---

### 3. Get Conversation Details

**Endpoint:** `GET /api/conversations/:id`

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `id` (required): MongoDB ObjectId of the conversation

**Request Example:**
```bash
curl -X GET "http://localhost:5000/api/conversations/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "conversation": {
      "_id": "507f1f77bcf86cd799439011",
      "otherUser": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Alice Johnson",
        "email": "alice@example.com",
        "avatar": "https://example.com/avatar1.jpg",
        "lastSeen": "2026-03-30T10:30:00.000Z"
      },
      "participants": [
        {
          "_id": "507f1f77bcf86cd799439010",
          "name": "Current User",
          "email": "current@example.com",
          "avatar": "https://example.com/avatar0.jpg",
          "lastSeen": "2026-03-30T11:00:00.000Z"
        },
        {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Alice Johnson",
          "email": "alice@example.com",
          "avatar": "https://example.com/avatar1.jpg",
          "lastSeen": "2026-03-30T10:30:00.000Z"
        }
      ],
      "unreadCount": 2,
      "updatedAt": "2026-03-30T10:30:00.000Z",
      "createdAt": "2026-03-20T08:45:00.000Z"
    }
  },
  "message": "Conversation retrieved successfully",
  "statusCode": 200
}
```

**Error Responses:**

**400 - Invalid ID Format:**
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

**403 - Unauthorized Access:**
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
- ✅ Returns both participants with full details
- ✅ Includes unread count for current user
- ✅ Validates user is actually a participant (403 if not)
- ✅ Returns last activity timestamp (updatedAt)
- ✅ Safe to use before fetching message history

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

Use the token in all conversation API requests:
```bash
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Data Model

### Conversation Object

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | MongoDB unique conversation ID |
| `otherUser` | Object | Conversation partner details (in list endpoints) |
| `participants` | Array | Both users in conversation (in detail endpoint) |
| `lastMessage` | Object | Most recent message (with sender info) or null |
| `unreadCount` | Number | Unread messages for current user |
| `updatedAt` | ISO 8601 | Last activity timestamp |
| `createdAt` | ISO 8601 | Conversation creation timestamp |

### User Details (in Conversations)
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "avatar": "https://example.com/avatar.jpg",
  "lastSeen": "2026-03-30T10:30:00.000Z"
}
```

### Last Message (in Conversations)
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "text": "Hey, how are you?",
  "sender": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Alice Johnson"
  },
  "createdAt": "2026-03-30T10:30:00.000Z"
}
```

---

## Use Cases

### 1. Chat Sidebar - Load Conversations

Load current user's conversations for sidebar:

```bash
curl -X GET "http://localhost:5000/api/conversations" \
  -H "Authorization: Bearer ${TOKEN}"
```

Response contains all conversations sorted by most recent activity. Perfect for displaying chat list.

### 2. Open Chat Window

When user clicks on a contact to start chat:

```bash
# Create or fetch existing conversation
curl -X POST "http://localhost:5000/api/conversations" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"otherUserId": "507f1f77bcf86cd799439012"}'
```

Response includes:
- Conversation ID (for message operations)
- Other user details
- Last message preview
- Unread count

### 3. Load Conversation Header Info

When preparing to load messages, get full conversation details:

```bash
curl -X GET "http://localhost:5000/api/conversations/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer ${TOKEN}"
```

Verify user is participant and get participant details.

---

## Key Behaviors

### Duplicate Prevention

Only one conversation exists per unique pair of users:

```javascript
// Both create same conversation
POST /api/conversations { otherUserId: "alice-id" }  // User: bob
POST /api/conversations { otherUserId: "bob-id" }    // User: alice

// Both return same conversation._id (no duplicates)
```

### Participant-Only Access

Only participants can view a conversation:

```bash
# Alice can view her conversations with Bob
GET /api/conversations/conv-id
Authorization: Bearer alice-token
# ✓ 200 OK (Alice is participant)

# Charlie cannot view
GET /api/conversations/conv-id
Authorization: Bearer charlie-token
# ✗ 403 Forbidden (Charlie not participant)
```

### Sorted by Activity

Latest messages float to top:

```json
{
  "conversations": [
    { "lastMessage": { "createdAt": "2026-03-30T10:30" } },  // Newest
    { "lastMessage": { "createdAt": "2026-03-29T15:45" } },
    { "lastMessage": null }                                    // Oldest
  ]
}
```

### Unread Tracking

Each user has independent unread count:

```
Conversation between Alice and Bob:
- Alice has 2 unread messages from Bob
- Bob has 0 unread messages
- Each sees their own unread count when fetching
```

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

**401 Unauthorized - Invalid Token:**
```json
{
  "success": false,
  "message": "Invalid or expired token",
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
    "otherUserId": "Field-specific error message"
  }
}
```

**403 Forbidden - Access Denied:**
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

### Test Cases

**1.1 - Get all conversations (empty)**
```bash
curl -X GET "http://localhost:5000/api/conversations" \
  -H "Authorization: Bearer ${TOKEN}"
```
✓ Returns empty array
✓ No errors

**1.2 - Get all conversations (with data)**
- Create 3 conversations first
- Fetch all conversations
✓ Returns 3 conversations
✓ Sorted by updatedAt descending
✓ Each has otherUser and lastMessage fields

**2.1 - Create new conversation**
```bash
curl -X POST "http://localhost:5000/api/conversations" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"otherUserId": "alice-id"}'
```
✓ Returns 201 status
✓ Includes conversation._id
✓ lastMessage is null (no messages yet)
✓ unreadCount is 0

**2.2 - Create existing conversation (idempotent)**
- Create conversation twice with same user
✓ First returns 201 (created)
✓ Second returns 200 (fetched)
✓ Both return same conversation._id
✓ No duplicate conversations in DB

**2.3 - Create conversation with non-existent user**
```bash
curl -X POST "http://localhost:5000/api/conversations" \
  -d '{"otherUserId": "000000000000000000000000"}'
```
✓ Returns 404 error
✓ Error message: "User not found"

**2.4 - Create conversation with self**
```bash
curl -X POST "http://localhost:5000/api/conversations" \
  -d '{"otherUserId": "CURRENT_USER_ID"}'
```
✓ Returns 400 error
✓ Error message: "Cannot create conversation with yourself"

**2.5 - Create conversation validation**
- Missing otherUserId
- Invalid ObjectId format
✓ Returns 400 errors with specific field messages

**3.1 - Get conversation (valid, authorized)**
```bash
curl -X GET "http://localhost:5000/api/conversations/CONV_ID" \
  -H "Authorization: Bearer ${TOKEN}"
```
✓ Returns conversation details
✓ Both participants included
✓ unreadCount present

**3.2 - Get conversation (valid, unauthorized)**
- Get conversation user is NOT participant in
✓ Returns 403 error
✓ Error message: "Unauthorized access to conversation"

**3.3 - Get conversation (invalid ID format)**
```bash
curl -X GET "http://localhost:5000/api/conversations/invalid-id"
```
✓ Returns 400 error
✓ Error message: "Invalid conversation ID format"

**3.4 - Get conversation (non-existent)**
```bash
curl -X GET "http://localhost:5000/api/conversations/000000000000000000000000"
```
✓ Returns 404 error
✓ Error message: "Conversation not found"

**4.1 - Missing authorization header**
```bash
curl -X GET "http://localhost:5000/api/conversations"
```
✓ Returns 401 error

**4.2 - Invalid token**
```bash
curl -X GET "http://localhost:5000/api/conversations" \
  -H "Authorization: Bearer invalid-token"
```
✓ Returns 401 error

---

## Implementation Notes

### Database Queries

**Get All Conversations:**
```javascript
Conversation.find(
  { participants: userId, isGroup: false },
  { __v: 0 }
)
  .populate('participants', '_id name email avatar lastSeen')
  .populate({
    path: 'lastMessage',
    select: 'text sender createdAt',
    populate: { path: 'sender', select: '_id name' }
  })
  .sort({ updatedAt: -1 })
  .lean()
```

**Find Existing Conversation:**
```javascript
Conversation.findOne({
  participants: { $all: [userId1, userId2] },
  isGroup: false
})
```

### Key Design Decisions

1. **One-to-One Only**: `isGroup: false` filter prevents group chats
2. **Duplicate Prevention**: `$all` query finds conversation regardless of user order
3. **Field Projection**: Populate with select limits returned fields
4. **Lean Queries**: `.lean()` returns plain objects (faster for read-only)
5. **Access Control**: Check participant array before returning conversation
6. **Unread Tracking**: Per-user via Map structure in schema

---

## Next Steps

**Conversation messaging** (next phase):
- GET /api/messages/:conversationId - Get messages for conversation
- POST /api/messages - Send message in conversation
- PUT /api/messages/:id - Mark as read
- Socket.IO events for real-time updates

---

## Related Documentation

- [User APIs](./USER_API.md) - Search users, discover contacts
- [Authentication](./AUTH_API_TESTING.md) - Register, login, get tokens
- [Database Schemas](./MODELS_COMPLETE.md) - Conversation, Message models
- [Implementation Details](./USERS_API_COMPLETE.md) - Architecture pattern
