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
    kpis: {},
    arAging: {},
    revenueByEmployee: [],
    revenueTrend: [],
    recentActivity: [],
    topPerformers: [],
    revenueByClient: [],
    monthlyRevenueTrend: [],
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
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const tenantId = user?.tenantId;
      if (!tenantId) return;

      // Build query parameters
      const queryParams = new URLSearchParams({
        tenantId,
        scope,
        ...(scope === "employee" &&
          selectedEmployeeId && { employeeId: selectedEmployeeId }),
        ...(dateRange.start && {
          from: dateRange.start.toISOString().split("T")[0]}),
        ...(dateRange.end && { to: dateRange.end.toISOString().split("T")[0] })});

      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`};

      // Fetch all dashboard data in parallel
      const [mainData, recentActivity, topPerformers, revenueByClient, monthlyTrend] = await Promise.all([
        fetch(`${API_BASE}/api/dashboard?${queryParams}`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/api/dashboard-extended/recent-activity?tenantId=${tenantId}&limit=10`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/api/dashboard-extended/top-performers?${queryParams}&limit=5`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/api/dashboard-extended/revenue-by-client?${queryParams}&limit=5`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/api/dashboard-extended/monthly-revenue-trend?tenantId=${tenantId}`, { headers }).then(r => r.json())
      ]);

      setDashboardData({
        kpis: mainData.kpis || {},
        arAging: mainData.arAging || {},
        revenueByEmployee: mainData.revenueByEmployee || [],
        revenueTrend: mainData.revenueTrend || [],
        recentActivity: recentActivity.activities || [],
        topPerformers: topPerformers.performers || [],
        revenueByClient: revenueByClient.clients || [],
        monthlyRevenueTrend: monthlyTrend.trend || [],
        scope: mainData.scope,
        employeeId: mainData.employeeId,
        dateRange: mainData.dateRange
      });
      
      setLastRefresh(new Date());
      console.log('✅ Dashboard data refreshed successfully');
      console.log('📊 Dashboard Data:', { scope, selectedEmployeeId, kpis: mainData.kpis, revenueByClient: revenueByClient.clients });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [
    user?.tenantId,
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
        `${API_BASE}/api/dashboard-extended/employees?tenantId=${tenantId}`,
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

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !isMounted || !isServerAvailable) return;

    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing dashboard data...');
      fetchDashboardData();
    }, 60000); // Refresh every 60 seconds

    return () => clearInterval(refreshInterval);
  }, [autoRefresh, isMounted, isServerAvailable, fetchDashboardData]);

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

  // Dashboard metrics using real-time API data
  const getTotalRevenue = () => {
    return parseFloat(dashboardData.kpis?.total_revenue || 0);
  };

  const getMonthlyRevenue = () => {
    return parseFloat(dashboardData.kpis?.total_revenue || 0);
  };

  const getOutstandingInvoices = () => {
    return parseFloat(dashboardData.kpis?.ar_outstanding || 0);
  };

  const getActiveEmployees = () => {
    return parseInt(dashboardData.kpis?.active_employees || 0);
  };

  const getTotalHoursThisWeek = () => {
    if (scope === "employee") {
      return parseFloat(dashboardData.kpis?.total_hours || 0);
    }
    // Calculate from top performers for company scope
    const totalHours = dashboardData.topPerformers.reduce((sum, emp) => sum + parseFloat(emp.total_hours || 0), 0);
    return totalHours;
  };

  const getPendingTimesheets = () => {
    return parseInt(dashboardData.kpis?.ts_pending || 0);
  };

  const getApprovedTimesheets = () => {
    return parseInt(dashboardData.kpis?.ts_approved || 0);
  };

  const getTotalTimesheets = () => {
    return getPendingTimesheets() + getApprovedTimesheets();
  };

  const getEmployeeUtilization = () => {
    const activeEmployees = getActiveEmployees();
    if (activeEmployees === 0) return 0;

    const totalHours = getTotalHoursThisWeek();
    const expectedHours = activeEmployees * 40;
    return Math.round((totalHours / expectedHours) * 100);
  };

  const getMonthlyRevenueData = () => {
    const months = dashboardData.monthlyRevenueTrend.map(item => item.month_label || '');
    const revenue = dashboardData.monthlyRevenueTrend.map(item => parseFloat(item.revenue || 0));
    return { months, revenue };
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

  const formatRelativeTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
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
  const topPerformers = dashboardData.topPerformers || [];
  const revenueByClient = dashboardData.revenueByClient || [];
  const recentActivity = dashboardData.recentActivity || [];

  return (
    <div className="modern-dashboard">
      {/* Header Card */}
      <div className="mb-9 mt-1 rounded-3xl bg-[#7cbdf2] px-6 py-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-center">
          {/* ================= LEFT ================= */}
          <div className="relative pl-4">
            {/* Accent bar */}
            <span className="absolute left-0 top-1 h-12 w-1 rounded-full bg-purple-900"></span>

            <h1 className="text-[2rem] font-bold text-white leading-[1.15] tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
              Dashboard
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-900/90">
              {/* Scope */}
              <span className="flex items-center gap-2 rounded-full bg-white/60 px-3 py-1">
                <i className={`fas ${scope === "company" ? "fa-building" : "fa-user"}`} />
                {scope === "company"
                  ? "Company Overview"
                  : selectedEmployeeId
                  ? `Employee: ${
                      employees.find((emp) => emp.id === selectedEmployeeId)?.firstName || "Selected"
                    } ${
                      employees.find((emp) => emp.id === selectedEmployeeId)?.lastName || ""
                    }`
                  : "Employee View"}
              </span>
            </div>
          </div>

          {/* ================= RIGHT ================= */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Scope Toggle */}
            <div className="flex rounded-full bg-white/50 p-1">
              <button
                onClick={() => setScope("company")}
                className={`px-5 py-2 text-sm font-semibold rounded-full transition ${
                  scope === "company" ? "bg-white text-slate-900 shadow" : "text-slate-700"
                }`}
              >
                Company
              </button>

              <button
                onClick={() => setScope("employee")}
                className={`px-5 py-2 text-sm font-semibold rounded-full transition ${
                  scope === "employee" ? "bg-white text-slate-900 shadow" : "text-slate-700"
                }`}
              >
                Employee
              </button>
            </div>

            {/* Employee selector */}
            {scope === "employee" && (
              <select
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow outline-none"
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
            )}
          </div>
        </div>
      </div>

      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 p-4">
        {/* 1️⃣ Timesheet Overview */}
        <div className="bg-blue-100 dark:bg-[#1a202c] rounded-2xl shadow-sm p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 flex flex-col gap-6">
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
          {getTotalTimesheets()}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
      </div>
        </div>
      </div>

        {/* 5️⃣ Active Employees */}
        <div className="bg-blue-200 dark:bg-[#1a202c] rounded-2xl shadow-sm p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[170px]">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Active Employees</h3>
      <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300">
        <i className="fas fa-users" aria-hidden />
      </div>
    </div>

    <div className="flex items-center justify-center flex-col gap-1 mt-2">
      <div className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">{getActiveEmployees()}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400"></div>
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
          <div className="bg-cyan-100 dark:bg-[#1a202c] rounded-2xl shadow-sm p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[170px]">
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
        <div className="text-xs text-green-600 dark:text-green-400 font-medium"></div>
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
          <div className="bg-cyan-50 dark:bg-[#1a202c] rounded-2xl shadow-sm p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Revenue by Client</h3>
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-cyan-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300">
          <i className="fas fa-building"></i>
        </div>
      </div>

      <div className="space-y-3">
        {revenueByClient.length > 0 ? (
          revenueByClient.map((client, index) => (
            <div
              key={client.id}
              // Used a slightly lighter dark shade for inner list items
              className="flex items-center justify-between bg-gray-50 dark:bg-[#2d3748] p-3 rounded-xl" 
            >
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">#{index + 1}</div>
              <div className="flex flex-col">
                <div className="font-medium dark:text-gray-100">{client.client_name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{client.email}</div>
              </div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(client.total_revenue)}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">
            No client revenue data available
          </div>
        )}
          </div>
        </div>
        )}

        {/* 3️⃣ Monthly Revenue Chart (spans 2 columns on md, 1 on small) */}
        {user?.role === "admin" && (
          <div className="bg-slate-50 dark:bg-[#1a202c] rounded-2xl shadow-sm p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 col-span-1 md:col-span-2 flex flex-col min-h-[170px]">
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
        <div className="bg-slate-100 dark:bg-[#1a202c] rounded-2xl shadow-sm p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 col-span-1 md:col-span-2 flex flex-col h-full">

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

      {recentActivity.length > 0 ? (
        recentActivity.slice(0, 5).map((activity) => (
          <div
            key={activity.id}
            // Used a slightly lighter dark shade for inner list items
            className="flex items-center justify-between bg-gray-200 dark:bg-[#2d3748] 
                   p-2.5 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 flex items-center justify-center rounded-full 
                          bg-blue-100 dark:bg-blue-900/30 
                          text-blue-600 dark:text-blue-300 text-xs">
                <i className={`fas ${activity.activity_type === 'timesheet' ? 'fa-clock' : 'fa-calendar-times'}`}></i>
              </div>

              <div>
                <div className="font-medium text-sm dark:text-gray-100">
                  {activity.activity_type === 'timesheet' ? 'Timesheet' : 'Leave'} by {activity.employee_name}
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">
                  {formatRelativeTime(activity.created_at)}
                </div>
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                activity.status === "approved"
                  ? "bg-green-200 dark:bg-green-900 text-green-700 dark:text-green-300"
                  : activity.status === "submitted" || activity.status === "pending"
                    ? "bg-yellow-200 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                    : "bg-red-200 dark:bg-red-900 text-red-700 dark:text-red-300"
              }`}
            >
              {activity.status}
            </span>
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
          No recent activity
        </div>
      )}
        </div>
      </div>

        {/* 7️⃣ Top Performers */}
        <div className="bg-indigo-50 dark:bg-[#1a202c] rounded-2xl shadow-sm p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 flex flex-col gap-3 min-h-[170px]">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Top Performers</h3>
      <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300">
        <i className="fas fa-trophy" aria-hidden />
      </div>
    </div>

    <div className="space-y-2 mt-2">
      {topPerformers.length > 0 ? (
        topPerformers.slice(0, 4).map((emp, index) => (
          <div key={emp.id} 
             // Used a slightly lighter dark shade for inner list items
             className="flex items-center justify-between bg-gray-50 dark:bg-[#2d3748] p-2 rounded-lg">
            <div className="flex items-center gap-3 min-w-0">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">#{index + 1}</div>
              <div className="flex flex-col min-w-0">
                <div className="font-medium text-sm dark:text-gray-100 truncate">{emp.first_name} {emp.last_name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{formatHours(emp.total_hours)} hours</div>
              </div>
            </div>
            <div className="font-semibold text-gray-900 dark:text-white ml-3">{formatCurrency(emp.revenue_generated)}</div>
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
          No performance data available
        </div>
      )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;
