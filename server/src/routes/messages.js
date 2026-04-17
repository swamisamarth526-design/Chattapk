const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMessages, sendMessage, markAsRead } = require('../controllers/messageController');

// All routes are protected (require authentication)

/**
 * GET /api/messages/:conversationId
 * Get paginated messages for a conversation
 * Query params: page (default 1), limit (default 20, max 100)
 * Only accessible by conversation participants
 */
router.get('/:conversationId', protect, getMessages);

/**
 * POST /api/messages
 * Send a message in a conversation
 * Body: { conversationId: string, text: string }
 * Updates conversation lastMessage
 */
router.post('/', protect, sendMessage);

/**
 * PATCH /api/messages/:id/read
 * Mark a message as read
 * Only accessible by conversation participants
 */
router.patch('/:id/read', protect, markAsRead);

module.exports = router;
