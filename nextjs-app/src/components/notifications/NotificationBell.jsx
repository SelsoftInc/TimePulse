'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/config/api';
import './NotificationBell.css';

const NotificationBell = () => {
  const router = useRouter();
  const { subdomain } = useParams();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!user?.id || !user?.tenantId) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/notifications/unread-count?userId=${user.id}&tenantId=${user.tenantId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Navigate to notifications page
  const handleBellClick = () => {
    const currentSubdomain = subdomain || 'selsoft';
    router.push(`/${currentSubdomain}/notifications`);
  };

  // Fetch unread count on mount and periodically
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="notification-bell-container">
      <button 
        className="notification-bell-btn" 
        onClick={handleBellClick}
        aria-label="Notifications"
        title="View all notifications"
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>
    </div>
  );
};

export default NotificationBell;
