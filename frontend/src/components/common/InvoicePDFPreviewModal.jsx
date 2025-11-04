import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE } from '../../config/api';
import './InvoicePDFPreviewModal.css';

const InvoicePDFPreviewModal = ({ invoice, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
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
  });

  // Fetch employee data from backend
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoading(true);
        const tenantId = localStorage.getItem('tenantId');
        const token = localStorage.getItem('token');
        
        console.log('Fetching employee data for invoice:', invoice);
        
        // First, try to use lineItems from invoice if available
        if (invoice?.lineItems && Array.isArray(invoice.lineItems) && invoice.lineItems.length > 0) {
          console.log('Using invoice lineItems:', invoice.lineItems);
          
          // Fetch employee details for each line item
          const processedItemsPromises = invoice.lineItems.map(async (item) => {
            let employeeName = item.employeeName || 'Employee Name';
            let position = item.position || 'Position';
            
            // Parse employee name from description if not directly available
            if (!item.employeeName && item.description) {
              // Format: "Timesheet for FirstName LastName - Week Range"
              const match = item.description.match(/Timesheet for (.+?) - /);
              if (match) {
                employeeName = match[1];
                
                // Try to fetch employee details by name
                try {
                  const empResponse = await fetch(
                    `${API_BASE}/employees?tenantId=${tenantId}&search=${encodeURIComponent(employeeName)}`,
                    {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    }
                  );
                  
                  if (empResponse.ok) {
                    const empData = await empResponse.json();
                    const employees = empData.employees || empData.data || [];
                    if (employees.length > 0) {
                      const emp = employees[0];
                      position = emp.title || emp.position || emp.department || 'Position';
                    }
                  }
                } catch (err) {
                  console.error('Error fetching employee details:', err);
                }
              }
            }
            
            return {
              employeeName,
              position,
              hoursWorked: parseFloat(item.hours || item.hoursWorked || 0),
              hourlyRate: parseFloat(item.rate || item.hourlyRate || 45.00),
              total: parseFloat(item.amount || item.total || 0)
            };
          });
          
          const processedItems = await Promise.all(processedItemsPromises);
          
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
    return formData.lineItems.reduce((sum, item) => sum + (item.hoursWorked * item.hourlyRate), 0);
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

  // Generate PDF - Optimized for single page
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Colors
    const primaryColor = [41, 128, 185]; // Professional Blue
    const accentColor = [52, 152, 219]; // Light Blue
    const darkGray = [44, 62, 80];
    const lightGray = [236, 240, 241];
    
    // Modern Header with gradient effect
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth / 2, 22, { align: 'center' });
    
    let yPos = 42;
    
    // Company Info (Left) and Invoice Details (Right)
    doc.setTextColor(...darkGray);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Staffing Company:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(formData.companyName, 20, yPos + 5);
    doc.text(formData.companyAddress, 20, yPos + 10);
    doc.text(formData.companyCity, 20, yPos + 15);
    doc.text(`Email: ${formData.companyEmail}`, 20, yPos + 20);
    doc.text(`Phone: ${formData.companyPhone}`, 20, yPos + 25);
    
    // Invoice Details (Right aligned)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const rightX = pageWidth - 20;
    doc.text('Invoice Number:', rightX, yPos, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(formData.invoiceNumber, rightX, yPos + 5, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Date:', rightX, yPos + 10, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(formData.invoiceDate).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    }), rightX, yPos + 15, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text('Due Date:', rightX, yPos + 20, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(formData.dueDate).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    }), rightX, yPos + 25, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Terms:', rightX, yPos + 30, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(formData.paymentTerms, rightX, yPos + 35, { align: 'right' });
    
    yPos += 50;
    
    // Bill To Section
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPos, pageWidth - 40, 30, 'F');
    doc.setTextColor(...darkGray);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Bill To:', 25, yPos + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(formData.billToName, 25, yPos + 12);
    doc.text(`Attn: ${formData.billToAttn}`, 25, yPos + 17);
    doc.text(formData.billToAddress, 25, yPos + 22);
    doc.text(formData.billToCity, 25, yPos + 27);
    
    yPos += 40;
    
    // Project/Engagement Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Project / Engagement:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`${formData.projectName} - ${formData.projectDescription}`, 20, yPos + 5);
    
    yPos += 15;
    
    // Line Items Table
    const tableData = formData.lineItems.map(item => [
      item.employeeName,
      item.position,
      item.hoursWorked.toString(),
      `$${item.hourlyRate.toFixed(2)}`,
      `$${item.total.toFixed(2)}`
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Employee Name', 'Position', 'Hours Worked', 'Hourly Rate (USD)', 'Total (USD)']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 5
      },
      bodyStyles: {
        fontSize: 10,
        textColor: darkGray,
        cellPadding: 5
      },
      columnStyles: {
        0: { cellWidth: 'auto', halign: 'left' },
        1: { cellWidth: 'auto', halign: 'left' },
        2: { cellWidth: 35, halign: 'center' },
        3: { cellWidth: 40, halign: 'right' },
        4: { cellWidth: 40, halign: 'right' }
      },
      margin: { left: 20, right: 20 },
      tableWidth: 'auto'
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
    
    // Totals Section
    const subtotal = calculateSubtotal();
    const total = calculateTotal();
    
    const totalsX = pageWidth - 70;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Subtotal:', totalsX, yPos, { align: 'right' });
    doc.text(`$${subtotal.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
    
    yPos += 7;
    doc.text(`Sales Tax (${formData.taxExempt ? '0%' : formData.salesTax + '%'}):`, totalsX, yPos, { align: 'right' });
    doc.text(formData.taxExempt ? formData.taxNote : `$${(subtotal * formData.salesTax / 100).toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
    
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total Due:', totalsX, yPos, { align: 'right' });
    doc.text(`$${total.toFixed(2)} USD`, pageWidth - 20, yPos, { align: 'right' });
    
    yPos += 20;
    
    // Payment Instructions
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPos, pageWidth - 40, 40, 'F');
    doc.setTextColor(...darkGray);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Payment Instructions:', 25, yPos + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Bank Name: ${formData.bankName}`, 25, yPos + 13);
    doc.text(`Account Name: ${formData.accountName}`, 25, yPos + 18);
    doc.text(`Account Number: ${formData.accountNumber}`, 25, yPos + 23);
    doc.text(`Routing Number: ${formData.routingNumber}`, 25, yPos + 28);
    doc.text(`Payment Method: ${formData.paymentMethod}`, 25, yPos + 33);
    
    return doc;
  };

  // Preview PDF in new tab
  const handlePreview = () => {
    const doc = generatePDF();
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };

  // Download PDF
  const handleDownload = () => {
    const doc = generatePDF();
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
                <i className="fas fa-building"></i> Staffing Company Information
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
            </div>

            {/* Bill To */}
            <div className="form-section">
              <h5 className="section-title">
                <i className="fas fa-user-tie"></i> Bill To (Vendor/Client)
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
                        value={`$${item.total.toFixed(2)}`}
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
                  <span className="total-value">${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span className="total-label">
                    Sales Tax ({formData.taxExempt ? '0%' : formData.salesTax + '%'}):
                  </span>
                  <span className="total-value">
                    {formData.taxExempt ? formData.taxNote : `$${(calculateSubtotal() * formData.salesTax / 100).toFixed(2)}`}
                  </span>
                </div>
                <div className="total-row total-due">
                  <span className="total-label">Total Due:</span>
                  <span className="total-value">${calculateTotal().toFixed(2)} USD</span>
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
