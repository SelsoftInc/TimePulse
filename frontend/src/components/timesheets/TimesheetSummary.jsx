import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PERMISSIONS } from "../../utils/roles";
import PermissionGuard from "../common/PermissionGuard";
import DataGridFilter from "../common/DataGridFilter";
import Modal from "../common/Modal";
import InvoicePDFPreviewModal from "../common/InvoicePDFPreviewModal";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import { API_BASE } from "../../config/api";
import {
  uploadAndProcessTimesheet,
  transformTimesheetToInvoice,
} from "../../services/engineService";
import "./TimesheetSummary.css";
import "../common/Pagination.css";

const TimesheetSummary = () => {
  const { subdomain } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientType, setClientType] = useState("internal");
  const [filters, setFilters] = useState({
    status: "all",
    dateRange: { from: "", to: "" },
    search: "",
  });
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [invoiceSuccess, setInvoiceSuccess] = useState("");
  const [invoiceError, setInvoiceError] = useState("");
  const [generatingInvoiceId, setGeneratingInvoiceId] = useState(null);
  
  // Invoice modal state
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  // Edit invoice modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editInvoiceData, setEditInvoiceData] = useState(null);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [timesheetFile, setTimesheetFile] = useState(null);
  
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

  // Load data on mount
  useEffect(() => {
    if (user?.tenantId) {
      loadTimesheetData();
    }
  }, [user, loadTimesheetData]);

  // Reload data when page becomes visible (e.g., returning from edit page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.tenantId) {
        console.log('🔄 Page became visible, reloading timesheet data...');
        loadTimesheetData();
      }
    };

    const handleFocus = () => {
      if (user?.tenantId) {
        console.log('🔄 Window focused, reloading timesheet data...');
        loadTimesheetData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, loadTimesheetData]);

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
      [filterKey]: value,
    }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      status: "all",
      dateRange: { from: "", to: "" },
      search: "",
    });
  };

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
      ],
    },
    {
      key: "search",
      label: "Search Week Range",
      type: "text",
      value: filters.search,
      defaultValue: "",
      placeholder: "Search by week range...",
    },
    {
      key: "dateRange",
      label: "Date Range",
      type: "dateRange",
      value: filters.dateRange,
      defaultValue: { from: "", to: "" },
    },
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
  
  // View invoice details modal - Fetch complete invoice data
  const handleViewInvoiceDetails = async (invoiceId) => {
    try {
      console.log('📄 Fetching invoice details for invoice:', invoiceId);
      
      // Fetch complete invoice data with all associations
      const response = await axios.get(
        `${API_BASE}/api/invoices/${invoiceId}?tenantId=${user.tenantId}`
      );
      
      if (response.data.success) {
        const invoiceData = response.data.invoice;
        console.log('✅ Invoice details loaded:', invoiceData);
        console.log('📋 Vendor data:', invoiceData.vendor);
        console.log('👤 Employee data:', invoiceData.employee);
        console.log('📅 Timesheet data:', invoiceData.timesheet);
        
        // Open invoice details modal
        setSelectedInvoice(invoiceData);
        setInvoiceModalOpen(true);
      }
    } catch (error) {
      console.error('❌ Error fetching invoice details:', error);
      showModal({
        type: 'error',
        title: 'Error',
        message: 'Failed to load invoice details. Please try again.'
      });
    }
  };
  
  // Edit invoice - Fetch complete data with all associations
  const handleEditInvoice = async (invoiceId) => {
    try {
      console.log('✏️ Fetching invoice data for editing:', invoiceId);
      
      // Fetch complete invoice data with all associations including employee and vendor
      const response = await axios.get(
        `${API_BASE}/api/invoices/${invoiceId}?tenantId=${user.tenantId}`
      );
      
      if (response.data.success) {
        const invoiceData = response.data.invoice;
        console.log('✅ Invoice data loaded for editing:', invoiceData);
        
        // If employee data is missing, fetch it separately
        if (invoiceData.timesheetId && (!invoiceData.employee || !invoiceData.vendor)) {
          console.log('📡 Fetching additional employee and vendor data...');
          
          try {
            // Fetch timesheet with employee and vendor associations
            const timesheetResponse = await axios.get(
              `${API_BASE}/api/timesheets/${invoiceData.timesheetId}?tenantId=${user.tenantId}`
            );
            
            if (timesheetResponse.data.success && timesheetResponse.data.timesheet) {
              const timesheet = timesheetResponse.data.timesheet;
              console.log('✅ Timesheet data loaded:', timesheet);
              
              // Merge employee and vendor data
              if (timesheet.employee) {
                invoiceData.employee = timesheet.employee;
                
                // If employee has vendor, use it
                if (timesheet.employee.vendor) {
                  invoiceData.vendor = timesheet.employee.vendor;
                }
              }
              
              // Update timesheet reference
              invoiceData.timesheet = timesheet;
            }
          } catch (timesheetError) {
            console.error('⚠️ Error fetching timesheet data:', timesheetError);
          }
        }
        
        // If vendor is still missing, try to fetch from employee directly
        if (invoiceData.employeeId && !invoiceData.vendor) {
          console.log('📡 Fetching vendor from employee record...');
          
          try {
            const employeeResponse = await axios.get(
              `${API_BASE}/api/employees/${invoiceData.employeeId}?tenantId=${user.tenantId}`
            );
            
            if (employeeResponse.data.success && employeeResponse.data.employee) {
              const employee = employeeResponse.data.employee;
              console.log('✅ Employee data loaded:', employee);
              
              if (!invoiceData.employee) {
                invoiceData.employee = employee;
              }
              
              if (employee.vendor) {
                invoiceData.vendor = employee.vendor;
              }
            }
          } catch (employeeError) {
            console.error('⚠️ Error fetching employee data:', employeeError);
          }
        }
        
        console.log('📋 Final invoice data for editing:', invoiceData);
        
        // Set the edit data and open modal
        setEditInvoiceData(invoiceData);
        setInvoiceModalOpen(false); // Close details modal
        setEditModalOpen(true);
      }
    } catch (error) {
      console.error('❌ Error fetching invoice for editing:', error);
      showModal({
        type: 'error',
        title: 'Error',
        message: 'Failed to load invoice for editing. Please try again.'
      });
    }
  };
  
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
      // Invoice exists - show details modal
      handleViewInvoiceDetails(existingInvoice.id);
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
      console.log('📄 Generating invoice for timesheet:', timesheet.id);
      console.log('📋 Timesheet details:', {
        id: timesheet.id,
        employeeId: timesheet.employeeId,
        employeeName: timesheet.employeeName,
        vendorId: timesheet.vendorId,
        vendor: timesheet.vendor,
        clientId: timesheet.clientId,
        client: timesheet.client,
        status: timesheet.status
      });

      // Fetch employee data to get vendor/client information
      let employeeVendorId = timesheet.vendorId;
      let employeeClientId = timesheet.clientId;
      
      if (!employeeVendorId && !employeeClientId && timesheet.employeeId) {
        console.log('🔍 Fetching employee data to get vendor/client info...');
        try {
          const empResponse = await axios.get(
            `${API_BASE}/api/employees/${timesheet.employeeId}?tenantId=${user.tenantId}`
          );
          if (empResponse.data.success) {
            const employeeData = empResponse.data.employee || empResponse.data.data;
            employeeVendorId = employeeData.vendorId;
            employeeClientId = employeeData.clientId;
            console.log('✅ Employee data fetched:', {
              vendorId: employeeVendorId,
              clientId: employeeClientId
            });
          }
        } catch (error) {
          console.error('❌ Error fetching employee data:', error);
        }
      }

      // Pre-validation: Check if employee has vendor or client assigned
      if (!employeeVendorId && !employeeClientId) {
        console.error('❌ Validation failed: No vendor or client assigned');
        setGeneratingInvoiceId(null);
        
        // Close confirmation modal first, then show error
        closeModal();
        setTimeout(() => {
          showModal({
            type: 'error',
            title: 'Vendor/Client Not Assigned',
            message: `Employee "${timesheet.employeeName || 'Unknown'}" must be associated with a vendor or client to generate invoice.\n\nAction Required:\n1. Go to Employees menu\n2. Edit employee: ${timesheet.employeeName || 'Unknown'}\n3. Assign a vendor OR client with email address\n4. Save and try generating invoice again`
          });
        }, 100);
        return;
      }

      // Validate vendor/client has email address
      let vendorClientInfo = null;
      let vendorClientType = '';
      
      if (employeeVendorId) {
        try {
          const vendorResponse = await axios.get(
            `${API_BASE}/api/vendors/${employeeVendorId}?tenantId=${user.tenantId}`
          );
          if (vendorResponse.data.success) {
            vendorClientInfo = vendorResponse.data.vendor || vendorResponse.data.data;
            vendorClientType = 'Vendor';
            console.log('✅ Vendor info fetched:', vendorClientInfo);
          }
        } catch (error) {
          console.error('❌ Error fetching vendor:', error);
        }
      } else if (employeeClientId) {
        try {
          const clientResponse = await axios.get(
            `${API_BASE}/api/clients/${employeeClientId}?tenantId=${user.tenantId}`
          );
          if (clientResponse.data.success) {
            vendorClientInfo = clientResponse.data.client || clientResponse.data.data;
            vendorClientType = 'Client';
            console.log('✅ Client info fetched:', vendorClientInfo);
          }
        } catch (error) {
          console.error('❌ Error fetching client:', error);
        }
      }

      // Check if vendor/client has email
      if (vendorClientInfo && !vendorClientInfo.email) {
        console.error('❌ Validation failed: Vendor/Client email missing');
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
              'Employee': timesheet.employeeName || 'Unknown',
              [`${vendorClientType} Name`]: vendorClientInfo.vendorName || vendorClientInfo.clientName || vendorClientInfo.name || 'Unknown',
              [`${vendorClientType} ID`]: employeeVendorId || employeeClientId,
              'Email Status': '❌ Missing'
            }
          });
        }, 100);
        return;
      }
      
      console.log('✅ Validation passed, proceeding with invoice generation');

      const response = await axios.post(
        `${API_BASE}/api/timesheets/${timesheet.id}/generate-invoice`,
        {
          tenantId: user.tenantId,
          userId: user.id,
        }
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
        address: "123 Business St, City, State 12345",
      };

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
          navigate(`/${subdomain}/invoices/create`, {
            state: {
              invoiceData,
              sourceTimesheet: {
                fileName: file.name,
                processedData: timesheetData,
              },
            },
          });
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
    navigate(`/${subdomain}/timesheets/submit`);
  };

  // Helper function to toggle client type for testing
  const toggleClientType = () => {
    const newClientType = clientType === "internal" ? "external" : "internal";
    setClientType(newClientType);
    localStorage.setItem("userClientType", newClientType);
  };

  if (loading) {
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
                <div className="actions-dropdown" ref={dropdownRef}>
                  {/* Dropdown toggle button */}
                  <button
                    className="dropdown-toggle-btn"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    aria-label="Toggle actions menu"
                  >
                    <em className="icon ni ni-menu"></em> Actions
                  </button>

                  {/* Dropdown menu */}
                  {isOpen && (
                    <ul className="dropdown-menu">
                      {/* Refresh Data - Available to all users */}
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => {
                            loadTimesheetData();
                            setIsOpen(false);
                          }}
                        >
                          <em className="icon ni ni-reload"></em> Refresh Data
                        </button>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                      
                      <PermissionGuard
                        requiredPermission={PERMISSIONS.CREATE_TIMESHEET}
                        fallback={null}
                      >
                        {clientType === "internal" ? (
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                handleNewTimesheet();
                                setIsOpen(false);
                              }}
                            >
                              <em className="icon ni ni-edit"></em> Enter
                              Timesheet
                            </button>
                          </li>
                        ) : (
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                handleNewTimesheet();
                                setIsOpen(false);
                              }}
                            >
                              <em className="icon ni ni-upload"></em> Upload
                              Timesheet
                            </button>
                          </li>
                        )}
                      </PermissionGuard>

                      <PermissionGuard
                        requiredPermission={PERMISSIONS.APPROVE_TIMESHEETS}
                        fallback={null}
                      >
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              navigate(`/${subdomain}/timesheets/approval`);
                              setIsOpen(false);
                            }}
                          >
                            <em className="icon ni ni-check-circle"></em>{" "}
                            Approve Timesheets
                          </button>
                        </li>

                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              navigate(`/${subdomain}/timesheets/to-invoice`);
                              setIsOpen(false);
                            }}
                          >
                            <em className="icon ni ni-file-docs"></em> Convert
                            to Invoice
                          </button>
                        </li>

                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              navigate(`/${subdomain}/timesheets/auto-convert`);
                              setIsOpen(false);
                            }}
                          >
                            <em className="icon ni ni-upload"></em> Test
                            Auto-Convert
                          </button>
                        </li>
                      </PermissionGuard>

                      <PermissionGuard
                        requiredPermission={PERMISSIONS.CREATE_INVOICE}
                        fallback={null}
                      >
                        <li>
                          <label
                            htmlFor="invoiceFileInput"
                            className="dropdown-item file-upload-label"
                            title="Upload timesheet and generate invoice using AI"
                          >
                            <em className="icon ni ni-file-plus"></em>
                            <span>
                              {generatingInvoice
                                ? "Generating..."
                                : "Generate Invoice"}
                            </span>
                          </label>
                          <input
                            type="file"
                            id="invoiceFileInput"
                            accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                            style={{ display: "none" }}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                handleGenerateInvoice(file);
                                setIsOpen(false);
                              }
                            }}
                            disabled={generatingInvoice}
                          />
                        </li>

                        {generatingInvoice && (
                          <li className="dropdown-info">
                            <em className="icon ni ni-loader"></em> Processing
                            timesheet and generating invoice...
                          </li>
                        )}

                        {invoiceSuccess && (
                          <li className="dropdown-success">
                            <em className="icon ni ni-check-circle"></em>{" "}
                            {invoiceSuccess}
                          </li>
                        )}

                        {invoiceError && (
                          <li className="dropdown-error">
                            <em className="icon ni ni-cross-circle"></em>{" "}
                            {invoiceError}
                          </li>
                        )}

                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              navigate(`/${subdomain}/timesheets/to-invoice`);
                              setIsOpen(false);
                            }}
                            title="Convert timesheet documents to invoices using AI"
                          >
                            <em className="icon ni ni-file-text"></em> Convert
                            to Invoice
                          </button>
                        </li>
                      </PermissionGuard>
                    </ul>
                  )}
                </div>
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
                                    navigate(`/${subdomain}/timesheets/submit/${timesheet.id}`);
                                  }}
                                  title="Edit Timesheet"
                                  style={{minWidth: '55px', padding: '4px 8px', fontSize: '13px'}}
                                >
                                  Edit
                                </button>

                                {/* Invoice Button - Show for Approved status */}
                                {timesheet.status === "Approved" && (
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
                                      'Invoice'
                                    )}
                                  </button>
                                )}

                                {/* View Button - Always visible */}
                                <button
                                  className="btn btn-outline-info btn-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/${subdomain}/timesheets/submit/${timesheet.id}`);
                                  }}
                                  title="View Details"
                                  style={{minWidth: '55px', padding: '4px 8px', fontSize: '13px'}}
                                >
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
                        // Try multiple paths to find vendor name
                        const vendorName = selectedInvoice.vendor?.name || 
                                          selectedInvoice.timesheet?.employee?.vendor?.name || 
                                          selectedInvoice.employee?.vendor?.name;
                        console.log('🏢 Displaying vendor name:', vendorName);
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
                        console.log('📧 Displaying vendor email:', vendorEmail);
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
                        console.log('👤 Displaying employee name:', employeeName);
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
                        console.log('📧 Displaying employee email:', employeeEmail);
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
              <button 
                className="btn btn-primary"
                onClick={() => handleEditInvoice(selectedInvoice.id)}
                style={{backgroundColor: '#6366f1'}}
              >
                <em className="icon ni ni-edit"></em>
                Edit Invoice
              </button>
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
      
      {/* Edit Invoice Modal */}
      {editModalOpen && editInvoiceData && (
        <div className="invoice-modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="invoice-modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '1100px'}}>
            <div className="invoice-modal-header">
              <div className="invoice-modal-title">
                <em className="icon ni ni-edit" style={{fontSize: '24px', color: '#ffffff'}}></em>
                <h3>Edit Invoice</h3>
              </div>
              <button 
                className="invoice-modal-close"
                onClick={() => setEditModalOpen(false)}
                title="Close"
              >
                <em className="icon ni ni-cross"></em>
              </button>
            </div>
            
            <div className="edit-invoice-modal-body">
              {/* Company Logo and Timesheet Upload Section */}
              <div className="invoice-upload-section">
                {/* Company Logo Column */}
                <div className="upload-column">
                  <div className="upload-column-title">
                    <em className="icon ni ni-building"></em>
                    Company Logo
                  </div>
                  <div className="upload-box">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setCompanyLogo(file);
                        }
                      }}
                    />
                    {!companyLogo ? (
                      <>
                        <em className="upload-icon icon ni ni-upload-cloud"></em>
                        <div className="upload-text">Upload Company Logo</div>
                        <div className="upload-hint">PNG, JPG, SVG (Max 5MB)</div>
                      </>
                    ) : (
                      <div className="upload-preview">
                        <img 
                          src={URL.createObjectURL(companyLogo)} 
                          alt="Company Logo Preview" 
                        />
                        <div className="upload-preview-info">
                          <div className="upload-preview-name">{companyLogo.name}</div>
                          <div className="upload-preview-size">
                            {(companyLogo.size / 1024).toFixed(2)} KB
                          </div>
                        </div>
                        <button 
                          className="upload-preview-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCompanyLogo(null);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timesheet Upload Column */}
                <div className="upload-column">
                  <div className="upload-column-title">
                    <em className="icon ni ni-file-docs"></em>
                    Timesheet Document
                  </div>
                  <div className="upload-box">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xlsx,.xls"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setTimesheetFile(file);
                        }
                      }}
                    />
                    {!timesheetFile ? (
                      <>
                        <em className="upload-icon icon ni ni-upload-cloud"></em>
                        <div className="upload-text">Upload Timesheet</div>
                        <div className="upload-hint">PDF, DOC, DOCX, XLS, XLSX (Max 10MB)</div>
                      </>
                    ) : (
                      <div className="upload-preview">
                        <em className="icon ni ni-file-text" style={{fontSize: '48px', color: '#3b82f6'}}></em>
                        <div className="upload-preview-info">
                          <div className="upload-preview-name">{timesheetFile.name}</div>
                          <div className="upload-preview-size">
                            {(timesheetFile.size / 1024).toFixed(2)} KB
                          </div>
                        </div>
                        <button 
                          className="upload-preview-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTimesheetFile(null);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Invoice Edit Form */}
              <div className="invoice-edit-form">
                {/* Basic Information */}
                <div className="form-section">
                  <div className="form-section-title">
                    <em className="icon ni ni-file-text"></em>
                    Invoice Information
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Invoice Number</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editInvoiceData.invoiceNumber || ''}
                        onChange={(e) => setEditInvoiceData({...editInvoiceData, invoiceNumber: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Invoice Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={editInvoiceData.invoiceDate ? new Date(editInvoiceData.invoiceDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => setEditInvoiceData({...editInvoiceData, invoiceDate: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Due Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={editInvoiceData.dueDate ? new Date(editInvoiceData.dueDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => setEditInvoiceData({...editInvoiceData, dueDate: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Total Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        value={editInvoiceData.totalAmount || editInvoiceData.total || ''}
                        onChange={(e) => setEditInvoiceData({...editInvoiceData, totalAmount: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Vendor & Employee Information */}
                <div className="form-section">
                  <div className="form-section-title">
                    <em className="icon ni ni-users"></em>
                    Vendor & Employee Details
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Vendor Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={
                          editInvoiceData.vendor?.name || 
                          editInvoiceData.timesheet?.employee?.vendor?.name || 
                          editInvoiceData.employee?.vendor?.name || 
                          'N/A'
                        }
                        onChange={(e) => setEditInvoiceData({
                          ...editInvoiceData,
                          vendor: {...(editInvoiceData.vendor || {}), name: e.target.value}
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Vendor Contact</label>
                      <input
                        type="text"
                        className="form-input"
                        value={
                          editInvoiceData.vendor?.email || 
                          editInvoiceData.vendor?.contactEmail ||
                          editInvoiceData.timesheet?.employee?.vendor?.email || 
                          editInvoiceData.timesheet?.employee?.vendor?.contactEmail ||
                          editInvoiceData.employee?.vendor?.email ||
                          editInvoiceData.employee?.vendor?.contactEmail ||
                          'N/A'
                        }
                        onChange={(e) => setEditInvoiceData({
                          ...editInvoiceData,
                          vendor: {...(editInvoiceData.vendor || {}), email: e.target.value, contactEmail: e.target.value}
                        })}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Employee Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={
                          editInvoiceData.employee 
                            ? `${editInvoiceData.employee.firstName || ''} ${editInvoiceData.employee.lastName || ''}`.trim()
                            : editInvoiceData.timesheet?.employee
                            ? `${editInvoiceData.timesheet.employee.firstName || ''} ${editInvoiceData.timesheet.employee.lastName || ''}`.trim()
                            : 'N/A'
                        }
                        readOnly
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Employee Email</label>
                      <input
                        type="email"
                        className="form-input"
                        value={
                          editInvoiceData.employee?.email || 
                          editInvoiceData.timesheet?.employee?.email || 
                          'N/A'
                        }
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                {editInvoiceData.lineItems && editInvoiceData.lineItems.length > 0 && (
                  <div className="form-section">
                    <div className="form-section-title">
                      <em className="icon ni ni-list"></em>
                      Line Items
                    </div>
                    <table className="line-items-edit-table">
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th>Hours/Qty</th>
                          <th>Rate</th>
                          <th>Amount</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editInvoiceData.lineItems.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <input
                                type="text"
                                value={item.description || ''}
                                onChange={(e) => {
                                  const newItems = [...editInvoiceData.lineItems];
                                  newItems[index].description = e.target.value;
                                  setEditInvoiceData({...editInvoiceData, lineItems: newItems});
                                }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                value={item.hours || item.quantity || 0}
                                onChange={(e) => {
                                  const newItems = [...editInvoiceData.lineItems];
                                  const newHours = parseFloat(e.target.value) || 0;
                                  newItems[index].hours = newHours;
                                  newItems[index].quantity = newHours;
                                  newItems[index].hoursWorked = newHours;
                                  const rate = parseFloat(newItems[index].rate || newItems[index].hourlyRate || 0);
                                  const calculatedTotal = newHours * rate;
                                  newItems[index].amount = calculatedTotal;
                                  newItems[index].total = calculatedTotal;
                                  setEditInvoiceData({...editInvoiceData, lineItems: newItems});
                                }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                value={item.rate || item.hourlyRate || 0}
                                onChange={(e) => {
                                  const newItems = [...editInvoiceData.lineItems];
                                  const newRate = parseFloat(e.target.value) || 0;
                                  newItems[index].rate = newRate;
                                  newItems[index].hourlyRate = newRate;
                                  const hours = parseFloat(newItems[index].hours || newItems[index].quantity || newItems[index].hoursWorked || 0);
                                  const calculatedTotal = hours * newRate;
                                  newItems[index].amount = calculatedTotal;
                                  newItems[index].total = calculatedTotal;
                                  setEditInvoiceData({...editInvoiceData, lineItems: newItems});
                                }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                value={item.amount || 0}
                                readOnly
                              />
                            </td>
                            <td>
                              <button
                                className="remove-line-item-btn"
                                onClick={() => {
                                  const newItems = editInvoiceData.lineItems.filter((_, i) => i !== index);
                                  setEditInvoiceData({...editInvoiceData, lineItems: newItems});
                                }}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button
                      className="add-line-item-btn"
                      onClick={() => {
                        const newItems = [
                          ...editInvoiceData.lineItems,
                          { description: '', hours: 0, rate: 0, amount: 0 }
                        ];
                        setEditInvoiceData({...editInvoiceData, lineItems: newItems});
                      }}
                    >
                      <em className="icon ni ni-plus"></em>
                      Add Line Item
                    </button>
                  </div>
                )}

                {/* Notes */}
                <div className="form-section">
                  <div className="form-section-title">
                    <em className="icon ni ni-notes"></em>
                    Notes
                  </div>
                  <div className="form-group">
                    <textarea
                      className="form-textarea"
                      placeholder="Add any additional notes or comments..."
                      value={editInvoiceData.notes || ''}
                      onChange={(e) => setEditInvoiceData({...editInvoiceData, notes: e.target.value})}
                    />
                  </div>
                </div>

                {/* PDF Actions */}
                {/* <div className="pdf-actions">
                  <button 
                    className="btn-preview-pdf"
                    onClick={() => {
                      console.log('Preview PDF clicked, editInvoiceData:', editInvoiceData);
                      
                      // Normalize line items data before passing to PDF modal
                      const normalizedData = {
                        ...editInvoiceData,
                        // Add vendor/client info
                        vendorName: editInvoiceData.vendor?.name || editInvoiceData.timesheet?.employee?.vendor?.name || 'Vendor Name',
                        clientName: editInvoiceData.client?.name || 'Client Name',
                        // Normalize line items
                        lineItems: (editInvoiceData.lineItems || []).map(item => {
                          const hours = parseFloat(item.hours || item.hoursWorked || item.quantity || 0);
                          const rate = parseFloat(item.rate || item.hourlyRate || 0);
                          const total = parseFloat(item.amount || item.total || (hours * rate) || 0);
                          
                          return {
                            // For PDF display
                            employeeName: item.employeeName || item.employee?.name || item.description || 'Employee',
                            position: item.position || item.title || 'Position',
                            hoursWorked: hours,
                            hourlyRate: rate,
                            total: total,
                            // Keep original fields
                            description: item.description || item.employeeName || 'Service',
                            hours: hours,
                            rate: rate,
                            amount: total,
                            quantity: hours
                          };
                        })
                      };
                      
                      console.log('Normalized data for PDF:', normalizedData);
                      setInvoiceForPDF(normalizedData);
                      setPdfPreviewOpen(true);
                    }}
                  >
                    <em className="icon ni ni-eye"></em>
                    Preview PDF
                  </button>
                  <button 
                    className="btn-download-pdf"
                    onClick={() => {
                      console.log('Download PDF clicked, editInvoiceData:', editInvoiceData);
                      
                      // Normalize line items data before passing to PDF modal
                      const normalizedData = {
                        ...editInvoiceData,
                        // Add vendor/client info
                        vendorName: editInvoiceData.vendor?.name || editInvoiceData.timesheet?.employee?.vendor?.name || 'Vendor Name',
                        clientName: editInvoiceData.client?.name || 'Client Name',
                        // Normalize line items
                        lineItems: (editInvoiceData.lineItems || []).map(item => {
                          const hours = parseFloat(item.hours || item.hoursWorked || item.quantity || 0);
                          const rate = parseFloat(item.rate || item.hourlyRate || 0);
                          const total = parseFloat(item.amount || item.total || (hours * rate) || 0);
                          
                          return {
                            // For PDF display
                            employeeName: item.employeeName || item.employee?.name || item.description || 'Employee',
                            position: item.position || item.title || 'Position',
                            hoursWorked: hours,
                            hourlyRate: rate,
                            total: total,
                            // Keep original fields
                            description: item.description || item.employeeName || 'Service',
                            hours: hours,
                            rate: rate,
                            amount: total,
                            quantity: hours
                          };
                        })
                      };
                      
                      console.log('Normalized data for PDF:', normalizedData);
                      setInvoiceForPDF(normalizedData);
                      setPdfPreviewOpen(true);
                    }}
                  >
                    <em className="icon ni ni-download"></em>
                    Download PDF
                  </button>
                </div> */}
              </div>
            </div>
            
            <div className="invoice-modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setEditModalOpen(false)}
              >
                <em className="icon ni ni-cross"></em>
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    const tenantId = user?.tenantId;
                    const token = localStorage.getItem('token');
                    
                    if (!tenantId) {
                      throw new Error('Tenant ID not found');
                    }
                    
                    console.log('💾 Saving invoice changes...', editInvoiceData);
                    
                    // Prepare the invoice data for API
                    const invoiceUpdateData = {
                      invoiceNumber: editInvoiceData.invoiceNumber,
                      invoiceDate: editInvoiceData.invoiceDate,
                      dueDate: editInvoiceData.dueDate,
                      totalAmount: editInvoiceData.totalAmount || editInvoiceData.total,
                      status: editInvoiceData.status || 'pending',
                      notes: editInvoiceData.notes,
                      lineItems: editInvoiceData.lineItems.map(item => ({
                        description: item.description,
                        hours: parseFloat(item.hours || item.quantity || 0),
                        rate: parseFloat(item.rate || item.hourlyRate || 0),
                        amount: parseFloat(item.amount || item.total || 0)
                      })),
                      vendor: editInvoiceData.vendor,
                      tenantId: tenantId
                    };
                    
                    console.log('📤 Sending update to API:', invoiceUpdateData);
                    
                    // Call API to update invoice
                    const response = await axios.put(
                      `${API_BASE}/api/invoices/${editInvoiceData.id}?tenantId=${tenantId}`,
                      invoiceUpdateData,
                      {
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        }
                      }
                    );
                    
                    console.log('✅ Invoice updated successfully:', response.data);
                    
                    // Update the selectedInvoice with the response data
                    const updatedInvoice = response.data.invoice || {
                      ...selectedInvoice,
                      ...editInvoiceData,
                      lineItems: editInvoiceData.lineItems
                    };
                    setSelectedInvoice(updatedInvoice);
                    
                    // Close edit modal
                    setEditModalOpen(false);
                    
                    // Reload all timesheet data from API to refresh the screen
                    console.log('🔄 Reloading timesheet data...');
                    await loadTimesheetData();
                    
                    // Show success modal with invoice details
                    showModal({
                      type: 'success',
                      title: 'Invoice Updated Successfully!',
                      message: `${updatedInvoice.invoiceNumber || editInvoiceData.invoiceNumber} has been updated.`,
                      details: {
                        'Invoice Number': updatedInvoice.invoiceNumber || editInvoiceData.invoiceNumber,
                        'Amount': `$${parseFloat(updatedInvoice.totalAmount || editInvoiceData.totalAmount || editInvoiceData.total || 0).toFixed(2)}`,
                        'Status': (updatedInvoice.status || editInvoiceData.status || 'active').toUpperCase()
                      }
                    });
                  } catch (error) {
                    console.error('❌ Error updating invoice:', error);
                    console.error('Error details:', error.response?.data);
                    
                    showModal({
                      type: 'error',
                      title: 'Update Failed',
                      message: error.response?.data?.message || 'Failed to update invoice. Please try again.'
                    });
                  }
                }}
              >
                <em className="icon ni ni-save"></em>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* PDF Preview Modal */}
      {pdfPreviewOpen && invoiceForPDF && (
        <InvoicePDFPreviewModal
          invoice={invoiceForPDF}
          onClose={() => {
            setPdfPreviewOpen(false);
            setInvoiceForPDF(null);
          }}
        />
      )}
    </div>
  );
};

export default TimesheetSummary;
