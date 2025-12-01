'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { API_BASE } from '@/config/api';
import '../common/Pagination.css';

const LeaveApprovals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  // Pagination states
  const [pendingPage, setPendingPage] = useState(1);
  const [allRequestsPage, setAllRequestsPage] = useState(1);
  const rowsPerPage = 5;

  const isAdmin = user?.role === 'admin';
  const isApprover = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'hr';

  const fetchLeaveRequests = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch pending approvals
      const pendingResponse = await fetch(
        `${API_BASE}/api/leave-management/pending-approvals?managerId=${user.id}&tenantId=${user.tenantId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingRequests(pendingData.leaveRequests || []);
      }

      // If admin, fetch all requests
      if (isAdmin) {
        const allResponse = await fetch(
          `${API_BASE}/api/leave-management/all-requests?tenantId=${user.tenantId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (allResponse.ok) {
          const allData = await allResponse.json();
          setAllRequests(allData.leaveRequests || []);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      setLoading(false);
    }
  }, [user?.id, user?.tenantId, isAdmin]);

  useEffect(() => {
    if (isApprover) {
      fetchLeaveRequests();
    }
  }, [isApprover, fetchLeaveRequests]);

  const handleApprove = async (requestId) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/leave-management/approve/${requestId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            managerId: user.id,
            comments: ''
          })
        }
      );

      if (response.ok) {
        // Refresh the list
        await fetchLeaveRequests();
        toast.success('Leave request approved successfully!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to approve leave request');
      }
    } catch (error) {
      console.error('Error approving leave request:', error);
      toast.error('Failed to approve leave request');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/leave-management/reject/${selectedRequest.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            managerId: user.id,
            reason: rejectionReason
          })
        }
      );

      if (response.ok) {
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedRequest(null);
        await fetchLeaveRequests();
        toast.success('Leave request rejected');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to reject leave request');
      }
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      toast.error('Failed to reject leave request');
    }
  };

  const openRejectModal = (request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectionReason('');
    setSelectedRequest(null);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return 'badge-success';
      case 'rejected': return 'badge-danger';
      case 'pending': return 'badge-warning';
      default: return 'badge-secondary';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!isApprover) {
    return null;
  }

  if (loading) {
    return (
      <div className="card card-bordered">
        <div className="card-inner text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading leave requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leave-approvals-section">
      <div className="card card-bordered">
        <div className="card-inne">
          <div className="card-title-group align-start mb-3">
            <div className="card-title">
              <h6 className="title">
                <i className="fas fa-clipboard-check mr-3"></i>
                Leave Approvals
              </h6>
              <p className="text-soft">Review and approve leave requests from your team</p>
            </div>
          </div>

          {/* Tabs */}
          {isAdmin && (
            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`}
                  onClick={() => setActiveTab('pending')}
                >
                  Pending ({pendingRequests.length})
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All Requests ({allRequests.length})
                </button>
              </li>
            </ul>
          )}

          {/* Pending Requests */}
          {(activeTab === 'pending' || !isAdmin) && (
            <div className="leave-requests-table">
              {pendingRequests.length === 0 ? (
                <div className="text-center p-4">
                  <em className="icon ni ni-check-circle-fill" style={{ fontSize: '48px', color: '#10b981' }}></em>
                  <h6 className="mt-3">No Pending Approvals</h6>
                  <p className="text-soft">All leave requests have been processed</p>
                </div>
              ) : (
                <>
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Employee Email</th>
                        <th>Leave Type</th>
                        <th>Dates</th>
                        <th>Days</th>
                        <th>Status</th>
                        <th>Submitted</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRequests
                        .slice((pendingPage - 1) * rowsPerPage, pendingPage * rowsPerPage)
                        .map((request) => (
                          <tr key={request.id}>
                            <td>{request.employeeName}</td>
                            <td>{request.employeeEmail}</td>
                            <td>
                              <span className="badge badge-dim badge-outline-primary">
                                {request.leaveType}
                              </span>
                            </td>
                            <td>
                              {formatDate(request.startDate)} - {formatDate(request.endDate)}
                            </td>
                            <td>{request.days}</td>
                            <td>
                              <span className="badge badge-warning">
                                Pending
                              </span>
                            </td>
                            <td>{formatDate(request.submittedAt)}</td>
                            <td>
                              <div className="d-flex gap-2">
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleApprove(request.id)}
                                  title="Approve Leave Request"
                                >
                                  <i className="fas fa-check mr-1"></i>
                                  Approve
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => openRejectModal(request)}
                                  title="Reject Leave Request"
                                >
                                  <i className="fas fa-times mr-1"></i>
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  
                  {/* Pagination Controls */}
                  {pendingRequests.length > rowsPerPage && (
                    <div className="pagination-wrappe">
                      <div className="pagination-info">
                        Showing {((pendingPage - 1) * rowsPerPage) + 1} to {Math.min(pendingPage * rowsPerPage, pendingRequests.length)} of {pendingRequests.length} entries
                      </div>
                      <div className="pagination-controls">
                        <button
                          className="pagination-btn"
                          onClick={() => setPendingPage(prev => Math.max(1, prev - 1))}
                          disabled={pendingPage === 1}
                          title="Previous Page"
                        >
                          <i className="fas fa-chevron-left"></i>
                        </button>
                        <div className="pagination-pages">
                          <span className="current-page">{pendingPage}</span>
                          <span className="page-separator">/</span>
                          <span className="total-pages">{Math.ceil(pendingRequests.length / rowsPerPage)}</span>
                        </div>
                        <button
                          className="pagination-btn"
                          onClick={() => setPendingPage(prev => Math.min(Math.ceil(pendingRequests.length / rowsPerPage), prev + 1))}
                          disabled={pendingPage >= Math.ceil(pendingRequests.length / rowsPerPage)}
                          title="Next Page"
                        >
                          <i className="fas fa-chevron-right"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* All Requests (Admin only) */}
          {activeTab === 'all' && isAdmin && (
            <div className="leave-requests-table">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Employee Email</th>
                    <th>Leave Type</th>
                    <th>Dates</th>
                    <th>Days</th>
                    <th>Status</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {allRequests
                    .slice((allRequestsPage - 1) * rowsPerPage, allRequestsPage * rowsPerPage)
                    .map((request) => (
                      <tr key={request.id}>
                        <td>{request.employeeName}</td>
                        <td>{request.employeeEmail}</td>
                        <td>
                          <span className="badge badge-dim badge-outline-primary">
                            {request.leaveType}
                          </span>
                        </td>
                        <td>
                          {formatDate(request.startDate)} - {formatDate(request.endDate)}
                        </td>
                        <td>{request.totalDays || request.days}</td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </td>
                        <td>{formatDate(request.submittedOn || request.submittedAt)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              
              {/* Pagination Controls */}
              {allRequests.length > rowsPerPage && (
                <div className="pagination-wrapper">
                  <div className="pagination-info">
                    Showing {((allRequestsPage - 1) * rowsPerPage) + 1} to {Math.min(allRequestsPage * rowsPerPage, allRequests.length)} of {allRequests.length} entries
                  </div>
                  <div className="pagination-controls">
                    <button
                      className="pagination-btn"
                      onClick={() => setAllRequestsPage(prev => Math.max(1, prev - 1))}
                      disabled={allRequestsPage === 1}
                      title="Previous Page"
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    <div className="pagination-pages">
                      <span className="current-page">{allRequestsPage}</span>
                      <span className="page-separator">/</span>
                      <span className="total-pages">{Math.ceil(allRequests.length / rowsPerPage)}</span>
                    </div>
                    <button
                      className="pagination-btn"
                      onClick={() => setAllRequestsPage(prev => Math.min(Math.ceil(allRequests.length / rowsPerPage), prev + 1))}
                      disabled={allRequestsPage >= Math.ceil(allRequests.length / rowsPerPage)}
                      title="Next Page"
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reject Leave Request</h5>
                <button type="button" className="close" onClick={closeRejectModal}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p>
                  You are about to reject the leave request from <strong>{selectedRequest?.employeeName}</strong>.
                </p>
                <div className="form-group">
                  <label className="form-label">Reason for Rejection*</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    required
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeRejectModal}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleReject}>
                  Reject Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveApprovals;
