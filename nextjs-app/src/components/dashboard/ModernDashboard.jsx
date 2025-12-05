'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { API_BASE } from '@/config/api';
import ChartWidget from './ChartWidget';
import "./ModernDashboard.css";

const ModernDashboard = () => {
  const { user } = useAuth();
  
  // Hydration fix: Track if component is mounted on client
  const [isMounted, setIsMounted] = useState(false);
  
  // HARDCODED DATA - No API calls
  const [dashboardData, setDashboardData] = useState({
    timesheets: [
      { id: 'TS001', employeeName: 'Shunmugavel Admin', projectName: 'TimePulse Development', hours: 8, status: 'approved', date: '2024-12-05' },
      { id: 'TS002', employeeName: 'John Developer', projectName: 'TimePulse Development', hours: 7.5, status: 'submitted', date: '2024-12-05' },
      { id: 'TS003', employeeName: 'Sarah Designer', projectName: 'Client Portal', hours: 6, status: 'draft', date: '2024-12-05' },
      { id: 'TS004', employeeName: 'Mike Tester', projectName: 'TimePulse Development', hours: 8, status: 'approved', date: '2024-12-04' }
    ],
    employees: [
      { id: 'EMP001', name: 'Shunmugavel Admin', email: 'shunmugavel@selsoftinc.com', department: 'Management', status: 'active' },
      { id: 'EMP002', name: 'John Developer', email: 'john@selsoftinc.com', department: 'Engineering', status: 'active' },
      { id: 'EMP003', name: 'Sarah Designer', email: 'sarah@selsoftinc.com', department: 'Design', status: 'active' },
      { id: 'EMP004', name: 'Mike Tester', email: 'mike@selsoftinc.com', department: 'QA', status: 'active' },
      { id: 'EMP005', name: 'Emily Manager', email: 'emily@selsoftinc.com', department: 'Engineering', status: 'active' }
    ],
    clients: [
      { id: 'CLI001', name: 'Acme Corp', email: 'contact@acmecorp.com', status: 'active', projects: 1 },
      { id: 'CLI002', name: 'TechStart Inc', email: 'hello@techstart.io', status: 'active', projects: 1 },
      { id: 'CLI003', name: 'Global Solutions', email: 'info@globalsolutions.com', status: 'inactive', projects: 0 }
    ],
    invoices: [
      { id: 'INV001', clientName: 'Acme Corp', amount: 15000, status: 'paid', dueDate: '2024-11-30' },
      { id: 'INV002', clientName: 'TechStart Inc', amount: 25000, status: 'pending', dueDate: '2024-12-15' },
      { id: 'INV003', clientName: 'Acme Corp', amount: 12000, status: 'overdue', dueDate: '2024-11-15' }
    ],
    leaveRequests: [
      { id: 'LEAVE001', employeeName: 'Mike Tester', leaveType: 'Sick Leave', days: 1, status: 'approved', date: '2024-12-05' },
      { id: 'LEAVE002', employeeName: 'John Developer', leaveType: 'Vacation', days: 6, status: 'pending', startDate: '2024-12-20' },
      { id: 'LEAVE003', employeeName: 'Sarah Designer', leaveType: 'Personal', days: 1, status: 'rejected', date: '2024-12-10' }
    ],
    kpis: {
      totalEmployees: 5,
      activeProjects: 2,
      pendingTimesheets: 1,
      totalHours: 29.5,
      pendingLeaves: 1,
      todayAttendance: 4,
      monthlyRevenue: 125000,
      projectCompletion: 60
    },
    arAging: {
      current: 25000,
      days30: 15000,
      days60: 8000,
      days90: 12000
    },
    revenueByEmployee: [
      { employeeName: 'John Developer', revenue: 45000 },
      { employeeName: 'Sarah Designer', revenue: 32000 },
      { employeeName: 'Mike Tester', revenue: 28000 },
      { employeeName: 'Emily Manager', revenue: 20000 }
    ],
    revenueTrend: [
      { month: 'Jul', revenue: 95000 },
      { month: 'Aug', revenue: 105000 },
      { month: 'Sep', revenue: 115000 },
      { month: 'Oct', revenue: 110000 },
      { month: 'Nov', revenue: 120000 },
      { month: 'Dec', revenue: 125000 }
    ],
    scope: "company",
    employeeId: null,
    dateRange: {}
  });
  const [loading, setLoading] = useState(false); // Set to false - no loading needed
  const [searchTerm, setSearchTerm] = useState("");
  const [scope, setScope] = useState(
    user?.role === "admin" ? "company" : "employee"
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [employees, setEmployees] = useState([
    { id: 'EMP001', name: 'Shunmugavel Admin' },
    { id: 'EMP002', name: 'John Developer' },
    { id: 'EMP003', name: 'Sarah Designer' },
    { id: 'EMP004', name: 'Mike Tester' },
    { id: 'EMP005', name: 'Emily Manager' }
  ]);
  const [dateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()});

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const tenantId = user?.tenantId;
      if (!tenantId) return;

      // Build query parameters for the new optimized dashboard API
      const queryParams = new URLSearchParams({
        tenantId,
        scope,
        ...(scope === "employee" &&
          selectedEmployeeId && { employeeId: selectedEmployeeId }),
        // Add date range if needed
        ...(dateRange.start && {
          from: dateRange.start.toISOString().split("T")[0]}),
        ...(dateRange.end && { to: dateRange.end.toISOString().split("T")[0] })});

      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`};

      // Use the new optimized dashboard API
      const response = await fetch(
        `${API_BASE}/dashboard-prisma?${queryParams}`,
        {
          headers}
      );
      const data = await response.json();

      if (response.ok) {
        setDashboardData({
          // Transform the new API response to match existing structure
          timesheets: [], // Not needed for the new dashboard
          employees: data.revenueByEmployee || [],
          clients: [], // Not needed for the new dashboard
          invoices: [], // Not needed for the new dashboard
          leaveRequests: [], // Not needed for the new dashboard
          // New optimized data
          kpis: data.kpis || {},
          arAging: data.arAging || {},
          revenueByEmployee: data.revenueByEmployee || [],
          revenueTrend: data.revenueTrend || [],
          scope: data.scope,
          employeeId: data.employeeId,
          dateRange: data.dateRange});
      } else {
        throw new Error(data.message || "Failed to fetch dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [
    user?.tenantId,
    user?.id,
    user?.role,
    scope,
    selectedEmployeeId,
    dateRange.start,
    dateRange.end,
  ]);

  // Fetch employees for dropdown
  const fetchEmployees = useCallback(async () => {
    try {
      const tenantId = user?.tenantId;
      if (!tenantId) return;

      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`};

      const response = await fetch(
        `${API_BASE}/dashboard/employees?tenantId=${tenantId}`,
        {
          headers}
      );
      const data = await response.json();

      if (response.ok) {
        setEmployees(data.employees || []);
      } else {
        console.error("Error fetching employees:", data.message);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  }, [user?.tenantId]);

  // Hydration fix: Set mounted state on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // DISABLED API CALLS - Using hardcoded data only
  // useEffect(() => {
  //   if (isMounted) {
  //     fetchDashboardData();
  //     fetchEmployees();
  //   }
  // }, [isMounted, fetchDashboardData, fetchEmployees, scope, selectedEmployeeId]);

  // Staffing Management Metrics - Updated to use optimized data
  const getTotalRevenue = () => {
    return parseFloat(dashboardData.kpis?.total_revenue || 0);
  };

  const getMonthlyRevenue = () => {
    // For now, use total revenue as monthly revenue
    // In the future, we can add a separate monthly KPI
    return parseFloat(dashboardData.kpis?.total_revenue || 0);
  };

  const getOutstandingInvoices = () => {
    return parseFloat(dashboardData.kpis?.ar_outstanding || 0);
  };

  const getActiveEmployees = () => {
    return parseInt(dashboardData.kpis?.active_employees || 0);
  };

  const getTotalHoursThisWeek = () => {
    // For employee scope, use the total hours from KPIs
    if (scope === "employee") {
      return parseFloat(dashboardData.kpis?.total_hours || 0);
    }
    // For company scope, we'd need to calculate from timesheets
    // For now, return 0 as this would require additional API call
    return 0;
  };

  const getPendingTimesheets = () => {
    return parseInt(dashboardData.kpis?.ts_pending || 0);
  };

  const getApprovedTimesheets = () => {
    return parseInt(dashboardData.kpis?.ts_approved || 0);
  };

  const getEmployeeUtilization = () => {
    const activeEmployees = getActiveEmployees();
    if (activeEmployees === 0) return 0;

    const totalHours = getTotalHoursThisWeek();
    const expectedHours = activeEmployees * 40; // 40 hours per week per employee
    return Math.round((totalHours / expectedHours) * 100);
  };

  const getTopPerformingEmployees = () => {
    const employeeHours = {};

    dashboardData.timesheets.forEach((ts) => {
      if (ts.status === "approved") {
        const empId = ts.employeeId;
        if (!employeeHours[empId]) {
          employeeHours[empId] = { hours: 0, employee: null };
        }
        employeeHours[empId].hours += ts.totalHours || 0;
      }
    });

    // Find employee details
    Object.keys(employeeHours).forEach((empId) => {
      const employee = dashboardData.employees.find((emp) => emp.id === empId);
      if (employee) {
        employeeHours[empId].employee = employee;
      }
    });

    return Object.values(employeeHours)
      .filter((emp) => emp.employee)
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);
  };

  const getRevenueByClient = () => {
    const clientRevenue = {};

    dashboardData.invoices
      .filter((inv) => inv.status === "paid")
      .forEach((inv) => {
        const clientId = inv.clientId;
        if (!clientRevenue[clientId]) {
          clientRevenue[clientId] = { revenue: 0, client: null };
        }
        clientRevenue[clientId].revenue += parseFloat(inv.total_amount) || 0;
      });

    // Find client details
    Object.keys(clientRevenue).forEach((clientId) => {
      const client = dashboardData.clients.find((c) => c.id === clientId);
      if (client) {
        clientRevenue[clientId].client = client;
      }
    });

    return Object.values(clientRevenue)
      .filter((c) => c.client)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const getMonthlyRevenueData = () => {
    const months = [];
    const revenue = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString("en-US", { month: "short" });
      months.push(monthName);

      const monthRevenue = dashboardData.invoices
        .filter((inv) => {
          const invDate = new Date(inv.created_at);
          return (
            inv.status === "paid" &&
            invDate.getMonth() === date.getMonth() &&
            invDate.getFullYear() === date.getFullYear()
          );
        })
        .reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0);

      revenue.push(monthRevenue);
    }

    return { months, revenue };
  };

  const getTimesheetStatusData = () => {
    const statusCounts = {
      pending: dashboardData.timesheets.filter((ts) => ts.status === "pending")
        .length,
      approved: dashboardData.timesheets.filter(
        (ts) => ts.status === "approved"
      ).length,
      rejected: dashboardData.timesheets.filter(
        (ts) => ts.status === "rejected"
      ).length};

    return Object.entries(statusCounts).map(([status, count]) => ({
      label: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color:
        status === "approved"
          ? "#28a745"
          : status === "pending"
          ? "#ffc107"
          : "#dc3545"}));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"}).format(amount);
  };

  const formatHours = (hours) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}:${m.toString().padStart(2, "0")}`;
  };

  // Prevent hydration mismatch - don't render until mounted
  if (!isMounted || loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "400px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const monthlyRevenueData = getMonthlyRevenueData();
  const timesheetStatusData = getTimesheetStatusData();
  const topEmployees = getTopPerformingEmployees();
  const revenueByClient = getRevenueByClient();

  return (
    <div className="modern-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title-section">
          <h1 className="dashboard-title">Dashboard</h1>
          <div className="dashboard-subtitle">
            <i className="fas fa-calendar-alt"></i>
            <span>
              {dateRange.start.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric"})}{" "}
              -{" "}
              {dateRange.end.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric"})}
            </span>
            <span className="scope-indicator">
              {scope === "company" ? (
                <>
                  <i className="fas fa-building"></i>
                  Company Overview
                </>
              ) : (
                <>
                  <i className="fas fa-user"></i>
                  {selectedEmployeeId
                    ? `Employee: ${
                        dashboardData.employees.find(
                          (emp) => emp.id === selectedEmployeeId
                        )?.firstName || "Selected"
                      } ${
                        dashboardData.employees.find(
                          (emp) => emp.id === selectedEmployeeId
                        )?.lastName || ""
                      }`
                    : "Employee View"}
                </>
              )}
            </span>
            <span className="refresh-indicator">Refreshed: Now</span>
          </div>
        </div>

        <div className="dashboard-controls">
          <div className="scope-toggle">
            <button
              className={`toggle-btn ${scope === "company" ? "active" : ""}`}
              onClick={() => setScope("company")}
            >
              Company
            </button>
            <button
              className={`toggle-btn ${scope === "employee" ? "active" : ""}`}
              onClick={() => setScope("employee")}
            >
              Employee
            </button>
          </div>

          {scope === "employee" && (
            <div className="employee-selector">
              <select
                className="employee-dropdown"
                value={selectedEmployeeId || ""}
                onChange={(e) => setSelectedEmployeeId(e.target.value || null)}
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="search-container">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              placeholder="Search dashboard..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dashboard-search"
            />
          </div>
        </div>
      </div>

      <div className="widgets-grid">
        {/* Timesheet Status - Moved to top */}
        <div className="widget timesheet-widget">
          <div className="widget-header">
            <h3>Timesheet Status</h3>
            <i className="fas fa-clock"></i>
          </div>
          <div className="widget-content">
            <div className="metric-display">
              <span className="metric-value-large">
                {getPendingTimesheets()}
              </span>
              <span className="metric-label">Pending Approval</span>
            </div>
            <div className="metric-details">
              <div className="metric-item">
                <span className="metric-label">Approved</span>
                <span className="metric-value">{getApprovedTimesheets()}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Total</span>
                <span className="metric-value">
                  {dashboardData.timesheets.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Overview - Only for Admin */}
        {user?.role === "admin" && (
          <div className="widget revenue-widget">
            <div className="widget-header">
              <h3>Total Revenue</h3>
              <i className="fas fa-dollar-sign"></i>
            </div>
            <div className="widget-content">
              <div className="metric-display">
                <span className="metric-value-large">
                  {formatCurrency(getTotalRevenue())}
                </span>
                <span className="metric-change positive">+12.5%</span>
              </div>
              <div className="metric-details">
                <div className="metric-item">
                  <span className="metric-label">This Month</span>
                  <span className="metric-value">
                    {formatCurrency(getMonthlyRevenue())}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Outstanding</span>
                  <span className="metric-value">
                    {formatCurrency(getOutstandingInvoices())}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Employee Overview */}
        <div className="widget employee-widget">
          <div className="widget-header">
            <h3>Active Employees</h3>
            <i className="fas fa-users"></i>
          </div>
          <div className="widget-content">
            <div className="metric-display">
              <span className="metric-value-large">{getActiveEmployees()}</span>
              <span className="metric-change neutral">+2 this month</span>
            </div>
            <div className="metric-details">
              <div className="metric-item">
                <span className="metric-label">Utilization</span>
                <span className="metric-value">
                  {getEmployeeUtilization()}%
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Hours This Week</span>
                <span className="metric-value">
                  {formatHours(getTotalHoursThisWeek())}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Revenue Chart - Only for Admin */}
        {user?.role === "admin" && (
          <div className="widget chart-widget">
            <div className="widget-header">
              <h3>Monthly Revenue Trend</h3>
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="widget-content">
              <ChartWidget
                type="line"
                data={monthlyRevenueData.revenue}
                labels={monthlyRevenueData.months}
                height={200}
                color="#007bff"
                showValues={true}
              />
            </div>
          </div>
        )}

        {/* Timesheet Status Chart */}
        <div className="widget chart-widget">
          <div className="widget-header">
            <h3>Timesheet Status</h3>
            <i className="fas fa-chart-pie"></i>
          </div>
          <div className="widget-content">
            <ChartWidget
              type="pie"
              data={timesheetStatusData}
              height={200}
              showLegend={true}
            />
          </div>
        </div>

        {/* Top Performing Employees */}
        <div className="widget list-widget">
          <div className="widget-header">
            <h3>Top Performers</h3>
            <i className="fas fa-trophy"></i>
          </div>
          <div className="widget-content">
            <div className="list-container">
              {topEmployees.map((emp, index) => (
                <div key={emp.employee.id} className="list-item">
                  <div className="list-item-rank">#{index + 1}</div>
                  <div className="list-item-content">
                    <div className="list-item-name">
                      {emp.employee.firstName} {emp.employee.lastName}
                    </div>
                    <div className="list-item-detail">
                      {formatHours(emp.hours)} hours
                    </div>
                  </div>
                  <div className="list-item-value">
                    {formatCurrency(emp.hours * 50)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue by Client - Only for Admin */}
        {user?.role === "admin" && (
          <div className="widget list-widget">
            <div className="widget-header">
              <h3>Revenue by Client</h3>
              <i className="fas fa-building"></i>
            </div>
            <div className="widget-content">
              <div className="list-container">
                {revenueByClient.map((client, index) => (
                  <div key={client.client.id} className="list-item">
                    <div className="list-item-rank">#{index + 1}</div>
                    <div className="list-item-content">
                      <div className="list-item-name">
                        {client.client.clientName}
                      </div>
                      <div className="list-item-detail">
                        {client.client.email}
                      </div>
                    </div>
                    <div className="list-item-value">
                      {formatCurrency(client.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="widget activity-widget">
          <div className="widget-header">
            <h3>Recent Activity</h3>
            <i className="fas fa-history"></i>
          </div>
          <div className="widget-content">
            <div className="activity-list">
              {dashboardData.timesheets.slice(0, 5).map((ts) => (
                <div key={ts.id} className="activity-item">
                  <div className="activity-icon">
                    <i className="fas fa-clock"></i>
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">
                      Timesheet submitted by {ts.employeeId}
                    </div>
                    <div className="activity-time">
                      {new Date(ts.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="activity-status">
                    <span
                      className={`badge ${
                        ts.status === "approved"
                          ? "bg-success"
                          : ts.status === "pending"
                          ? "bg-warning"
                          : "bg-danger"
                      }`}
                    >
                      {ts.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;
