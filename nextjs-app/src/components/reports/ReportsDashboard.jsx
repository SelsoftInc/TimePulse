'use client';

// src/components/reports/ReportsDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '@/config/api';
import "./ReportsDashboard.css";
import "./ReportsModals.css";
import '../common/ActionsDropdown.css';
import InvoicePDFPreviewModal from '../common/InvoicePDFPreviewModal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper functions outside component to avoid dependency issues
const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const getSunday = (date) => {
  const monday = getMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday;
};

const formatDate = (date) => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const ReportsDashboard = () => {
  const [activeTab, setActiveTab] = useState("client");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleDateString('en-US', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Week range state
  const [weekStart, setWeekStart] = useState(null);
  const [weekEnd, setWeekEnd] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
  
  // Calendar picker state
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Real data from API
  const [clientReportData, setClientReportData] = useState([]);
  const [employeeReportData, setEmployeeReportData] = useState([]);
  const [invoiceReportData, setInvoiceReportData] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Dropdown state for Actions
  const [openActionsId, setOpenActionsId] = useState(null);
  const [actionsType, setActionsType] = useState(null); // 'client', 'employee', 'invoice'
  
  // Export dropdown state
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  
  // Client modals state
  const [showClientDetailsModal, setShowClientDetailsModal] = useState(false);
  const [showClientEditModal, setShowClientEditModal] = useState(false);
  const [showClientDeleteModal, setShowClientDeleteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  
  // Employee modals state
  const [showEmployeeDetailsModal, setShowEmployeeDetailsModal] = useState(false);
  const [showEmployeeEditModal, setShowEmployeeEditModal] = useState(false);
  const [showEmployeeDeleteModal, setShowEmployeeDeleteModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Initialize week range on component mount
  useEffect(() => {
    const today = new Date();
    const monday = getMonday(today);
    const sunday = getSunday(today);
    setWeekStart(monday);
    setWeekEnd(sunday);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(weekStart.getDate() - 7);
    const newEnd = new Date(weekEnd);
    newEnd.setDate(weekEnd.getDate() - 7);
    setWeekStart(newStart);
    setWeekEnd(newEnd);
  };
  
  // Navigate to next week
  const goToNextWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(weekStart.getDate() + 7);
    const newEnd = new Date(weekEnd);
    newEnd.setDate(weekEnd.getDate() + 7);
    setWeekStart(newStart);
    setWeekEnd(newEnd);
  };
  
  // Go to current week
  const goToCurrentWeek = () => {
    const today = new Date();
    const monday = getMonday(today);
    const sunday = getSunday(today);
    setWeekStart(monday);
    setWeekEnd(sunday);
  };
  
  // Check if current week is selected
  const isCurrentWeek = () => {
    if (!weekStart || !weekEnd) return false;
    const today = new Date();
    const currentMonday = getMonday(today);
    const currentSunday = getSunday(today);
    return weekStart.toDateString() === currentMonday.toDateString() && 
           weekEnd.toDateString() === currentSunday.toDateString();
  };
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    const currentDate = new Date(`${selectedMonth} 1, ${selectedYear}`);
    currentDate.setMonth(currentDate.getMonth() - 1);
    setSelectedMonth(currentDate.toLocaleDateString('en-US', { month: 'long' }));
    setSelectedYear(currentDate.getFullYear().toString());
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    const currentDate = new Date(`${selectedMonth} 1, ${selectedYear}`);
    currentDate.setMonth(currentDate.getMonth() + 1);
    setSelectedMonth(currentDate.toLocaleDateString('en-US', { month: 'long' }));
    setSelectedYear(currentDate.getFullYear().toString());
  };
  
  // Go to current month
  const goToCurrentMonth = () => {
    const today = new Date();
    setSelectedMonth(today.toLocaleDateString('en-US', { month: 'long' }));
    setSelectedYear(today.getFullYear().toString());
  };
  
  // Check if current month is selected
  const isCurrentMonth = () => {
    const today = new Date();
    const currentMonth = today.toLocaleDateString('en-US', { month: 'long' });
    const currentYear = today.getFullYear().toString();
    return selectedMonth === currentMonth && selectedYear === currentYear;
  };
  
  // Calendar functions
  const handleDateDisplayClick = () => {
    setShowCalendar(!showCalendar);
  };
  
  const handleCalendarMonthChange = (direction) => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(calendarDate.getMonth() + direction);
    setCalendarDate(newDate);
  };
  
  const handleWeekSelect = (weekStartDate) => {
    const weekEndDate = getSunday(weekStartDate);
    setWeekStart(weekStartDate);
    setWeekEnd(weekEndDate);
    setShowCalendar(false);
  };
  
  const handleMonthSelect = (month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year.toString());
    setShowCalendar(false);
  };
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };
  
  const isDateInSelectedWeek = (date) => {
    if (!weekStart || !weekEnd) return false;
    return date >= weekStart && date <= weekEnd;
  };
  
  const isDateInSelectedMonth = (date) => {
    const dateMonth = date.toLocaleDateString('en-US', { month: 'long' });
    const dateYear = date.getFullYear().toString();
    return dateMonth === selectedMonth && dateYear === selectedYear;
  };
  
  // PDF Modal state
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [selectedInvoiceForPDF, setSelectedInvoiceForPDF] = useState(null);
  
  // Invoice Details Modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInvoiceForDetails, setSelectedInvoiceForDetails] = useState(null);

  // Pagination state
  const [clientPage, setClientPage] = useState(1);
  const [employeePage, setEmployeePage] = useState(1);
  const [invoicePage, setInvoicePage] = useState(1);
  const itemsPerPage = 10;

  // Fetch data from API - wrapped in useCallback to prevent infinite loops
  const fetchReportsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
      if (!userInfo.tenantId) {
        throw new Error("No tenant information available");
      }

      // Calculate date range based on view mode
      let startDate, endDate;
      
      if (viewMode === 'week' && weekStart && weekEnd) {
        startDate = new Date(weekStart);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(weekEnd);
        endDate.setHours(23, 59, 59, 999);
      } else {
        // Month view
        const year = parseInt(selectedYear);
        const monthIndex = new Date(`${selectedMonth} 1, ${year}`).getMonth();
        startDate = new Date(year, monthIndex, 1);
        endDate = new Date(year, monthIndex + 1, 0);
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      // Fetch all report data in parallel
      console.log('🔍 Fetching reports with:', {
        tenantId: userInfo.tenantId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const [clientsRes, employeesRes, invoicesRes, analyticsRes] =
        await Promise.all([
           fetch(
            `${API_BASE}/api/reports/clients?tenantId=${
              userInfo.tenantId
            }&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
            { headers }
          ).catch(err => {
             console.error('❌ Client reports fetch failed:', err);
             throw err;
           }),
           fetch(
            `${API_BASE}/api/reports/employees?tenantId=${
              userInfo.tenantId
            }&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
            { headers }
          ).catch(err => {
             console.error('❌ Employee reports fetch failed:', err);
             throw err;
           }),
           fetch(
            `${API_BASE}/api/reports/invoices?tenantId=${
              userInfo.tenantId
            }&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
            { headers }
          ).catch(err => {
             console.error('❌ Invoice reports fetch failed:', err);
             throw err;
           }),
           fetch(
            `${API_BASE}/api/reports/analytics?tenantId=${userInfo.tenantId}&period=month`,
            { headers }
          ).catch(err => {
             console.error('❌ Analytics fetch failed:', err);
             throw err;
           }),
        ]);

      // Process responses
      const [clientsData, employeesData, invoicesData, analyticsData] =
        await Promise.all([
          clientsRes.json(),
          employeesRes.json(),
          invoicesRes.json(),
          analyticsRes.json(),
        ]);

      if (clientsData.success) {
        setClientReportData(clientsData.data || []);
      } else {
        console.error("Failed to fetch client reports:", clientsData.error);
      }

      if (employeesData.success) {
        setEmployeeReportData(employeesData.data || []);
      } else {
        console.error("Failed to fetch employee reports:", employeesData.error);
      }

      if (invoicesData.success) {
        setInvoiceReportData(invoicesData.data || []);
      } else {
        console.error("Failed to fetch invoice reports:", invoicesData.error);
      }

      if (analyticsData.success) {
        setAnalyticsData(analyticsData.data || null);
      } else {
        console.error("Failed to fetch analytics:", analyticsData.error);
      }
    } catch (error) {
      console.error("Error fetching reports data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [viewMode, weekStart, weekEnd, selectedMonth, selectedYear]);

  useEffect(() => {
    if (viewMode === 'week' && weekStart && weekEnd) {
      fetchReportsData();
    } else if (viewMode === 'month') {
      fetchReportsData();
    }
  }, [viewMode, weekStart, weekEnd, selectedMonth, selectedYear, fetchReportsData]);

  // Export functionality
  const handleExport = (format) => {
    const dateRange = viewMode === 'week' && weekStart && weekEnd
      ? `${formatDate(weekStart)} - ${formatDate(weekEnd)}`
      : `${selectedMonth} ${selectedYear}`;

    if (activeTab === 'client') {
      exportClientData(format, dateRange);
    } else if (activeTab === 'employee') {
      exportEmployeeData(format, dateRange);
    } else if (activeTab === 'invoice') {
      exportInvoiceData(format, dateRange);
    }
    
    // Close dropdown after export
    setShowExportDropdown(false);
  };

  const exportClientData = (format, dateRange) => {
    if (format === 'excel') {
      // Prepare data for Excel
      const worksheetData = [
        ['Client Report - ' + dateRange],
        [],
        ['Client Name', 'Total Hours', 'Total Employees', 'Total Billed ($)'],
        ...clientReportData.map(client => [
          client.name,
          client.totalHours,
          client.totalEmployees,
          client.totalBilled
        ]),
        [],
        ['Summary'],
        ['Total Clients', clientReportData.length],
        ['Total Hours', totalHours],
        ['Total Amount', `$${totalAmount.toLocaleString()}`]
      ];

      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Client Report');
      XLSX.writeFile(wb, `Client_Report_${dateRange.replace(/\s+/g, '_')}.xlsx`);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text(`Client Report - ${dateRange}`, 14, 15);
      autoTable(doc, {
        head: [['Client Name', 'Total Hours', 'Total Employees', 'Total Billed ($)']],
        body: clientReportData.map(client => [
          client.name,
          client.totalHours,
          client.totalEmployees,
          `$${client.totalBilled.toLocaleString()}`
        ]),
        startY: 25
      });
      doc.save(`Client_Report_${dateRange.replace(/\s+/g, '_')}.pdf`);
    }
  };

  const exportEmployeeData = (format, dateRange) => {
    if (format === 'excel') {
      const worksheetData = [
        ['Employee Report - ' + dateRange],
        [],
        ['Employee Name', 'Client', 'Project', 'Total Hours', 'Utilization %'],
        ...employeeReportData.map(emp => [
          emp.name,
          emp.clientName,
          emp.projectName,
          emp.totalHours,
          emp.utilization
        ]),
        [],
        ['Summary'],
        ['Total Employees', employeeReportData.length],
        ['Total Hours', employeeReportData.reduce((sum, emp) => sum + emp.totalHours, 0)]
      ];

      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Employee Report');
      XLSX.writeFile(wb, `Employee_Report_${dateRange.replace(/\s+/g, '_')}.xlsx`);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text(`Employee Report - ${dateRange}`, 14, 15);
      autoTable(doc, {
        head: [['Employee Name', 'Client', 'Project', 'Total Hours', 'Utilization %']],
        body: employeeReportData.map(emp => [
          emp.name,
          emp.clientName,
          emp.projectName,
          emp.totalHours,
          `${emp.utilization}%`
        ]),
        startY: 25
      });
      doc.save(`Employee_Report_${dateRange.replace(/\s+/g, '_')}.pdf`);
    }
  };

  const exportInvoiceData = (format, dateRange) => {
    if (format === 'excel') {
      const worksheetData = [
        ['Invoice Report - ' + dateRange],
        [],
        ['Invoice ID', 'Client', 'Month', 'Issue Date', 'Hours', 'Amount ($)', 'Status'],
        ...invoiceReportData.map(inv => [
          inv.invoiceNumber || inv.id,
          inv.clientName,
          `${inv.month} ${inv.year}`,
          inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : 'N/A',
          inv.totalHours,
          inv.amount,
          inv.status
        ]),
        [],
        ['Summary'],
        ['Total Invoices', invoiceReportData.length],
        ['Total Hours', invoiceReportData.reduce((sum, inv) => sum + inv.totalHours, 0)],
        ['Total Amount', `$${invoiceReportData.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}`]
      ];

      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Invoice Report');
      XLSX.writeFile(wb, `Invoice_Report_${dateRange.replace(/\s+/g, '_')}.xlsx`);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text(`Invoice Report - ${dateRange}`, 14, 15);
      autoTable(doc, {
        head: [['Invoice ID', 'Client', 'Month', 'Issue Date', 'Hours', 'Amount', 'Status']],
        body: invoiceReportData.map(inv => [
          inv.invoiceNumber || inv.id,
          inv.clientName,
          `${inv.month} ${inv.year}`,
          inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : 'N/A',
          inv.totalHours,
          `$${inv.amount.toLocaleString()}`,
          inv.status
        ]),
        startY: 25
      });
      doc.save(`Invoice_Report_${dateRange.replace(/\s+/g, '_')}.pdf`);
    }
  };

  // Close dropdown and calendar on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.actions-dropdown')) {
        setOpenActionsId(null);
        setActionsType(null);
      }
      if (!event.target.closest('.date-range-navigator') && !event.target.closest('.calendar-picker')) {
        setShowCalendar(false);
      }
      if (!event.target.closest('.export-dropdown-container')) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Toggle Actions dropdown
  const toggleActions = (id, type) => {
    if (openActionsId === id && actionsType === type) {
      setOpenActionsId(null);
      setActionsType(null);
    } else {
      setOpenActionsId(id);
      setActionsType(type);
    }
  };

  // fetchReportsData moved above as useCallback

  // Calculate total hours and amount for all clients
  const totalHours = clientReportData.reduce(
    (sum, client) => sum + client.totalHours,
    0
  );
  const totalAmount = clientReportData.reduce(
    (sum, client) => sum + client.totalBilled,
    0
  );

  // Function to render client-wise report
  const renderClientReport = () => {
    // Pagination calculations
    const totalClients = clientReportData.length;
    const totalPages = Math.ceil(totalClients / itemsPerPage);
    const startIndex = (clientPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedClients = clientReportData.slice(startIndex, endIndex);

    return (
      <>
        {/* Summary Cards - Tailwind Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Total Hours Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="mb-4">
              <h6 className="text-sm font-semibold text-gray-700">Total Hours</h6>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-gray-900">{totalHours}</span>
              <span className="text-sm text-gray-500 mt-1">
                {selectedMonth} {selectedYear}
              </span>
            </div>
          </div>

          {/* Total Billed Amount Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="mb-4">
              <h6 className="text-sm font-semibold text-gray-700">Total Billed Amount</h6>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-gray-900">
                ${totalAmount.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500 mt-1">
                {selectedMonth} {selectedYear}
              </span>
            </div>
          </div>

          {/* Total Clients Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="mb-4">
              <h6 className="text-sm font-semibold text-gray-700">Total Clients</h6>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-gray-900">{clientReportData.length}</span>
              <span className="text-sm text-gray-500 mt-1">Active Clients</span>
            </div>
          </div>
        </div>

        <div className="nk-block mt-4">
          <div className="card card-bordered card-stretch">
            <div className="card-inner-group">
              <div className="card-inne position-relative">
                <div className="card-title-group">
                  <div className="card-title">
                    <h5 className="title">Client-wise Monthly Report</h5>
                  </div>
                </div>
              </div>

              <div className="card-inner p-0">
                <div className="nk-tb-list nk-tb-ulist">
                  <div className="nk-tb-item nk-tb-head">
                    <div className="nk-tb-col">
                      <span className="sub-text">Client Name</span>
                    </div>
                    <div className="nk-tb-col tb-col-md">
                      <span className="sub-text">Total Hours</span>
                    </div>
                    <div className="nk-tb-col tb-col-md">
                      <span className="sub-text">Total Employees</span>
                    </div>
                    <div className="nk-tb-col">
                      <span className="sub-text">Total Billed ($)</span>
                    </div>
                    <div className="nk-tb-col nk-tb-col-tools text-end">
                      Actions
                    </div>
                  </div>

                  {paginatedClients.map((client) => (
                    <div key={client.id} className="nk-tb-item">
                      <div className="nk-tb-col">
                        <span className="tb-lead">{client.name}</span>
                      </div>
                      <div className="nk-tb-col tb-col-md">
                        <span>{client.totalHours}</span>
                      </div>
                      <div className="nk-tb-col tb-col-md">
                        <span>{client.totalEmployees}</span>
                      </div>
                      <div className="nk-tb-col">
                        <span className="tb-amount">
                          ${client.totalBilled.toLocaleString()}
                        </span>
                      </div>
                      <div className="nk-tb-col nk-tb-col-tools">
                        <div className="actions-dropdown">
                          <div className="dropdown">
                            <button
                              className="btn btn-sm btn-outline-secondary dropdown-toggle"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleActions(client.id, 'client');
                              }}
                              type="button"
                            >
                              Actions
                            </button>
                            {openActionsId === client.id && actionsType === 'client' && (
                              <div className="dropdown-menu dropdown-menu-right show">
                                <button
                                  className="dropdown-item"
                                  onClick={() => {
                                    setSelectedClient(client);
                                    setShowClientDetailsModal(true);
                                    setOpenActionsId(null);
                                    setActionsType(null);
                                  }}
                                >
                                  <i className="fas fa-eye mr-1"></i> View Details
                                </button>
                                <button
                                  className="dropdown-item"
                                  onClick={() => {
                                    setSelectedClient(client);
                                    setShowClientEditModal(true);
                                    setOpenActionsId(null);
                                    setActionsType(null);
                                  }}
                                >
                                  <i className="fas fa-edit mr-1"></i> Edit
                                </button>
                                {/* <button
                                  className="dropdown-item text-danger"
                                  onClick={() => {
                                    setSelectedClient(client);
                                    setShowClientDeleteModal(true);
                                    setOpenActionsId(null);
                                    setActionsType(null);
                                  }}
                                >
                                  <i className="fas fa-trash mr-1"></i> Delete
                                </button> */}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {totalClients > itemsPerPage && (
                <div className="card-inner">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing <span className="font-semibold">{startIndex + 1}</span> to{" "}
                      <span className="font-semibold">{Math.min(endIndex, totalClients)}</span> of{" "}
                      <span className="font-semibold">{totalClients}</span> entries
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setClientPage(clientPage - 1)}
                        disabled={clientPage === 1}
                        className="flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-700 disabled:hover:text-gray-700 dark:disabled:hover:text-gray-300 disabled:hover:border-gray-300 dark:disabled:hover:border-gray-600 transition-all duration-200"
                      >
                        <i className="fas fa-chevron-left text-xs"></i>
                      </button>
                      <div className="flex items-center gap-2 px-3">
                        <span className="text-base font-bold text-blue-600 dark:text-blue-400">{clientPage}</span>
                        <span className="text-sm text-gray-400 dark:text-gray-500">/</span>
                        <span className="text-base font-semibold text-gray-600 dark:text-gray-400">{totalPages}</span>
                      </div>
                      <button
                        onClick={() => setClientPage(clientPage + 1)}
                        disabled={clientPage === totalPages}
                        className="flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-700 disabled:hover:text-gray-700 dark:disabled:hover:text-gray-300 disabled:hover:border-gray-300 dark:disabled:hover:border-gray-600 transition-all duration-200"
                      >
                        <i className="fas fa-chevron-right text-xs"></i>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="nk-block mt-4">
          <div className="card card-bordered card-stretch">
            <div className="card-inner-group">
              <div className="card-inne position-relative">
                <div className="card-title-group">
                  <div className="card-title">
                    <h5 className="title">Project Distribution</h5>
                  </div>
                </div>
              </div>

              <div className="card-inne">
                <div className="card-grid">
                  {clientReportData.map((client) => (
                    <div key={client.id} className="client-project-card">
                      <h6 className="client-name">{client.name}</h6>
                      <div className="project-list">
                        {client.projects.map((project, index) => {
                          const percentage =
                            client.totalHours > 0
                              ? (project.hours / client.totalHours) * 100
                              : 0;

                          let progressColorClass = "";
                          if (percentage > 75) {
                            progressColorClass = "progress-green";
                          } else if (percentage >= 40) {
                            progressColorClass = "progress-orange";
                          } else {
                            progressColorClass = "progress-red";
                          }

                          return (
                            <div key={index} className="project-item">
                              <div className="project-info">
                                <span className="project-name">
                                  {project.name}
                                </span>
                                <div className="project-details">
                                  <span>{project.hours} hrs</span>
                                  <span>{project.employees} employees</span>
                                </div>
                              </div>
                              <div className="project-progress">
                                <div className="progress">
                                  <div
                                    className={`progress-bar ${progressColorClass}`}
                                    style={{ width: `${percentage}%` }}
                                  >
                                    <span className="progress-percent-inside">
                                      {Math.round(percentage)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Function to render employee-wise report
  const renderEmployeeReport = () => {
    // Pagination calculations
    const totalEmployees = employeeReportData.length;
    const totalPages = Math.ceil(totalEmployees / itemsPerPage);
    const startIndex = (employeePage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedEmployees = employeeReportData.slice(startIndex, endIndex);

    return (
      <>
        <div className="nk-block">
          <div className="card card-bordered card-stretch">
            <div className="card-inner-group">
              <div className="card-inne position-relative">
                <div className="card-title-group">
                  <div className="card-title">
                    <h5 className="title">Employee-wise Timesheet Report</h5>
                  </div>
                </div>
              </div>

              <div className="card-inner p-0">
                <div className="nk-tb-list nk-tb-ulist">
                  <div className="nk-tb-item nk-tb-head">
                    <div className="nk-tb-col">
                      <span className="sub-text">Employee Name</span>
                    </div>
                    <div className="nk-tb-col tb-col-md">
                      <span className="sub-text">Client</span>
                    </div>
                    <div className="nk-tb-col tb-col-md">
                      <span className="sub-text">Project</span>
                    </div>
                    <div className="nk-tb-col">
                      <span className="sub-text">Total Hours</span>
                    </div>
                    <div className="nk-tb-col tb-col-md">
                      <span className="sub-text">Utilization %</span>
                    </div>
                    <div className="nk-tb-col nk-tb-col-tools text-end">
                      Actions
                    </div>
                  </div>

                  {paginatedEmployees.map((employee) => (
                    <div key={employee.id} className="nk-tb-item">
                      <div className="nk-tb-col">
                        <div className="user-card">
                          <div className="user-avatar bg-primary">
                            <span>
                              {employee.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          </div>
                          <div className="user-info">
                            <span className="tb-lead">{employee.name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="nk-tb-col tb-col-md">
                        <span>{employee.clientName}</span>
                      </div>
                      <div className="nk-tb-col tb-col-md">
                        <span>{employee.projectName}</span>
                      </div>
                      <div className="nk-tb-col">
                        <span>{employee.totalHours} hrs</span>
                      </div>
                      <div className="nk-tb-col tb-col-md">
                        <div className="d-flex align-items-center">
                          <div className="progress-status">
                            {employee.utilization}%
                          </div>
                          <div className="progress" style={{ width: "100px" }}>
                            <div
                              className={`progress-bar ${
                                employee.utilization >= 100
                                  ? "bg-success"
                                  : employee.utilization >= 90
                                  ? "bg-info"
                                  : "bg-warning"
                              }`}
                              style={{
                                width: `${Math.min(
                                  employee.utilization,
                                  100
                                )}%`}}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="nk-tb-col nk-tb-col-tools">
                        <div className="actions-dropdown">
                          <div className="dropdown">
                            <button
                              className="btn btn-sm btn-outline-secondary dropdown-toggle"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleActions(employee.id, 'employee');
                              }}
                              type="button"
                            >
                              Actions
                            </button>
                            {openActionsId === employee.id && actionsType === 'employee' && (
                              <div className="dropdown-menu dropdown-menu-right show">
                                <button
                                  className="dropdown-item"
                                  onClick={() => {
                                    setSelectedEmployee(employee);
                                    setShowEmployeeDetailsModal(true);
                                    setOpenActionsId(null);
                                    setActionsType(null);
                                  }}
                                >
                                  <i className="fas fa-eye mr-1"></i> View Details
                                </button>
                                <button
                                  className="dropdown-item"
                                  onClick={() => {
                                    setSelectedEmployee(employee);
                                    setShowEmployeeEditModal(true);
                                    setOpenActionsId(null);
                                    setActionsType(null);
                                  }}
                                >
                                  <i className="fas fa-edit mr-1"></i> Edit
                                </button>
                                {/* <button
                                  className="dropdown-item text-danger"
                                  onClick={() => {
                                    setSelectedEmployee(employee);
                                    setShowEmployeeDeleteModal(true);
                                    setOpenActionsId(null);
                                    setActionsType(null);
                                  }}
                                >
                                  <i className="fas fa-trash mr-1"></i> Delete
                                </button> */}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {totalEmployees > itemsPerPage && (
                <div className="card-inner">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing <span className="font-semibold">{startIndex + 1}</span> to{" "}
                      <span className="font-semibold">{Math.min(endIndex, totalEmployees)}</span> of{" "}
                      <span className="font-semibold">{totalEmployees}</span> entries
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setEmployeePage(employeePage - 1)}
                        disabled={employeePage === 1}
                        className="flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-700 disabled:hover:text-gray-700 dark:disabled:hover:text-gray-300 disabled:hover:border-gray-300 dark:disabled:hover:border-gray-600 transition-all duration-200"
                      >
                        <i className="fas fa-chevron-left text-xs"></i>
                      </button>
                      <div className="flex items-center gap-2 px-3">
                        <span className="text-base font-bold text-blue-600 dark:text-blue-400">{employeePage}</span>
                        <span className="text-sm text-gray-400 dark:text-gray-500">/</span>
                        <span className="text-base font-semibold text-gray-600 dark:text-gray-400">{totalPages}</span>
                      </div>
                      <button
                        onClick={() => setEmployeePage(employeePage + 1)}
                        disabled={employeePage === totalPages}
                        className="flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-700 disabled:hover:text-gray-700 dark:disabled:hover:text-gray-300 disabled:hover:border-gray-300 dark:disabled:hover:border-gray-600 transition-all duration-200"
                      >
                        <i className="fas fa-chevron-right text-xs"></i>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="nk-block mt-">
          <div className="card card-borderd card-stretc">
            <div className="card-inner-grou">
              <div className="card-inne position-relative">
                <div className="card-title-group">
                  <div className="card-title">
                    <h5 className="title">Weekly Breakdown</h5>
                  </div>
                </div>
              </div>

              <div className="nk-block mt-4">
                <div className="row g-gs">
                  {employeeReportData.map((employee) => (
                    <div key={employee.id} className="col-md-6 col-lg-4">
                      <div className="weekly-breakdown-card">
                        <h6 className="employee-name">{employee.name}</h6>
                        <div className="weekly-hours">
                          <div className="week-labels">
                            <span>Week 1</span>
                            <span>Week 2</span>
                            <span>Week 3</span>
                            <span>Week 4</span>
                          </div>
                          <div className="hour-bars">
                            {employee.weeklyBreakdown.map((hours, index) => (
                              <div key={index} className="hour-bar-container">
                                <div
                                  className={`hour-bar ${
                                    hours >= 40 ? "full" : "partial"
                                  }`}
                                  style={{ height: `${(hours / 50) * 100}%` }}
                                >
                                  <span className="hour-value">{hours}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="total-summary">
                          <div className="summary-item">
                            <span className="label">Total Hours:</span>
                            <span className="value">{employee.totalHours}</span>
                          </div>
                          <div className="summary-item">
                            <span className="label">Utilization:</span>
                            <span
                              className={`value ${
                                employee.utilization >= 100
                                  ? "text-success"
                                  : employee.utilization >= 90
                                  ? "text-info"
                                  : "text-warning"
                              }`}
                            >
                              {employee.utilization}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* */}
            </div>
          </div>
        </div>
      </>
    );
  };

  // Function to render invoice report
  const renderInvoiceReport = () => {
    // Pagination calculations
    const totalInvoices = invoiceReportData.length;
    const totalPages = Math.ceil(totalInvoices / itemsPerPage);
    const startIndex = (invoicePage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedInvoices = invoiceReportData.slice(startIndex, endIndex);

    return (
      <div className="nk-block">
        <div className="card card-bordered card-stretch">
          <div className="card-inner-group">
            <div className="card-inne position-relative">
              <div className="card-title-group">
                <div className="card-title">
                  <h5 className="title">Invoice Report</h5>
                </div>
              </div>
              <div className="nk-tb-list nk-tb-orders">
                <div className="nk-tb-item nk-tb-head">
                  <div className="nk-tb-col">
                    <span>Invoice ID</span>
                  </div>
                  <div className="nk-tb-col tb-col-md">
                    <span>Client</span>
                  </div>
                  <div className="nk-tb-col tb-col-md">
                    <span>Month</span>
                  </div>
                  <div className="nk-tb-col tb-col-md">
                    <span>Issue Date</span>
                  </div>
                  <div className="nk-tb-col tb-col-md">
                    <span>Hours</span>
                  </div>
                  <div className="nk-tb-col">
                    <span>Amount</span>
                  </div>
                  <div className="nk-tb-col">
                    <span>Status</span>
                  </div>
                  <div className="nk-tb-col nk-tb-col-tools text-end">
                    <span className="sub-text">Actions</span>
                  </div>
                </div>
                {paginatedInvoices.map((invoice) => (
                  <div key={invoice.id} className={`nk-tb-item ${openActionsId === invoice.id ? 'dropdown-open' : ''}`}>
                    <div className="nk-tb-col">
                      <span className="tb-lead">{invoice.invoiceNumber || invoice.id}</span>
                    </div>
                    <div className="nk-tb-col tb-col-md">
                      <span>{invoice.clientName}</span>
                    </div>
                    <div className="nk-tb-col tb-col-md">
                      <span>
                        {invoice.month} {invoice.year}
                      </span>
                    </div>
                    <div className="nk-tb-col tb-col-md">
                      <span>
                        {invoice.issueDate 
                          ? new Date(invoice.issueDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: '2-digit',
                              year: 'numeric'
                            })
                          : invoice.createdAt 
                            ? new Date(invoice.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: '2-digit',
                                year: 'numeric'
                              })
                            : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="nk-tb-col tb-col-md">
                      <span>{invoice.totalHours}</span>
                    </div>
                    <div className="nk-tb-col">
                      <span className="tb-amount">
                        ${invoice.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="nk-tb-col">
                      <span
                        className={`badge bg-outline-${
                          invoice.status === "Paid"
                            ? "success"
                            : invoice.status === "Pending"
                            ? "warning"
                            : "danger"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </div>
                    <div className="nk-tb-col nk-tb-col-tools">
                      <div className="actions-dropdown">
                        <div className="dropdown">
                          <button
                            className="btn btn-sm btn-outline-secondary dropdown-toggle"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActions(invoice.id, 'invoice');
                            }}
                            type="button"
                          >
                            Actions
                          </button>
                          {openActionsId === invoice.id && actionsType === 'invoice' && (
                            <div className="dropdown-menu dropdown-menu-right show">
                              <button
                                className="dropdown-item"
                                onClick={() => {
                                  setSelectedInvoiceForDetails(invoice);
                                  setShowDetailsModal(true);
                                  setOpenActionsId(null);
                                  setActionsType(null);
                                }}
                              >
                                <i className="fas fa-eye mr-1"></i> View Details
                              </button>
                              <button
                                className="dropdown-item"
                                onClick={() => {
                                  setSelectedInvoiceForPDF(invoice);
                                  setShowPDFModal(true);
                                  setOpenActionsId(null);
                                  setActionsType(null);
                                }}
                              >
                                <i className="fas fa-download mr-1"></i> Download Invoice
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalInvoices > itemsPerPage && (
                <div className="card-inner">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing <span className="font-semibold">{startIndex + 1}</span> to{" "}
                      <span className="font-semibold">{Math.min(endIndex, totalInvoices)}</span> of{" "}
                      <span className="font-semibold">{totalInvoices}</span> entries
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setInvoicePage(invoicePage - 1)}
                        disabled={invoicePage === 1}
                        className="flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-700 disabled:hover:text-gray-700 dark:disabled:hover:text-gray-300 disabled:hover:border-gray-300 dark:disabled:hover:border-gray-600 transition-all duration-200"
                      >
                        <i className="fas fa-chevron-left text-xs"></i>
                      </button>
                      <div className="flex items-center gap-2 px-3">
                        <span className="text-base font-bold text-blue-600 dark:text-blue-400">{invoicePage}</span>
                        <span className="text-sm text-gray-400 dark:text-gray-500">/</span>
                        <span className="text-base font-semibold text-gray-600 dark:text-gray-400">{totalPages}</span>
                      </div>
                      <button
                        onClick={() => setInvoicePage(invoicePage + 1)}
                        disabled={invoicePage === totalPages}
                        className="flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-700 disabled:hover:text-gray-700 dark:disabled:hover:text-gray-300 disabled:hover:border-gray-300 dark:disabled:hover:border-gray-600 transition-all duration-200"
                      >
                        <i className="fas fa-chevron-right text-xs"></i>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Function to render analytics report
  // eslint-disable-next-line no-unused-vars
  const renderAnalyticsReport = () => {
    if (!analyticsData) {
      return (
        <div className="nk-block">
          <div className="card">
            <div className="card-inner text-center p-4">
              <p className="text-muted">No analytics data available</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="nk-block">
        <div className="row g-gs">
          {/* Summary Cards */}
          <div className="col-md-3 col-sm-6">
            <div className="card card-bordered">
              <div className="card-inner">
                <div className="card-title-group align-start mb-2">
                  <div className="card-title">
                    <h6 className="title">Total Hours</h6>
                  </div>
                </div>
                <div className="amount">{analyticsData.summary.totalHours}</div>
                <div className="change up text-success">
                  <em className="icon ni ni-arrow-long-up"></em>
                  <span>vs last period</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="card card-bordered">
              <div className="card-inner">
                <div className="card-title-group align-start mb-2">
                  <div className="card-title">
                    <h6 className="title">Total Revenue</h6>
                  </div>
                </div>
                <div className="amount">
                  ${analyticsData.summary.totalRevenue.toLocaleString()}
                </div>
                <div className="change up text-success">
                  <em className="icon ni ni-arrow-long-up"></em>
                  <span>vs last period</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="card card-bordered">
              <div className="card-inner">
                <div className="card-title-group align-start mb-2">
                  <div className="card-title">
                    <h6 className="title">Active Employees</h6>
                  </div>
                </div>
                <div className="amount">
                  {analyticsData.summary.totalEmployees}
                </div>
                <div className="change up text-success">
                  <em className="icon ni ni-arrow-long-up"></em>
                  <span>vs last period</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="card card-bordered">
              <div className="card-inner">
                <div className="card-title-group align-start mb-2">
                  <div className="card-title">
                    <h6 className="title">Active Clients</h6>
                  </div>
                </div>
                <div className="amount">
                  {analyticsData.summary.totalClients}
                </div>
                <div className="change up text-success">
                  <em className="icon ni ni-arrow-long-up"></em>
                  <span>vs last period</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hours by Client */}
          <div className="col-md-6">
            <div className="card card-bordered">
              <div className="card-inner">
                <div className="card-title-group align-start mb-2">
                  <div className="card-title">
                    <h6 className="title">Hours by Client</h6>
                  </div>
                </div>
                <div className="nk-tb-list nk-tb-orders">
                  {analyticsData.hoursByClient
                    .slice(0, 5)
                    .map((client, index) => (
                      <div key={index} className="nk-tb-item">
                        <div className="nk-tb-col">
                          <span className="tb-lead">{client.name}</span>
                        </div>
                        <div className="nk-tb-col">
                          <span className="tb-amount">{client.hours} hrs</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Hours by Employee */}
          <div className="col-md-6">
            <div className="card card-bordered">
              <div className="card-inner">
                <div className="card-title-group align-start mb-2">
                  <div className="card-title">
                    <h6 className="title">Hours by Employee</h6>
                  </div>
                </div>
                <div className="nk-tb-list nk-tb-orders">
                  {analyticsData.hoursByEmployee
                    .slice(0, 5)
                    .map((employee, index) => (
                      <div key={index} className="nk-tb-item">
                        <div className="nk-tb-col">
                          <span className="tb-lead">{employee.name}</span>
                        </div>
                        <div className="nk-tb-col">
                          <span className="tb-amount">
                            {employee.hours} hrs
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="reports-dashboard-scope">
      <div className="max-w-8xl mx-auto space-y-4">
        
        {/* ================= REPORTS HEADER ================= */}
        <div className="sticky top-4 z-30 mb-9 rounded-3xl bg-[#7cbdf2] dark:bg-gradient-to-br dark:from-[#0f1a25] dark:via-[#121f33] dark:to-[#162a45] shadow-sm dark:shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md border border-transparent dark:border-white/5">
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              
              {/* ================= LEFT ================= */}
              <div className="relative pl-5">
                <span className="absolute left-0 top-2 h-10 w-1 rounded-full bg-purple-900" />
                <h1 className="text-[2rem] font-bold text-white leading-[1.15] tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.18)]">
                  Reports & Analytics
                </h1>
                <p className="mt-1 text-sm text-white/80">
                  View detailed reports and analytics for clients and employees
                </p>
              </div>

              {/* ================= RIGHT CONTROLS ================= */}
              <div className="flex flex-wrap items-center justify-start gap-3 lg:justify-end">
                {/* View Mode Toggle */}
                <div className="flex rounded-full bg-white/20 p-1 backdrop-blur">
                  <button
                    onClick={() => setViewMode("month")}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition
                      ${viewMode === "month"
                        ? "bg-slate-900 text-white shadow"
                        : "text-white/80 hover:bg-white/20"
                      }`}
                  >
                    <i className="fas fa-calendar-alt text-sm" />
                    Month
                  </button>

                  <button
                    onClick={() => setViewMode("week")}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition
                      ${viewMode === "week"
                        ? "bg-slate-900 text-white shadow"
                        : "text-white/80 hover:bg-white/20"
                      }`}
                  >
                    <i className="fas fa-calendar-week text-sm" />
                    Week
                  </button>
                </div>

                {/* Date Navigator */}
                <div className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-2 text-sm text-white backdrop-blur">
                  <button onClick={viewMode === "month" ? goToPreviousMonth : goToPreviousWeek}>
                    <i className="fas fa-chevron-left" />
                  </button>

                  <div
                    onClick={handleDateDisplayClick}
                    className="cursor-pointer font-medium"
                  >
                    {viewMode === "month"
                      ? `${selectedMonth} ${selectedYear}`
                      : weekStart && weekEnd ? `${formatDate(weekStart)} - ${formatDate(weekEnd)}` : ''}
                  </div>

                  <button onClick={viewMode === "month" ? goToNextMonth : goToNextWeek}>
                    <i className="fas fa-chevron-right" />
                  </button>
                </div>

                {/* Today Button */}
                {(viewMode === "month" && !isCurrentMonth()) ||
                (viewMode === "week" && !isCurrentWeek()) ? (
                  <button
                    onClick={viewMode === "month" ? goToCurrentMonth : goToCurrentWeek}
                    className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white"
                  >
                    <i className="fas fa-calendar-day mr-1" />
                    Today
                  </button>
                ) : null}

                {/* Export */}
                <div className="export-dropdown-container">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowExportDropdown(!showExportDropdown);
                    }}
                    className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-slate-800"
                  >
                    <i className="fas fa-download" />
                    Export
                  </button>
                  
                  {showExportDropdown && (
                    <div className="export-dropdown-menu">
                      <button
                        className="export-dropdown-item"
                        onClick={() => handleExport('excel')}
                      >
                        <i className="fas fa-file-excel" style={{ color: '#10b981' }}></i>
                        <span>Export as Excel</span>
                      </button>
                      <button
                        className="export-dropdown-item"
                        onClick={() => handleExport('pdf')}
                      >
                        <i className="fas fa-file-pdf" style={{ color: '#ef4444' }}></i>
                        <span>Export as PDF</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Picker */}
          {showCalendar && (
            <div className="relative px-6 pb-6">
              <div className="absolute right-6 mt-4 w-[320px] rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
                <div className="calendar-picker">
                  <div className="calendar-header">
                    <button className="calendar-nav-btn" onClick={() => handleCalendarMonthChange(-1)}>
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    <div className="calendar-title">
                      {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                    <button className="calendar-nav-btn" onClick={() => handleCalendarMonthChange(1)}>
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                  
                  <div className="calendar-body">
                    <div className="calendar-weekdays">
                      <div className="calendar-weekday">Sun</div>
                      <div className="calendar-weekday">Mon</div>
                      <div className="calendar-weekday">Tue</div>
                      <div className="calendar-weekday">Wed</div>
                      <div className="calendar-weekday">Thu</div>
                      <div className="calendar-weekday">Fri</div>
                      <div className="calendar-weekday">Sat</div>
                    </div>
                    
                    <div className="calendar-days">
                      {(() => {
                        const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(calendarDate);
                        const days = [];
                        
                        for (let i = 0; i < startingDayOfWeek; i++) {
                          days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
                        }
                        
                        for (let day = 1; day <= daysInMonth; day++) {
                          const date = new Date(year, month, day);
                          const monday = getMonday(date);
                          const isSelected = viewMode === 'week' 
                            ? isDateInSelectedWeek(date)
                            : isDateInSelectedMonth(date);
                          const isToday = date.toDateString() === new Date().toDateString();
                          const isWeekStart = date.toDateString() === monday.toDateString();
                          
                          days.push(
                            <div
                              key={day}
                              className={`calendar-day ${
                                isSelected ? 'selected' : ''
                              } ${
                                isToday ? 'today' : ''
                              } ${
                                viewMode === 'week' && isWeekStart ? 'week-start' : ''
                              }`}
                              onClick={() => {
                                if (viewMode === 'week') {
                                  handleWeekSelect(monday);
                                } else {
                                  const monthName = date.toLocaleDateString('en-US', { month: 'long' });
                                  handleMonthSelect(monthName, year);
                                }
                              }}
                            >
                              <span className="day-number">{day}</span>
                              {viewMode === 'week' && isWeekStart && (
                                <span className="week-indicator">Week</span>
                              )}
                            </div>
                          );
                        }
                        
                        return days;
                      })()}
                    </div>
                  </div>
                  
                  <div className="calendar-footer">
                    <button 
                      className="calendar-today-btn"
                      onClick={() => {
                        if (viewMode === 'week') {
                          goToCurrentWeek();
                        } else {
                          goToCurrentMonth();
                        }
                        setShowCalendar(false);
                      }}
                    >
                      <i className="fas fa-calendar-day"></i>
                      <span>Today</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="nk-block">
            <div className="card">
              <div className="card-inner text-center p-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 mb-0">Loading reports data...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="nk-block">
            <div className="card">
              <div className="card-inner text-center p-4">
                <div className="text-danger mb-3">
                  <em className="icon ni ni-alert-circle fs-2x"></em>
                </div>
                <h5 className="text-danger">Error Loading Reports</h5>
                <p className="text-muted">{error}</p>
                <button className="btn btn-primary" onClick={fetchReportsData}>
                  <i className="fas fa-sync-alt mr-2"></i>
                  <span>Retry</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report Tabs */}
        {!loading && !error && (
          <>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex rounded-full bg-slate-100 p-1">
                {["client", "employee", "invoice"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-full px-6 py-2 text-sm font-semibold transition-all
                      ${activeTab === tab
                        ? "bg-indigo-600 text-white shadow"
                        : "text-slate-700 hover:bg-white"
                      }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <div className="text-sm text-slate-600">
                Viewing:{" "}
                <strong className="text-slate-900">
                  {activeTab === "client"
                    ? "Client-wise Report"
                    : activeTab === "employee"
                    ? "Employee-wise Report"
                    : "Invoice Report"}
                </strong>
              </div>
            </div>

            {activeTab === "client" && renderClientReport()}
            {activeTab === "employee" && renderEmployeeReport()}
            {activeTab === "invoice" && renderInvoiceReport()}
          </>
        )}

      {/* Client Details Modal */}
      {showClientDetailsModal && selectedClient && (
        <div className="modal-overlay" onClick={() => setShowClientDetailsModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-building mr-2"></i> Client Details</h3>
              <button className="modal-close" onClick={() => setShowClientDetailsModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="details-grid">
                <div className="detail-item">
                  <label>Client Name:</label>
                  <span>{selectedClient.name}</span>
                </div>
                <div className="detail-item">
                  <label>Total Hours:</label>
                  <span>{selectedClient.totalHours} hrs</span>
                </div>
                <div className="detail-item">
                  <label>Total Employees:</label>
                  <span>{selectedClient.totalEmployees}</span>
                </div>
                <div className="detail-item">
                  <label>Total Billed:</label>
                  <span className="amount">${selectedClient.totalBilled?.toLocaleString()}</span>
                </div>
              </div>
              
              {selectedClient.projects && selectedClient.projects.length > 0 && (
                <div className="details-section mt-3">
                  <h5 className="section-title">
                    <i className="fas fa-project-diagram"></i> Projects
                  </h5>
                  <div className="projects-list">
                    {selectedClient.projects.map((project, index) => (
                      <div key={index} className="project-item">
                        <div className="project-name">{project.name}</div>
                        <div className="project-stats">
                          <span>{project.hours} hrs</span>
                          <span>{project.employees} employees</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowClientDetailsModal(false)}>
                Close
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setShowClientDetailsModal(false);
                  setShowClientEditModal(true);
                }}
              >
                <i className="fas fa-edit mr-1"></i> Edit Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Edit Modal */}
      {showClientEditModal && selectedClient && (
        <div className="modal-overlay" onClick={() => setShowClientEditModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-edit mr-2"></i> Edit Client</h3>
              <button className="modal-close" onClick={() => setShowClientEditModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Client Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  defaultValue={selectedClient.name}
                  placeholder="Enter client name"
                />
              </div>
              <div className="form-group">
                <label>Total Hours</label>
                <input 
                  type="number" 
                  className="form-control" 
                  defaultValue={selectedClient.totalHours}
                  placeholder="Enter total hours"
                />
              </div>
              <div className="form-group">
                <label>Total Employees</label>
                <input 
                  type="number" 
                  className="form-control" 
                  defaultValue={selectedClient.totalEmployees}
                  placeholder="Enter total employees"
                />
              </div>
              <div className="form-group">
                <label>Total Billed ($)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  defaultValue={selectedClient.totalBilled}
                  placeholder="Enter total billed amount"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowClientEditModal(false)}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  // TODO: Implement save functionality
                  alert('Save functionality will be implemented');
                  setShowClientEditModal(false);
                }}
              >
                <i className="fas fa-save mr-1"></i> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Delete Modal */}
      {showClientDeleteModal && selectedClient && (
        <div className="modal-overlay" onClick={() => setShowClientDeleteModal(false)}>
          <div className="modal-container modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header bg-danger">
              <h3><i className="fas fa-exclamation-triangle mr-2"></i> Delete Client</h3>
              <button className="modal-close" onClick={() => setShowClientDeleteModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <p className="text-center mb-3">
                Are you sure you want to delete client <strong>{selectedClient.name}</strong>?
              </p>
              <p className="text-center text-muted">
                This action can be done.
              </p>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowClientDeleteModal(false)}>
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={() => {
                  // TODO: Implement delete functionality
                  alert(`Client ${selectedClient.name} will be deleted`);
                  setShowClientDeleteModal(false);
                }}
              >
                <i className="fas fa-trash mr-1"></i> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Details Modal */}
      {showEmployeeDetailsModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowEmployeeDetailsModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-user mr-2"></i> Employee Details</h3>
              <button className="modal-close" onClick={() => setShowEmployeeDetailsModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="details-grid">
                <div className="detail-item">
                  <label>Employee Name:</label>
                  <span>{selectedEmployee.name}</span>
                </div>
                <div className="detail-item">
                  <label>Client:</label>
                  <span>{selectedEmployee.clientName}</span>
                </div>
                <div className="detail-item">
                  <label>Project:</label>
                  <span>{selectedEmployee.projectName}</span>
                </div>
                <div className="detail-item">
                  <label>Total Hours:</label>
                  <span>{selectedEmployee.totalHours} hrs</span>
                </div>
                <div className="detail-item">
                  <label>Utilization:</label>
                  <span>{selectedEmployee.utilization}%</span>
                </div>
              </div>
              
              {/* {selectedEmployee.weeklyBreakdown && selectedEmployee.weeklyBreakdown.length > 0 && (
                <div className="details-section mt-3">
                  <h5 className="section-title">
                    <i className="fas fa-chart-line"></i> Weekly Breakdown
                  </h5>
                  <div className="weekly-breakdown">
                    {selectedEmployee.weeklyBreakdown.map((hours, index) => (
                      <div key={index} className="week-item">
                        <span className="week-label">Week {index + 1}</span>
                        <span className="week-hours">{hours} hrs</span>
                      </div>
                    ))}
                  </div>
                </div>
              )} */}
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEmployeeDetailsModal(false)}>
                Close
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setShowEmployeeDetailsModal(false);
                  setShowEmployeeEditModal(true);
                }}
              >
                <i className="fas fa-edit mr-1"></i> Edit Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Edit Modal */}
      {showEmployeeEditModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowEmployeeEditModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-edit mr-2"></i> Edit Employee</h3>
              <button className="modal-close" onClick={() => setShowEmployeeEditModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Employee Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  defaultValue={selectedEmployee.name}
                  placeholder="Enter employee name"
                />
              </div>
              <div className="form-group">
                <label>Client Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  defaultValue={selectedEmployee.clientName}
                  placeholder="Enter client name"
                />
              </div>
              <div className="form-group">
                <label>Project Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  defaultValue={selectedEmployee.projectName}
                  placeholder="Enter project name"
                />
              </div>
              <div className="form-group">
                <label>Total Hours</label>
                <input 
                  type="number" 
                  className="form-control" 
                  defaultValue={selectedEmployee.totalHours}
                  placeholder="Enter total hours"
                />
              </div>
              <div className="form-group">
                <label>Utilization (%)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  defaultValue={selectedEmployee.utilization}
                  placeholder="Enter utilization percentage"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEmployeeEditModal(false)}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  // TODO: Implement save functionality
                  alert('Save functionality will be implemented');
                  setShowEmployeeEditModal(false);
                }}
              >
                <i className="fas fa-save mr-1"></i> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Delete Modal */}
      {showEmployeeDeleteModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowEmployeeDeleteModal(false)}>
          <div className="modal-container modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header bg-danger">
              <h3><i className="fas fa-exclamation-triangle mr-2"></i> Delete Employee</h3>
              <button className="modal-close" onClick={() => setShowEmployeeDeleteModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <p className="text-center mb-3">
                Are you sure you want to delete employee <strong>{selectedEmployee.name}</strong>?
              </p>
              <p className="text-center text-muted">
                This action cannot be undone.
              </p>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEmployeeDeleteModal(false)}>
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={() => {
                  // TODO: Implement delete functionality
                  alert(`Employee ${selectedEmployee.name} will be deleted`);
                  setShowEmployeeDeleteModal(false);
                }}
              >
                <i className="fas fa-trash mr-1"></i> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {showDetailsModal && selectedInvoiceForDetails && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">Invoice Details</h5>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="details-grid">
                <div className="detail-item">
                  <label>Invoice Number:</label>
                  <span>{selectedInvoiceForDetails.invoiceNumber || selectedInvoiceForDetails.id}</span>
                </div>
                <div className="detail-item">
                  <label>Client:</label>
                  <span>{selectedInvoiceForDetails.clientName}</span>
                </div>
                <div className="detail-item">
                  <label>Month:</label>
                  <span>{selectedInvoiceForDetails.month} {selectedInvoiceForDetails.year}</span>
                </div>
                <div className="detail-item">
                  <label>Issue Date:</label>
                  <span>
                    {selectedInvoiceForDetails.issueDate 
                      ? new Date(selectedInvoiceForDetails.issueDate).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: '2-digit',
                          year: 'numeric'
                        })
                      : selectedInvoiceForDetails.createdAt 
                        ? new Date(selectedInvoiceForDetails.createdAt).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: '2-digit',
                            year: 'numeric'
                          })
                        : 'N/A'
                    }
                  </span>
                </div>
                <div className="detail-item">
                  <label>Total Hours:</label>
                  <span>{selectedInvoiceForDetails.totalHours} hrs</span>
                </div>
                <div className="detail-item">
                  <label>Amount:</label>
                  <span className="amount">${selectedInvoiceForDetails.amount?.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <label>Status:</label>
                  <span className={`badge bg-outline-${
                    selectedInvoiceForDetails.status === "Paid"
                      ? "success"
                      : selectedInvoiceForDetails.status === "Pending"
                      ? "warning"
                      : "danger"
                  }`}>
                    {selectedInvoiceForDetails.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <InvoicePDFPreviewModal
        show={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        invoice={selectedInvoiceForPDF}
      />
    </div>
  </div>

  );
};

export default ReportsDashboard;
