import { io } from 'socket.io-client';
import { CONNECTION_STATUS, SOCKET_URL } from '../utils/constants';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.joinedConversationIds = new Set();
    this.connectionStatus = CONNECTION_STATUS.DISCONNECTED;
    this.boundCoreListeners = false;
    this.token = '';
  }

  setConnectionStatus(status) {
    this.connectionStatus = status;
    this.emitLocal('socket:status', status);
  }

  emitLocal(event, payload) {
    const callbacks = this.listeners.get(event);

    if (!callbacks) {
      return;
    }

    callbacks.forEach((callback) => callback(payload));
  }

  ensureSocket(token) {
    if (this.socket) {
      this.socket.auth = { token: `Bearer ${token}` };
      return;
    }

    this.socket = io(SOCKET_URL, {
      autoConnect: false,
      auth: {
        token: `Bearer ${token}`,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      transports: ['websocket', 'polling'],
    });

    this.bindCoreListeners();
  }

  bindCoreListeners() {
    if (!this.socket || this.boundCoreListeners) {
      return;
    }

    this.boundCoreListeners = true;

    this.socket.on('connect', () => {
      this.setConnectionStatus(CONNECTION_STATUS.CONNECTED);
      this.emitLocal('socket:connected', { socketId: this.socket.id });
      this.rejoinTrackedConversations();
    });

    this.socket.on('connected', (payload) => {
      this.emitLocal('socket:welcome', payload);
    });

    this.socket.on('disconnect', (reason) => {
      this.setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
      this.emitLocal('socket:disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      this.setConnectionStatus(CONNECTION_STATUS.ERROR);
      this.emitLocal('socket:error', error);
    });

    this.socket.on('error', (payload) => {
      this.emitLocal('socket:error', payload);
    });

    this.socket.io.on('reconnect_attempt', () => {
      this.setConnectionStatus(CONNECTION_STATUS.CONNECTING);
      this.emitLocal('socket:reconnecting');
    });

    this.socket.io.on('reconnect', () => {
      this.setConnectionStatus(CONNECTION_STATUS.CONNECTED);
      this.emitLocal('socket:reconnected');
      this.rejoinTrackedConversations();
    });

    this.socket.on('receive_message', (payload) => {
      this.emitLocal('chat:receive_message', payload);
    });

    this.socket.on('receive_read_receipt', (payload) => {
      this.emitLocal('chat:receive_read_receipt', payload);
    });

    this.socket.on('user_online', (payload) => {
      this.emitLocal('chat:user_online', payload);
    });

    this.socket.on('user_offline', (payload) => {
      this.emitLocal('chat:user_offline', payload);
    });

    this.socket.on('typing_started', (payload) => {
      this.emitLocal('chat:typing_started', payload);
    });

    this.socket.on('typing_stopped', (payload) => {
      this.emitLocal('chat:typing_stopped', payload);
    });

    this.socket.on('joined_conversation', (payload) => {
      this.emitLocal('chat:joined_conversation', payload);
    });
  }

  connect(token) {
    if (!token) {
      return;
    }

    this.token = token;
    this.ensureSocket(token);

    if (this.socket.connected) {
      this.setConnectionStatus(CONNECTION_STATUS.CONNECTED);
      return;
    }

    this.setConnectionStatus(CONNECTION_STATUS.CONNECTING);

    if (!this.socket.active) {
      this.socket.connect();
    }
  }

  disconnect({ clearTrackedRooms = true } = {}) {
    if (clearTrackedRooms) {
      this.joinedConversationIds.clear();
    }

    if (!this.socket) {
      this.setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
      this.emitLocal('socket:disconnected', { reason: 'manual_disconnect' });
      return;
    }

    const wasConnected = this.socket.connected;

    this.socket.disconnect();
    this.setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);

    if (!wasConnected) {
      this.emitLocal('socket:disconnected', { reason: 'manual_disconnect' });
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const callbacks = this.listeners.get(event);
    callbacks.add(callback);

    return () => {
      callbacks.delete(callback);

      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  isConnected() {
    return Boolean(this.socket?.connected);
  }

  getConnectionStatus() {
    return this.connectionStatus;
  }

  joinConversation(conversationId, options = {}) {
    if (!conversationId) {
      return;
    }

    const { force = false } = options;
    const wasTracked = this.joinedConversationIds.has(conversationId);
    this.joinedConversationIds.add(conversationId);

    if (this.isConnected() && (force || !wasTracked)) {
      this.socket.emit('join_conversation', { conversationId });
    }
  }

  syncConversationRooms(conversationIds) {
    conversationIds.forEach((conversationId) => {
      this.joinConversation(conversationId);
    });
  }

  rejoinTrackedConversations() {
    this.joinedConversationIds.forEach((conversationId) => {
      this.socket.emit('join_conversation', { conversationId });
    });
  }

  markMessageRead(messageId, conversationId) {
    if (!this.isConnected() || !messageId || !conversationId) {
      return;
    }

    this.socket.emit('read_message', { messageId, conversationId });
  }

  startTyping(conversationId) {
    if (!this.isConnected() || !conversationId) {
      return;
    }

    this.socket.emit('typing_start', { conversationId });
  }

  stopTyping(conversationId) {
    if (!this.isConnected() || !conversationId) {
      return;
    }

    this.socket.emit('typing_stop', { conversationId });
  }
}

const socketService = new SocketService();

export default socketService;
