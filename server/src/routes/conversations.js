const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getConversations,
  createConversation,
  getConversation,
} = require('../controllers/conversationController');

// All routes are protected (require authentication)

/**
 * GET /api/conversations
 * Get all one-to-one conversations for current user
 * Returns conversations sorted by most recent activity
 */
router.get('/', protect, getConversations);

/**
 * POST /api/conversations
 * Create new one-to-one conversation with another user
 * Returns existing conversation if already exists
 * Body: { otherUserId: string }
 */
router.post('/', protect, createConversation);

/**
 * GET /api/conversations/:id
 * Get specific conversation details (with access control)
 * Only accessible by conversation participants
 */
router.get('/:id', protect, getConversation);

module.exports = router;
