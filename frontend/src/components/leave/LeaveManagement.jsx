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
    leaveType: "vacation",
    startDate: "",
    endDate: "",
    reason: "",
    attachment: null,
    approverId: "",
  });
  const [approvers, setApprovers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

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
      const submitData = {
        employeeId: user.id,
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
        leaveType: "vacation",
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
      // In a real app, send to API
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Find the request
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
                        <div className="card-inner">
                          <div className="card-title-group align-start mb-3">
                            <div className="card-title">
                              <h6 className="title">Leave Balance</h6>
                            </div>
                          </div>

                          <div className="leave-balance">
                            {Object.keys(leaveData.balance).length > 0 ? (
                              Object.entries(leaveData.balance).map(
                                ([type, data]) => (
                                  <div
                                    key={type}
                                    className="leave-balance-item mb-3"
                                  >
                                    <div className="leave-balance-title d-flex justify-content-between align-items-center mb-2">
                                      <h6 className="mb-0 text-capitalize">
                                        {type}
                                      </h6>
                                      <span className="badge badge-sm badge-dim badge-outline-primary">
                                        {data.remaining} Days Remaining
                                      </span>
                                    </div>
                                    <div className="progress" style={{ height: '10px' }}>
                                      <div
                                        className="progress-bar bg-primary"
                                        role="progressbar"
                                        style={{
                                          width: `${
                                            (data.used / data.total) * 100
                                          }%`,
                                        }}
                                        aria-valuenow={data.used}
                                        aria-valuemin="0"
                                        aria-valuemax={data.total}
                                      ></div>
                                      {data.pending > 0 && (
                                        <div
                                          className="progress-bar bg-warning"
                                          role="progressbar"
                                          style={{
                                            width: `${
                                              (data.pending / data.total) * 100
                                            }%`,
                                          }}
                                          aria-valuenow={data.pending}
                                          aria-valuemin="0"
                                          aria-valuemax={data.total}
                                        ></div>
                                      )}
                                    </div>
                                    <div className="d-flex justify-content-between mt-2">
                                      <small className="text-muted">{data.used} used</small>
                                      {data.pending > 0 && (
                                        <small className="text-warning">
                                          {data.pending} pending
                                        </small>
                                      )}
                                      <small className="text-muted">Total: {data.total}</small>
                                    </div>
                                  </div>
                                )
                              )
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
                        <div className="card-inner">
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
                        <div className="card-inner">
                          <div className="card-title-group align-start mb-3">
                            <div className="card-title">
                              <h6 className="title">Pending Requests</h6>
                            </div>
                          </div>

                          {leaveData.pending.length > 0 ? (
                            <div className="table-responsive">
                              <table className="table table-hover">
                                <thead>
                                  <tr>
                                    <th>Type</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Days</th>
                                    <th>Status</th>
                                    <th>Requested On</th>
                                    <th>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {leaveData.pending.map((request) => (
                                    <tr key={request.id}>
                                      <td>{request.type}</td>
                                      <td>{request.startDate}</td>
                                      <td>{request.endDate}</td>
                                      <td>{request.days}</td>
                                      <td>
                                        <span className="badge badge-dim badge-warning">
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
                                        >
                                          Cancel
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
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
                        <div className="card-inner">
                          <div className="card-title-group align-start mb-3">
                            <div className="card-title">
                              <h6 className="title">Leave History</h6>
                            </div>
                          </div>

                          {leaveData.history.length > 0 ? (
                            <div className="table-responsive">
                              <table className="table table-hover">
                                <thead>
                                  <tr>
                                    <th>Type</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Days</th>
                                    <th>Status</th>
                                    <th>Approved By</th>
                                    <th>Approved On</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {leaveData.history.map((request) => (
                                    <tr key={request.id}>
                                      <td>{request.type}</td>
                                      <td>{request.startDate}</td>
                                      <td>{request.endDate}</td>
                                      <td>{request.days}</td>
                                      <td>
                                        <span className="badge badge-dim badge-success">
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
