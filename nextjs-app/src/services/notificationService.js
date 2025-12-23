// src/services/notificationService.js
import { API_BASE } from '@/config/api';

/**
 * Notification Service
 * Handles all notification-related API calls
 */

class NotificationService {
  /**
   * Get all notifications for the current user
   * @param {string} userId - User ID
   * @param {string} tenantId - Tenant ID
   * @param {object} options - Query options (limit, offset, unreadOnly)
   * @returns {Promise<object>} Notifications data
   */
  async getNotifications(userId, tenantId, options = {}) {
    try {
      const { limit = 20, offset = 0, unreadOnly = false } = options;
      
      const queryParams = new URLSearchParams({
        userId,
        tenantId,
        limit: limit.toString(),
        offset: offset.toString(),
        ...(unreadOnly && { unreadOnly: 'true' })
      });

      const url = `${API_BASE}/api/notifications?${queryParams}`;
      console.log('🌐 NotificationService: Fetching notifications from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('📡 NotificationService: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ NotificationService: API error:', errorText);
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      console.log('📬 NotificationService: Received data:', data);
      return data;
    } catch (error) {
      console.error('❌ NotificationService: Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   * @param {string} userId - User ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<number>} Unread count
   */
  async getUnreadCount(userId, tenantId) {
    try {
      const url = `${API_BASE}/api/notifications/unread-count?userId=${userId}&tenantId=${tenantId}`;
      console.log('🌐 NotificationService: Fetching unread count from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('📡 NotificationService: Unread count response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ NotificationService: Unread count API error:', errorText);
        throw new Error('Failed to fetch unread count');
      }

      const data = await response.json();
      console.log('📬 NotificationService: Unread count data:', data);
      return data.count || 0;
    } catch (error) {
      console.error('❌ NotificationService: Error fetching unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<object>} Updated notification
   */
  async markAsRead(notificationId, tenantId) {
    try {
      const response = await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ tenantId, userId: JSON.parse(localStorage.getItem('userInfo') || '{}').id })
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   * @param {string} userId - User ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<object>} Result
   */
  async markAllAsRead(userId, tenantId) {
    try {
      const response = await fetch(`${API_BASE}/api/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId, tenantId })
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<object>} Result
   */
  async deleteNotification(notificationId, tenantId) {
    try {
      const response = await fetch(`${API_BASE}/api/notifications/${notificationId}?tenantId=${tenantId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Create a notification (used internally by backend, but can be called from frontend for testing)
   * @param {object} notificationData - Notification data
   * @returns {Promise<object>} Created notification
   */
  async createNotification(notificationData) {
    try {
      const response = await fetch(`${API_BASE}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(notificationData)
      });

      if (!response.ok) {
        throw new Error('Failed to create notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
