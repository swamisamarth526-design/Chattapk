const asyncHandler = require('../utils/asyncHandler');
const { sendResponse, sendError } = require('../utils/response');
const { generateToken } = require('../utils/jwt');
const { validateRegister, validateLogin } = require('../validators/auth');
const {
  updateUserLastSeen,
  withUserPresence,
} = require('../services/presenceService');
const User = require('../models/User');

/**
 * @desc Register a new user
 * @route POST /api/auth/register
 * @body { name, email, password }
 * @access Public
 */
const register = asyncHandler(async (req, res) => {
  const { isValid, errors, values } = validateRegister(req.body);
  const { name, email, password, confirmPassword } = values;

  // Validate input
  if (!isValid) {
    return res.status(400).json(sendError('Validation failed', 400, errors));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json(sendError('Email already registered', 409));
  }

  // Create new user
  const user = new User({
    name,
    email,
    password, // Will be hashed automatically by pre-save hook
  });

  await user.save();

  // Generate JWT token
  const token = generateToken(user._id);

  // Return user and token (password excluded by default)
  res.status(201).json(
    sendResponse(
      {
        user: withUserPresence(user.toJSON()),
        token,
      },
      'User registered successfully',
      201
    )
  );
});

/**
 * @desc Login user with email and password
 * @route POST /api/auth/login
 * @body { email, password }
 * @access Public
 */
const login = asyncHandler(async (req, res) => {
  const { isValid, errors, values } = validateLogin(req.body);
  const { email, password } = values;

  // Validate input
  if (!isValid) {
    return res.status(400).json(sendError('Validation failed', 400, errors));
  }

  // Find user by email (must select password since default is hidden)
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json(sendError('Invalid email or password', 401));
  }

  // Compare passwords
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    return res.status(401).json(sendError('Invalid email or password', 401));
  }

  // Update lastSeen
  const lastSeen = await updateUserLastSeen(user._id);
  user.lastSeen = lastSeen;

  // Generate JWT token
  const token = generateToken(user._id);

  // Return user and token (password automatically excluded)
  res.status(200).json(
    sendResponse(
      {
        user: withUserPresence(user.toJSON()),
        token,
      },
      'Logged in successfully'
    )
  );
});

/**
 * @desc Get current authenticated user
 * @route GET /api/auth/me
 * @header Authorization: Bearer {token}
 * @access Private (requires authentication)
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  // req.user is set by auth middleware
  const userId = req.user.userId;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json(sendError('User not found', 404));
  }

  res
    .status(200)
    .json(sendResponse(withUserPresence(user), 'User retrieved successfully'));
});

/**
 * @desc Logout user (client-side: discard token)
 * @route POST /api/auth/logout
 * @header Authorization: Bearer {token}
 * @access Private
 * 
 * Note: JWT is stateless, so logout is handled on client
 * This endpoint exists for consistency and future token blacklist implementation
 */
const logout = asyncHandler(async (req, res) => {
  // Update lastSeen to indicate user went offline
  const userId = req.user.userId;
  await updateUserLastSeen(userId);

  res.status(200).json(sendResponse(null, 'Logged out successfully'));
});

module.exports = {
  register,
  login,
  getCurrentUser,
  logout,
};
