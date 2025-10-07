import React from 'react';
import './ConfirmDialog.css';

const ConfirmDialog = ({ open, title = 'Confirm', message = 'Are you sure?', confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog" role="dialog" aria-modal="true">
        <div className="confirm-dialog-title">{title}</div>
        <div className="confirm-dialog-message">{message}</div>
        <div className="confirm-dialog-actions">
          <button className="confirm-dialog-btn confirm-dialog-btn-cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="confirm-dialog-btn confirm-dialog-btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
