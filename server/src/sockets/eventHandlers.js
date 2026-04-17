/**
 * Socket.IO Event Handlers
 * Handles all socket events for real-time chat functionality
 */

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const userManager = require('./userManager');
const { updateUserLastSeen } = require('../services/presenceService');
const { validateConversationId } = require('../validators/conversation');
const {
  validateMessageId,
  validateSendMessage,
} = require('../validators/message');

/**
 * Handle user joining a conversation room
 * Validates that user is a participant in the conversation
 *
 * @param {Object} socket - Socket.IO socket instance
 * @param {Object} io - Socket.IO instance
 */
const handleJoinConversation = (socket, io) => {
  socket.on('join_conversation', async (data) => {
    const { isValid, value: conversationId } = validateConversationId(
      data?.conversationId
    );
    const userId = socket.userId;

    console.log(
      `[Event] User ${userId} attempting to join conversation ${conversationId}`
    );

    try {
      // Validate conversation ID format
      if (!isValid) {
        socket.emit('error', { message: 'Invalid conversation ID format' });
        return;
      }

      // Verify conversation exists and user is participant
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found' });
        return;
      }

      const isParticipant = conversation.participants.some(
        (p) => p.toString() === userId
      );
      if (!isParticipant) {
        socket.emit('error', { message: 'Not a participant in this conversation' });
        return;
      }

      // Join the room
      const roomName = `conversation-${conversationId}`;
      socket.join(roomName);
      userManager.addUserToRoom(conversationId, userId);

      console.log(`[Event] User ${userId} joined conversation ${conversationId}`);

      // Notify other users in the room that a user has joined
      const roomUsers = Array.from(userManager.getRoomUsers(conversationId));
      io.to(roomName).emit('user_online', {
        userId,
        isOnline: true,
        lastSeen: new Date(),
        roomUsers,
        timestamp: new Date(),
      });

      // Send acknowledgement to the joining user
      socket.emit('joined_conversation', {
        conversationId,
        roomUsers,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error(`[Event] Error joining conversation:`, error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  });
};

/**
 * Handle user sending a message
 * Validates message, saves to DB, broadcasts to room
 *
 * @param {Object} socket - Socket.IO socket instance
 * @param {Object} io - Socket.IO instance
 */
const handleSendMessage = (socket, io) => {
  socket.on('send_message', async (data) => {
    const { isValid, errors, values } = validateSendMessage(data || {});
    const { conversationId, text } = values;
    const userId = socket.userId;

    console.log(
      `[Event] User ${userId} sending message in conversation ${conversationId}`
    );

    try {
      // Validate input
      if (!isValid) {
        socket.emit('error', { message: 'Validation failed', errors });
        return;
      }

      // Verify conversation exists and user is participant
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found' });
        return;
      }

      const isParticipant = conversation.participants.some(
        (p) => p.toString() === userId
      );
      if (!isParticipant) {
        socket.emit('error', { message: 'Not a participant in this conversation' });
        return;
      }

      // Create message in database
      const message = new Message({
        conversation: conversationId,
        sender: userId,
        text,
        delivered: false,
        readBy: [{ userId, readAt: new Date() }], // Message is read by sender on creation
      });

      await message.save();

      // Populate sender details
      await message.populate({
        path: 'sender',
        select: '_id name email avatar',
      });

      // Update conversation's lastMessage
      conversation.lastMessage = message._id;
      conversation.updatedAt = new Date();
      conversation.markAsRead(userId, message._id);
      conversation.participants.forEach((participantId) => {
        const participantKey = participantId.toString();

        if (participantKey === userId) {
          return;
        }

        const currentUnreadState = conversation.unreadCounts.get(participantKey) || {
          unreadCount: 0,
          lastReadMessageId: null,
        };

        conversation.unreadCounts.set(participantKey, {
          ...currentUnreadState,
          unreadCount: currentUnreadState.unreadCount + 1,
        });
      });
      await conversation.save();

      // Prepare response message
      const responseMessage = {
        _id: message._id,
        conversation: message.conversation,
        sender: message.sender,
        text: message.text,
        delivered: message.delivered,
        readBy: message.readBy,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      };

      // Broadcast to conversation room
      const roomName = `conversation-${conversationId}`;
      io.to(roomName).emit('receive_message', responseMessage);

      console.log(
        `[Event] Message ${message._id} sent to conversation ${conversationId}`
      );
    } catch (error) {
      console.error(`[Event] Error sending message:`, error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
};

/**
 * Handle user typing indicator
 *
 * @param {Object} socket - Socket.IO socket instance
 * @param {Object} io - Socket.IO instance
 */
const handleTypingStart = (socket, io) => {
  socket.on('typing_start', async (data) => {
    const { isValid, value: conversationId } = validateConversationId(
      data?.conversationId
    );
    const userId = socket.userId;

    try {
      // Validate conversation ID
      if (!isValid) {
        socket.emit('error', { message: 'Invalid conversation ID' });
        return;
      }

      // Verify user is in conversation
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found' });
        return;
      }

      const isParticipant = conversation.participants.some(
        (p) => p.toString() === userId
      );
      if (!isParticipant) {
        socket.emit('error', { message: 'Not a participant in this conversation' });
        return;
      }

      // Mark user as typing
      userManager.setUserTyping(conversationId, userId);

      // Broadcast typing indicator to other users in the room
      const roomName = `conversation-${conversationId}`;
      const typingUsers = userManager.getTypingUsers(conversationId, userId);

      io.to(roomName).emit('typing_started', {
        userId,
        conversationId,
        typingUsers,
        timestamp: new Date(),
      });

      console.log(`[Event] User ${userId} is typing in conversation ${conversationId}`);
    } catch (error) {
      console.error(`[Event] Error handling typing start:`, error);
    }
  });
};

/**
 * Handle user stopping typing indicator
 *
 * @param {Object} socket - Socket.IO socket instance
 * @param {Object} io - Socket.IO instance
 */
const handleTypingStop = (socket, io) => {
  socket.on('typing_stop', async (data) => {
    const { isValid, value: conversationId } = validateConversationId(
      data?.conversationId
    );
    const userId = socket.userId;

    try {
      // Validate conversation ID
      if (!isValid) {
        return;
      }

      // Remove user from typing list
      userManager.removeUserTyping(conversationId, userId);

      // Broadcast stop typing to other users in the room
      const roomName = `conversation-${conversationId}`;
      const typingUsers = userManager.getTypingUsers(conversationId);

      io.to(roomName).emit('typing_stopped', {
        userId,
        conversationId,
        typingUsers,
        timestamp: new Date(),
      });

      console.log(`[Event] User ${userId} stopped typing in conversation ${conversationId}`);
    } catch (error) {
      console.error(`[Event] Error handling typing stop:`, error);
    }
  });
};

/**
 * Handle message read receipt
 *
 * @param {Object} socket - Socket.IO socket instance
 * @param {Object} io - Socket.IO instance
 */
const handleMessageRead = (socket, io) => {
  socket.on('read_message', async (data) => {
    const { isValid, value: messageId } = validateMessageId(data?.messageId);
    const conversationId = data?.conversationId;
    const userId = socket.userId;

    try {
      // Validate message ID format
      if (!isValid) {
        socket.emit('error', { message: 'Invalid message ID' });
        return;
      }

      // Fetch and update message
      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      // Verify user is in the conversation
      const conversation = await Conversation.findById(message.conversation);
      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found' });
        return;
      }

      const isParticipant = conversation.participants.some(
        (p) => p.toString() === userId
      );
      if (!isParticipant) {
        socket.emit('error', { message: 'Not a participant in this conversation' });
        return;
      }

      // Check if already read by this user
      const alreadyRead = message.readBy.some((rb) => rb.userId.toString() === userId);

      if (!alreadyRead) {
        // Add user to readBy array
        message.readBy.push({
          userId,
          readAt: new Date(),
        });

        // Mark as delivered
        if (!message.delivered) {
          message.delivered = true;
        }

        conversation.markAsRead(userId, message._id);
        await Promise.all([message.save(), conversation.save()]);
      } else if ((conversation.unreadCounts.get(userId)?.unreadCount || 0) > 0) {
        conversation.markAsRead(userId, message._id);
        await conversation.save();
      }

      // Broadcast read receipt to conversation room
      const roomName = `conversation-${conversationId || message.conversation}`;
      io.to(roomName).emit('receive_read_receipt', {
        messageId: message._id,
        userId,
        readAt: message.readBy.find((rb) => rb.userId.toString() === userId).readAt,
        timestamp: new Date(),
      });

      console.log(`[Event] User ${userId} read message ${messageId}`);
    } catch (error) {
      console.error(`[Event] Error handling message read:`, error);
      socket.emit('error', { message: 'Failed to mark message as read' });
    }
  });
};

/**
 * Handle user disconnect
 * Cleans up user data and notifies other users
 *
 * @param {Object} socket - Socket.IO socket instance
 * @param {Object} io - Socket.IO instance
 */
const handleDisconnect = (socket, io) => {
  socket.on('disconnect', () => {
    const trackedUserId = userManager.removeUser(socket.id);

    if (trackedUserId) {
      const disconnectedAt = new Date();
      const userId = trackedUserId;

      updateUserLastSeen(userId, disconnectedAt).catch((error) => {
        console.error('[Event] Failed to update lastSeen on disconnect:', error);
      });

      io.emit('user_offline', {
        userId,
        isOnline: false,
        lastSeen: disconnectedAt,
        onlineUserCount: userManager.getOnlineUserCount(),
        onlineUserIds: userManager.getAllOnlineUsers(),
        timestamp: disconnectedAt,
      });

      console.log(
        `[Event] User ${userId} disconnected (socket: ${socket.id}). Active users: ${userManager.getOnlineUserCount()}`
      );
    }
  });
};

module.exports = {
  handleJoinConversation,
  handleSendMessage,
  handleTypingStart,
  handleTypingStop,
  handleMessageRead,
  handleDisconnect,
};
