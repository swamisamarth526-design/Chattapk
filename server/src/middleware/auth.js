const { verifyToken } = require('../utils/jwt');
const { sendError } = require('../utils/response');
const { extractBearerToken } = require('../utils/input');

/**
 * JWT authentication middleware
 * Verifies token from Authorization header and attaches user to req.user
 * Usage: router.get('/protected', protect, controller)
 */
const protect = (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      return res
        .status(401)
        .json(sendError('Authentication token is required', 401));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json(sendError('Invalid or expired token', 401));
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json(sendError('Authentication failed', 401));
  }
};

module.exports = { protect };

