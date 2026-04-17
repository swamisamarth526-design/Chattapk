/**
 * User and Room Manager for Socket.IO
 * Tracks:
 * - userId -> socketId mapping (online users)
 * - socketId -> userId mapping (reverse lookup)
 * - Room (conversation) -> users mapping
 * - User typing status per room
 */

class UserManager {
  constructor() {
    // Store userId -> socketId mapping
    this.onlineUsers = new Map(); // userId -> socketId

    // Store socketId -> userId mapping for reverse lookup
    this.socketToUser = new Map(); // socketId -> userId

    // Store room -> Set of userIds in that room
    this.roomUsers = new Map(); // `conversation-${conversationId}` -> Set<userId>

    // Store typing status: conversationId -> Set<userId>
    this.typingUsers = new Map(); // `conversation-${conversationId}` -> Set<userId>
  }

  /**
   * Add user connection
   * @param {string} socketId - Socket.IO socket ID
   * @param {string} userId - User's MongoDB ID
   */
  addUser(socketId, userId) {
    // If user already connected elsewhere, remove old socket mapping
    if (this.onlineUsers.has(userId)) {
      const oldSocketId = this.onlineUsers.get(userId);
      this.socketToUser.delete(oldSocketId);
    }

    this.onlineUsers.set(userId, socketId);
    this.socketToUser.set(socketId, userId);
  }

  /**
   * Remove user connection
   * @param {string} socketId - Socket.IO socket ID
   */
  removeUser(socketId) {
    const userId = this.socketToUser.get(socketId);

    if (userId) {
      // Remove from online users
      this.onlineUsers.delete(userId);
      this.socketToUser.delete(socketId);

      // Remove from all rooms
      this.roomUsers.forEach((users) => {
        users.delete(userId);
      });

      // Remove from typing status
      this.typingUsers.forEach((users) => {
        users.delete(userId);
      });

      return userId;
    }
    return null;
  }

  /**
   * Get socket ID for a user
   * @param {string} userId - User's MongoDB ID
   * @returns {string|null} Socket ID or null if not online
   */
  getSocketId(userId) {
    return this.onlineUsers.get(userId) || null;
  }

  /**
   * Get user ID from socket ID
   * @param {string} socketId - Socket.IO socket ID
   * @returns {string|null} User ID or null
   */
  getUserId(socketId) {
    return this.socketToUser.get(socketId) || null;
  }

  /**
   * Check if user is online
   * @param {string} userId - User's MongoDB ID
   * @returns {boolean}
   */
  isOnline(userId) {
    return this.onlineUsers.has(userId);
  }

  /**
   * Add user to conversation room
   * @param {string} conversationId - Conversation's MongoDB ID
   * @param {string} userId - User's MongoDB ID
   */
  addUserToRoom(conversationId, userId) {
    const roomKey = `conversation-${conversationId}`;
    if (!this.roomUsers.has(roomKey)) {
      this.roomUsers.set(roomKey, new Set());
    }
    this.roomUsers.get(roomKey).add(userId);
  }

  /**
   * Remove user from conversation room
   * @param {string} conversationId - Conversation's MongoDB ID
   * @param {string} userId - User's MongoDB ID
   */
  removeUserFromRoom(conversationId, userId) {
    const roomKey = `conversation-${conversationId}`;
    if (this.roomUsers.has(roomKey)) {
      this.roomUsers.get(roomKey).delete(userId);
    }
  }

  /**
   * Get all users in a room
   * @param {string} conversationId - Conversation's MongoDB ID
   * @returns {Set<string>} Set of user IDs in the room
   */
  getRoomUsers(conversationId) {
    const roomKey = `conversation-${conversationId}`;
    return this.roomUsers.get(roomKey) || new Set();
  }

  /**
   * Get count of users in a room
   * @param {string} conversationId - Conversation's MongoDB ID
   * @returns {number}
   */
  getRoomUserCount(conversationId) {
    return this.getRoomUsers(conversationId).size;
  }

  /**
   * Mark user as typing in a room
   * @param {string} conversationId - Conversation's MongoDB ID
   * @param {string} userId - User's MongoDB ID
   */
  setUserTyping(conversationId, userId) {
    const roomKey = `conversation-${conversationId}`;
    if (!this.typingUsers.has(roomKey)) {
      this.typingUsers.set(roomKey, new Set());
    }
    this.typingUsers.get(roomKey).add(userId);
  }

  /**
   * Mark user as not typing in a room
   * @param {string} conversationId - Conversation's MongoDB ID
   * @param {string} userId - User's MongoDB ID
   */
  removeUserTyping(conversationId, userId) {
    const roomKey = `conversation-${conversationId}`;
    if (this.typingUsers.has(roomKey)) {
      this.typingUsers.get(roomKey).delete(userId);
    }
  }

  /**
   * Get typing users in a room (excluding a specific user)
   * @param {string} conversationId - Conversation's MongoDB ID
   * @param {string} excludeUserId - User ID to exclude
   * @returns {Array<string>} Array of typing user IDs
   */
  getTypingUsers(conversationId, excludeUserId = null) {
    const roomKey = `conversation-${conversationId}`;
    const typingSet = this.typingUsers.get(roomKey) || new Set();
    const result = Array.from(typingSet);
    return excludeUserId ? result.filter((id) => id !== excludeUserId) : result;
  }

  /**
   * Get online user count
   * @returns {number}
   */
  getOnlineUserCount() {
    return this.onlineUsers.size;
  }

  /**
   * Get all online users
   * @returns {Array<string>} Array of user IDs
   */
  getAllOnlineUsers() {
    return Array.from(this.onlineUsers.keys());
  }

  /**
   * Clear all data (useful for testing or shutdown)
   */
  clear() {
    this.onlineUsers.clear();
    this.socketToUser.clear();
    this.roomUsers.clear();
    this.typingUsers.clear();
  }
}

// Export singleton instance
module.exports = new UserManager();
