'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { API_BASE } from '@/config/api';
import { decryptApiResponse } from '@/utils/encryption';
import LeaveApprovals from './LeaveApprovals';
import { validateWeekdays } from '@/utils/validations';
import "./LeaveManagement.css";
import "../common/Pagination.css";

const LeaveManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const userRole = user?.role || "employee";
  const isApprover = userRole === "admin" || userRole === "manager" || userRole === "hr";
  const isAdmin = userRole === "admin";
  const isOwner = isAdmin; // Owners are admins who don't need personal leave balance
  
  // Hydration fix: Track if component is mounted on client
  const [isMounted, setIsMounted] = useState(false);
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

  // Combined requests for display and validation
  const allRequests = [...leaveData.history, ...leaveData.pending];

  const fetchLeaveData = useCallback(async () => {
    try {
      setLoading(true);

      if (!user?.id || !user?.tenantId) {
        console.warn('⚠️ Leave Management: Missing user ID or tenant ID', { userId: user?.id, tenantId: user?.tenantId });
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching leave data for:', { userId: user.id, tenantId: user.tenantId });

      // Fetch leave balance
      const balanceResponse = await fetch(
        `${API_BASE}/api/leave-management/balance?employeeId=${user.id}&tenantId=${user.tenantId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Fetch leave history
      const historyResponse = await fetch(
        `${API_BASE}/api/leave-management/history?employeeId=${user.id}&tenantId=${user.tenantId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Fetch pending requests
      const pendingResponse = await fetch(
        `${API_BASE}/api/leave-management/my-requests?employeeId=${user.id}&tenantId=${user.tenantId}&status=pending`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!balanceResponse.ok) {
        console.error('❌ Balance API error:', balanceResponse.status, balanceResponse.statusText);
        const errorText = await balanceResponse.text();
        console.error('❌ Balance error details:', errorText);
      }
      
      const rawBalanceData = balanceResponse.ok
        ? await balanceResponse.json()
        : { balance: {} };
      const rawHistoryData = historyResponse.ok
        ? await historyResponse.json()
        : { requests: [] };
      const rawPendingData = pendingResponse.ok
        ? await pendingResponse.json()
        : { requests: [] };

      console.log('📦 Raw balance data:', rawBalanceData);
      
      // Decrypt all responses
      const balanceData = decryptApiResponse(rawBalanceData);
      const historyData = decryptApiResponse(rawHistoryData);
      const pendingData = decryptApiResponse(rawPendingData);
      
      console.log('🔓 Decrypted balance data:', balanceData);
      console.log('🔓 Decrypted history data:', historyData);
      console.log('🔓 Decrypted pending data:', pendingData);
      console.log('📦 Balance object:', balanceData.balance);

      setLeaveData({
        balance: balanceData.balance || {},
        history: historyData.requests || [],
        pending: pendingData.requests || [],
      });
      
      console.log('✅ Leave data set:', {
        balanceKeys: Object.keys(balanceData.balance || {}),
        historyCount: historyData.requests?.length || 0,
        pendingCount: pendingData.requests?.length || 0
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
        `${API_BASE}/api/approvers?tenantId=${user.tenantId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const rawData = await response.json();
        const data = decryptApiResponse(rawData);
        console.log('📋 Fetched approvers:', data.approvers);
        setApprovers(data.approvers || []);
      } else {
        console.error('❌ Failed to fetch approvers:', response.status);
      }
    } catch (error) {
      console.error("❌ Error fetching approvers:", error);
    }
  }, [user?.tenantId]);

  // Hydration fix: Set mounted state on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch data only after component is mounted
  useEffect(() => {
    if (!isMounted) return;
    
    fetchLeaveData();
    fetchApprovers();
  }, [isMounted, fetchLeaveData, fetchApprovers]);

  // Auto-refresh when page becomes visible (e.g., after approving/rejecting leave)
  useEffect(() => {
    if (!isMounted) return;

    const handleVisibilityChange = () => {
      if (!document.hidden && user?.tenantId) {
        console.log('🔄 Leave Management: Page became visible, reloading data...');
        fetchLeaveData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isMounted, user?.tenantId, fetchLeaveData]);

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
    console.log("🚀 Form submitted!", formData);
    console.log("🔍 User:", user);
    console.log("🍞 Toast object:", toast);

    // Validate form
    if (!formData.startDate || !formData.endDate) {
      console.log("❌ Validation failed: Missing dates");
      toast.error("Please select start and end dates");
      return;
    }

    if (!formData.approverId) {
      console.log("❌ Validation failed: Missing approver");
      toast.error("Please select an approver");
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (end < start) {
      console.log("❌ Validation failed: End date before start date");
      toast.error("End date cannot be before start date");
      return;
    }

    // Validate weekdays using utility function
    const weekdayValidation = validateWeekdays(formData.startDate, formData.endDate);
    if (!weekdayValidation.isValid) {
      console.log("❌ Validation failed: Weekend dates not allowed");
      toast.error(weekdayValidation.message);
      return;
    }

    // Check for overlapping dates with existing requests
    const hasOverlap = allRequests.some(request => {
      if (request.status === 'cancelled') return false; // Skip cancelled requests
      
      const existingStart = new Date(request.startDate);
      const existingEnd = new Date(request.endDate);
      
      // Check if new request overlaps with existing request
      return (
        (start >= existingStart && start <= existingEnd) || // New start within existing
        (end >= existingStart && end <= existingEnd) ||     // New end within existing
        (start <= existingStart && end >= existingEnd)      // New request contains existing
      );
    });

    if (hasOverlap) {
      console.log("❌ Validation failed: Overlapping dates");
      toast.error("You already have a leave request for overlapping dates. Please choose different dates or cancel the existing request.");
      return;
    }

    console.log("✅ Validation passed, submitting...");
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
      const employeeName =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.name || "Employee";

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
        attachmentName: formData.attachment?.name || null,
      };

      console.log("📤 Submitting data:", submitData);
      console.log("🌐 API URL:", `${API_BASE}/api/leave-management/request`);

      // Submit to API
      const response = await fetch(`${API_BASE}/api/leave-management/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(submitData),
      });

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        const rawErrorData = await response.json();
        const errorData = decryptApiResponse(rawErrorData);
        console.log("❌ Error response:", errorData);
        
        // Handle specific error cases
        if (response.status === 409 && errorData.overlappingRequest) {
          const overlap = errorData.overlappingRequest;
          toast.error(`You already have a ${overlap.status} leave request for ${overlap.startDate} to ${overlap.endDate}. Please choose different dates.`);
        } else {
          toast.error(errorData.error || "Failed to submit leave request");
        }
        
        throw new Error(errorData.error || "Failed to submit leave request");
      }

      const rawResult = await response.json();
      const result = decryptApiResponse(rawResult);
      console.log("✅ Success response:", result);

      // Show success toast first
      toast.success("Leave request submitted successfully");

      // Refresh leave data to update balance and tables
      console.log("🔄 Refreshing leave data...");
      await fetchLeaveData();
      console.log("✅ Leave data refreshed");

      // Reset form
      setFormData({
        leaveType: "",
        startDate: "",
        endDate: "",
        reason: "",
        attachment: null,
        approverId: "",
      });

      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error("❌ Error submitting leave request:", error);
      console.log("🔴 Showing error toast");
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
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            employeeId: user.id,
            tenantId: user.tenantId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel leave request");
      }

      // Refresh leave data after successful cancellation
      await fetchLeaveData();
      toast.success("Leave request cancelled successfully");
    } catch (error) {
      console.error("Error cancelling leave request:", error);
      toast.error("Failed to cancel leave request");
    }
  };

  // Prevent hydration mismatch - don't render until mounted
  if (!isMounted || loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--dashboard-bg)',
          padding: 24,
          color: 'var(--dashboard-text-color)',
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          transition: 'background-color 0.3s ease, color 0.3s ease',
        }}
        className="w-full"
      >
        <div className="max-w-7xl mx-auto">
          <div
            className="
              mb-6
              rounded-3xl
              bg-[#7cbdf2]
              dark:bg-gradient-to-br dark:from-[#0f1a25] dark:via-[#121f33] dark:to-[#162a45]
              shadow-sm dark:shadow-[0_8px_24px_rgba(0,0,0,0.6)]
              backdrop-blur-md
              border border-transparent dark:border-white/5
            "
          >
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-center">
                <div className="relative pl-5">
                  <span className="absolute left-0 top-2 h-10 w-1 rounded-full bg-purple-900 dark:bg-indigo-400" />
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
                    Leave Management
                  </h1>
                  <p className="mt-0 text-sm text-white/80 dark:text-slate-300">
                    Apply for leave and track your requests
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200/60 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="px-6 py-8 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-200">
                <span className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Loading leave data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--dashboard-bg)',
        padding: 24,
        color: 'var(--dashboard-text-color)',
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
      className="w-full"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <div
          className="
            rounded-3xl
            bg-[#7cbdf2]
            dark:bg-gradient-to-br dark:from-[#0f1a25] dark:via-[#121f33] dark:to-[#162a45]
            shadow-sm dark:shadow-[0_8px_24px_rgba(0,0,0,0.6)]
            backdrop-blur-md
            border border-transparent dark:border-white/5
          "
        >
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="relative pl-5">
                <span className="absolute left-0 top-2 h-10 w-1 rounded-full bg-purple-900 dark:bg-indigo-400" />
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
                  Leave Management
                </h1>
                <p className="mt-0 text-sm text-white/80 dark:text-slate-300">
                  Apply for leave and track your requests
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Employee Sections - Only show for non-owners */}
          {!isOwner && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

{/* Request Leave Form */}
              <div className="lg:col-span-7">
                <div className="rounded-2xl border border-slate-200/60 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <div className="px-6 py-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h6 className="text-sm font-semibold">Request Leave</h6>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                          Submit a leave request for approval
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-4 d-flex flex-column flex-grow-1">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <div className="form-group">
                            <label className="form-label">Leave Type</label>
                            <select
                              className="form-select rounded-lg"
                              name="leaveType"
                              value={formData.leaveType}
                              onChange={handleInputChange}
                              required
                            >
                              <option value="" disabled>
                                Select Leave Type
                              </option>
                              <option value="vacation">Vacation</option>
                              <option value="sick">Sick Leave</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <div className="form-group">
                            <label className="form-label">Start Date</label>
                            <input
                              type="date"
                              className="form-control rounded-lg"
                              name="startDate"
                              value={formData.startDate}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <div className="form-group">
                            <label className="form-label">End Date</label>
                            <input
                              type="date"
                              className="form-control rounded-lg"
                              name="endDate"
                              value={formData.endDate}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>
                            {/* {allRequests.length > 0 && (
                              <div className="col-12">
                                <div className="form-note">
                                  <strong>Existing Leave Requests:</strong>
                                  <ul className="mt-2 mb-0">
                                    {allRequests
                                      .filter(req => req.status !== 'cancelled')
                                      .map((req, index) => (
                                        <li key={index} className="small">
                                          <span className={`badge badge-${req.status === 'approved' ? 'success' : req.status === 'pending' ? 'warning' : 'secondary'} me-2`}>
                                            {req.status}
                                          </span>
                                          {req.leaveType} - {req.startDate} to {req.endDate}
                                        </li>
                                      ))}
                                  </ul>
                                </div>
                              </div>
                            )} */}
                        <div className="md:col-span-2">
                          <div className="form-group">
                            <label className="form-label">Approver *</label>
                            <select
                              className="form-select rounded-lg"
                              name="approverId"
                              value={formData.approverId}
                              onChange={handleInputChange}
                              required
                            >
                              <option value="">Select Approver</option>
                              {approvers.length === 0 ? (
                                <option value="" disabled>No approvers available</option>
                              ) : (
                                approvers.map((approver) => (
                                  <option
                                    key={approver.id}
                                    value={approver.id}
                                  >
                                    {approver.name} ({approver.role === 'admin' ? 'Admin' : approver.role === 'manager' ? 'Manager' : approver.role === 'hr' ? 'HR' : 'Approver'})
                                  </option>
                                ))
                              )}
                            </select>
                            {approvers.length === 0 && (
                              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                                <small>No approvers found. Please contact your administrator.</small>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <div className="form-group">
                            <label className="form-label">Reason</label>
                            <textarea
                              className="form-control rounded-lg"
                              name="reason"
                              value={formData.reason}
                              onChange={handleInputChange}
                              rows="2"
                            ></textarea>
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <div className="form-group">
                            <label className="form-label">
                              Attachment (optional)
                            </label>
                            <div className="form-control-wrap">
                              <input
                                type="file"
                                className="form-control rounded-lg"
                                onChange={handleFileChange}
                              />
                            </div>
                            <div className="form-note">
                              Upload any supporting documents (e.g., medical
                              certificate)
                            </div>
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <button
                            type="submit"
                            className="btn btn-outline !bg-sky-700 !text-white w-100 sm:w-auto"
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

              {/* Leave Balance */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-slate-200/60 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <div className="px-6 py-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h6 className="text-sm font-semibold">Leave Balance</h6>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                          Your available leave balance
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 leave-balance-vertical">
                      {Object.keys(leaveData.balance).length > 0 ? (
                        <>
                          {/* Calculate totals from database */}
                          {(() => {
                            const vacationData = leaveData.balance
                              .vacation || {
                              total: 0,
                              used: 0,
                              pending: 0,
                              remaining: 0,
                            };
                            const sickData = leaveData.balance.sick || {
                              total: 0,
                              used: 0,
                              pending: 0,
                              remaining: 0,
                            };
                            const totalDays =
                              vacationData.total + sickData.total;
                            const totalUsed =
                              vacationData.used + sickData.used;
                            const totalPending =
                              vacationData.pending + sickData.pending;
                            const totalRemaining =
                              vacationData.remaining + sickData.remaining;

                            return (
                              <>
                                {/* Total Leave Card */}
                                <div className="leave-card-modern total-card mb-3">
                                  <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div className="flex-grow-1">
                                      <h6 className="mb-1 fw-bold text-dark" style={{ fontSize: "14px" }}>
                                        <i className="fas fa-calendar-check text-success me-2"></i>
                                        Total Leaves
                                      </h6>
                                      <p
                                        className="text-muted mb-0"
                                        style={{ fontSize: "11.5px" }}
                                      >
                                        {Math.round(totalRemaining)} of{" "}
                                        {totalDays} days remaining
                                      </p>
                                    </div>
                                    {/* <div className="leave-badge-modern total-badge">
                                        {Math.round(totalRemaining)}
                                      </div> */}
                                  </div>
                                  <div className="progress">
                                    <div
                                      className="progress-bar bg-success"
                                      style={{
                                        width: `${
                                          (totalUsed / totalDays) * 100
                                        }%`,
                                      }}
                                    ></div>
                                    {/* <div
                                      className="progress-bar bg-warning"
                                      style={{
                                        width: `${
                                          (totalPending / totalDays) * 100
                                        }%`,
                                      }}
                                    ></div> */}
                                  </div>
                                  <div className="d-flex justify-content-between mt-2" style={{ fontSize: "10.5px" }}>
                                    <small className="text-muted">
                                      <span className="text-success fw-semibold">
                                        {Math.round(totalUsed)}
                                      </span>{" "}
                                      used
                                    </small>
                                    <small className="text-muted">
                                      Total: {totalDays} days
                                    </small>
                                  </div>
                                </div>

                                {/* Vacation Leave Card */}
                                {leaveData.balance.vacation && (
                                  <div className="leave-card-modern vacation-card mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                      <div className="flex-grow-1">
                                        <h6 className="mb-1 fw-bold text-dark" style={{ fontSize: "14px" }}>
                                          <i className="fas fa-plane text-primary me-2"></i>
                                          Vacation
                                        </h6>
                                        <p
                                          className="text-muted mb-0"
                                          style={{ fontSize: "11.5px" }}
                                        >
                                          {Math.round(
                                            vacationData.remaining
                                          )}{" "}
                                          of {vacationData.total} days
                                          remaining
                                        </p>
                                      </div>
                                      {/* <div className="leave-badge-modern vacation-badge">
                                          {Math.round(vacationData.remaining)}
                                        </div> */}
                                    </div>
                                    <div className="progress">
                                      <div
                                        className="progress-bar bg-primary"
                                        style={{
                                          width: `${
                                            (vacationData.used /
                                              vacationData.total) *
                                            100
                                          }%`,
                                        }}
                                      ></div>
                                      {/* <div
                                        className="progress-bar bg-warning"
                                        style={{
                                          width: `${
                                            (vacationData.pending /
                                              vacationData.total) *
                                            100
                                          }%`,
                                        }}
                                      ></div> */}
                                    </div>
                                    <div className="d-flex justify-content-between mt-2" style={{ fontSize: "10.5px" }}>
                                      <small className="text-muted">
                                        <span className="text-primary fw-semibold">
                                          {Math.round(vacationData.used)}
                                        </span>{" "}
                                        used
                                      </small>
                                      <small className="text-muted">
                                        Total: {vacationData.total} days
                                      </small>
                                    </div>
                                  </div>
                                )}

                                {/* Sick Leave Card */}
                                {leaveData.balance.sick && (
                                  <div className="leave-card-modern sick-card mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                      <div className="flex-grow-1">
                                        <h6 className="mb-1 fw-bold text-dark" style={{ fontSize: "14px" }}>
                                          <i className="fas fa-heartbeat text-danger me-2"></i>
                                          Sick Leave
                                        </h6>
                                        <p
                                          className="text-muted mb-0"
                                          style={{ fontSize: "11.5px" }}
                                        >
                                          {Math.round(sickData.remaining)}{" "}
                                          of {sickData.total} days remaining
                                        </p>
                                      </div>
                                      {/* <div className="leave-badge-modern sick-badge">
                                          {Math.round(sickData.remaining)}
                                        </div> */}
                                    </div>
                                    <div className="progress">
                                      <div
                                        className="progress-bar bg-danger"
                                        style={{
                                          width: `${
                                            (sickData.used /
                                              sickData.total) *
                                            100
                                          }%`,
                                        }}
                                      ></div>
                                      {/* <div
                                        className="progress-bar bg-warning"
                                        style={{
                                          width: `${
                                            (sickData.pending /
                                              sickData.total) *
                                            100
                                          }%`,
                                        }}
                                      ></div> */}
                                    </div>
                                    <div className="d-flex justify-content-between mt-2" style={{ fontSize: "10.5px" }}>
                                      <small className="text-muted">
                                        <span className="text-danger fw-semibold">
                                          {Math.round(sickData.used)}
                                        </span>{" "}
                                        used
                                      </small>
                                      <small className="text-muted">
                                        Total: {sickData.total} days
                                      </small>
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </>
                      ) : (
                        <div className="rounded-xl border border-slate-200/60 bg-white/40 px-5 py-8 text-center dark:border-white/10 dark:bg-white/5">
                          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-200">
                            <i className="fas fa-layer-group"></i>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            No leave balance data available
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              
            </div>
          )}

          {/* Leave Approvals Section (for Approvers and Admins) */}
          {isApprover && (
            <div className="rounded-2xl border border-slate-200/60 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="px-6 py-5">
                <LeaveApprovals />
              </div>
            </div>
          )}

          {/* Pending Requests - Only show for non-owners */}
          {!isOwner && (
            <div className="rounded-2xl border border-slate-200/60 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="px-6 py-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h6 className="text-sm font-semibold">Pending Requests</h6>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      Requests awaiting approval
                    </p>
                  </div>
                </div>

                {leaveData.pending.length > 0 ? (
                  <>
                    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200/60 dark:border-white/10">
                      <div className="leave-requests-table">
                        <table className="table table-bordered mb-0">
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
                              .slice(
                                (pendingPage - 1) * rowsPerPage,
                                pendingPage * rowsPerPage
                              )
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
                    </div>

                    {/* Pagination Controls */}
                    {leaveData.pending.length > rowsPerPage && (
                      <div className="pagination-wrapper mt-4">
                        <div className="pagination-info">
                          Showing{" "}
                          {(pendingPage - 1) * rowsPerPage + 1} to{" "}
                          {Math.min(
                            pendingPage * rowsPerPage,
                            leaveData.pending.length
                          )}{" "}
                          of {leaveData.pending.length} entries
                        </div>
                        <div className="pagination-controls">
                          <button
                            className="pagination-btn"
                            onClick={() =>
                              setPendingPage((prev) =>
                                Math.max(1, prev - 1)
                              )
                            }
                            disabled={pendingPage === 1}
                            title="Previous Page"
                          >
                            <i className="fas fa-chevron-left"></i>
                          </button>
                          <div className="pagination-pages">
                            <span className="current-page">
                              {pendingPage}
                            </span>
                            <span className="page-separator">/</span>
                            <span className="total-pages">
                              {Math.ceil(
                                leaveData.pending.length / rowsPerPage
                              )}
                            </span>
                          </div>
                          <button
                            className="pagination-btn"
                            onClick={() =>
                              setPendingPage((prev) =>
                                Math.min(
                                  Math.ceil(
                                    leaveData.pending.length /
                                      rowsPerPage
                                  ),
                                  prev + 1
                                )
                              )
                            }
                            disabled={
                              pendingPage >=
                              Math.ceil(
                                leaveData.pending.length / rowsPerPage
                              )
                            }
                            title="Next Page"
                          >
                            <i className="fas fa-chevron-right"></i>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-4 rounded-xl border border-slate-200/60 bg-white/40 px-5 py-10 text-center dark:border-white/10 dark:bg-white/5">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-200">
                      <i className="fas fa-hourglass-half"></i>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">No pending leave requests</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Leave History - Only show for non-owners */}
          {!isOwner && (
            <div className="rounded-2xl border border-slate-200/60 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="px-6 py-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h6 className="text-sm font-semibold">Leave History</h6>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      Your past leave requests
                    </p>
                  </div>
                </div>

                {leaveData.history.length > 0 ? (
                  <>
                    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200/60 dark:border-white/10">
                      <div className="leave-requests-table">
                        <table className="table table-bordered mb-0">
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
                              .slice(
                                (historyPage - 1) * rowsPerPage,
                                historyPage * rowsPerPage
                              )
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
                                    <span
                                      className={`badge ${
                                        request.status === "Approved"
                                          ? "badge-success"
                                          : "badge-danger"
                                      }`}
                                    >
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
                    </div>

                    {/* Pagination Controls */}
                    {leaveData.history.length > rowsPerPage && (
                      <div className="pagination-wrapper mt-4">
                        <div className="pagination-info">
                          Showing{" "}
                          {(historyPage - 1) * rowsPerPage + 1} to{" "}
                          {Math.min(
                            historyPage * rowsPerPage,
                            leaveData.history.length
                          )}{" "}
                          of {leaveData.history.length} entries
                        </div>
                        <div className="pagination-controls">
                          <button
                            className="pagination-btn"
                            onClick={() =>
                              setHistoryPage((prev) =>
                                Math.max(1, prev - 1)
                              )
                            }
                            disabled={historyPage === 1}
                            title="Previous Page"
                          >
                            <i className="fas fa-chevron-left"></i>
                          </button>
                          <div className="pagination-pages">
                            <span className="current-page">
                              {historyPage}
                            </span>
                            <span className="page-separator">/</span>
                            <span className="total-pages">
                              {Math.ceil(
                                leaveData.history.length / rowsPerPage
                              )}
                            </span>
                          </div>
                          <button
                            className="pagination-btn"
                            onClick={() =>
                              setHistoryPage((prev) =>
                                Math.min(
                                  Math.ceil(
                                    leaveData.history.length /
                                      rowsPerPage
                                  ),
                                  prev + 1
                                )
                              )
                            }
                            disabled={
                              historyPage >=
                              Math.ceil(
                                leaveData.history.length / rowsPerPage
                              )
                            }
                            title="Next Page"
                          >
                            <i className="fas fa-chevron-right"></i>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-4 rounded-xl border border-slate-200/60 bg-white/40 px-5 py-10 text-center dark:border-white/10 dark:bg-white/5">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-200">
                      <i className="fas fa-clipboard-list"></i>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">No leave history</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;
