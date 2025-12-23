'use client';

import React from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRouter, useParams } from 'next/navigation';
import './NotificationBell.css';

const NotificationBell = () => {
  const router = useRouter();
  const { subdomain } = useParams();
  const { unreadCount } = useNotifications();

  const handleBellClick = () => {
    const notificationsPath = subdomain 
      ? `/${subdomain}/notifications` 
      : '/notifications';
    router.push(notificationsPath);
  };

  return (
    <div className="notification-bell-container">
      <button
        className="notification-bell-button"
        onClick={handleBellClick}
        aria-label="Notifications"
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
