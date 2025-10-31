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
                  <span className="modal-detail-value">{value}</span>
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
