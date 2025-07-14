// src/components/dashboard/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PERMISSIONS } from "../../utils/roles";
import { useAuth } from "../../contexts/AuthContext";
import PermissionGuard from "../common/PermissionGuard";
import "./Dashboard.css";

// DashCards component - Shows summary statistics
const DashCards = ({ stats }) => {
  return (
    <div className="nk-block">
      <div className="row g-gs">
        <div className="col-xxl-3 col-sm-6">
          <div className="card">
            <div className="nk-ecwg nk-ecwg6">
              <div className="card-inner">
                <div className="card-title-group">
                  <div className="card-title">
                    <h6 className="title">Total Hours</h6>
                  </div>
                </div>
                <div className="data">
                  <div className="data-group">
                    <div className="amount">{stats.totalHours}</div>
                    <div className="nk-ecwg6-ck">
                      <div className="chart-bar-fill" style={{ width: "80%" }}></div>
                    </div>
                  </div>
                  <div className="info"><span className="change up text-success"><em className="icon ni ni-arrow-long-up"></em>{stats.hoursTrend}%</span><span> vs. last week</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xxl-3 col-sm-6">
          <div className="card">
            <div className="nk-ecwg nk-ecwg6">
              <div className="card-inner">
                <div className="card-title-group">
                  <div className="card-title">
                    <h6 className="title">Pending Timesheets</h6>
                  </div>
                </div>
                <div className="data">
                  <div className="data-group">
                    <div className="amount">{stats.pendingCount}</div>
                    <div className="nk-ecwg6-ck">
                      <div className="chart-bar-fill" style={{ width: "20%" }}></div>
                    </div>
                  </div>
                  <div className="info"><span className="change down text-danger"><em className="icon ni ni-arrow-long-down"></em>{stats.pendingTrend}%</span><span> vs. last week</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xxl-3 col-sm-6">
          <div className="card">
            <div className="nk-ecwg nk-ecwg6">
              <div className="card-inner">
                <div className="card-title-group">
                  <div className="card-title">
                    <h6 className="title">Approved Timesheets</h6>
                  </div>
                </div>
                <div className="data">
                  <div className="data-group">
                    <div className="amount">{stats.approvedCount}</div>
                    <div className="nk-ecwg6-ck">
                      <div className="chart-bar-fill" style={{ width: "70%" }}></div>
                    </div>
                  </div>
                  <div className="info"><span className="change up text-success"><em className="icon ni ni-arrow-long-up"></em>{stats.approvedTrend}%</span><span> vs. last week</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xxl-3 col-sm-6">
          <div className="card">
            <div className="nk-ecwg nk-ecwg6">
              <div className="card-inner">
                <div className="card-title-group">
                  <div className="card-title">
                    <h6 className="title">Overdue Timesheets</h6>
                  </div>
                </div>
                <div className="data">
                  <div className="data-group">
                    <div className="amount">{stats.overdueCount}</div>
                    <div className="nk-ecwg6-ck">
                      <div className="chart-bar-fill" style={{ width: "10%" }}></div>
                    </div>
                  </div>
                  <div className="info"><span className="change down text-danger"><em className="icon ni ni-arrow-long-down"></em>{stats.overdueTrend}%</span><span> vs. last week</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// TimesheetTable component - Shows timesheet entries
const TimesheetTable = ({ timesheetData, isEmployeeRole }) => {
  return (
    <div className="card card-bordered card-full">
      <div className="card-inner">
        <div className="card-title-group">
          <div className="card-title">
            <h6 className="title">Recent Timesheets</h6>
          </div>
          <div className="card-tools">
            <button className="btn btn-primary btn-sm">
              <em className="icon ni ni-plus"></em>
              <span>Add Timesheet</span>
            </button>
          </div>
        </div>
      </div>
      <div className="card-inner p-0 border-top">
        <div className="nk-tb-list nk-tb-orders">
          <div className="nk-tb-item nk-tb-head">
            {!isEmployeeRole && <div className="nk-tb-col"><span>Employee</span></div>}
            <div className="nk-tb-col"><span>Project</span></div>
            <div className="nk-tb-col"><span>Client</span></div>
            <div className="nk-tb-col"><span>Week</span></div>
            <div className="nk-tb-col"><span>Hours</span></div>
            <div className="nk-tb-col"><span>Status</span></div>
            <div className="nk-tb-col nk-tb-col-tools"></div>
          </div>
          
          {timesheetData.map((timesheet, index) => (
            <div key={index} className="nk-tb-item">
              {!isEmployeeRole && (
                <div className="nk-tb-col">
                  <div className="user-card">
                    <div className="user-avatar sm bg-primary-dim">
                      <span>{timesheet.employee.initials}</span>
                    </div>
                    <div className="user-info">
                      <span className="tb-lead">{timesheet.employee.name} <span className="dot dot-success d-md-none ms-1"></span></span>
                      <span>{timesheet.employee.role}</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="nk-tb-col">
                <span className="tb-lead">{timesheet.project}</span>
              </div>
              <div className="nk-tb-col">
                <span className="tb-sub">{timesheet.client}</span>
              </div>
              <div className="nk-tb-col">
                <span className="tb-sub">{timesheet.week}</span>
              </div>
              <div className="nk-tb-col">
                <span className="tb-sub text-primary">{timesheet.hours}</span>
              </div>
              <div className="nk-tb-col">
                <span className={`badge bg-outline-${timesheet.status.color}`}>{timesheet.status.label}</span>
              </div>
              <div className="nk-tb-col nk-tb-col-tools">
                <ul className="nk-tb-actions gx-1">
                  <li>
                    <div className="dropdown">
                      <button className="dropdown-toggle btn btn-icon btn-trigger" data-bs-toggle="dropdown"><em className="icon ni ni-more-h"></em></button>
                      <div className="dropdown-menu dropdown-menu-end">
                        <ul className="link-list-opt no-bdr">
                          <li><button className="dropdown-item"><em className="icon ni ni-eye"></em><span>View Details</span></button></li>
                          <li><button className="dropdown-item"><em className="icon ni ni-edit"></em><span>Edit</span></button></li>
                          <li><button className="dropdown-item"><em className="icon ni ni-check-circle"></em><span>Approve</span></button></li>
                          <li><button className="dropdown-item"><em className="icon ni ni-na"></em><span>Reject</span></button></li>
                        </ul>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// TimesheetProgress component - Shows progress stats
const TimesheetProgress = ({ stats }) => {
  return (
    <div className="card card-bordered h-100">
      <div className="card-inner">
        <div className="card-title-group align-start mb-2">
          <div className="card-title">
            <h6 className="title">Timesheet Progress</h6>
          </div>
        </div>
        <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
          <div className="nk-sale-data">
            <span className="amount">{stats.pendingCount} <em className="icon ni ni-clock"></em></span>
            <span className="sub-title">Pending Approval</span>
          </div>
          <div className="nk-sale-data">
            <span className="amount">{stats.approvedCount} <em className="icon ni ni-check-circle"></em></span>
            <span className="sub-title">Approved</span>
          </div>
        </div>
        <div className="progress progress-md mt-4">
          <div className="progress-bar bg-primary" style={{ width: `${(stats.approvedCount / (stats.approvedCount + stats.pendingCount + stats.overdueCount)) * 100}%` }}></div>
          <div className="progress-bar bg-warning" style={{ width: `${(stats.pendingCount / (stats.approvedCount + stats.pendingCount + stats.overdueCount)) * 100}%` }}></div>
          <div className="progress-bar bg-danger" style={{ width: `${(stats.overdueCount / (stats.approvedCount + stats.pendingCount + stats.overdueCount)) * 100}%` }}></div>
        </div>
        <div className="progress-info mt-2">
          <div className="progress-info-item">
            <span className="progress-info-label">
              <span className="progress-info-swatch bg-primary"></span> Approved
            </span>
            <span className="progress-info-percent">{Math.round((stats.approvedCount / (stats.approvedCount + stats.pendingCount + stats.overdueCount)) * 100)}%</span>
          </div>
          <div className="progress-info-item">
            <span className="progress-info-label">
              <span className="progress-info-swatch bg-warning"></span> Pending
            </span>
            <span className="progress-info-percent">{Math.round((stats.pendingCount / (stats.approvedCount + stats.pendingCount + stats.overdueCount)) * 100)}%</span>
          </div>
          <div className="progress-info-item">
            <span className="progress-info-label">
              <span className="progress-info-swatch bg-danger"></span> Overdue
            </span>
            <span className="progress-info-percent">{Math.round((stats.overdueCount / (stats.approvedCount + stats.pendingCount + stats.overdueCount)) * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// InvoiceWidget component - Only shown for Admin/Manager roles
const InvoiceWidget = ({ invoiceData }) => {
  return (
    <div className="card card-bordered h-100">
      <div className="card-inner">
        <div className="card-title-group align-start mb-2">
          <div className="card-title">
            <h6 className="title">Recent Invoices</h6>
          </div>
          <div className="card-tools">
            <button className="btn btn-primary btn-sm">Create Invoice</button>
          </div>
        </div>
        <div className="tranx-list">
          {invoiceData.map((invoice, idx) => (
            <div key={idx} className="tranx-item">
              <div className="tranx-col">
                <div className="tranx-info">
                  <div className="tranx-badge">
                    <span className={`badge bg-outline-${invoice.status.color}`}>{invoice.status.label}</span>
                  </div>
                  <div className="tranx-data">
                    <div className="tranx-label">{invoice.id}</div>
                    <div className="tranx-date">{invoice.client}</div>
                  </div>
                </div>
              </div>
              <div className="tranx-col">
                <div className="tranx-amount">
                  <div className="number">${invoice.amount}</div>
                  <div className="number-sm">{invoice.dueDate}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main Dashboard component
const Dashboard = () => {
  const navigate = useNavigate();
  const { subdomain } = useParams();
  const { currentEmployer } = useAuth();
  
  // Determine if user is in employee role
  const isEmployeeRole = currentEmployer?.role === 'employee';

  // Dashboard stats
  const dashStats = {
    totalHours: isEmployeeRole ? "40.0" : "215.5",
    hoursTrend: 2.5,
    pendingCount: isEmployeeRole ? 1 : 5,
    pendingTrend: -1.5,
    approvedCount: isEmployeeRole ? 3 : 12,
    approvedTrend: 3.2,
    overdueCount: isEmployeeRole ? 0 : 1,
    overdueTrend: -2.0
  };
  
  // Filter timesheets based on role
  const [timesheetData, setTimesheetData] = useState([]);
  
  useEffect(() => {
    // Sample timesheet data for all employees
    const allTimesheetData = [
      {
        employee: { name: "John Smith", initials: "JS", role: "Developer", id: "1" },
        project: "Cloud Migration",
        client: "JPMC",
        week: "Jul 1 - Jul 7",
        hours: "40.0",
        status: { label: "Pending", color: "warning" }
      },
      {
        employee: { name: "Sarah Johnson", initials: "SJ", role: "Designer", id: "2" },
        project: "Website Redesign",
        client: "Accenture",
        week: "Jul 1 - Jul 7",
        hours: "37.5",
        status: { label: "Approved", color: "success" }
      },
      {
        employee: { name: "Michael Chen", initials: "MC", role: "QA Engineer", id: "3" },
        project: "Mobile App Testing",
        client: "Virtusa",
        week: "Jul 1 - Jul 7",
        hours: "42.0",
        status: { label: "Rejected", color: "danger" }
      },
      {
        employee: { name: "Emily Davis", initials: "ED", role: "Project Manager", id: "4" },
        project: "ERP Implementation",
        client: "Cognizant",
        week: "Jul 1 - Jul 7",
        hours: "40.0",
        status: { label: "Approved", color: "success" }
      },
      {
        employee: { name: "Robert Wilson", initials: "RW", role: "DevOps", id: "5" },
        project: "Infrastructure Setup",
        client: "IBM",
        week: "Jul 1 - Jul 7",
        hours: "45.0",
        status: { label: "Pending", color: "warning" }
      }
    ];
    
    // If employee role, only show current user's timesheets
    // For demo purposes, we'll assume the current user is John Smith (id: 1)
    if (isEmployeeRole) {
      setTimesheetData(allTimesheetData.filter(timesheet => timesheet.employee.id === "1"));
    } else {
      // For admin, manager, approver roles, show all timesheets
      setTimesheetData(allTimesheetData);
    }
  }, [isEmployeeRole]);

  // Sample invoice data
  const invoiceData = [
    {
      id: "JPMC-INV-001",
      client: "JPMC",
      amount: "80,000",
      dueDate: "Due Jul 15, 2025",
      status: { label: "Pending", color: "warning" }
    },
    {
      id: "AccentureINV-002",
      client: "Accenture",
      amount: "50,000",
      dueDate: "Paid Jun 28, 2025",
      status: { label: "Paid", color: "success" }
    },
    {
      id: "VirtusaINV-003",
      client: "Virtusa",
      amount: "30,000",
      dueDate: "Due Jul 20, 2025",
      status: { label: "Pending", color: "warning" }
    },
    {
      id: "CognizantINV-004",
      client: "Cognizant",
      amount: "45,000",
      dueDate: "Due Jun 30, 2025",
      status: { label: "Overdue", color: "danger" }
    },
    {
      id: "IBMINV-005",
      client: "IBM",
      amount: "90,000",
      dueDate: "Paid Jul 5, 2025",
      status: { label: "Paid", color: "success" }
    }
  ];

  // Render dashboard content
  return (
    <div className="nk-content">
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            <div className="nk-block-head nk-block-head-sm">
              <div className="nk-block-between">
                <div className="nk-block-head-content">
                  <h3 className="nk-block-title page-title">Dashboard</h3>
                  <div className="nk-block-des text-soft">
                    <p>{isEmployeeRole ? "Your timesheet summary" : "Timesheet summary for all employees"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Stats */}
            <DashCards stats={dashStats} />

            <div className="nk-block">
              <div className="row g-gs">
                {/* Timesheet Table */}
                <div className={isEmployeeRole ? "col-xxl-12" : "col-xxl-8"}>
                  <TimesheetTable timesheetData={timesheetData} isEmployeeRole={isEmployeeRole} />
                </div>

                {!isEmployeeRole && (
                  <div className="col-xxl-4">
                    <div className="row g-gs">
                      {/* Timesheet Progress */}
                      <div className="col-xxl-12 col-md-6">
                        <TimesheetProgress stats={dashStats} />
                      </div>

                      {/* Invoice Widget - Only shown for Admin/Manager roles */}
                      <div className="col-xxl-12 col-md-6">
                        <InvoiceWidget invoiceData={invoiceData} />
                      </div>
                    </div>
                  </div>
                )}
                
                {isEmployeeRole && (
                  <div className="col-xxl-12">
                    <div className="row g-gs">
                      {/* Employee-specific widgets */}
                      <div className="col-md-6">
                        <div className="card card-bordered h-100">
                          <div className="card-inner">
                            <div className="card-title-group align-start mb-2">
                              <div className="card-title">
                                <h6 className="title">Your Hours Summary</h6>
                              </div>
                            </div>
                            <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                              <div className="nk-sale-data">
                                <span className="amount">40.0 <span className="text-success">hrs</span></span>
                                <div className="sub-title">This Week</div>
                              </div>
                              <div className="nk-sale-data">
                                <span className="amount">160.0 <span className="text-success">hrs</span></span>
                                <div className="sub-title">This Month</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        <div className="card card-bordered h-100">
                          <div className="card-inner">
                            <div className="card-title-group align-start mb-2">
                              <div className="card-title">
                                <h6 className="title">Timesheet Status</h6>
                              </div>
                            </div>
                            <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                              <div className="nk-sale-data">
                                <span className="amount text-warning">Pending</span>
                                <div className="sub-title">Current Week</div>
                              </div>
                              <div className="nk-sale-data">
                                <span className="amount text-success">Approved</span>
                                <div className="sub-title">Last Week</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="nk-block nk-block-lg">
              <div className="card card-bordered card-full">
                <div className="card-inner">
                  <div className="card-title-group">
                    <div className="card-title">
                      <h6 className="title">Upcoming Deadlines</h6>
                    </div>
                    <div className="card-tools">
                      <button className="btn btn-sm btn-primary">View Calendar</button>
                    </div>
                  </div>
                </div>
                <div className="card-inner p-0 border-top">
                  <div className="nk-tb-list nk-tb-orders">
                    <div className="nk-tb-item nk-tb-head">
                      <div className="nk-tb-col"><span>Timesheet submission deadlines</span></div>
                    </div>
                    <div className="nk-tb-item">
                      <div className="nk-tb-col">
                        <span className="tb-lead">Weekly Timesheet</span>
                        <span className="tb-sub">Due: Friday, July 18, 2025</span>
                      </div>
                    </div>
                    <div className="nk-tb-item">
                      <div className="nk-tb-col">
                        <span className="tb-lead">Monthly Summary</span>
                        <span className="tb-sub">Due: July 31, 2025</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
