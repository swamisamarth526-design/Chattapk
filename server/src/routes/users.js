const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getAllUsers, searchUsers, getUserProfile } = require('../controllers/userController');

// All routes are protected (require authentication)

/**
 * GET /api/users
 * Get all users except current logged-in user
 * Query params: limit (default 20), offset (default 0)
 */
router.get('/', protect, getAllUsers);

/**
 * GET /api/users/search?q=query
 * Search users by name or email
 * Query params: q (required), limit, offset
 */
router.get('/search', protect, searchUsers);

/**
 * GET /api/users/:id
 * Get user profile/summary by user ID
 */
router.get('/:id', protect, getUserProfile);

module.exports = router;
