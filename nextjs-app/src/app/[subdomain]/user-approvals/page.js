'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/config/api';
// Layout removed - using direct component structure
import './UserApprovals.css';

export default function UserApprovalsPage() {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch pending users
  const fetchPendingUsers = async () => {
    if (!user?.tenantId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/user-approvals/pending?tenantId=${user.tenantId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPendingUsers(data.pendingUsers || []);
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Approve user
  const handleApprove = async (userId) => {
    if (!user?.id || !user?.tenantId) return;

    setActionLoading(userId);
    try {
      const response = await fetch(
        `${API_BASE}/api/user-approvals/approve/${userId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            tenantId: user.tenantId,
            adminId: user.id
          })
        }
      );

      if (response.ok) {
        // Remove from pending list
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
        
        // Show success message
        alert('User approved successfully!');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to approve user');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Failed to approve user');
    } finally {
      setActionLoading(null);
    }
  };

  // Reject user
  const handleReject = async () => {
    if (!selectedUser || !user?.id || !user?.tenantId) return;

    setActionLoading(selectedUser.id);
    try {
      const response = await fetch(
        `${API_BASE}/api/user-approvals/reject/${selectedUser.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            tenantId: user.tenantId,
            adminId: user.id,
            reason: rejectionReason || 'Your registration was not approved.'
          })
        }
      );

      if (response.ok) {
        // Remove from pending list
        setPendingUsers(prev => prev.filter(u => u.id !== selectedUser.id));
        
        // Close modal and reset
        setShowRejectModal(false);
        setSelectedUser(null);
        setRejectionReason('');
        
        // Show success message
        alert('User rejected successfully');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to reject user');
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Failed to reject user');
    } finally {
      setActionLoading(null);
    }
  };

  // Open reject modal
  const openRejectModal = (user) => {
    setSelectedUser(user);
    setShowRejectModal(true);
  };

  // Close reject modal
  const closeRejectModal = () => {
    setShowRejectModal(false);
    setSelectedUser(null);
    setRejectionReason('');
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchPendingUsers();
  }, [user]);

  // Check if user is admin
  if (user && user.role !== 'admin') {
    return (
      <div className="user-approvals-container">
        <div className="access-denied">
          <i className="fas fa-lock"></i>
          <h2>Access Denied</h2>
          <p>Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  return (
      <div className="user-approvals-container">
        <div className="page-header">
          <div>
            <h1>User Approvals</h1>
            <p>Review and approve new user registrations</p>
          </div>
          <button 
            className="refresh-btn"
            onClick={fetchPendingUsers}
            disabled={loading}
          >
            <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading pending approvals...</p>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-check-circle"></i>
            <h3>No Pending Approvals</h3>
            <p>All user registrations have been reviewed.</p>
          </div>
        ) : (
          <div className="approvals-grid">
            {pendingUsers.map((pendingUser) => (
              <div key={pendingUser.id} className="approval-card">
                <div className="approval-card-header">
                  <div className="user-avatar">
                    {pendingUser.firstName?.[0]}{pendingUser.lastName?.[0]}
                  </div>
                  <div className="user-info">
                    <h3>{pendingUser.firstName} {pendingUser.lastName}</h3>
                    <p className="user-email">{pendingUser.email}</p>
                  </div>
                  <span className="pending-badge">Pending</span>
                </div>

                <div className="approval-card-body">
                  <div className="info-row">
                    <span className="info-label">Role:</span>
                    <span className="info-value role-badge">
                      {pendingUser.role.charAt(0).toUpperCase() + pendingUser.role.slice(1)}
                    </span>
                  </div>
                  
                  {pendingUser.department && (
                    <div className="info-row">
                      <span className="info-label">Department:</span>
                      <span className="info-value">{pendingUser.department}</span>
                    </div>
                  )}

                  {pendingUser.approverName && (
                    <div className="info-row">
                      <span className="info-label">Selected Approver:</span>
                      <span className="info-value">
                        <i className="fas fa-user-check"></i> {pendingUser.approverName}
                      </span>
                    </div>
                  )}

                  <div className="info-row">
                    <span className="info-label">Auth Provider:</span>
                    <span className="info-value">
                      <i className="fab fa-google"></i> {pendingUser.authProvider}
                    </span>
                  </div>

                  <div className="info-row">
                    <span className="info-label">Registered:</span>
                    <span className="info-value">{formatDate(pendingUser.createdAt)}</span>
                  </div>
                </div>

                <div className="approval-card-actions">
                  <button
                    className="approve-btn"
                    onClick={() => handleApprove(pendingUser.id)}
                    disabled={actionLoading === pendingUser.id}
                  >
                    {actionLoading === pendingUser.id ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Approving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check"></i>
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => openRejectModal(pendingUser)}
                    disabled={actionLoading === pendingUser.id}
                  >
                    <i className="fas fa-times"></i>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="modal-overlay" onClick={closeRejectModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Reject User Registration</h3>
                <button className="modal-close" onClick={closeRejectModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="modal-body">
                <p>
                  Are you sure you want to reject the registration for{' '}
                  <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>?
                </p>

                <div className="form-group">
                  <label htmlFor="rejectionReason">Reason (optional):</label>
                  <textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason for rejection..."
                    rows="4"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button className="cancel-btn" onClick={closeRejectModal}>
                  Cancel
                </button>
                <button 
                  className="confirm-reject-btn" 
                  onClick={handleReject}
                  disabled={actionLoading === selectedUser?.id}
                >
                  {actionLoading === selectedUser?.id ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Rejecting...
                    </>
                  ) : (
                    'Confirm Rejection'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
