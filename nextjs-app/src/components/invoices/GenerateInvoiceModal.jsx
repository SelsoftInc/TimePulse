'use client';

import React, { useState, useEffect } from 'react';
import { API_BASE } from '@/config/api';
import { useToast } from '@/contexts/ToastContext';
import InvoicePDFPreviewModal from '../common/InvoicePDFPreviewModal';
import './GenerateInvoiceModal.css';

const GenerateInvoiceModal = ({ isOpen, onClose, onInvoiceGenerated }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [timesheets, setTimesheets] = useState([]);
  const [selectedTimesheets, setSelectedTimesheets] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Reset all state when modal opens
      setLoading(true);
      setTimesheets([]);
      setSelectedTimesheets([]);
      setClients([]);
      setSelectedClient('all');
      setGenerating(false);
      
      // Set current month and year
      const now = new Date();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
      const currentYear = String(now.getFullYear());
      
      setSelectedMonth(currentMonth);
      setSelectedYear(currentYear);
    } else {
      // Reset state when modal closes
      setLoading(true);
      setTimesheets([]);
      setSelectedTimesheets([]);
      setClients([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && selectedMonth && selectedYear) {
      fetchApprovedTimesheets();
    }
  }, [isOpen, selectedMonth, selectedYear, selectedClient]);

  const fetchApprovedTimesheets = async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');

      if (!userInfo.tenantId) {
        toast.error('No tenant information available');
        return;
      }

      // Build date range for the selected month/year
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth);
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        console.error('❌ Invalid date values:', { selectedYear, selectedMonth, year, month });
        toast.error('Invalid date selection');
        setLoading(false);
        return;
      }
      
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      console.log('📅 Date objects:', { startDate, endDate });
      
      const fromDate = startDate.toISOString().split('T')[0];
      const toDate = endDate.toISOString().split('T')[0];

      const url = `${API_BASE}/api/timesheets?tenantId=${userInfo.tenantId}&from=${fromDate}&to=${toDate}`;
      
      console.log('🔍 Fetching timesheets from:', url);
      console.log('📅 Date range:', { fromDate, toDate });
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`Failed to fetch timesheets: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Timesheets response:', data);

      let fetchedTimesheets = data.timesheets || data.data || [];
      
      // Log raw data to check for encryption
      console.log('🔍 Raw timesheets data:', JSON.stringify(fetchedTimesheets[0], null, 2));
      
      // Filter for approved timesheets only
      fetchedTimesheets = fetchedTimesheets.filter(ts => ts.approved === true || ts.status === 'approved');
      
      console.log('✅ Approved timesheets:', fetchedTimesheets.length);
      console.log('📊 Sample timesheet:', fetchedTimesheets[0]);
      
      // Check client data specifically
      if (fetchedTimesheets[0]) {
        console.log('🏢 Client field:', fetchedTimesheets[0].client);
        console.log('🏢 ClientName field:', fetchedTimesheets[0].clientName);
      }

      // Filter by client if selected (after extracting clients)
      if (selectedClient !== 'all') {
        fetchedTimesheets = fetchedTimesheets.filter(ts => 
          ts.clientId === selectedClient || 
          ts.client?.id === selectedClient ||
          ts.client === selectedClient ||
          ts.clientName === selectedClient
        );
      }

      console.log('📋 Setting timesheets:', fetchedTimesheets);
      setTimesheets(fetchedTimesheets);
      
      // Don't auto-select - let user manually select timesheets
      console.log('ℹ️ Timesheets loaded. User must manually select.');

      // Extract unique clients
      const uniqueClients = [...new Map(
        fetchedTimesheets.map(ts => [
          ts.clientId || ts.client?.id,
          {
            id: ts.clientId || ts.client?.id,
            name: ts.client || ts.clientName || ts.client?.name || ts.client?.clientName || 'Unknown Client'
          }
        ])
      ).values()].filter(c => c.id);

      setClients(uniqueClients);

    } catch (error) {
      console.error('❌ Error fetching timesheets:', error);
      toast.error(`Failed to load approved timesheets: ${error.message}`);
      setTimesheets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedTimesheets(timesheets.map(ts => ts.id));
    } else {
      setSelectedTimesheets([]);
    }
  };

  const handleSelectTimesheet = (timesheetId) => {
    setSelectedTimesheets(prev => {
      if (prev.includes(timesheetId)) {
        return prev.filter(id => id !== timesheetId);
      } else {
        return [...prev, timesheetId];
      }
    });
  };

  const calculateTotal = () => {
    const total = timesheets
      .filter(ts => selectedTimesheets.includes(ts.id))
      .reduce((sum, ts) => {
        const hours = parseFloat(ts.hours || ts.totalHours || 0);
        const rate = parseFloat(ts.billRate || ts.hourlyRate || ts.rate || 45);
        const amount = hours * rate;
        console.log('💰 Calculating:', { id: ts.id, hours, rate, amount });
        return sum + amount;
      }, 0);
    console.log('💵 Total calculated:', total);
    return total;
  };

  const handleGenerateInvoice = async () => {
    if (selectedTimesheets.length === 0) {
      toast.error('Please select at least one timesheet');
      return;
    }

    try {
      setGenerating(true);
      const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');

      // Get selected timesheets data
      const selectedTimesheetsData = timesheets.filter(ts => 
        selectedTimesheets.includes(ts.id)
      );

      console.log('📋 Selected timesheets data:', selectedTimesheetsData);

      // Validate hourly rates for all selected timesheets
      const timesheetsWithZeroRate = selectedTimesheetsData.filter(ts => {
        const rate = parseFloat(ts.billRate || ts.hourlyRate || ts.rate || 0);
        return rate === 0;
      });

      if (timesheetsWithZeroRate.length > 0) {
        const employeeNames = timesheetsWithZeroRate
          .map(ts => ts.employeeName || 'Unknown Employee')
          .join(', ');
        
        toast.error(
          `Cannot generate invoice: The following employee(s) do not have an hourly rate set: ${employeeNames}. Please set hourly rates before generating invoices.`,
          { duration: 6000 }
        );
        setGenerating(false);
        return;
      }

      // Extract client information
      const firstTimesheet = selectedTimesheetsData[0];
      const clientId = firstTimesheet?.clientId;
      const clientName = firstTimesheet?.client || 
                        firstTimesheet?.clientName || 
                        firstTimesheet?.client?.name || 
                        'Client';

      console.log('🏢 Client info:', { clientId, clientName });

      // Validate clientId
      if (!clientId) {
        toast.error('Selected timesheets do not have a valid client association. Please contact support.');
        setGenerating(false);
        return;
      }

      // Calculate totals
      const totalHours = selectedTimesheetsData.reduce((sum, ts) => 
        sum + parseFloat(ts.hours || ts.totalHours || 0), 0
      );

      const totalAmount = calculateTotal();

      // Generate invoice number
      const invoiceNumber = `INV-${selectedYear}-${selectedMonth}-${String(Date.now()).slice(-4)}`;

      // Prepare line items
      const lineItems = selectedTimesheetsData.map(ts => ({
        employeeName: ts.employeeName || 'Employee',
        description: `${getMonthName(parseInt(selectedMonth))} ${selectedYear} - ${ts.projectName || ts.project || 'Services'}`,
        hoursWorked: parseFloat(ts.hours || ts.totalHours || 0),
        hourlyRate: parseFloat(ts.billRate || ts.hourlyRate || ts.rate || 45),
        total: parseFloat(ts.hours || ts.totalHours || 0) * parseFloat(ts.billRate || ts.hourlyRate || ts.rate || 45)
      }));

      // Create invoice data
      const invoiceData = {
        tenantId: userInfo.tenantId,
        invoiceNumber: invoiceNumber,
        clientName: clientName,
        clientId: clientId,
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        month: getMonthName(parseInt(selectedMonth)),
        year: selectedYear,
        totalHours: totalHours,
        subtotal: totalAmount,
        tax: totalAmount * 0.1, // 10% tax
        total: totalAmount * 1.1,
        status: 'pending',
        lineItems: lineItems,
        timesheetIds: selectedTimesheets,
        weekStart: selectedTimesheetsData[0]?.weekStart,
        weekEnd: selectedTimesheetsData[0]?.weekEnding || selectedTimesheetsData[0]?.weekEnd
      };

      console.log('📤 Creating invoice:', invoiceData);

      // Save invoice to backend
      const invoiceUrl = `${API_BASE}/api/invoices`;
      console.log('🔗 Invoice API URL:', invoiceUrl);
      
      const response = await fetch(invoiceUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invoiceData)
      });

      console.log('📡 Invoice creation response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Invoice creation error:', errorText);
        throw new Error(`Failed to create invoice: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Invoice created successfully:', result);
      console.log('📊 Invoice lineItems:', result.invoice?.lineItems);
      console.log('💰 Invoice totals:', {
        totalHours: result.invoice?.totalHours,
        subtotal: result.invoice?.subtotal,
        total: result.invoice?.totalAmount || result.invoice?.total
      });

      if (result.success) {
        // Ensure lineItems are properly structured
        const invoice = {
          ...result.invoice,
          // Ensure these fields are available for the PDF modal
          hours: result.invoice?.totalHours,
          total: result.invoice?.totalAmount || result.invoice?.total,
          amount: result.invoice?.totalAmount || result.invoice?.total
        };
        
        console.log('📄 Setting invoice for PDF preview:', invoice);
        setGeneratedInvoice(invoice);
        toast.success('Invoice generated successfully!');
        
        // Show PDF preview
        setShowPDFPreview(true);
      } else {
        throw new Error(result.error || 'Failed to create invoice');
      }

    } catch (error) {
      console.error('❌ Error generating invoice:', error);
      toast.error(error.message || 'Failed to generate invoice');
      setGenerating(false);
    }
  };

  const getMonthName = (monthNum) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNum - 1] || 'Unknown';
  };

  const handlePDFClose = () => {
    setShowPDFPreview(false);
    onClose();
    if (onInvoiceGenerated) {
      onInvoiceGenerated();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="generate-invoice-modal-overlay">
        <div className="generate-invoice-modal">
          {/* Header */}
          <div className="modal-header">
            <div className="modal-header-content">
              <h2>Generate Invoice</h2>
              <p>Select approved timesheets to generate invoice</p>
            </div>
            <button onClick={onClose} className="modal-close-btn">
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Filters */}
          <div className="modal-filters">
            <div className="filters-grid">
              <div className="filter-group">
                <label className="filter-label">Client</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Clients</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="filter-select"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={String(month).padStart(2, '0')}>
                      {getMonthName(month)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="filter-select"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="modal-content">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
              </div>
            ) : timesheets.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <i className="fas fa-inbox"></i>
                </div>
                <p className="empty-state-title">No approved timesheets found</p>
                <p className="empty-state-subtitle">Try selecting a different month or client</p>
              </div>
            ) : (
              <div className="timesheets-table-wrapper">
                <table className="timesheets-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={selectedTimesheets.length === timesheets.length && timesheets.length > 0}
                          onChange={handleSelectAll}
                          className="table-checkbox"
                        />
                      </th>
                      <th>Employee</th>
                      <th>Client</th>
                      <th>Project</th>
                      <th>Period</th>
                      <th className="text-right">Hours</th>
                      <th className="text-right">Rate</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timesheets.map((timesheet) => {
                      const hours = parseFloat(timesheet.hours || timesheet.totalHours || 0);
                      const rate = parseFloat(timesheet.billRate || timesheet.hourlyRate || timesheet.rate || 45);
                      const amount = hours * rate;
                      
                      // Get client name - prioritize clientName field
                      let clientName = 'N/A';
                      if (timesheet.clientName && typeof timesheet.clientName === 'string') {
                        clientName = timesheet.clientName;
                      } else if (timesheet.client && typeof timesheet.client === 'string') {
                        clientName = timesheet.client;
                      } else if (timesheet.client && typeof timesheet.client === 'object' && timesheet.client.clientName) {
                        clientName = timesheet.client.clientName;
                      }
                      
                      const isSelected = selectedTimesheets.includes(timesheet.id);

                      return (
                        <tr key={timesheet.id} className={isSelected ? 'selected' : ''}>
                          <td>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectTimesheet(timesheet.id)}
                              className="table-checkbox"
                            />
                          </td>
                          <td>
                            <span className="employee-name">
                              {timesheet.employeeName || 'Employee'}
                            </span>
                          </td>
                          <td>{clientName}</td>
                          <td>{timesheet.projectName || timesheet.project || 'N/A'}</td>
                          <td>{getMonthName(parseInt(selectedMonth))} {selectedYear}</td>
                          <td className="text-right">{hours.toFixed(2)}</td>
                          <td className="text-right">${rate.toFixed(2)}</td>
                          <td className="text-right">
                            <span className="amount-value">${amount.toFixed(2)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <div className="footer-left">
              <div className="selection-count">
                <span className="selection-count-number">{selectedTimesheets.length}</span> timesheet(s) selected
              </div>
            </div>
            <div className="footer-right">
              <div className="total-amount-section">
                <div className="total-amount-label">Total Amount</div>
                <div className="total-amount-value">${calculateTotal().toFixed(2)}</div>
              </div>
              <button onClick={onClose} className="btn btn-cancel">
                Cancel
              </button>
              <button
                onClick={handleGenerateInvoice}
                disabled={selectedTimesheets.length === 0 || generating}
                className="btn btn-primary"
              >
                {generating ? (
                  <>
                    <div className="loading-spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }}></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-file-invoice btn-icon"></i>
                    <span>Generate Invoice</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPDFPreview && generatedInvoice && (
        <InvoicePDFPreviewModal
          show={showPDFPreview}
          invoice={generatedInvoice}
          onClose={handlePDFClose}
        />
      )}
    </>
  );
};

export default GenerateInvoiceModal;
