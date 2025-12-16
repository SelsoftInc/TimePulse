'use client';

import Link from 'next/link';
import { useRouter, useParams, usePathname } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import DataGridFilter from '../common/DataGridFilter';
import Modal from '../common/Modal';
import InvoicePDFPreviewModal from '../common/InvoicePDFPreviewModal';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { API_BASE } from '@/config/api';
import { isServerConnectedCached } from '@/utils/serverCheck';
import {
  uploadAndProcessTimesheet,
  transformTimesheetToInvoice} from '@/services/engineService';
import { apiClient } from '@/utils/apiClient';
import "./TimesheetSummary.css";
import "../common/Pagination.css";

const TimesheetSummary = () => {
  const { subdomain } = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Hydration fix: Track if component is mounted on client
  const [isMounted, setIsMounted] = useState(false);
  
  // Initialize with empty data - will be populated from server
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isServerAvailable, setIsServerAvailable] = useState(false);
  const [clientType, setClientType] = useState("internal");
  const [filters, setFilters] = useState({
    status: "all",
    dateRange: { from: "", to: "" },
    search: ""});
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [invoiceSuccess, setInvoiceSuccess] = useState("");
  const [invoiceError, setInvoiceError] = useState("");
  const [generatingInvoiceId, setGeneratingInvoiceId] = useState(null);
  
  // Invoice modal state
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  // Hydration fix: Set mounted state on client
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Debug: Log modal state changes
  useEffect(() => {
    if (!isMounted) return;
    console.log('🔔 Invoice Modal State Changed:', {
      invoiceModalOpen,
      hasSelectedInvoice: !!selectedInvoice,
      selectedInvoiceId: selectedInvoice?.id
    });
  }, [invoiceModalOpen, selectedInvoice]);
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (invoiceModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [invoiceModalOpen]);
  
  // Edit invoice modal state - REMOVED (not needed for timesheet module)
  
  // PDF Preview modal state
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [invoiceForPDF, setInvoiceForPDF] = useState(null);
  
  // Modal state
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    details: null,
    showCancel: false,
    onConfirm: null
  });
  
  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };
  
  const showModal = (config) => {
    setModalConfig({
      isOpen: true,
      type: config.type || 'info',
      title: config.title || '',
      message: config.message || '',
      details: config.details || null,
      showCancel: config.showCancel || false,
      onConfirm: config.onConfirm || null,
      confirmText: config.confirmText || 'OK',
      cancelText: config.cancelText || 'Cancel'
    });
  };
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Track which timesheets have invoices
  const [timesheetsWithInvoices, setTimesheetsWithInvoices] = useState(new Set());

  // Check which timesheets have invoices
  const checkTimesheetsForInvoices = async (timesheets) => {
    const tenantId = user?.tenantId;
    if (!tenantId) return;

    const timesheetIdsWithInvoices = new Set();

    // Check each approved timesheet for an invoice
    for (const timesheet of timesheets) {
      if (timesheet.status === 'Approved') {
        try {
          const response = await axios.get(
            `${API_BASE}/api/invoices/by-timesheet/${timesheet.id}?tenantId=${tenantId}`
          );
          
          if (response.data.success && response.data.invoice) {
            timesheetIdsWithInvoices.add(timesheet.id);
          }
        } catch (error) {
          // Invoice doesn't exist, skip
          console.log(`No invoice for timesheet ${timesheet.id}`);
        }
      }
    }

    setTimesheetsWithInvoices(timesheetIdsWithInvoices);
  };

  // Define loadTimesheetData before useEffect to avoid hoisting issues
  const loadTimesheetData = useCallback(async () => {
    setLoading(true);
    try {
      const tenantId = user?.tenantId;
      const userEmail = user?.email;
      const userRole = user?.role;

      console.log('🔍 Loading timesheets...', { tenantId, userEmail, userRole, user });

      if (!tenantId || !userEmail) {
        console.error('❌ No tenant ID or email found', { tenantId, userEmail });
        setLoading(false);
        return;
      }

      // For admin/manager, use a different approach since they don't have employee records
      if (userRole === 'admin' || userRole === 'manager') {
        console.log('👑 Admin/Manager detected - using pending-approval API for all timesheets');

        // Use the pending-approval endpoint but without reviewerId to get all timesheets
        const response = await axios.get(`${API_BASE}/api/timesheets/pending-approval`, {
          params: { tenantId }
        });

        console.log('✅ API Response:', response.data);

        if (response.data.success) {
          // Also get approved and rejected timesheets separately
          const approvedResponse = await axios.get(`${API_BASE}/api/timesheets/employee/approved`, {
            params: { tenantId }
          });

          const rejectedResponse = await axios.get(`${API_BASE}/api/timesheets/employee/rejected`, {
            params: { tenantId }
          });

          // Combine all timesheets
          const allTimesheets = [
            ...(response.data.timesheets || []),
            ...(approvedResponse.data?.timesheets || []),
            ...(rejectedResponse.data?.timesheets || [])
          ];

          // Format timesheets to match UI expectations
          const formattedTimesheets = allTimesheets.map(ts => ({
            id: ts.id,
            weekRange: ts.weekRange || `${new Date(ts.weekStart).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} To ${new Date(ts.weekEnd).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}`,
            employeeName: ts.employeeName || 'Unknown',
            status: ts.status === 'submitted' ? 'Submitted for Approval' :
                    ts.status === 'approved' ? 'Approved' :
                    ts.status === 'rejected' ? 'Rejected' :
                    ts.status === 'draft' ? 'Pending' : ts.status,
            billableProjectHrs: ts.billableProjectHrs || ts.totalTimeHours || '0.00',
            timeOffHolidayHrs: ts.timeOffHolidayHrs || '0.00',
            totalTimeHours: ts.totalTimeHours || ts.billableProjectHrs || '0.00',
            weekStart: ts.weekStart,
            weekEnd: ts.weekEnd,
            dailyHours: ts.dailyHours || {},
            notes: ts.notes || '',
            attachments: ts.attachments || [],
            reviewer: ts.reviewer
          }));

          console.log('📊 Formatted timesheets:', formattedTimesheets);
          setTimesheets(formattedTimesheets);
        } else {
          console.error('❌ API returned success: false');
          setTimesheets([]);
        }
      } else {
        // Regular employee - get their own timesheets
        console.log('👤 Employee detected - loading personal timesheets');

        // First, get the employee ID from email
        console.log('📡 Fetching employee by email...');
        const empResponse = await axios.get(`${API_BASE}/api/timesheets/employees/by-email/${encodeURIComponent(userEmail)}?tenantId=${tenantId}`);

        if (!empResponse.data.success || !empResponse.data.employee) {
          console.error('❌ Employee not found for email:', userEmail);
          console.error('This user may not have an employee record.');
          setTimesheets([]);
          setLoading(false);
          return;
        }

        const employeeId = empResponse.data.employee.id;
        console.log('✅ Got employeeId:', employeeId);

        // Fetch all timesheets for the employee from API
        const apiUrl = `${API_BASE}/api/timesheets/employee/${employeeId}/all?tenantId=${tenantId}`;
        console.log('📡 Calling API:', apiUrl);

        const response = await axios.get(apiUrl);
        console.log('✅ API Response:', response.data);

        if (response.data.success) {
          // Format timesheets to match UI expectations
          const formattedTimesheets = response.data.timesheets.map(ts => ({
            id: ts.id,
            weekRange: ts.week,
            status: ts.status.label === 'SUBMITTED' ? 'Submitted for Approval' :
                    ts.status.label === 'APPROVED' ? 'Approved' :
                    ts.status.label === 'REJECTED' ? 'Rejected' :
                    ts.status.label === 'DRAFT' ? 'Pending' : ts.status.label,
            billableProjectHrs: ts.hours,
            timeOffHolidayHrs: "0.00",
            totalTimeHours: ts.hours,
            weekStart: ts.weekStart,
            weekEnd: ts.weekEnd,
            dailyHours: ts.dailyHours,
            notes: ts.notes,
            attachments: ts.attachments || [],
            reviewer: ts.reviewer
          }));

          console.log('📊 Formatted timesheets:', formattedTimesheets);
          setTimesheets(formattedTimesheets);
          
          // Check which timesheets have invoices (for employee view)
          if (userRole !== 'admin' && userRole !== 'manager') {
            checkTimesheetsForInvoices(formattedTimesheets);
          }
        } else {
          console.error('❌ API returned success: false');
          setTimesheets([]);
        }
      }

      // Determine client type
      const userClientType = localStorage.getItem("userClientType") || "internal";
      setClientType(userClientType);
    } catch (error) {
      console.error("❌ Error loading timesheet data:", error);
      console.error("Error details:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Check server connection and fetch data accordingly
  useEffect(() => {
    async function checkAndFetch() {
      if (!isMounted || !user?.tenantId) return;
      
      const serverConnected = await isServerConnectedCached();
      setIsServerAvailable(serverConnected);
      
      if (serverConnected) {
        // Server is connected - fetch real data
        console.log('✅ Server connected - fetching timesheet data');
        loadTimesheetData();
      } else {
        // Server not connected - show empty state
        console.log('⚠️ Server not connected - no timesheet data available');
        setLoading(false);
      }
    }
    
    checkAndFetch();
  }, [isMounted, user, loadTimesheetData]);

  // useEffect(() => {
  //   if (isMounted && location.state?.refresh && user?.tenantId) {
  //     console.log('🔄 Refresh requested from navigation, reloading timesheet data...');
  //     loadTimesheetData();
  //     window.history.replaceState({}, document.title);
  //   }
  // }, [location.state, user?.tenantId, loadTimesheetData]);

  // useEffect(() => {
  //   const handleVisibilityChange = () => {
  //     if (!document.hidden && user?.tenantId) {
  //       console.log('🔄 Page became visible, reloading timesheet data...');
  //       loadTimesheetData();
  //     }
  //   };
  //
  //   const handleFocus = () => {
  //     if (user?.tenantId) {
  //       console.log('🔄 Window focused, reloading timesheet data...');
  //       loadTimesheetData();
  //     }
  //   };
  //
  //   document.addEventListener('visibilitychange', handleVisibilityChange);
  //   window.addEventListener('focus', handleFocus);
  //
  //   return () => {
  //     document.removeEventListener('visibilitychange', handleVisibilityChange);
  //     window.removeEventListener('focus', handleFocus);
  //   };
  // }, [user, loadTimesheetData]);

  // Filter timesheets based on current filters
  const filteredTimesheets = timesheets.filter((timesheet) => {
    // Status filter
    if (
      filters.status !== "all" &&
      timesheet.status.toLowerCase() !== filters.status.toLowerCase()
    ) {
      return false;
    }

    // Search filter
    if (
      filters.search &&
      !timesheet.weekRange.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }

    // Date range filter (basic implementation)
    if (filters.dateRange.from || filters.dateRange.to) {
      // For now, we'll skip complex date filtering since weekRange is in a specific format
      // In a real app, you'd parse the date properly
    }

    return true;
  });

  // Handle filter changes
  const handleFilterChange = (filterKey, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: value}));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      status: "all",
      dateRange: { from: "", to: "" },
      search: ""});
  };


  // Define filter configuration
  const filterConfig = [
    {
      key: "status",
      label: "Status",
      type: "select",
      value: filters.status,
      defaultValue: "all",
      options: [
        { value: "all", label: "All Statuses" },
        { value: "pending", label: "Pending" },
        { value: "submitted for approval", label: "Submitted for Approval" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
      ]},
    {
      key: "search",
      label: "Search Week Range",
      type: "text",
      value: filters.search,
      defaultValue: "",
      placeholder: "Search by week range..."},
    {
      key: "dateRange",
      label: "Date Range",
      type: "dateRange",
      value: filters.dateRange,
      defaultValue: { from: "", to: "" }},
  ];

  // Calculate pagination
  const totalPages = Math.ceil(filteredTimesheets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTimesheets = filteredTimesheets.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <span className="badge badge-pending">Pending</span>;
      case "submitted for approval":
        return (
          <span className="badge badge-submitted">Submitted for Approval</span>
        );
      case "approved":
        return <span className="badge badge-approved">Approved</span>;
      case "rejected":
        return <span className="badge badge-rejected">Rejected</span>;
      default:
        return <span className="badge badge-default">{status}</span>;
    }
  };

  // Check if invoice exists for timesheet
  const checkInvoiceExists = async (timesheetId) => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/invoices/check-timesheet/${timesheetId}?tenantId=${user.tenantId}`
      );
      
      if (response.data.success && response.data.exists) {
        return response.data.invoice;
      }
      return null;
    } catch (error) {
      console.error('❌ Error checking invoice:', error);
      return null;
    }
  };
  
  // View invoice details modal - Fetch complete invoice data (matches Invoice module)
  const handleViewInvoiceDetails = async (invoice) => {
    try {
      const tenantId = user?.tenantId;
      const token = localStorage.getItem('token');
      
      console.log('📥 Fetching complete invoice details for viewing:', invoice.id || invoice);
      
      // If invoice is just an ID string, convert it to object
      const invoiceId = typeof invoice === 'string' ? invoice : invoice.id;
      
      // Fetch full invoice details including employee and vendor data from backend
      const response = await fetch(
        `${API_BASE}/api/invoices/${invoiceId}?tenantId=${tenantId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Full invoice data fetched for viewing:', data);
        
        if (data.success && data.invoice) {
          const inv = data.invoice;
          
          // Extract employee data from multiple sources
          const employeeName = inv.employee 
            ? `${inv.employee.firstName} ${inv.employee.lastName}`
            : inv.timesheet?.employee
            ? `${inv.timesheet.employee.firstName} ${inv.timesheet.employee.lastName}`
            : inv.employeeName || 'N/A';
          
          const employeeEmail = inv.employee?.email 
            || inv.timesheet?.employee?.email 
            || inv.employeeEmail || 'N/A';
          
          // Merge full invoice data
          const fullInvoice = {
            ...(typeof invoice === 'object' ? invoice : {}),
            ...inv,
            employeeName: employeeName,
            employeeEmail: employeeEmail,
            employee: inv.employee,
            vendor: inv.vendor,
            timesheet: inv.timesheet,
            client: inv.client
          };
          
          console.log('📋 Opening view modal with complete data:', fullInvoice);
          console.log('📋 Vendor data:', fullInvoice.vendor);
          console.log('👤 Employee data:', fullInvoice.employee);
          console.log('📅 Timesheet data:', fullInvoice.timesheet);
          
          // Open invoice details modal
          setSelectedInvoice(fullInvoice);
          setInvoiceModalOpen(true);
        } else {
          console.warn('API returned success:false, using fallback');
          // Fallback to original invoice data
          const fallbackInvoice = typeof invoice === 'object' ? invoice : { id: invoice };
          setSelectedInvoice(fallbackInvoice);
          setInvoiceModalOpen(true);
        }
      } else {
        console.error('Failed to fetch invoice details:', response.status);
        // Fallback to original invoice data
        const fallbackInvoice = typeof invoice === 'object' ? invoice : { id: invoice };
        setSelectedInvoice(fallbackInvoice);
        setInvoiceModalOpen(true);
      }
    } catch (error) {
      console.error('❌ Error fetching invoice details:', error);
      // Fallback to original invoice data instead of showing error
      const fallbackInvoice = typeof invoice === 'object' ? invoice : { id: invoice };
      setSelectedInvoice(fallbackInvoice);
      setInvoiceModalOpen(true);
    }
  };
  
  // handleEditInvoice function - REMOVED (not needed for timesheet module)
  
  // View invoice PDF - Fetch data for PDF generation
  const handleViewInvoicePDF = async (invoiceId) => {
    try {
      console.log('📄 Fetching invoice PDF data for invoice:', invoiceId);
      
      // Use the pdf-data endpoint that includes timesheet data
      const response = await axios.get(
        `${API_BASE}/api/invoices/${invoiceId}/pdf-data?tenantId=${user.tenantId}`
      );
      
      if (response.data.success) {
        const invoiceData = response.data.invoice;
        console.log('✅ Invoice PDF data loaded:', invoiceData);
        
        // Open PDF preview modal with complete timesheet data
        setInvoiceForPDF(invoiceData);
        setPdfPreviewOpen(true);
      }
    } catch (error) {
      console.error('❌ Error fetching invoice PDF data:', error);
      showModal({
        type: 'error',
        title: 'Error',
        message: 'Failed to load invoice PDF. Please try again.'
      });
    }
  };
  
  // Handle view invoice for employee (read-only)
  const handleViewInvoiceForEmployee = async (timesheet) => {
    setGeneratingInvoiceId(timesheet.id);
    
    try {
      const existingInvoice = await checkInvoiceExists(timesheet.id);
      
      if (existingInvoice) {
        // Show invoice details in view-only mode
        handleViewInvoiceDetails(existingInvoice);
      } else {
        showModal({
          type: 'info',
          title: 'No Invoice',
          message: 'No invoice has been generated for this timesheet yet.'
        });
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      showModal({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch invoice details.'
      });
    } finally {
      setGeneratingInvoiceId(null);
    }
  };
  
  // Handle invoice button click - check if invoice exists first
  const handleInvoiceButtonClick = async (timesheet) => {
    if (timesheet.status.toLowerCase() !== 'approved') {
      showModal({
        type: 'warning',
        title: 'Cannot Generate Invoice',
        message: 'Only approved timesheets can be converted to invoices.'
      });
      return;
    }
    
    // Check if invoice already exists
    setGeneratingInvoiceId(timesheet.id);
    const existingInvoice = await checkInvoiceExists(timesheet.id);
    setGeneratingInvoiceId(null);
    
    if (existingInvoice) {
      // Invoice exists - show details modal with full invoice object
      handleViewInvoiceDetails(existingInvoice);
    } else {
      // No invoice - show generate confirmation
      handleGenerateInvoiceFromTimesheet(timesheet);
    }
  };
  
  // Generate invoice from approved timesheet
  const handleGenerateInvoiceFromTimesheet = async (timesheet) => {
    // Show confirmation modal
    showModal({
      type: 'confirm',
      title: 'Generate Invoice',
      message: `Generate Invoice for Timesheet: ${timesheet.weekRange}?\n\nHours: ${timesheet.totalTimeHours || timesheet.billableProjectHrs}\n\nThis will create an invoice and send it to the employee's vendor.`,
      showCancel: true,
      confirmText: 'Generate Invoice',
      onConfirm: () => generateInvoice(timesheet)
    });
  };
  
  const generateInvoice = async (timesheet) => {

    setGeneratingInvoiceId(timesheet.id);
    setInvoiceError("");
    setInvoiceSuccess("");

    try {
      console.log('📄 Starting invoice generation for timesheet:', timesheet.id);
      console.log('📦 Timesheet object:', timesheet);
      
      // ============================================================
      // STEP 1: Get employee email/name from timesheet
      // ============================================================
      const employeeEmail = timesheet.employeeEmail;
      const employeeName = timesheet.employeeName;
      
      console.log('📋 Timesheet data:', {
        timesheetId: timesheet.id,
        employeeEmail: employeeEmail,
        employeeName: employeeName,
        weekRange: timesheet.weekRange,
        totalHours: timesheet.totalTimeHours || timesheet.billableProjectHrs,
        status: timesheet.status
      });
      
      if (!employeeEmail && !employeeName) {
        console.error('❌ CRITICAL: No employee email or name found in timesheet');
        setGeneratingInvoiceId(null);
        closeModal();
        setTimeout(() => {
          showModal({
            type: 'error',
            title: 'Employee Information Missing',
            message: 'Unable to generate invoice: Employee email/name is missing from timesheet.\n\nPlease ensure the timesheet has valid employee information.'
          });
        }, 100);
        return;
      }
      
      console.log('✅ Employee identifier found:', { employeeEmail, employeeName });
      
      // ============================================================
      // STEP 2: Fetch ALL employees from Employee API
      // ============================================================
      console.log('🔍 Fetching all employees from Employee API...');
      
      let employeeData = null;
      let employeeId = null;
      let vendorClientInfo = null;
      let vendorClientType = '';
      
      try {
        const employeesResponse = await apiClient.get(
          '/api/employees',
          { tenantId: user.tenantId }
        );
        
        console.log('📦 Employees API Response:', employeesResponse);
        
        if (!employeesResponse.success || !employeesResponse.employees) {
          throw new Error('Failed to fetch employees from Employee API');
        }
        
        // Find the employee by email or name
        const allEmployees = employeesResponse.employees;
        
        if (employeeEmail) {
          employeeData = allEmployees.find(emp => 
            emp.email && emp.email.toLowerCase() === employeeEmail.toLowerCase()
          );
          console.log('🔍 Searched by email:', employeeEmail, 'Found:', !!employeeData);
        }
        
        // If not found by email, try by name
        if (!employeeData && employeeName) {
          employeeData = allEmployees.find(emp => {
            const empFullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
            return empFullName.toLowerCase() === employeeName.toLowerCase();
          });
          console.log('🔍 Searched by name:', employeeName, 'Found:', !!employeeData);
        }
        
        if (!employeeData) {
          throw new Error(`Employee not found in Employee API with email: ${employeeEmail} or name: ${employeeName}`);
        }
        
        employeeId = employeeData.id;
        console.log('✅ Found employee in Employee API:', {
          id: employeeData.id,
          name: `${employeeData.firstName} ${employeeData.lastName}`,
          email: employeeData.email,
          hasVendor: !!employeeData.vendor,
          hasClient: !!employeeData.client
        });
        
        // ============================================================
        // STEP 3: Validate vendor/client assignment from Employee API data
        // ============================================================
        // Check for vendor assignment (prioritize nested vendor object with email)
        if (employeeData.vendor && employeeData.vendor.id) {
          vendorClientInfo = employeeData.vendor;
          vendorClientType = 'Vendor';
          console.log('✅ Found vendor from employee API:', {
            id: vendorClientInfo.id,
            name: vendorClientInfo.name || vendorClientInfo.vendorName,
            email: vendorClientInfo.email
          });
        } 
        // Check for client assignment (prioritize nested client object with email)
        else if (employeeData.client && employeeData.client.id) {
          vendorClientInfo = employeeData.client;
          vendorClientType = 'Client';
          console.log('✅ Found client from employee API:', {
            id: vendorClientInfo.id,
            name: vendorClientInfo.clientName,
            email: vendorClientInfo.email
          });
        }
        // No vendor or client found
        else {
          console.error('❌ No vendor or client assigned to employee');
          console.error('Employee data:', employeeData);
          setGeneratingInvoiceId(null);
          closeModal();
          setTimeout(() => {
            showModal({
              type: 'error',
              title: 'Vendor/Client Not Assigned',
              message: `Employee "${employeeData.firstName} ${employeeData.lastName}" must be associated with a vendor or client to generate invoice.\n\nAction Required:\n1. Go to Employees menu\n2. Edit employee: ${employeeData.firstName} ${employeeData.lastName}\n3. Assign a vendor OR client with email address\n4. Save and try generating invoice again`
            });
          }, 100);
          return;
        }

      } catch (error) {
        console.error('❌ Error fetching employee data:', error);
        console.error('❌ Error details:', error.response?.data);
        setGeneratingInvoiceId(null);
        closeModal();
        setTimeout(() => {
          showModal({
            type: 'error',
            title: 'Error Fetching Employee Data',
            message: `Failed to fetch employee information: ${error.message}\n\nPlease try again or contact support.`
          });
        }, 100);
        return;
      }

      // Step 4: Validate that vendor/client has email address
      // Email is required to send invoice
      if (!vendorClientInfo.email) {
        console.error('❌ Validation failed: Vendor/Client email missing from Employee API data');
        console.error('Vendor/Client info:', vendorClientInfo);
        setGeneratingInvoiceId(null);
        
        // Close confirmation modal first, then show error
        closeModal();
        setTimeout(() => {
          showModal({
            type: 'error',
            title: `${vendorClientType} Email Missing`,
            message: `${vendorClientType} "${vendorClientInfo.vendorName || vendorClientInfo.clientName || vendorClientInfo.name || 'Unknown'}" does not have an email address configured.\n\nAction Required:\n1. Go to ${vendorClientType}s menu\n2. Edit ${vendorClientType}: ${vendorClientInfo.vendorName || vendorClientInfo.clientName || vendorClientInfo.name || 'Unknown'}\n3. Add a valid email address\n4. Save and try generating invoice again`,
            details: {
              'Employee': `${employeeData.firstName} ${employeeData.lastName}`,
              [`${vendorClientType} Name`]: vendorClientInfo.vendorName || vendorClientInfo.clientName || vendorClientInfo.name || 'Unknown',
              [`${vendorClientType} ID`]: vendorClientInfo.id,
              'Email Status': '❌ Missing'
            }
          });
        }, 100);
        return;
      }
      
      console.log('✅ All validations passed!');
      console.log('✅ Employee details fetched from Employee API');
      console.log('✅ Vendor/Client assignment confirmed');
      console.log('✅ Vendor/Client email verified');
      console.log('📤 Proceeding with invoice generation...');

      const response = await axios.post(
        `${API_BASE}/api/timesheets/${timesheet.id}/generate-invoice`,
        {
          tenantId: user.tenantId,
          userId: user.id}
      );

      console.log('✅ Invoice generated:', response.data);

      if (response.data.success) {
        const { invoice } = response.data;
        
        setInvoiceSuccess(
          `Invoice ${invoice.invoiceNumber} generated successfully! ${
            invoice.emailSent 
              ? `Email sent to ${invoice.vendorEmail}` 
              : 'Email delivery failed - please send manually'
          }`
        );

        // Show success message with invoice details
        showModal({
          type: 'success',
          title: 'Invoice Generated Successfully!',
          message: invoice.emailSent 
            ? `Invoice has been generated and sent to ${invoice.vendorEmail}`
            : 'Invoice has been generated but email delivery failed. Please send manually.',
          details: {
            'Invoice Number': invoice.invoiceNumber,
            'Total Amount': `$${parseFloat(invoice.totalAmount).toFixed(2)}`,
            'Due Date': new Date(invoice.dueDate).toLocaleDateString(),
            'Vendor Email': invoice.vendorEmail,
            'Email Status': invoice.emailSent ? '✓ Sent' : '✗ Failed',
            'Invoice Link': invoice.invoiceLink
          }
        });

        // Reload timesheet data to reflect invoice generation
        await loadTimesheetData();
      }
    } catch (error) {
      console.error('❌ Invoice generation error:', error);
      console.error('❌ Error response:', error.response?.data);
      
      const errorData = error.response?.data || {};
      const errorMessage = errorData.error || errorData.message || error.message || 'Unknown error';
      const errorDetails = errorData.details;
      
      setInvoiceError(`Failed to generate invoice: ${errorMessage}`);
      
      // Log detailed error for debugging
      if (errorDetails) {
        console.error('❌ Error details:', errorDetails);
      }
      
      // Show user-friendly error message with guidance
      if (errorMessage.includes('vendor') || errorMessage.includes('employee')) {
        // Check if it's a vendor email issue
        const isEmailIssue = errorMessage.toLowerCase().includes('email') || 
                            errorMessage.toLowerCase().includes('contact');
        
        showModal({
          type: 'error',
          title: errorMessage.includes('vendor') ? 'Vendor Configuration Issue' : 'Employee Not Found',
          message: isEmailIssue 
            ? `${errorMessage}\n\nAction Required:\n1. Go to Vendors menu\n2. Find and edit the vendor assigned to this employee\n3. Add a valid email address for the vendor\n4. Save and try generating invoice again`
            : `${errorMessage}\n\nAction Required:\n1. Go to Employees menu\n2. Edit the employee record: ${timesheet.employeeName || 'Unknown'}\n3. Assign a vendor with email address\n4. Save and try generating invoice again`,
          details: errorDetails ? {
            'Employee': timesheet.employeeName || 'Unknown',
            'Timesheet ID': timesheet.id,
            'Error Details': JSON.stringify(errorDetails, null, 2)
          } : undefined
        });
      } else if (errorMessage.includes('association') || errorMessage.includes('not associated')) {
        showModal({
          type: 'error',
          title: 'Server Configuration Error',
          message: `${errorMessage}\n\nThe server needs to be restarted for model changes to take effect.\n\nPlease contact your administrator or:\n1. Restart the backend server\n2. Try generating the invoice again`
        });
      } else {
        showModal({
          type: 'error',
          title: 'Invoice Generation Failed',
          message: `${errorMessage}\n\n${errorDetails ? 'Check the console for more details.' : 'Please try again or contact support if the problem persists.'}`
        });
      }
    } finally {
      setGeneratingInvoiceId(null);
    }
  };

  // Generate invoice from timesheet using engine API (legacy method)
  const handleGenerateInvoice = async (file) => {
    setGeneratingInvoice(true);
    setInvoiceError("");
    setInvoiceSuccess("");

    try {
      // Step 1: Upload and process timesheet using engine
      const timesheetData = await uploadAndProcessTimesheet(file);

      // Step 2: Transform engine response to invoice format
      const clientInfo = {
        name: "Sample Client", // You can get this from timesheet data or user selection
        email: "client@example.com",
        hourlyRate: 125, // Default rate, can be customized
        address: "123 Business St, City, State 12345"};

      const invoiceData = transformTimesheetToInvoice(
        timesheetData,
        clientInfo
      );

      // Step 3: Show success and navigate to invoice creation
      setInvoiceSuccess(
        `Invoice generated successfully! Total: $${invoiceData.total}`
      );

      // Auto-navigate after 2 seconds or show confirmation
      setTimeout(() => {
        if (
          window.confirm(
            "Invoice data is ready! Would you like to create the invoice now?"
          )
        ) {
          router.push(`/${subdomain}/invoices/create`, {
            state: {
              invoiceData,
              sourceTimesheet: {
                fileName: file.name,
                processedData: timesheetData}}});
        }
      }, 2000);
    } catch (error) {
      console.error("Invoice generation error:", error);
      setInvoiceError(`Failed to generate invoice: ${error.message}`);
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleNewTimesheet = () => {
    router.push(`/${subdomain}/timesheets/submit`);
  };

  // Helper function to toggle client type for testing
  const toggleClientType = () => {
    const newClientType = clientType === "internal" ? "external" : "internal";
    setClientType(newClientType);
    localStorage.setItem("userClientType", newClientType);
  };

  // Prevent hydration mismatch - don't render until mounted
  if (!isMounted || loading) {
    return (
      <div className="nk-conten">
        <div className="container-fluid">
          <div className="nk-content-inne">
            <div className="nk-content-body">
              <div className="nk-block-head nk-block-head-sm">
                <div className="nk-block-between">
                  <div className="nk-block-head-content">
                    <h1 className="nk-block-title page-title">Timesheets</h1>
                  </div>
                </div>
              </div>
              <div className="nk-bloc">
                <div className="card card-bordered">
                  <div className="card-inne">
                    <div className="text-center">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Loading timesheets...</p>
                    </div>
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
    <div className="containe">
      <div className="container-fluid">
        <div className="nk-content-inne">
          <div className="nk-content-body">
            <div className="nk-block-head nk-block-head-sm">
              <div className="nk-block-between">
                <div className="nk-block-head-content">
                  <h1 className="nk-block-title page-title">Timesheets</h1>
                  <div className="nk-block-des text-soft">
                    {/* <p>Timesheet Summary</p> */}
                    <div className="mt-2 toggle-container">
                      <label
                        className="toggle-switch"
                        title="Switch the Toggle between Internal and External client types"
                      >
                        <input
                          type="checkbox"
                          checked={clientType === "external"}
                          onChange={toggleClientType}
                        />
                        <span className="slider"></span>
                        <span className="label-text">
                          Switch to{" "}
                          {clientType === "internal"
                            ? "External Client"
                            : "Internal Client"}
                        </span>
                      </label>

                      <span
                        className={`badge-toggle ${
                          clientType === "internal"
                            ? "badge-internal"
                            : "badge-external"
                        } mr-2`}
                      >
                        {clientType === "internal"
                          ? "Internal Client"
                          : "External Client"}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Submit Timesheet Button - Matching Employee Dashboard Design */}
                <button
                  className="btn-submit-timesheet"
                  onClick={handleNewTimesheet}
                  title="Submit a new timesheet"
                >
                  <em className="icon ni ni-file-plus"></em>
                  <span>Submit Timesheet</span>
                </button>
              </div>
            </div>
          </div>

          <div className="nk-block">
            <div className="card card-bordered card-stretch">
              <div className="card-inner-group">
                <div className="card-inne">
                  <div className="card-title-group">
                    <div className="card-title">
                      <h6 className="title">
                        <span className="mr-2">
                          Please follow basic troubleshooting if you face any
                          discrepancies in accessing the page.
                        </span>
                      </h6>
                    </div>
                  </div>
                </div>

                {/* Filter Section */}
                <div className="card-inner border-top">
                  <DataGridFilter
                    filters={filterConfig}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                    resultCount={filteredTimesheets.length}
                    totalCount={timesheets.length}
                  />
                </div>

                {/* Timesheet Table */}
                <div className="card-inner">
                  <div className="table-responsive">
                    <table className="table table-hove timesheet-summary-tabl">
                      <thead className="">
                        <tr>
                          <th>Week Range</th>
                          <th>Status</th>
                          <th>Hours</th>
                          <th>Time off/Holiday Hrs</th>
                          <th>Total Time Hours</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedTimesheets.map((timesheet) => {
                          // Debug logging
                          console.log('📋 Timesheet:', {
                            id: timesheet.id,
                            status: timesheet.status,
                            statusLower: timesheet.status?.toLowerCase(),
                            isApproved: timesheet.status?.toLowerCase() === "approved" || timesheet.status === "Approved",
                            weekRange: timesheet.weekRange
                          });
                          
                          return (
                          <tr key={timesheet.id} className="timesheet-row">
                            <td>
                              <div className="timesheet-week">
                                <span className="week-range">
                                  {timesheet.weekRange}
                                </span>
                              </div>
                            </td>
                            <td>{getStatusBadge(timesheet.status)}</td>
                            <td className="text-center">
                              <span className="hours-value">
                                {timesheet.billableProjectHrs}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className="hours-value">
                                {timesheet.timeOffHolidayHrs}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className="hours-value">
                                {timesheet.totalTimeHours}
                              </span>
                            </td>
                            <td className="text-center actions-column">
                              <div className="btn-group btn-group-sm" role="group" style={{display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'nowrap'}}>
                                {/* Edit Button - Always visible */}
                                <button
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/${subdomain}/timesheets/submit/${timesheet.id}?mode=edit`);
                                  }}
                                  title="Edit Timesheet"
                                  style={{minWidth: '55px', padding: '4px 8px', fontSize: '13px'}}
                                >
                                  <em className="icon ni ni-edit" style={{marginRight: '4px'}}></em>
                                  Edit
                                </button>

                                {/* Invoice Button - For employees: only show if invoice exists. For admin/manager: show for all approved */}
                                {timesheet.status === "Approved" && (
                                  (user?.role === 'admin' || user?.role === 'manager') ? (
                                    // Admin/Manager: Show button for all approved timesheets (can generate or view)
                                    <button
                                      className="btn btn-outline-success btn-sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleInvoiceButtonClick(timesheet);
                                      }}
                                      disabled={generatingInvoiceId === timesheet.id}
                                      title={generatingInvoiceId === timesheet.id ? "Checking..." : "View or Generate Invoice"}
                                      style={{minWidth: '70px', padding: '4px 8px', fontSize: '13px'}}
                                    >
                                      {generatingInvoiceId === timesheet.id ? (
                                        <span>
                                          <em className="icon ni ni-loader" style={{animation: 'spin 1s linear infinite'}}></em>
                                        </span>
                                      ) : (
                                        <>
                                          <em className="icon ni ni-file-docs" style={{marginRight: '4px'}}></em>
                                          Invoice
                                        </>
                                      )}
                                    </button>
                                  ) : (
                                    // Employee: Only show if invoice exists (view-only)
                                    timesheetsWithInvoices.has(timesheet.id) && (
                                      <button
                                        className="btn btn-outline-info btn-sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewInvoiceForEmployee(timesheet);
                                        }}
                                        title="View Invoice"
                                        style={{minWidth: '70px', padding: '4px 8px', fontSize: '13px'}}
                                      >
                                        <em className="icon ni ni-eye" style={{marginRight: '4px'}}></em>
                                        Invoice
                                      </button>
                                    )
                                  )
                                )}

                                {/* View Button - Always visible */}
                                <button
                                  className="btn btn-outline-info btn-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/${subdomain}/timesheets/submit/${timesheet.id}?mode=view`);
                                  }}
                                  title="View Details"
                                  style={{minWidth: '55px', padding: '4px 8px', fontSize: '13px'}}
                                >
                                  <em className="icon ni ni-eye" style={{marginRight: '4px'}}></em>
                                  View
                                </button>
                              </div>
                            </td>
                            
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="card-inner border-top">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="text-muted">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredTimesheets.length)} of {filteredTimesheets.length} entries
                      </div>
                      <ul className="pagination pagination-sm">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            <em className="icon ni ni-chevron-left"></em>
                            <span style={{marginLeft: '4px'}}>Previous</span>
                          </button>
                        </li>
                        {[...Array(totalPages)].map((_, i) => (
                          <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                            <button 
                              className="page-link" 
                              onClick={() => handlePageChange(i + 1)}
                            >
                              {i + 1}
                            </button>
                          </li>
                        ))}
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            <span style={{marginRight: '4px'}}>Next</span>
                            <em className="icon ni ni-chevron-right"></em>
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal for alerts and confirmations */}
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        details={modalConfig.details}
        showCancel={modalConfig.showCancel}
        onConfirm={modalConfig.onConfirm}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
      />
      
      {/* Invoice Details Modal */}
      {invoiceModalOpen && selectedInvoice && (
        <div className="invoice-modal-overlay" onClick={() => setInvoiceModalOpen(false)}>
          <div className="invoice-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="invoice-modal-header">
              <div className="invoice-modal-title">
                <em className="icon ni ni-file-docs" style={{fontSize: '24px', color: '#10b981'}}></em>
                <h3>Invoice Details</h3>
              </div>
              <button 
                className="invoice-modal-close"
                onClick={() => setInvoiceModalOpen(false)}
                title="Close"
              >
                ×
              </button>
            </div>
            
            <div className="invoice-modal-body">
              {/* Invoice Header Info */}
              <div className="invoice-info-grid">
                <div className="invoice-info-card">
                  <div className="invoice-info-label">
                    <em className="icon ni ni-file-text"></em>
                    Invoice Number
                  </div>
                  <div className="invoice-info-value">{selectedInvoice.invoiceNumber}</div>
                </div>
                
                <div className="invoice-info-card">
                  <div className="invoice-info-label">
                    <em className="icon ni ni-calendar"></em>
                    Invoice Date
                  </div>
                  <div className="invoice-info-value">
                    {selectedInvoice.invoiceDate 
                      ? new Date(selectedInvoice.invoiceDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: '2-digit' 
                        })
                      : 'N/A'
                    }
                  </div>
                </div>
                
                <div className="invoice-info-card">
                  <div className="invoice-info-label">
                    <em className="icon ni ni-calendar-check"></em>
                    Due Date
                  </div>
                  <div className="invoice-info-value">
                    {selectedInvoice.dueDate 
                      ? new Date(selectedInvoice.dueDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: '2-digit' 
                        })
                      : 'N/A'
                    }
                  </div>
                </div>
                
                <div className="invoice-info-card">
                  <div className="invoice-info-label">
                    <em className="icon ni ni-sign-dollar"></em>
                    Total Amount
                  </div>
                  <div className="invoice-info-value invoice-amount">
                    ${parseFloat(selectedInvoice.totalAmount || selectedInvoice.total || 0).toFixed(2)}
                  </div>
                </div>
              </div>
              
              {/* Vendor & Employee Info */}
              <div className="invoice-details-section">
                <h4 className="invoice-section-title">
                  <em className="icon ni ni-users"></em>
                  Vendor & Employee Information
                </h4>
                <div className="invoice-details-grid">
                  <div className="invoice-detail-item">
                    <span className="invoice-detail-label">Vendor:</span>
                    <span className="invoice-detail-value">
                      {(() => {
                        console.log('🔍 Full selectedInvoice object:', selectedInvoice);
                        console.log('🔍 selectedInvoice.vendor:', selectedInvoice.vendor);
                        console.log('🔍 selectedInvoice.employee:', selectedInvoice.employee);
                        console.log('🔍 selectedInvoice.timesheet:', selectedInvoice.timesheet);
                        
                        // Try multiple paths to find vendor name
                        const vendorName = selectedInvoice.vendor?.name || 
                                          selectedInvoice.timesheet?.employee?.vendor?.name || 
                                          selectedInvoice.employee?.vendor?.name;
                        console.log('🏢 Final vendor name:', vendorName);
                        return vendorName || 'N/A';
                      })()}
                    </span>
                  </div>
                  <div className="invoice-detail-item">
                    <span className="invoice-detail-label">Vendor Email:</span>
                    <span className="invoice-detail-value">
                      {(() => {
                        // Try multiple paths to find vendor email
                        const vendorEmail = selectedInvoice.vendor?.email || 
                                           selectedInvoice.timesheet?.employee?.vendor?.email || 
                                           selectedInvoice.employee?.vendor?.email;
                        console.log('📧 Final vendor email:', vendorEmail);
                        return vendorEmail || 'N/A';
                      })()}
                    </span>
                  </div>
                  <div className="invoice-detail-item">
                    <span className="invoice-detail-label">Employee:</span>
                    <span className="invoice-detail-value">
                      {(() => {
                        // Try multiple paths to find employee name
                        let employeeName = 'N/A';
                        if (selectedInvoice.employee?.firstName && selectedInvoice.employee?.lastName) {
                          employeeName = `${selectedInvoice.employee.firstName} ${selectedInvoice.employee.lastName}`;
                        } else if (selectedInvoice.timesheet?.employee?.firstName && selectedInvoice.timesheet?.employee?.lastName) {
                          employeeName = `${selectedInvoice.timesheet.employee.firstName} ${selectedInvoice.timesheet.employee.lastName}`;
                        }
                        console.log('👤 Final employee name:', employeeName);
                        return employeeName;
                      })()}
                    </span>
                  </div>
                  <div className="invoice-detail-item">
                    <span className="invoice-detail-label">Employee Email:</span>
                    <span className="invoice-detail-value">
                      {(() => {
                        // Try multiple paths to find employee email
                        const employeeEmail = selectedInvoice.employee?.email || 
                                             selectedInvoice.timesheet?.employee?.email;
                        console.log('📧 Final employee email:', employeeEmail);
                        return employeeEmail || 'N/A';
                      })()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Timesheet Period */}
              {selectedInvoice.timesheet && (
                <div className="invoice-details-section">
                  <h4 className="invoice-section-title">
                    <em className="icon ni ni-calendar-alt"></em>
                    Timesheet Period
                  </h4>
                  <div className="invoice-details-grid">
                    <div className="invoice-detail-item">
                      <span className="invoice-detail-label">Week Start:</span>
                      <span className="invoice-detail-value">
                        {new Date(selectedInvoice.timesheet.weekStart).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="invoice-detail-item">
                      <span className="invoice-detail-label">Week End:</span>
                      <span className="invoice-detail-value">
                        {new Date(selectedInvoice.timesheet.weekEnd).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Line Items */}
              {selectedInvoice.lineItems && selectedInvoice.lineItems.length > 0 && (
                <div className="invoice-details-section">
                  <h4 className="invoice-section-title">
                    <em className="icon ni ni-list"></em>
                    Line Items
                  </h4>
                  <div className="invoice-line-items">
                    <table className="invoice-items-table">
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th>Hours</th>
                          <th>Rate</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.lineItems.map((item, index) => (
                          <tr key={index}>
                            <td>{item.description}</td>
                            <td>{item.hours || item.quantity || 0}</td>
                            <td>${parseFloat(item.rate || item.hourlyRate || 0).toFixed(2)}</td>
                            <td>${parseFloat(item.amount || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Status & Payment Info */}
              <div className="invoice-details-section">
                <h4 className="invoice-section-title">
                  <em className="icon ni ni-info"></em>
                  Status Information
                </h4>
                <div className="invoice-details-grid">
                  <div className="invoice-detail-item">
                    <span className="invoice-detail-label">Invoice Status:</span>
                    <span className="invoice-detail-value">
                      <span className={`badge badge-${selectedInvoice.status === 'paid' ? 'success' : selectedInvoice.status === 'pending' ? 'warning' : 'info'}`}>
                        {selectedInvoice.status || 'Pending'}
                      </span>
                    </span>
                  </div>
                  <div className="invoice-detail-item">
                    <span className="invoice-detail-label">Payment Status:</span>
                    <span className="invoice-detail-value">
                      <span className={`badge badge-${selectedInvoice.paymentStatus === 'paid' ? 'success' : 'warning'}`}>
                        {selectedInvoice.paymentStatus || 'Pending'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Notes */}
              {selectedInvoice.notes && (
                <div className="invoice-details-section">
                  <h4 className="invoice-section-title">
                    <em className="icon ni ni-notes"></em>
                    Notes
                  </h4>
                  <div className="invoice-notes">
                    {selectedInvoice.notes}
                  </div>
                </div>
              )}
            </div>
            
            <div className="invoice-modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setInvoiceModalOpen(false)}
              >
                <em className="icon ni ni-cross"></em>
                Close
              </button>
              {/* Edit Invoice button removed - not needed for timesheet module */}
              <button 
                className="btn btn-success"
                onClick={() => {
                  setInvoiceModalOpen(false);
                  handleViewInvoicePDF(selectedInvoice.id);
                }}
                style={{backgroundColor: '#10b981'}}
              >
                <em className="icon ni ni-eye"></em>
                Preview PDF
              </button>
              <button 
                className="btn btn-info"
                onClick={async () => {
                  try {
                    // Fetch PDF data and trigger download
                    const response = await axios.get(
                      `${API_BASE}/api/invoices/${selectedInvoice.id}/pdf-data?tenantId=${user.tenantId}`
                    );
                    if (response.data.success) {
                      setInvoiceForPDF(response.data.invoice);
                      // Trigger download via InvoicePDFPreviewModal
                      setPdfPreviewOpen(true);
                      setTimeout(() => {
                        // Auto-trigger download
                        document.querySelector('.invoice-pdf-download-btn')?.click();
                      }, 500);
                    }
                  } catch (error) {
                    console.error('Error downloading invoice:', error);
                    showModal({
                      type: 'error',
                      title: 'Error',
                      message: 'Failed to download invoice.'
                    });
                  }
                }}
              >
                <em className="icon ni ni-download"></em>
                Download Invoice
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Invoice Modal - REMOVED (not needed for timesheet module) */}
      
      {/* PDF Preview Modal */}
      {pdfPreviewOpen && invoiceForPDF && (
        <InvoicePDFPreviewModal
          invoice={invoiceForPDF}
          onClose={() => {
            setPdfPreviewOpen(false);
            setInvoiceForPDF(null);
          }}
          onUpdate={async (updatedInvoice) => {
            try {
              console.log('💾 Saving invoice updates to backend...', updatedInvoice);
              
              // Save to backend
              const response = await axios.put(
                `${API_BASE}/api/invoices/${updatedInvoice.id}?tenantId=${user.tenantId}`,
                {
                  ...updatedInvoice,
                  tenantId: user.tenantId
                },
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                }
              );
              
              if (response.data.success) {
                console.log('✅ Invoice saved successfully!');
                
                // Close the modal
                setPdfPreviewOpen(false);
                setInvoiceForPDF(null);
                
                // Show success message
                showModal({
                  type: 'success',
                  title: 'Success',
                  message: 'Invoice updated successfully!'
                });
                
                // Reload timesheet data to refresh the invoice list
                await loadTimesheetData();
              } else {
                throw new Error(response.data.message || 'Failed to save invoice');
              }
            } catch (error) {
              console.error('❌ Error saving invoice:', error);
              showModal({
                type: 'error',
                title: 'Error',
                message: error.response?.data?.message || error.message || 'Failed to save invoice'
              });
            }
          }}
        />
      )}
    </div>
  );
};

export default TimesheetSummary;
