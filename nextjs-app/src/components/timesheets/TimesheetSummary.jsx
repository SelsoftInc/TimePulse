'use client';

import Link from 'next/link';
import { useRouter, useParams, usePathname } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import DataGridFilter from '../common/DataGridFilter';
import Modal from '../common/Modal';
import InvoicePDFPreviewModal from '../common/InvoicePDFPreviewModal';
import InvoiceDetailsModal from '../common/InvoiceDetailsModal';
import HourlyRateModal from './HourlyRateModal';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { API_BASE } from '@/config/api';
import { isServerConnectedCached } from '@/utils/serverCheck';
import {
  uploadAndProcessTimesheet,
  transformTimesheetToInvoice} from '@/services/engineService';
import { apiClient } from '@/utils/apiClient';
import { decryptEmployeeFields } from '@/utils/encryption';
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
  
  // Vendor assignment modal state
  const [showVendorAssignModal, setShowVendorAssignModal] = useState(false);
  const [vendorsList, setVendorsList] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [assigningVendor, setAssigningVendor] = useState(false);
  const [currentEmployeeForAssignment, setCurrentEmployeeForAssignment] = useState(null);
  const [currentTimesheetForRetry, setCurrentTimesheetForRetry] = useState(null);
  
  // Hourly rate modal state
  const [showHourlyRateModal, setShowHourlyRateModal] = useState(false);
  const [hourlyRateInput, setHourlyRateInput] = useState('45.00');
  const [updatingHourlyRate, setUpdatingHourlyRate] = useState(false);
  const [currentEmployeeForRate, setCurrentEmployeeForRate] = useState(null);
  const [currentTimesheetForRateRetry, setCurrentTimesheetForRateRetry] = useState(null);
  const [providedVendorForRetry, setProvidedVendorForRetry] = useState(null);
  
  // Email missing modal state
  const [showEmailMissingModal, setShowEmailMissingModal] = useState(false);
  const [emailMissingInfo, setEmailMissingInfo] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  
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
          const formattedTimesheets = allTimesheets.map(ts => {
            // Parse dates as local dates to avoid timezone issues
            const parseLocalDate = (dateStr) => {
              if (!dateStr) return null;
              const [datePart] = dateStr.split('T');
              const [year, month, day] = datePart.split('-').map(Number);
              return new Date(year, month - 1, day);
            };
            
            const weekStartDate = parseLocalDate(ts.weekStart);
            const weekEndDate = parseLocalDate(ts.weekEnd);
            
            const formatLocalDate = (date) => {
              if (!date) return 'N/A';
              // Format as DD-MM-YYYY (date-month-year)
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              return `${day}-${month}-${year}`;
            };
            
            return {
              id: ts.id,
              weekRange: ts.weekRange || `${formatLocalDate(weekStartDate)} To ${formatLocalDate(weekEndDate)}`,
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
            };
          });

          console.log('📊 Formatted timesheets:', formattedTimesheets);
          setTimesheets(formattedTimesheets);
        } else {
          console.error('❌ API returned success: false');
          setTimesheets([]);
        }
      } else {
        // Regular employee - get their own timesheets
        console.log('👤 Employee detected - loading personal timesheets');

        // Try to get employeeId from user object first, fallback to email lookup
        let employeeId = user?.employeeId || user?.id;
        console.log('🔍 Initial employeeId from user:', employeeId);

        // If no employeeId, try to get it from email
        if (!employeeId) {
          console.log('📡 Fetching employee by email...');
          const empResponse = await axios.get(`${API_BASE}/api/timesheets/employees/by-email/${encodeURIComponent(userEmail)}?tenantId=${tenantId}`);

          if (!empResponse.data.success || !empResponse.data.employee) {
            console.error('❌ Employee not found for email:', userEmail);
            console.error('This user may not have an employee record.');
            setTimesheets([]);
            setLoading(false);
            return;
          }

          employeeId = empResponse.data.employee.id;
        }
        
        console.log('✅ Using employeeId:', employeeId);

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

  // Auto-refresh when page becomes visible (e.g., after submitting a timesheet)
  useEffect(() => {
    if (!isMounted) return;

    const handleVisibilityChange = () => {
      if (!document.hidden && user?.tenantId) {
        console.log('🔄 Page became visible, reloading timesheet data...');
        loadTimesheetData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isMounted, user?.tenantId, loadTimesheetData]);

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

    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      // Parse the week range to get the start date
      // Supports both "Jan 03, 2026 To Jan 09, 2026" and "01-03-2026 To 01-09-2026" formats
      const weekRangeParts = timesheet.weekRange.split(' To ');
      if (weekRangeParts.length === 2) {
        const weekStartStr = weekRangeParts[0].trim();
        const weekEndStr = weekRangeParts[1].trim();
        
        // Universal date parser - handles multiple formats
        const parseDate = (dateStr) => {
          // Try DD-MM-YYYY format (e.g., "15-01-2026")
          if (dateStr.includes('-')) {
            const parts = dateStr.split('-');
            if (parts.length === 3 && parts[0].length <= 2) {
              const [day, month, year] = parts.map(Number);
              // First value is day, second is month, third is year
              return new Date(year, month - 1, day);
            }
          }
          
          // Try "Jan 03, 2026" format (fallback for old data)
          const dateObj = new Date(dateStr);
          if (!isNaN(dateObj.getTime())) {
            return dateObj;
          }
          
          return null;
        };
        
        const weekStart = parseDate(weekStartStr);
        const weekEnd = parseDate(weekEndStr);
        
        if (!weekStart || !weekEnd) {
          return true; // Skip filtering if dates can't be parsed
        }
        
        // Apply from filter
        if (filters.dateRange.from) {
          const fromDate = parseDate(filters.dateRange.from);
          if (fromDate && weekEnd < fromDate) {
            return false;
          }
        }
        
        // Apply to filter
        if (filters.dateRange.to) {
          const toDate = parseDate(filters.dateRange.to);
          if (toDate && weekStart > toDate) {
            return false;
          }
        }
      }
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
        { value: "all", label: "All Status" },
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
  // const paginatedTimesheets = filteredTimesheets.slice(startIndex, endIndex);

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
  
  // Fetch vendors list for assignment
  const fetchVendorsForAssignment = async () => {
    try {
      const tenantId = user?.tenantId;
      const token = localStorage.getItem('token');
      
      console.log('📦 Fetching vendors for assignment...', { tenantId });
      
      const response = await fetch(
        `${API_BASE}/api/vendors?tenantId=${tenantId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const rawData = await response.json();
      console.log('📥 Vendors API raw response:', rawData);
      
      // Import decryptAuthResponse dynamically
      const { decryptAuthResponse } = await import('@/utils/encryption');
      
      // Decrypt the response using the proper decryption function
      const decryptedData = decryptAuthResponse(rawData);
      console.log('🔓 Decrypted vendors data:', decryptedData);
      
      if (decryptedData.success && decryptedData.vendors && Array.isArray(decryptedData.vendors)) {
        setVendorsList(decryptedData.vendors);
        console.log('✅ Loaded vendors:', decryptedData.vendors.length, decryptedData.vendors);
      } else {
        console.error('❌ No vendors found in response or invalid format');
        console.error('Response structure:', decryptedData);
        setVendorsList([]);
      }
    } catch (error) {
      console.error('❌ Error fetching vendors:', error);
      console.error('Error details:', error.message, error.stack);
      setVendorsList([]);
    }
  };
  
  const handleSaveHourlyRate = async () => {
    if (!currentEmployeeForRate || !hourlyRateInput) {
      showModal({
        type: 'error',
        title: 'Rate Required',
        message: 'Please enter a valid hourly rate.'
      });
      return;
    }

    const rate = parseFloat(hourlyRateInput);
    if (isNaN(rate) || rate <= 0) {
      showModal({
        type: 'error',
        title: 'Invalid Rate',
        message: 'Please enter a valid hourly rate greater than 0.'
      });
      return;
    }

    setUpdatingHourlyRate(true);

    try {
      console.log('📤 Updating hourly rate for employee:', {
        employeeId: currentEmployeeForRate.id,
        hourlyRate: rate
      });

      // Update employee hourly rate via API
      const response = await apiClient.put(
        `/api/employees/${currentEmployeeForRate.id}`,
        {
          hourlyRate: rate,
          tenantId: user.tenantId
        }
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to update hourly rate');
      }

      console.log('✅ Hourly rate updated successfully');

      // Close the modal
      setShowHourlyRateModal(false);
      setCurrentEmployeeForRate(null);
      setHourlyRateInput('45.00');

      // Show success message
      showModal({
        type: 'success',
        title: 'Rate Updated',
        message: `Hourly rate set to $${rate.toFixed(2)}. Generating invoice...`
      });

      // Retry invoice generation with updated rate
      if (currentTimesheetForRateRetry) {
        console.log('🔄 Retrying invoice generation after hourly rate update...');
        const timesheetToRetry = currentTimesheetForRateRetry;
        const vendorToUse = providedVendorForRetry;
        setCurrentTimesheetForRateRetry(null);
        setProvidedVendorForRetry(null);

        // Small delay to let the success message show
        setTimeout(() => {
          closeModal();
          generateInvoice(timesheetToRetry, vendorToUse);
        }, 1500);
      }
    } catch (error) {
      console.error('❌ Error updating hourly rate:', error);
      showModal({
        type: 'error',
        title: 'Update Failed',
        message: `Failed to update hourly rate: ${error.message}`
      });
    } finally {
      setUpdatingHourlyRate(false);
    }
  };
  
  const handleAssignVendor = async () => {
    if (!selectedVendor || !currentEmployeeForAssignment) {
      showModal({
        type: 'error',
        title: 'Selection Required',
        message: 'Please select a vendor before proceeding.'
      });
      return;
    }

    setAssigningVendor(true);

    try {
      console.log('📤 Assigning vendor to employee:', {
        employeeId: currentEmployeeForAssignment.id,
        vendorId: selectedVendor
      });

      // Update the employee record with the vendorId
      const updateResponse = await apiClient.put(
        `/api/employees/${currentEmployeeForAssignment.id}`,
        {
          vendorId: selectedVendor,
          tenantId: user.tenantId
        }
      );

      if (!updateResponse.success) {
        throw new Error(updateResponse.error || 'Failed to update employee with vendor');
      }

      console.log('✅ Employee updated with vendor successfully');

      // Fetch the selected vendor details
      const vendorResponse = await apiClient.get(
        `/api/vendors/${selectedVendor}`,
        { tenantId: user.tenantId }
      );

      if (!vendorResponse.success || !vendorResponse.vendor) {
        throw new Error('Failed to fetch vendor details');
      }

      console.log('✅ Vendor details fetched:', vendorResponse.vendor);
      
      // Close the modal
      setShowVendorAssignModal(false);
      setSelectedVendor('');
      setCurrentEmployeeForAssignment(null);
      
      // Retry invoice generation with the vendor info
      if (currentTimesheetForRetry) {
        console.log('🔄 Retrying invoice generation after vendor assignment...');
        const timesheetToRetry = currentTimesheetForRetry;
        setCurrentTimesheetForRetry(null);
        
        // Pass vendor info directly to invoice generation
        await generateInvoice(timesheetToRetry, vendorResponse.vendor);
      }
    } catch (error) {
      console.error('❌ Error processing vendor assignment:', error);
      showModal({
        type: 'error',
        title: 'Assignment Failed',
        message: `Failed to assign vendor: ${error.message}`
      });
    } finally {
      setAssigningVendor(false);
    }
  };
  
  const handleSaveEmailAndGenerateInvoice = async () => {
    if (!newEmail || !emailMissingInfo) {
      showModal({
        type: 'error',
        title: 'Email Required',
        message: 'Please enter a valid Email.'
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      showModal({
        type: 'error',
        title: 'Invalid Email',
        message: 'Please enter a valid Email format.'
      });
      return;
    }

    setSavingEmail(true);

    try {
      const token = localStorage.getItem('token');
      const tenantId = user?.tenantId;

      if (!token || !tenantId) {
        throw new Error('Authentication required');
      }

      console.log('📤 Updating email for:', {
        type: emailMissingInfo.type,
        id: emailMissingInfo.id,
        email: newEmail
      });

      const endpoint = emailMissingInfo.type === 'Vendor' 
        ? `${API_BASE}/api/vendors/${emailMissingInfo.id}`
        : `${API_BASE}/api/clients/${emailMissingInfo.id}`;

      const response = await fetch(
        `${endpoint}?tenantId=${tenantId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: newEmail
          })
        }
      );

      if (response.ok) {
        console.log('✅ Email updated successfully');
        
        setShowEmailMissingModal(false);
        setNewEmail('');
        
        if (emailMissingInfo.timesheet) {
          console.log('🔄 Retrying invoice generation after email update...');
          const timesheetToRetry = emailMissingInfo.timesheet;
          setEmailMissingInfo(null);
          
          await generateInvoice(timesheetToRetry);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to update email');
      }
    } catch (error) {
      console.error('❌ Error updating email:', error);
      showModal({
        type: 'error',
        title: 'Update Failed',
        message: `Failed to update email: ${error.message}`
      });
    } finally {
      setSavingEmail(false);
    }
  };
  
  const handleGenerateInvoiceFromTimesheet = async (timesheet) => {
    showModal({
      type: 'confirm',
      title: 'Generate Invoice',
      message: `Generate Invoice for Timesheet: ${timesheet.weekRange}?\n\nHours: ${timesheet.totalTimeHours || timesheet.billableProjectHrs}\n\nThis will create an invoice and send it to the employee's vendor.`,
      showCancel: true,
      confirmText: 'Generate Invoice',
      onConfirm: () => generateInvoice(timesheet)
    });
  };
  
  const generateInvoice = async (timesheet, providedVendor = null) => {

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
        console.log('📦 Total employees returned:', employeesResponse?.employees?.length);
        
        if (!employeesResponse.success || !employeesResponse.employees) {
          console.error('❌ Invalid employee API response:', employeesResponse);
          throw new Error('Failed to fetch employees from Employee API');
        }
        
        // CRITICAL: Decrypt ALL employees BEFORE searching
        // This is necessary because the search compares plain text from timesheet
        // with encrypted data from database
        const allEmployees = employeesResponse.employees.map(emp => decryptEmployeeFields(emp));
        console.log('🔓 Decrypted all employees for search');
        console.log('🔍 Searching for employee with email:', employeeEmail, 'or name:', employeeName);
        
        if (employeeEmail) {
          employeeData = allEmployees.find(emp => 
            emp.email && emp.email.toLowerCase() === employeeEmail.toLowerCase()
          );
          console.log('🔍 Searched by email:', employeeEmail, 'Found:', !!employeeData);
          if (employeeData) {
            console.log('✅ Match found - Email:', employeeData.email);
          }
        }
        
        // If not found by email, try by name
        if (!employeeData && employeeName) {
          employeeData = allEmployees.find(emp => {
            const empFullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
            console.log('🔍 Comparing:', empFullName, 'with', employeeName);
            return empFullName.toLowerCase() === employeeName.toLowerCase();
          });
          console.log('🔍 Searched by name:', employeeName, 'Found:', !!employeeData);
          if (employeeData) {
            console.log('✅ Match found - Name:', `${employeeData.firstName} ${employeeData.lastName}`);
          }
        }
        
        if (!employeeData) {
          console.error('❌ Employee not found after decryption');
          console.error('Available employees:', allEmployees.map(e => ({
            name: `${e.firstName} ${e.lastName}`,
            email: e.email
          })));
          throw new Error(`Employee not found in Employee API with email: ${employeeEmail} or name: ${employeeName}`);
        }
        
        employeeId = employeeData.id;
        console.log('✅ Found employee in Employee API:', {
          id: employeeData.id,
          name: `${employeeData.firstName} ${employeeData.lastName}`,
          email: employeeData.email,
          hasVendor: !!employeeData.vendor,
          hasClient: !!employeeData.client,
          vendorData: employeeData.vendor,
          clientData: employeeData.client,
          vendorId: employeeData.vendorId,
          clientId: employeeData.clientId,
          hourlyRate: employeeData.hourlyRate
        });
        
        // ============================================================
        // VALIDATION: Check if employee has hourly rate
        // ============================================================
        const hourlyRate = parseFloat(employeeData.hourlyRate) || 0;
        if (hourlyRate === 0) {
          console.error('❌ Employee has no hourly rate set');
          setGeneratingInvoiceId(null);
          closeModal();
          
          // Show custom modal to enter hourly rate
          setTimeout(() => {
            setCurrentEmployeeForRate(employeeData);
            setCurrentTimesheetForRateRetry(timesheet);
            setProvidedVendorForRetry(providedVendor);
            setHourlyRateInput('45.00');
            setShowHourlyRateModal(true);
          }, 100);
          return;
        }
        console.log('✅ Employee has valid hourly rate:', hourlyRate);
        
        // CRITICAL DEBUG: Log detailed vendor structure
        console.log('🔍 VENDOR DETECTION DEBUG:');
        console.log('  - employeeData.vendor:', employeeData.vendor);
        console.log('  - employeeData.vendorObject:', employeeData.vendorObject);
        console.log('  - employeeData.vendorId:', employeeData.vendorId);
        if (employeeData.vendor) {
          console.log('  - vendor.id:', employeeData.vendor.id);
          console.log('  - vendor.name:', employeeData.vendor.name);
          console.log('  - vendor.email:', employeeData.vendor.email);
          console.log('  - vendor type:', typeof employeeData.vendor);
          console.log('  - vendor keys:', Object.keys(employeeData.vendor));
        }
        console.log('  - employeeData.client:', employeeData.client);
        console.log('  - employeeData.clientObject:', employeeData.clientObject);
        console.log('  - employeeData.clientId:', employeeData.clientId);
        if (employeeData.client) {
          console.log('  - client.id:', employeeData.client.id);
          console.log('  - client.name:', employeeData.client.name);
          console.log('  - client.email:', employeeData.client.email);
          console.log('  - client type:', typeof employeeData.client);
          console.log('  - client keys:', Object.keys(employeeData.client));
        }
        
        // ============================================================
        // STEP 3: Validate vendor/client assignment
        // ============================================================
        console.log('🔍 STEP 3: Starting vendor/client validation checks...');
        
        // If vendor was provided from assignment modal, use it directly
        if (providedVendor && providedVendor.id) {
          console.log('📌 Check 1: providedVendor - HAS DATA');
          vendorClientInfo = providedVendor;
          vendorClientType = 'Vendor';
          console.log('✅ Using provided vendor from assignment:', {
            id: vendorClientInfo.id,
            name: vendorClientInfo.name || vendorClientInfo.vendorName,
            email: vendorClientInfo.email
          });
        }
        // Check for vendorObject (new field with full vendor data including email)
        else if (employeeData.vendorObject && employeeData.vendorObject.id) {
          console.log('📌 Check 2: employeeData.vendorObject - HAS DATA');
          vendorClientInfo = employeeData.vendorObject;
          vendorClientType = 'Vendor';
          console.log('✅ Found vendorObject from employee API:', {
            id: vendorClientInfo.id,
            name: vendorClientInfo.name || vendorClientInfo.vendorName,
            email: vendorClientInfo.email
          });
        }
        // Check for vendor assignment (legacy nested vendor object)
        else if (employeeData.vendor && employeeData.vendor.id) {
          console.log('📌 Check 3: employeeData.vendor - HAS DATA');
          vendorClientInfo = employeeData.vendor;
          vendorClientType = 'Vendor';
          console.log('✅ Found vendor from employee API:', {
            id: vendorClientInfo.id,
            name: vendorClientInfo.name || vendorClientInfo.vendorName,
            email: vendorClientInfo.email
          });
        }
        // Check for clientObject (new field with full client data including email)
        else if (employeeData.clientObject && employeeData.clientObject.id) {
          console.log('📌 Check 4: employeeData.clientObject - HAS DATA');
          vendorClientInfo = employeeData.clientObject;
          vendorClientType = 'Client';
          console.log('✅ Found clientObject from employee API:', {
            id: vendorClientInfo.id,
            name: vendorClientInfo.name || vendorClientInfo.clientName,
            email: vendorClientInfo.email
          });
        }
        // Check for client assignment (legacy nested client object)
        else if (employeeData.client && employeeData.client.id) {
          console.log('📌 Check 5: employeeData.client - HAS DATA');
          vendorClientInfo = employeeData.client;
          vendorClientType = 'Client';
          console.log('✅ Found client from employee API - RAW:', employeeData.client);
          console.log('✅ Found client from employee API - PROCESSED:', {
            id: vendorClientInfo.id,
            name: vendorClientInfo.name || vendorClientInfo.clientName,
            email: vendorClientInfo.email,
            allKeys: Object.keys(vendorClientInfo)
          });
        }
        // No vendor or client found
        else {
          console.log('📌 All checks (1-5) FAILED - NO VENDOR/CLIENT FOUND');
          console.log('📌 Check 1 result: providedVendor =', providedVendor, 'has id?', providedVendor?.id);
          console.log('📌 Check 2 result: vendorObject =', employeeData.vendorObject, 'has id?', employeeData.vendorObject?.id);
          console.log('📌 Check 3 result: vendor =', employeeData.vendor, 'has id?', employeeData.vendor?.id);
          console.log('📌 Check 4 result: clientObject =', employeeData.clientObject, 'has id?', employeeData.clientObject?.id);
          console.log('📌 Check 5 result: client =', employeeData.client, 'has id?', employeeData.client?.id);
          console.error('❌ No vendor or client assigned to employee');
          console.error('Employee data:', employeeData);
          console.log('🔄 Preparing to show vendor assignment modal...');
          
          setGeneratingInvoiceId(null);
          closeModal();
          
          // Store employee and timesheet for retry after vendor assignment
          // Ensure employee data is decrypted before storing
          const decryptedEmployeeForModal = {
            id: employeeData.id,
            firstName: employeeData.firstName,
            lastName: employeeData.lastName,
            email: employeeData.email,
            vendor: employeeData.vendorObject || employeeData.vendor,
            client: employeeData.clientObject || employeeData.client,
            vendorId: employeeData.vendorId,
            clientId: employeeData.clientId
          };
          console.log('🔓 Decrypted employee for modal:', decryptedEmployeeForModal);
          setCurrentEmployeeForAssignment(decryptedEmployeeForModal);
          setCurrentTimesheetForRetry(timesheet);
          
          console.log('📋 Fetching vendors list...');
          // Fetch vendors list
          await fetchVendorsForAssignment();
          
          console.log('✅ Vendors fetched, showing modal...');
          console.log('📋 Vendors list:', vendorsList);
          console.log('👤 Employee for assignment:', decryptedEmployeeForModal);
          
          // Show vendor assignment modal
          setTimeout(() => {
            console.log('🎯 Setting showVendorAssignModal to true');
            setShowVendorAssignModal(true);
          }, 100);
          return;
        }

      } catch (error) {
        console.error('❌ Error fetching employee data:', error);
        console.error('❌ Error details:', error.response?.data);
        
        // If we have basic employee info from timesheet, try to show vendor assignment modal
        if (employeeName || employeeEmail) {
          console.log('⚠️ Employee API failed, but we have basic info. Attempting vendor assignment...');
          
          // Create a basic employee object from timesheet data
          const basicEmployeeData = {
            id: null,
            firstName: employeeName ? employeeName.split(' ')[0] : 'Unknown',
            lastName: employeeName ? employeeName.split(' ').slice(1).join(' ') : '',
            email: employeeEmail || '',
            vendor: null,
            client: null
          };
          
          setGeneratingInvoiceId(null);
          closeModal();
          
          setCurrentEmployeeForAssignment(basicEmployeeData);
          setCurrentTimesheetForRetry(timesheet);
          
          console.log('📋 Fetching vendors list for fallback assignment...');
          await fetchVendorsForAssignment();
          
          setTimeout(() => {
            console.log('🎯 Showing vendor assignment modal (fallback mode)');
            setShowVendorAssignModal(true);
          }, 100);
          return;
        }
        
        // If we don't have any employee info, show error
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

      // Step 4: Validate that vendor/client has Email
      // Email is required to send invoice
      if (!vendorClientInfo.email) {
        console.error('❌ Validation failed: Vendor/Client email missing from Employee API data');
        console.error('Vendor/Client info:', vendorClientInfo);
        setGeneratingInvoiceId(null);
        
        // Close confirmation modal first, then show email input modal
        closeModal();
        
        // Store info for email addition
        setEmailMissingInfo({
          type: vendorClientType,
          id: vendorClientInfo.id,
          name: vendorClientInfo.name || vendorClientInfo.vendorName || vendorClientInfo.clientName || 'Unknown',
          employeeData: employeeData,
          timesheet: timesheet
        });
        setNewEmail('');
        
        setTimeout(() => {
          setShowEmailMissingModal(true);
        }, 100);
        return;
      }
      
      console.log('✅ All validations passed!');
      console.log('✅ Employee details fetched from Employee API');
      console.log('✅ Vendor/Client assignment confirmed');
      console.log('✅ Vendor/Client email verified');
      console.log('📤 Proceeding with invoice generation...');
      console.log('📤 Final vendor/client info before API call:', {
        type: vendorClientType,
        id: vendorClientInfo.id,
        name: vendorClientInfo.name || vendorClientInfo.vendorName || vendorClientInfo.clientName,
        email: vendorClientInfo.email
      });

      // Prepare invoice generation payload with all required data
      const invoicePayload = {
        tenantId: user.tenantId,
        userId: user.id,
        employeeId: employeeId,
        employeeName: `${employeeData.firstName} ${employeeData.lastName}`,
        employeeEmail: employeeData.email,
        vendorClientType: vendorClientType,
        vendorClientId: vendorClientInfo.id,
        vendorClientName: vendorClientInfo.name || vendorClientInfo.vendorName || vendorClientInfo.clientName,
        vendorClientEmail: vendorClientInfo.email
      };

      console.log('📤 Invoice generation payload:', invoicePayload);

      const response = await axios.post(
        `${API_BASE}/api/timesheets/${timesheet.id}/generate-invoice`,
        invoicePayload
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
            ? `${errorMessage}\n\nAction Required:\n1. Go to Vendors menu\n2. Find and edit the vendor assigned to this employee\n3. Add a valid Email for the vendor\n4. Save and try generating invoice again`
            : `${errorMessage}\n\nAction Required:\n1. Go to Employees menu\n2. Edit the employee record: ${timesheet.employeeName || 'Unknown'}\n3. Assign a vendor with Email\n4. Save and try generating invoice again`,
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
  // if (!isMounted || loading) {
  //   return (
  //     <div className="nk-conten">
  //       <div className="container-fluid">
  //         <div className="nk-content-inne">
  //           <div className="nk-content-body">
  //             <div className="nk-block-head nk-block-head-sm mb-4">
  //               <div className="nk-block-between items-center">
  //                 <div className="nk-block-head-content">
  //                   <h1 className="nk-block-title page-title">Timesheets</h1>
  //                 </div>
  //               </div>
  //             </div>
  //             <div className="nk-bloc">
  //               <div className="card card-bordered">
  //                 <div className="card-inne">
  //                   <div className="text-center">
  //                     <div className="spinner-border" role="status">
  //                       <span className="visually-hidden">Loading...</span>
  //                     </div>
  //                     <p className="mt-2">Loading timesheets...</p>
  //                   </div>
  //                 </div>
  //               </div>
  //             </div>
  // Calculate paginated timesheets from filtered data
  const paginatedTimesheets = filteredTimesheets.slice(startIndex, endIndex);

  return (

  <div
  className="timesheet-dashboard">

  <div className="max-w-8xl mx-auto space-y-4">

    {/* ================= TIMESHEET HEADER ================= */}
    <div
      className="
        sticky top-4 z-30 mb-9
        rounded-3xl
        bg-[#7cbdf2]
        dark:bg-gradient-to-br dark:from-[#0f1a25] dark:via-[#121f33] dark:to-[#162a45]
        shadow-sm dark:shadow-[0_8px_24px_rgba(0,0,0,0.6)]
        backdrop-blur-md
        border border-transparent dark:border-white/5
      "
    >
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-center">

          {/* LEFT */}
          <div className="relative pl-5">
            <span className="absolute left-0 top-2 h-10 w-1 rounded-full bg-purple-900 dark:bg-indigo-400" />

            <h1
              className="
                text-[2rem]
                font-bold
                text-white
                leading-[1.15]
                tracking-tight
                drop-shadow-[0_2px_8px_rgba(0,0,0,0.18)]
              "
            >
              Timesheets
            </h1>

            <p className="mt-0 text-sm text-white/80 dark:text-slate-300">
              Track, submit, and manage weekly work logs
            </p>
          </div>

          {/* RIGHT */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleNewTimesheet}
              className="
                flex items-center gap-2.5
                rounded-full
                bg-slate-900 px-6 py-3
                text-sm font-semibold text-white
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
            </button>
          </div>

        </div>
      </div>
    </div>

    {/* ================= CONTENT ================= */}
    <div
      className="
        bg-white dark:bg-[#0f1a25]
        rounded-2xl
        shadow-sm dark:shadow-[0_8px_24px_rgba(0,0,0,0.6)]
        border border-slate-200 dark:border-white/5
        overflow-hidden
      "
    >

      {/* ===== FILTERS ===== */}
      <div
  className="
    p-4
    bg-slate-50
    border-b border-slate-200
  "
>

        <p className="mb-2 text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
          Filters
        </p>

        <DataGridFilter
          filters={filterConfig}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          resultCount={filteredTimesheets.length}
          totalCount={timesheets.length}
        />
      </div>

      {/* ===== TABLE ===== */}
      <div className="overflow-x-auto max-h-[65vh]">
        <table className="w-full text-sm">
          <thead
            className="
              sticky top-0 z-10
              bg-slate-100 dark:bg-[#162233]
              text-slate-700 dark:text-slate-300
              border-b border-slate-200 dark:border-white/5
            "
          >
            <tr>
              <th className="px-4 py-3 text-left uppercase text-sm font-bold tracking-wider">WEEK RANGE</th>
              <th className="px-4 py-3 text-left uppercase text-sm font-bold tracking-wider">STATUS</th>
              <th className="px-4 py-3 text-center uppercase text-sm font-bold tracking-wider">HOURS</th>
              <th className="px-4 py-3 text-center uppercase text-sm font-bold tracking-wider">TIME OFF</th>
              <th className="px-4 py-3 text-center uppercase text-sm font-bold tracking-wider">TOTAL</th>
              <th className="px-4 py-3 text-center uppercase text-sm font-bold tracking-wider">ACTIONS</th>
            </tr>
          </thead>

          <tbody>
            {paginatedTimesheets.map((timesheet) => (
              <tr
                key={timesheet.id}
                className="
                  border-b border-slate-200 dark:border-white/5
                  hover:bg-slate-50 dark:hover:bg-[#1a2736]
                  transition-colors
                "
              >
                <td className="px-4 py-3 text-slate-800 dark:text-slate-100">
                  {timesheet.weekRange}
                </td>

                <td className="px-4 py-3">
                  {getStatusBadge(timesheet.status)}
                </td>

                <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-300">
                  {timesheet.billableProjectHrs}
                </td>

                <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-300">
                  {timesheet.timeOffHolidayHrs}
                </td>

                <td className="px-4 py-3 text-center font-medium text-slate-800 dark:text-slate-100">
                  {timesheet.totalTimeHours}
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">

                    <button
                      onClick={() =>
                        router.push(
                          `/${subdomain}/timesheets/submit/${timesheet.id}?mode=edit`
                        )
                      }
                      className="
                        p-2 rounded-lg
                        border border-slate-200 dark:border-white/10
                        text-indigo-600 dark:text-indigo-400
                        hover:bg-indigo-50 dark:hover:bg-indigo-500/10
                        transition
                      "
                    >
                      <i className="fas fa-edit" />
                    </button>

                    {/* Invoice button - Only visible for admin/manager roles */}
                    {(user?.role === 'admin' || user?.role === 'manager') && (
                      <button
                        onClick={() => handleInvoiceButtonClick(timesheet)}
                        className="
                          p-2 rounded-lg
                          border border-slate-200 dark:border-white/10
                          text-emerald-600 dark:text-emerald-400
                          hover:bg-emerald-50 dark:hover:bg-emerald-500/10
                          transition
                        "
                      >
                        <i className="fas fa-file-invoice" />
                      </button>
                    )}

                    <button
                      onClick={() =>
                        router.push(
                          `/${subdomain}/timesheets/submit/${timesheet.id}?mode=view`
                        )
                      }
                      className="
                        p-2 rounded-lg
                        border border-slate-200 dark:border-white/10
                        text-slate-600 dark:text-slate-300
                        hover:bg-slate-100 dark:hover:bg-white/5
                        transition
                      "
                    >
                      <i className="fas fa-eye" />
                    </button>

                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== PAGINATION ===== */}
      {totalPages > 1 && (
        <div
          className="
            p-4
            border-t border-slate-200 dark:border-white/5
            flex flex-col md:flex-row gap-3 md:gap-0
            md:items-center md:justify-between
            text-sm
          "
        >
          <span className="text-slate-600 dark:text-slate-400">
            Showing {startIndex + 1} to{" "}
            {Math.min(endIndex, filteredTimesheets.length)} of{" "}
            {filteredTimesheets.length}
          </span>

          <ul className="flex items-center gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <li key={i}>
                <button
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-3 py-1 rounded-lg border text-sm transition
                    ${
                      currentPage === i + 1
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                    }`}
                >
                  {i + 1}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

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

    {/* Invoice PDF Preview Modal */}
    {pdfPreviewOpen && invoiceForPDF && (
      <InvoicePDFPreviewModal
        isOpen={pdfPreviewOpen}
        onClose={() => {
          setPdfPreviewOpen(false);
          setInvoiceForPDF(null);
        }}
        invoice={invoiceForPDF}
      />
    )}

    {/* Invoice Details Modal */}
    {invoiceModalOpen && selectedInvoice && (
      <InvoiceDetailsModal
        invoice={selectedInvoice}
        onClose={() => {
          setInvoiceModalOpen(false);
          setSelectedInvoice(null);
        }}
      />
    )}

    {/* Vendor Assignment Modal */}
    {showVendorAssignModal && currentEmployeeForAssignment && (
      <div className="modal-overlay" style={{ zIndex: 10001 }}>
        <div className="modal-container" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-header" style={{ 
            background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)', 
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
              <i className="fas fa-exclamation-circle" style={{ fontSize: '24px', marginRight: '12px', flexShrink: 0 }}></i>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Vendor/Client Not Assigned</h3>
            </div>
            <button 
              className="modal-close" 
              onClick={() => {
                setShowVendorAssignModal(false);
                setSelectedVendor('');
                setCurrentEmployeeForAssignment(null);
                setCurrentTimesheetForRetry(null);
              }}
              style={{ 
                background: 'rgba(255,255,255,0.2)', 
                border: 'none', 
                color: '#ffffff', 
                fontSize: '24px', 
                width: '32px', 
                height: '32px', 
                borderRadius: '6px', 
                cursor: 'pointer',
                flexShrink: 0,
                marginLeft: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              ×
            </button>
          </div>
          
          <div className="modal-body" style={{ padding: '24px' }}>
            <p style={{ marginBottom: '16px', color: 'var(--text-secondary, #4b5563)', lineHeight: '1.6' }}>
              Employee <strong>"{currentEmployeeForAssignment.firstName} {currentEmployeeForAssignment.lastName}"</strong> must be associated with a vendor or client to generate invoice.
            </p>
            
            <div style={{ 
              background: 'var(--bg-secondary, #f9fafb)', 
              padding: '16px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              border: '1px solid var(--border-color, #e5e7eb)'
            }}>
              <p style={{ margin: '0 0 12px 0', fontWeight: '600', color: 'var(--text-primary, #1f2937)' }}>
                Quick Assignment:
              </p>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary, #1f2937)' }}>
                Select Vendor:
              </label>
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border-color, #d1d5db)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: 'var(--card-bg, #ffffff)',
                  color: 'var(--text-primary, #1f2937)',
                  cursor: 'pointer'
                }}
                disabled={assigningVendor}
              >
                <option value="">-- Select a Vendor --</option>
                {vendorsList.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name} {vendor.email ? `(${vendor.email})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ 
              background: '#fff3cd', 
              border: '1px solid #ffc107', 
              borderRadius: '6px', 
              padding: '12px',
              marginBottom: '16px'
            }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#856404' }}>
                <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>
                After assigning a vendor, the invoice will be generated automatically.
              </p>
            </div>
          </div>
          
          <div className="modal-footer" style={{ padding: '16px 24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setShowVendorAssignModal(false);
                setSelectedVendor('');
                setCurrentEmployeeForAssignment(null);
                setCurrentTimesheetForRetry(null);
              }}
              disabled={assigningVendor}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--bg-secondary, #f3f4f6)',
                color: 'var(--text-secondary, #6b7280)',
                fontSize: '14px',
                fontWeight: '600',
                cursor: assigningVendor ? 'not-allowed' : 'pointer',
                opacity: assigningVendor ? 0.6 : 1
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAssignVendor}
              disabled={assigningVendor || !selectedVendor}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                background: selectedVendor && !assigningVendor ? '#3b82f6' : '#9ca3af',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: selectedVendor && !assigningVendor ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {assigningVendor ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Assigning...
                </>
              ) : (
                <>
                  <i className="fas fa-check"></i>
                  Assign Vendor & Generate Invoice
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Email Missing Modal */}
    {showEmailMissingModal && emailMissingInfo && (
      <div className="modal-overlay" style={{ zIndex: 10001 }}>
        <div className="modal-container" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-header" style={{ 
            background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)', 
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
              <i className="fas fa-envelope" style={{ fontSize: '24px', marginRight: '12px', flexShrink: 0 }}></i>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {emailMissingInfo.type} Email Missing
              </h3>
            </div>
            <button 
              className="modal-close" 
              onClick={() => {
                setShowEmailMissingModal(false);
                setNewEmail('');
                setEmailMissingInfo(null);
              }}
              style={{ 
                background: 'rgba(255,255,255,0.2)', 
                border: 'none', 
                color: '#ffffff', 
                fontSize: '24px', 
                width: '32px', 
                height: '32px', 
                borderRadius: '6px', 
                cursor: 'pointer',
                flexShrink: 0,
                marginLeft: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              ×
            </button>
          </div>
          
          <div className="modal-body" style={{ padding: '24px' }}>
            <p style={{ marginBottom: '20px', color: 'var(--text-secondary, #4b5563)', lineHeight: '1.6' }}>
              {emailMissingInfo.type} <strong>"{emailMissingInfo.name}"</strong> does not have an Email configured.
            </p>
            
            <div style={{ 
              background: 'var(--bg-secondary, #f9fafb)', 
              padding: '16px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              border: '1px solid var(--border-color, #e5e7eb)'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary, #6b7280)' }}>
                  Employee:
                </label>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary, #1f2937)' }}>
                  {emailMissingInfo.employeeData ? `${emailMissingInfo.employeeData.firstName} ${emailMissingInfo.employeeData.lastName}` : 'N/A'}
                </div>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary, #6b7280)' }}>
                  {emailMissingInfo.type} Name:
                </label>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary, #1f2937)' }}>
                  {emailMissingInfo.name}
                </div>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary, #6b7280)' }}>
                  {emailMissingInfo.type} ID:
                </label>
                <div style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-secondary, #6b7280)' }}>
                  {emailMissingInfo.id}
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary, #6b7280)' }}>
                  Email Status:
                </label>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#dc2626' }}>
                  ❌ Missing
                </div>
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary, #1f2937)' }}>
                Add Email: <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={`Enter ${emailMissingInfo.type.toLowerCase()} Email`}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '2px solid var(--border-color, #d1d5db)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: 'var(--card-bg, #ffffff)',
                  color: 'var(--text-primary, #1f2937)',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#9333ea'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-color, #d1d5db)'}
                disabled={savingEmail}
              />
              <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary, #6b7280)', fontStyle: 'italic' }}>
                <i className="fas fa-info-circle" style={{ marginRight: '4px' }}></i>
                This email will be saved to the database and used for invoice delivery.
              </p>
            </div>
          </div>
          
          <div className="modal-footer" style={{ padding: '16px 24px', display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color, #e5e7eb)' }}>
            <button
              onClick={() => {
                setShowEmailMissingModal(false);
                setNewEmail('');
                setEmailMissingInfo(null);
              }}
              disabled={savingEmail}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--bg-secondary, #f3f4f6)',
                color: 'var(--text-secondary, #6b7280)',
                fontSize: '14px',
                fontWeight: '600',
                cursor: savingEmail ? 'not-allowed' : 'pointer',
                opacity: savingEmail ? 0.6 : 1
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEmailAndGenerateInvoice}
              disabled={savingEmail || !newEmail}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                background: newEmail && !savingEmail ? '#9333ea' : '#9ca3af',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: newEmail && !savingEmail ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {savingEmail ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  Save & Generate Invoice
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Hourly Rate Modal */}
    <HourlyRateModal
      isOpen={showHourlyRateModal}
      employee={currentEmployeeForRate}
      hourlyRate={hourlyRateInput}
      onHourlyRateChange={setHourlyRateInput}
      onSave={handleSaveHourlyRate}
      onCancel={() => {
        setShowHourlyRateModal(false);
        setCurrentEmployeeForRate(null);
        setCurrentTimesheetForRateRetry(null);
        setProvidedVendorForRetry(null);
        setHourlyRateInput('45.00');
      }}
      isSaving={updatingHourlyRate}
    />
  </div>
  );
};

export default TimesheetSummary;
