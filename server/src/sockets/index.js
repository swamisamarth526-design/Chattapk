const { socketAuthMiddleware } = require('./socketAuth');
const userManager = require('./userManager');
const { updateUserLastSeen } = require('../services/presenceService');
const {
  handleJoinConversation,
  handleSendMessage,
  handleTypingStart,
  handleTypingStop,
  handleMessageRead,
  handleDisconnect,
} = require('./eventHandlers');

/**
 * Initialize Socket.IO with event handlers
 * Handles:
 * - User authentication on connection
 * - Conversation room management
 * - Real-time messaging
 * - Typing indicators
 * - Presence tracking
 * - Disconnect cleanup
 *
 * @param {Object} io - Socket.IO instance
 */
const initializeSocket = (io) => {
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    console.log(`[Socket] New connection: ${socket.id}`);

    // Set user info on socket
    // Add user to manager
    userManager.addUser(socket.id, socket.userId);
    const connectedAt = new Date();

    updateUserLastSeen(socket.userId, connectedAt).catch((error) => {
      console.error('[Socket] Failed to update lastSeen on connect:', error);
    });

    console.log(
      `[Socket] User ${socket.userId} authenticated (socket: ${socket.id}). Online users: ${userManager.getOnlineUserCount()}`
    );

    // Broadcast user online to all connected clients
    io.emit('user_online', {
      userId: socket.userId,
      isOnline: true,
      lastSeen: connectedAt,
      onlineUserCount: userManager.getOnlineUserCount(),
      onlineUserIds: userManager.getAllOnlineUsers(),
      timestamp: new Date(),
    });

    // Register event handlers
    handleJoinConversation(socket, io);
    handleSendMessage(socket, io);
    handleTypingStart(socket, io);
    handleTypingStop(socket, io);
    handleMessageRead(socket, io);
    handleDisconnect(socket, io);

    // Send welcome message to client
    socket.emit('connected', {
      socketId: socket.id,
      userId: socket.userId,
      onlineUserIds: userManager.getAllOnlineUsers(),
      message: 'Successfully connected to ChatX server',
      timestamp: new Date(),
    });
  });

  // Log connection stats periodically
  setInterval(() => {
    const onlineCount = userManager.getOnlineUserCount();
    if (onlineCount > 0) {
      console.log(
        `[Socket] Server Status - Online users: ${onlineCount}, Connected sockets: ${io.engine.clientsCount}`
      );
    }
  }, 60000); // Every minute
};

module.exports = initializeSocket;

