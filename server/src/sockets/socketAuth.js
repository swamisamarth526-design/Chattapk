/**
 * Socket.IO Authentication Middleware
 * Authenticates socket connections using JWT tokens
 */

const { verifyToken } = require('../utils/jwt');
const { extractBearerToken } = require('../utils/input');

const getSocketToken = (socket) => {
  const authToken = extractBearerToken(socket.handshake.auth?.token);
  if (authToken) {
    return authToken;
  }

  return extractBearerToken(socket.handshake.headers.authorization);
};

/**
 * Authenticate socket connection using JWT
 * Expects token in handshake auth or query parameters
 *
 * @param {Object} socket - Socket.IO socket instance
 * @returns {Promise<Object|null>} Decoded token or null if invalid
 */
const authenticateSocket = (socket) => {
  try {
    const token = getSocketToken(socket);

    if (!token) {
      console.warn(`[Socket Auth] No token provided for socket ${socket.id}`);
      return null;
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      console.warn(`[Socket Auth] Invalid token for socket ${socket.id}`);
      return null;
    }

    console.log(`[Socket Auth] User ${decoded.userId} authenticated (socket: ${socket.id})`);
    return decoded;
  } catch (error) {
    console.error(`[Socket Auth] Authentication error:`, error.message);
    return null;
  }
};

/**
 * Socket.IO middleware for authentication
 * Runs on each incoming socket event (except initial connection)
 *
 * @param {Object} socket - Socket.IO socket instance
 * @param {Function} next - Callback to proceed
 */
const socketAuthMiddleware = (socket, next) => {
  const token = getSocketToken(socket);

  if (!token) {
    return next(new Error('Authentication token required'));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return next(new Error('Invalid or expired token'));
  }

  // Attach user info to socket
  socket.userId = decoded.userId;
  socket.user = decoded;

  next();
};

module.exports = {
  authenticateSocket,
  socketAuthMiddleware,
};
