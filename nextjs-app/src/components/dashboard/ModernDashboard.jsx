'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { API_BASE } from '@/config/api';
import { isServerConnectedCached } from '@/utils/serverCheck';
import ChartWidget from './ChartWidget';
import "./ModernDashboard.css";

const ModernDashboard = () => {
  const { user } = useAuth();
  
  // Hydration fix: Track if component is mounted on client
  const [isMounted, setIsMounted] = useState(false);
  
  // Initialize with empty data - will be populated from server
  const [dashboardData, setDashboardData] = useState({
    timesheets: [],
    employees: [],
    clients: [],
    invoices: [],
    leaveRequests: [],
    kpis: {},
    arAging: {},
    revenueByEmployee: [],
    revenueTrend: [],
    scope: "company",
    employeeId: null,
    dateRange: {}
  });
  const [loading, setLoading] = useState(true);
  const [isServerAvailable, setIsServerAvailable] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [scope, setScope] = useState(
    user?.role === "admin" ? "company" : "employee"
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [employees, setEmployees] = useState([]);
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

  // Check server connection and fetch data accordingly
  useEffect(() => {
    async function checkAndFetch() {
      if (!isMounted) return;
      
      const serverConnected = await isServerConnectedCached();
      setIsServerAvailable(serverConnected);
      
      if (serverConnected) {
        // Server is connected - fetch real data
        console.log('✅ Server connected - fetching real data');
        fetchDashboardData();
        fetchEmployees();
      } else {
        // Server not connected - show empty state
        console.log('⚠️ Server not connected - no data available');
        setLoading(false);
      }
    }
    
    checkAndFetch();
  }, [isMounted, fetchDashboardData, fetchEmployees, scope, selectedEmployeeId]);

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
    approved: dashboardData.timesheets.filter(ts => ts.status === "approved").length,
    pending: dashboardData.timesheets.filter(ts => ts.status === "submitted").length,
    draft: dashboardData.timesheets.filter(ts => ts.status === "draft").length,
  };

  return [
    {
      label: "Approved",
      value: statusCounts.approved,
      color: "#28a745"
    },
    {
      label: "Pending",
      value: statusCounts.pending,
      color: "#ffc107"
    },
    {
      label: "Draft",
      value: statusCounts.draft,
      color: "#17a2b8"
    }
  ];
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

     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 p-4">

 <div
  className="
    bg-blue-100 dark:bg-[#0f1a25]
    rounded-2xl shadow-sm 
    p-5 
    border border-gray-200 dark:border-gray-700
    hover:shadow-md transition-all duration-200
    flex flex-col gap-6
  "
>
  {/* Header */}
  <div className="flex items-center justify-between">
    <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
      Timesheet Overview
    </h3>

    <div
      className="
        w-10 h-10 flex items-center justify-center 
        rounded-xl 
        bg-blue-50 dark:bg-blue-900/30 
        text-blue-600 dark:text-blue-300
      "
    >
      <i className="fas fa-clock"></i>
    </div>
  </div>

  {/* Stats Row */}
  <div className="flex justify-around text-center py-6">
    <div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">
        {getPendingTimesheets()}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
    </div>

    <div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">
        {getApprovedTimesheets()}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">Approved</p>
    </div>

    <div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">
        {dashboardData.timesheets.length}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
    </div>
  </div>

  {/* Pie Chart & Legend
  <div className="flex flex-col items-center justify-center mt-2 space-y-3">
    <ChartWidget 
      type="pie" 
      data={getTimesheetStatusData()} 
      height={180} 
      showLegend={true} 
    />
  </div> */}
</div>

{/* 5️⃣ Active Employees */}
  <div className="bg-blue-200 dark:bg-[#0f1a25] rounded-2xl shadow-sm p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[170px]">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Active Employees</h3>
      <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300">
        <i className="fas fa-users" aria-hidden />
      </div>
    </div>

    <div className="flex items-center justify-center flex-col gap-1 mt-2">
      <div className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">{getActiveEmployees()}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">+2 this month</div>
    </div>

    <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-300">
      <div>
        <div className="text-[11px] text-gray-500 dark:text-gray-400">Utilization</div>
        <div className="font-semibold text-gray-900 dark:text-white">{getEmployeeUtilization()}%</div>
      </div>
      <div className="text-right">
        <div className="text-[11px] text-gray-500 dark:text-gray-400">Hours This Week</div>
        <div className="font-semibold text-gray-900 dark:text-white">{formatHours(getTotalHoursThisWeek())}</div>
      </div>
    </div>
  </div>

  {/* 2️⃣ Total Revenue */}
  {user?.role === "admin" && (
    <div className="bg-cyan-100 dark:bg-[#0f1a25] rounded-2xl shadow-sm p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[170px]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Total Revenue</h3>
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-cyan-50 dark:bg-green-900/30 text-green-600 dark:text-green-300">
          <i className="fas fa-dollar-sign" aria-hidden />
        </div>
      </div>

      <div className="flex items-center justify-center flex-col gap-1 mt-2">
        <div className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white leading-none">
          {formatCurrency(getTotalRevenue())}
        </div>
        <div className="text-xs text-green-600 dark:text-green-400 font-medium">+12.5%</div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-300">
        <div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400">This Month</div>
          <div className="font-semibold text-gray-900 dark:text-white">{formatCurrency(getMonthlyRevenue())}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-gray-500 dark:text-gray-400">Outstanding</div>
          <div className="font-semibold text-gray-900 dark:text-white">{formatCurrency(getOutstandingInvoices())}</div>
        </div>
      </div>
    </div>
  )}

{/* 4️⃣ Revenue by Client */}
  {user?.role === "admin" && (
    <div className="bg-cyan-50 dark:bg-[#0f1a25] rounded-2xl shadow-sm p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Revenue by Client</h3>
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-cyan-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300">
          <i className="fas fa-building"></i>
        </div>
      </div>

      <div className="space-y-3">
        {revenueByClient.map((client, index) => (
          <div
            key={client.client.id}
            className="flex items-center justify-between bg-gray-50 dark:bg-[#1c2733] p-3 rounded-xl"
          >
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">#{index + 1}</div>
            <div className="flex flex-col">
              <div className="font-medium dark:text-gray-100">{client.client.clientName}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{client.client.email}</div>
            </div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {formatCurrency(client.revenue)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

  

   {/* 3️⃣ Monthly Revenue Chart (spans 2 columns on md, 1 on small) */}
  {user?.role === "admin" && (
    <div className="bg-slate-50 dark:bg-[#0f1a25] rounded-2xl shadow-sm p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 col-span-1 md:col-span-2 flex flex-col min-h-[170px]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Monthly Revenue Trend</h3>
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300">
          <i className="fas fa-chart-line" aria-hidden />
        </div>
      </div>

      <div className="mt-3 flex-1">
        <ChartWidget
          type="line"
          data={monthlyRevenueData.revenue}
          labels={monthlyRevenueData.months}
          height={150}
          color="#1c398e"
          showValues={true}
        />
      </div>
    </div>
  )}

  

   {/* 8️⃣ Recent Activity */}
<div className="bg-slate-100 dark:bg-[#0f1a25] rounded-2xl shadow-sm p-5 border border-gray-200 dark:border-gray-700 
     hover:shadow-md transition-all duration-200 col-span-1 md:col-span-2 
     flex flex-col h-full">

  {/* Header */}
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
      Recent Activity
    </h3>
    <div className="w-10 h-10 flex items-center justify-center rounded-xl 
        bg-slate-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
      <i className="fas fa-history"></i>
    </div>
  </div>

  <div className="space-y-2 overflow-y-auto pr-2"
     style={{ maxHeight: "155px" }}>

  {dashboardData.timesheets.slice(0, 5).map((ts) => (
    <div
      key={ts.id}
      className="flex items-center justify-between bg-gray-200 dark:bg-[#1c2733] 
                 p-2.5 rounded-lg"
    >
      {/* Left */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 flex items-center justify-center rounded-full 
                        bg-blue-100 dark:bg-blue-900/30 
                        text-blue-600 dark:text-blue-300 text-xs">
          <i className="fas fa-clock"></i>
        </div>

        <div>
          <div className="font-medium text-sm dark:text-gray-100">
            Timesheet submitted by {ts.employeeId}
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400">
            {new Date(ts.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Status */}
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
          ts.status === "approved"
            ? "bg-green-200 dark:bg-green-900 text-green-700 dark:text-green-300"
            : ts.status === "pending"
            ? "bg-yellow-200 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
            : "bg-red-200 dark:bg-red-900 text-red-700 dark:text-red-300"
        }`}
      >
        {ts.status}
      </span>
    </div>
  ))}
</div>


</div>


  {/* 7️⃣ Top Performers */}
  <div className="bg-indigo-50 dark:bg-[#0f1a25] rounded-2xl shadow-sm p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 flex flex-col gap-3 min-h-[170px]">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Top Performers</h3>
      <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300">
        <i className="fas fa-trophy" aria-hidden />
      </div>
    </div>

    <div className="space-y-2 mt-2">
      {topEmployees.slice(0, 4).map((emp, index) => (
        <div key={emp.employee.id} className="flex items-center justify-between bg-gray-50 dark:bg-[#1c2733] p-2 rounded-lg">
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">#{index + 1}</div>
            <div className="flex flex-col min-w-0">
              <div className="font-medium text-sm dark:text-gray-100 truncate">{emp.employee.firstName} {emp.employee.lastName}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{formatHours(emp.hours)} hours</div>
            </div>
          </div>
          <div className="font-semibold text-gray-900 dark:text-white ml-3">{formatCurrency(emp.hours * 50)}</div>
        </div>
      ))}
    </div>
  </div>

 

</div>



    </div>
  );
};

export default ModernDashboard;
