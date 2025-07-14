import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Dashboard.css';

// TimeCard component - Shows weekly timesheet status
const TimeCard = ({ week, status, hours, dueDate, onSubmit }) => {
  const getStatusClass = (status) => {
    switch(status) {
      case "Approved": return "success";
      case "Pending": return "warning";
      case "Rejected": return "danger";
      case "Draft": return "gray";
      case "Missing": return "danger";
      case "Overdue": return "danger";
      default: return "gray";
    }
  };

  const isActionable = status === 'Missing' || status === 'Draft' || status === 'Overdue';
  const isPastDue = new Date(dueDate) < new Date();
  
  return (
    <div className="card card-bordered h-100">
      <div className="card-inner">
        <div className="card-title-group align-start mb-2">
          <div className="card-title">
            <h6 className="title">Week of {week}</h6>
            {isPastDue && status !== 'Approved' && status !== 'Pending' && (
              <span className="badge badge-dim badge-danger ms-1">Past Due</span>
            )}
          </div>
          <div className="card-tools">
            <span className={`badge badge-dot badge-${getStatusClass(status)}`}>{status}</span>
          </div>
        </div>
        
        <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
          <div className="nk-sale-data">
            <span className="amount">{hours} hrs</span>
          </div>
        </div>
        
        <div className="mt-3">
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-soft">Due: {dueDate}</span>
            {isActionable && (
              <Link to={`/timesheets/submit/${week}`} className="btn btn-sm btn-primary">
                {status === 'Draft' ? 'Continue' : 'Submit'}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// HoursChart component - Shows hours breakdown
const HoursChart = ({ regularHours, overtimeHours, leaveHours }) => {
  const totalHours = regularHours + overtimeHours + leaveHours;
  const regularPercent = totalHours > 0 ? (regularHours / totalHours) * 100 : 0;
  const overtimePercent = totalHours > 0 ? (overtimeHours / totalHours) * 100 : 0;
  const leavePercent = totalHours > 0 ? (leaveHours / totalHours) * 100 : 0;
  
  return (
    <div className="card card-bordered h-100">
      <div className="card-inner">
        <div className="card-title-group align-start mb-3">
          <div className="card-title">
            <h6 className="title">Hours Breakdown</h6>
            <p className="text-soft">Current Month</p>
          </div>
        </div>
        
        <div className="nk-ck-sm">
          {/* Simple chart visualization */}
          <div className="hours-chart">
            <div className="progress mb-4" style={{ height: '20px' }}>
              <div 
                className="progress-bar bg-primary" 
                role="progressbar" 
                style={{ width: `${regularPercent}%` }} 
                aria-valuenow={regularPercent} 
                aria-valuemin="0" 
                aria-valuemax="100"
              >
                {regularHours}h
              </div>
              <div 
                className="progress-bar bg-warning" 
                role="progressbar" 
                style={{ width: `${overtimePercent}%` }} 
                aria-valuenow={overtimePercent} 
                aria-valuemin="0" 
                aria-valuemax="100"
              >
                {overtimeHours}h
              </div>
              <div 
                className="progress-bar bg-info" 
                role="progressbar" 
                style={{ width: `${leavePercent}%` }} 
                aria-valuenow={leavePercent} 
                aria-valuemin="0" 
                aria-valuemax="100"
              >
                {leaveHours}h
              </div>
            </div>
            
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color bg-primary"></div>
                <div className="legend-text">Regular: {regularHours} hrs</div>
              </div>
              <div className="legend-item">
                <div className="legend-color bg-warning"></div>
                <div className="legend-text">Overtime: {overtimeHours} hrs</div>
              </div>
              <div className="legend-item">
                <div className="legend-color bg-info"></div>
                <div className="legend-text">Leave: {leaveHours} hrs</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// NotificationList component - Shows alerts and reminders
const NotificationList = ({ notifications }) => {
  return (
    <div className="card card-bordered h-100">
      <div className="card-inner border-bottom">
        <div className="card-title-group">
          <div className="card-title">
            <h6 className="title">Notifications & Alerts</h6>
          </div>
        </div>
      </div>
      <div className="card-inner">
        <div className="timeline">
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <div 
                key={index} 
                className="timeline-item" 
                style={{ 
                  borderLeft: `4px solid ${notification.color}`, 
                  padding: '10px 15px', 
                  marginBottom: '15px', 
                  backgroundColor: notification.bgColor, 
                  borderRadius: '4px', 
                  display: 'flex',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ width: '75%' }}>
                  <h6 className="timeline-title" style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                    {notification.title}
                  </h6>
                  <p style={{ margin: '0' }}>{notification.message}</p>
                </div>
                <div style={{ 
                  position: 'absolute', 
                  right: '15px', 
                  top: '10px', 
                  textAlign: 'right',
                  width: '25%'
                }}>
                  <div className="timeline-date" style={{ marginBottom: '5px' }}>{notification.date}</div>
                  <div className="timeline-status" style={{ color: notification.color, fontWeight: 'bold' }}>
                    {notification.priority}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <em className="icon ni ni-check-circle-fill text-success" style={{ fontSize: '2rem' }}></em>
              <p className="mt-2">You're all caught up!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// UpcomingLeave component - Shows upcoming leave/vacation
const UpcomingLeave = ({ leaveRequests }) => {
  return (
    <div className="card card-bordered h-100">
      <div className="card-inner border-bottom">
        <div className="card-title-group">
          <div className="card-title">
            <h6 className="title">Upcoming Leave</h6>
          </div>
          <div className="card-tools">
            <Link to={`/${useParams().subdomain}/leave`} className="link">Manage Leave</Link>
          </div>
        </div>
      </div>
      <div className="card-inner">
        {leaveRequests.length > 0 ? (
          <ul className="nk-schedule">
            {leaveRequests.map((leave, index) => (
              <li key={index} className="nk-schedule-item">
                <div className="nk-schedule-item-inner">
                  <div className={`nk-schedule-symbol bg-${leave.status === 'Approved' ? 'success' : leave.status === 'Pending' ? 'warning' : 'danger'}`}></div>
                  <div className="nk-schedule-content">
                    <div className="nk-schedule-title">{leave.type}</div>
                    <div className="nk-schedule-date">{leave.startDate} to {leave.endDate}</div>
                    <div className="nk-schedule-status">
                      <span className={`badge badge-dim badge-${leave.status === 'Approved' ? 'success' : leave.status === 'Pending' ? 'warning' : 'danger'}`}>
                        {leave.status}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-4">
            <p>No upcoming leave requests</p>
            <Link to="/leave/request" className="btn btn-outline-primary btn-sm">
              Request Leave
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

// Main EmployeeDashboard component
const EmployeeDashboard = () => {
  const { subdomain } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timesheets, setTimesheets] = useState([]);
  const [hoursData, setHoursData] = useState({ regular: 0, overtime: 0, leave: 0 });
  const [notifications, setNotifications] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  
  useEffect(() => {
    // In a real app, fetch data from API
    // For now, using mock data
    const loadDashboardData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock timesheet data
        const mockTimesheets = [
          { 
            week: 'Jul 3, 2025', 
            status: 'Approved', 
            hours: 40, 
            dueDate: '2025-07-03'
          },
          { 
            week: 'Jul 10, 2025', 
            status: 'Pending', 
            hours: 42, 
            dueDate: '2025-07-10'
          },
          { 
            week: 'Jul 17, 2025', 
            status: 'Missing', 
            hours: 0, 
            dueDate: '2025-07-17'
          },
          { 
            week: 'Jul 24, 2025', 
            status: 'Draft', 
            hours: 16, 
            dueDate: '2025-07-24'
          }
        ];
        
        // Mock hours data
        const mockHoursData = {
          regular: 160,
          overtime: 12,
          leave: 8
        };
        
        // Mock notifications
        const mockNotifications = [
          {
            title: 'Missing Timesheet',
            message: 'You have not submitted your timesheet for the week of Jul 17, 2025',
            date: 'Jul 17, 2025',
            priority: 'Critical',
            color: '#f44336',
            bgColor: '#ffebee'
          },
          {
            title: 'Timesheet Approved',
            message: 'Your timesheet for the week of Jul 3, 2025 has been approved',
            date: 'Jul 5, 2025',
            priority: 'Info',
            color: '#4caf50',
            bgColor: '#e8f5e9'
          },
          {
            title: 'Upcoming Holiday',
            message: 'Independence Day (July 4) is an upcoming company holiday',
            date: 'Jul 4, 2025',
            priority: 'Info',
            color: '#2196f3',
            bgColor: '#e3f2fd'
          }
        ];
        
        // Mock leave requests
        const mockLeaveRequests = [
          {
            type: 'Vacation',
            startDate: 'Jul 20, 2025',
            endDate: 'Jul 24, 2025',
            status: 'Approved',
            days: 5
          },
          {
            type: 'Sick Leave',
            startDate: 'Aug 5, 2025',
            endDate: 'Aug 5, 2025',
            status: 'Pending',
            days: 1
          }
        ];
        
        setTimesheets(mockTimesheets);
        setHoursData(mockHoursData);
        setNotifications(mockNotifications);
        setLeaveRequests(mockLeaveRequests);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);
  
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
                  <p className="mt-3">Loading your dashboard...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="nk-content">
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            <div className="nk-block-head nk-block-head-sm">
              <div className="nk-block-between">
                <div className="nk-block-head-content">
                  <h3 className="nk-block-title page-title">Employee Dashboard</h3>
                  <div className="nk-block-des text-soft">
                    <p>Welcome back, {user?.name || 'Employee'}</p>
                  </div>
                </div>
                <div className="nk-block-head-content">
                  <div className="toggle-wrap nk-block-tools-toggle">
                    <div className="toggle-expand-content">
                      <ul className="nk-block-tools g-3">
                        <li className="nk-block-tools-opt">
                          <Link to={`/${subdomain}/timesheets/submit`} className="btn btn-primary">
                            <em className="icon ni ni-plus"></em>
                            <span>Submit Timesheet</span>
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="nk-block">
              <div className="row g-gs">
                <div className="col-lg-8">
                  <div className="card card-bordered h-100">
                    <div className="card-inner">
                      <div className="card-title-group align-start mb-3">
                        <div className="card-title">
                          <h6 className="title">Timesheet Status</h6>
                        </div>
                      </div>
                      
                      <div className="row g-3">
                        {timesheets.map((timesheet, index) => (
                          <div key={index} className="col-md-6">
                            <TimeCard {...timesheet} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-lg-4">
                  <NotificationList notifications={notifications} />
                </div>
                
                <div className="col-lg-8">
                  <div className="row g-gs">
                    <div className="col-md-6">
                      <HoursChart 
                        regularHours={hoursData.regular} 
                        overtimeHours={hoursData.overtime} 
                        leaveHours={hoursData.leave} 
                      />
                    </div>
                    <div className="col-md-6">
                      <UpcomingLeave leaveRequests={leaveRequests} />
                    </div>
                  </div>
                </div>
                
                <div className="col-lg-4">
                  <div className="card card-bordered h-100">
                    <div className="card-inner border-bottom">
                      <div className="card-title-group">
                        <div className="card-title">
                          <h6 className="title">Quick Actions</h6>
                        </div>
                      </div>
                    </div>
                    <div className="card-inner">
                      <ul className="link-list-menu">
                        <li>
                          <Link to={`/${subdomain}/timesheets/submit`}>
                            <em className="icon ni ni-file-text"></em>
                            <span>Submit Timesheet</span>
                          </Link>
                        </li>
                        <li>
                          <Link to={`/${subdomain}/timesheets/mobile-upload`}>
                            <em className="icon ni ni-mobile"></em>
                            <span>Quick Upload (Mobile)</span>
                          </Link>
                        </li>
                        <li>
                          <Link to={`/${subdomain}/timesheets/history`}>
                            <em className="icon ni ni-history"></em>
                            <span>View Timesheet History</span>
                          </Link>
                        </li>
                        <li>
                          <Link to={`/${subdomain}/leave`}>
                            <em className="icon ni ni-calendar"></em>
                            <span>Leave Management</span>
                          </Link>
                        </li>
                        <li>
                          <Link to={`/${subdomain}/profile`}>
                            <em className="icon ni ni-user"></em>
                            <span>Update Profile</span>
                          </Link>
                        </li>
                        <li>
                          <Link to={`/${subdomain}/documents`}>
                            <em className="icon ni ni-files"></em>
                            <span>My Documents</span>
                          </Link>
                        </li>
                      </ul>
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

export default EmployeeDashboard;
