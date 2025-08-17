import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

let idCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message, opts = {}) => {
    const id = ++idCounter;
    const toast = {
      id,
      type, // 'success' | 'error' | 'info' | 'warning'
      message,
      duration: typeof opts.duration === 'number' ? opts.duration : 3000,
    };
    setToasts((prev) => [...prev, toast]);
    if (toast.duration > 0) {
      setTimeout(() => remove(id), toast.duration);
    }
    return id;
  }, [remove]);

  const toastApi = useMemo(() => ({
    success: (msg, opts) => push('success', msg, opts),
    error: (msg, opts) => push('error', msg, opts),
    info: (msg, opts) => push('info', msg, opts),
    warning: (msg, opts) => push('warning', msg, opts),
  }), [push]);

  return (
    <ToastContext.Provider value={{ toast: toastApi, remove, toasts }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const ToastContainer = () => {
  const { toasts, remove } = useToast();
  return (
    <div style={containerStyle}>
      {toasts.map((t) => (
        <div key={t.id} style={{ ...toastStyle, ...typeStyle[t.type] }}>
          <span>{t.message}</span>
          <button style={closeStyle} onClick={() => remove(t.id)} aria-label="Dismiss">×</button>
        </div>
      ))}
    </div>
  );
};

const containerStyle = {
  position: 'fixed',
  right: '16px',
  bottom: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  zIndex: 2000,
};

const toastStyle = {
  minWidth: '260px',
  maxWidth: '420px',
  padding: '12px 16px',
  borderRadius: '8px',
  color: '#fff',
  boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '14px',
};

const typeStyle = {
  success: { background: '#16a34a' },
  error: { background: '#dc2626' },
  info: { background: '#2563eb' },
  warning: { background: '#d97706' },
};

const closeStyle = {
  background: 'transparent',
  border: 'none',
  color: 'inherit',
  fontSize: '18px',
  marginLeft: '12px',
  cursor: 'pointer',
};
