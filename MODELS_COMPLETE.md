# Step 4: MongoDB Models - Complete

All three Mongoose models are now fully implemented with proper validation, indexing, and methods.

## Models Created

### 1. User Model (src/models/User.js)

**Fields:**
- `name` (String, required, 2-50 characters)
- `email` (String, required, unique, email format validation)
- `password` (String, required, min 6 chars, hashed with bcryptjs)
- `avatar` (String, optional URL)
- `lastSeen` (Date, default: now, updated on activity)
- `createdAt` / `updatedAt` (automatic timestamps)

**Indexes:**
- `email` - Fast lookups for login/registration

**Security Features:**
- Pre-save hook automatically hashes password with bcryptjs (10 salt rounds)
- Only hashes if password is new or modified
- Password field hidden by default in queries (`select: false`)
- `comparePassword()` method for secure login verification

**Methods:**
- `comparePassword(enteredPassword)` - Verify password without exposing hash
- `toJSON()` - Returns user object without password field
- `isOnline` (virtual) - Returns true if lastSeen is within 5 minutes

**Usage:**
```javascript
// Register
const user = new User({ name, email, password });
await user.save(); // Password auto-hashed

// Login
const user = await User.findOne({ email }).select('+password');
const isMatch = await user.comparePassword(enteredPassword);

// Get user (no password)
const user = await User.findById(userId);
res.json(user.toJSON()); // Password excluded
```

---

### 2. Conversation Model (src/models/Conversation.js)

**Fields:**
- `participants` (Array of User IDs, required, at least 2)
- `lastMessage` (Reference to Message, optional)
- `isGroup` (Boolean, default: false)
- `groupName` (String, optional, for groups)
- `groupAvatar` (String, optional URL)
- `unreadCounts` (Map<userId -> {unreadCount, lastReadMessageId}>)
- `createdAt` / `updatedAt` (automatic timestamps, updatedAt changes with new messages)

**Indexes:**
- `participants` - Find conversations where user is participant
- `updatedAt` (descending) - Sort conversations by recency

**Methods:**
- `addParticipant(userId)` - Add user to group
- `removeParticipant(userId)` - Remove user from group
- `getOtherUser(currentUserId)` - Get other person in 1-on-1 chat
- `markAsRead(userId, lastReadMessageId)` - Clear unread count

**Usage:**
```javascript
// Get all conversations
const conversations = await Conversation.find({ participants: userId })
  .populate('lastMessage')
  .sort({ updatedAt: -1 });

// Create 1-on-1
const conv = new Conversation({
  participants: [userId1, userId2],
  isGroup: false
});

// Create group
const group = new Conversation({
  participants: [user1, user2, user3],
  isGroup: true,
  groupName: 'Dev Team'
});

// Mark as read
conversation.markAsRead(userId, lastMessageId);
```

---

### 3. Message Model (src/models/Message.js)

**Fields:**
- `conversation` (Reference to Conversation, required)
- `sender` (Reference to User, required)
- `text` (String, required, max 5000 chars)
- `delivered` (Boolean, default: false, set when received)
- `readBy` (Array of {userId, readAt} objects)
- `attachments` (Array of URLs, for future file support)
- `createdAt` / `updatedAt` (automatic timestamps)

**Indexes:**
- `conversation + createdAt` (descending) - Get messages in reverse chronological order
- `sender` - Find all messages from a user
- `delivered + conversation` - Find undelivered messages for retry logic

**Methods:**
- `markAsDelivered()` - Set delivered=true when clients confirm receipt
- `markAsReadBy(userId)` - Add user to readBy array
- `isReadBy(userId)` - Check if user has read message
- `getReadCount()` - Get number of people who read message (for groups)

**Usage:**
```javascript
// Send message
const message = new Message({
  conversation: convId,
  sender: userId,
  text: 'Hello'
});
await message.save();

// Mark delivered
await message.markAsDelivered();

// Mark read
await message.markAsReadBy(userId);

// Get messages in conversation
const messages = await Message.find({ conversation: convId })
  .populate('sender', 'name avatar')
  .sort({ createdAt: -1 })
  .limit(20);

// Check read status
if (message.isReadBy(userId)) {
  // Show read icon
}
```

---

## Why Each Field Exists

### User Model

| Field | Purpose | Usage |
|-------|---------|-------|
| name | Display name | Show in UI, messages |
| email | Unique ID for auth | Login, registration, password reset |
| password | Authentication | Login verification via comparePassword() |
| avatar | Profile picture | Display in conversations, user profile |
| lastSeen | Online status | Show "online" badge if recently active |

### Conversation Model

| Field | Purpose | Usage |
|-------|---------|-------|
| participants | Who's in this chat | Query "user's conversations", access control |
| lastMessage | Quick preview | Show in conversation list without fetching all messages |
| isGroup | Chat type | Determine UI/features (group name, etc.) |
| groupName | Group identifier | Display in header for groups |
| groupAvatar | Group picture | Visual identifier for group |
| unreadCounts | Unread badges | Show "5 unread" in conversation list |

### Message Model

| Field | Purpose | Usage |
|-------|---------|-------|
| conversation | Message ownership | Query "messages in this conversation" |
| sender | Author identification | Show message from this user |
| text | Message content | Display in chat window |
| delivered | Delivery status | Show ✓✓ icon (received by server) |
| readBy | Read receipts | Show ✓✓✓ icon (user read message) |
| attachments | Media support | Future: images, files, etc. |

---

## Index Explanation

### User: email

```javascript
userSchema.index({ email: 1 });
```

**Why:** Email is unique and used for login. Index speeds up:
- `User.findOne({ email: 'user@example.com' })` (login)
- `User.findOne({ email: 'user@example.com' })` (registration check)
- Prevents duplicate email inserts faster

---

### Conversation: participants

```javascript
conversationSchema.index({ participants: 1 });
```

**Why:** Most common query is "get all conversations for this user"

**Example Query:**
```javascript
// Without index: Scans entire collection
// With index: O(log n) lookup
Conversation.find({ participants: userId })
```

**Performance:** Index on array field checks if userId appears in participants array

---

### Conversation: updatedAt (descending)

```javascript
conversationSchema.index({ updatedAt: -1 });
```

**Why:** Conversations list is sorted by recency (most recent first)

**Example Query:**
```javascript
Conversation.find({ participants: userId })
  .sort({ updatedAt: -1 }) // Uses index for fast sorting
  .limit(20)
```

**Performance:** Descending index means database can read sorted results directly without sorting in memory

---

### Message: conversation + createdAt

```javascript
messageSchema.index({ conversation: 1, createdAt: -1 });
```

**Why:** Most common message query is "get messages from conversation, newest first"

**Example Query:**
```javascript
// Both conditions work together in one index
Message.find({ conversation: convId })
  .sort({ createdAt: -1 })
  .limit(20)
```

**Composite Index Benefit:** Both filtering (conversation) and sorting (createdAt) use same index efficiently

---

### Message: sender

```javascript
messageSchema.index({ sender: 1 });
```

**Why:** Support queries like "get all messages by this user" for analytics, timeline, etc.

---

### Message: delivered + conversation

```javascript
messageSchema.index({ delivered: 1, conversation: 1 });
```

**Why:** Find undelivered messages in a conversation for retry mechanism

**Example Query:**
```javascript
// Retry undelivered messages
Message.find({
  conversation: convId,
  delivered: false
})
```

---

## Data Relationships

```
User (1) ─────→ (many) Conversation (via participants array)
         └─────→ (many) Message (as sender)

Conversation (1) ─────→ (many) Message
             └─────→ (many) User (via participants)

Message (1) ─────→ User (as sender)
        └─────→ Conversation
```

### One-to-Many: Conversation → Message
- One conversation has many messages
- Query: `Message.find({ conversation: convId })`

### Many-to-Many: User ↔ Conversation
- One user in many conversations
- One conversation has many user-participants
- Query: `Conversation.find({ participants: userId })`

### One-to-Many: User → Message (as sender)
- One user sends many messages
- Query: `Message.find({ sender: userId })`

---

## Password Security Implementation

### Registration Flow
```
1. Client sends: { name, email, password }
2. Server creates User with plain password
3. Pre-save hook triggered
4. bcryptjs.hash(password, salt=10) called
5. Hashed password stored (never plain text)
6. Return user (password field hidden)
```

### Login Flow
```
1. Client sends: { email, password }
2. Server queries: User.findOne({ email }).select('+password')
3. Call user.comparePassword(enteredPassword)
4. bcryptjs.compare(plain, hashed) returns true/false
5. If true, generate JWT, return token
6. Never expose hashed password in response
```

### Why This Approach
- ✅ Password hashed immediately on save
- ✅ Even modified passwords auto-hashed
- ✅ Hidden by default (select: false)
- ✅ Safe comparison via bcryptjs
- ✅ Never returned in responses
- ✅ No plain text stored anywhere

---

## Safe JSON Transformation

Models are configured to exclude sensitive data from API responses:

### User
```javascript
// toJSON() method removes password
const userObj = user.toJSON(); // { name, email, avatar, ... } ← no password

// Also automatic in Express:
res.json(user); // Express calls toJSON() automatically
```

### Population with Exclusion
```javascript
// Exclude password when populating users
Conversation.populate('participants', '-password')

// Result: participants without password field
```

---

## Field Validation Examples

### User Email Validation
```javascript
email: {
  unique: true,
  match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
  // Rejects: invalid@, @example, user@.com
  // Accepts: user@example.com
}
```

### Message Text Validation
```javascript
text: {
  required: true,
  maxlength: 5000,
  // Prevents empty messages
  // Prevents abuse with massive texts
}
```

### User Name Validation
```javascript
name: {
  required: true,
  minlength: 2,
  maxlength: 50,
  // Must be 2-50 characters
}
```

---

## Files Created

1. **User.js** (120 lines)
   - Schema with validation
   - Password hashing hook
   - comparePassword method
   - toJSON method
   - isOnline virtual

2. **Conversation.js** (90 lines)
   - Schema with Map for unreadCounts
   - addParticipant/removeParticipant methods
   - getOtherUser method
   - markAsRead method
   - Two indexes

3. **Message.js** (100 lines)
   - Schema with readBy array
   - markAsDelivered method
   - markAsReadBy method
   - isReadBy method
   - getReadCount method
   - Three indexes

4. **USAGE_PATTERNS.js** (400+ lines)
   - Complete examples for all operations
   - Registration/login examples
   - Conversation CRUD examples
   - Message flow examples
   - Combined operation flows
   - Bulk operations

5. **MONGODB_SCHEMA_DESIGN.md** (600+ lines)
   - Comprehensive documentation
   - Field explanations
   - Index strategies
   - Relationship diagrams
   - Example data flows
   - Performance considerations

---

## Ready for Implementation

All models are ready to be used in controllers. Next steps:

1. ✅ Models created with validation
2. ✅ Password hashing implemented
3. ✅ Indexes added for performance
4. ✅ Instance methods created
5. ✅ Documentation complete
6. → Implement auth controllers (register, login)
7. → Implement CRUD operations
8. → Wire routes to controllers
9. → Test with Postman

---

## Key Features

✅ **Password Security** - bcryptjs hashing with salt=10
✅ **Data Validation** - Email format, field lengths, required fields
✅ **Indexes** - Optimized queries for common operations
✅ **Methods** - Helper functions for common tasks
✅ **Safe Responses** - Password never exposed in API
✅ **Flexibility** - Map structure for unread tracking
✅ **Scalability** - Ready for group chats, read receipts, etc.
✅ **Documentation** - Usage patterns file with examples

The models follow MongoDB best practices and are production-ready!
