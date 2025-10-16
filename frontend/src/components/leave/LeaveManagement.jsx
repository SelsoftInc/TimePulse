import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { API_BASE } from "../../config/api";
import LeaveApprovals from "./LeaveApprovals";
import "./LeaveManagement.css";

const LeaveManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const userRole = user?.role || "employee";
  const isApprover = userRole === "approver" || userRole === "admin";
  const isAdmin = userRole === "admin";
  const isOwner = isAdmin; // Owners are admins who don't need personal leave balance
  const [loading, setLoading] = useState(true);
  const [leaveData, setLeaveData] = useState({
    balance: {},
    history: [],
    pending: [],
  });
  const [formData, setFormData] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
    attachment: null,
    approverId: "",
  });
  const [approvers, setApprovers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  
  // Pagination states
  const [pendingPage, setPendingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const rowsPerPage = 5;

  const fetchLeaveData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user?.id || !user?.tenantId) {
        setLoading(false);
        return;
      }

      // Fetch leave balance
      const balanceResponse = await fetch(
        `${API_BASE}/api/leave-management/balance?employeeId=${user.id}&tenantId=${user.tenantId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Fetch leave history
      const historyResponse = await fetch(
        `${API_BASE}/api/leave-management/history?employeeId=${user.id}&tenantId=${user.tenantId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Fetch pending requests
      const pendingResponse = await fetch(
        `${API_BASE}/api/leave-management/my-requests?employeeId=${user.id}&tenantId=${user.tenantId}&status=pending`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      const balanceData = balanceResponse.ok ? await balanceResponse.json() : { balance: {} };
      const historyData = historyResponse.ok ? await historyResponse.json() : { requests: [] };
      const pendingData = pendingResponse.ok ? await pendingResponse.json() : { requests: [] };
      
      setLeaveData({
        balance: balanceData.balance || {},
        history: historyData.requests || [],
        pending: pendingData.requests || []
      });
    } catch (error) {
      console.error("Error fetching leave data:", error);
      toast.error("Failed to load leave data");
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.tenantId, toast]);

  const fetchApprovers = useCallback(async () => {
    try {
      if (!user?.tenantId) return;
      
      const response = await fetch(
        `${API_BASE}/api/users?tenantId=${user.tenantId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        // Filter only admin users
        const adminUsers = (data.users || []).filter(u => u.role === 'admin');
        setApprovers(adminUsers);
      }
    } catch (error) {
      console.error('Error fetching approvers:', error);
    }
  }, [user?.tenantId]);

  useEffect(() => {
    fetchLeaveData();
    fetchApprovers();
  }, [fetchLeaveData, fetchApprovers]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      attachment: e.target.files[0],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🚀 Form submitted!', formData);
    console.log('🔍 User:', user);
    console.log('🍞 Toast object:', toast);

    // Validate form
    if (!formData.startDate || !formData.endDate) {
      console.log('❌ Validation failed: Missing dates');
      toast.error("Please select start and end dates");
      return;
    }

    if (!formData.approverId) {
      console.log('❌ Validation failed: Missing approver');
      toast.error("Please select an approver");
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (end < start) {
      console.log('❌ Validation failed: End date before start date');
      toast.error("End date cannot be before start date");
      return;
    }

    console.log('✅ Validation passed, submitting...');
    setSubmitting(true);

    try {
      // Calculate days (excluding weekends)
      let days = 0;
      let currentDate = new Date(start);
      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          days++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Prepare form data for submission
      // Handle both cases: when user has firstName/lastName or just name
      const employeeName = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`
        : user.name || 'Employee';
      
      const submitData = {
        employeeId: user.id,
        employeeName: employeeName,
        tenantId: user.tenantId,
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalDays: days,
        reason: formData.reason,
        approverId: formData.approverId,
        attachmentName: formData.attachment?.name || null
      };

      console.log('📤 Submitting data:', submitData);
      console.log('🌐 API URL:', `${API_BASE}/api/leave-management/request`);

      // Submit to API
      const response = await fetch(`${API_BASE}/api/leave-management/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submitData)
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ Error response:', errorData);
        throw new Error(errorData.error || 'Failed to submit leave request');
      }

      const result = await response.json();
      console.log('✅ Success response:', result);

      // Refresh leave data
      await fetchLeaveData();

      // Reset form
      setFormData({
        leaveType: "",
        startDate: "",
        endDate: "",
        reason: "",
        attachment: null,
        approverId: "",
      });

      console.log('🎉 Showing success toast');
      toast.success("Leave request submitted successfully");
    } catch (error) {
      console.error("❌ Error submitting leave request:", error);
      console.log('🔴 Showing error toast');
      toast.error(error.message || "Failed to submit leave request");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelRequest = async (id) => {
    try {
      // Call API to delete the leave request
      const response = await fetch(
        `${API_BASE}/api/leave-management/cancel/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            employeeId: user.id,
            tenantId: user.tenantId
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to cancel leave request');
      }

      // Refresh leave data after successful cancellation
      await fetchLeaveData();
      toast.success('Leave request cancelled successfully');

      // Find the request for balance update
      const request = leaveData.pending.find((req) => req.id === id);

      if (!request) return;

      // Update state
      setLeaveData((prev) => ({
        ...prev,
        pending: prev.pending.filter((req) => req.id !== id),
        balance: {
          ...prev.balance,
          [request.type.toLowerCase()]: {
            ...prev.balance[request.type.toLowerCase()],
            pending:
              prev.balance[request.type.toLowerCase()].pending - request.days,
            remaining:
              prev.balance[request.type.toLowerCase()].remaining + request.days,
          },
        },
      }));

      toast.success("Leave request cancelled successfully");
    } catch (error) {
      console.error("Error cancelling leave request:", error);
      toast.error("Failed to cancel leave request");
    }
  };

  if (loading) {
    return (
      <div className="nk-content">
        <div className="container-fluid">
          <div className="nk-content-inner">
            <div className="nk-content-body">
              <div className="nk-block">
                <div className="text-center p-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3">Loading leave data...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nk-conten">
      <div className="container-fluid">
        <div className="nk-content-inne">
          <div className="nk-content-body">
            <div className="nk-block-head nk-block-head-sm">
              <div className="nk-block-between">
                <div className="nk-block-head-content">
                  <h3 className="nk-block-title page-title">
                    Leave Management
                  </h3>
                  {/* <div className="nk-block-des text-soft">
                    <p>Welcome {userFullName}, {isOwner ? 'review and approve leave requests from your team' : 'request and manage your leave and absences'}</p>
                  </div> */}
                </div>
              </div>
            </div>

            <div className="nk-block">
              {/* Employee Sections - Only show for non-owners */}
              {!isOwner && (
                <div className="row mb-4 leave-cards-row">
                  {/* Leave Balance */}
                  <div className="col-lg-5 col-md-12">
                    <div className="card card-bordered h-100">
                        <div className="card-inne">
                          <div className="card-title-group align-start mb-4">
                            <div className="card-title">
                              <h6 className="title">Leave Balance</h6>
                            </div>
                          </div>

                          <div className="leave-balance-vertical">
                            {Object.keys(leaveData.balance).length > 0 ? (
                              <>
                                {/* Calculate totals from database */}
                                {(() => {
                                  const vacationData = leaveData.balance.vacation || { total: 0, used: 0, pending: 0, remaining: 0 };
                                  const sickData = leaveData.balance.sick || { total: 0, used: 0, pending: 0, remaining: 0 };
                                  const totalDays = vacationData.total + sickData.total;
                                  const totalUsed = vacationData.used + sickData.used;
                                  const totalPending = vacationData.pending + sickData.pending;
                                  const totalRemaining = vacationData.remaining + sickData.remaining;

                                  return (
                                    <>
                                      {/* Total Leave Card */}
                                      <div className="leave-card-modern total-card mb-3">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                          <div className="flex-grow-1">
                                            <h6 className="mb-1 fw-bold text-dark">Total Leaves</h6>
                                            <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
                                              {Math.round(totalRemaining)} of {totalDays} days remaining
                                            </p>
                                          </div>
                                          {/* <div className="leave-badge-modern total-badge">
                                            {Math.round(totalRemaining)}
                                          </div> */}
                                        </div>
                                        <div className="progress" style={{ height: '10px', borderRadius: '5px', backgroundColor: '#e9ecef' }}>
                                          <div className="progress-bar bg-success" style={{ width: `${(totalUsed / totalDays) * 100}%` }}></div>
                                          <div className="progress-bar bg-warning" style={{ width: `${(totalPending / totalDays) * 100}%` }}></div>
                                        </div>
                                        <div className="d-flex justify-content-between mt-2">
                                          <small className="text-muted">
                                            <span className="text-success fw-semibold">{Math.round(totalUsed)}</span> used
                                          </small>
                                          {totalPending > 0 && (
                                            <small className="text-warning fw-semibold">{Math.round(totalPending)} pending</small>
                                          )}
                                          <small className="text-muted">Total: {totalDays} days</small>
                                        </div>
                                      </div>

                                      {/* Vacation Leave Card */}
                                      {leaveData.balance.vacation && (
                                        <div className="leave-card-modern vacation-card mb-3">
                                          <div className="d-flex justify-content-between align-items-center mb-3">
                                            <div className="flex-grow-1">
                                              <h6 className="mb-1 fw-bold text-dark">
                                                <i className="fas fa-plane text-primary me-2"></i>Vacation
                                              </h6>
                                              <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
                                                {Math.round(vacationData.remaining)} of {vacationData.total} days remaining
                                              </p>
                                            </div>
                                            {/* <div className="leave-badge-modern vacation-badge">
                                              {Math.round(vacationData.remaining)}
                                            </div> */}
                                          </div>
                                          <div className="progress" style={{ height: '10px', borderRadius: '5px', backgroundColor: '#e9ecef' }}>
                                            <div className="progress-bar bg-primary" style={{ width: `${(vacationData.used / vacationData.total) * 100}%` }}></div>
                                            <div className="progress-bar bg-warning" style={{ width: `${(vacationData.pending / vacationData.total) * 100}%` }}></div>
                                          </div>
                                          <div className="d-flex justify-content-between mt-2">
                                            <small className="text-muted">
                                              <span className="text-primary fw-semibold">{Math.round(vacationData.used)}</span> used
                                            </small>
                                            {vacationData.pending > 0 && (
                                              <small className="text-warning fw-semibold">{Math.round(vacationData.pending)} pending</small>
                                            )}
                                            <small className="text-muted">Total: {vacationData.total} days</small>
                                          </div>
                                        </div>
                                      )}

                                      {/* Sick Leave Card */}
                                      {leaveData.balance.sick && (
                                        <div className="leave-card-modern sick-card mb-3">
                                          <div className="d-flex justify-content-between align-items-center mb-3">
                                            <div className="flex-grow-1">
                                              <h6 className="mb-1 fw-bold text-dark">
                                                <i className="fas fa-heartbeat text-danger me-2"></i>Sick Leave
                                              </h6>
                                              <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
                                                {Math.round(sickData.remaining)} of {sickData.total} days remaining
                                              </p>
                                            </div>
                                            {/* <div className="leave-badge-modern sick-badge">
                                              {Math.round(sickData.remaining)}
                                            </div> */}
                                          </div>
                                          <div className="progress" style={{ height: '10px', borderRadius: '5px', backgroundColor: '#e9ecef' }}>
                                            <div className="progress-bar bg-danger" style={{ width: `${(sickData.used / sickData.total) * 100}%` }}></div>
                                            <div className="progress-bar bg-warning" style={{ width: `${(sickData.pending / sickData.total) * 100}%` }}></div>
                                          </div>
                                          <div className="d-flex justify-content-between mt-2">
                                            <small className="text-muted">
                                              <span className="text-danger fw-semibold">{Math.round(sickData.used)}</span> used
                                            </small>
                                            {sickData.pending > 0 && (
                                              <small className="text-warning fw-semibold">{Math.round(sickData.pending)} pending</small>
                                            )}
                                            <small className="text-muted">Total: {sickData.total} days</small>
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </>
                            ) : (
                              <div className="text-center py-4">
                                <p className="text-muted">No leave balance data available</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                  {/* Request Leave Form */}
                  <div className="col-lg-7 col-md-12">
                    <div className="card card-bordered h-100">
                        <div className="card-inne">
                          <div className="card-title-group align-start mb-3">
                            <div className="card-title">
                              <h6 className="title">Request Leave</h6>
                            </div>
                          </div>

                          <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                              <div className="col-12">
                                <div className="form-group">
                                  <label className="form-label">
                                    Leave Type
                                  </label>
                                  <select
                                    className="form-select"
                                    name="leaveType"
                                    value={formData.leaveType}
                                    onChange={handleInputChange}
                                    required
                                  >
                                    <option value="" disabled>Select Leave Type</option>
                                    <option value="vacation">Vacation</option>
                                    <option value="sick">Sick Leave</option>
                                  </select>
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="form-group">
                                  <label className="form-label">
                                    Start Date
                                  </label>
                                  <input
                                    type="date"
                                    className="form-control"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleInputChange}
                                    required
                                  />
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="form-group">
                                  <label className="form-label">End Date</label>
                                  <input
                                    type="date"
                                    className="form-control"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleInputChange}
                                    required
                                  />
                                </div>
                              </div>
                              <div className="col-12">
                                <div className="form-group">
                                  <label className="form-label">Approver *</label>
                                  <select
                                    className="form-select"
                                    name="approverId"
                                    value={formData.approverId}
                                    onChange={handleInputChange}
                                    required
                                  >
                                    <option value="">Select Approver</option>
                                    {approvers.map(approver => (
                                      <option key={approver.id} value={approver.id}>
                                        {approver.name || approver.email}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div className="col-12">
                                <div className="form-group">
                                  <label className="form-label">Reason</label>
                                  <textarea
                                    className="form-control"
                                    name="reason"
                                    value={formData.reason}
                                    onChange={handleInputChange}
                                    rows="3"
                                  ></textarea>
                                </div>
                              </div>
                              <div className="col-12">
                                <div className="form-group">
                                  <label className="form-label">
                                    Attachment (optional)
                                  </label>
                                  <div className="form-control-wrap">
                                    <input
                                      type="file"
                                      className="form-control"
                                      onChange={handleFileChange}
                                    />
                                  </div>
                                  <div className="form-note">
                                    Upload any supporting documents (e.g.,
                                    medical certificate)
                                  </div>
                                </div>
                              </div>
                              <div className="col-12">
                                <button
                                  type="submit"
                                  className="btn btn-primary"
                                  disabled={submitting}
                                >
                                  {submitting ? (
                                    <>
                                      <span
                                        className="spinner-border spinner-border-sm me-1"
                                        role="status"
                                        aria-hidden="true"
                                      ></span>
                                      Submitting...
                                    </>
                                  ) : (
                                    "Submit Request"
                                  )}
                                </button>
                              </div>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              <div className="row g-gs">
                {/* Leave Approvals Section (for Approvers and Admins) */}
                {isApprover && (
                  <div className="col-12">
                    <LeaveApprovals />
                  </div>
                )}

                {/* Pending Requests - Only show for non-owners */}
                {!isOwner && (
                  <>
                    <div className="col-12">
                      <div className="card card-bordered">
                        <div className="card-inne">
                          <div className="card-title-group align-start mb-3">
                            <div className="card-title">
                              <h6 className="title">Pending Requests</h6>
                            </div>
                          </div>

                          {leaveData.pending.length > 0 ? (
                            <>
                              <div className="leave-requests-table">
                                <table className="table table-bordered">
                                  <thead>
                                    <tr>
                                      <th>TYPE</th>
                                      <th>START DATE</th>
                                      <th>END DATE</th>
                                      <th>DAYS</th>
                                      <th>STATUS</th>
                                      <th>REQUESTED ON</th>
                                      <th>ACTION</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {leaveData.pending
                                      .slice((pendingPage - 1) * rowsPerPage, pendingPage * rowsPerPage)
                                      .map((request) => (
                                        <tr key={request.id}>
                                          <td>
                                            <span className="badge badge-dim badge-outline-primary">
                                              {request.type}
                                            </span>
                                          </td>
                                          <td>{request.startDate}</td>
                                          <td>{request.endDate}</td>
                                          <td>{request.days}</td>
                                          <td>
                                            <span className="badge badge-warning">
                                              {request.status}
                                            </span>
                                          </td>
                                          <td>{request.requestedOn}</td>
                                          <td>
                                            <button
                                              className="btn btn-sm btn-danger"
                                              onClick={() =>
                                                cancelRequest(request.id)
                                              }
                                              title="Cancel Leave Request"
                                            >
                                              <i className="fas fa-times mr-1"></i>
                                              Cancel
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              </div>
                              
                              {/* Pagination Controls */}
                              {leaveData.pending.length > rowsPerPage && (
                                <div className="pagination-wrapper">
                                  <div className="pagination-info">
                                    Showing {((pendingPage - 1) * rowsPerPage) + 1} to {Math.min(pendingPage * rowsPerPage, leaveData.pending.length)} of {leaveData.pending.length} entries
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
                                      <span className="total-pages">{Math.ceil(leaveData.pending.length / rowsPerPage)}</span>
                                    </div>
                                    <button
                                      className="pagination-btn"
                                      onClick={() => setPendingPage(prev => Math.min(Math.ceil(leaveData.pending.length / rowsPerPage), prev + 1))}
                                      disabled={pendingPage >= Math.ceil(leaveData.pending.length / rowsPerPage)}
                                      title="Next Page"
                                    >
                                      <i className="fas fa-chevron-right"></i>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-center py-4">
                              <p>No pending leave requests</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Leave History - Only show for non-owners */}
                    <div className="col-12">
                      <div className="card card-bordered">
                        <div className="card-inne">
                          <div className="card-title-group align-start mb-3">
                            <div className="card-title">
                              <h6 className="title">Leave History</h6>
                            </div>
                          </div>

                          {leaveData.history.length > 0 ? (
                            <>
                              <div className="leave-requests-table">
                                <table className="table table-bordered">
                                  <thead>
                                    <tr>
                                      <th>TYPE</th>
                                      <th>START DATE</th>
                                      <th>END DATE</th>
                                      <th>DAYS</th>
                                      <th>STATUS</th>
                                      <th>APPROVED BY</th>
                                      <th>APPROVED ON</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {leaveData.history
                                      .slice((historyPage - 1) * rowsPerPage, historyPage * rowsPerPage)
                                      .map((request) => (
                                        <tr key={request.id}>
                                          <td>
                                            <span className="badge badge-dim badge-outline-primary">
                                              {request.type}
                                            </span>
                                          </td>
                                          <td>{request.startDate}</td>
                                          <td>{request.endDate}</td>
                                          <td>{request.days}</td>
                                          <td>
                                            <span className={`badge ${request.status === 'Approved' ? 'badge-success' : 'badge-danger'}`}>
                                              {request.status}
                                            </span>
                                          </td>
                                          <td>{request.approvedBy}</td>
                                          <td>{request.approvedOn}</td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              </div>
                              
                              {/* Pagination Controls */}
                              {leaveData.history.length > rowsPerPage && (
                                <div className="pagination-wrapper">
                                  <div className="pagination-info">
                                    Showing {((historyPage - 1) * rowsPerPage) + 1} to {Math.min(historyPage * rowsPerPage, leaveData.history.length)} of {leaveData.history.length} entries
                                  </div>
                                  <div className="pagination-controls">
                                    <button
                                      className="pagination-btn"
                                      onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                                      disabled={historyPage === 1}
                                      title="Previous Page"
                                    >
                                      <i className="fas fa-chevron-left"></i>
                                    </button>
                                    <div className="pagination-pages">
                                      <span className="current-page">{historyPage}</span>
                                      <span className="page-separator">/</span>
                                      <span className="total-pages">{Math.ceil(leaveData.history.length / rowsPerPage)}</span>
                                    </div>
                                    <button
                                      className="pagination-btn"
                                      onClick={() => setHistoryPage(prev => Math.min(Math.ceil(leaveData.history.length / rowsPerPage), prev + 1))}
                                      disabled={historyPage >= Math.ceil(leaveData.history.length / rowsPerPage)}
                                      title="Next Page"
                                    >
                                      <i className="fas fa-chevron-right"></i>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-center py-4">
                              <p>No leave history</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;
