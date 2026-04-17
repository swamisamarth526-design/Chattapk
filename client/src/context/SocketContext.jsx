/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useMemo, useState } from 'react';
import { CONNECTION_STATUS } from '../utils/constants';
import socketService from '../services/socket';
import { useAuth } from '../hooks/useAuth';

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, isAuthenticated, isBootstrapping } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState(
    CONNECTION_STATUS.DISCONNECTED
  );
  const [socketError, setSocketError] = useState('');
  const [onlineUserIds, setOnlineUserIds] = useState([]);

  useEffect(() => {
    const unsubscribeStatus = socketService.on('socket:status', (status) => {
      setConnectionStatus(status);
      if (status !== CONNECTION_STATUS.ERROR) {
        setSocketError('');
      }
    });

    const unsubscribeDisconnect = socketService.on('socket:disconnected', () => {
      setOnlineUserIds([]);
    });

    const unsubscribeWelcome = socketService.on('socket:welcome', (payload) => {
      if (Array.isArray(payload?.onlineUserIds)) {
        setOnlineUserIds(payload.onlineUserIds);
      }
    });

    const unsubscribeError = socketService.on('socket:error', (error) => {
      setSocketError(error?.message || error?.message?.message || 'Socket error');
    });

    const unsubscribeOnline = socketService.on('chat:user_online', (payload) => {
      if (Array.isArray(payload?.onlineUserIds)) {
        setOnlineUserIds(payload.onlineUserIds);
        return;
      }

      setOnlineUserIds((current) => {
        const next = new Set(current);

        if (Array.isArray(payload?.roomUsers)) {
          payload.roomUsers.forEach((userId) => next.add(userId));
        }

        if (payload?.userId) {
          next.add(payload.userId);
        }

        return Array.from(next);
      });
    });

    const unsubscribeOffline = socketService.on(
      'chat:user_offline',
      (payload) => {
        if (Array.isArray(payload?.onlineUserIds)) {
          setOnlineUserIds(payload.onlineUserIds);
          return;
        }

        setOnlineUserIds((current) =>
          current.filter((userId) => userId !== payload?.userId)
        );
      }
    );

    const unsubscribeJoin = socketService.on(
      'chat:joined_conversation',
      (payload) => {
        if (!Array.isArray(payload?.roomUsers)) {
          return;
        }

        setOnlineUserIds((current) => {
          const next = new Set(current);
          payload.roomUsers.forEach((userId) => next.add(userId));
          return Array.from(next);
        });
      }
    );

    return () => {
      unsubscribeStatus();
      unsubscribeDisconnect();
      unsubscribeWelcome();
      unsubscribeError();
      unsubscribeOnline();
      unsubscribeOffline();
      unsubscribeJoin();
    };
  }, []);

  useEffect(() => {
    if (isBootstrapping) {
      return undefined;
    }

    if (!isAuthenticated || !token) {
      socketService.disconnect();
      return undefined;
    }

    socketService.connect(token);

    return () => {
      socketService.disconnect({ clearTrackedRooms: false });
    };
  }, [isAuthenticated, isBootstrapping, token]);

  const value = useMemo(
    () => ({
      socket: socketService,
      connectionStatus: isAuthenticated
        ? connectionStatus
        : CONNECTION_STATUS.DISCONNECTED,
      socketError: isAuthenticated ? socketError : '',
      isConnected:
        isAuthenticated && connectionStatus === CONNECTION_STATUS.CONNECTED,
      onlineUserIds: isAuthenticated ? onlineUserIds : [],
      isUserOnline: (userId) =>
        isAuthenticated ? onlineUserIds.includes(userId) : false,
    }),
    [connectionStatus, isAuthenticated, onlineUserIds, socketError]
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}
