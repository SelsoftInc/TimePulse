import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './EmployeeDashboard.css';

// Modern TimeCard component with beautiful design
const TimeCard = ({ week, status, hours, dueDate }) => {
  const getStatusConfig = (status) => {
    switch(status) {
      case "Approved": return { 
        class: "success", 
        icon: "✓", 
        color: "#10b981",
        bgColor: "rgba(16, 185, 129, 0.1)"
      };
      case "Pending": return { 
        class: "warning", 
        icon: "⏳", 
        color: "#f59e0b",
        bgColor: "rgba(245, 158, 11, 0.1)"
      };
      case "Rejected": return { 
        class: "danger", 
        icon: "✗", 
        color: "#ef4444",
        bgColor: "rgba(239, 68, 68, 0.1)"
      };
      case "Draft": return { 
        class: "info", 
        icon: "📝", 
        color: "#3b82f6",
        bgColor: "rgba(59, 130, 246, 0.1)"
      };
      case "Missing": return { 
        class: "danger", 
        icon: "⚠", 
        color: "#ef4444",
        bgColor: "rgba(239, 68, 68, 0.1)"
      };
      default: return { 
        class: "gray", 
        icon: "○", 
        color: "#6b7280",
        bgColor: "rgba(107, 114, 128, 0.1)"
      };
    }
  };

  const statusConfig = getStatusConfig(status);
  const isActionable = status === 'Missing' || status === 'Draft';
  
  return (
    <div className="modern-timecard">
      <div className="timecard-header">
        <div className="timecard-week">
          <h4>Week of {week}</h4>
          <p className="timecard-due">Due: {dueDate}</p>
        </div>
        <div className="timecard-status" style={{ 
          backgroundColor: statusConfig.bgColor,
          color: statusConfig.color 
        }}>
          <span className="status-icon">{statusConfig.icon}</span>
          <span className="status-text">{status}</span>
        </div>
      </div>
      
      <div className="timecard-hours">
        <div className="hours-display">
          <span className="hours-number">{hours}</span>
          <span className="hours-label">hours</span>
        </div>
        
        <div className="hours-progress">
          <div className="progress-bar" style={{
            width: `${Math.min((hours / 40) * 100, 100)}%`,
            backgroundColor: statusConfig.color
          }}></div>
        </div>
      </div>
      
      {isActionable && (
        <div className="timecard-action">
          <Link 
            to={`/timesheets/submit/${week}`} 
            className="btn-modern btn-primary"
          >
            {status === 'Draft' ? 'Continue Editing' : 'Submit Timesheet'}
          </Link>
        </div>
      )}
    </div>
  );
};

// Modern Statistics Cards
const StatsCard = ({ title, value, subtitle, icon, color, trend }) => {
  return (
    <div className="stats-card">
      <div className="stats-header">
        <div className="stats-icon" style={{ backgroundColor: `${color}20`, color: color }}>
          {icon}
        </div>
        {trend && (
          <div className={`stats-trend ${trend.type}`}>
            <span className="trend-icon">{trend.type === 'up' ? '↗' : '↘'}</span>
            <span className="trend-value">{trend.value}%</span>
          </div>
        )}
      </div>
      <div className="stats-content">
        <h3 className="stats-value">{value}</h3>
        <p className="stats-title">{title}</p>
        {subtitle && <p className="stats-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
};

// Modern Hours Chart component
const HoursChart = ({ regularHours, overtimeHours, leaveHours }) => {
  const totalHours = regularHours + overtimeHours + leaveHours;
  
  const chartData = [
    { label: 'Regular Hours', value: regularHours, color: '#3b82f6', icon: '🕒' },
    { label: 'Overtime', value: overtimeHours, color: '#f59e0b', icon: '⏰' },
    { label: 'Leave Hours', value: leaveHours, color: '#10b981', icon: '🏖️' }
  ];
  
  return (
    <div className="modern-chart-card">
      <div className="chart-header">
        <h3>Hours Breakdown</h3>
        <p>Current Month • {totalHours} total hours</p>
      </div>
      
      <div className="chart-content">
        <div className="chart-visual">
          <div className="donut-chart">
            <div className="donut-center">
              <span className="donut-total">{totalHours}</span>
              <span className="donut-label">Hours</span>
            </div>
          </div>
        </div>
        
        <div className="chart-legend-modern">
          {chartData.map((item, index) => (
            <div key={index} className="legend-item-modern">
              <div className="legend-indicator">
                <span className="legend-icon">{item.icon}</span>
                <div 
                  className="legend-dot" 
                  style={{ backgroundColor: item.color }}
                ></div>
              </div>
              <div className="legend-details">
                <span className="legend-label">{item.label}</span>
                <span className="legend-value">{item.value}h</span>
              </div>
              <div className="legend-percentage">
                {totalHours > 0 ? Math.round((item.value / totalHours) * 100) : 0}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Modern NotificationList component
const NotificationList = ({ notifications }) => {
  const getNotificationIcon = (priority) => {
    switch(priority) {
      case 'Critical': return '🚨';
      case 'High': return '⚠️';
      case 'Info': return 'ℹ️';
      case 'Success': return '✅';
      default: return '📢';
    }
  };

  return (
    <div className="modern-notifications-card">
      <div className="notifications-header">
        <h3>Recent Activity</h3>
        <span className="notifications-count">{notifications.length}</span>
      </div>
      
      <div className="notifications-conten">
        {notifications.length > 0 ? (
          <div className="notifications-list">
            {notifications.map((notification, index) => (
              <div key={index} className="notification-item">
                <div className="notification-icon">
                  {getNotificationIcon(notification.priority)}
                </div>
                <div className="notification-content">
                  <h4 className="notification-title">{notification.title}</h4>
                  <p className="notification-message">{notification.message}</p>
                  <div className="notification-meta">
                    <span className="notification-date">{notification.date}</span>
                    <span className={`notification-priority priority-${notification.priority.toLowerCase()}`}>
                      {notification.priority}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="notifications-empty">
            <div className="empty-icon">🎉</div>
            <h4>All caught up!</h4>
            <p>No new notifications</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Modern UpcomingLeave component
const UpcomingLeave = ({ leaveRequests }) => {
  const getLeaveIcon = (type) => {
    switch(type.toLowerCase()) {
      case 'vacation': return '🏖️';
      case 'sick leave': return '🏥';
      case 'personal': return '👤';
      case 'holiday': return '🎉';
      default: return '📅';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Approved': return '#10b981';
      case 'Pending': return '#f59e0b';
      case 'Rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="modern-leave-car">
      <div className="leave-header">
        <h3>Upcoming Leave</h3>
        <Link to="/dashboard" className="btn-modern btn-outline">
          + Request Leave
        </Link>
      </div>
      
      <div className="leave-content">
        {leaveRequests.length > 0 ? (
          <div className="leave-list">
            {leaveRequests.map((leave, index) => (
              <div key={index} className="leave-item">
                <div className="leave-icon">
                  {getLeaveIcon(leave.type)}
                </div>
                <div className="leave-details">
                  <h4 className="leave-type">{leave.type}</h4>
                  <p className="leave-dates">
                    {leave.startDate} - {leave.endDate}
                  </p>
                  <div className="leave-meta">
                    <span className="leave-days">{leave.days} days</span>
                    <span 
                      className="leave-status"
                      style={{ 
                        color: getStatusColor(leave.status),
                        backgroundColor: `${getStatusColor(leave.status)}20`
                      }}
                    >
                      {leave.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="leave-empty">
            <div className="empty-icon">🌴</div>
            <h4>No upcoming leave</h4>
            <p>Plan your time off</p>
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
      <div className="employee-dashboard">
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
      </div>
    );
  }
  
  return (
    <div className="modern-employee-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-info">
            <h1 className="dashboard-title">Welcome back, {user?.name || 'Employee'}! 👋</h1>
            <p className="dashboard-subtitle">Here's what's happening with your work today</p>
          </div>
          <div className="header-actions">
            <Link to={`/${subdomain}/timesheets/submit`} className="btn-modern btn-primary">
              <span className="btn-icon">⏰</span>
              Submit Timesheet
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <StatsCard 
          title="This Week"
          value={`${timesheets.find(t => t.week === 'Jul 24, 2025')?.hours || 0}h`}
          subtitle="Current week progress"
          icon="📊"
          color="#3b82f6"
          trend={{ type: 'up', value: 12 }}
        />
        <StatsCard 
          title="This Month"
          value={`${hoursData.regular + hoursData.overtime}h`}
          subtitle="Total hours logged"
          icon="📈"
          color="#10b981"
          trend={{ type: 'up', value: 8 }}
        />
        <StatsCard 
          title="Pending"
          value={timesheets.filter(t => t.status === 'Pending').length}
          subtitle="Awaiting approval"
          icon="⏳"
          color="#f59e0b"
        />
        <StatsCard 
          title="Approved"
          value={timesheets.filter(t => t.status === 'Approved').length}
          subtitle="This month"
          icon="✅"
          color="#10b981"
        />
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Timesheet Status Section */}
        <div className="dashboard-section timesheet-section">
          <div className="section-header">
            <h2>Recent Timesheets</h2>
            <Link to={`/${subdomain}/dashboard`} className="section-link">
              View All →
            </Link>
          </div>
          <div className="timesheets-grid">
            {timesheets.map((timesheet, index) => (
              <TimeCard key={index} {...timesheet} />
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="dashboard-sidebar">
          {/* Hours Chart */}
          <HoursChart 
            regularHours={hoursData.regular} 
            overtimeHours={hoursData.overtime} 
            leaveHours={hoursData.leave} 
          />
          
          {/* Notifications */}
          <NotificationList notifications={notifications} />
        </div>

        {/* Bottom Section */}
        <div className="dashboard-bottom">
          {/* Upcoming Leave */}
          <div className="bottom-card">
            <UpcomingLeave leaveRequests={leaveRequests} />
          </div>
          
          {/* Quick Actions */}
          <div className="bottom-card">
            <div className="quick-actions-card">
              <div className="actions-header">
                <h3>Quick Actions</h3>
                <p>Frequently used features</p>
              </div>
              <div className="actions-grid">
                <Link to={`/${subdomain}/timesheets/submit`} className="action-item">
                  <div className="action-icon">📝</div>
                  <div className="action-content">
                    <h4>Submit Timesheet</h4>
                    <p>Log your hours</p>
                  </div>
                </Link>
                <Link to={`/${subdomain}/timesheets/mobile-upload`} className="action-item">
                  <div className="action-icon">📱</div>
                  <div className="action-content">
                    <h4>Mobile Upload</h4>
                    <p>Quick photo upload</p>
                  </div>
                </Link>
                <Link to={`/${subdomain}/leave`} className="action-item">
                  <div className="action-icon">🏖️</div>
                  <div className="action-content">
                    <h4>Request Leave</h4>
                    <p>Plan time off</p>
                  </div>
                </Link>
                <Link to={`/${subdomain}/profile`} className="action-item">
                  <div className="action-icon">👤</div>
                  <div className="action-content">
                    <h4>Update Profile</h4>
                    <p>Manage account</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
