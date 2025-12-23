'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiFetch } from '@/config/api';
import "./EmployeeDashboard.css";

// Modern TimeCard component with beautiful design
const TimeCard = ({ week, status, hours, dueDate, subdomain }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case "Approved":
        return {
          class: "success",
          icon: "✓",
          color: "#10b981",
          bgColor: "rgba(16, 185, 129, 0.1)"};
      case "Pending":
        return {
          class: "warning",
          icon: "⏳",
          color: "#f59e0b",
          bgColor: "rgba(245, 158, 11, 0.1)"};
      case "Rejected":
        return {
          class: "danger",
          icon: "✗",
          color: "#ef4444",
          bgColor: "rgba(239, 68, 68, 0.1)"};
      case "Draft":
        return {
          class: "info",
          icon: "📝",
          color: "#3b82f6",
          bgColor: "rgba(59, 130, 246, 0.1)"};
      case "Missing":
        return {
          class: "danger",
          icon: "⚠",
          color: "#ef4444",
          bgColor: "rgba(239, 68, 68, 0.1)"};
      default:
        return {
          class: "gray",
          icon: "○",
          color: "#6b7280",
          bgColor: "rgba(107, 114, 128, 0.1)"};
    }
  };

  const statusConfig = getStatusConfig(status);
  const isActionable = status === "Missing" || status === "Draft";

  return (
    <div className="modern-timecard group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="timecard-header">
        <div className="timecard-week">
          <h4 className="text-[15px] font-semibold text-slate-900">Week of {week}</h4>
          <p className="timecard-due">Due: {dueDate}</p>
        </div>
        <div
          className="timecard-status inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            backgroundColor: statusConfig.bgColor,
            color: statusConfig.color}}
        >
          <span className="status-icon">{statusConfig.icon}</span>
          <span className="status-text">{status}</span>
        </div>
      </div>

      <div className="timecard-hours">
        <div className="hours-display">
          <span className="hours-number text-2xl font-bold tracking-tight text-slate-900">{hours}</span>
          <span className="hours-label">hours</span>
        </div>

        <div className="hours-progress">
          <div
            className="progress-bar"
            style={{
              width: `${Math.min((hours / 40) * 100, 100)}%`,
              backgroundColor: statusConfig.color}}
          ></div>
        </div>
      </div>

      {isActionable && subdomain && (
        <div className="timecard-action">
          <Link href={`/${subdomain}/timesheets/submit`}
            className="btn-modern btn-primary inline-flex w-full items-center justify-center rounded-xl"
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
    <div className="stats-card flex h-full flex-col justify-between rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="stats-header">
        <div
          className="stats-icon inline-flex h-11 w-11 items-center justify-center rounded-xl text-lg"
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
        <h3 className="stats-value text-3xl font-bold tracking-tight text-slate-900">{value}</h3>
        <p className="stats-title mt-1 text-sm font-semibold text-slate-700">{title}</p>
        {subtitle && <p className="stats-subtitle mt-1 text-xs text-slate-500">{subtitle}</p>}
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
      icon: "🕒"},
    { label: "Overtime", value: overtimeHours, color: "#f59e0b", icon: "⏰" },
    { label: "Leave Hours", value: leaveHours, color: "#10b981", icon: "🏖️" },
  ];

  return (
    <div className="modern-chart-card rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur">
      <div className="chart-header">
        <h3 className="text-base font-semibold text-slate-900">Hours Breakdown</h3>
        <p className="mt-1 text-xs text-slate-500">Current Month • {totalHours} total hours</p>
      </div>

      <div className="chart-content">
        <div className="chart-visual">
          <div className="donut-chart mx-auto">
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
    <div className="modern-notifications-card rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur">
      <div className="notifications-header">
        <h3 className="text-base font-semibold text-slate-900">Recent Activity</h3>
        <span className="notifications-count">{notifications.length}</span>
      </div>

      <div className="notifications-conten mt-4">
        {notifications.length > 0 ? (
          <div className="notifications-list space-y-3">
            {notifications.map((notification, index) => (
              <div key={index} className="notification-item rounded-xl border border-slate-200/60 bg-white/60 p-3 transition-colors hover:bg-white/80">
                <div className="notification-icon flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg">
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
          <div className="notifications-empty rounded-xl border border-dashed border-slate-200 bg-white/50 p-6 text-center">
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
const UpcomingLeave = ({
  leaveRequests,
  user,
  checkPermission,
  currentEmployer}) => {
  const getLeaveIcon = (type) => {
    switch (type.toLowerCase()) {
      case "vacation":
        return "🏖️";
      case "sick":
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
    <div className="modern-leave-car rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur">
      <div className="leave-header">
        <h3 className="text-base font-semibold text-slate-900">Upcoming Leave</h3>
        {/* Only show Request Leave button for employees, not admins */}
        {!(
          checkPermission("admin") ||
          user?.role === "admin" ||
          currentEmployer?.role === "admin" ||
          checkPermission("approver") ||
          user?.role === "approver" ||
          currentEmployer?.role === "approver"
        ) && (
          <Link href="/leave-management" className="btn-modern btn-outline inline-flex items-center justify-center rounded-xl">
            + Request Leave
          </Link>
        )}
      </div>

      <div className="leave-content mt-4">
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
                      className="leave-status inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        color: getStatusColor(leave.status),
                        backgroundColor: `${getStatusColor(leave.status)}20`}}
                    >
                      {leave.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="leave-empty rounded-xl border border-dashed border-slate-200 bg-white/50 p-6 text-center">
            <div className="empty-icon">🌴</div>
            <h4>No upcoming leave</h4>
            <p>Plan your time off</p>
          </div>
        )}
      </div>
    </div>
  );
};

const EmployeeDashboard = () => {
  const { subdomain } = useParams();
  const { user, checkPermission, currentEmployer } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [timesheets, setTimesheets] = useState([]);
  const [hoursData, setHoursData] = useState({
    regular: 0,
    overtime: 0,
    leave: 0});
  const [notifications, setNotifications] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);

  // Hydration fix: Track if component is mounted on client
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
              Authorization: `Bearer ${localStorage.getItem("token")}`}}
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
            day: "numeric"}),
          status: ts.status.charAt(0).toUpperCase() + ts.status.slice(1),
          hours: parseFloat(ts.totalHours) || 0,
          dueDate: new Date(ts.weekEndDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"}),
          weekStart: ts.weekStartDate,
          id: ts.id}));

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
              year: "numeric"}),
            priority: "High"});
        }

        if (data.timesheets.approved > 0) {
          generatedNotifications.push({
            title: "Timesheets Approved",
            message: `${data.timesheets.approved} timesheet(s) have been approved this month`,
            date: new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric"}),
            priority: "Success"});
        }

        if (data.invoices.overdue > 0) {
          generatedNotifications.push({
            title: "Overdue Invoices",
            message: `You have ${data.invoices.overdue} overdue invoice(s)`,
            date: new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric"}),
            priority: "Critical"});
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
              year: "numeric"}),
            priority: "Success"});
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

    if (isMounted) {
      loadDashboardData();
    }
  }, [isMounted, user?.tenantId, user?.employeeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent hydration mismatch - don't render until mounted
  if (!isMounted || loading) {
    return (
      <div className="employee-dashboard-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
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
          description: "Review pending timesheets"},
        {
          to: `/${subdomain}/leave-management`,
          icon: "📋",
          title: "Approve Leave",
          description: "Review leave requests"},
        {
          to: `/${subdomain}/leave`,
          icon: "📅",
          title: "Upcoming Leaves",
          description: "View employee leave calendar"},
        {
          to: `/${subdomain}/employees`,
          icon: "👥",
          title: "Manage Employees",
          description: "Add or edit team members"},
      ];
    } else {
      // Employee Quick Actions
      return [
        {
          to: `/${subdomain}/timesheets/submit`,
          icon: "📝",
          title: "Submit Timesheet",
          description: "Log your hours"},
        {
          to: `/${subdomain}/timesheets/mobile-upload`,
          icon: "📱",
          title: "Mobile Upload",
          description: "Quick photo upload"},
        {
          to: `/${subdomain}/leave`,
          icon: "🏖️",
          title: "Request Leave",
          description: "Plan time off"},
        {
          to: `/${subdomain}/profile`,
          icon: "👤",
          title: "Update Profile",
          description: "Manage account"},
      ];
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--dashboard-bg)',
        padding: '24px',
        color: 'var(--dashboard-text-color)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      <div className="modern-employee-dashboard mx-auto w-full max-w-8xl space-y-4">
      {/* Header Section */}
      <div className="dashboard-heade rounded-2xl border border-slate-200/70 bg-[#7cbdf2] p-6 shadow-sm backdrop-blur">
        <div className="header-content flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="header-info">
            <h1 className="dashboard-title text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Welcome back, {user?.name || "Employee"}! 👋
            </h1>
            <p className="dashboard-subtitle mt-1 text-sm text-slate-600">
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
              <Link href={`/${subdomain}/timesheets/submit`}
                className="flex items-center gap-2.5
                rounded-full
                bg-slate-900 px-6 py-3
                text-sm font-semibold !text-white
                shadow-md
                transition-all
                cursor-pointer
                hover:bg-slate-800 hover:scale-[1.04]
                active:scale-[0.97]
                dark:bg-indigo-600 dark:hover:bg-indigo-500
                dark:shadow-[0_6px_18px_rgba(79,70,229,0.45)]
              "
            >
              <i className="fas fa-plus-circle text-base" />
                Submit Timesheet
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 auto-rows-fr">
  {/* Notifications */}
  <div className="flex">
    <div className="flex w-full flex-col rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur">
      <NotificationList notifications={notifications} />
    </div>
  </div>

  {/* Hours Chart */}
  <div className="flex">
    <div className="flex w-full flex-col rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur">
      <HoursChart
        regularHours={hoursData.regular}
        overtimeHours={hoursData.overtime}
        leaveHours={hoursData.leave}
      />
    </div>
  </div>

  {/* Quick Actions */}
 <div className="flex">
  <div className="flex w-full flex-col rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur">
    {/* Header */}
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-slate-900">
        Quick Actions
      </h3>
      <p className="mt-0.5 text-xs text-slate-500">
        Frequently used features
      </p>
    </div>

    {/* Actions */}
    <div className="grid flex-1 grid-cols-2 gap-3">
      {getQuickActions().map((action, index) => (
        <Link
          key={index}
          href={action.to}
          className="
            group flex items-start gap-3
            rounded-xl
            border border-slate-200/60
            bg-white/70
            p-3
            transition-all
            hover:-translate-y-0.5
            hover:bg-white
            hover:shadow-sm
          "
        >
          {/* Icon */}
          <div
            className="
              flex h-9 w-9 shrink-0 items-center justify-center
              rounded-lg
              bg-slate-100
              text-sm
              transition-colors
              group-hover:bg-slate-200
            "
          >
            {action.icon}
          </div>

          {/* Text */}
          <div className="min-w-0">
            <h4 className="truncate text-xs font-semibold text-slate-900">
              {action.title}
            </h4>
            <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">
              {action.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  </div>
</div>

</div>

<div className="my-10" />

<div className="grid grid-cols-1 gap-6 lg:grid-cols-12 auto-rows-fr">
  {/* Recent Timesheets */}
  <div className="lg:col-span-8 flex">
    <div className="flex w-full flex-col rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Timesheets
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Track progress and quickly take action
          </p>
        </div>

        <Link
          href={`/${subdomain}/timesheets`}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          View All →
        </Link>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
        {timesheets.map((timesheet, index) => (
          <TimeCard
            key={index}
            {...timesheet}
            subdomain={subdomain}
          />
        ))}
      </div>
    </div>
  </div>

  {/* Upcoming Leave */}
  <div className="lg:col-span-4 flex">
    <div className="flex w-full flex-col rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur">
      <UpcomingLeave
        leaveRequests={leaveRequests}
        user={user}
        checkPermission={checkPermission}
        currentEmployer={currentEmployer}
      />
    </div>
  </div>
</div>



      </div>
    </div>
  );
};

export default EmployeeDashboard;
