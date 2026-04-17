const mongoose = require('mongoose');
const { buildConversationKey } = require('../utils/input');

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    conversationKey: {
      type: String,
      default: null,
      index: {
        unique: true,
        partialFilterExpression: { conversationKey: { $type: 'string' } },
      },
    },
    groupName: {
      type: String,
      default: null,
    },
    groupAvatar: {
      type: String,
      default: null,
    },
    // For tracking unread messages per participant
    // Structure: { userId: { unreadCount: 5, lastReadMessageId: '...' } }
    unreadCounts: {
      type: Map,
      of: new mongoose.Schema(
        {
          unreadCount: { type: Number, default: 0 },
          lastReadMessageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
            default: null,
          },
        },
        { _id: false }
      ),
      default: new Map(),
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding conversations by participants
conversationSchema.index({ participants: 1 });

// Index for faster sorting by last message
conversationSchema.index({ updatedAt: -1 });

conversationSchema.pre('validate', async function () {
  if (!this.isGroup && Array.isArray(this.participants) && this.participants.length === 2) {
    this.conversationKey = buildConversationKey(...this.participants);
  } else {
    this.conversationKey = null;
  }
});

// Instance method to add participant
conversationSchema.methods.addParticipant = function (userId) {
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
  }
};

// Instance method to remove participant
conversationSchema.methods.removeParticipant = function (userId) {
  this.participants = this.participants.filter(
    (id) => !id.equals(userId)
  );
};

// Instance method to get other user in one-on-one conversation
conversationSchema.methods.getOtherUser = function (currentUserId) {
  if (this.isGroup) {
    return null;
  }
  return this.participants.find(
    (id) => !id.equals(currentUserId)
  );
};

// Instance method to mark message as read for a user
conversationSchema.methods.markAsRead = function (userId, lastReadMessageId) {
  if (!this.unreadCounts.has(userId.toString())) {
    this.unreadCounts.set(userId.toString(), {
      unreadCount: 0,
      lastReadMessageId: lastReadMessageId,
    });
  } else {
    const userReadData = this.unreadCounts.get(userId.toString());
    userReadData.unreadCount = 0;
    userReadData.lastReadMessageId = lastReadMessageId;
    this.unreadCounts.set(userId.toString(), userReadData);
  }
};

module.exports = mongoose.model('Conversation', conversationSchema);

