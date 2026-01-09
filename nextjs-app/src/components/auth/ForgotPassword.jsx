'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import './Auth.css';
import './ForgotPasswordStyles.css';
import { API_BASE } from '@/config/api';
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/password-reset/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'},
        body: JSON.stringify({ email })});

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(data.message);
        setEmailSent(true);
      } else {
        // Even on error, show generic message to prevent email enumeration
        setMessage('If an account exists with this email, a password reset link has been sent.');
        setEmailSent(true);
      }
    } catch (err) {
      console.error('Password reset request error:', err);
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Floating Elements */}
      <div className="floating-element"></div>
      <div className="floating-element"></div>
      <div className="floating-element"></div>

      <div className="auth-card">
        <div className="auth-header">
          <img src="/assets/images/jsTree/TimePulse4.png" alt="TimePulse Logo" className="auth-logo" />
          <h2>Forgot Password?</h2>
         
        </div>

        {error && <div className="auth-error">{error}</div>}
        {/* {message && <div className="auth-success">{message}</div>} */}

        {!emailSent ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email address"
                className="form-control"
              />
            </div>

            <button type="submit" className="btn-primary btn-block" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link href="/login" className="forgot-link">
                <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
                Back to Login
              </Link>
            </div>
          </form>
        ) : (
          <div className="email-sent-container">
            <div className="success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h3 className="email-sent-title">Check Your Email</h3>
            <p className="email-sent-message">
              If an account exists with the email <strong>{email}</strong>, you will receive a password reset link shortly.
            </p>
            <p className="email-sent-note">
              The link will expire in 1 hour for security reasons.
            </p>
            <Link href="/login" className="btn-primary btn-block">
              Return to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
