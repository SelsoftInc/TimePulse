'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import '@/components/auth/Auth.css';

export default function PendingApprovalPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState(null);
  const [isRejected, setIsRejected] = useState(false);

  useEffect(() => {
    // Check for pending user first
    const pendingUserStr = localStorage.getItem('pendingUser');
    const rejectedUserStr = localStorage.getItem('rejectedUser');
    
    if (rejectedUserStr) {
      // User was rejected
      try {
        const rejectedUser = JSON.parse(rejectedUserStr);
        setUserInfo(rejectedUser);
        setIsRejected(true);
      } catch (error) {
        console.error('Error parsing rejected user:', error);
        router.push('/login');
      }
      return;
    }
    
    if (pendingUserStr) {
      // User is pending
      try {
        const pendingUser = JSON.parse(pendingUserStr);
        setUserInfo(pendingUser);
        setIsRejected(false);
      } catch (error) {
        console.error('Error parsing pending user:', error);
        router.push('/login');
      }
      return;
    }
    
    // No pending or rejected user, redirect to login
    router.push('/login');
  }, [router]);

  const handleBackToLogin = () => {
    // Clear pending/rejected user data
    localStorage.removeItem('pendingUser');
    localStorage.removeItem('rejectedUser');
    router.push('/login');
  };

  if (!userInfo) {
    return null; // Loading or redirecting
  }

  return (
    <div className="auth-container default">
      <div className="floating-element"></div>
      <div className="floating-element"></div>
      <div className="floating-element"></div>

      <div className="auth-card" style={{ maxWidth: '600px', textAlign: 'center' }}>
        <div className="auth-header">
          <img 
            src="/assets/images/jsTree/TimePulseLogoAuth.png" 
            alt="TimePulse Logo" 
            className="auth-logo" 
          />
          <h2>{isRejected ? 'Registration Declined' : 'Registration Pending Approval'}</h2>
        </div>

        {isRejected ? (
          // Rejected Status
          <div style={{
            background: '#f8d7da',
            border: '1px solid #dc3545',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              ❌
            </div>
            <h3 style={{
              color: '#721c24',
              marginBottom: '12px',
              fontSize: '20px'
            }}>
              Registration Not Approved
            </h3>
            <p style={{
              color: '#721c24',
              fontSize: '16px',
              lineHeight: '1.6',
              marginBottom: '16px'
            }}>
              Unfortunately, your registration request has been declined by an administrator.
            </p>
            {userInfo.reason && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.5)',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '12px'
              }}>
                <strong style={{ color: '#721c24' }}>Reason:</strong>
                <p style={{
                  color: '#721c24',
                  fontSize: '14px',
                  marginTop: '8px',
                  marginBottom: '0'
                }}>
                  {userInfo.reason}
                </p>
              </div>
            )}
            <p style={{
              color: '#721c24',
              fontSize: '14px',
              lineHeight: '1.6'
            }}>
              Please contact your system administrator if you believe this is an error or if you need further assistance.
            </p>
          </div>
        ) : (
          // Pending Status
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              ⏳
            </div>
            <h3 style={{
              color: '#856404',
              marginBottom: '12px',
              fontSize: '20px'
            }}>
              Thank You for Registering!
            </h3>
            <p style={{
              color: '#856404',
              fontSize: '16px',
              lineHeight: '1.6',
              marginBottom: '16px'
            }}>
              Your registration has been submitted successfully and is currently pending admin approval.
            </p>
            <p style={{
              color: '#856404',
              fontSize: '14px',
              lineHeight: '1.6'
            }}>
              You will receive a notification once an administrator reviews your request. 
              Please check back later or contact your system administrator for more information.
            </p>
          </div>
        )}

        <div style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
          textAlign: 'left'
        }}>
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#495057',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Registration Details
          </h4>
          <div style={{ fontSize: '14px', color: '#6c757d' }}>
            {(userInfo.firstName || userInfo.lastName) && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Name:</strong> {userInfo.firstName || ''} {userInfo.lastName || ''}
              </div>
            )}
            <div style={{ marginBottom: '8px' }}>
              <strong>Email:</strong> {userInfo.email}
            </div>
            {userInfo.role && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Role:</strong> {userInfo.role.charAt(0).toUpperCase() + userInfo.role.slice(1)}
              </div>
            )}
            <div>
              <strong>Status:</strong>{' '}
              <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                background: '#ffc107',
                color: '#000',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                Pending Approval
              </span>
            </div>
          </div>
        </div>

        <div style={{
          background: '#e7f3ff',
          border: '1px solid #b3d9ff',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          fontSize: '14px',
          color: '#004085',
          lineHeight: '1.6'
        }}>
          <strong>💡 What happens next?</strong>
          <ul style={{
            textAlign: 'left',
            marginTop: '12px',
            paddingLeft: '20px'
          }}>
            <li>An administrator will review your registration</li>
            <li>You'll receive an email notification once approved</li>
            <li>After approval, you can login with your Google account</li>
          </ul>
        </div>

        <button
          onClick={handleBackToLogin}
          className="auth-btn auth-btn-primary"
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '16px',
            fontWeight: '600',
            marginTop: '8px',
            backgroundColor: '#007bff',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            zIndex: 10,
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#0056b3';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#007bff';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          Back to Sign In
        </button>

        <p style={{
          marginTop: '20px',
          fontSize: '13px',
          color: '#6c757d'
        }}>
          Need help? Contact your system administrator
        </p>
      </div>
    </div>
  );
}
