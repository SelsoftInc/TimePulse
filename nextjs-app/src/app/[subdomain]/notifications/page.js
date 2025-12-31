'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/config/api';
import './notifications.css';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [category, setCategory] = useState('all');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [pendingUserDetails, setPendingUserDetails] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [filter, category]);

  const fetchNotifications = async () => {
    if (!user?.id || !user?.tenantId) return;

    setLoading(true);
    try {
      const includeRead = filter !== 'unread';
      let url = `${API_BASE}/api/notifications?userId=${user.id}&tenantId=${user.tenantId}&limit=100&includeRead=${includeRead}`;
      
      if (category !== 'all') {
        url += `&category=${category}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        let filteredNotifications = data.notifications || [];
        
        if (filter === 'read') {
          filteredNotifications = filteredNotifications.filter(n => n.read_at || n.readAt);
        }
        
        setNotifications(filteredNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/notifications/${notificationId}/read`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            userId: user.id,
            tenantId: user.tenantId
          })
        }
      );

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/notifications/mark-all-read`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            userId: user.id,
            tenantId: user.tenantId
          })
        }
      );

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return <i className="fas fa-check-circle"></i>;
      case 'warning': return <i className="fas fa-exclamation-triangle"></i>;
      case 'error': return <i className="fas fa-times-circle"></i>;
      case 'info': return <i className="fas fa-info-circle"></i>;
      default: return <i className="fas fa-bell"></i>;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return '#28a745';
      case 'warning': return '#ffc107';
      case 'error': return '#dc3545';
      case 'info': return '#17a2b8';
      default: return '#007bff';
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleNotificationClick = async (notification) => {
    console.log('[Notification Click]', {
      category: notification.category,
      metadata: notification.metadata,
      title: notification.title
    });

    // Mark as read if unread
    if (!notification.read_at && !notification.readAt) {
      await markAsRead(notification.id);
    }

    // Check if this is an account request notification (new user registration)
    const accountRequestId = notification.metadata?.accountRequestId;
    const pendingUserEmail = notification.metadata?.pendingUserEmail;
    
    // Check if this is an OAuth user approval notification
    const userId = notification.metadata?.userId || notification.metadata?.pendingUserId;
    
    console.log('[Notification Click] Account Request ID:', accountRequestId);
    console.log('[Notification Click] Pending User Email:', pendingUserEmail);
    console.log('[Notification Click] User ID:', userId);
    
    if (notification.category === 'approval' && accountRequestId) {
      console.log('[Notification Click] Opening approval modal for account request:', accountRequestId);
      // Fetch account request details
      await fetchAccountRequestDetails(accountRequestId, notification);
    } else if (notification.category === 'approval' && userId) {
      console.log('[Notification Click] Opening approval modal for OAuth user:', userId);
      // Fetch OAuth user details
      await fetchPendingUserDetails(userId, notification);
    } else {
      console.log('[Notification Click] Not an approval notification or missing required IDs');
    }
  };

  const fetchAccountRequestDetails = async (accountRequestId, notification) => {
    console.log('[fetchAccountRequestDetails] Starting fetch for accountRequestId:', accountRequestId);
    
    try {
      const url = `${API_BASE}/api/account-request/${accountRequestId}`;
      console.log('[fetchAccountRequestDetails] Fetching from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('[fetchAccountRequestDetails] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[fetchAccountRequestDetails] Response data:', data);
        
        if (data.success && data.request) {
          // Transform account request to match the expected format
          const transformedRequest = {
            id: data.request.id,
            firstName: data.request.firstName,
            lastName: data.request.lastName,
            email: data.request.email,
            role: data.request.requestedRole,
            status: data.request.status,
            createdAt: data.request.createdAt,
            isAccountRequest: true // Flag to identify this as account request
          };
          
          setPendingUserDetails(transformedRequest);
          setSelectedNotification(notification);
          setShowApprovalModal(true);
          console.log('[fetchAccountRequestDetails] Modal should open now');
        } else {
          console.error('[fetchAccountRequestDetails] Request not found');
          alert('Account request not found or already processed');
        }
      } else {
        const errorData = await response.json();
        console.error('[fetchAccountRequestDetails] API error:', errorData);
        alert(`Failed to fetch account request details: ${errorData.message || 'Server error'}`);
      }
    } catch (error) {
      console.error('[fetchAccountRequestDetails] Fetch error:', error);
      alert('Failed to fetch account request details: ' + error.message);
    }
  };

  const fetchPendingUserDetails = async (userId, notification) => {
    console.log('[fetchPendingUserDetails] Starting fetch for userId:', userId);
    console.log('[fetchPendingUserDetails] Tenant ID:', user.tenantId);
    
    try {
      const url = `${API_BASE}/api/user-approvals/pending?tenantId=${user.tenantId}`;
      console.log('[fetchPendingUserDetails] Fetching from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('[fetchPendingUserDetails] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[fetchPendingUserDetails] Response data:', data);
        
        const pendingUser = data.pendingUsers?.find(u => u.id === userId);
        console.log('[fetchPendingUserDetails] Found pending user:', pendingUser);
        
        if (pendingUser) {
          setPendingUserDetails(pendingUser);
          setSelectedNotification(notification);
          setShowApprovalModal(true);
          console.log('[fetchPendingUserDetails] Modal should open now');
        } else {
          console.error('[fetchPendingUserDetails] User not found in pending list');
          alert('User not found or already processed');
        }
      } else {
        const errorData = await response.json();
        console.error('[fetchPendingUserDetails] API error:', errorData);
        alert(`Failed to fetch user details: ${errorData.message || 'Server error'}`);
      }
    } catch (error) {
      console.error('[fetchPendingUserDetails] Fetch error:', error);
      alert('Failed to fetch user details: ' + error.message);
    }
  };

  const handleApproveUser = async () => {
    if (!pendingUserDetails || !user) return;

    setApprovalLoading(true);
    try {
      // Check if this is an account request or OAuth user
      const isAccountRequest = pendingUserDetails.isAccountRequest;
      const endpoint = isAccountRequest 
        ? `${API_BASE}/api/account-request/approve/${pendingUserDetails.id}`
        : `${API_BASE}/api/user-approvals/approve/${pendingUserDetails.id}`;
      
      console.log('[handleApproveUser] Approving:', isAccountRequest ? 'Account Request' : 'OAuth User');
      console.log('[handleApproveUser] Endpoint:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          tenantId: user.tenantId,
          adminId: user.id
        })
      });

      if (response.ok) {
        alert('User approved successfully! Email notification sent.');
        setShowApprovalModal(false);
        setPendingUserDetails(null);
        setSelectedNotification(null);
        fetchNotifications(); // Refresh notifications
      } else {
        const data = await response.json();
        alert(`Failed to approve user: ${data.message}`);
      }
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Failed to approve user');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleRejectUser = async () => {
    if (!pendingUserDetails || !user) return;

    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }

    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setApprovalLoading(true);
    try {
      // Check if this is an account request or OAuth user
      const isAccountRequest = pendingUserDetails.isAccountRequest;
      const endpoint = isAccountRequest 
        ? `${API_BASE}/api/account-request/reject/${pendingUserDetails.id}`
        : `${API_BASE}/api/user-approvals/reject/${pendingUserDetails.id}`;
      
      console.log('[handleRejectUser] Rejecting:', isAccountRequest ? 'Account Request' : 'OAuth User');
      console.log('[handleRejectUser] Endpoint:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          tenantId: user.tenantId,
          adminId: user.id,
          reason: rejectionReason
        })
      });

      if (response.ok) {
        alert('User rejected successfully! Email notification sent.');
        setShowApprovalModal(false);
        setPendingUserDetails(null);
        setSelectedNotification(null);
        setRejectionReason('');
        setShowRejectInput(false);
        fetchNotifications(); // Refresh notifications
      } else {
        const data = await response.json();
        alert(`Failed to reject user: ${data.message}`);
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Failed to reject user');
    } finally {
      setApprovalLoading(false);
    }
  };

  const closeModal = () => {
    setShowApprovalModal(false);
    setPendingUserDetails(null);
    setSelectedNotification(null);
    setRejectionReason('');
    setShowRejectInput(false);
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>Notifications</h1>
        <button className="mark-all-btn" onClick={markAllAsRead}>
          <i className="fas fa-check-double"></i>
          Mark all as read
        </button>
      </div>

      <div className="notifications-filters">
        <div className="filter-group">
          <label>Status:</label>
          <div className="filter-buttons">
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={filter === 'unread' ? 'active' : ''}
              onClick={() => setFilter('unread')}
            >
              Unread
            </button>
            <button 
              className={filter === 'read' ? 'active' : ''}
              onClick={() => setFilter('read')}
            >
              Read
            </button>
          </div>
        </div>

        {/* <div className="filter-group">
          <label>Category:</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All Categories</option>
            <option value="approval">Approvals</option>
            <option value="timesheet">Timesheets</option>
            <option value="leave">Leave</option>
            <option value="invoice">Invoices</option>
            <option value="system">System</option>
            <option value="general">General</option>
          </select>
        </div> */}
      </div>

      <div className="notifications-list">
        {loading ? (
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-bell-slash"></i>
            <h3>No notifications found</h3>
            <p>You're all caught up!</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-card ${notification.read_at || notification.readAt ? 'read' : 'unread'} ${notification.priority}`}
            >
              <div 
                className="notification-icon"
                style={{ background: getNotificationColor(notification.type) }}
              >
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="notification-body">
                <div className="notification-header-row">
                  <h3>{notification.title}</h3>
                  {!(notification.read_at || notification.readAt) && (
                    <span className="unread-badge">New</span>
                  )}
                </div>
                
                <p className="notification-message">{notification.message}</p>
                
                <div className="notification-meta">
                  <span className="notification-date">
                    <i className="fas fa-clock"></i>
                    {formatDate(notification.created_at || notification.createdAt)}
                  </span>
                  {notification.category && (
                    <span className="notification-category">
                      {notification.category}
                    </span>
                  )}
                  {notification.priority === 'high' && (
                    <span className="priority-badge high">High Priority</span>
                  )}
                  {notification.priority === 'urgent' && (
                    <span className="priority-badge urgent">Urgent</span>
                  )}
                </div>
              </div>

              {/* View Button - Only for User Registration Approval Notifications */}
              {notification.category === 'approval' && 
               notification.title?.includes('User Registration') && (
                <button
                  className="notification-view-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNotificationClick(notification);
                  }}
                >
                  <i className="fas fa-eye"></i> View
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* User Approval Modal */}
      {showApprovalModal && pendingUserDetails && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="approval-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Approval Request</h2>
              <button className="modal-close-btn" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="user-details-section">
                <h3>User Information</h3>
                <div className="user-detail-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">
                    {pendingUserDetails.firstName} {pendingUserDetails.lastName}
                  </span>
                </div>
                <div className="user-detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{pendingUserDetails.email}</span>
                </div>
                <div className="user-detail-row">
                  <span className="detail-label">Role:</span>
                  <span className="detail-value role-badge">
                    {pendingUserDetails.role?.charAt(0).toUpperCase() + pendingUserDetails.role?.slice(1) || 'N/A'}
                  </span>
                </div>
                {pendingUserDetails.department && (
                  <div className="user-detail-row">
                    <span className="detail-label">Department:</span>
                    <span className="detail-value">{pendingUserDetails.department}</span>
                  </div>
                )}
                {pendingUserDetails.title && (
                  <div className="user-detail-row">
                    <span className="detail-label">Title:</span>
                    <span className="detail-value">{pendingUserDetails.title}</span>
                  </div>
                )}
                <div className="user-detail-row">
                  <span className="detail-label">Auth Provider:</span>
                  <span className="detail-value">
                    {pendingUserDetails.authProvider === 'google' ? (
                      <span><i className="fab fa-google"></i> Google OAuth</span>
                    ) : pendingUserDetails.authProvider}
                  </span>
                </div>
                <div className="user-detail-row">
                  <span className="detail-label">Registration Date:</span>
                  <span className="detail-value">
                    {formatDate(pendingUserDetails.createdAt)}
                  </span>
                </div>
              </div>

              {showRejectInput && (
                <div className="rejection-reason-section">
                  <label htmlFor="rejectionReason">Rejection Reason:</label>
                  <textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    rows="4"
                  />
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn-approve"
                onClick={handleApproveUser}
                disabled={approvalLoading}
              >
                {approvalLoading ? (
                  <><i className="fas fa-spinner fa-spin"></i> Processing...</>
                ) : (
                  <><i className="fas fa-check"></i> Approve User</>
                )}
              </button>
              <button
                className="btn-reject"
                onClick={handleRejectUser}
                disabled={approvalLoading}
              >
                {approvalLoading ? (
                  <><i className="fas fa-spinner fa-spin"></i> Processing...</>
                ) : showRejectInput ? (
                  <><i className="fas fa-paper-plane"></i> Confirm Rejection</>
                ) : (
                  <><i className="fas fa-times"></i> Reject User</>
                )}
              </button>
              <button
                className="btn-cancel"
                onClick={closeModal}
                disabled={approvalLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
