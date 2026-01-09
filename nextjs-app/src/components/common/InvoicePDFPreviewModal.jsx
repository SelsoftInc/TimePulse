'use client';

import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE } from '@/config/api';
import './InvoicePDFPreviewModal.css';

const InvoicePDFPreviewModal = ({ invoice, onClose, onUpdate, show }) => {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [companyLogo, setCompanyLogo] = useState(invoice?.companyLogo || null);
  const [logoPreview, setLogoPreview] = useState(invoice?.companyLogo || null);
  const [timesheetFile, setTimesheetFile] = useState(invoice?.timesheetFile || null);
  const [timesheetFileName, setTimesheetFileName] = useState(invoice?.timesheetFileName || null);
  
  // Safe number formatting to prevent toFixed errors
  const formatNumber = (value, decimals = 2) => {
    const num = parseFloat(value) || 0;
    return num.toFixed(decimals);
  };
  
  // Safe string conversion to prevent object-to-text errors
  const safeString = (value, defaultValue = 'N/A') => {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'object') return defaultValue;
    return String(value);
  };
  
  // Debug: Log component lifecycle
  useEffect(() => {
    console.log('🎬 InvoicePDFPreviewModal MOUNTED');
    return () => {
      console.log('🔚 InvoicePDFPreviewModal UNMOUNTED');
    };
  }, []);
  
  
  const [formData, setFormData] = useState(() => {
    // Calculate invoice period from timesheet week data
    let calculatedStartDate = null;
    let calculatedEndDate = null;
    
    console.log('📊 Invoice data for PDF:', invoice);
    
    // Priority 1: Parse week string from invoice (e.g., "Nov 09 - Nov 15")
    if (invoice?.week && typeof invoice.week === 'string') {
      try {
        // Parse "Nov 09 - Nov 15" or "Nov 02 - Nov 08" format
        const weekParts = invoice.week.split(' - ');
        if (weekParts.length === 2) {
          const year = invoice?.year || new Date().getFullYear();
          const startPart = weekParts[0].trim(); // "Nov 09"
          const endPart = weekParts[1].trim();   // "Nov 15"
          
          // Parse dates with year
          const startDate = new Date(`${startPart}, ${year}`);
          const endDate = new Date(`${endPart}, ${year}`);
          
          if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            calculatedStartDate = startDate.toISOString().split('T')[0];
            calculatedEndDate = endDate.toISOString().split('T')[0];
            console.log('✅ Parsed week from invoice.week:', calculatedStartDate, '-', calculatedEndDate);
          }
        }
      } catch (error) {
        console.error('Error parsing week string:', error);
      }
    }
    
    // Priority 2: Use weekStart/weekEnd if available
    if (!calculatedStartDate && invoice?.weekStart && invoice?.weekEnd) {
      calculatedStartDate = invoice.weekStart;
      calculatedEndDate = invoice.weekEnd;
      console.log('✅ Using weekStart/weekEnd:', calculatedStartDate, '-', calculatedEndDate);
    }
    
    // Priority 3: Use timesheet object if available
    if (!calculatedStartDate && invoice?.timesheet?.weekStart && invoice?.timesheet?.weekEnd) {
      calculatedStartDate = invoice.timesheet.weekStart;
      calculatedEndDate = invoice.timesheet.weekEnd;
      console.log('✅ Using timesheet.weekStart/weekEnd:', calculatedStartDate, '-', calculatedEndDate);
    }
    
    // Priority 4: Calculate from line items dates
    if (!calculatedStartDate && invoice?.lineItems && invoice.lineItems.length > 0) {
      const dates = invoice.lineItems
        .map(item => item.date || item.workDate || item.startDate)
        .filter(date => date)
        .map(date => new Date(date));
      
      if (dates.length > 0) {
        calculatedStartDate = new Date(Math.min(...dates)).toISOString().split('T')[0];
        calculatedEndDate = new Date(Math.max(...dates)).toISOString().split('T')[0];
        console.log('✅ Calculated from line items:', calculatedStartDate, '-', calculatedEndDate);
      }
    }
    
    // Fallback: Use invoice dates or current week
    const startDate = calculatedStartDate || invoice?.startDate || 
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endDate = calculatedEndDate || invoice?.endDate || 
      new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
    
    console.log('📅 Final invoice period:', startDate, '-', endDate);
    
    return {
      // Staffing Company (Selsoft Inc. - Our Company)
      companyName: invoice?.companyName || 'Selsoft Inc.',
      companyAddress: invoice?.companyAddress || '123 Business Street, Suite 100',
      companyCity: invoice?.companyCity || 'Dallas, TX 75201',
      companyEmail: invoice?.companyEmail || 'billing@selsoft.com',
      companyPhone: invoice?.companyPhone || '(214) 555-0100',
      companyTaxId: invoice?.taxId || 'XX-XXXXXXX',
      companyWebsite: invoice?.companyWebsite || 'www.selsoft.com',
      
      // Invoice Details
      invoiceNumber: invoice?.invoiceNumber || `INV-2025-${String(invoice?.id || '0001').padStart(4, '0')}`,
      invoiceDate: invoice?.issueDate || invoice?.invoiceDate || new Date().toISOString().split('T')[0],
      dueDate: invoice?.dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentTerms: invoice?.paymentTerms || 'Net 15',
      
      // Billed To (Vendor/Client paying the invoice)
      billToName: invoice?.clientName || invoice?.vendorName || invoice?.client?.clientName || 'Acme Corporation',
      billToAttn: 'Accounts Payable',
      billToAddress: invoice?.client?.address || invoice?.vendorAddress || invoice?.billToAddress || '456 Client Avenue',
      billToCity: invoice?.client?.city || invoice?.vendorCity || invoice?.billToCity || 'Dallas, TX 75202',
      billToEmail: invoice?.client?.email || invoice?.vendorEmail || invoice?.billToEmail || 'ap@acmecorp.com',
      
      // Project Details
      projectName: invoice?.projectName || 'Contract Staffing',
      projectDescription: invoice?.projectDescription || 'Professional Services',
      engagementDetails: invoice?.engagementDetails || `${invoice?.employeeName || 'Employee'} working onsite for ${invoice?.clientName || 'Client'}`,
      
      // Invoice Duration - calculated from actual timesheet dates
      invoiceDurationFrom: startDate,
      invoiceDurationTo: endDate,
      
      // Line Items - Prefilled with invoice data
      lineItems: (() => {
        console.log('🔧 Initializing lineItems from invoice:', invoice);
        console.log('📦 Invoice lineItems field:', invoice?.lineItems);
        console.log('💰 Invoice totals:', {
          totalHours: invoice?.totalHours,
          hours: invoice?.hours,
          total: invoice?.total,
          totalAmount: invoice?.totalAmount,
          subtotal: invoice?.subtotal
        });
        
        // Parse lineItems if it's a string or ensure it's an array
        let items = invoice?.lineItems;
        
        // If lineItems is a string, try to parse it
        if (typeof items === 'string') {
          try {
            items = JSON.parse(items);
            console.log('✅ Parsed lineItems from string:', items);
          } catch (e) {
            console.error('❌ Failed to parse lineItems:', e);
            items = null;
          }
        }
        
        // If items is an array, map it
        if (Array.isArray(items) && items.length > 0) {
          console.log('📋 Processing', items.length, 'line items from array');
          const processedItems = items.map((item, idx) => {
            // Extract hours from multiple possible fields
            const hours = parseFloat(
              item.hoursWorked || 
              item.hours || 
              item.quantity || 
              item.totalHours || 
              0
            );
            
            // Extract rate from multiple possible fields
            const rate = parseFloat(
              item.hourlyRate || 
              item.rate || 
              item.unitPrice || 
              item.billRate || 
              invoice?.hourlyRate || 
              45.00
            );
            
            // Calculate total if not provided
            const calculatedTotal = hours * rate;
            const total = parseFloat(
              item.total || 
              item.amount || 
              calculatedTotal || 
              0
            );
            
            console.log(`  📊 Item ${idx + 1}:`, { 
              employeeName: item.employeeName,
              hours, 
              rate, 
              total,
              rawItem: item 
            });
            
            return {
              employeeName: item.employeeName || item.employee || invoice?.employeeName || 'Employee Name',
              role: item.role || item.position || invoice?.position || 'Software Engineer',
              description: item.description || `${startDate} to ${endDate}`,
              hoursWorked: hours,
              hourlyRate: rate,
              total: total
            };
          });
          
          console.log('✅ Processed lineItems:', processedItems);
          return processedItems;
        }
        
        // Fallback: create default line item from invoice data
        console.log('⚠️ No lineItems array, creating fallback from invoice data');
        const hours = parseFloat(
          invoice?.totalHours || 
          invoice?.hours || 
          0
        );
        const rate = parseFloat(
          invoice?.hourlyRate || 
          invoice?.rate || 
          45.00
        );
        const calculatedTotal = hours * rate;
        const total = parseFloat(
          invoice?.total || 
          invoice?.totalAmount || 
          invoice?.amount || 
          invoice?.subtotal ||
          calculatedTotal || 
          0
        );
        
        console.log('📊 Fallback line item:', { hours, rate, total, calculatedTotal });
        
        return [
          {
            employeeName: invoice?.employeeName || 'Employee Name',
            role: invoice?.role || invoice?.position || 'Software Engineer',
            description: `${startDate} to ${endDate}`,
            hoursWorked: hours,
            hourlyRate: rate,
            total: total
          }
        ];
      })(),
      
      // Payment Details
      bankName: invoice?.bankName || 'Chase Bank',
      accountName: invoice?.accountName || 'Selsoft Inc.',
      accountNumber: invoice?.accountNumber || 'XXXX1234',
      routingNumber: invoice?.routingNumber || 'XXXXXXXX',
      swiftCode: invoice?.swiftCode || 'CHASUS33',
      paymentMethod: invoice?.paymentMethod || 'ACH / Wire Transfer',
      
      // Tax
      salesTax: 0,
      taxExempt: true,
      taxNote: 'Exempt (Professional Services)'
    };
  });

  // Fetch employee data from backend
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoading(true);
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        const tenantId = userInfo.tenantId || localStorage.getItem('tenantId');
        const token = localStorage.getItem('token');
        
        
        console.log('🔍 Fetching employee data for invoice:', {
          id: invoice?.id,
          clientName: invoice?.clientName,
          month: invoice?.month,
          year: invoice?.year,
          totalHours: invoice?.totalHours,
          employeeName: invoice?.employeeName
        });
        
        // Use new API endpoint to fetch employee details for invoice
        if (invoice?.id) {
          try {
            const response = await fetch(
              `${API_BASE}/api/invoices/${invoice.id}/employees?tenantId=${tenantId}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            console.log('📡 Employee API response status:', response.status);
            
            if (response.ok) {
              const data = await response.json();
              console.log('✅ Employee data from API:', data);
              
              if (data.success && data.lineItems && data.lineItems.length > 0) {
                const processedItems = data.lineItems.map(item => ({
                  employeeName: item.employeeName || invoice?.employeeName || 'Employee Name',
                  description: item.description || `${invoice?.month || 'Period'} ${invoice?.year || new Date().getFullYear()}`,
                  hoursWorked: parseFloat(item.hours || item.hoursWorked || 0),
                  hourlyRate: parseFloat(item.rate || item.hourlyRate || 45.00),
                  total: parseFloat(item.amount || item.total || 0)
                }));
                
                // Extract vendor/client details if available in response
                const updateData = {
                  lineItems: processedItems
                };
                
                // Extract vendor/client details if available
                if (data.invoice?.client) {
                  updateData.billToName = data.invoice.client.clientName || invoice?.billToName || '';
                  updateData.billToAddress = data.invoice.client.address || invoice?.billToAddress || '';
                  updateData.billToCity = data.invoice.client.city || invoice?.billToCity || '';
                  updateData.billToEmail = data.invoice.client.email || invoice?.billToEmail || '';
                } else if (data.client) {
                  updateData.billToName = data.client.clientName || invoice?.billToName || '';
                  updateData.billToAddress = data.client.address || invoice?.billToAddress || '';
                  updateData.billToCity = data.client.city || invoice?.billToCity || '';
                  updateData.billToEmail = data.client.email || invoice?.billToEmail || '';
                }
                
                setFormData(prev => ({
                  ...prev,
                  ...updateData
                }));
                setEmployees(processedItems);
                setLoading(false);
                return;
              } else if (data.success && data.employee) {
                // Single employee data
                const employeeItem = {
                  employeeName: data.employee.fullName || `${data.employee.firstName || ''} ${data.employee.lastName || ''}`.trim() || invoice?.employeeName || 'Employee Name',
                  description: `${invoice?.month || 'Period'} ${invoice?.year || new Date().getFullYear()}`,
                  hoursWorked: parseFloat(invoice.hours || 0),
                  hourlyRate: parseFloat(data.employee.hourlyRate || 45.00),
                  total: parseFloat(invoice.totalAmount || invoice.total || 0)
                };
                
                // Extract vendor/client details if available
                const updateData = {
                  lineItems: [employeeItem]
                };
                
                if (data.invoice?.client) {
                  updateData.billToName = data.invoice.client.clientName || invoice?.billToName || '';
                  updateData.billToAddress = data.invoice.client.address || invoice?.billToAddress || '';
                  updateData.billToCity = data.invoice.client.city || invoice?.billToCity || '';
                  updateData.billToEmail = data.invoice.client.email || invoice?.billToEmail || '';
                } else if (data.client) {
                  updateData.billToName = data.client.clientName || invoice?.billToName || '';
                  updateData.billToAddress = data.client.address || invoice?.billToAddress || '';
                  updateData.billToCity = data.client.city || invoice?.billToCity || '';
                  updateData.billToEmail = data.client.email || invoice?.billToEmail || '';
                }
                
                setFormData(prev => ({
                  ...prev,
                  ...updateData
                }));
                setEmployees([employeeItem]);
                setLoading(false);
                return;
              }
            }
          } catch (err) {
            console.error('❌ Error fetching employee data from new API:', err);
          }
        } else {
          console.log('⚠️ No invoice ID available, skipping employee API call');
        }
        
        // Fallback: try to use lineItems from invoice if available
        let parsedLineItems = invoice?.lineItems;
        
        // Parse lineItems if it's a string
        if (typeof parsedLineItems === 'string') {
          try {
            parsedLineItems = JSON.parse(parsedLineItems);
          } catch (e) {
            console.error('Failed to parse lineItems in useEffect:', e);
            parsedLineItems = null;
          }
        }
        
        if (parsedLineItems && Array.isArray(parsedLineItems) && parsedLineItems.length > 0) {
          console.log('Using invoice lineItems:', parsedLineItems);
          
          const processedItems = parsedLineItems.map(item => ({
            employeeName: item.employeeName || invoice?.employeeName || 'Employee Name',
            description: item.description || `${invoice?.month || 'Period'} ${invoice?.year || new Date().getFullYear()}`,
            hoursWorked: parseFloat(item.hours || item.hoursWorked || 0),
            hourlyRate: parseFloat(item.rate || item.hourlyRate || 45.00),
            total: parseFloat(item.amount || item.total || 0)
          }));
          
          setFormData(prev => ({
            ...prev,
            lineItems: processedItems
          }));
          setEmployees(processedItems);
          setLoading(false);
          return;
        }
        
        // If no lineItems in invoice, fetch from timesheets API
        const invoiceMonth = invoice?.month || new Date().toLocaleDateString('en-US', { month: 'long' });
        const invoiceYear = invoice?.year || new Date().getFullYear();
        const clientName = invoice?.clientName;
        
        // Convert month name to number
        const monthMap = {
          'January': 1, 'February': 2, 'March': 3, 'April': 4,
          'May': 5, 'June': 6, 'July': 7, 'August': 8,
          'September': 9, 'October': 10, 'November': 11, 'December': 12
        };
        const monthNum = monthMap[invoiceMonth] || new Date().getMonth() + 1;
        
        console.log(`📅 Fetching timesheets for ${invoiceMonth} ${invoiceYear} (month: ${monthNum}) for client: ${clientName}`);
        console.log('🔗 Timesheet API URL:', `${API_BASE}/timesheets?tenantId=${tenantId}&month=${monthNum}&year=${invoiceYear}`);
        
        const response = await fetch(
          `${API_BASE}/timesheets?tenantId=${tenantId}&month=${monthNum}&year=${invoiceYear}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Timesheets response:', data);
          const timesheets = data.timesheets || data.data || [];
          console.log(`📊 Total timesheets fetched: ${timesheets.length}`);
          
          // Filter timesheets by client name if available
          const filteredTimesheets = clientName 
            ? timesheets.filter(ts => 
                ts.clientName === clientName || 
                ts.client?.name === clientName ||
                ts.client?.clientName === clientName
              )
            : timesheets;
          
          console.log(`🔍 Filtered ${filteredTimesheets.length} timesheets for client: ${clientName}`);
          
          if (filteredTimesheets.length > 0) {
            console.log('📋 Sample timesheet data:', filteredTimesheets[0]);
          }
          
          // Transform timesheet data to line items with employee info
          const lineItems = filteredTimesheets.map(ts => ({
            employeeName: ts.employeeName || `${ts.employee?.firstName || ''} ${ts.employee?.lastName || ''}`.trim() || ts.employee?.name || 'Employee Name',
            position: ts.employee?.title || ts.employee?.position || ts.employee?.department || ts.position || 'Position',
            hoursWorked: parseFloat(ts.totalHours || ts.hours || 0),
            hourlyRate: parseFloat(ts.employee?.hourlyRate || ts.hourlyRate || ts.rate || 45.00),
            total: (parseFloat(ts.totalHours || ts.hours || 0)) * (parseFloat(ts.employee?.hourlyRate || ts.hourlyRate || ts.rate || 45.00))
          }));
          
          console.log('✨ Processed line items:', lineItems);
          console.log(`👥 Found ${lineItems.length} employees with data`);
          
          // Update form data with fetched employee data
          if (lineItems.length > 0) {
            setFormData(prev => ({
              ...prev,
              lineItems: lineItems
            }));
            setEmployees(lineItems);
            setLoading(false);
            return;
          }
        } else {
          const errorText = await response.text();
          console.error('❌ Failed to fetch timesheets:', response.status, errorText);
        }
        
        // Final fallback: Create a default line item from invoice data
        if (employees.length === 0) {
          console.warn('⚠️ Creating default line item from invoice data (no employee data found)');
          console.log('📄 Invoice data:', invoice);
          const hours = parseFloat(invoice?.totalHours || invoice?.hours || 0);
          const amount = parseFloat(invoice?.amount || invoice?.totalAmount || 0);
          const rate = hours > 0 ? amount / hours : 45.00;
          
          const defaultItem = {
            employeeName: invoice?.employeeName || 'Employee Name',
            description: `${invoice?.month || 'Period'} ${invoice?.year || new Date().getFullYear()} - ${invoice?.clientName || 'Client'}`,
            hoursWorked: hours,
            hourlyRate: rate,
            total: amount
          };
          
          console.log('Created default line item:', defaultItem);
          
          setFormData(prev => ({
            ...prev,
            lineItems: [defaultItem]
          }));
          setEmployees([defaultItem]);
        }
      } catch (error) {
        console.error('Error fetching employee data:', error);
        
        // Create fallback line item even on error
        const hours = parseFloat(invoice?.totalHours || invoice?.hours || 0);
        const amount = parseFloat(invoice?.amount || invoice?.totalAmount || 0);
        const rate = hours > 0 ? amount / hours : 45.00;
        
        const defaultItem = {
          employeeName: invoice?.employeeName || 'Employee Name',
          description: `${invoice?.month || 'Period'} ${invoice?.year || new Date().getFullYear()} - ${invoice?.clientName || 'Client'}`,
          hoursWorked: hours,
          hourlyRate: rate,
          total: amount
        };
        
        setFormData(prev => ({
          ...prev,
          lineItems: [defaultItem]
        }));
        setEmployees([defaultItem]);
      } finally {
        setLoading(false);
      }
    };
    
    if (invoice) {
      fetchEmployeeData();
    }
  }, [invoice]);

  // Calculate totals
  const calculateSubtotal = () => {
    return formData.lineItems.reduce((sum, item) => {
      const hours = parseFloat(item.hoursWorked || item.hours || item.quantity || 0);
      const rate = parseFloat(item.hourlyRate || item.rate || 0);
      return sum + (hours * rate);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal + (formData.taxExempt ? 0 : formData.salesTax);
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle line item changes
  const handleLineItemChange = (index, field, value) => {
    const newLineItems = [...formData.lineItems];
    newLineItems[index] = {
      ...newLineItems[index],
      [field]: value
    };
    
    // Recalculate total for this line item
    if (field === 'hoursWorked' || field === 'hourlyRate') {
      const hours = field === 'hoursWorked' ? parseFloat(value) : newLineItems[index].hoursWorked;
      const rate = field === 'hourlyRate' ? parseFloat(value) : newLineItems[index].hourlyRate;
      newLineItems[index].total = hours * rate;
    }
    
    setFormData(prev => ({
      ...prev,
      lineItems: newLineItems
    }));
  };

  // Add new line item
  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        {
          employeeName: invoice?.employeeName || '',
          description: `${invoice?.month || 'Period'} ${invoice?.year || new Date().getFullYear()} (${prev.invoiceDurationFrom} to ${prev.invoiceDurationTo})`,
          hoursWorked: 0,
          hourlyRate: 0,
          total: 0
        }
      ]
    }));
  };

  // Remove line item
  const removeLineItem = (index) => {
    if (formData.lineItems.length > 1) {
      setFormData(prev => ({
        ...prev,
        lineItems: prev.lineItems.filter((_, i) => i !== index)
      }));
    }
  };

  // Handle logo upload
  const handleLogoUpload = (e) => {
    console.log('📤 handleLogoUpload called');
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.target.files[0];
    console.log('📁 File selected:', file?.name, file?.size);
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('✅ File read complete, setting logo preview');
        const base64String = reader.result;
        setCompanyLogo(base64String);
        setLogoPreview(base64String);
        console.log('✅ Logo preview set');
      };
      reader.onerror = (error) => {
        console.error('❌ Error reading file:', error);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle document upload
  const handleDocumentUpload = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.target.files[0];
    if (file) {
      setTimesheetFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setTimesheetFile(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove logo
  const removeLogo = () => {
    setCompanyLogo(null);
    setLogoPreview(null);
  };

  // Remove document
  const removeDocument = () => {
    setTimesheetFile(null);
    setTimesheetFileName(null);
  };

  // Generate PDF - Professional Standard Invoice Design
  const generatePDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    
    // Professional Colors
    const primaryColor = [52, 73, 94]; // Dark slate
    const accentColor = [41, 128, 185]; // Professional blue
    const lightGray = [245, 245, 245];
    const borderColor = [220, 220, 220];
    
    let yPos = 20;
    
    // Add Selsoft Inc. logo (top left) - Remove any vendor logo
    const logoToUse = logoPreview || invoice?.companyLogo;
    if (logoToUse) {
      try {
        console.log('📷 Adding Selsoft Inc. logo to PDF...');
        const logoWidth = 40;
        const logoHeight = 25;
        doc.addImage(logoToUse, 'PNG', margin, yPos, logoWidth, logoHeight);
        console.log('✅ Selsoft Inc. logo added to PDF');
      } catch (error) {
        console.error('❌ Error adding logo to PDF:', error);
      }
    }
    
    // INVOICE Title (top right, aligned with logo)
    doc.setTextColor(...primaryColor);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth - margin, yPos + 10, { align: 'right' });
    
    // Subtitle: Staffing Services Invoice
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Staffing Services Invoice', pageWidth - margin, yPos + 16, { align: 'right' });
    
    yPos += 36;
    
    // Horizontal line separator (after logo and title)
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    
    yPos += 10;
    
    // Two-column layout: From (Left) and Billed To (Right)
    const leftColX = margin;
    const rightColX = pageWidth / 2 + 10;
    
    // Left Column - From (Selsoft Inc.)
    doc.setTextColor(...primaryColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('From:', leftColX, yPos);
    
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(safeString(formData.companyName), leftColX, yPos + 6);
    doc.setFontSize(8);
    doc.text(safeString(formData.companyAddress), leftColX, yPos + 11);
    doc.text(safeString(formData.companyCity), leftColX, yPos + 16);
    doc.text(`Email: ${safeString(formData.companyEmail)}`, leftColX, yPos + 21);
    doc.text(`Phone: ${safeString(formData.companyPhone)}`, leftColX, yPos + 26);
    doc.text(`Tax ID: ${safeString(formData.companyTaxId)}`, leftColX, yPos + 31);
    
    // Right Column - Billed To (Vendor/Client - Hays)
    doc.setTextColor(...primaryColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Billed To:', rightColX, yPos);
    
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(safeString(formData.billToName), rightColX, yPos + 6);
    doc.setFontSize(8);
    doc.text(safeString(formData.billToAddress), rightColX, yPos + 11);
    doc.text(safeString(formData.billToCity), rightColX, yPos + 16);
    doc.text(`Attn: ${safeString(formData.billToAttn)}`, rightColX, yPos + 21);
    doc.text(`Email: ${safeString(formData.billToEmail)}`, rightColX, yPos + 26);
    
    yPos += 40;
    
    // Invoice Details Section with light background
    doc.setFillColor(...lightGray);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 24, 'F');
    
    const detailsLeftX = margin + 3;
    const detailsMidX = pageWidth / 3 + 10;
    const detailsRightX = (pageWidth / 3) * 2 + 10;
    
    // Invoice Number
    doc.setTextColor(...primaryColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Number:', detailsLeftX, yPos + 6);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(safeString(formData.invoiceNumber), detailsLeftX, yPos + 11);
    
    // Invoice Date
    doc.setTextColor(...primaryColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Date:', detailsMidX, yPos + 6);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(new Date(formData.invoiceDate).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    }), detailsMidX, yPos + 11);
    
    // Due Date
    doc.setTextColor(...primaryColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Due Date:', detailsRightX, yPos + 6);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(new Date(formData.dueDate).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    }), detailsRightX, yPos + 11);
    
    // Payment Terms
    doc.setTextColor(...primaryColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Terms:', detailsLeftX, yPos + 17);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(safeString(formData.paymentTerms), detailsLeftX + 30, yPos + 17);
    
    yPos += 29;
    
    // Billing Period Section
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Billing Period:', margin, yPos);
    
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const periodFromDate = new Date(formData.invoiceDurationFrom).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    });
    const periodToDate = new Date(formData.invoiceDurationTo).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    });
    doc.text(`${periodFromDate} - ${periodToDate}`, margin + 28, yPos);
    
    yPos += 7;
    
    // Engagement Section
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Engagement:', margin, yPos);
    
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(safeString(formData.engagementDetails), margin, yPos + 5);
    
    yPos += 12;
    
    // Line Items Table
    const tableData = formData.lineItems.map(item => {
      const hours = parseFloat(item.hoursWorked || item.hours || item.quantity || 0);
      const rate = parseFloat(item.hourlyRate || item.rate || 0);
      const total = parseFloat(item.total || item.amount || (hours * rate) || 0);
      const employeeName = safeString(item.employeeName || item.employee, 'N/A');
      const role = safeString(item.role || item.position || item.title, 'Software Engineer');
      const period = safeString(item.description, 'N/A');
      
      return [
        `${employeeName} (${role})`,
        period,
        hours.toString(),
        `$${formatNumber(rate)}`,
        `$${formatNumber(total)}`
      ];
    });
    
    autoTable(doc, {
      startY: yPos,
      head: [['Employee (Role)', 'Billing Period', 'Hours', 'Rate (USD)', 'Total (USD)']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: accentColor,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 4
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [60, 60, 60],
        cellPadding: 4
      },
      columnStyles: {
        0: { cellWidth: 40, halign: 'left' },
        1: { cellWidth: 'auto', halign: 'left' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: margin, right: margin },
      tableWidth: 'auto',
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
    
    // Totals Section with proper alignment
    const subtotal = calculateSubtotal();
    const total = calculateTotal();
    
    const totalsBoxX = pageWidth - margin - 65;
    const totalsBoxWidth = 65;
    
    // Draw totals box background
    doc.setFillColor(...lightGray);
    doc.rect(totalsBoxX, yPos - 3, totalsBoxWidth, 25, 'F');
    
    // Subtotal row
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Subtotal:', totalsBoxX + 3, yPos + 2);
    doc.text(`$${formatNumber(subtotal)}`, totalsBoxX + totalsBoxWidth - 3, yPos + 2, { align: 'right' });
    
    // Tax row with proper alignment
    yPos += 6;
    doc.text('Tax:', totalsBoxX + 3, yPos + 2);
    const taxText = formData.taxExempt ? formData.taxNote : `$${formatNumber(subtotal * formData.salesTax / 100)}`;
    doc.text(taxText, totalsBoxX + totalsBoxWidth - 3, yPos + 2, { align: 'right' });
    
    // Total Due row with emphasis
    yPos += 8;
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(0.5);
    doc.line(totalsBoxX, yPos, totalsBoxX + totalsBoxWidth, yPos);
    
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.text('Total Due:', totalsBoxX + 3, yPos + 2);
    doc.text(`$${formatNumber(total)} USD`, totalsBoxX + totalsBoxWidth - 3, yPos + 2, { align: 'right' });
    
    yPos += 12;
    
    // Payment Instructions Section
    doc.setFillColor(...lightGray);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 28, 'F');
    
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Remit Payment To:', margin + 3, yPos + 5);
    
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Bank: ${safeString(formData.bankName)}`, margin + 3, yPos + 10);
    doc.text(`Account Name: ${safeString(formData.accountName)}`, margin + 3, yPos + 14);
    doc.text(`Account #: ${safeString(formData.accountNumber)} | Routing #: ${safeString(formData.routingNumber)}`, margin + 3, yPos + 18);
    doc.text(`Swift Code: ${safeString(formData.swiftCode)} | Payment Terms: ${safeString(formData.paymentTerms)}`, margin + 3, yPos + 22);
    
    yPos += 34;
    
    // Closing Note
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 24, 'F');
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 24);
    
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('NOTE:', margin + 3, yPos + 6);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('We appreciate your continued partnership and trust in our services.', margin + 3, yPos + 10);
    doc.text('Kindly quote this invoice number in all future correspondence for faster reference.', margin + 3, yPos + 14);
    
    yPos += 28;
    
    // Footer with company info
    doc.setTextColor(...accentColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('', pageWidth / 2, yPos, { align: 'center' });
    
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`${safeString(formData.companyWebsite)} | support@selsoftinc.com`, pageWidth / 2, yPos + 5, { align: 'center' });
    
    return doc;
  };

  // Preview PDF in new tab
  const handlePreview = async () => {
    const doc = await generatePDF();
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Get employee name from first line item or invoice
    const employeeName = formData.lineItems?.[0]?.employeeName || invoice?.employeeName || 'Employee';
    const sanitizedEmployeeName = employeeName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${sanitizedEmployeeName}_${formData.invoiceNumber}.pdf`;
    
    // Create a new window with the filename in the title
    const newWindow = window.open(pdfUrl, '_blank');
    if (newWindow) {
      newWindow.document.title = filename;
    }
  };

  // Download PDF
  const handleDownload = async () => {
    const doc = await generatePDF();
    
    // Get employee name from first line item or invoice
    const employeeName = formData.lineItems?.[0]?.employeeName || invoice?.employeeName || 'Employee';
    const sanitizedEmployeeName = employeeName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${sanitizedEmployeeName}_${formData.invoiceNumber}.pdf`;
    
    doc.save(filename);
  };

  // Don't render if show is false or invoice is null
  if (!show || !invoice) {
    return null;
  }

  return (
    <div className="invoice-pdf-modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modern Header with Gradient */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon">
              <i className="fas fa-file-invoice-dollar"></i>
            </div>
            <div className="modal-title-group">
              <h2>Invoice Preview & Edit</h2>
              <p className="modal-subtitle">
                {formData.invoiceNumber} • Configure and generate professional invoices
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%)',
              padding: '24px 48px',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              backdropFilter: 'blur(10px)'
            }}>
              <div className="spinner-border text-white" role="status" style={{ width: '28px', height: '28px', borderWidth: '3px' }}></div>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', letterSpacing: '0.3px' }}>Loading employee data...</span>
            </div>
          )}
          <div className="invoice-form-container">
            {/* Company Information */}
            <div className="form-section">
              <h5 className="section-title">
                <div className="section-title-content">
                  <i className="fas fa-building"></i>
                  <span>From (Selsoft Inc.)</span>
                </div>
              </h5>
              <div className="form-row">
                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="companyEmail"
                    value={formData.companyEmail}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    name="companyAddress"
                    value={formData.companyAddress}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>City, State, ZIP</label>
                  <input
                    type="text"
                    name="companyCity"
                    value={formData.companyCity}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="companyPhone"
                    value={formData.companyPhone}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="form-section">
              <h5 className="section-title">
                <div className="section-title-content">
                  <i className="fas fa-file-invoice"></i>
                  <span>Invoice Details</span>
                </div>
              </h5>
              <div className="form-row">
                <div className="form-group">
                  <label>Invoice Number</label>
                  <input
                    type="text"
                    name="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Invoice Date</label>
                  <input
                    type="date"
                    name="invoiceDate"
                    value={formData.invoiceDate}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Payment Terms</label>
                  <input
                    type="text"
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Invoice Duration From</label>
                  <input
                    type="date"
                    name="invoiceDurationFrom"
                    value={formData.invoiceDurationFrom}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Invoice Duration To</label>
                  <input
                    type="date"
                    name="invoiceDurationTo"
                    value={formData.invoiceDurationTo}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            {/* Logo and Documents Upload */}
            <div className="form-section">
              <h5 className="section-title">
                <div className="section-title-content">
                  <i className="fas fa-upload"></i>
                  <span>Logo & Documents</span>
                </div>
              </h5>
              
              <div className="form-row">
                {/* Company Logo Upload */}
                <div className="form-group">
                  <label>Company Logo</label>
                  <div className="file-upload-container">
                    {logoPreview ? (
                      <div className="file-preview">
                        <img src={logoPreview} alt="Company Logo" className="logo-preview-img" />
                        <button
                          type="button"
                          className="btn-remove-file"
                          onClick={removeLogo}
                          title="Remove logo"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ) : (
                      <label className="file-upload-label" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="file-input-hidden"
                        />
                        <div className="file-upload-content">
                          <i className="fas fa-image"></i>
                          <span>Click to upload logo</span>
                          <small>PNG, JPG, GIF up to 5MB</small>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                {/* Timesheet Document Upload */}
                <div className="form-group">
                  <label>Timesheet Document</label>
                  <div className="file-upload-container">
                    {timesheetFileName ? (
                      <div className="file-preview document-preview">
                        <div className="document-icon">
                          <i className="fas fa-file-pdf"></i>
                        </div>
                        <div className="document-info">
                          <span className="document-name">{timesheetFileName}</span>
                          <small>Document attached</small>
                        </div>
                        <button
                          type="button"
                          className="btn-remove-file"
                          onClick={removeDocument}
                          title="Remove document"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ) : (
                      <label className="file-upload-label" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx"
                          onChange={handleDocumentUpload}
                          className="file-input-hidden"
                        />
                        <div className="file-upload-content">
                          <i className="fas fa-file-upload"></i>
                          <span>Click to upload document</span>
                          <small>PDF, DOC, XLS up to 10MB</small>
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Billed To (Client/Vendor) */}
            <div className="form-section">
              <h5 className="section-title">
                <div className="section-title-content">
                  <i className="fas fa-file-invoice-dollar"></i>
                  <span>Billed To (Client/Vendor - Hays)</span>
                </div>
              </h5>
              <div className="form-row">
                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    name="billToName"
                    value={formData.billToName}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Attention To</label>
                  <input
                    type="text"
                    name="billToAttn"
                    value={formData.billToAttn}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    name="billToAddress"
                    value={formData.billToAddress}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>City, State, ZIP</label>
                  <input
                    type="text"
                    name="billToCity"
                    value={formData.billToCity}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="form-section">
              <h5 className="section-title">
                <div className="section-title-content">
                  <i className="fas fa-project-diagram"></i>
                  <span>Project / Engagement</span>
                </div>
              </h5>
              <div className="form-row">
                <div className="form-group">
                  <label>Project Name</label>
                  <input
                    type="text"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    name="projectDescription"
                    value={formData.projectDescription}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="form-section">
              <h5 className="section-title">
                <div className="section-title-content">
                  <i className="fas fa-list"></i>
                  <span>Line Items</span>
                </div>
                <button 
                  type="button" 
                  className="btn-add-item"
                  onClick={addLineItem}
                >
                  <i className="fas fa-plus"></i> Add Item
                </button>
              </h5>
              
              {formData.lineItems.map((item, index) => (
                <div key={index} className="line-item-row">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Employee Name</label>
                      <input
                        type="text"
                        value={item.employeeName}
                        onChange={(e) => handleLineItemChange(index, 'employeeName', e.target.value)}
                        className="form-control"
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                        className="form-control"
                      />
                    </div>
                    <div className="form-group">
                      <label>Hours</label>
                      <input
                        type="number"
                        value={item.hoursWorked}
                        onChange={(e) => handleLineItemChange(index, 'hoursWorked', parseFloat(e.target.value) || 0)}
                        className="form-control"
                        min="0"
                        step="0.5"
                      />
                    </div>
                    <div className="form-group">
                      <label>Rate ($)</label>
                      <input
                        type="number"
                        value={item.hourlyRate}
                        onChange={(e) => handleLineItemChange(index, 'hourlyRate', parseFloat(e.target.value) || 0)}
                        className="form-control"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="form-group">
                      <label>Total</label>
                      <input
                        type="text"
                        value={`$${formatNumber(item.total)}`}
                        className="form-control"
                        disabled
                      />
                    </div>
                    {formData.lineItems.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove-item"
                        onClick={() => removeLineItem(index)}
                        title="Remove item"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Totals Display */}
              <div className="totals-section">
                <div className="total-row">
                  <span className="total-label">Subtotal:</span>
                  <span className="total-value">${formatNumber(calculateSubtotal())}</span>
                </div>
                <div className="total-row">
                  <span className="total-label">
                    Sales Tax ({formData.taxExempt ? '0%' : formData.salesTax + '%'}):
                  </span>
                  <span className="total-value">
                    {formData.taxExempt ? formData.taxNote : `$${formatNumber(calculateSubtotal() * formData.salesTax / 100)}`}
                  </span>
                </div>
                <div className="total-row total-due">
                  <span className="total-label">Total Due:</span>
                  <span className="total-value">${formatNumber(calculateTotal())} USD</span>
                </div>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="form-section">
              <h5 className="section-title">
                <div className="section-title-content">
                  <i className="fas fa-credit-card"></i>
                  <span>Payment Instructions</span>
                </div>
              </h5>
              <div className="form-row">
                <div className="form-group">
                  <label>Bank Name</label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Account Name</label>
                  <input
                    type="text"
                    name="accountName"
                    value={formData.accountName}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Account Number</label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Routing Number</label>
                  <input
                    type="text"
                    name="routingNumber"
                    value={formData.routingNumber}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Swift Code</label>
                  <input
                    type="text"
                    name="swiftCode"
                    value={formData.swiftCode}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <input
                    type="text"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="modal-footer-left">
            <i className="fas fa-info-circle"></i>
            <span>Invoice will be generated in PDF format</span>
          </div>
          <div className="modal-footer-right">
            <button className="btn-outline" onClick={onClose}>
              <i className="fas fa-times"></i>
              Cancel
            </button>
            <button className="btn-preview" 
            onClick={handlePreview}
            >
              <i className="fas fa-eye"></i>
              Preview Invoice PDF
            </button>
            <button className="btn-secondary" onClick={handleDownload}>
              <i className="fas fa-download"></i>
              Download Invoice PDF
            </button>
            {onUpdate && (
              <button className="btn-primary" onClick={() => {
                // Prepare updated invoice data
                const updatedInvoice = {
                  ...invoice,
                  ...formData,
                  companyLogo: logoPreview,
                  timesheetFile: timesheetFile,
                  timesheetFileName: timesheetFileName,
                  totalAmount: calculateTotal(),
                  total: calculateTotal()
                };
                onUpdate(updatedInvoice);
              }}>
                <i className="fas fa-save"></i>
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePDFPreviewModal;
