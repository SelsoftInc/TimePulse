'use client';

import React, { useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { API_BASE } from '@/config/api';
import './DemoControls.css';

const DemoControls = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const triggerSuccessToast = () => {
    toast.success('✅ Payment processed successfully! Your subscription is now active.');
  };

  const triggerErrorToast = () => {
    toast.error('❌ Payment failed! Your card was declined. Please try another payment method.');
  };

  const triggerWarningToast = () => {
    toast.warning('⚠️ Your subscription will expire in 3 days. Please update your payment method.');
  };

  const triggerInfoToast = () => {
    toast.info('ℹ️ New feature available: Advanced analytics dashboard is now live!');
  };

  const triggerAPIError = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/demo/trigger-error`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(`API Error: ${error.message || 'Something went wrong'}`);
      }
    } catch (error) {
      toast.error(`Network Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const triggerStripeError = () => {
    toast.error('💳 Stripe Error: Your card has insufficient funds. Please use a different card.');
  };

  const triggerValidationError = () => {
    toast.error('📋 Validation Error: Email is required. Please provide a valid email address.');
  };

  const triggerServerError = () => {
    toast.error('🔥 Server Error (500): Internal server error. Our team has been notified.');
  };

  const triggerAuthError = () => {
    toast.error('🔒 Authentication Error: Your session has expired. Please log in again.');
  };

  const triggerMultipleErrors = () => {
    toast.error('Error 1: Payment failed');
    setTimeout(() => toast.error('Error 2: Card declined'), 500);
    setTimeout(() => toast.error('Error 3: Insufficient funds'), 1000);
  };

  const triggerLongMessage = () => {
    toast.success('✅ Success! Your payment of $19.90 has been processed. Your subscription is now active and you have access to all premium features. Check your email for the receipt and getting started guide.');
  };

  return (
    <>
      {/* Floating Demo Button */}
      <button 
        className={`demo-toggle-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Demo Controls"
      >
        {isOpen ? (
          <i className="fas fa-times"></i>
        ) : (
          <i className="fas fa-bug"></i>
        )}
      </button>

      {/* Demo Control Panel */}
      {isOpen && (
        <div className="demo-controls-panel">
          <div className="demo-header">
            <h3>
              <i className="fas fa-flask mr-2"></i>
              Demo Controls
            </h3>
            <p className="demo-subtitle">Trigger different scenarios to demo the app</p>
          </div>

          <div className="demo-section">
            <h4>
              <i className="fas fa-bell mr-2"></i>
              Toast Notifications
            </h4>
            <div className="demo-buttons">
              <button className="demo-btn success" onClick={triggerSuccessToast}>
                <i className="fas fa-check-circle"></i>
                Success
              </button>
              <button className="demo-btn error" onClick={triggerErrorToast}>
                <i className="fas fa-times-circle"></i>
                Error
              </button>
              <button className="demo-btn warning" onClick={triggerWarningToast}>
                <i className="fas fa-exclamation-triangle"></i>
                Warning
              </button>
              <button className="demo-btn info" onClick={triggerInfoToast}>
                <i className="fas fa-info-circle"></i>
                Info
              </button>
            </div>
          </div>

          <div className="demo-section">
            <h4>
              <i className="fas fa-exclamation-circle mr-2"></i>
              Error Scenarios
            </h4>
            <div className="demo-buttons vertical">
              <button className="demo-btn error-scenario" onClick={triggerStripeError}>
                <i className="fab fa-stripe"></i>
                Stripe Payment Error
              </button>
              <button className="demo-btn error-scenario" onClick={triggerValidationError}>
                <i className="fas fa-clipboard-check"></i>
                Validation Error
              </button>
              <button className="demo-btn error-scenario" onClick={triggerServerError}>
                <i className="fas fa-server"></i>
                Server Error (500)
              </button>
              <button className="demo-btn error-scenario" onClick={triggerAuthError}>
                <i className="fas fa-lock"></i>
                Auth Error (401)
              </button>
              <button 
                className="demo-btn error-scenario" 
                onClick={triggerAPIError}
                disabled={loading}
              >
                <i className="fas fa-plug"></i>
                {loading ? 'Loading...' : 'Real API Error'}
              </button>
            </div>
          </div>

          <div className="demo-section">
            <h4>
              <i className="fas fa-layer-group mr-2"></i>
              Advanced Tests
            </h4>
            <div className="demo-buttons vertical">
              <button className="demo-btn advanced" onClick={triggerMultipleErrors}>
                <i className="fas fa-clone"></i>
                Multiple Errors (3)
              </button>
              <button className="demo-btn advanced" onClick={triggerLongMessage}>
                <i className="fas fa-align-left"></i>
                Long Message
              </button>
            </div>
          </div>

          <div className="demo-footer">
            <p>
              <i className="fas fa-lightbulb"></i>
              Use these to demonstrate error handling, notifications, and UX flows
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default DemoControls;


