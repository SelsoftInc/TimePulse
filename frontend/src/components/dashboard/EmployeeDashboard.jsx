import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { apiFetch } from "../../config/api";
import "./EmployeeDashboard.css";

// Modern TimeCard component with beautiful design
const TimeCard = ({ week, status, hours, dueDate }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case "Approved":
        return {
          class: "success",
          icon: "✓",
          color: "#10b981",
          bgColor: "rgba(16, 185, 129, 0.1)",
        };
      case "Pending":
        return {
          class: "warning",
          icon: "⏳",
          color: "#f59e0b",
          bgColor: "rgba(245, 158, 11, 0.1)",
        };
      case "Rejected":
        return {
          class: "danger",
          icon: "✗",
          color: "#ef4444",
          bgColor: "rgba(239, 68, 68, 0.1)",
        };
      case "Draft":
        return {
          class: "info",
          icon: "📝",
          color: "#3b82f6",
          bgColor: "rgba(59, 130, 246, 0.1)",
        };
      case "Missing":
        return {
          class: "danger",
          icon: "⚠",
          color: "#ef4444",
          bgColor: "rgba(239, 68, 68, 0.1)",
        };
      default:
        return {
          class: "gray",
          icon: "○",
          color: "#6b7280",
          bgColor: "rgba(107, 114, 128, 0.1)",
        };
    }
  };

  const statusConfig = getStatusConfig(status);
  const isActionable = status === "Missing" || status === "Draft";

  return (
    <div className="modern-timecard">
      <div className="timecard-header">
        <div className="timecard-week">
          <h4>Week of {week}</h4>
          <p className="timecard-due">Due: {dueDate}</p>
        </div>
        <div
          className="timecard-status"
          style={{
            backgroundColor: statusConfig.bgColor,
            color: statusConfig.color,
          }}
        >
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
          <div
            className="progress-bar"
            style={{
              width: `${Math.min((hours / 40) * 100, 100)}%`,
              backgroundColor: statusConfig.color,
            }}
          ></div>
        </div>
      </div>

      {isActionable && (
        <div className="timecard-action">
          <Link
            to={`/timesheets/submit/${week}`}
            className="btn-modern btn-primary"
          >
            {status === "Draft" ? "Continue Editing" : "Submit Timesheet"}
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
        <div
          className="stats-icon"
          style={{ backgroundColor: `${color}20`, color: color }}
        >
          {icon}
        </div>
        {trend && (
          <div className={`stats-trend ${trend.type}`}>
            <span className="trend-icon">
              {trend.type === "up" ? "↗" : "↘"}
            </span>
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
    {
      label: "Regular Hours",
      value: regularHours,
      color: "#3b82f6",
      icon: "🕒",
    },
    { label: "Overtime", value: overtimeHours, color: "#f59e0b", icon: "⏰" },
    { label: "Leave Hours", value: leaveHours, color: "#10b981", icon: "🏖️" },
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
                {totalHours > 0
                  ? Math.round((item.value / totalHours) * 100)
                  : 0}
                %
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
    switch (priority) {
      case "Critical":
        return "🚨";
      case "High":
        return "⚠️";
      case "Info":
        return "ℹ️";
      case "Success":
        return "✅";
      default:
        return "📢";
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
                    <span className="notification-date">
                      {notification.date}
                    </span>
                    <span
                      className={`notification-priority priority-${notification.priority.toLowerCase()}`}
                    >
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
const UpcomingLeave = ({ leaveRequests, user, checkPermission, currentEmployer }) => {
  const getLeaveIcon = (type) => {
    switch (type.toLowerCase()) {
      case "vacation":
        return "🏖️";
      case "sick leave":
        return "🏥";
      case "personal":
        return "👤";
      case "holiday":
        return "🎉";
      default:
        return "📅";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "#10b981";
      case "Pending":
        return "#f59e0b";
      case "Rejected":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  return (
    <div className="modern-leave-car">
      <div className="leave-header">
        <h3>Upcoming Leave</h3>
        {/* Only show Request Leave button for employees, not admins */}
        {!(
          checkPermission("admin") ||
          user?.role === "admin" ||
          currentEmployer?.role === "admin" ||
          checkPermission("approver") ||
          user?.role === "approver" ||
          currentEmployer?.role === "approver"
        ) && (
          <Link to="/dashboard" className="btn-modern btn-outline">
            + Request Leave
          </Link>
        )}
      </div>

      <div className="leave-content">
        {leaveRequests.length > 0 ? (
          <div className="leave-list">
            {leaveRequests.map((leave, index) => (
              <div key={index} className="leave-item">
                <div className="leave-icon">{getLeaveIcon(leave.type)}</div>
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
                        backgroundColor: `${getStatusColor(leave.status)}20`,
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
  const { user, checkPermission, currentEmployer } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [timesheets, setTimesheets] = useState([]);
  const [hoursData, setHoursData] = useState({
    regular: 0,
    overtime: 0,
    leave: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.tenantId || !user?.employeeId) {
        console.warn("Missing tenant ID or employee ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch dashboard data from new API endpoint
        const dashboardResponse = await apiFetch(
          `/api/employee-dashboard?employeeId=${user.employeeId}&tenantId=${user.tenantId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!dashboardResponse.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const dashboardData = await dashboardResponse.json();

        if (!dashboardData.success) {
          throw new Error(dashboardData.error || "Failed to load dashboard");
        }

        const { data } = dashboardData;

        // Transform timesheet data to match component expectations
        const transformedTimesheets = data.timesheets.recent.map((ts) => ({
          week: new Date(ts.weekStartDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          status: ts.status.charAt(0).toUpperCase() + ts.status.slice(1),
          hours: parseFloat(ts.totalHours) || 0,
          dueDate: new Date(ts.weekEndDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          weekStart: ts.weekStartDate,
          id: ts.id,
        }));

        setTimesheets(transformedTimesheets);

        // Set hours data from dashboard
        setHoursData({
          regular: data.summary.hoursThisMonth || 0,
          overtime: 0, // Can be enhanced later
          leave: 0, // Can be enhanced later
        });

        // Generate notifications based on timesheet and invoice status
        const generatedNotifications = [];

        if (data.timesheets.pending > 0) {
          generatedNotifications.push({
            title: "Pending Timesheets",
            message: `You have ${data.timesheets.pending} timesheet(s) pending approval`,
            date: new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            priority: "High",
          });
        }

        if (data.timesheets.approved > 0) {
          generatedNotifications.push({
            title: "Timesheets Approved",
            message: `${data.timesheets.approved} timesheet(s) have been approved this month`,
            date: new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            priority: "Success",
          });
        }

        if (data.invoices.overdue > 0) {
          generatedNotifications.push({
            title: "Overdue Invoices",
            message: `You have ${data.invoices.overdue} overdue invoice(s)`,
            date: new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            priority: "Critical",
          });
        }

        if (data.invoices.paid > 0) {
          generatedNotifications.push({
            title: "Invoices Paid",
            message: `${
              data.invoices.paid
            } invoice(s) paid this month - $${data.invoices.totalEarningsThisMonth.toFixed(
              2
            )}`,
            date: new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            priority: "Success",
          });
        }

        setNotifications(generatedNotifications);

        // Leave requests placeholder - can be implemented later
        setLeaveRequests([]);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast?.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.tenantId, user?.employeeId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Get Quick Actions based on user role
  const getQuickActions = () => {
    // Check role from multiple sources
    const userRole = user?.role || currentEmployer?.role;
    const isAdmin = checkPermission("admin") || userRole === "admin";
    const isApprover = checkPermission("approver") || userRole === "approver";

    if (isAdmin || isApprover) {
      // Admin/Approver Quick Actions
      return [
        {
          to: `/${subdomain}/timesheets/approval`,
          icon: "✅",
          title: "Approve Timesheet",
          description: "Review pending timesheets",
        },
        {
          to: `/${subdomain}/leave-management`,
          icon: "📋",
          title: "Approve Leave",
          description: "Review leave requests",
        },
        {
          to: `/${subdomain}/leave`,
          icon: "📅",
          title: "Upcoming Leaves",
          description: "View employee leave calendar",
        },
        {
          to: `/${subdomain}/employees`,
          icon: "👥",
          title: "Manage Employees",
          description: "Add or edit team members",
        },
      ];
    } else {
      // Employee Quick Actions
      return [
        {
          to: `/${subdomain}/timesheets/submit`,
          icon: "📝",
          title: "Submit Timesheet",
          description: "Log your hours",
        },
        {
          to: `/${subdomain}/timesheets/mobile-upload`,
          icon: "📱",
          title: "Mobile Upload",
          description: "Quick photo upload",
        },
        {
          to: `/${subdomain}/leave`,
          icon: "🏖️",
          title: "Request Leave",
          description: "Plan time off",
        },
        {
          to: `/${subdomain}/profile`,
          icon: "👤",
          title: "Update Profile",
          description: "Manage account",
        },
      ];
    }
  };

  return (
    <div className="modern-employee-dashboard">
      {/* Header Section */}
      <div className="dashboard-heade">
        <div className="header-content">
          <div className="header-info">
            <h1 className="dashboard-title">
              Welcome back, {user?.name || "Employee"}! 👋
            </h1>
            <p className="dashboard-subtitle">
              Here's what's happening with your work today
            </p>
          </div>
          <div className="header-actions">
            {/* Only show Submit Timesheet button for employees, not admins */}
            {!(
              checkPermission("admin") ||
              user?.role === "admin" ||
              currentEmployer?.role === "admin" ||
              checkPermission("approver") ||
              user?.role === "approver" ||
              currentEmployer?.role === "approver"
            ) && (
              <Link
                to={`/${subdomain}/timesheets/submit`}
                className="btn-modern btn-primary"
              >
                <span className="btn-icon">⏰</span>
                Submit Timesheet
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <StatsCard
          title="This Week"
          value={`${
            timesheets.find((t) => t.week === "Jul 24, 2025")?.hours || 0
          }h`}
          subtitle="Current week progress"
          icon="📊"
          color="#3b82f6"
          trend={{ type: "up", value: 12 }}
        />
        <StatsCard
          title="This Month"
          value={`${hoursData.regular + hoursData.overtime}h`}
          subtitle="Total hours logged"
          icon="📈"
          color="#10b981"
          trend={{ type: "up", value: 8 }}
        />
        <StatsCard
          title="Pending"
          value={timesheets.filter((t) => t.status === "Pending").length}
          subtitle="Awaiting approval"
          icon="⏳"
          color="#f59e0b"
        />
        <StatsCard
          title="Approved"
          value={timesheets.filter((t) => t.status === "Approved").length}
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
            <UpcomingLeave
              leaveRequests={leaveRequests}
              user={user}
              checkPermission={checkPermission}
              currentEmployer={currentEmployer}
            />
          </div>

          {/* Quick Actions */}
          <div className="bottom-card">
            <div className="quick-actions-card">
              <div className="actions-header">
                <h3>Quick Actions</h3>
                <p>Frequently used features</p>
              </div>
              <div className="actions-grid">
                {getQuickActions().map((action, index) => (
                  <Link key={index} to={action.to} className="action-item">
                    <div className="action-icon">{action.icon}</div>
                    <div className="action-content">
                      <h4>{action.title}</h4>
                      <p>{action.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
