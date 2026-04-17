const asyncHandler = require('../utils/asyncHandler');
const { sendResponse, sendError } = require('../utils/response');
const {
  withUserPresence,
  withUsersPresence,
} = require('../services/presenceService');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { buildConversationKey } = require('../utils/input');
const {
  validateCreateConversation,
  validateConversationId,
} = require('../validators/conversation');

function formatConversationPayload(conversation, currentUserId) {
  const otherParticipant =
    conversation.otherUser ||
    conversation.participants?.find(
      (participant) => participant?._id?.toString() !== currentUserId
    );
  const userUnreadData = conversation.unreadCounts?.get?.(currentUserId) || {
    unreadCount: conversation.unreadCount || 0,
  };

  return {
    _id: conversation._id,
    otherUser: withUserPresence(otherParticipant),
    lastMessage: conversation.lastMessage || null,
    unreadCount: userUnreadData.unreadCount || 0,
    updatedAt: conversation.updatedAt,
    createdAt: conversation.createdAt,
  };
}

/**
 * @desc Get all conversations for current user
 * @route GET /api/conversations
 * @access Private
 */
const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const conversations = await Conversation.find(
    { participants: userId, isGroup: false },
    { __v: 0 }
  )
    .populate({
      path: 'participants',
      select: '_id name email avatar lastSeen',
    })
    .populate({
      path: 'lastMessage',
      select: 'text sender createdAt',
      populate: {
        path: 'sender',
        select: '_id name',
      },
    })
    .sort({ updatedAt: -1 })
    .lean();

  return res.status(200).json(
    sendResponse(
      {
        conversations: conversations.map((conversation) =>
          formatConversationPayload(conversation, userId)
        ),
      },
      'Conversations retrieved successfully',
      200
    )
  );
});

/**
 * @desc Create or fetch existing one-to-one conversation
 * @route POST /api/conversations
 * @access Private
 * @body { otherUserId: string }
 */
const createConversation = asyncHandler(async (req, res) => {
  const currentUserId = req.user.userId;
  const { isValid, errors, values } = validateCreateConversation(req.body);

  if (!isValid) {
    return res.status(400).json(sendError('Validation failed', 400, errors));
  }

  const { otherUserId } = values;

  if (otherUserId === currentUserId) {
    return res
      .status(400)
      .json(sendError('Cannot create conversation with yourself', 400));
  }

  const otherUser = await User.findById(
    otherUserId,
    '_id name email avatar lastSeen'
  ).lean();

  if (!otherUser) {
    return res.status(404).json(sendError('User not found', 404));
  }

  const otherUserWithPresence = withUserPresence(otherUser);
  const conversationKey = buildConversationKey(currentUserId, otherUserId);

  let existingConversation = await Conversation.findOne({
    isGroup: false,
    $or: [
      { conversationKey },
      { participants: { $all: [currentUserId, otherUserId] } },
    ],
  })
    .populate({
      path: 'participants',
      select: '_id name email avatar lastSeen',
    })
    .populate({
      path: 'lastMessage',
      select: 'text sender createdAt',
      populate: {
        path: 'sender',
        select: '_id name',
      },
    })
    .lean();

  if (existingConversation) {
    if (!existingConversation.conversationKey) {
      await Conversation.findByIdAndUpdate(existingConversation._id, {
        conversationKey,
      });
    }

    return res.status(200).json(
      sendResponse(
        {
          conversation: formatConversationPayload(
            {
              ...existingConversation,
              otherUser: otherUserWithPresence,
            },
            currentUserId
          ),
        },
        'Conversation retrieved successfully',
        200
      )
    );
  }

  const newConversation = new Conversation({
    participants: [currentUserId, otherUserId],
    isGroup: false,
  });

  newConversation.unreadCounts.set(currentUserId.toString(), {
    unreadCount: 0,
    lastReadMessageId: null,
  });
  newConversation.unreadCounts.set(otherUserId.toString(), {
    unreadCount: 0,
    lastReadMessageId: null,
  });

  try {
    await newConversation.save();
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }

    existingConversation = await Conversation.findOne({
      isGroup: false,
      $or: [
        { conversationKey },
        { participants: { $all: [currentUserId, otherUserId] } },
      ],
    })
      .populate({
        path: 'participants',
        select: '_id name email avatar lastSeen',
      })
      .populate({
        path: 'lastMessage',
        select: 'text sender createdAt',
        populate: {
          path: 'sender',
          select: '_id name',
        },
      })
      .lean();

    return res.status(200).json(
      sendResponse(
        {
          conversation: formatConversationPayload(
            {
              ...existingConversation,
              otherUser: otherUserWithPresence,
            },
            currentUserId
          ),
        },
        'Conversation retrieved successfully',
        200
      )
    );
  }

  const populatedConversation = await Conversation.findById(newConversation._id)
    .populate({
      path: 'participants',
      select: '_id name email avatar lastSeen',
    })
    .lean();

  return res.status(201).json(
    sendResponse(
      {
        conversation: formatConversationPayload(
          {
            ...populatedConversation,
            otherUser: otherUserWithPresence,
            lastMessage: null,
            unreadCount: 0,
          },
          currentUserId
        ),
      },
      'Conversation created successfully',
      201
    )
  );
});

/**
 * @desc Get conversation details with access control
 * @route GET /api/conversations/:id
 * @access Private
 */
const getConversation = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { isValid, errors, value: conversationId } = validateConversationId(
    req.params.id
  );

  if (!isValid) {
    return res
      .status(400)
      .json(sendError('Invalid conversation ID format', 400, errors));
  }

  const conversation = await Conversation.findById(conversationId)
    .populate({
      path: 'participants',
      select: '_id name email avatar lastSeen',
    })
    .lean();

  if (!conversation) {
    return res.status(404).json(sendError('Conversation not found', 404));
  }

  const isParticipant = conversation.participants.some(
    (participant) => participant._id.toString() === userId
  );

  if (!isParticipant) {
    return res
      .status(403)
      .json(sendError('Unauthorized access to conversation', 403));
  }

  const otherUser = conversation.participants.find(
    (participant) => participant._id.toString() !== userId
  );
  const userUnreadData = conversation.unreadCounts?.get(userId) || {
    unreadCount: 0,
  };

  return res.status(200).json(
    sendResponse(
      {
        conversation: {
          _id: conversation._id,
          otherUser: withUserPresence(otherUser),
          participants: withUsersPresence(conversation.participants),
          unreadCount: userUnreadData.unreadCount || 0,
          updatedAt: conversation.updatedAt,
          createdAt: conversation.createdAt,
        },
      },
      'Conversation retrieved successfully',
      200
    )
  );
});

module.exports = {
  createConversation,
  getConversation,
  getConversations,
};
