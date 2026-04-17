// Model Usage Examples & Testing Reference
// Copy and modify these patterns for controllers and services

// ============================================
// USER MODEL EXAMPLES
// ============================================

// Registration Example
async function registerUser() {
  const User = require('./models/User');
  
  try {
    // Password is automatically hashed in pre-save hook
    const user = new User({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'SecurePassword123', // Will be hashed automatically
      avatar: 'https://api.example.com/avatars/john.jpg'
    });

    await user.save(); // Password hashing happens here
    
    // Return user without password
    return res.json(user.toJSON()); // { name, email, avatar, ... no password }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    throw error;
  }
}

// Login Example
async function loginUser(email, enteredPassword) {
  const User = require('./models/User');
  
  // IMPORTANT: Must select password field (default hidden)
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    throw new Error('User not found');
  }

  // Use instance method to compare passwords safely
  const isMatch = await user.comparePassword(enteredPassword);
  
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  // Return user without password
  return user.toJSON(); // Password is excluded
}

// Get User Profile
async function getUserProfile(userId) {
  const User = require('./models/User');
  
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  return user; // Password automatically hidden by select: false
}

// Update Last Seen
async function updateLastSeen(userId) {
  const User = require('./models/User');
  
  return User.findByIdAndUpdate(
    userId,
    { lastSeen: new Date() },
    { new: true }
  );
}

// Check Online Status
async function isUserOnline(userId) {
  const User = require('./models/User');
  
  const user = await User.findById(userId);
  return user.isOnline; // Virtual property: lastSeen within 5 minutes
}

// Search Users
async function searchUsers(query, excludeUserId) {
  const User = require('./models/User');
  
  return User.find({
    // Search in name or email
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } }
    ],
    // Exclude current user
    _id: { $ne: excludeUserId }
  })
    .limit(10)
    .select('-password'); // Exclude password explicitly
}

// ============================================
// CONVERSATION MODEL EXAMPLES
// ============================================

// Create One-on-One Conversation
async function createOrGetConversation(userId, otherUserId) {
  const Conversation = require('./models/Conversation');
  
  // Check if conversation already exists
  let conversation = await Conversation.findOne({
    participants: {
      $all: [userId, otherUserId]
    },
    isGroup: false
  }).populate('participants', '-password');

  if (!conversation) {
    // Create new conversation
    conversation = new Conversation({
      participants: [userId, otherUserId],
      isGroup: false
    });
    await conversation.save();
    await conversation.populate('participants', '-password');
  }

  return conversation;
}

// Get User's Conversations (Conversation List)
async function getUserConversations(userId, page = 1) {
  const Conversation = require('./models/Conversation');
  const limit = 20;
  const skip = (page - 1) * limit;

  const conversations = await Conversation.find({
    participants: userId
  })
    .populate('participants', 'name email avatar')
    .populate('lastMessage', 'text sender createdAt')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);

  // Enrich with unread counts and other user info
  const enriched = conversations.map(conv => ({
    ...conv.toJSON(),
    unreadCount: conv.unreadCounts.get(userId.toString())?.unreadCount || 0,
    otherUser: conv.participants.find(p => !p._id.equals(userId)), // For 1-on-1
  }));

  return enriched;
}

// Get Single Conversation
async function getConversation(conversationId, userId) {
  const Conversation = require('./models/Conversation');

  const conversation = await Conversation.findById(conversationId)
    .populate('participants', 'name email avatar')
    .populate('lastMessage');

  // Verify user is participant
  if (!conversation.participants.some(p => p._id.equals(userId))) {
    throw new Error('Access denied');
  }

  return conversation;
}

// Mark Conversation as Read
async function markConversationAsRead(conversationId, userId, lastMessageId) {
  const Conversation = require('./models/Conversation');

  const conversation = await Conversation.findById(conversationId);
  conversation.markAsRead(userId, lastMessageId);
  await conversation.save();

  return conversation;
}

// Create Group Conversation
async function createGroupConversation(groupName, participantIds) {
  const Conversation = require('./models/Conversation');

  const conversation = new Conversation({
    groupName,
    participants: participantIds,
    isGroup: true,
    groupAvatar: null // or upload URL
  });

  await conversation.save();
  return conversation.populate('participants', 'name email avatar');
}

// Add User to Group
async function addUserToGroup(conversationId, userId) {
  const Conversation = require('./models/Conversation');

  const conversation = await Conversation.findById(conversationId);

  if (!conversation.isGroup) {
    throw new Error('Can only add users to group conversations');
  }

  conversation.addParticipant(userId);
  await conversation.save();

  return conversation;
}

// Remove User from Group
async function removeUserFromGroup(conversationId, userId) {
  const Conversation = require('./models/Conversation');

  const conversation = await Conversation.findById(conversationId);
  conversation.removeParticipant(userId);
  await conversation.save();

  return conversation;
}

// ============================================
// MESSAGE MODEL EXAMPLES
// ============================================

// Send Message
async function sendMessage(conversationId, senderId, textContent) {
  const Message = require('./models/Message');
  const Conversation = require('./models/Conversation');

  // Create message
  const message = new Message({
    conversation: conversationId,
    sender: senderId,
    text: textContent,
    delivered: false,
    readBy: [] // Empty at creation, populated as clients read
  });

  await message.save();

  // Update conversation's lastMessage
  await Conversation.findByIdAndUpdate(
    conversationId,
    { lastMessage: message._id }
  );

  // Populate sender for response
  await message.populate('sender', 'name email avatar');

  return message;
}

// Get Messages in Conversation
async function getConversationMessages(conversationId, page = 1) {
  const Message = require('./models/Message');
  const limit = 20;
  const skip = (page - 1) * limit;

  const messages = await Message.find({
    conversation: conversationId
  })
    .populate('sender', 'name email avatar')
    .populate('readBy.userId', 'name avatar') // Show who read
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Reverse to get chronological order (oldest first)
  return messages.reverse();
}

// Mark Message as Delivered
async function markMessageAsDelivered(messageId) {
  const Message = require('./models/Message');

  const message = await Message.findById(messageId);
  await message.markAsDelivered();

  return message;
}

// Mark Message as Read
async function markMessageAsRead(messageId, userId) {
  const Message = require('./models/Message');

  const message = await Message.findById(messageId);
  await message.markAsReadBy(userId);

  // Return updated message with read count
  await message.populate('readBy.userId', 'name avatar');
  return {
    ...message.toJSON(),
    readCount: message.getReadCount(),
    isReadByUser: message.isReadBy(userId)
  };
}

// Mark Multiple Messages as Read (Bulk operation)
async function markMultipleMessagesAsRead(conversationId, userId) {
  const Message = require('./models/Message');

  const messages = await Message.find({
    conversation: conversationId,
    // Only messages not sent by this user
    sender: { $ne: userId }
  });

  // Mark each message as read by this user
  const updates = messages.map(msg => msg.markAsReadBy(userId));
  await Promise.all(updates);

  return messages;
}

// Get Unread Messages Count
async function getUnreadMessageCount(conversationId, userId) {
  const Message = require('./models/Message');

  const unreadCount = await Message.countDocuments({
    conversation: conversationId,
    // Messages not sent by this user
    sender: { $ne: userId },
    // Messages not read by this user
    'readBy.userId': { $ne: userId }
  });

  return unreadCount;
}

// Get Message with Full Details
async function getMessageDetails(messageId) {
  const Message = require('./models/Message');

  const message = await Message.findById(messageId)
    .populate('sender', 'name email avatar')
    .populate('conversation')
    .populate('readBy.userId', 'name avatar');

  if (!message) {
    throw new Error('Message not found');
  }

  return {
    ...message.toJSON(),
    readCount: message.getReadCount(),
    deliveryStatus: message.delivered ? 'delivered' : 'sent'
  };
}

// Delete Message (soft delete pattern - recommended)
async function deleteMessage(messageId) {
  const Message = require('./models/Message');

  // Option 1: Soft delete (keep record, hide content)
  const message = await Message.findByIdAndUpdate(
    messageId,
    {
      text: '[This message was deleted]',
      deleted: true // Add deleted field to schema if using soft delete
    },
    { new: true }
  );

  return message;

  // Option 2: Hard delete (remove completely)
  // return Message.findByIdAndDelete(messageId);
}

// Edit Message
async function editMessage(messageId, newText) {
  const Message = require('./models/Message');

  const message = await Message.findByIdAndUpdate(
    messageId,
    { text: newText },
    { new: true }
  ).populate('sender', 'name avatar');

  return message;
}

// Get Message Read Receipts (for group chat)
async function getMessageReadReceipts(messageId) {
  const Message = require('./models/Message');

  const message = await Message.findById(messageId)
    .populate('readBy.userId', 'name email avatar')
    .populate('conversation')
    .populate('sender', 'name');

  return {
    message: message.text,
    sender: message.sender.name,
    totalParticipants: message.conversation.participants.length - 1, // Exclude sender
    readBy: message.readBy.map(r => ({
      user: r.userId.name,
      readAt: r.readAt
    })),
    readCount: message.getReadCount(),
    unreadCount: (message.conversation.participants.length - 1) - message.getReadCount()
  };
}

// ============================================
// COMBINED OPERATIONS (Story-like flows)
// ============================================

// Complete Message Flow
async function completeMessageFlow(userId, otherUserId, messageText) {
  try {
    // Step 1: Create or get conversation
    let conversation = await createOrGetConversation(userId, otherUserId);
    console.log('Conversation:', conversation._id);

    // Step 2: Send message
    const message = await sendMessage(conversation._id, userId, messageText);
    console.log('Message sent:', message._id);

    // Step 3: Emit via Socket.IO to other user
    // socket.to('conversation-' + conversation._id).emit('message-received', message);

    // Step 4: Other user receives and emits delivered
    // (happens via Socket.IO event)

    // Step 5: Server marks as delivered
    await markMessageAsDelivered(message._id);
    console.log('Message delivered');

    // Step 6: Other user reads message
    await markMessageAsRead(message._id, otherUserId);
    console.log('Message read');

    // Step 7: Update conversation unread count
    await markConversationAsRead(conversation._id, otherUserId, message._id);
    console.log('Conversation marked as read');

    return {
      conversationId: conversation._id,
      messageId: message._id,
      status: 'read'
    };
  } catch (error) {
    console.error('Error in message flow:', error);
    throw error;
  }
}

// Export for use in controllers
module.exports = {
  // User functions
  registerUser,
  loginUser,
  getUserProfile,
  updateLastSeen,
  isUserOnline,
  searchUsers,

  // Conversation functions
  createOrGetConversation,
  getUserConversations,
  getConversation,
  markConversationAsRead,
  createGroupConversation,
  addUserToGroup,
  removeUserFromGroup,

  // Message functions
  sendMessage,
  getConversationMessages,
  markMessageAsDelivered,
  markMessageAsRead,
  markMultipleMessagesAsRead,
  getUnreadMessageCount,
  getMessageDetails,
  deleteMessage,
  editMessage,
  getMessageReadReceipts,

  // Combined flows
  completeMessageFlow
};
