const asyncHandler = require('../utils/asyncHandler');
const { sendResponse, sendError } = require('../utils/response');
const {
  withUserPresence,
  withUsersPresence,
} = require('../services/presenceService');
const User = require('../models/User');
const { escapeRegex } = require('../utils/input');
const {
  validatePagination,
  validateSearch,
  validateUserId,
} = require('../validators/user');

/**
 * @desc Get all users except current user
 * @route GET /api/users
 * @access Private
 * @query limit - Number of results (default 20, max 100)
 * @query offset - Number of results to skip (default 0)
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { isValid, errors, limit, offset } = validatePagination(req.query);

  if (!isValid) {
    return res.status(400).json(sendError('Invalid pagination parameters', 400, errors));
  }

  // Get all users except current user
  const users = await User.find(
    { _id: { $ne: req.user.userId } },
    { _id: 1, name: 1, email: 1, avatar: 1, lastSeen: 1, createdAt: 1 }
  )
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset)
    .lean();

  // Get total count for pagination
  const total = await User.countDocuments({ _id: { $ne: req.user.userId } });

  return res.status(200).json(
    sendResponse(
      {
        users: withUsersPresence(users),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      'Users retrieved successfully',
      200
    )
  );
});

/**
 * @desc Search users by name or email
 * @route GET /api/users/search?q=query
 * @access Private
 * @query q - Search query (required, 2-100 chars)
 * @query limit - Number of results (default 20, max 100)
 * @query offset - Number of results to skip (default 0)
 */
const searchUsers = asyncHandler(async (req, res) => {
  const { isValid, errors, query } = validateSearch(req.query);
  if (!isValid) {
    return res.status(400).json(sendError('Validation failed', 400, errors));
  }

  const pagination = validatePagination(req.query);
  if (!pagination.isValid) {
    return res
      .status(400)
      .json(sendError('Invalid pagination parameters', 400, pagination.errors));
  }

  // Create regex for case-insensitive search
  const searchRegex = new RegExp(escapeRegex(query), 'i');

  // Search by name or email, exclude current user
  const users = await User.find(
    {
      _id: { $ne: req.user.userId },
      $or: [{ name: searchRegex }, { email: searchRegex }],
    },
    { _id: 1, name: 1, email: 1, avatar: 1, lastSeen: 1, createdAt: 1 }
  )
    .sort({ name: 1 })
    .limit(pagination.limit)
    .skip(pagination.offset)
    .lean();

  // Get total count for pagination
  const total = await User.countDocuments({
    _id: { $ne: req.user.userId },
    $or: [{ name: searchRegex }, { email: searchRegex }],
  });

  return res.status(200).json(
    sendResponse(
      {
        users: withUsersPresence(users),
        pagination: {
          total,
          limit: pagination.limit,
          offset: pagination.offset,
          hasMore: pagination.offset + pagination.limit < total,
        },
      },
      'Search results retrieved successfully',
      200
    )
  );
});

/**
 * @desc Get user profile by ID
 * @route GET /api/users/:id
 * @access Private
 */
const getUserProfile = asyncHandler(async (req, res) => {
  const { isValid, errors, value: userId } = validateUserId(req.params.id);

  if (!isValid) {
    return res.status(400).json(sendError('Invalid user ID format', 400, errors));
  }

  const user = await User.findById(
    userId,
    { _id: 1, name: 1, email: 1, avatar: 1, lastSeen: 1, createdAt: 1 }
  ).lean();

  if (!user) {
    return res.status(404).json(sendError('User not found', 404));
  }

  return res
    .status(200)
    .json(sendResponse(withUserPresence(user), 'User profile retrieved successfully', 200));
});

module.exports = {
  getAllUsers,
  searchUsers,
  getUserProfile,
};
