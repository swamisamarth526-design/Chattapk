const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation is required'],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    // Track which users have received the message
    delivered: {
      type: Boolean,
      default: false,
    },
    // Track which users have read the message
    readBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Optional: Store attachments in future (URLs or file data)
    attachments: [
      {
        type: String, // URL to file
        default: [],
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Index for faster message retrieval in a conversation
messageSchema.index({ conversation: 1, createdAt: -1 });

// Index for finding messages by sender
messageSchema.index({ sender: 1 });

// Index for efficient "unread messages" queries
messageSchema.index({ delivered: 1, conversation: 1 });

// Instance method to mark message as delivered
messageSchema.methods.markAsDelivered = function () {
  this.delivered = true;
  return this.save();
};

// Instance method to mark message as read by a user
messageSchema.methods.markAsReadBy = function (userId) {
  // Check if user already read the message
  const alreadyRead = this.readBy.some((read) =>
    read.userId.equals(userId)
  );

  if (!alreadyRead) {
    this.readBy.push({
      userId: userId,
      readAt: new Date(),
    });
  }

  return this.save();
};

// Instance method to check if message is read by specific user
messageSchema.methods.isReadBy = function (userId) {
  return this.readBy.some((read) =>
    read.userId.equals(userId)
  );
};

// Instance method to get read count
messageSchema.methods.getReadCount = function () {
  return this.readBy.length;
};

// Middleware to populate sender details before returning
messageSchema.pre(/^find/, async function () {
  // Pre-find hook is intentionally kept to avoid switching to callback style
  // Existing code simply forwards to next; async hook avoids next arg issues
});

module.exports = mongoose.model('Message', messageSchema);

