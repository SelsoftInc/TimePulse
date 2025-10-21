import React from "react";
import "./ConfirmationDialog.css";

const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning",
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠";
      case "info":
        return "ℹ";
      default:
        return "⚠";
    }
  };

  return (
    <div className="confirmation-dialog-overlay" onClick={handleBackdropClick}>
      <div className="confirmation-dialog">
        <div className="confirmation-dialog-header">
          <div className={`confirmation-dialog-icon ${type}`}>{getIcon()}</div>
          <h3 className="confirmation-dialog-title">{title}</h3>
        </div>

        <div className="confirmation-dialog-body">
          <p className="confirmation-dialog-message">{message}</p>
        </div>

        <div className="confirmation-dialog-footer">
          <button
            className="confirmation-dialog-btn confirmation-dialog-btn-cancel"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            className={`confirmation-dialog-btn confirmation-dialog-btn-confirm ${type}`}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
