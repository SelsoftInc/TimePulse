// src/components/timesheets/Timesheet.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link } from 'react-router-dom';
import "./Timesheet.css";

// Weekly Timesheet Entry Component
const WeeklyTimesheet = ({ week, sowData, status, onSubmit, onSaveDraft }) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const [hours, setHours] = useState(Array(7).fill(0));
  const [selectedSOW, setSelectedSOW] = useState(sowData[0]?.id || "");
  const [notes, setNotes] = useState("");
  const fileInputRef = useRef(null);
  
  const handleHourChange = (index, value) => {
    const newHours = [...hours];
    newHours[index] = value === "" ? 0 : Math.min(24, Math.max(0, parseFloat(value)));
    setHours(newHours);
  };
  
  const totalHours = hours.reduce((sum, hour) => sum + hour, 0);
  
  const getStatusClass = (status) => {
    switch(status) {
      case "Approved": return "badge-success";
      case "Pending": return "badge-warning";
      case "Rejected": return "badge-danger";
      case "Draft": return "badge-gray";
      case "Overdue": return "badge-danger";
      default: return "badge-gray";
    }
  };

  const handleFileUpload = (e) => {
    // Handle file upload logic here
    console.log("File uploaded:", e.target.files[0]);
  };

  const handleSubmit = () => {
    const timesheetData = {
      week,
      sowId: selectedSOW,
      hours,
      totalHours,
      notes,
      status: "Pending"
    };
    onSubmit(timesheetData);
  };

  const handleSaveDraft = () => {
    const timesheetData = {
      week,
      sowId: selectedSOW,
      hours,
      totalHours,
      notes,
      status: "Draft"
    };
    onSaveDraft(timesheetData);
  };
  
  return (
    <div className="card card-bordered">
      {status === "Overdue" && (
        <div className="alert alert-danger alert-icon">
          <em className="icon ni ni-alert-circle"></em>
          <strong>Timesheet submission is overdue!</strong> Please submit as soon as possible.
        </div>
      )}
      
      <div className="card-inner">
        <div className="card-title-group align-start mb-3">
          <div className="card-title">
            <h6 className="title">Week of {week}</h6>
          </div>
          {status && (
            <div className="card-tools">
              <span className={`badge badge-dot ${getStatusClass(status)}`}>{status}</span>
            </div>
          )}
        </div>

        <div className="form-group mb-4">
          <label className="form-label">Select Statement of Work (SOW)</label>
          <div className="form-control-wrap">
            <select 
              className="form-select" 
              value={selectedSOW}
              onChange={(e) => setSelectedSOW(e.target.value)}
            >
              {sowData.map(sow => (
                <option key={sow.id} value={sow.id}>
                  {sow.project} - {sow.client} ({sow.startDate} to {sow.endDate})
                </option>
              ))}
            </select>
          </div>
          <div className="form-note">
            Selected SOW: {sowData.find(sow => sow.id === selectedSOW)?.project || "None"}
          </div>
        </div>
        
        <div className="timesheet-grid">
          {days.map((day, index) => (
            <div key={index} className="timesheet-day">
              <label htmlFor={`day-${index}`}>{day}</label>
              <input
                id={`day-${index}`}
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={hours[index] || ""}
                onChange={(e) => handleHourChange(index, e.target.value)}
                className="form-control"
              />
            </div>
          ))}
          <div className="timesheet-total">
            <label>Total</label>
            <div className="form-control-plaintext fw-bold">{totalHours.toFixed(1)}</div>
          </div>
        </div>

        <div className="form-group mt-4">
          <label className="form-label">Upload Timesheet Document (Optional)</label>
          <div className="form-control-wrap">
            <div className="form-file">
              <input 
                type="file" 
                className="form-file-input" 
                id="timesheet-file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.xls,.xlsx,.doc,.docx"
              />
              <label className="form-file-label" htmlFor="timesheet-file">
                <span className="form-file-text">Choose file...</span>
                <span className="form-file-button">Browse</span>
              </label>
            </div>
          </div>
          <div className="form-note">Accepted formats: PDF, Excel, Word</div>
        </div>
        
        <div className="form-group mt-3">
          <label htmlFor="notes" className="form-label">Notes</label>
          <textarea 
            id="notes" 
            className="form-control" 
            rows="3" 
            placeholder="Add notes about this timesheet"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          ></textarea>
        </div>
        
        <div className="mt-4 d-flex justify-content-between">
          <button className="btn btn-outline-light" onClick={handleSaveDraft}>
            <em className="icon ni ni-save me-1"></em>
            Save Draft
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            <em className="icon ni ni-send me-1"></em>
            Submit Timesheet
          </button>
        </div>
      </div>
    </div>
  );
};

// Timesheet History Table Component
const TimesheetHistory = ({ timesheets, isApprover = false }) => {
  const [filteredTimesheets, setFilteredTimesheets] = useState(timesheets);
  const [statusFilter, setStatusFilter] = useState("any");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filter timesheets based on status and date
  const filterTimesheets = () => {
    let filtered = [...timesheets];
    
    // Apply status filter
    if (statusFilter !== "any") {
      filtered = filtered.filter(ts => ts.status.toLowerCase() === statusFilter);
    }
    
    // Apply date filter
    if (dateFilter === "current-month") {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      filtered = filtered.filter(ts => {
        const submittedDate = new Date(ts.submitted);
        return submittedDate.getMonth() === currentMonth && 
               submittedDate.getFullYear() === currentYear;
      });
    } else if (dateFilter === "last-month") {
      const lastMonth = new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1;
      const lastMonthYear = new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear();
      filtered = filtered.filter(ts => {
        const submittedDate = new Date(ts.submitted);
        return submittedDate.getMonth() === lastMonth && 
               submittedDate.getFullYear() === lastMonthYear;
      });
    }
    
    setFilteredTimesheets(filtered);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Handle date filter change
  const handleDateFilterChange = (e) => {
    setDateFilter(e.target.value);
  };

  // View timesheet details
  const viewTimesheetDetails = (timesheet) => {
    setSelectedTimesheet(timesheet);
    setShowDetailModal(true);
  };

  // Handle timesheet approval
  const handleApprove = () => {
    // Logic to approve timesheet
    console.log("Approving timesheet:", selectedTimesheet);
    setShowDetailModal(false);
  };

  // Handle timesheet rejection
  const handleReject = () => {
    // Logic to reject timesheet
    console.log("Rejecting timesheet:", selectedTimesheet);
    setShowDetailModal(false);
  };

  // Handle timesheet flagging
  const handleFlag = () => {
    // Logic to flag timesheet
    console.log("Flagging timesheet:", selectedTimesheet);
    setShowDetailModal(false);
  };

  // Apply filters when they change
  useEffect(() => {
    filterTimesheets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, dateFilter, timesheets]);

  return (
    <div className="card card-bordered">
      <div className="card-inner">
        <div className="card-title-group">
          <div className="card-title">
            <h6 className="title">{isApprover ? "Timesheets for Approval" : "Timesheet History"}</h6>
          </div>
          <div className="card-tools">
            <div className="form-inline flex-nowrap gx-3">
              {isApprover && (
                <div className="form-wrap w-150px me-2">
                  <select className="form-select" onChange={handleDateFilterChange} value={dateFilter}>
                    <option value="all">All Time</option>
                    <option value="current-month">Current Month</option>
                    <option value="last-month">Last Month</option>
                  </select>
                </div>
              )}
              <div className="form-wrap w-150px">
                <select className="form-select" onChange={handleStatusFilterChange} value={statusFilter}>
                  <option value="any">Any Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="draft">Draft</option>
                  {isApprover && <option value="flagged">Flagged</option>}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="card-inner p-0">
        <div className="nk-tb-list nk-tb-ulist">
          <div className="nk-tb-item nk-tb-head">
            <div className="nk-tb-col"><span>Week</span></div>
            <div className="nk-tb-col tb-col-md"><span>Project</span></div>
            {isApprover && <div className="nk-tb-col tb-col-md"><span>Employee</span></div>}
            <div className="nk-tb-col"><span>Hours</span></div>
            <div className="nk-tb-col"><span>Submitted</span></div>
            <div className="nk-tb-col"><span>Status</span></div>
            <div className="nk-tb-col nk-tb-col-tools"></div>
          </div>
          
          {filteredTimesheets.length > 0 ? (
            filteredTimesheets.map((timesheet, index) => (
              <div key={index} className="nk-tb-item">
                <div className="nk-tb-col">
                  <span className="tb-lead">{timesheet.week}</span>
                </div>
                <div className="nk-tb-col tb-col-md">
                  <span>{timesheet.project}</span>
                  {timesheet.sowExpired && (
                    <span className="badge badge-dim badge-danger ms-1">SOW Expired</span>
                  )}
                </div>
                {isApprover && (
                  <div className="nk-tb-col tb-col-md">
                    <span>{timesheet.employee}</span>
                  </div>
                )}
                <div className="nk-tb-col">
                  <span>{timesheet.hours}</span>
                </div>
                <div className="nk-tb-col">
                  <span>{timesheet.submitted}</span>
                </div>
                <div className="nk-tb-col">
                  <span className={`badge badge-dot badge-${timesheet.status.toLowerCase()}`}>{timesheet.status}</span>
                </div>
                <div className="nk-tb-col nk-tb-col-tools">
                  <ul className="nk-tb-actions gx-1">
                    <li>
                      <div className="dropdown">
                        <button className="dropdown-toggle btn btn-sm btn-icon btn-trigger" data-bs-toggle="dropdown">
                          <em className="icon ni ni-more-h"></em>
                        </button>
                        <div className="dropdown-menu dropdown-menu-end">
                          <ul className="link-list-opt no-bdr">
                            <li>
                              <button 
                                className="dropdown-item" 
                                onClick={() => viewTimesheetDetails(timesheet)}
                              >
                                <em className="icon ni ni-eye"></em>
                                <span>View Details</span>
                              </button>
                            </li>
                            {!isApprover && timesheet.status === "Draft" && (
                              <li>
                                <button className="dropdown-item">
                                  <em className="icon ni ni-edit"></em>
                                  <span>Edit</span>
                                </button>
                              </li>
                            )}
                            {isApprover && timesheet.status === "Pending" && (
                              <>
                                <li>
                                  <button 
                                    className="dropdown-item"
                                    onClick={() => {
                                      setSelectedTimesheet(timesheet);
                                      handleApprove();
                                    }}
                                  >
                                    <em className="icon ni ni-check-circle"></em>
                                    <span>Approve</span>
                                  </button>
                                </li>
                                <li>
                                  <button 
                                    className="dropdown-item"
                                    onClick={() => {
                                      setSelectedTimesheet(timesheet);
                                      handleReject();
                                    }}
                                  >
                                    <em className="icon ni ni-cross-circle"></em>
                                    <span>Reject</span>
                                  </button>
                                </li>
                                <li>
                                  <button 
                                    className="dropdown-item"
                                    onClick={() => {
                                      setSelectedTimesheet(timesheet);
                                      handleFlag();
                                    }}
                                  >
                                    <em className="icon ni ni-flag"></em>
                                    <span>Flag</span>
                                  </button>
                                </li>
                              </>
                            )}
                          </ul>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            ))
          ) : (
            <div className="nk-tb-item">
              <div className="nk-tb-col text-center" colSpan="6">
                <span className="text-soft">No timesheets found</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timesheet Detail Modal */}
      {showDetailModal && selectedTimesheet && (
        <div className="modal fade show" style={{display: 'block'}} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Timesheet Details</h5>
                <button 
                  type="button" 
                  className="close" 
                  onClick={() => setShowDetailModal(false)}
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6>Week of {selectedTimesheet.week}</h6>
                      <span className={`badge badge-dot badge-${selectedTimesheet.status.toLowerCase()}`}>
                        {selectedTimesheet.status}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Project:</strong> {selectedTimesheet.project}</p>
                    <p><strong>Client:</strong> {selectedTimesheet.client}</p>
                    <p><strong>SOW Period:</strong> {selectedTimesheet.sowPeriod}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Total Hours:</strong> {selectedTimesheet.hours}</p>
                    <p><strong>Submitted:</strong> {selectedTimesheet.submitted}</p>
                    {isApprover && <p><strong>Employee:</strong> {selectedTimesheet.employee}</p>}
                  </div>
                  <div className="col-12">
                    <h6 className="mb-2">Daily Hours</h6>
                    <div className="timesheet-grid">
                      {selectedTimesheet.dailyHours && Object.entries(selectedTimesheet.dailyHours).map(([day, hours]) => (
                        <div key={day} className="timesheet-day">
                          <label>{day}</label>
                          <div className="form-control-plaintext text-center">{hours}</div>
                        </div>
                      ))}
                      <div className="timesheet-total">
                        <label>Total</label>
                        <div className="form-control-plaintext fw-bold">{selectedTimesheet.hours}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 mt-3">
                    <h6 className="mb-2">Notes</h6>
                    <p>{selectedTimesheet.notes || "No notes provided"}</p>
                  </div>
                  {isApprover && (
                    <div className="col-12 mt-3">
                      <h6 className="mb-2">Feedback</h6>
                      <textarea 
                        className="form-control" 
                        rows="3" 
                        placeholder="Add feedback or comments"
                      ></textarea>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </button>
                {isApprover && selectedTimesheet.status === "Pending" && (
                  <>
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      onClick={handleReject}
                    >
                      Reject
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-warning" 
                      onClick={handleFlag}
                    >
                      Flag
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-success" 
                      onClick={handleApprove}
                    >
                      Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Project Selector Component
const ProjectSelector = ({ projects, selectedProject, onSelectProject }) => {
  return (
    <div className="form-group">
      <label className="form-label">Select Project</label>
      <div className="form-control-wrap">
        <select 
          className="form-select" 
          value={selectedProject} 
          onChange={(e) => onSelectProject(e.target.value)}
        >
          <option value="">Select a Project</option>
          {projects.map((project, index) => (
            <option key={index} value={project.id}>
              {project.name} - {project.client}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

// Timesheet Summary Component
const TimesheetSummary = ({ stats }) => {
  return (
    <div className="card card-bordered mb-4">
      <div className="card-inner">
        <div className="card-title-group mb-3">
          <div className="card-title">
            <h6 className="title">Timesheet Summary</h6>
          </div>
        </div>
        <div className="row g-gs">
          <div className="col-md-6">
            <div className="progress-list mb-3">
              <div className="progress-wrap">
                <div className="progress-text">
                  <div className="progress-label">Weekly Hours</div>
                  <div className="progress-amount">{stats.weeklyHours}/{stats.weeklyTarget}h</div>
                </div>
                <div className="progress progress-md">
                  <div className="progress-bar" style={{ width: `${Math.min(Math.round((stats.weeklyHours / stats.weeklyTarget) * 100), 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="progress-list mb-3">
              <div className="progress-wrap">
                <div className="progress-text">
                  <div className="progress-label">Monthly Hours</div>
                  <div className="progress-amount">{stats.monthlyHours}/{stats.monthlyTarget}h</div>
                </div>
                <div className="progress progress-md">
                  <div className="progress-bar bg-success" style={{ width: `${Math.min(Math.round((stats.monthlyHours / stats.monthlyTarget) * 100), 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row g-gs">
          <div className="col-sm-6 col-lg-3">
            <div className="card-inner p-0">
              <div className="nk-iv-wg2">
                <div className="nk-iv-wg2-title">
                  <h6 className="title">Pending <span className="text-soft">Timesheets</span></h6>
                </div>
                <div className="nk-iv-wg2-text">
                  <div className="nk-iv-wg2-amount">{stats.pendingCount}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="card-inner p-0">
              <div className="nk-iv-wg2">
                <div className="nk-iv-wg2-title">
                  <h6 className="title">Approved <span className="text-soft">Timesheets</span></h6>
                </div>
                <div className="nk-iv-wg2-text">
                  <div className="nk-iv-wg2-amount">{stats.approvedCount}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="card-inner p-0">
              <div className="nk-iv-wg2">
                <div className="nk-iv-wg2-title">
                  <h6 className="title">Rejected <span className="text-soft">Timesheets</span></h6>
                </div>
                <div className="nk-iv-wg2-text">
                  <div className="nk-iv-wg2-amount">{stats.rejectedCount}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="card-inner p-0">
              <div className="nk-iv-wg2">
                <div className="nk-iv-wg2-title">
                  <h6 className="title">Overdue <span className="text-soft">Timesheets</span></h6>
                </div>
                <div className="nk-iv-wg2-text">
                  <div className="nk-iv-wg2-amount text-danger">{stats.overdueCount}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Timesheet Component
const Timesheet = () => {
  // State for role switching (in a real app, this would come from authentication)
  const [userRole, setUserRole] = useState("employee"); // "employee" or "approver"
  
  // Timesheet statistics for summary display
  const timesheetStats = {
    weeklyHours: 38.5,
    weeklyTarget: 40,
    monthlyHours: 168.5,
    monthlyTarget: 160,
    pendingCount: 3,
    approvedCount: 12,
    rejectedCount: 1,
    overdueCount: 1
  };
  
  // Sample data for projects
  const projects = [
    { id: "1", name: "TimePulse Development", client: "Acme Corp" },
    { id: "2", name: "API Integration", client: "Acme Corp" },
    { id: "3", name: "Client Portal Redesign", client: "ABC Corp" },
    { id: "4", name: "Mobile App Development", client: "XYZ Tech" }
  ];
  
  // Sample SOW data
  const sowData = [
    { id: "1", project: "TimePulse Development", client: "Acme Corp", startDate: "Jan 2023", endDate: "Dec 2023" },
    { id: "2", project: "API Integration", client: "Acme Corp", startDate: "Mar 2023", endDate: "Sep 2023" },
    { id: "3", project: "Client Portal Redesign", client: "ABC Corp", startDate: "Feb 2023", endDate: "Aug 2023" }
  ];
  
  // Sample employee timesheets
  const employeeTimesheets = [
    { 
      id: 1, 
      week: "May 1 - May 7, 2023", 
      project: "Website Redesign", 
      client: "ABC Corp",
      sowPeriod: "Jan 2023 - Dec 2023",
      hours: 40, 
      submitted: "May 8, 2023", 
      status: "Approved",
      dailyHours: {
        "Mon": 8, "Tue": 8, "Wed": 8, "Thu": 8, "Fri": 8, "Sat": 0, "Sun": 0
      },
      notes: "Completed homepage redesign and navigation components."
    },
    { 
      id: 2, 
      week: "May 8 - May 14, 2023", 
      project: "Website Redesign", 
      client: "ABC Corp",
      sowPeriod: "Jan 2023 - Dec 2023",
      hours: 35, 
      submitted: "May 15, 2023", 
      status: "Pending",
      dailyHours: {
        "Mon": 8, "Tue": 8, "Wed": 8, "Thu": 8, "Fri": 3, "Sat": 0, "Sun": 0
      },
      notes: "Started work on responsive design implementation."
    },
    { 
      id: 3, 
      week: "May 15 - May 21, 2023", 
      project: "Mobile App Development", 
      client: "XYZ Inc",
      sowPeriod: "Mar 2023 - Sep 2023",
      hours: 42, 
      submitted: "May 22, 2023", 
      status: "Rejected",
      dailyHours: {
        "Mon": 8, "Tue": 8, "Wed": 10, "Thu": 8, "Fri": 8, "Sat": 0, "Sun": 0
      },
      notes: "Worked extra hours on Wednesday to fix critical bugs before demo."
    },
    { 
      id: 4, 
      week: "May 22 - May 28, 2023", 
      project: "Cloud Migration", 
      client: "123 Industries",
      sowPeriod: "Feb 2023 - Aug 2023",
      hours: 38, 
      submitted: "May 29, 2023", 
      status: "Draft",
      dailyHours: {
        "Mon": 8, "Tue": 8, "Wed": 8, "Thu": 8, "Fri": 6, "Sat": 0, "Sun": 0
      },
      notes: "Started database migration tasks."
    },
  ];
  
  // Sample approver timesheets (includes employee information)
  const approverTimesheets = [
    { 
      id: 101, 
      week: "May 1 - May 7, 2023", 
      project: "Website Redesign", 
      client: "ABC Corp",
      sowPeriod: "Jan 2023 - Dec 2023",
      employee: "John Smith",
      hours: 40, 
      submitted: "May 8, 2023", 
      status: "Approved",
      dailyHours: {
        "Mon": 8, "Tue": 8, "Wed": 8, "Thu": 8, "Fri": 8, "Sat": 0, "Sun": 0
      },
      notes: "Completed homepage redesign and navigation components."
    },
    { 
      id: 102, 
      week: "May 8 - May 14, 2023", 
      project: "Website Redesign", 
      client: "ABC Corp",
      sowPeriod: "Jan 2023 - Dec 2023",
      employee: "John Smith",
      hours: 35, 
      submitted: "May 15, 2023", 
      status: "Pending",
      dailyHours: {
        "Mon": 8, "Tue": 8, "Wed": 8, "Thu": 8, "Fri": 3, "Sat": 0, "Sun": 0
      },
      notes: "Started work on responsive design implementation."
    },
    { 
      id: 103, 
      week: "May 1 - May 7, 2023", 
      project: "Mobile App Development", 
      client: "XYZ Inc",
      sowPeriod: "Mar 2023 - Sep 2023",
      employee: "Jane Doe",
      hours: 42, 
      submitted: "May 8, 2023", 
      status: "Pending",
      sowExpired: true,
      dailyHours: {
        "Mon": 8, "Tue": 8, "Wed": 10, "Thu": 8, "Fri": 8, "Sat": 0, "Sun": 0
      },
      notes: "Worked extra hours on Wednesday to fix critical bugs before demo."
    },
    { 
      id: 104, 
      week: "May 8 - May 14, 2023", 
      project: "Cloud Migration", 
      client: "123 Industries",
      sowPeriod: "Feb 2023 - Aug 2023",
      employee: "Mike Johnson",
      hours: 38, 
      submitted: "May 15, 2023", 
      status: "Flagged",
      dailyHours: {
        "Mon": 8, "Tue": 8, "Wed": 8, "Thu": 8, "Fri": 6, "Sat": 0, "Sun": 0
      },
      notes: "Started database migration tasks."
    },
  ];

  // Toggle between employee and approver views (for demo purposes)
  const toggleUserRole = () => {
    setUserRole(userRole === "employee" ? "approver" : "employee");
  };

  return (
    <div className="nk-content">
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            <div className="nk-block-head nk-block-head-sm">
              <div className="nk-block-between">
                <div className="nk-block-head-content">
                  <h3 className="nk-block-title page-title">Timesheets</h3>
                  <div className="nk-block-des text-soft">
                    <p>Currently viewing as: <strong>{userRole === "employee" ? "Employee" : "Approver"}</strong></p>
                  </div>
                </div>
                <div className="nk-block-head-content">
                  <div className="toggle-wrap nk-block-tools-toggle">
                    <button 
                      className="btn btn-outline-light btn-sm" 
                      onClick={toggleUserRole}
                    >
                      Switch to {userRole === "employee" ? "Approver" : "Employee"} View
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {userRole === "employee" ? (
              <>
                <div className="nk-block">
                  <div className="row g-gs">
                    <div className="col-12">
                      <TimesheetSummary stats={timesheetStats} />
                    </div>
                    <div className="col-lg-8">
                      <div className="card card-bordered mb-3">
                        <div className="card-inner">
                          <div className="card-title-group align-start mb-3">
                            <div className="card-title">
                              <h6 className="title">Project Selection</h6>
                              <p className="text-soft">Select the project for this timesheet</p>
                            </div>
                          </div>
                          <ProjectSelector 
                            projects={projects}
                            selectedProject={projects[0].id}
                            onSelectProject={(id) => console.log("Selected project:", id)}
                          />
                        </div>
                      </div>
                      <WeeklyTimesheet 
                        week="July 5 - July 11, 2023" 
                        sowData={sowData}
                        status="Draft"
                        onSubmit={(data) => console.log("Submit timesheet:", data)}
                        onSaveDraft={(data) => console.log("Save draft:", data)}
                      />
                    </div>
                    <div className="col-lg-4">
                      <div className="card card-bordered h-100">
                        <div className="card-inner">
                          <div className="card-title-group align-start mb-3">
                            <div className="card-title">
                              <h6 className="title">Quick Tips</h6>
                            </div>
                          </div>
                          <div className="card-text">
                            <div className="alert alert-pro alert-primary">
                              <div className="alert-text">
                                <h6>Timesheet Submission</h6>
                                <p>Submit your timesheet weekly by Sunday 11:59 PM to ensure timely processing.</p>
                              </div>
                            </div>
                            <ul className="list list-sm list-checked">
                              <li>Enter time in 0.5 hour increments</li>
                              <li>Don't forget to select the correct project</li>
                              <li>Add notes for any unusual time entries</li>
                              <li>Save draft if you need to complete later</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <TimesheetHistory timesheets={employeeTimesheets} />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Approver View
              <>
                <div className="nk-block">
                  <div className="row g-gs">
                    <div className="col-12">
                      <div className="card card-bordered mb-4">
                        <div className="card-inner">
                          <div className="card-title-group mb-3">
                            <div className="card-title">
                              <h6 className="title">Approval Statistics</h6>
                            </div>
                            <div className="card-tools">
                              <button className="btn btn-sm btn-primary">
                                <em className="icon ni ni-reports mr-1"></em>
                                <span>Export Report</span>
                              </button>
                            </div>
                          </div>
                          <div className="row g-gs">
                            <div className="col-sm-6 col-lg-3">
                              <div className="card-inner p-0">
                                <div className="nk-iv-wg2">
                                  <div className="nk-iv-wg2-title">
                                    <h6 className="title">Pending <span className="text-soft">Approval</span></h6>
                                  </div>
                                  <div className="nk-iv-wg2-text">
                                    <div className="nk-iv-wg2-amount text-warning">{timesheetStats.pendingCount}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="col-sm-6 col-lg-3">
                              <div className="card-inner p-0">
                                <div className="nk-iv-wg2">
                                  <div className="nk-iv-wg2-title">
                                    <h6 className="title">Approved <span className="text-soft">This Week</span></h6>
                                  </div>
                                  <div className="nk-iv-wg2-text">
                                    <div className="nk-iv-wg2-amount text-success">{timesheetStats.approvedCount}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="col-sm-6 col-lg-3">
                              <div className="card-inner p-0">
                                <div className="nk-iv-wg2">
                                  <div className="nk-iv-wg2-title">
                                    <h6 className="title">Flagged <span className="text-soft">Issues</span></h6>
                                  </div>
                                  <div className="nk-iv-wg2-text">
                                    <div className="nk-iv-wg2-amount text-danger">1</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="col-sm-6 col-lg-3">
                              <div className="card-inner p-0">
                                <div className="nk-iv-wg2">
                                  <div className="nk-iv-wg2-title">
                                    <h6 className="title">Overdue <span className="text-soft">Timesheets</span></h6>
                                  </div>
                                  <div className="nk-iv-wg2-text">
                                    <div className="nk-iv-wg2-amount text-danger">{timesheetStats.overdueCount}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-xl-12">
                      <div className="card card-bordered card-full">
                        <div className="card-inner">
                          <div className="card-title-group">
                            <div className="card-title">
                              <h6 className="title">Timesheet Approval Dashboard</h6>
                            </div>
                          </div>
                        </div>
                        <div className="card-inner p-0 border-top">
                          <div className="nk-tb-list nk-tb-ulist">
                            <div className="nk-tb-item nk-tb-head">
                              <div className="nk-tb-col"><span>Status</span></div>
                              <div className="nk-tb-col"><span>Count</span></div>
                              <div className="nk-tb-col"><span>Action</span></div>
                            </div>
                            <div className="nk-tb-item">
                              <div className="nk-tb-col">
                                <span className="tb-status text-warning">Pending Approval</span>
                              </div>
                              <div className="nk-tb-col">
                                <span className="tb-amount">{timesheetStats.pendingCount}</span>
                              </div>
                              <div className="nk-tb-col">
                                <Link to="#pending" className="btn btn-dim btn-sm btn-outline-primary">View All</Link>
                              </div>
                            </div>
                            <div className="nk-tb-item">
                              <div className="nk-tb-col">
                                <span className="tb-status text-danger">Flagged</span>
                              </div>
                              <div className="nk-tb-col">
                                <span className="tb-amount">1</span>
                              </div>
                              <div className="nk-tb-col">
                                <Link to="#flagged" className="btn btn-dim btn-sm btn-outline-primary">View All</Link>
                              </div>
                            </div>
                            <div className="nk-tb-item">
                              <div className="nk-tb-col">
                                <span className="tb-status text-success">Approved This Week</span>
                              </div>
                              <div className="nk-tb-col">
                                <span className="tb-amount">{timesheetStats.approvedCount}</span>
                              </div>
                              <div className="nk-tb-col">
                                <Link to="#approved" className="btn btn-dim btn-sm btn-outline-primary">View All</Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="nk-block nk-block-lg" id="pending">
                  <div className="row g-gs">
                    <div className="col-12">
                      <TimesheetHistory timesheets={approverTimesheets} isApprover={true} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timesheet;
