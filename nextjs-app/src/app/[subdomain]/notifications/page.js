'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/config/api';

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
  const [accountRequestDetails, setAccountRequestDetails] = useState(null);
  const [showAccountRequestModal, setShowAccountRequestModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

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
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
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

    // Check if this is an account request notification
    const accountRequestId = notification.metadata?.accountRequestId;
    if (accountRequestId) {
      console.log('[Notification Click] Opening account request modal for:', accountRequestId);
      await fetchAccountRequestDetails(accountRequestId, notification);
      return;
    }

    // Check if this is a user approval notification
    const userId = notification.metadata?.userId || notification.metadata?.pendingUserId;
    console.log('[Notification Click] User ID:', userId);
    
    if (notification.category === 'approval' && userId) {
      console.log('[Notification Click] Opening approval modal for user:', userId);
      // Fetch user details
      await fetchPendingUserDetails(userId, notification);
    } else {
      console.log('[Notification Click] Not an approval notification or missing userId');
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
      const response = await fetch(
        `${API_BASE}/api/user-approvals/approve/${pendingUserDetails.id}`,
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
        setShowApprovalModal(false);
        setPendingUserDetails(null);
        setSelectedNotification(null);
        setSuccessMessage('User approved successfully!');
        setShowSuccessModal(true);
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
      const response = await fetch(
        `${API_BASE}/api/user-approvals/reject/${pendingUserDetails.id}`,
        {
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
        }
      );

      if (response.ok) {
        setShowApprovalModal(false);
        setPendingUserDetails(null);
        setSelectedNotification(null);
        setRejectionReason('');
        setShowRejectInput(false);
        setSuccessMessage('User rejected successfully!');
        setShowSuccessModal(true);
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

  const fetchAccountRequestDetails = async (accountRequestId, notification) => {
    console.log('[fetchAccountRequestDetails] Starting fetch for requestId:', accountRequestId);
    
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
          setAccountRequestDetails(data.request);
          setSelectedNotification(notification);
          setShowAccountRequestModal(true);
          console.log('[fetchAccountRequestDetails] Modal should open now');
        } else {
          console.error('[fetchAccountRequestDetails] Request not found');
          alert('Account request not found or already processed');
        }
      } else {
        const errorData = await response.json();
        console.error('[fetchAccountRequestDetails] API error:', errorData);
        alert(`Failed to fetch request details: ${errorData.message || 'Server error'}`);
      }
    } catch (error) {
      console.error('[fetchAccountRequestDetails] Fetch error:', error);
      alert('Failed to fetch request details: ' + error.message);
    }
  };

  const handleApproveAccountRequest = async () => {
    if (!accountRequestDetails || !user) return;

    setApprovalLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/account-request/approve/${accountRequestDetails.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            approverId: user.id
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setShowAccountRequestModal(false);
        setAccountRequestDetails(null);
        setSelectedNotification(null);
        setSuccessMessage('Account approved successfully!');
        setShowSuccessModal(true);
        fetchNotifications();
      } else {
        const data = await response.json();
        alert(`Failed to approve request: ${data.message}`);
      }
    } catch (error) {
      console.error('Error approving account request:', error);
      alert('Failed to approve account request');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleRejectAccountRequest = async () => {
    if (!accountRequestDetails || !user) return;

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
      const response = await fetch(
        `${API_BASE}/api/account-request/reject/${accountRequestDetails.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            rejectedBy: user.id,
            reason: rejectionReason
          })
        }
      );

      if (response.ok) {
        setShowAccountRequestModal(false);
        setAccountRequestDetails(null);
        setSelectedNotification(null);
        setRejectionReason('');
        setShowRejectInput(false);
        setSuccessMessage('Account request rejected successfully!');
        setShowSuccessModal(true);
        fetchNotifications();
      } else {
        const data = await response.json();
        alert(`Failed to reject request: ${data.message}`);
      }
    } catch (error) {
      console.error('Error rejecting account request:', error);
      alert('Failed to reject account request');
    } finally {
      setApprovalLoading(false);
    }
  };

  const closeModal = () => {
    setShowApprovalModal(false);
    setPendingUserDetails(null);
    setShowAccountRequestModal(false);
    setAccountRequestDetails(null);
    setSelectedNotification(null);
    setRejectionReason('');
    setShowRejectInput(false);
  };

  // Pagination calculations
  const totalPages = Math.ceil(notifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNotifications = notifications.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header Card */}
      <div className="mb-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-4 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Notifications</h1>
            <p className="text-cyan-50 text-sm">Stay updated with your latest notifications</p>
          </div>
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 bg-white text-cyan-600 px-5 py-2 rounded-lg font-semibold hover:bg-cyan-50 transition-all duration-200 shadow-sm hover:shadow-md text-sm"
          >
            <i className="fas fa-check-double"></i>
            Mark all as read
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Filter by Status:</span>
            <div className="flex gap-2">
              <button
                onClick={() => { setFilter('all'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-200 text-sm ${
                  filter === 'all'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => { setFilter('unread'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-200 text-sm ${
                  filter === 'unread'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Unread
              </button>
              <button
                onClick={() => { setFilter('read'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-200 text-sm ${
                  filter === 'read'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Read
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {notifications.length > 0 ? (
              <span>{startIndex + 1}-{Math.min(endIndex, notifications.length)} of {notifications.length} notifications</span>
            ) : (
              <span>0 notifications</span>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center border border-gray-200 dark:border-gray-700">
            <i className="fas fa-spinner fa-spin text-3xl text-cyan-600 mb-3"></i>
            <p className="text-gray-600 dark:text-gray-400">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center border border-gray-200 dark:border-gray-700">
            <i className="fas fa-bell-slash text-5xl text-gray-300 dark:text-gray-600 mb-3"></i>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">No notifications found</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">You're all caught up!</p>
          </div>
        ) : (
          <>
            {currentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border transition-all duration-200 hover:shadow-md ${
                  notification.read_at || notification.readAt
                    ? 'border-gray-200 dark:border-gray-700'
                    : 'border-cyan-200 dark:border-cyan-800 bg-cyan-50/30 dark:bg-cyan-900/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
                    style={{ background: getNotificationColor(notification.type) }}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {!(notification.read_at || notification.readAt) && (
                          <span className="px-2 py-0.5 bg-cyan-600 text-white text-[10px] font-semibold rounded-full">
                            New
                          </span>
                        )}
                        {notification.priority === 'high' && (
                          <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-semibold rounded-full">
                            High Priority
                          </span>
                        )}
                        {notification.priority === 'urgent' && (
                          <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-semibold rounded-full">
                            Urgent
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 leading-snug">
                      {notification.message}
                    </p>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                        <i className="fas fa-clock"></i>
                        {formatDate(notification.created_at || notification.createdAt)}
                      </span>
                      {notification.category && (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-[10px] font-medium">
                          {notification.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  {((notification.title?.includes('Account Request') && notification.metadata?.accountRequestId) ||
                    (notification.category === 'approval' && notification.title?.includes('User Registration'))) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotificationClick(notification);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors duration-200 flex-shrink-0 text-sm"
                    >
                      <i className="fas fa-eye text-xs"></i>
                      View
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(endIndex, notifications.length)} of {notifications.length} notifications
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-200 text-sm ${
                  currentPage === 1
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <i className="fas fa-chevron-left text-xs"></i>
              </button>
              
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-200 text-sm ${
                        currentPage === page
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return (
                    <span key={page} className="px-1 text-gray-400 dark:text-gray-500 text-xs">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-200 text-sm ${
                  currentPage === totalPages
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <i className="fas fa-chevron-right text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Request Approval Modal */}
      {showAccountRequestModal && accountRequestDetails && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
              <h2 className="text-xl font-bold">Account Request Approval</h2>
              <button 
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors duration-200"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Request Information</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {accountRequestDetails.firstName} {accountRequestDetails.lastName}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Email:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{accountRequestDetails.email}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {accountRequestDetails.countryCode} {accountRequestDetails.phone}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Requested Role:</span>
                  <span className="px-3 py-1 bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 rounded-lg text-xs font-semibold">
                    {accountRequestDetails.requestedRole?.charAt(0).toUpperCase() + accountRequestDetails.requestedRole?.slice(1) || 'N/A'}
                  </span>
                </div>
                {accountRequestDetails.companyName && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Company:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{accountRequestDetails.companyName}</span>
                  </div>
                )}
                {accountRequestDetails.department && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Department:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{accountRequestDetails.department}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Request Date:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatDate(accountRequestDetails.createdAt)}
                  </span>
                </div>
              </div>

              {showRejectInput && (
                <div className="mt-4">
                  <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rejection Reason:</label>
                  <textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 px-6 py-4 rounded-b-2xl flex gap-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleApproveAccountRequest}
                disabled={approvalLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm"
              >
                {approvalLoading ? (
                  <><i className="fas fa-spinner fa-spin"></i> Processing...</>
                ) : (
                  <><i className="fas fa-check"></i> Approve Request</>
                )}
              </button>
              <button
                onClick={handleRejectAccountRequest}
                disabled={approvalLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm"
              >
                {approvalLoading ? (
                  <><i className="fas fa-spinner fa-spin"></i> Processing...</>
                ) : showRejectInput ? (
                  <><i className="fas fa-paper-plane"></i> Confirm Rejection</>
                ) : (
                  <><i className="fas fa-times"></i> Reject Request</>
                )}
              </button>
              <button
                onClick={closeModal}
                disabled={approvalLoading}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Approval Modal */}
      {showApprovalModal && pendingUserDetails && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
              <h2 className="text-xl font-bold">User Approval Request</h2>
              <button 
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors duration-200"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">User Information</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {pendingUserDetails.firstName} {pendingUserDetails.lastName}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Email:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{pendingUserDetails.email}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Role:</span>
                  <span className="px-3 py-1 bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 rounded-lg text-xs font-semibold">
                    {pendingUserDetails.role?.charAt(0).toUpperCase() + pendingUserDetails.role?.slice(1) || 'N/A'}
                  </span>
                </div>
                {pendingUserDetails.department && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Department:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{pendingUserDetails.department}</span>
                  </div>
                )}
                {pendingUserDetails.title && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Title:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{pendingUserDetails.title}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Auth Provider:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {pendingUserDetails.authProvider === 'google' ? (
                      <span><i className="fab fa-google"></i> Google OAuth</span>
                    ) : pendingUserDetails.authProvider}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Registration Date:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatDate(pendingUserDetails.createdAt)}
                  </span>
                </div>
              </div>

              {showRejectInput && (
                <div className="mt-4">
                  <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rejection Reason:</label>
                  <textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 px-6 py-4 rounded-b-2xl flex gap-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleApproveUser}
                disabled={approvalLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm"
              >
                {approvalLoading ? (
                  <><i className="fas fa-spinner fa-spin"></i> Processing...</>
                ) : (
                  <><i className="fas fa-check"></i> Approve User</>
                )}
              </button>
              <button
                onClick={handleRejectUser}
                disabled={approvalLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm"
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
                onClick={closeModal}
                disabled={approvalLoading}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSuccessModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check-circle text-5xl text-green-600 dark:text-green-400"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">{successMessage}</h2>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full px-6 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-colors duration-200"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
