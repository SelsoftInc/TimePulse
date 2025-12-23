'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import notificationService from '@/services/notificationService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  /**
   * Fetch notifications from the server
   */
  const fetchNotifications = useCallback(async (options = {}) => {
    if (!user?.id || !user?.tenantId) {
      console.log('⚠️ NotificationContext: Missing user data', { userId: user?.id, tenantId: user?.tenantId });
      return;
    }

    try {
      console.log('🔔 NotificationContext: Fetching notifications for user:', user.id);
      setLoading(true);
      const data = await notificationService.getNotifications(
        user.id,
        user.tenantId,
        options
      );

      console.log('📬 NotificationContext: Received data:', data);

      if (data.success) {
        setNotifications(data.notifications || []);
        const count = data.unreadCount || data.notifications?.filter(n => !n.readAt).length || 0;
        setUnreadCount(count);
        console.log('✅ NotificationContext: Set notifications:', data.notifications?.length, 'Unread:', count);
      }
    } catch (error) {
      console.error('❌ NotificationContext: Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.tenantId]);

  /**
   * Fetch unread count only
   */
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id || !user?.tenantId) {
      console.log('⚠️ NotificationContext: Missing user data for unread count');
      return;
    }

    try {
      console.log('🔔 NotificationContext: Fetching unread count for user:', user.id);
      const count = await notificationService.getUnreadCount(user.id, user.tenantId);
      console.log('📬 NotificationContext: Unread count received:', count);
      setUnreadCount(count);
    } catch (error) {
      console.error('❌ NotificationContext: Error fetching unread count:', error);
    }
  }, [user?.id, user?.tenantId]);

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(async (notificationId) => {
    if (!user?.tenantId) return;

    try {
      await notificationService.markAsRead(notificationId, user.tenantId);
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, readAt: new Date().toISOString() }
            : notif
        )
      );
      
      // Decrease unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user?.tenantId]);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!user?.id || !user?.tenantId) return;

    try {
      await notificationService.markAllAsRead(user.id, user.tenantId);
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, readAt: new Date().toISOString() }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user?.id, user?.tenantId]);

  /**
   * Delete a notification
   */
  const deleteNotification = useCallback(async (notificationId) => {
    if (!user?.tenantId) return;

    try {
      await notificationService.deleteNotification(notificationId, user.tenantId);
      
      // Update local state
      const deletedNotif = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      // Decrease unread count if the deleted notification was unread
      if (deletedNotif && !deletedNotif.readAt) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [user?.tenantId, notifications]);

  /**
   * Add a new notification (for real-time updates via WebSocket)
   */
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.readAt) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  /**
   * Initial fetch and polling
   */
  useEffect(() => {
    if (user?.id && user?.tenantId) {
      fetchNotifications();

      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user?.id, user?.tenantId, fetchNotifications, fetchUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
