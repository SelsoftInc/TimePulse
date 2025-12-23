'use client';

import React, { useState, useEffect } from 'react';
import { PERMISSIONS } from '@/utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import axios from 'axios';
import { API_BASE } from '@/config/api';
// import { useTheme } from '@/contexts/ThemeContext';
import "./TimesheetSummary.css";
import "./TimesheetApproval.css";

const TimesheetApproval = () => {
  const { user, currentEmployer } = useAuth();
  const { toast } = useToast();

  // Hydration fix: Track if component is mounted on client
  const [isMounted, setIsMounted] = useState(false);

  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchBy, setSearchBy] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [approvedToday, setApprovedToday] = useState(0);
  const [rejectedToday, setRejectedToday] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // Hydration fix: Set mounted state on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loadPendingTimesheets = async () => {
    setLoading(true);
    try {
      console.log('🔍 User object:', user);
      console.log('🔍 Current Employer:', currentEmployer);
      
      // Try multiple sources for tenantId
      const tenantId = user?.tenantId || currentEmployer?.tenantId || currentEmployer?.id;
      console.log('🔍 Tenant ID:', tenantId);
      
      if (!tenantId) {
        console.error('❌ No tenant ID found');
        console.error('User data:', JSON.stringify(user, null, 2));
        console.error('Current Employer:', JSON.stringify(currentEmployer, null, 2));
        console.error('localStorage userInfo:', localStorage.getItem('userInfo'));
        console.error('localStorage currentEmployer:', localStorage.getItem('currentEmployer'));
        setLoading(false);
        return;
      }

      const userId = user?.id;
      const userRole = user?.role || currentEmployer?.role;
      
      console.log('📡 Fetching timesheets with params:', { 
        tenantId, 
        reviewerId: userRole === 'manager' ? userId : undefined,
        userRole 
      });

      // Load today's approval counts
      await loadTodaysCounts(tenantId);

      // Fetch pending timesheets from API
      const response = await axios.get(`${API_BASE}/api/timesheets/pending-approval`, {
        params: {
          tenantId,
          // If user is a manager, only show timesheets assigned to them
          reviewerId: userRole === 'manager' ? userId : undefined
        }
      });

      console.log('📥 API Response:', response.data);

      if (response.data.success) {
        const formattedTimesheets = response.data.timesheets.map(ts => {
          // Ensure attachments is always an array
          let attachments = [];
          if (ts.attachments) {
            if (typeof ts.attachments === 'string') {
              try {
                attachments = JSON.parse(ts.attachments);
              } catch (e) {
                console.error('Error parsing attachments:', e);
                attachments = [];
              }
            } else if (Array.isArray(ts.attachments)) {
              attachments = ts.attachments;
            }
          }

          // Parse overtimeDays if it's a string
          let overtimeDays = [];
          if (ts.overtimeDays) {
            if (typeof ts.overtimeDays === 'string') {
              try {
                overtimeDays = JSON.parse(ts.overtimeDays);
              } catch (e) {
                console.error('Error parsing overtimeDays:', e);
                overtimeDays = [];
              }
            } else if (Array.isArray(ts.overtimeDays)) {
              overtimeDays = ts.overtimeDays;
            }
          }

          return {
            ...ts,
            attachments: attachments,
            overtimeDays: overtimeDays,
            status: ts.status === 'submitted' ? 'Submitted for Approval' : ts.status
          };
        });
        setTimesheets(formattedTimesheets);
        
        // Update pending count based on actual pending timesheets
        const pendingTimesheets = formattedTimesheets.filter(
          t => t.status === 'Submitted for Approval'
        );
        setPendingCount(pendingTimesheets.length);
        console.log('📊 Pending timesheets count:', pendingTimesheets.length);
      } else {
        console.error('❌ API returned success: false');
        setTimesheets([]);
        setPendingCount(0);
      }
    } catch (error) {
      console.error("❌ Error loading timesheets:", error);
      console.error("Error details:", error.response?.data || error.message);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTodaysCounts = async (tenantId) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      console.log('📊 Loading today\'s counts for date:', todayStr);

      // Fetch approved timesheets for today
      const approvedResponse = await axios.get(`${API_BASE}/api/timesheets/approved-today`, {
        params: { tenantId, date: todayStr }
      });

      // Fetch rejected timesheets for today
      const rejectedResponse = await axios.get(`${API_BASE}/api/timesheets/rejected-today`, {
        params: { tenantId, date: todayStr }
      });

      console.log('✅ Approved count response:', approvedResponse.data);
      console.log('✅ Rejected count response:', rejectedResponse.data);

      if (approvedResponse.data.success) {
        const approvedCount = approvedResponse.data.count || 0;
        console.log('📈 Setting approved count to:', approvedCount);
        setApprovedToday(approvedCount);
      } else {
        console.warn('⚠️ Approved count API returned success: false');
        setApprovedToday(0);
      }

      if (rejectedResponse.data.success) {
        const rejectedCount = rejectedResponse.data.count || 0;
        console.log('📈 Setting rejected count to:', rejectedCount);
        setRejectedToday(rejectedCount);
      } else {
        console.warn('⚠️ Rejected count API returned success: false');
        setRejectedToday(0);
      }
    } catch (error) {
      console.error('❌ Error loading today\'s counts:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Set to 0 on error but don't fail the whole page
      setApprovedToday(0);
      setRejectedToday(0);
    }
  };

  useEffect(() => {
    if (isMounted && user?.tenantId) {
      loadPendingTimesheets();
    }
    // eslint-disable-line react-hooks/exhaustive-deps
  }, [isMounted, user?.tenantId]);

  const handleApproval = async (timesheetId, action, comments = "") => {
    setProcessingId(timesheetId);
    try {
      const timesheet = timesheets.find((ts) => ts.id === timesheetId);

      // Update timesheet status via API
      const response = await axios.put(`${API_BASE}/api/timesheets/${timesheetId}`, {
        status: action === "approve" ? "approved" : "rejected",
        approvedBy: action === "approve" ? user?.id : undefined,
        rejectionReason: action === "reject" ? comments : undefined
      });

      if (response.data.success) {
        // Update local state - remove from pending list
        setTimesheets(
          (prevTimesheets) => {
            const updatedTimesheets = prevTimesheets.filter((ts) => ts.id !== timesheetId);
            // Update pending count
            setPendingCount(updatedTimesheets.length);
            return updatedTimesheets;
          }
        );

        // Update today's counts - increment the counter
        if (action === "approve") {
          setApprovedToday(prev => {
            const newCount = prev + 1;
            console.log('✅ Approved count updated:', prev, '->', newCount);
            return newCount;
          });
        } else {
          setRejectedToday(prev => {
            const newCount = prev + 1;
            console.log('✅ Rejected count updated:', prev, '->', newCount);
            return newCount;
          });
        }

        // Show success message using a toast notification instead of alert
        const successMessage = document.createElement("div");
        successMessage.className = `toast-notification ${
          action === "approve" ? "success" : "warning"
        }`;
        successMessage.innerHTML = `
          <div class="toast-icon">
            <i class="fa fa-${
              action === "approve" ? "check-circle" : "exclamation-circle"
            }"></i>
          </div>
          <div class="toast-content">
            <h4>Timesheet ${action === "approve" ? "Approved" : "Rejected"}</h4>
            <p>Email notification sent to ${timesheet.employeeName}</p>
          </div>
          <button class="toast-close"><i class="fa fa-times"></i></button>
        `;
        document.body.appendChild(successMessage);

        // Auto-remove after 5 seconds
        setTimeout(() => {
          successMessage.classList.add("hide");
          setTimeout(() => successMessage.remove(), 300);
        }, 5000);

        // Add close button functionality
        const closeButton = successMessage.querySelector(".toast-close");
        closeButton.addEventListener("click", () => {
          successMessage.classList.add("hide");
          setTimeout(() => successMessage.remove(), 300);
        });
      }
    } catch (error) {
      console.error("Error processing approval:", error);
      toast.error("Please try again.", {
        title: "Error Processing Approval"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const ApprovalModal = ({ timesheet, onClose, onSubmit }) => {
    const [action, setAction] = useState("approve");
    const [comments, setComments] = useState("");

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(timesheet.id, action, comments);
      onClose();
    };

    return (
      <div className="modal-overlay">
        <div className="approval-modal">
          <div className="approval-modal-content">
            <div className="approval-modal-header">
              <h5 className="approval-modal-title">
                Review Timesheet - {timesheet.employeeName}
              </h5>
              <button
                type="button"
                className="approval-modal-close"
                onClick={onClose}
              >
                <i className="fa fa-times"></i>
              </button>
            </div>

            <div className="approval-modal-body">
              <div className="approval-info-grid">
                <div className="approval-info-section employee-section">
                  <div className="employee-avatar">
                    {timesheet.employeeName
                      .split(" ")
                      .map((name) => name[0])
                      .join("")}
                  </div>
                  <div className="employee-details">
                    <h4>{timesheet.employeeName}</h4>
                    <div className="detail-item">
                      <i className="fa fa-envelope mail-icon"></i>
                      <span>{timesheet.employeeEmail}</span>
                    </div>
                    <div className="detail-item">
                      <i className="fa fa-building engineer-icon"></i>
                      <span>{timesheet.department}</span>
                    </div>
                  </div>
                </div>

                <div className="approval-info-section timesheet-details">
                  <h6 className="section-title">Timesheet Details</h6>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Week:</span>
                      <span className="detail-value">
                        {timesheet.weekRange}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Client:</span>
                      <span className="detail-value">
                        {timesheet.clientName}
                        <span className="client-type-badge">
                          {timesheet.clientType}
                        </span>
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Billable Hours:</span>
                      <span className="detail-value hours-value">
                        {timesheet.billableProjectHrs}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Time Off/Holiday:</span>
                      <span className="detail-value">
                        {timesheet.timeOffHolidayHrs}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Total Hours:</span>
                      <span className="detail-value total-hours">
                        {timesheet.totalTimeHours}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Submitted:</span>
                      <span className="detail-value">
                        {timesheet.submittedDate}
                      </span>
                    </div>
                  </div>
                </div>

                {timesheet.overtimeComment && (
                  <div className="approval-info-section overtime-section">
                    <h6 className="section-title">
                      <i className="fas fa-exclamation-triangle text-warning"></i> ⚠️ Special Hours Alert
                    </h6>
                    <div className="overtime-alert">
                      <div className="overtime-warning-banner">
                        <i className="fas fa-clock"></i>
                        <span>This employee has worked special hours. Please review the details and explanation below before approving.</span>
                      </div>
                      
                      {/* Categorize and display days by type */}
                      {timesheet.overtimeDays && (() => {
                        const weekendDays = timesheet.overtimeDays.filter(d => d.isWeekend);
                        const holidayDays = timesheet.overtimeDays.filter(d => d.isHoliday);
                        const overtimeDaysOnly = timesheet.overtimeDays.filter(d => !d.isWeekend && !d.isHoliday);
                        
                        return (
                          <>
                            {overtimeDaysOnly.length > 0 && (
                              <div className="overtime-days overtime-category">
                                <strong><i className="fas fa-clock"></i> Overtime Days (&gt;8 hours):</strong>
                                <ul className="overtime-days-list">
                                  {overtimeDaysOnly.map((day, index) => (
                                    <li key={index}>
                                      <span className="day-name">{day.day}:</span>
                                      <span className="day-hours">{day.hours} hours</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {weekendDays.length > 0 && (
                              <div className="weekend-days overtime-category">
                                <strong><i className="fas fa-calendar-week"></i> Weekend Work:</strong>
                                <ul className="overtime-days-list weekend-list">
                                  {weekendDays.map((day, index) => (
                                    <li key={index}>
                                      <span className="day-name">{day.day}:</span>
                                      <span className="day-hours">{day.hours} hours</span>
                                    </li>
                                  ))}
                                </ul>
                                <div className="category-note weekend-note">
                                  <i className="fas fa-info-circle"></i>
                                  <span>Weekend work requires manager approval</span>
                                </div>
                              </div>
                            )}
                            
                            {holidayDays.length > 0 && (
                              <div className="holiday-days overtime-category">
                                <strong><i className="fas fa-umbrella-beach"></i> Holiday Work:</strong>
                                <ul className="overtime-days-list holiday-list">
                                  {holidayDays.map((day, index) => (
                                    <li key={index}>
                                      <span className="day-name">{day.day}:</span>
                                      <span className="day-hours">{day.hours} hours</span>
                                      {day.holidayName && <span className="holiday-name"> ({day.holidayName})</span>}
                                    </li>
                                  ))}
                                </ul>
                                <div className="category-note holiday-note">
                                  <i className="fas fa-exclamation-circle"></i>
                                  <span>Holiday work requires special authorization</span>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                      
                      <div className="overtime-comment">
                        <strong>Employee&apos;s Explanation:</strong>
                        <p>{timesheet.overtimeComment}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="approval-info-section notes-section">
                  <h6 className="section-title">Notes</h6>
                  <div className="notes-content">
                    {timesheet.notes || "No notes provided"}
                  </div>
                </div>

                <div className="approval-info-section attachments-section">
                  <h6 className="section-title">Attachments</h6>
                  <div className="attachments-list">
                    {Array.isArray(timesheet.attachments) && timesheet.attachments.length > 0 ? (
                      timesheet.attachments.map((attachment, index) => (
                        <div key={index} className="attachment-item">
                          <i
                            className={`fa ${
                              attachment.endsWith(".pdf")
                                ? "fa-file-pdf"
                                : attachment.endsWith(".docx") ||
                                  attachment.endsWith(".doc")
                                ? "fa-file-word"
                                : "fa-file"
                            }`}
                          ></i>
                          <span>{attachment}</span>
                        </div>
                      ))
                    ) : (
                      <span className="no-attachments">No attachments</span>
                    )}
                  </div>
                </div>

                {timesheet.reviewer && (
                  <div className="approval-info-section reviewer-section">
                    <h6 className="section-title">Assigned Reviewer</h6>
                    <div className="reviewer-info">
                      <i className="fa fa-user-check"></i>
                      <span>{timesheet.reviewer.name} ({timesheet.reviewer.role})</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="approval-action-section">
                <h6 className="section-title">Your Decision</h6>
                <form onSubmit={handleSubmit}>
                  <div className="approval-options">
                    <div
                      className={`approval-option ${
                        action === "approve" ? "selected" : ""
                      }`}
                      onClick={() => setAction("approve")}
                    >
                      <input
                        type="radio"
                        name="action"
                        id="approve"
                        value="approve"
                        checked={action === "approve"}
                        onChange={(e) => setAction(e.target.value)}
                      />
                      <label htmlFor="approve">
                        <div className="option-icon approve">
                          <i className="fa fa-check-circle"></i>
                        </div>
                        <div className="option-text">
                          <span className="option-title">Approve</span>
                          <span className="option-desc">
                            Timesheet meets requirements
                          </span>
                        </div>
                      </label>
                    </div>

                    <div
                      className={`approval-option ${
                        action === "reject" ? "selected" : ""
                      }`}
                      onClick={() => setAction("reject")}
                    >
                      <input
                        type="radio"
                        name="action"
                        id="reject"
                        value="reject"
                        checked={action === "reject"}
                        onChange={(e) => setAction(e.target.value)}
                      />
                      <label htmlFor="reject">
                        <div className="option-icon reject">
                          <i className="fa fa-times-circle"></i>
                        </div>
                        <div className="option-text">
                          <span className="option-title">Reject</span>
                          <span className="option-desc">
                            Requires corrections
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="comments-section">
                    <label>
                      Comments{" "}
                      {action === "reject" && (
                        <span className="required-mark">*</span>
                      )}
                    </label>
                    <textarea
                      rows="3"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder={
                        action === "approve"
                          ? "Optional approval comments..."
                          : "Please provide reason for rejection..."
                      }
                      required={action === "reject"}
                      className={action === "reject" ? "required" : ""}
                    />
                  </div>

                  <div className="approval-actions">
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`submit-button ${
                        action === "approve" ? "approve" : "reject"
                      }`}
                    >
                      <i
                        className={`fa ${
                          action === "approve" ? "fa-check" : "fa-times"
                        }`}
                      ></i>
                      {action === "approve"
                        ? "Approve Timesheet"
                        : "Reject Timesheet"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const [selectedTimesheet, setSelectedTimesheet] = useState(null);

  const getStatusBadge = (status) => {
    const statusConfig = {
      "Submitted for Approval": { class: "status-pending", icon: "fa-clock" },
      Approved: { class: "status-approved", icon: "fa-check-circle" },
      Rejected: { class: "status-rejected", icon: "fa-times-circle" }};

    const config = statusConfig[status] || {
      class: "status-unknown",
      icon: "fa-question-circle"};

    return (
      <span className={`status-badge ${config.class}`}>
        <i className={`fa ${config.icon}`}></i>
        <span>{status}</span>
      </span>
    );
  };

  const filteredTimesheets = timesheets.filter(
    (timesheet) =>
      timesheet.employeeName.toLowerCase().includes(searchBy.toLowerCase()) ||
      timesheet.department.toLowerCase().includes(searchBy.toLowerCase()) ||
      timesheet.clientName.toLowerCase().includes(searchBy.toLowerCase())
  );

  // Prevent hydration mismatch - don't render until mounted
  if (!isMounted) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard requiredPermission={PERMISSIONS.APPROVE_TIMESHEETS}>
      <div className="approval-container">
        <div className="approval-header">
          <div className="header-content">
            <h2 className="page-title">Timesheet Approval</h2>
            {/* <p className="page-subtitle">
              Review and manage employee timesheet submissions
            </p> */}
          </div>
          <div className="header-actions">
            <div class="search-wrapper">
              <i class="fas fa-search search-icon"></i>
              <input
                type="text"
                className="search-input"
                placeholder="Search by employee, department, or client..."
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="approval-stats">
          <div className="stat-card pending">
            <div className="stat-icon-pending">
              <i className="fa fa-clock"></i>
            </div>
            <div className="stat-content">
              <h3>{pendingCount}</h3>
              <p>Pending</p>
            </div>
          </div>

          <div className="stat-card approved">
            <div className="stat-icon-approved">
              <i className="fa fa-check-circle"></i>
            </div>
            <div className="stat-content">
              <h3>{approvedToday}</h3>
              <p>Approved</p>
            </div>
          </div>

          <div className="stat-card rejected">
            <div className="stat-icon-rejected">
              <i className="fa fa-times-circle"></i>
            </div>
            <div className="stat-content">
              <h3>{rejectedToday}</h3>
              <p>Rejected</p>
            </div>
          </div>
        </div>

        <div className="approval-content">
          <div className="content-header">
            <h3>Pending Approvals</h3>
            <div className="content-actions">
              {/* Future actions like bulk approve, filter, etc. */}
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading timesheets...</p>
            </div>
          ) : (
            <div className="timesheet-cards">
              {filteredTimesheets.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="fa fa-clipboard-check"></i>
                  </div>
                  <h4>No Pending Timesheets</h4>
                  <p>All timesheets have been reviewed. Great job!</p>
                </div>
              ) : (
                filteredTimesheets.map((timesheet) => (
                  <div key={timesheet.id} className="timesheet-card">
                    <div className="card-header">
                      <div className="employee-info">
                        <div className="avatar">
                          {timesheet.employeeName
                            .split(" ")
                            .map((name) => name[0])
                            .join("")}
                        </div>
                        <div>
                          <h4>{timesheet.employeeName}</h4>
                          <p>{timesheet.department}</p>
                        </div>
                      </div>
                      {getStatusBadge(timesheet.status)}
                    </div>

                    <div className="card-body">
                      <div className="timesheet-detail">
                        <i className="fa fa-calendar"></i>
                        <span>{timesheet.weekRange}</span>
                      </div>

                      <div className="timesheet-detail">
                        <i className="fa fa-building"></i>
                        <span>
                          {timesheet.clientName}
                          <span className="client-type">
                            {timesheet.clientType}
                          </span>
                        </span>
                      </div>

                      <div className="timesheet-hours">
                        <div className="hours-item">
                          <span className="hours-label">Billable</span>
                          <span className="hours-value">
                            {timesheet.billableProjectHrs}
                          </span>
                        </div>
                        <div className="hours-divider"></div>
                        <div className="hours-item">
                          <span className="hours-label">Time Off</span>
                          <span className="hours-value">
                            {timesheet.timeOffHolidayHrs}
                          </span>
                        </div>
                        <div className="hours-divider"></div>
                        <div className="hours-item">
                          <span className="hours-label">Total</span>
                          <span className="hours-value total">
                            {timesheet.totalTimeHours}
                          </span>
                        </div>
                      </div>

                      {Array.isArray(timesheet.attachments) && timesheet.attachments.length > 0 && (
                        <div className="attachment-indicator">
                          <i className="fa fa-paperclip"></i>
                          <span>
                            {timesheet.attachments.length} attachment
                            {timesheet.attachments.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="card-footer">
                      <div className="submission-date">
                        <i className="fa fa-clock"></i>
                        <span>Submitted {timesheet.submittedDate}</span>
                      </div>

                      <button
                        className="review-button"
                        onClick={() => setSelectedTimesheet(timesheet)}
                        disabled={processingId === timesheet.id}
                      >
                        {processingId === timesheet.id ? (
                          <>
                            <div className="button-spinner"></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <i className="fa fa-eye"></i>
                            <span>Review</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {selectedTimesheet && (
        <ApprovalModal
          timesheet={selectedTimesheet}
          onClose={() => setSelectedTimesheet(null)}
          onSubmit={handleApproval}
        />
      )}
    </PermissionGuard>
  );
};

export default TimesheetApproval;
