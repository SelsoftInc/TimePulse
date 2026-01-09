'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { API_BASE } from '@/config/api';
import { isServerConnectedCached } from '@/utils/serverCheck';
import MonthlyRevenueChart from "./MonthlyRevenueChart";
import "./ModernDashboard.css";
import Loader from '../common/Loader';

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
    revenueByVendor: [],
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
  // Set date range to current month for accurate monthly reporting
  const [dateRange] = useState(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: currentMonthStart,
      end: currentMonthEnd
    };
  });
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
      console.log('🔄 Fetching dashboard data for tenantId:', tenantId);
      
      const recentActivityUrl = `${API_BASE}/api/dashboard-extended/recent-activity?tenantId=${tenantId}&limit=10`;
      console.log('📡 Recent Activity URL:', recentActivityUrl);
      
      const [mainData, recentActivity, topPerformers, revenueByClient, revenueByVendor, monthlyTrend] = await Promise.all([
        fetch(`${API_BASE}/api/dashboard?${queryParams}`, { headers }).then(r => r.json()),
        fetch(recentActivityUrl, { headers }).then(async r => {
          console.log('📡 Recent Activity Response Status:', r.status);
          if (!r.ok) {
            console.error('❌ Recent Activity API error:', r.status, r.statusText);
            return { activities: [] };
          }
          const data = await r.json();
          console.log('📡 Recent Activity Response Data:', data);
          console.log('📊 Activities array:', data.activities);
          console.log('📊 Activities count:', data.activities?.length || 0);
          return data;
        }).catch(err => {
          console.error('❌ Recent Activity fetch error:', err);
          return { activities: [] };
        }),
        fetch(`${API_BASE}/api/dashboard-extended/top-performers?${queryParams}&limit=5`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/api/dashboard-extended/revenue-by-client?${queryParams}&limit=100`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/api/dashboard-extended/revenue-by-vendor?${queryParams}&limit=100`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/api/dashboard-extended/monthly-revenue-trend?tenantId=${tenantId}&scope=${scope}${scope === 'employee' && selectedEmployeeId ? `&employeeId=${selectedEmployeeId}` : ''}`, { headers }).then(r => r.json())
      ]);

      console.log('📥 Recent Activity API Response:', recentActivity);
      console.log('📊 Recent Activity Data:', recentActivity.activities);
      console.log('📊 Activity Count:', recentActivity.activities?.length || 0);

      console.log('📦 Revenue by Vendor API Response:', revenueByVendor);
      console.log('📦 Vendors array:', revenueByVendor.vendors);
      console.log('📦 Vendors count:', revenueByVendor.vendors?.length || 0);
      
      setDashboardData({
        kpis: mainData.kpis || {},
        arAging: mainData.arAging || {},
        revenueByEmployee: mainData.revenueByEmployee || [],
        revenueTrend: mainData.revenueTrend || [],
        recentActivity: recentActivity.activities || [],
        topPerformers: topPerformers.performers || [],
        revenueByClient: revenueByClient.clients || [],
        revenueByVendor: revenueByVendor.vendors || [],
        monthlyRevenueTrend: monthlyTrend.trend || [],
        scope: mainData.scope,
        employeeId: mainData.employeeId,
        dateRange: mainData.dateRange
      });
      
      setLastRefresh(new Date());
      console.log('✅ Dashboard data refreshed successfully');
      console.log('📊 Dashboard Data:', { 
        scope, 
        selectedEmployeeId, 
        kpis: mainData.kpis, 
        revenueByClient: revenueByClient.clients,
        recentActivityCount: recentActivity.activities?.length || 0
      });
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
    // Total Revenue = Revenue by Client + Revenue by Vendor
    const clientRevenue = (dashboardData.revenueByClient || []).reduce(
      (sum, client) => sum + parseFloat(client.total_revenue || 0), 
      0
    );
    const vendorRevenue = (dashboardData.revenueByVendor || []).reduce(
      (sum, vendor) => sum + parseFloat(vendor.total_revenue || 0), 
      0
    );
    return clientRevenue + vendorRevenue;
  };

  const getCurrentMonthRevenue = () => {
    return parseFloat(dashboardData.kpis?.current_month_revenue || 0);
  };

  const getLastMonthRevenue = () => {
    return parseFloat(dashboardData.kpis?.last_month_revenue || 0);
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
    // Use dynamic calculation from backend for company scope (current month hours)
    return parseFloat(dashboardData.kpis?.total_hours_current_month || 0);
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
    if (scope === "employee") {
      const activeEmployees = getActiveEmployees();
      if (activeEmployees === 0) return 0;
      const totalHours = getTotalHoursThisWeek();
      const expectedHours = activeEmployees * 40;
      return Math.round((totalHours / expectedHours) * 100);
    }
    // Use dynamic calculation from backend for company scope
    return parseFloat(dashboardData.kpis?.utilization_percentage || 0);
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
        className="flex h-screen w-full items-center justify-center bg-gray-50"
      >
        <Loader/>
        {/* <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div> */}
      </div>
    );
  }

  const monthlyRevenueData = getMonthlyRevenueData();
  const topPerformers = dashboardData.topPerformers || [];
  const revenueByClient = dashboardData.revenueByClient || [];
  const recentActivity = dashboardData.recentActivity || [];

  console.log('🎨 Rendering Recent Activity:', { 
    count: recentActivity.length, 
    data: recentActivity 
  });

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
              Welcome, {user?.firstName || 'User'}! 👋
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

        {/* 5️⃣ Active Employees - Only show in Company view */}
        {scope === "company" && (
        <div className="bg-blue-200 dark:bg-[#1a202c] rounded-2xl shadow-sm p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[170px]">
    <div className="flex items-center justify-between">
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Active Employees</h3>
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
        <div className="text-[11px] text-gray-500 dark:text-gray-400">Hours This Month</div>
        <div className="font-semibold text-gray-900 dark:text-white">{formatHours(getTotalHoursThisWeek())}</div>
      </div>
        </div>
      </div>
        )}

        {/* 4️⃣ Revenue by Client - Show in both views but filtered by employee in Employee view */}

        {user?.role === "admin" && (
          <div className="bg-cyan-50 dark:bg-[#1a202c] rounded-2xl shadow-sm p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 flex flex-col gap-4 h-[280px]">
      <div className="flex items-center justify-between flex-shrink-0">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
          {scope === "employee" ? "My Clients" : "Revenue by Client"}
        </h3>
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-cyan-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300">
          <i className="fas fa-building"></i>
        </div>
      </div>

      {/* Scrollable container with fixed height */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {revenueByClient.length > 0 ? (
          revenueByClient.map((client, index) => (
            <div
              key={client.id}
              className="flex items-center justify-between bg-gray-50 dark:bg-[#2d3748] p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-[#374151] transition-colors" 
            >
              <div className="flex flex-col min-w-0 flex-1">
                <div className="font-medium dark:text-gray-100 truncate">{client.client_name}</div>
                {/* <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{client.email}</div> */}
              </div>
              <div className="font-semibold text-gray-900 dark:text-white ml-3 flex-shrink-0">
                {formatCurrency(client.total_revenue)}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">
            {scope === "employee" ? "No clients assigned" : "No client revenue data available"}
          </div>
        )}
          </div>
        </div>
        )}

        {/* 5️⃣ Revenue by Vendor - Show in admin view only */}
        {user?.role === "admin" && (
          <div className="bg-cyan-50 dark:bg-[#1a202c] rounded-2xl shadow-sm p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 flex flex-col gap-4 h-[280px]">
      <div className="flex items-center justify-between flex-shrink-0">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
          {scope === "employee" ? "My Vendors" : "Revenue by Vendor"}
        </h3>
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-cyan-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300">
          <i className="fas fa-handshake"></i>
        </div>
      </div>

      {/* Scrollable container with fixed height */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {dashboardData.revenueByVendor && dashboardData.revenueByVendor.length > 0 ? (
          dashboardData.revenueByVendor.map((vendor, index) => (
            <div
              key={vendor.id}
              className="flex items-center justify-between bg-gray-50 dark:bg-[#2d3748] p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-[#374151] transition-colors" 
            >
              <div className="flex flex-col min-w-0 flex-1">
                <div className="font-medium dark:text-gray-100 truncate">{vendor.vendor_name}</div>
                {vendor.invoice_count > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {vendor.invoice_count} invoice{vendor.invoice_count !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <div className="font-semibold text-gray-900 dark:text-white ml-3 flex-shrink-0">
                {formatCurrency(vendor.total_revenue || 0)}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">
            {scope === "employee" ? "No vendors assigned" : "No vendors found in the system"}
          </div>
        )}
          </div>
        </div>
        )}

        {/* 2️⃣ Total Revenue - Show in both Company and Employee views */}
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
        <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-300">
        <div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400">Last Month</div>
          <div className="font-semibold text-gray-900 dark:text-white">{formatCurrency(getLastMonthRevenue())}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-gray-500 dark:text-gray-400">Outstanding</div>
          <div className="font-semibold text-gray-900 dark:text-white">{formatCurrency(getOutstandingInvoices())}</div>
        </div>
          </div>
        </div>
        )}

        

        {/* 3️⃣ Monthly Revenue Chart - Show in both views but filtered by employee in Employee view */}
        {user?.role === "admin" && (
          <div className="bg-slate-50 dark:bg-[#1a202c] rounded-2xl shadow-sm p-4 pb-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 col-span-1 md:col-span-2 flex flex-col min-h-[240px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {scope === "employee" ? "My Revenue" : "Monthly Revenue"}
        </h3>
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300">
          <i className="fas fa-chart-line" aria-hidden />
        </div>
      </div>

      <div className="flex-1 min-h-[170px] overflow-hidden">
        <MonthlyRevenueChart
          data={monthlyRevenueData.revenue}
          labels={monthlyRevenueData.months}
          height={170}
        />
          </div>
        </div>
        )}

        {/* 8️⃣ Recent Activity - Improved design matching Employee Dashboard */}
        {/* <div className="bg-slate-100 dark:bg-[#1a202c] rounded-2xl shadow-sm p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 col-span-1 md:col-span-2 flex flex-col h-full">

    <div className="flex items-center justify-between mb-4">
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
        Recent Activity
      </h3>
      <div className="w-10 h-10 flex items-center justify-center rounded-xl 
        bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
        <i className="fas fa-bell"></i>
      </div>
    </div>

    <div className="space-y-3 overflow-y-auto pr-2 max-h-[300px] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">

      {recentActivity.length > 0 ? (
        recentActivity.map((activity, index) => (
          <div
            key={`${activity.activity_type}-${activity.id}-${index}`}
            className="bg-white dark:bg-[#2d3748] p-4 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 flex items-center justify-center rounded-xl flex-shrink-0 ${
                activity.activity_type === 'timesheet' && activity.status === 'approved'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300'
                  : activity.activity_type === 'timesheet' && activity.status === 'submitted'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
                    : activity.activity_type === 'leave' && activity.status === 'approved'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300'
                      : activity.activity_type === 'leave' && activity.status === 'pending'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
                <i className={`fas text-lg ${
                  activity.activity_type === 'timesheet' && activity.status === 'approved' ? 'fa-check-circle' :
                  activity.activity_type === 'timesheet' ? 'fa-clock' :
                  activity.activity_type === 'leave' && activity.status === 'approved' ? 'fa-check-circle' :
                  activity.activity_type === 'leave' ? 'fa-calendar-times' :
                  'fa-info-circle'
                }`}></i>
              </div>

              
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {activity.activity_type === 'timesheet' && activity.status === 'approved'
                    ? 'Timesheet Approved'
                    : activity.activity_type === 'timesheet' && activity.status === 'submitted'
                      ? 'Timesheet Submitted'
                      : activity.activity_type === 'leave' && activity.status === 'approved'
                        ? 'Leave Request Approved'
                        : activity.activity_type === 'leave' && activity.status === 'pending'
                          ? 'Leave Request Submitted'
                          : 'Activity Update'
                  }
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {activity.activity_type === 'timesheet'
                    ? `${activity.employee_name}'s timesheet has been ${activity.status}`
                    : `${activity.employee_name} submitted a leave request`
                  }
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatRelativeTime(activity.created_at)}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                    activity.status === 'approved'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : activity.status === 'submitted' || activity.status === 'pending'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : activity.status === 'rejected'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <i className="fas fa-inbox text-4xl mb-3 opacity-50"></i>
          <div className="font-medium">No recent activity</div>
          <div className="text-sm mt-1">Activity will appear here when timesheets or leave requests are submitted</div>
        </div>
      )}
        </div>
      </div> */}

        {/* 7️⃣ Top Performers - Only show in Company view */}
        {scope === "company" && (
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
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{index + 1}</div>
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
        )}
      </div>
    </div>
  );
};

export default ModernDashboard;
