'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef} from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, currentEmployer } = useAuth();
  const { toast } = useToast();
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!user || !currentEmployer) return;

    const connectWebSocket = () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';
        const newSocket = io(apiUrl, {
          auth: {
            token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
            userInfo: user},
          transports: ['polling'], // Use polling instead of WebSocket (App Runner compatibility)
          upgrade: false, // Disable WebSocket upgrade attempts
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: Infinity});

        newSocket.on('connect', () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          reconnectAttempts.current = 0;
        });

        newSocket.on('disconnect', () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          setIsConnected(false);

          // Attempt to reconnect
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            const delay = Math.min(
              1000 * Math.pow(2, reconnectAttempts.current),
              30000
            );

            reconnectTimeoutRef.current = setTimeout(() => {
              console.log(
                `Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`
              );
              connectWebSocket();
            }, delay);
          }
        });

        newSocket.on('notification', (notification) => {
          console.log('Received notification:', notification);

          // Add notification to state
          setNotifications((prev) => [notification, ...prev.slice(0, 49)]); // Keep last 50 notifications

          // Update unread count
          setUnreadCount((prev) => prev + 1);

          // Show toast notification
          toast.info(notification.message, {
            title: notification.title || 'New Notification',
            duration: 5000});
        });

        newSocket.on('system-message', (message) => {
          console.log('Received system message:', message);

          toast.info(message.message, {
            title: 'System Message',
            duration: 7000});
        });

        setSocket(newSocket);

        return () => {
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          newSocket.close();
        };
      } catch (error) {
        console.error('Error connecting WebSocket:', error);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [user, currentEmployer, toast]);

  const sendNotification = (notification) => {
    if (socket && isConnected) {
      socket.emit('notification', notification);
    }
  };

  const joinRoom = (room) => {
    if (socket && isConnected) {
      socket.emit('join-room', room);
    }
  };

  const leaveRoom = (room) => {
    if (socket && isConnected) {
      socket.emit('leave-room', room);
    }
  };

  const acknowledgeNotification = (notificationId) => {
    if (socket && isConnected) {
      socket.emit('notification-ack', notificationId);
    }
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    acknowledgeNotification(notificationId);
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const value = {
    socket,
    isConnected,
    notifications,
    unreadCount,
    sendNotification,
    joinRoom,
    leaveRoom,
    acknowledgeNotification,
    markNotificationAsRead,
    markAllAsRead,
    clearNotifications};

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
