import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { token, user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [scanSocket, setScanSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [scanConnected, setScanConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return undefined;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || '';
    const boardSocket = io(`${socketUrl}/board`, {
      auth: { token },
      transports: ['websocket'],
    });
    const dependencyScanSocket = io(`${socketUrl}/scan`, {
      auth: { token },
      transports: ['websocket'],
    });

    boardSocket.on('connect', () => {
      setConnected(true);
    });
    boardSocket.on('disconnect', () => {
      setConnected(false);
    });

    dependencyScanSocket.on('connect', () => {
      setScanConnected(true);
    });
    dependencyScanSocket.on('disconnect', () => {
      setScanConnected(false);
    });

    setSocket(boardSocket);
    setScanSocket(dependencyScanSocket);

    return () => {
      boardSocket.disconnect();
      dependencyScanSocket.disconnect();
      setSocket(null);
      setScanSocket(null);
      setConnected(false);
      setScanConnected(false);
    };
  }, [isAuthenticated, token]);

  const joinProject = (projectId) => {
    if (socket && connected && projectId) {
      socket.emit('joinProject', {
        projectId,
        user: user
          ? {
              userId: user.userId,
              name: user.name,
              role: user.role,
            }
          : undefined,
      });
    }
  };

  const leaveProject = (projectId) => {
    if (socket && connected && projectId) {
      socket.emit('leaveProject', {
        projectId,
        userId: user?.userId,
      });
    }
  };

  const joinScan = (scanId) => {
    if (scanSocket && scanConnected && scanId) {
      scanSocket.emit('joinScan', { scanId });
    }
  };

  const value = {
    socket,
    scanSocket,
    connected,
    scanConnected,
    joinProject,
    leaveProject,
    joinScan,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
