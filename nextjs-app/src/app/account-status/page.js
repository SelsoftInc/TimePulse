'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { API_BASE } from '@/config/api';

export default function AccountStatusPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (email) {
      fetchStatus();
      // Poll for status updates every 30 seconds
      const interval = setInterval(fetchStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [email]);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/account-request/status/${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.request);
        console.log('✅ Status fetched:', data.request.status);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('❌ Error fetching status:', err);
      setError('Failed to fetch account status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!status) return null;

    switch (status.status) {
      case 'pending':
        return (
          <svg className="w-24 h-24 mx-auto text-yellow-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'approved':
        return (
          <svg className="w-24 h-24 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'rejected':
        return (
          <svg className="w-24 h-24 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    if (!status) return null;

    switch (status.status) {
      case 'pending':
        return {
          title: 'Request Pending',
          message: 'Your account request is being reviewed',
          description: status.approverName 
            ? `Your request has been sent to ${status.approverName} for approval. You will receive an email notification once your request is processed.`
            : 'Your request is awaiting approval. You will receive an email notification once your request is processed.',
          color: 'text-yellow-500',
        };
      case 'approved':
        return {
          title: 'Account Approved!',
          message: 'Your account has been approved',
          description: `Approved by ${status.approvedBy || 'Administrator'} on ${status.approvedAt ? new Date(status.approvedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : 'recently'}. You should receive an email with your login credentials shortly.`,
          color: 'text-green-500',
        };
      case 'rejected':
        return {
          title: 'Request Rejected',
          message: 'Your account request was not approved',
          description: status.rejectionReason || 'Your request was rejected. Please contact the administrator for more information.',
          color: 'text-red-500',
        };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
            <p className="text-gray-700 text-lg font-semibold">Loading account status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full">
          <div className="text-center">
            {/* Error Icon */}
            <div className="mb-6">
              <svg className="w-20 h-20 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            {/* Error Title */}
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Error</h2>
            
            {/* Error Message */}
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              {error || 'Account request not found'}
            </p>
            
            {/* Action Button */}
            <Link 
              href="/create-account" 
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Create New Request
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Account Status</h1>
          <p className="text-gray-600 text-lg">Check your account request status</p>
        </div>

        <div className="text-center">
          {/* Status Icon */}
          <div className="mb-6">
            {getStatusIcon()}
          </div>

          {/* Status Title */}
          <h2 className="text-3xl font-bold mb-4 text-gray-900">
            {statusInfo.title}
          </h2>

          {/* Status Message */}
          <p className="text-gray-700 text-xl mb-6 font-semibold">
            {statusInfo.message}
          </p>

          {/* Status Description */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8">
            <p className="text-gray-700 leading-relaxed text-left">
              {statusInfo.description}
            </p>
          </div>

          {/* Account Details */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6 mb-8 text-left">
            <h3 className="text-gray-900 font-bold mb-4 text-xl">Request Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-semibold">Name:</span>
                <span className="text-gray-900 font-bold">{status.firstName} {status.lastName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-semibold">Email:</span>
                <span className="text-gray-900 font-bold">{status.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-semibold">Requested Role:</span>
                <span className="text-gray-900 font-bold capitalize">{status.requestedRole}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-semibold">Submitted:</span>
                <span className="text-gray-900 font-bold">
                  {status.createdAt ? new Date(status.createdAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  }) : 'N/A'}
                </span>
              </div>
              {status.approverName && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-semibold">Approver:</span>
                  <span className="text-gray-900 font-bold">{status.approverName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {status.status === 'approved' && (
              <Link 
                href="/login" 
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Go to Login
              </Link>
            )}
            {status.status === 'rejected' && (
              <Link 
                href="/create-account" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Submit New Request
              </Link>
            )}
            {status.status === 'pending' && (
              <button
                onClick={fetchStatus}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Status
              </button>
            )}
            <Link 
              href="/login" 
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Back to Login
            </Link>
          </div>

          {/* Auto-refresh notice */}
          {status.status === 'pending' && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mt-6">
              <p className="text-yellow-800 text-sm font-semibold">
                ⏱️ Status updates automatically every 30 seconds
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
