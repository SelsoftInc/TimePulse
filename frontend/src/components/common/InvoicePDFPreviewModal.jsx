import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE } from '../../config/api';
import './InvoicePDFPreviewModal.css';

const InvoicePDFPreviewModal = ({ invoice, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  
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
  
  const [formData, setFormData] = useState(() => {
    // Calculate invoice duration from timesheet line items if available
    let calculatedStartDate = null;
    let calculatedEndDate = null;
    
    if (invoice?.lineItems && invoice.lineItems.length > 0) {
      const dates = invoice.lineItems
        .map(item => item.date || item.workDate || item.startDate)
        .filter(date => date)
        .map(date => new Date(date));
      
      if (dates.length > 0) {
        calculatedStartDate = new Date(Math.min(...dates)).toISOString().split('T')[0];
        calculatedEndDate = new Date(Math.max(...dates)).toISOString().split('T')[0];
      }
    }
    
    // Fallback to invoice dates or month-based calculation
    const startDate = invoice?.startDate || calculatedStartDate || 
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endDate = invoice?.endDate || calculatedEndDate || 
      new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
    
    return {
      // Staffing Company (Current Company - Selsoft)
      companyName: 'Selsoft Inc.',
      companyAddress: '123 Business Street, Suite 100',
      companyCity: 'Dallas, TX 75201',
      companyEmail: 'billing@selsoft.com',
      companyPhone: '(214) 555-0100',
      
      // Invoice Details
      invoiceNumber: invoice?.invoiceNumber || `INV-2025-${String(invoice?.id || '0001').padStart(4, '0')}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentTerms: 'Net 14 Days',
      
      // Bill To (Vendor/Client)
      billToName: invoice?.clientName || invoice?.vendorName || invoice?.vendor || 'Client Company Name',
      billToAttn: 'Accounts Payable',
      billToAddress: '789 Enterprise Blvd',
      billToCity: 'Dallas, TX 75201',
      
      // Project Details
      projectName: invoice?.month && invoice?.year ? `${invoice.month} ${invoice.year}` : 'Contract Staffing',
      projectDescription: 'Professional Services',
      
      // Invoice Duration - calculated from actual timesheet dates
      invoiceDurationFrom: startDate,
      invoiceDurationTo: endDate,
      
      // Line Items
      lineItems: invoice?.lineItems || [
        {
          employeeName: 'Employee Name',
          position: 'Position',
          hoursWorked: 160,
          hourlyRate: 45.00,
          total: 7200.00
        }
      ],
      
      // Payment Details
      bankName: 'Chase Bank',
      accountName: 'Selsoft Inc.',
      accountNumber: '123456789',
      routingNumber: '111000025',
      paymentMethod: 'ACH / Wire Transfer',
      
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
        const tenantId = localStorage.getItem('tenantId');
        const token = localStorage.getItem('token');
        
        console.log('Fetching employee data for invoice:', invoice);
        
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
            
            if (response.ok) {
              const data = await response.json();
              console.log('Employee data from API:', data);
              
              if (data.success && data.lineItems && data.lineItems.length > 0) {
                const processedItems = data.lineItems.map(item => ({
                  employeeName: item.employeeName || 'Employee Name',
                  position: item.position || 'Position',
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
              } else if (data.success && data.employee) {
                // Single employee data
                const employeeItem = {
                  employeeName: data.employee.fullName || 'Employee Name',
                  position: data.employee.position || 'Position',
                  hoursWorked: parseFloat(invoice.hours || 0),
                  hourlyRate: parseFloat(data.employee.hourlyRate || 45.00),
                  total: parseFloat(invoice.totalAmount || invoice.total || 0)
                };
                
                setFormData(prev => ({
                  ...prev,
                  lineItems: [employeeItem]
                }));
                setEmployees([employeeItem]);
                setLoading(false);
                return;
              }
            }
          } catch (err) {
            console.error('Error fetching employee data from new API:', err);
          }
        }
        
        // Fallback: try to use lineItems from invoice if available
        if (invoice?.lineItems && Array.isArray(invoice.lineItems) && invoice.lineItems.length > 0) {
          console.log('Using invoice lineItems:', invoice.lineItems);
          
          const processedItems = invoice.lineItems.map(item => ({
            employeeName: item.employeeName || 'Employee Name',
            position: item.position || 'Position',
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
        
        // Convert month name to number
        const monthMap = {
          'January': 1, 'February': 2, 'March': 3, 'April': 4,
          'May': 5, 'June': 6, 'July': 7, 'August': 8,
          'September': 9, 'October': 10, 'November': 11, 'December': 12
        };
        const monthNum = monthMap[invoiceMonth] || new Date().getMonth() + 1;
        
        console.log(`Fetching timesheets for ${invoiceMonth} ${invoiceYear} (month: ${monthNum})`);
        
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
          console.log('Timesheets response:', data);
          const timesheets = data.timesheets || data.data || [];
          
          // Transform timesheet data to line items with employee info
          const lineItems = timesheets.map(ts => ({
            employeeName: ts.employeeName || `${ts.employee?.firstName || ''} ${ts.employee?.lastName || ''}`.trim() || ts.employee?.name || 'Employee Name',
            position: ts.employee?.title || ts.employee?.position || ts.employee?.department || ts.position || 'Position',
            hoursWorked: parseFloat(ts.totalHours || ts.hours || 0),
            hourlyRate: parseFloat(ts.employee?.hourlyRate || ts.hourlyRate || ts.rate || 45.00),
            total: (parseFloat(ts.totalHours || ts.hours || 0)) * (parseFloat(ts.employee?.hourlyRate || ts.hourlyRate || ts.rate || 45.00))
          }));
          
          console.log('Processed line items:', lineItems);
          
          // Update form data with fetched employee data
          if (lineItems.length > 0) {
            setFormData(prev => ({
              ...prev,
              lineItems: lineItems
            }));
            setEmployees(lineItems);
          }
        } else {
          console.error('Failed to fetch timesheets:', response.status);
        }
      } catch (error) {
        console.error('Error fetching employee data:', error);
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
          employeeName: '',
          position: '',
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

  // Generate PDF - Optimized for single page with employer logo
  const generatePDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15; // Reduced margin for more space
    
    // Colors
    const primaryColor = [41, 128, 185]; // Professional Blue
    const accentColor = [52, 152, 219]; // Light Blue
    const darkGray = [44, 62, 80];
    const lightGray = [236, 240, 241];
    
    // Compact Header with gradient effect
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Add employer logo if available
    let logoYPos = 35;
    if (invoice?.companyLogo) {
      try {
        console.log('📷 Adding employer logo to PDF...');
        // Check if logo is base64 or URL
        const logoData = invoice.companyLogo;
        
        // Add logo to top-left of header
        const logoWidth = 30;
        const logoHeight = 20;
        const logoX = margin;
        const logoY = 7;
        
        doc.addImage(logoData, 'PNG', logoX, logoY, logoWidth, logoHeight);
        console.log('✅ Employer logo added to PDF');
      } catch (error) {
        console.error('❌ Error adding logo to PDF:', error);
        // Continue without logo if there's an error
      }
    }
    
    // Invoice title (centered or right-aligned if logo exists)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    const titleX = invoice?.companyLogo ? pageWidth - margin - 50 : pageWidth / 2;
    doc.text('INVOICE', titleX, 22, { align: invoice?.companyLogo ? 'left' : 'center' });
    
    let yPos = logoYPos + 5;
    
    // Billed To (Left) and Invoice Details (Right) - Compact
    doc.setTextColor(...darkGray);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Billed To:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(safeString(formData.companyName), margin, yPos + 4);
    doc.text(safeString(formData.companyAddress), margin, yPos + 8);
    doc.text(safeString(formData.companyCity), margin, yPos + 12);
    doc.text(`Email: ${safeString(formData.companyEmail)}`, margin, yPos + 16);
    doc.text(`Phone: ${safeString(formData.companyPhone)}`, margin, yPos + 20);
    
    // Invoice Details (Right aligned) - Compact
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const rightX = pageWidth - margin;
    doc.text('Invoice Number:', rightX, yPos, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(safeString(formData.invoiceNumber), rightX, yPos + 4, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Invoice Date:', rightX, yPos + 8, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(new Date(formData.invoiceDate).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    }), rightX, yPos + 12, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Due Date:', rightX, yPos + 16, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(new Date(formData.dueDate).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    }), rightX, yPos + 20, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Payment Terms:', rightX, yPos + 24, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(safeString(formData.paymentTerms), rightX, yPos + 28, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Invoice Duration:', rightX, yPos + 32, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const fromDate = new Date(formData.invoiceDurationFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const toDate = new Date(formData.invoiceDurationTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    doc.text(`${fromDate} - ${toDate}`, rightX, yPos + 36, { align: 'right' });
    
    yPos += 45;
    
    // Shipped To Section - Compact
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 22, 'F');
    doc.setTextColor(...darkGray);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Shipped To:', margin + 3, yPos + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(safeString(formData.billToName), margin + 3, yPos + 9);
    doc.text(`Attn: ${safeString(formData.billToAttn)}`, margin + 3, yPos + 13);
    doc.text(`${safeString(formData.billToAddress)}, ${safeString(formData.billToCity)}`, margin + 3, yPos + 17);
    
    yPos += 27;
    
    // Project/Engagement Section - Compact
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Project / Engagement:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`${safeString(formData.projectName)} - ${safeString(formData.projectDescription)}`, margin, yPos + 4);
    
    yPos += 10;
    
    // Line Items Table
    const tableData = formData.lineItems.map(item => {
      const hours = parseFloat(item.hoursWorked || item.hours || item.quantity || 0);
      const rate = parseFloat(item.hourlyRate || item.rate || 0);
      const total = parseFloat(item.total || item.amount || (hours * rate) || 0);
      
      return [
        safeString(item.employeeName || item.employee, 'N/A'),
        safeString(item.position || item.title, 'N/A'),
        hours.toString(),
        `$${formatNumber(rate)}`,
        `$${formatNumber(total)}`
      ];
    });
    
    autoTable(doc, {
      startY: yPos,
      head: [['Employee Name', 'Position', 'Hours', 'Rate (USD)', 'Total (USD)']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 3
      },
      bodyStyles: {
        fontSize: 8,
        textColor: darkGray,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 'auto', halign: 'left' },
        1: { cellWidth: 'auto', halign: 'left' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: margin, right: margin },
      tableWidth: 'auto'
    });
    
    yPos = doc.lastAutoTable.finalY + 6;
    
    // Totals Section - Compact
    const subtotal = calculateSubtotal();
    const total = calculateTotal();
    
    const totalsX = pageWidth - 55;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Subtotal:', totalsX, yPos, { align: 'right' });
    doc.text(`$${formatNumber(subtotal)}`, rightX, yPos, { align: 'right' });
    
    yPos += 5;
    doc.text(`Tax (${formData.taxExempt ? '0%' : formData.salesTax + '%'}):`, totalsX, yPos, { align: 'right' });
    doc.text(formData.taxExempt ? formData.taxNote : `$${formatNumber(subtotal * formData.salesTax / 100)}`, rightX, yPos, { align: 'right' });
    
    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Total Due:', totalsX, yPos, { align: 'right' });
    doc.text(`$${formatNumber(total)} USD`, rightX, yPos, { align: 'right' });
    
    yPos += 12;
    
    // Payment Instructions - Compact
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 24, 'F');
    doc.setTextColor(...darkGray);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Payment Instructions:', margin + 3, yPos + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Bank: ${safeString(formData.bankName)} | Account: ${safeString(formData.accountName)} | Acc#: ${safeString(formData.accountNumber)}`, margin + 3, yPos + 10);
    doc.text(`Routing: ${safeString(formData.routingNumber)} | Method: ${safeString(formData.paymentMethod)}`, margin + 3, yPos + 14);
    
    yPos += 28;
    
    // Closing Note - Compact with bold NOTE and support email
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 28, 'F');
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 28);
    
    doc.setTextColor(...darkGray);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('NOTE:', margin + 3, yPos + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('We appreciate your continued partnership and trust in our services.', margin + 3, yPos + 10);
    doc.text('Kindly quote this invoice number in all future correspondence for faster reference.', margin + 3, yPos + 14);
    
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('Support Mail: support@selsoftinc.com', margin + 3, yPos + 23);
    
    return doc;
  };

  // Preview PDF in new tab
  const handlePreview = async () => {
    const doc = await generatePDF();
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };

  // Download PDF
  const handleDownload = async () => {
    const doc = await generatePDF();
    doc.save(`${formData.invoiceNumber}.pdf`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content invoice-pdf-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h4>Invoice Preview & Edit</h4>
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
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '20px 40px',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div className="spinner-border" role="status" style={{ width: '24px', height: '24px' }}></div>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>Loading employee data...</span>
            </div>
          )}
          <div className="invoice-form-container">
            {/* Company Information */}
            <div className="form-section">
              <h5 className="section-title">
                <i className="fas fa-building"></i> Billed To Information
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
                <i className="fas fa-file-invoice"></i> Invoice Details
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

            {/* Shipped To */}
            <div className="form-section">
              <h5 className="section-title">
                <i className="fas fa-shipping-fast"></i> Shipped To (Vendor/Client)
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
                <i className="fas fa-project-diagram"></i> Project / Engagement
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
                <i className="fas fa-list"></i> Line Items
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
                      <label>Position</label>
                      <input
                        type="text"
                        value={item.position}
                        onChange={(e) => handleLineItemChange(index, 'position', e.target.value)}
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
                <i className="fas fa-credit-card"></i> Payment Instructions
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
          <button className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-preview" onClick={handlePreview}>
            <i className="fas fa-eye"></i> Preview PDF
          </button>
          <button className="btn-primary" onClick={handleDownload}>
            <i className="fas fa-download"></i> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoicePDFPreviewModal;
