# ChatX MongoDB Schema Design

Complete documentation of the Mongoose models for the real-time chat application.

## Overview

The chat application uses 3 main models with specific relationships:
- **User**: Represents a user account
- **Conversation**: Represents a chat session (one-on-one or group)
- **Message**: Represents individual messages in a conversation

---

## User Schema

### Fields

#### Required Fields
- **name** (String)
  - Min: 2 characters, Max: 50 characters
  - Trimmed automatically
  - Why: Display name for user profile and messages

- **email** (String, Unique)
  - Must be valid email format
  - Case-insensitive (lowercase stored)
  - Why: Primary identifier for login/registration
  - Unique index for fast lookups

- **password** (String, Hashed)
  - Min: 6 characters required before hashing
  - Hashed with bcryptjs (10 salt rounds)
  - Not returned in queries by default (`select: false`)
  - Why: Secure authentication
  - Pre-save hook automatically hashes new/modified passwords

#### Optional Fields
- **avatar** (String)
  - URL to user's profile picture
  - Default: null
  - Why: Optional profile customization

- **lastSeen** (Date)
  - Tracks when user was last active
  - Default: Current date/time
  - Updated via API when user sends message or Socket.IO activity
  - Why: Show online/offline status

#### Auto-Generated
- **createdAt** (Date)
  - Automatically set when user is created
  
- **updatedAt** (Date)
  - Automatically updated when user is modified

### Indexes

```javascript
userSchema.index({ email: 1 });
```
- **Why**: Email is unique and used for login; index speeds up finding by email

### Methods & Hooks

#### Pre-save Hook: Password Hashing
```javascript
userSchema.pre('save', async function (next) {
  // Only hashes if password is new or modified
  // Uses bcryptjs with 10 salt rounds
})
```
- **Why**: Automatically hash password before storing in DB
- **When**: Only if password is modified (registration, password reset)
- **Security**: Never stores plain-text passwords

#### Instance Method: `comparePassword(enteredPassword)`
```javascript
const isMatch = await user.comparePassword('password123');
// Returns true if password matches, false otherwise
```
- **Why**: Verify password during login without exposing hashed password
- **Usage**: Called in auth controller during login

#### Instance Method: `toJSON()`
```javascript
const userObj = user.toJSON();
// Returns user object without password field
```
- **Why**: Prevents password from being sent in API responses
- **Automatic**: Used by Express when calling res.json(user)

#### Virtual: `isOnline`
```javascript
const online = user.isOnline; // Boolean
```
- **Why**: Determine if user is currently online
- **Logic**: Consider online if lastSeen is within last 5 minutes

### Example Usage

```javascript
// Create user
const user = new User({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'securePassword123'
});
await user.save(); // Password is automatically hashed

// Login verification
const user = await User.findOne({ email }).select('+password');
const isMatch = await user.comparePassword(enteredPassword);

// Get user safely (without password)
const user = await User.findById(userId);
res.json(user.toJSON()); // Password not included
```

---

## Conversation Schema

### Fields

#### Required Fields
- **participants** (Array of User references)
  - Array of User ObjectIds
  - At least 2 participants (one-on-one) or more (group)
  - Why: Track who is in this conversation
  - Indexed for fast queries

#### Optional/Conditional Fields
- **lastMessage** (Reference to Message)
  - Points to the most recent message
  - null if no messages yet
  - Why: Display preview in conversation list without fetching all messages
  - Why indexed: Used for sorting conversations by recency

- **isGroup** (Boolean)
  - Default: false (one-on-one chat)
  - When true: groupName and groupAvatar become relevant
  - Why: Determine conversation type and available features

- **groupName** (String)
  - Only used when isGroup is true
  - Default: null for one-on-one
  - Why: Display name for group conversations

- **groupAvatar** (String)
  - URL to group avatar image
  - Only used when isGroup is true
  - Default: null
  - Why: Visual identifier for group

#### Complex Field: `unreadCounts` (Map)
```javascript
// Structure: { userId: { unreadCount: 5, lastReadMessageId: '...' } }
unreadCounts: Map<userId -> { unreadCount, lastReadMessageId }>
```
- **Why**: Track unread message count per participant
- **Use case**: Show "5 unread" badge in conversation list
- **How**: Updated when message is sent, cleared when user reads
- **Methods**: `markAsRead(userId, lastReadMessageId)`

#### Auto-Generated
- **createdAt** (Date)
- **updatedAt** (Date)
  - Updated whenever message arrives or last message changes

### Indexes

```javascript
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });
```

1. **participants index**
   - Why: Query "find conversations where user is participant"
   - Usage: User requests all their conversations

2. **updatedAt index (descending)**
   - Why: Sort conversations by most recent activity
   - Usage: "Conversations list, sorted by recency"

### Methods & Helpers

#### `addParticipant(userId)`
```javascript
conversation.addParticipant(userId);
await conversation.save();
```
- Why: Add user to group conversation
- Safety: Checks if user already exists

#### `removeParticipant(userId)`
```javascript
conversation.removeParticipant(userId);
await conversation.save();
```
- Why: Remove user from group (user leaves or kicked)

#### `getOtherUser(currentUserId)`
```javascript
const otherUserId = conversation.getOtherUser(userId);
// Returns the other participant's ID in one-on-one chat
// Returns null for group conversations
```
- Why: In one-on-one chat, get other person's ID for display
- Usage: Populate conversation with other user's name/avatar

#### `markAsRead(userId, lastReadMessageId)`
```javascript
conversation.markAsRead(userId, messageId);
await conversation.save();
```
- Why: Clear unread count when user opens conversation
- Side effect: Stores which message was last read

### Example Usage

```javascript
// Get all conversations for a user, sorted by recency
const conversations = await Conversation.find({
  participants: userId
})
  .populate('lastMessage')
  .populate('participants', 'name email avatar')
  .sort({ updatedAt: -1 });

// Get other user in one-on-one conversation
const otherUserId = conversation.getOtherUser(currentUserId);
const otherUser = await User.findById(otherUserId);

// Mark conversation as read
conversation.markAsRead(userId, lastMessageId);
```

---

## Message Schema

### Fields

#### Required Fields
- **conversation** (Reference to Conversation)
  - ObjectId pointing to parent Conversation
  - Why: Every message belongs to exactly one conversation
  - Indexed with createdAt for range queries

- **sender** (Reference to User)
  - ObjectId of the user who sent the message
  - Why: Identify message author for display and permissions
  - Indexed for finding user's messages

- **text** (String)
  - Max: 5000 characters
  - Trimmed automatically
  - Why: Content of the message
  - Constraint prevents abuse (very long messages)

#### Status Fields

- **delivered** (Boolean)
  - Default: false
  - Set to true when all participants have received the message
  - Why: Show delivery status (✓ sent, ✓✓ delivered)
  - Indexed for efficient queries: "Show undelivered messages"

- **readBy** (Array of Objects)
  ```javascript
  readBy: [
    { userId: ObjectId, readAt: Date },
    { userId: ObjectId, readAt: Date },
    ...
  ]
  ```
  - Array of users who have read this message
  - Each entry includes userId and timestamp
  - Why: Track read receipts (✓✓✓ read)
  - Why: Show "seen" indicators in UI
  - Why: Show "3 people read" in group chats

#### Optional/Future
- **attachments** (Array of URLs)
  - Array of file URLs (images, documents, etc.)
  - Default: empty array
  - Why: Support rich media messages in future

#### Auto-Generated
- **createdAt** (Date)
  - Timestamp when message was sent
  - Used for sorting messages in conversation
  
- **updatedAt** (Date)
  - Updated when message is edited or receipts added

### Indexes

```javascript
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ delivered: 1, conversation: 1 });
```

1. **conversation + createdAt (descending)**
   - Why: Fetch messages from a conversation in reverse chronological order
   - Usage: "Load messages from conversation, most recent first"
   - Query: `Message.find({ conversation: id }).sort({ createdAt: -1 }).limit(20)`

2. **sender index**
   - Why: Find all messages from a specific user
   - Usage: Analytics, timeline, user activity

3. **delivered + conversation**
   - Why: Find undelivered messages in a conversation
   - Usage: Retry delivery mechanism
   - Query: `Message.find({ conversation: id, delivered: false })`

### Methods & Helpers

#### `markAsDelivered()`
```javascript
await message.markAsDelivered();
// Sets delivered to true and saves
```
- Why: Update status when message reaches all participants
- When: Called via Socket.IO when clients confirm receipt

#### `markAsReadBy(userId)`
```javascript
await message.markAsReadBy(userId);
// Adds user to readBy array with timestamp
```
- Why: Record that user has read the message
- Logic: Only adds if not already present (no duplicates)
- Automatic: Saves to database immediately
- When: User scrolls past message or Socket.IO event

#### `isReadBy(userId)`
```javascript
const hasRead = message.isReadBy(userId);
// Returns true if user has read this message
```
- Why: Check read status for display logic
- Usage: Show different icons based on read status

#### `getReadCount()`
```javascript
const count = message.getReadCount();
// Returns number of people who read the message
```
- Why: Show "Read by 3 people" in group chats
- Usage: Display read count in UI

### Example Usage

```javascript
// Send a message
const message = new Message({
  conversation: conversationId,
  sender: userId,
  text: 'Hello there!'
});
await message.save();

// Mark as delivered (when client receives)
await message.markAsDelivered();

// Mark as read (when user opens/scrolls)
await message.markAsReadBy(userId);

// Get all messages in conversation
const messages = await Message.find({
  conversation: conversationId
})
  .populate('sender', 'name email avatar')
  .sort({ createdAt: -1 })
  .limit(20);

// Check if message is read
if (message.isReadBy(userId)) {
  // Show read icon
}

// Get read count for group
const readCount = message.getReadCount();
// Display "Read by 7 people"
```

---

## Relationships Diagram

```
┌─────────────────────────────────────────────────────┐
│                     USER                             │
├─────────────────────────────────────────────────────┤
│ • _id (primary key)                                 │
│ • name, email (unique), password (hashed)           │
│ • avatar, lastSeen                                  │
│ • createdAt, updatedAt                              │
└────────────────────┬────────────────────────────────┘
                     │
           (participates in)
                     │
                     ↓
┌─────────────────────────────────────────────────────┐
│                CONVERSATION                          │
├─────────────────────────────────────────────────────┤
│ • _id (primary key)                                 │
│ • participants: [User._id, User._id, ...]           │
│ • lastMessage: Message._id (optional)               │
│ • isGroup, groupName, groupAvatar                   │
│ • unreadCounts: Map<User._id -> metadata>          │
│ • createdAt, updatedAt                              │
│ (indexed: participants, updatedAt)                  │
└────────────────────┬────────────────────────────────┘
                     │
           (contains)
                     │
                     ↓
┌─────────────────────────────────────────────────────┐
│                    MESSAGE                           │
├─────────────────────────────────────────────────────┤
│ • _id (primary key)                                 │
│ • conversation: Conversation._id                    │
│ • sender: User._id                                  │
│ • text (string, max 5000)                           │
│ • delivered (boolean)                               │
│ • readBy: [{ userId: User._id, readAt: Date }, ...] │
│ • attachments: [String] (URLs)                      │
│ • createdAt, updatedAt                              │
│ (indexed: conversation+createdAt, sender,           │
│  delivered+conversation)                            │
└─────────────────────────────────────────────────────┘
```

---

## Data Flow Examples

### Example 1: User Registration

```
1. Client sends: { name, email, password }
2. Create User with hashed password
3. Pre-save hook: hash password with bcryptjs
4. Save to DB
5. Return: User (without password field)
```

### Example 2: One-on-One Message

```
1. User A clicks on User B to start conversation
2. Check if Conversation exists where:
   - participants: [UserA._id, UserB._id]
   - isGroup: false
3. If not found, create new Conversation
4. User A types message and hits send
5. Create Message:
   - conversation: ConversationId
   - sender: UserA._id
   - text: "Hello"
   - delivered: false
6. Socket.IO emits to room 'conversation-{id}'
7. User B client receives message
8. User B client emits 'message-delivered' event
9. Server: message.markAsDelivered()
10. Socket.IO broadcasts to room
11. User A client sees double-checkmark (✓✓)
12. User B scrolls past message
13. User B client emits 'message-read' event
14. Server: message.markAsReadBy(UserB._id)
15. Socket.IO broadcasts to room
16. User A client sees triple-checkmark (✓✓✓)
```

### Example 3: Conversation List with Unread Count

```
1. User opens app
2. Query: Conversation.find({ participants: userId })
   .populate('lastMessage')
   .populate('participants', 'name avatar')
   .sort({ updatedAt: -1 })
3. For each conversation:
   - Display other participant's name/avatar
   - Display lastMessage.text as preview
   - Get unread count from unreadCounts[userId].unreadCount
   - Show badge: "5 unread"
4. When user clicks conversation:
   - conversation.markAsRead(userId, lastMessageId)
   - Real-time: unreadCounts[userId] resets to 0
   - Badge disappears
```

### Example 4: Group Chat with Read Receipts

```
1. User sends message to group of 5
2. Create Message with readBy: []
3. Broadcast to all 5 participants via Socket.IO
4. Each client calculates delivery time, emits 'delivered'
5. Server updates: message.delivered = true
6. When User 1 scrolls: emits 'read'
7. Server: message.markAsReadBy(User1._id)
8. Broadcast to group
9. UI shows: readBy.length = 1, "Read by 1 of 4"
10. When Users 2, 3 also read:
11. UI shows: readBy.length = 2, "Read by 2 of 4"
12. When all 4 read:
13. UI shows: readBy.length = 4, "Read by all"
```

---

## Query Patterns & Performance

### Efficient Queries Using Indexes

#### Get User's Conversations (indexed)
```javascript
const conversations = await Conversation.find({
  participants: userId
})
  .populate('participants', '-password')
  .sort({ updatedAt: -1 })
  .limit(20);
// Uses index on participants
```

#### Get Messages in Conversation (indexed)
```javascript
const messages = await Message.find({
  conversation: conversationId
})
  .populate('sender', 'name avatar')
  .sort({ createdAt: -1 })
  .limit(20);
// Uses index on conversation + createdAt
```

#### Find User's Messages (indexed)
```javascript
const messages = await Message.find({
  sender: userId,
  conversation: conversationId
})
  .sort({ createdAt: 1 });
// Uses index on sender
```

#### Find Undelivered Messages (indexed)
```javascript
const undelivered = await Message.find({
  conversation: conversationId,
  delivered: false
});
// Uses index on delivered + conversation
```

---

## Security Considerations

### Password Protection
- Password is hashed with bcryptjs (10 salt rounds)
- Never returned in API responses (select: false)
- Pre-save hook ensures even modified passwords are hashed
- `comparePassword()` method for verification

### Data Isolation
- Users can only read conversations they're participants of
- Messages only accessible through conversation
- Implement authorization checks in controllers

### Input Validation
- Email validated with regex
- Name length limited (2-50 chars)
- Message text limited (max 5000 chars)
- All strings trimmed

### Indexing Strategy
- All frequently queried fields are indexed
- Composite indexes for common queries
- Reduces database scans and improves performance

---

## Schema Evolution

### Future Enhancements

**User Model:**
- Add bio/status field
- Add phone number with verification
- Add notification preferences
- Add profile visibility settings

**Conversation Model:**
- Add archived flag
- Add mute notifications flag
- Add conversation metadata (pins, etc.)

**Message Model:**
- Add message editing history
- Add message reactions/emoji
- Add message forwarding
- Add message deletion (soft delete with flag)

### Backward Compatibility
- All new fields should have defaults
- Never remove fields (mark as deprecated instead)
- Ensure pre-existing documents work with new schema

---

## Summary

| Model | Purpose | Key Relationships | Indexes |
|-------|---------|------------------|---------|
| **User** | Authentication & profiles | Referenced by Conversation, Message | email (unique) |
| **Conversation** | Chat sessions | Has many Messages, has many Users | participants, updatedAt |
| **Message** | Individual messages | Belongs to Conversation, from User | conversation+createdAt, sender, delivered+conversation |

All models include:
- ✅ Automatic timestamps (createdAt, updatedAt)
- ✅ Validation at schema level
- ✅ Useful indexes for performance
- ✅ Helper methods for common operations
- ✅ Security (password hashing, data isolation)
- ✅ Flexibility for future enhancements
