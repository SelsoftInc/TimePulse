'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/config/api';
import './BillingSuccess.css';

const BillingSuccess = () => {
  const [searchParams] = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const fetchSessionDetails = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${API_BASE}/api/billing/session/${sessionId}?tenantId=${user.tenantId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`}}
        );

        if (response.ok) {
          const data = await response.json();
          setSessionData(data);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [sessionId, user?.tenantId]);

  const handleGoToUserManagement = () => {
    const subdomain = params?.subdomain || 'selsoft';
    router.push(`/${subdomain}/settings?tab=users`);
  };

  const handleGoToDashboard = () => {
    const subdomain = params?.subdomain || 'selsoft';
    router.push(`/${subdomain}/dashboard`);
  };

  if (loading) {
    return (
      <div className="billing-success-container">
        <div className="billing-success-card loading">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p>Processing your subscription...</p>
        </div>
      </div>
    );
  }

  // Get data from session or URL params as fallback
  const seats = sessionData?.subscription?.quantity || 
                parseInt(searchParams.get('seats')) || 
                parseInt(sessionData?.session?.metadata?.seats) || 1;
  
  const plan = sessionData?.session?.metadata?.plan || 
               searchParams.get('plan') || 
               'starter';
  
  const amount = sessionData?.session?.amount_total ? 
                 (sessionData.session.amount_total / 100).toFixed(2) : 
                 searchParams.get('amount') || '0.00';

  return (
    <div className="billing-success-container">
      <div className="billing-success-card">
        {/* Success Icon */}
        <div className="success-icon-wrapper">
          <div className="success-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="success-title">Payment Successful! 🎉</h1>
        <p className="success-subtitle">
          Welcome to TimePulse {plan.charAt(0).toUpperCase() + plan.slice(1)}!
        </p>

        {/* Subscription Details */}
        <div className="subscription-details">
          <div className="detail-row">
            <span className="detail-label">Plan</span>
            <span className="detail-value">{plan.charAt(0).toUpperCase() + plan.slice(1)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Seats Purchased</span>
            <span className="detail-value highlight">{seats} users</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Amount Paid</span>
            <span className="detail-value">${amount}/month</span>
          </div>
        </div>

        {/* Next Steps */}
        <div className="next-steps">
          <h3 className="next-steps-title">What's Next?</h3>
          <div className="steps-list">
            <div className="step-item">
              <div className="step-icon">1</div>
              <div className="step-content">
                <h4>Invite Your Team</h4>
                <p>Add {seats} team members to your account</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-icon">2</div>
              <div className="step-content">
                <h4>Set Up Roles</h4>
                <p>Assign roles and permissions</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-icon">3</div>
              <div className="step-content">
                <h4>Start Tracking</h4>
                <p>Begin tracking time and projects</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="success-actions">
          <button 
            className="btn btn-primary btn-lg"
            onClick={handleGoToUserManagement}
          >
            <i className="fas fa-users mr-2"></i>
            Add Team Members
          </button>
          <button 
            className="btn btn-secondary btn-lg"
            onClick={handleGoToDashboard}
          >
            Go to Dashboard
          </button>
        </div>

        {/* Support Link */}
        <div className="success-footer">
          <p>
            Need help getting started?{' '}
            <a href="mailto:support@timepulse.com">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BillingSuccess;


