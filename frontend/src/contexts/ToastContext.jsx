import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Toast from '../components/common/Toast';

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
      title: opts.title || null,
      message,
      duration: typeof opts.duration === 'number' ? opts.duration : 4000,
    };
    console.log('🍞 Toast pushed:', toast);
    setToasts((prev) => {
      const newToasts = [...prev, toast];
      console.log('🍞 All toasts:', newToasts);
      return newToasts;
    });
    return id;
  }, []);

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
  console.log('🍞 ToastContainer rendering with toasts:', toasts);
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          id={t.id}
          type={t.type}
          title={t.title}
          message={t.message}
          duration={t.duration}
          onClose={remove}
        />
      ))}
    </div>
  );
};
