'use client';

import React from 'react';
import './Modal.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', // 'success', 'error', 'warning', 'info', 'confirm'
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false,
  details = null
}) => {
  if (!isOpen) return null;

  // Helper function to check if a value is a URL
  const isURL = (str) => {
    if (typeof str !== 'string') return false;
    return str.startsWith('http://') || str.startsWith('https://');
  };

  // Helper function to handle PDF download
  const handlePDFDownload = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `invoice-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      // Fallback to opening in new tab if download fails
      window.open(url, '_blank');
    }
  };

  // Helper function to render detail value (as link if URL)
  const renderDetailValue = (key, value) => {
    if (isURL(value)) {
      return (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handlePDFDownload(value);
          }}
          className="modal-detail-link"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'inherit',
            font: 'inherit',
            textAlign: 'left'
          }}
        >
          <i className="fas fa-file-pdf" style={{ marginRight: '6px' }}></i>
          View Invoice PDF
        </button>
      );
    }
    return <span className="modal-detail-value">{value}</span>;
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <i className="fas fa-check-circle modal-icon-success"></i>;
      case 'error':
        return <i className="fas fa-times-circle modal-icon-error"></i>;
      case 'warning':
        return <i className="fas fa-exclamation-triangle modal-icon-warning"></i>;
      case 'confirm':
        return <i className="fas fa-question-circle modal-icon-confirm"></i>;
      default:
        return <i className="fas fa-info-circle modal-icon-info"></i>;
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className={`modal-container modal-${type}`}>
        <div className="modal-header">
          {getIcon()}
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="modal-body">
          <p className="modal-message">{message}</p>
          
          {details && (
            <div className="modal-details">
              {Object.entries(details).map(([key, value]) => (
                <div key={key} className="modal-detail-item">
                  <span className="modal-detail-label">{key}:</span>
                  {renderDetailValue(key, value)}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          {showCancel && (
            <button className="modal-btn modal-btn-cancel" onClick={onClose}>
              {cancelText}
            </button>
          )}
          <button 
            className={`modal-btn modal-btn-${type === 'error' ? 'error' : 'primary'}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
