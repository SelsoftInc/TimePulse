'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { API_BASE } from '@/config/api';
import { decryptApiResponse } from '@/utils/encryption';
import '../common/Pagination.css';

const LeaveApprovals = () => {
  // SAMPLE DATA — UI PREVIEW ONLY
  const SAMPLE_PENDING_REQUESTS = [
    {
      id: 'sample-pending-1',
      employeeName: 'John Doe',
      employeeEmail: 'john.doe@company.com',
      leaveType: 'Vacation',
      startDate: '2024-10-10',
      endDate: '2024-10-12',
      days: 3,
      submittedAt: '2024-10-01'
    },
    {
      id: 'sample-pending-2',
      employeeName: 'Jane Smith',
      employeeEmail: 'jane.smith@company.com',
      leaveType: 'Sick',
      startDate: '2024-09-01',
      endDate: '2024-09-01',
      days: 1,
      submittedAt: '2024-08-31'
    }
  ];

  // SAMPLE DATA — UI PREVIEW ONLY
  const SAMPLE_ALL_REQUESTS = [
    {
      id: 'sample-all-1',
      employeeName: 'John Doe',
      employeeEmail: 'john.doe@company.com',
      leaveType: 'Vacation',
      startDate: '2024-10-10',
      endDate: '2024-10-12',
      days: 3,
      status: 'pending',
      submittedAt: '2024-10-01'
    },
    {
      id: 'sample-all-2',
      employeeName: 'Jane Smith',
      employeeEmail: 'jane.smith@company.com',
      leaveType: 'Sick',
      startDate: '2024-09-01',
      endDate: '2024-09-01',
      days: 1,
      status: 'approved',
      submittedAt: '2024-08-31'
    }
  ];

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
        const rawPendingData = await pendingResponse.json();
        const pendingData = decryptApiResponse(rawPendingData);
        console.log('🔓 Decrypted pending approvals:', pendingData);
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
          const rawAllData = await allResponse.json();
          const allData = decryptApiResponse(rawAllData);
          console.log('🔓 Decrypted all requests:', allData);
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
        const rawErrorData = await response.json();
        const errorData = decryptApiResponse(rawErrorData);
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
        const rawErrorData = await response.json();
        const errorData = decryptApiResponse(rawErrorData);
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
      <div className="leave-approvals-section px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="card card-bordered overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="card-inner text-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading leave requests...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
<div className="leave-approval">
  <div className="max-w-8xl mx-auto space-y-4">

    {/* ================= LEAVE APPROVALS HEADER ================= */}
    <div
      className="
        sticky top-4 z-30
        rounded-3xl
        bg-[#7cbdf2]
        shadow-sm
        backdrop-blur-md
        border border-transparent
      "
    >
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-center">

          {/* LEFT */}
          <div className="relative pl-5">
            <span className="absolute left-0 top-2 h-10 w-1 rounded-full bg-purple-900" />

            <h1
              className="
                text-[2rem]
                font-bold
                text-white
                leading-[1.15]
                tracking-tight
                drop-shadow-[0_2px_8px_rgba(0,0,0,0.18)]
              "
            >
              Leave Approvals
            </h1>

            <p className="mt-0 text-sm text-white/80">
              Review, approve, or reject employee leave requests
            </p>
          </div>

          {/* RIGHT */}
          <div className="flex flex-wrap items-center gap-3 justify-start md:justify-end">
            {isAdmin && (
              <span
                className="
                  rounded-full
                  bg-white/90 px-4 py-2
                  text-sm font-semibold text-slate-900
                  shadow-sm
                "
              >
                Admin
              </span>
            )}

            {!isAdmin && isApprover && (
              <span
                className="
                  rounded-full
                  bg-white/90 px-4 py-2
                  text-sm font-semibold text-slate-900
                  shadow-sm
                "
              >
                Approver
              </span>
            )}
          </div>

        </div>
      </div>
    </div>

        <div className="card card-bordered overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="card-inne p-5">

          {/* Tabs */}
          {isAdmin && (
            <div className="mb-5">
              <div className="inline-flex w-full flex-wrap gap-2 rounded-2xl bg-slate-100 p-1 sm:w-auto">
                <button
                  className={`nav-link rounded-xl px-4 py-2 text-sm font-medium transition ${activeTab === 'pending' ? 'active bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'bg-transparent text-slate-600 hover:bg-white/60 hover:text-slate-900'}`}
                  onClick={() => setActiveTab('pending')}
                >
                  Pending ({pendingRequests.length})
                </button>
                <button
                  className={`nav-link rounded-xl px-4 py-2 text-sm font-medium transition ${activeTab === 'all' ? 'active bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'bg-transparent text-slate-600 hover:bg-white/60 hover:text-slate-900'}`}
                  onClick={() => setActiveTab('all')}
                >
                  All Requests ({allRequests.length})
                </button>
              </div>
            </div>
          )}

          {/* Pending Requests */}
          {(activeTab === 'pending' || !isAdmin) && (
            <div className="leave-requests-table overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {(pendingRequests.length ? pendingRequests : SAMPLE_PENDING_REQUESTS).length === 0 ? (
                <div className="text-center p-8 sm:p-10">
                  <div className="mx-auto flex max-w-md flex-col items-center justify-center">
                    <em className="icon ni ni-check-circle-fill" style={{ fontSize: '48px', color: '#10b981' }}></em>
                    <h6 className="mt-4 text-base font-semibold text-slate-900">No Pending Approvals</h6>
                    <p className="text-soft mt-1 text-sm text-slate-600">All leave requests have been processed</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mx-auto w-full overflow-x-auto">
                    <table className="table table-bordered mb-0 w-full">
                      <thead className="sticky top-0 z-10 bg-slate-50/70">
                      <tr>
                        <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Employee</th>
                        <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Employee Email</th>
                        <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Leave Type</th>
                        <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Dates</th>
                        <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Days</th>
                        <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Status</th>
                        <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Submitted</th>
                        <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(pendingRequests.length ? pendingRequests : SAMPLE_PENDING_REQUESTS)
                        .slice((pendingPage - 1) * rowsPerPage, pendingPage * rowsPerPage)
                        .map((request) => (
                          <tr key={request.id} className="hover:bg-slate-50/60">
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900">{request.employeeName}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{request.employeeEmail}</td>
                            <td>
                              <span className="badge badge-dim badge-outline-primary">
                                {request.leaveType}
                              </span>
                            </td>
                            <td>
                              {formatDate(request.startDate)} - {formatDate(request.endDate)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{request.days}</td>
                            <td>
                              <span className="badge badge-warning">
                                Pending
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{formatDate(request.submittedAt)}</td>
                            <td>
                              <div className="d-flex gap-2 whitespace-nowrap px-4 py-3">
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
                  </div>
                  
                  {/* Pagination Controls */}
                  {(pendingRequests.length ? pendingRequests : SAMPLE_PENDING_REQUESTS).length > rowsPerPage && (
                    <div className="pagination-wrappe flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="pagination-info text-sm text-slate-600">
                        Showing {((pendingPage - 1) * rowsPerPage) + 1} to {Math.min(pendingPage * rowsPerPage, (pendingRequests.length ? pendingRequests : SAMPLE_PENDING_REQUESTS).length)} of {(pendingRequests.length ? pendingRequests : SAMPLE_PENDING_REQUESTS).length} entries
                      </div>
                      <div className="pagination-controls flex items-center justify-end gap-3">
                        <button
                          className="pagination-btn inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                          onClick={() => setPendingPage(prev => Math.max(1, prev - 1))}
                          disabled={pendingPage === 1}
                          title="Previous Page"
                        >
                          <i className="fas fa-chevron-left"></i>
                        </button>
                        <div className="pagination-pages flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                          <span className="current-page font-semibold text-slate-900">{pendingPage}</span>
                          <span className="page-separator text-slate-400">/</span>
                          <span className="total-pages text-slate-600">{Math.ceil((pendingRequests.length ? pendingRequests : SAMPLE_PENDING_REQUESTS).length / rowsPerPage)}</span>
                        </div>
                        <button
                          className="pagination-btn inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                          onClick={() => setPendingPage(prev => Math.min(Math.ceil((pendingRequests.length ? pendingRequests : SAMPLE_PENDING_REQUESTS).length / rowsPerPage), prev + 1))}
                          disabled={pendingPage >= Math.ceil((pendingRequests.length ? pendingRequests : SAMPLE_PENDING_REQUESTS).length / rowsPerPage)}
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
            <div className="leave-requests-table overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="mx-auto w-full overflow-x-auto">
              <table className="table table-bordered mb-0 w-full">
                <thead className="sticky top-0 z-10 bg-slate-50/70">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Employee</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Employee Email</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Leave Type</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Dates</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Days</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Status</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(allRequests.length ? allRequests : SAMPLE_ALL_REQUESTS)
                    .slice((allRequestsPage - 1) * rowsPerPage, allRequestsPage * rowsPerPage)
                    .map((request) => (
                      <tr key={request.id} className="hover:bg-slate-50/60">
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900">{request.employeeName}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{request.employeeEmail}</td>
                        <td>
                          <span className="badge badge-dim badge-outline-primary">
                            {request.leaveType}
                          </span>
                        </td>
                        <td>
                          {formatDate(request.startDate)} - {formatDate(request.endDate)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{request.totalDays || request.days}</td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{formatDate(request.submittedOn || request.submittedAt)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              </div>
              
              {/* Pagination Controls */}
              {(allRequests.length ? allRequests : SAMPLE_ALL_REQUESTS).length > rowsPerPage && (
                <div className="pagination-wrapper flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="pagination-info text-sm text-slate-600">
                    Showing {((allRequestsPage - 1) * rowsPerPage) + 1} to {Math.min(allRequestsPage * rowsPerPage, (allRequests.length ? allRequests : SAMPLE_ALL_REQUESTS).length)} of {(allRequests.length ? allRequests : SAMPLE_ALL_REQUESTS).length} entries
                  </div>
                  <div className="pagination-controls flex items-center justify-end gap-3">
                    <button
                      className="pagination-btn inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                      onClick={() => setAllRequestsPage(prev => Math.max(1, prev - 1))}
                      disabled={allRequestsPage === 1}
                      title="Previous Page"
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    <div className="pagination-pages flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                      <span className="current-page font-semibold text-slate-900">{allRequestsPage}</span>
                      <span className="page-separator text-slate-400">/</span>
                      <span className="total-pages text-slate-600">{Math.ceil((allRequests.length ? allRequests : SAMPLE_ALL_REQUESTS).length / rowsPerPage)}</span>
                    </div>
                    <button
                      className="pagination-btn inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                      onClick={() => setAllRequestsPage(prev => Math.min(Math.ceil((allRequests.length ? allRequests : SAMPLE_ALL_REQUESTS).length / rowsPerPage), prev + 1))}
                      disabled={allRequestsPage >= Math.ceil((allRequests.length ? allRequests : SAMPLE_ALL_REQUESTS).length / rowsPerPage)}
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

       {showRejectModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
    <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
        <h5 className="text-base font-semibold text-slate-900">
          Reject Leave Request
        </h5>
        <button
          onClick={closeRejectModal}
          className="text-xl leading-none text-slate-400 hover:text-slate-600"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div className="space-y-4 px-5 py-4">
        <p className="text-sm text-slate-700">
          You are about to reject the leave request from{" "}
          <strong>{selectedRequest?.employeeName}</strong>.
        </p>

        <textarea
          className="
            w-full rounded-lg border border-slate-300
            px-3 py-2 text-sm text-slate-900
            focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200
          "
          rows={4}
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Please provide a reason for rejection..."
        />
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
        <button
          onClick={closeRejectModal}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={handleReject}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Reject Request
        </button>
      </div>

    </div>
  </div>
)}

      </div>
    </div>
  );
};

export default LeaveApprovals;
