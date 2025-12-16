'use client';

import React, { useEffect, useState } from 'react';
import './Toast.css';

const Toast = ({ id, type = 'info', title, message, duration = 4000, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Match animation duration
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={`toast ${type} ${isExiting ? 'toast-exit' : ''}`}>
      <div className="toast-icon">
        {getIcon()}
      </div>
      <div className="toast-content">
        {title && <p className="toast-title">{title}</p>}
        {message && <p className="toast-message">{message}</p>}
      </div>
      <button className="toast-close" onClick={handleClose} aria-label="Close">
        ×
      </button>
    </div>
  );
};

export default Toast;
