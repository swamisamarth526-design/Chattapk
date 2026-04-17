const asyncHandler = require('../utils/asyncHandler');
const { sendResponse, sendError } = require('../utils/response');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const {
  validateSendMessage,
  validateMessageId,
  validatePagination,
  validateConversationId,
} = require('../validators/message');

/**
 * @desc Get messages in a conversation (paginated)
 * @route GET /api/messages/:conversationId?page=1&limit=20
 * @access Private
 */
const getMessages = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  // Validate conversation ID format
  const {
    isValid: isValidConversationId,
    errors: conversationIdErrors,
    value: conversationId,
  } = validateConversationId(req.params.conversationId);
  if (!isValidConversationId) {
    return res
      .status(400)
      .json(
        sendError('Invalid conversation ID format', 400, conversationIdErrors)
      );
  }

  // Validate pagination
  const { isValid, errors, limit, page } = validatePagination(req.query);
  if (!isValid) {
    return res.status(400).json(sendError('Invalid pagination parameters', 400, errors));
  }
  const skip = (page - 1) * limit;

  // Verify conversation exists and user is participant
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json(sendError('Conversation not found', 404));
  }

  const isParticipant = conversation.participants.some((p) => p.toString() === userId);
  if (!isParticipant) {
    return res.status(403).json(sendError('Unauthorized access to conversation', 403));
  }

  // Get total message count
  const total = await Message.countDocuments({ conversation: conversationId });

  // Fetch messages (most recent first, then paginate)
  const messages = await Message.find({ conversation: conversationId })
    .populate({
      path: 'sender',
      select: '_id name email avatar',
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Reverse array to show oldest to newest (chat-friendly display)
  const reversedMessages = messages.reverse();

  return res.status(200).json(
    sendResponse(
      {
        messages: reversedMessages,
        pagination: {
          total,
          limit,
          page,
          pages: Math.ceil(total / limit),
          hasMore: skip + limit < total,
        },
      },
      'Messages retrieved successfully',
      200
    )
  );
});

/**
 * @desc Send a message
 * @route POST /api/messages
 * @access Private
 * @body { conversationId: string, text: string }
 */
const sendMessage = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  // Validate input
  const { isValid, errors, values } = validateSendMessage(req.body);
  if (!isValid) {
    return res.status(400).json(sendError('Validation failed', 400, errors));
  }

  const { conversationId, text } = values;

  // Verify conversation exists and user is participant
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json(sendError('Conversation not found', 404));
  }

  const isParticipant = conversation.participants.some((p) => p.toString() === userId);
  if (!isParticipant) {
    return res.status(403).json(sendError('Unauthorized to send message in this conversation', 403));
  }

  // Trim text to remove whitespace
  const trimmedText = text.trim();

  // Create message
  const message = new Message({
    conversation: conversationId,
    sender: userId,
    text: trimmedText,
    delivered: false,
    readBy: [{ userId, readAt: new Date() }],
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

  // Prepare response (socket.io ready - format with all fields for real-time)
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

  // Emit Socket.IO event to conversation room
  const io = req.app.locals.io;
  if (io) {
    io.to(`conversation-${conversationId}`).emit('receive_message', responseMessage);
  }

  return res.status(201).json(
    sendResponse(responseMessage, 'Message sent successfully', 201)
  );
});

/**
 * @desc Mark message(s) as read
 * @route PATCH /api/messages/:id/read
 * @access Private
 */
const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  // Validate message ID format
  const { isValid, errors, value: messageId } = validateMessageId(req.params.id);
  if (!isValid) {
    return res.status(400).json(sendError('Invalid message ID format', 400, errors));
  }

  // Fetch message
  const message = await Message.findById(messageId);
  if (!message) {
    return res.status(404).json(sendError('Message not found', 404));
  }

  // Verify user is in the conversation
  const conversation = await Conversation.findById(message.conversation);
  if (!conversation) {
    return res.status(404).json(sendError('Conversation not found', 404));
  }

  const isParticipant = conversation.participants.some((p) => p.toString() === userId);
  if (!isParticipant) {
    return res
      .status(403)
      .json(sendError('Unauthorized to access this message', 403));
  }

  // Check if already read by this user
  const alreadyRead = message.readBy.some((rb) => rb.userId.toString() === userId);

  if (!alreadyRead) {
    // Add user to readBy array
    message.readBy.push({
      userId,
      readAt: new Date(),
    });

    // Mark as delivered (if not already)
    if (!message.delivered) {
      message.delivered = true;
    }

    conversation.markAsRead(userId, message._id);
    await Promise.all([message.save(), conversation.save()]);
  } else if ((conversation.unreadCounts.get(userId)?.unreadCount || 0) > 0) {
    conversation.markAsRead(userId, message._id);
    await conversation.save();
  }

  // Populate sender for response
  await message.populate({
    path: 'sender',
    select: '_id name email avatar',
  });

  // Prepare response
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

  // Emit Socket.IO event
  const io = req.app.locals.io;
  if (io) {
    io.to(`conversation-${message.conversation}`).emit('receive_read_receipt', {
      messageId: message._id,
      userId,
      readAt: message.readBy.find((rb) => rb.userId.toString() === userId).readAt,
    });
  }

  return res.status(200).json(sendResponse(responseMessage, 'Message marked as read', 200));
});

module.exports = {
  getMessages,
  sendMessage,
  markAsRead,
};
