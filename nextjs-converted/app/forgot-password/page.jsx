'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './forgot-password.css';
import logo2 from '@/public/images/TimePulseLogoAuth.png';

const ForgotPasswordPage = () => {
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
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://44.222.217.57:5001';
      const response = await fetch(`${API_BASE}/api/password-reset/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

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
          <Image 
            src={logo2} 
            alt="TimePulse Logo" 
            className="auth-logo"
            width={300}
            height={120}
            priority
          />
          <h2>Forgot Password?</h2>
          <p>Enter your email address and we&apos;ll send you a link to reset your password</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}

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
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '48px', color: '#10b981', marginBottom: '20px' }}>
              <i className="fas fa-check-circle"></i>
            </div>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Check Your Email</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              If an account exists with the email <strong>{email}</strong>, you will receive a password reset link shortly.
            </p>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
              The link will expire in 1 hour for security reasons.
            </p>
            <Link href="/login" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Return to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
