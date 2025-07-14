// src/components/dashboard/Dashboard.jsx
import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PERMISSIONS } from "../../utils/roles";
import PermissionGuard from "../common/PermissionGuard";
import "./Dashboard.css";

// DashCard component - A reusable card component following DashLite styling
const DashCard = ({ title, icon, value, subtitle, trend, trendValue, trendDirection, color, onClick }) => {
  return (
    <div 
      className="card card-bordered h-100" 
      onClick={onClick} 
      style={onClick ? { cursor: 'pointer' } : {}}
    >
      <div className="card-inner">
        <div className="card-title-group align-start mb-2">
          <div className="card-title">
            <h6 className="title">{title}</h6>
            {subtitle && <p className="text-soft">{subtitle}</p>}
          </div>
          {icon && (
            <div className="card-tools">
              <em className={`card-hint icon ni ni-${icon} ${color ? `text-${color}` : ''}`}></em>
            </div>
          )}
        </div>
        <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
          <div className="nk-sale-data">
            <span className="amount">{value}</span>
            {trend && (
              <span className={`change ${trendDirection === 'up' ? 'up text-success' : 'down text-danger'}`}>
                <em className={`icon ni ni-arrow-${trendDirection}`}></em>
                {trendValue}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// StatRow component - A row of statistics cards
const StatRow = ({ stats }) => {
  return (
    <div className="row g-gs">
      {stats.map((stat, index) => (
        <div key={index} className="col-xxl-3 col-md-6">
          <DashCard {...stat} />
        </div>
      ))}
    </div>
  );
};

// TimesheetTable component - A table showing recent timesheets
const TimesheetTable = ({ timesheets }) => {
  return (
    <div className="card card-bordered card-preview">
      <div className="card-inner">
        <div className="card-title-group">
          <div className="card-title">
            <h6 className="title">Recent Timesheets</h6>
          </div>
          <div className="card-tools">
            <PermissionGuard requiredPermission={PERMISSIONS.CREATE_TIMESHEET} fallback={null}>
              <Link to="/timesheets" className="btn btn-sm btn-primary">
                <em className="icon ni ni-plus"></em>
                <span>Add New</span>
              </Link>
            </PermissionGuard>
          </div>
        </div>
      </div>
      <div className="card-inner p-0">
        <div className="nk-tb-list nk-tb-ulist">
          <div className="nk-tb-item nk-tb-head">
            <div className="nk-tb-col"><span>Employee</span></div>
            <div className="nk-tb-col tb-col-md"><span>SOW/Project</span></div>
            <div className="nk-tb-col"><span>Week</span></div>
            <div className="nk-tb-col"><span>Hours</span></div>
            <div className="nk-tb-col"><span>Status</span></div>
            <div className="nk-tb-col nk-tb-col-tools"></div>
          </div>
          
          {timesheets.map((timesheet, index) => (
            <div key={index} className="nk-tb-item">
              <div className="nk-tb-col">
                <div className="user-card">
                  <div className="user-avatar bg-primary">
                    <span>{timesheet.employee.initials}</span>
                  </div>
                  <div className="user-info">
                    <span className="tb-lead">{timesheet.employee.name} <span className="dot dot-success d-md-none ms-1"></span></span>
                    <span>{timesheet.employee.role}</span>
                  </div>
                </div>
              </div>
              <div className="nk-tb-col tb-col-md">
                <span className="tb-lead">{timesheet.project}</span>
                <span>{timesheet.client}</span>
              </div>
              <div className="nk-tb-col">
                <span>{timesheet.week}</span>
              </div>
              <div className="nk-tb-col">
                <span>{timesheet.hours}</span>
              </div>
              <div className="nk-tb-col">
                <span className={`badge badge-dot badge-${timesheet.status.color}`}>{timesheet.status.label}</span>
              </div>
              <div className="nk-tb-col nk-tb-col-tools">
                <ul className="nk-tb-actions gx-1">
                  <li>
                    <Link to="/timesheets" className="btn btn-trigger btn-icon" data-bs-toggle="tooltip" data-bs-placement="top" title="View">
                      <em className="icon ni ni-eye-fill"></em>
                    </Link>
                  </li>
                  <li>
                    <button type="button" className="btn btn-trigger btn-icon" data-bs-toggle="tooltip" data-bs-placement="top" title="Approve">
                      <em className="icon ni ni-check-fill-c"></em>
                    </button>
                  </li>
                  <li>
                    <button type="button" className="btn btn-trigger btn-icon" data-bs-toggle="tooltip" data-bs-placement="top" title="Reject">
                      <em className="icon ni ni-cross-fill"></em>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card-inner">
        <div className="card-tools">
          <ul className="pagination justify-content-center justify-content-md-start">
            <li className="page-item"><button type="button" className="page-link"><em className="icon ni ni-chevrons-left"></em></button></li>
            <li className="page-item"><button type="button" className="page-link">1</button></li>
            <li className="page-item"><button type="button" className="page-link">2</button></li>
            <li className="page-item"><span className="page-link"><em className="icon ni ni-more-h"></em></span></li>
            <li className="page-item"><button type="button" className="page-link">6</button></li>
            <li className="page-item"><button type="button" className="page-link">7</button></li>
            <li className="page-item"><button type="button" className="page-link"><em className="icon ni ni-chevrons-right"></em></button></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// TimesheetProgress component - Shows timesheet completion progress
const TimesheetProgress = ({ stats }) => {
  const weeklyPercentage = Math.min(Math.round((stats.weeklyHours / stats.weeklyTarget) * 100), 100);
  const monthlyPercentage = Math.min(Math.round((stats.monthlyHours / stats.monthlyTarget) * 100), 100);
  
  return (
    <div className="card card-bordered h-100">
      <div className="card-inner">
        <div className="card-title-group align-start mb-3">
          <div className="card-title">
            <h6 className="title">Timesheet Progress</h6>
            <p className="text-soft">Your weekly and monthly hours</p>
          </div>
          <div className="card-tools">
            <PermissionGuard requiredPermission={PERMISSIONS.CREATE_TIMESHEET} fallback={null}>
              <Link to="/timesheets" className="btn btn-sm btn-outline-primary">
                <em className="icon ni ni-clock mr-1"></em>
                <span>Log Time</span>
              </Link>
            </PermissionGuard>
          </div>
        </div>
        
        <div className="progress-list mb-3">
          <div className="progress-wrap">
            <div className="progress-text">
              <div className="progress-label">Weekly Hours</div>
              <div className="progress-amount">{stats.weeklyHours}/{stats.weeklyTarget}h</div>
            </div>
            <div className="progress progress-md">
              <div className="progress-bar" style={{ width: `${weeklyPercentage}%` }}></div>
            </div>
            <div className="progress-text mt-1">
              <div className="text-soft">{weeklyPercentage}% completed</div>
            </div>
          </div>
        </div>
        
        <div className="progress-list mb-3">
          <div className="progress-wrap">
            <div className="progress-text">
              <div className="progress-label">Monthly Hours</div>
              <div className="progress-amount">{stats.monthlyHours}/{stats.monthlyTarget}h</div>
            </div>
            <div className="progress progress-md">
              <div className="progress-bar bg-success" style={{ width: `${monthlyPercentage}%` }}></div>
            </div>
            <div className="progress-text mt-1">
              <div className="text-soft">{monthlyPercentage}% completed</div>
            </div>
          </div>
        </div>
        
        <div className="nk-order-ovwg-data">
          <div className="row g-4">
            <div className="col-6">
              <div className="amount">{stats.pendingCount + stats.approvedCount + stats.rejectedCount}</div>
              <div className="info">Total Timesheets</div>
            </div>
            <div className="col-6">
              <div className="amount text-danger">{stats.overdueCount}</div>
              <div className="info">Overdue</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// InvoiceWidget component - A widget showing invoice status
const InvoiceWidget = ({ invoices }) => {
  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const pendingAmount = invoices
    .filter(invoice => invoice.status === 'pending')
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  
  return (
    <div className="card card-bordered h-100">
      <div className="card-inner">
        <div className="card-title-group align-start mb-3">
          <div className="card-title">
            <h6 className="title">Invoice Summary</h6>
            <p className="text-soft">Overview of invoice status</p>
          </div>
          <div className="card-tools">
            <PermissionGuard requiredPermission={PERMISSIONS.CREATE_INVOICE} fallback={null}>
              <Link to="/invoices" className="btn btn-sm btn-primary">
                <em className="icon ni ni-plus"></em>
                <span>Create Invoice</span>
              </Link>
            </PermissionGuard>
          </div>
        </div>
        <div className="align-end flex-sm-wrap g-4 flex-md-nowrap mb-4">
          <div className="nk-sale-data">
            <span className="amount">${totalAmount.toLocaleString()}</span>
            <span className="sub-title">Total Invoiced</span>
          </div>
          <div className="nk-sale-data">
            <span className="amount">${pendingAmount.toLocaleString()}</span>
            <span className="sub-title">Pending</span>
          </div>
        </div>
        <div className="nk-progress-group">
          {invoices.map((invoice, index) => (
            <div key={index} className="nk-progress-item mb-3">
              <div className="d-flex justify-content-between mb-1">
                <div>
                  <span className="text-dark">{invoice.client}</span>
                  <span className="ms-2 text-soft">#{invoice.number}</span>
                </div>
                <div>
                  <span className="text-dark">${invoice.amount.toLocaleString()}</span>
                </div>
              </div>
              <div className="progress progress-md">
                <div 
                  className={`progress-bar bg-${invoice.status === 'paid' ? 'success' : invoice.status === 'pending' ? 'warning' : 'danger'}`} 
                  style={{ width: invoice.progress + '%' }}
                ></div>
              </div>
              <div className="d-flex justify-content-between mt-1">
                <span className="text-soft">{invoice.date}</span>
                <span className={`badge badge-dim badge-${invoice.status === 'paid' ? 'success' : invoice.status === 'pending' ? 'warning' : 'danger'}`}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { subdomain } = useParams();
  // Current project selection
  const [selectedProject, setSelectedProject] = useState("TimePulse Development - JPMC");

  // Sample data for timesheet summary
  const weeklyHours = {
    total: 38.5,
    max: 40
  };
  
  const monthlyHours = {
    total: 168.5,
    max: 160
  };
  
  // Timesheet status counts
  const timesheetStatus = {
    pending: 3,
    approved: 15,
    rejected: 1,
    overdue: 1
  };
  
  // Project selection options
  const projects = [
    "TimePulse Development - JPMC",
    "UI/UX Design - Accenture",
    "API Integration - Cognizant",
    "Mobile App Testing - Virtusa",
    "Cloud Migration - IBM"
  ];
  
  // Current week
  const currentWeek = "Week of July 5 - July 11, 2023";
  
  // Sample dashboard stats for the StatRow component
  const dashboardStats = [
    { title: "Total Hours", icon: "clock", value: "168.5h", subtitle: "This Month", trend: true, trendValue: "12%", trendDirection: "up", color: "primary", iconColor: "#2196F3" },
    { title: "Pending Timesheets", icon: "file-text", value: "3", subtitle: "Awaiting Approval", trend: true, trendValue: "2", trendDirection: "up", color: "warning", iconColor: "#FFC107" },
    { title: "Approved Timesheets", icon: "check-circle", value: "12", subtitle: "This Month", trend: true, trendValue: "8%", trendDirection: "up", color: "success", iconColor: "#4CAF50" },
    { 
      title: "Overdue Timesheets", 
      icon: "alert-circle", 
      value: "1", 
      subtitle: "Action Required", 
      trend: false, 
      color: "danger", 
      iconColor: "#F44336",
      onClick: () => navigate(`/${subdomain}/employees/4/invoices/overdue`)
    }
  ];
  
  // Additional timesheet statistics for detailed reporting
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

  // Sample timesheet data
  const timesheetData = [
    {
      employee: { name: "John Smith", initials: "JS", role: "Developer" },
      project: "Cloud Migration",
      client: "JPMC",
      week: "Jul 1 - Jul 7",
      hours: "40.0",
      status: { label: "Pending", color: "warning" }
    },
    {
      employee: { name: "Sarah Johnson", initials: "SJ", role: "Designer" },
      project: "Website Redesign",
      client: "Accenture",
      week: "Jul 1 - Jul 7",
      hours: "37.5",
      status: { label: "Approved", color: "success" }
    },
    {
      employee: { name: "Michael Chen", initials: "MC", role: "QA Engineer" },
      project: "Mobile App Testing",
      client: "Virtusa",
      week: "Jul 1 - Jul 7",
      hours: "42.0",
      status: { label: "Rejected", color: "danger" }
    },
    {
      employee: { name: "Emily Davis", initials: "ED", role: "Project Manager" },
      project: "ERP Implementation",
      client: "Cognizant",
      week: "Jul 1 - Jul 7",
      hours: "40.0",
      status: { label: "Approved", color: "success" }
    },
    {
      employee: { name: "Robert Wilson", initials: "RW", role: "DevOps" },
      project: "Infrastructure Setup",
      client: "IBM",
      week: "Jul 1 - Jul 7",
      hours: "45.0",
      status: { label: "Pending", color: "warning" }
    }
  ];

  // Sample invoice data
  const invoiceData = [
    {
      client: "JPMC",
      number: "INV-001",
      amount: 80000,
      date: "Due Jul 15, 2025",
      status: "pending",
      progress: 65
    },
    {
      client: "Accenture",
      number: "INV-002",
      amount: 50000,
      date: "Paid Jun 28, 2025",
      status: "paid",
      progress: 100
    },
    {
      client: "Virtusa",
      number: "INV-003",
      amount: 30000,
      date: "Due Jul 20, 2025",
      status: "pending",
      progress: 40
    },
    {
      client: "Cognizant",
      number: "INV-004",
      amount: 45000,
      date: "Due Jun 30, 2025",
      status: "pending",
      progress: 20
    },
    {
      client: "IBM",
      number: "INV-005",
      amount: 90000,
      date: "Paid Jul 5, 2025",
      status: "paid",
      progress: 100
    }
  ];

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
                    <p>Welcome to your management dashboard.</p>
                  </div>
                </div>
                <div className="nk-block-head-content">
                  <div className="toggle-wrap nk-block-tools-toggle">
                    <Link to="/timesheets" className="btn btn-primary">
                      <em className="icon ni ni-clock mr-1"></em>
                      <span>Manage Timesheets</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Timesheet Summary */}
            <div className="timesheet-summary-card">
              <h4 className="timesheet-summary-title">Timesheet Summary</h4>
              
              <div className="hours-progress-container">
                <div className="hours-section">
                  <div className="hours-label">Weekly Hours</div>
                  <div className="hours-progress">
                    <div className="progress-bar weekly" style={{ width: `${(weeklyHours.total / weeklyHours.max) * 100}%` }}></div>
                  </div>
                  <div className="hours-value">{weeklyHours.total}/{weeklyHours.max}h</div>
                </div>
                
                <div className="hours-section">
                  <div className="hours-label">Monthly Hours</div>
                  <div className="hours-progress">
                    <div className="progress-bar monthly" style={{ width: `${(monthlyHours.total / monthlyHours.max) * 100}%` }}></div>
                  </div>
                  <div className="hours-value">{monthlyHours.total}/{monthlyHours.max}h</div>
                </div>
              </div>
              
              <div className="timesheet-status-grid">
                <div className="status-item pending">
                  <div className="status-label">Pending</div>
                  <div className="status-count">{timesheetStatus.pending}</div>
                  <div className="status-label-small">Timesheets</div>
                </div>
                
                <div className="status-item approved">
                  <div className="status-label">Approved</div>
                  <div className="status-count">{timesheetStatus.approved}</div>
                  <div className="status-label-small">Timesheets</div>
                </div>
                
                <div className="status-item rejected">
                  <div className="status-label">Rejected</div>
                  <div className="status-count">{timesheetStatus.rejected}</div>
                  <div className="status-label-small">Timesheets</div>
                </div>
                
                <div 
                  className="status-item overdue" 
                  onClick={() => navigate(`/${subdomain}/employees/4/invoices/overdue`)}
                  style={{ cursor: 'pointer' }}
                  title="Click to view overdue timesheet details"
                >
                  <div className="status-label">Overdue</div>
                  <div className="status-count">{timesheetStatus.overdue}</div>
                  <div className="status-label-small">Timesheets</div>
                </div>
              </div>
            </div>
            
            {/* Project Selection */}
            <div className="project-selection-card">
              <div className="project-selection-header">
                <h4 className="project-selection-title">Project Selection</h4>
                <div className="project-selection-subtitle">Select the project for this timesheet</div>
              </div>
              
              <div className="project-select-container">
                <select 
                  className="project-select" 
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                >
                  {projects.map((project, index) => (
                    <option key={index} value={project}>{project}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Week Selection */}
            <div className="week-selection-card">
              <div className="week-header">
                <h4 className="week-title">{currentWeek}</h4>
                <div className="week-draft-indicator">Draft</div>
              </div>
            </div>
            
            {/* Timesheet Entry would go here */}
            
            {/* Quick Tips */}
            <div className="quick-tips-card">
              <h4 className="quick-tips-title">Quick Tips</h4>
              
              <div className="tips-container">
                <div className="tip-item">
                  <div className="tip-highlight"></div>
                  <div className="tip-content">
                    <div className="tip-header">Timesheet Submission</div>
                    <div className="tip-text">Submit your timesheet weekly by Sunday 11:59 PM to ensure timely processing.</div>
                  </div>
                </div>
                
                <ul className="tip-list">
                  <li>Enter time in 0.5 hour increments</li>
                  <li>Don't forget to select the correct project</li>
                  <li>Add notes for any unusual time entries</li>
                </ul>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="nk-block">
              <StatRow stats={dashboardStats} />
            </div>
            
            {/* Main Content Area */}
            <div className="nk-block nk-block-lg">
              <div className="row g-gs">
                {/* Timesheet Table - Takes 2/3 width on large screens */}
                <div className="col-xxl-8">
                  <TimesheetTable timesheets={timesheetData} />
                </div>
                
                {/* Timesheet Progress - Takes 1/3 width on large screens */}
                <div className="col-xxl-4">
                  <TimesheetProgress stats={timesheetStats} />
                </div>
                
                {/* Invoice Widget - Takes full width */}
                <div className="col-12 mt-3">
                  <InvoiceWidget invoices={invoiceData} />
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines Section */}
            <div className="nk-block nk-block-lg">
              <div className="card card-bordered">
                <div className="card-inner">
                  <div className="card-title-group align-start mb-3">
                    <div className="card-title">
                      <h6 className="title">Upcoming Deadlines</h6>
                      <p className="text-soft">Timesheet and invoice submission deadlines</p>
                    </div>
                    <div className="card-tools">
                      <button type="button" className="btn btn-sm btn-outline-light">
                        <em className="icon ni ni-calendar"></em>
                        <span>View Calendar</span>
                      </button>
                    </div>
                  </div>
                  <div className="timeline-list">
                    <div className="timeline-item" style={{ 
                      borderLeft: '4px solid #f44336', 
                      padding: '10px 15px', 
                      marginBottom: '15px', 
                      backgroundColor: '#ffebee', 
                      borderRadius: '4px', 
                      display: 'flex',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{ width: '75%' }}>
                        <h6 className="timeline-title" style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Weekly Timesheet Submission</h6>
                        <p style={{ margin: '0' }}>All employee timesheets due tomorrow at 5:00 PM</p>
                      </div>
                      <div style={{ 
                        position: 'absolute', 
                        right: '15px', 
                        top: '10px', 
                        textAlign: 'right',
                        width: '25%'
                      }}>
                        <div className="timeline-date" style={{ marginBottom: '5px' }}>July 5, 2025</div>
                        <div className="timeline-status" style={{ color: '#f44336', fontWeight: 'bold' }}>Critical</div>
                      </div>
                    </div>
                    
                    <div className="timeline-item" style={{ 
                      borderLeft: '4px solid #ff9800', 
                      padding: '10px 15px', 
                      marginBottom: '15px', 
                      backgroundColor: '#fff8e1', 
                      borderRadius: '4px', 
                      display: 'flex',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{ width: '75%' }}>
                        <h6 className="timeline-title" style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Monthly Invoice Generation</h6>
                        <p style={{ margin: '0' }}>Generate and send client invoices by July 10, 2025</p>
                      </div>
                      <div style={{ 
                        position: 'absolute', 
                        right: '15px', 
                        top: '10px', 
                        textAlign: 'right',
                        width: '25%'
                      }}>
                        <div className="timeline-date" style={{ marginBottom: '5px' }}>July 10, 2025</div>
                        <div className="timeline-status" style={{ color: '#ff9800', fontWeight: 'bold' }}>Important</div>
                      </div>
                    </div>
                    
                    <div className="timeline-item" style={{ 
                      borderLeft: '4px solid #00bcd4', 
                      padding: '10px 15px', 
                      marginBottom: '15px', 
                      backgroundColor: '#e0f7fa', 
                      borderRadius: '4px', 
                      display: 'flex',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{ width: '75%' }}>
                        <h6 className="timeline-title" style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Vendor Payment Processing</h6>
                        <p style={{ margin: '0' }}>Process vendor payments for approved timesheets by July 15, 2025</p>
                      </div>
                      <div style={{ 
                        position: 'absolute', 
                        right: '15px', 
                        top: '10px', 
                        textAlign: 'right',
                        width: '25%'
                      }}>
                        <div className="timeline-date" style={{ marginBottom: '5px' }}>July 15, 2025</div>
                        <div className="timeline-status" style={{ color: '#00bcd4', fontWeight: 'bold' }}>Scheduled</div>
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
