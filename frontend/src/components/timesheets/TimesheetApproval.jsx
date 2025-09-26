import React, { useState, useEffect } from "react";
import { PERMISSIONS } from "../../utils/roles";
import PermissionGuard from "../common/PermissionGuard";
import "./TimesheetSummary.css";
import "./TimesheetApproval.css";

const TimesheetApproval = () => {
  // We'll use these in future implementations
  // const { subdomain } = useParams();
  // const navigate = useNavigate();
  // const { checkPermission } = useAuth();
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchBy, setSearchBy] = useState("");
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadPendingTimesheets();
  }, []);

  const loadPendingTimesheets = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock timesheet data for approval
      const mockTimesheets = [
        {
          id: 1,
          employeeName: "John Doe",
          employeeEmail: "john.doe@company.com",
          department: "Engineering",
          weekRange: "12-JUL-2025 To 18-JUL-2025",
          status: "Submitted for Approval",
          billableProjectHrs: "40.00",
          timeOffHolidayHrs: "0.00",
          totalTimeHours: "40.00",
          submittedDate: "2025-07-19",
          clientName: "JPMC",
          clientType: "internal",
          notes: "Completed project milestone deliverables",
          attachments: ["timesheet_proof.pdf", "work_sample.docx"],
        },
        {
          id: 2,
          employeeName: "Jane Smith",
          employeeEmail: "jane.smith@company.com",
          department: "Design",
          weekRange: "12-JUL-2025 To 18-JUL-2025",
          status: "Submitted for Approval",
          billableProjectHrs: "38.00",
          timeOffHolidayHrs: "2.00",
          totalTimeHours: "40.00",
          submittedDate: "2025-07-19",
          clientName: "IBM",
          clientType: "external",
          notes: "UI design reviews and client feedback implementation",
          attachments: ["client_timesheet.pdf"],
        },
        {
          id: 3,
          employeeName: "Mike Johnson",
          employeeEmail: "mike.johnson@company.com",
          department: "Engineering",
          weekRange: "05-JUL-2025 To 11-JUL-2025",
          status: "Submitted for Approval",
          billableProjectHrs: "42.00",
          timeOffHolidayHrs: "0.00",
          totalTimeHours: "42.00",
          submittedDate: "2025-07-12",
          clientName: "Accenture",
          clientType: "internal",
          notes: "Backend API development and testing",
          attachments: ["timesheet_proof.pdf"],
        },
      ];

      setTimesheets(mockTimesheets);
    } catch (error) {
      console.error("Error loading timesheets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (timesheetId, action, comments = "") => {
    setProcessingId(timesheetId);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const timesheet = timesheets.find((ts) => ts.id === timesheetId);

      // Simulate email notification
      const emailNotification = {
        to: timesheet.employeeEmail,
        subject: `Timesheet ${
          action === "approve" ? "Approved" : "Rejected"
        } - Week ${timesheet.weekRange}`,
        body: `
          Dear ${timesheet.employeeName},
          
          Your timesheet for the week ${timesheet.weekRange} has been ${
          action === "approve" ? "approved" : "rejected"
        }.
          
          ${comments ? `Comments: ${comments}` : ""}
          
          ${
            action === "approve"
              ? "Your timesheet has been processed and will be included in the next payroll cycle."
              : "Please review the comments and resubmit your timesheet with the necessary corrections."
          }
          
          Best regards,
          TimePulse System
        `,
      };

      console.log("Email notification sent:", emailNotification);

      // Update timesheet status
      setTimesheets(
        (prevTimesheets) =>
          prevTimesheets
            .map((ts) =>
              ts.id === timesheetId
                ? {
                    ...ts,
                    status: action === "approve" ? "Approved" : "Rejected",
                    approvalComments: comments,
                  }
                : ts
            )
            .filter((ts) => ts.status === "Submitted for Approval") // Remove from pending list
      );

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
    } catch (error) {
      console.error("Error processing approval:", error);
      alert("Error processing approval. Please try again.");
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
                      <i className="fa fa-envelope"></i>
                      <span>{timesheet.employeeEmail}</span>
                    </div>
                    <div className="detail-item">
                      <i className="fa fa-building"></i>
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

                <div className="approval-info-section notes-section">
                  <h6 className="section-title">Notes</h6>
                  <div className="notes-content">
                    {timesheet.notes || "No notes provided"}
                  </div>
                </div>

                <div className="approval-info-section attachments-section">
                  <h6 className="section-title">Attachments</h6>
                  <div className="attachments-list">
                    {timesheet.attachments.length > 0 ? (
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
      Rejected: { class: "status-rejected", icon: "fa-times-circle" },
    };

    const config = statusConfig[status] || {
      class: "status-unknown",
      icon: "fa-question-circle",
    };

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

  return (
    <PermissionGuard requiredPermission={PERMISSIONS.APPROVE_TIMESHEETS}>
      <div className="approval-container">
        <div className="approval-header">
          <div className="header-content">
            <h2 className="page-title">Timesheet Approval</h2>
            <p className="page-subtitle">
              Review and manage employee timesheet submissions
            </p>
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
              <h3>
                {
                  filteredTimesheets.filter(
                    (t) => t.status === "Submitted for Approval"
                  ).length
                }
              </h3>
              <p>Pending</p>
            </div>
          </div>

          <div className="stat-card approved">
            <div className="stat-icon-approved">
              <i className="fa fa-check-circle"></i>
            </div>
            <div className="stat-content">
              <h3>{0}</h3>
              <p>Approved Today</p>
            </div>
          </div>

          <div className="stat-card rejected">
            <div className="stat-icon-rejected">
              <i className="fa fa-times-circle"></i>
            </div>
            <div className="stat-content">
              <h3>{0}</h3>
              <p>Rejected Today</p>
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

                      {timesheet.attachments.length > 0 && (
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
