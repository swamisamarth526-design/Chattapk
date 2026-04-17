const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const authController = require('../controllers/authController');

/**
 * Public endpoints
 */
// POST /api/auth/register - Register new user
router.post('/register', authController.register);

// POST /api/auth/login - Login user
router.post('/login', authController.login);

/**
 * Protected endpoints (require JWT token)
 */
// GET /api/auth/me - Get current authenticated user
router.get('/me', protect, authController.getCurrentUser);

// POST /api/auth/logout - Logout user
router.post('/logout', protect, authController.logout);

module.exports = router;

