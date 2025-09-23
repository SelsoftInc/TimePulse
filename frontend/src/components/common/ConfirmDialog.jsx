import React from 'react';

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1500,
};

const dialogStyle = {
  background: '#fff',
  borderRadius: '8px',
  padding: '20px',
  maxWidth: '420px',
  width: '90%',
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
};

const headerStyle = {
  fontSize: '18px',
  fontWeight: 600,
  marginBottom: '8px',
  color: 'red'
};

const bodyStyle = {
  fontSize: '14px',
  marginBottom: '16px',
};

const actionsStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
};

const ConfirmDialog = ({ open, title = 'Confirm', message = 'Are you sure?', confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div style={overlayStyle}>
      <div style={dialogStyle} role="dialog" aria-modal="true">
        <div style={headerStyle}>{title}</div>
        <div style={bodyStyle}>{message}</div>
        <div style={actionsStyle}>
          <button className="btn btn-outline-light" onClick={onCancel}>{cancelLabel}</button>
          <button className="btn btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
