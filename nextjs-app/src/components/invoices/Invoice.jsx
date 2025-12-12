'use client';

import React, { useState, useEffect } from 'react';
import InvoiceSettingsModal from '../common/InvoiceSettingsModal';
import InvoicePDFPreviewModal from '../common/InvoicePDFPreviewModal';
import InvoiceSuccessModal from '../common/InvoiceSuccessModal';
import InvoiceDetailsModal from '../common/InvoiceDetailsModal';
import axios from 'axios';
import { API_BASE } from '@/config/api';
import { apiClient } from '@/utils/apiClient';
import "./Invoice.css";
import '../common/ActionsDropdown.css';

// Utility function for safe number formatting (prevents toFixed errors)
const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  return num.toFixed(2);
};

// Utility function for status display
const getStatusDisplay = (status) => {
  switch (status.toLowerCase()) {
    case "draft":
      return { class: "secondary", icon: "fas fa-edit", text: "Draft" };
    case "pending":
      return { class: "warning", icon: "fas fa-clock", text: "Pending" };
    case "approved":
      return {
        class: "success",
        icon: "fas fa-check-circle",
        text: "Approved"};
    case "rejected":
      return { class: "danger", icon: "fas fa-times-circle", text: "Rejected" };
    case "sent":
      return { class: "info", icon: "fas fa-paper-plane", text: "Sent" };
    case "paid":
      return { class: "success", icon: "fas fa-dollar-sign", text: "Paid" };
    default:
      return {
        class: "secondary",
        icon: "fas fa-question-circle",
        text: status};
  }
};

// Invoice Detail Modal Component - Redesigned to match Timesheet popup
const InvoiceDetailModal = ({ invoice, onClose, onApprove, onReject }) => {
  const [notes, setNotes] = useState("");
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [selectedInvoiceForPDF, setSelectedInvoiceForPDF] = useState(null);

  // Safe number formatting to prevent toFixed errors
  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return num.toFixed(2);
  };

  const handlePreviewPDF = async () => {
    try {
      const tenantId = JSON.parse(localStorage.getItem("user"))?.tenantId;
      const token = localStorage.getItem("token");
      
      console.log('📄 Fetching full invoice details for PDF preview:', invoice.id);
      
      // Fetch full invoice details from backend
      const response = await fetch(
        `${API_BASE}/api/invoices/${invoice.id}?tenantId=${tenantId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Full invoice data for PDF:', data);
        
        if (data.success && data.invoice) {
          const fullInvoice = {
            ...invoice,
            ...data.invoice,
            lineItems: data.invoice.lineItems || invoice.lineItems || [],
            companyLogo: data.invoice.companyLogo || null
          };
          
          setSelectedInvoiceForPDF(fullInvoice);
          setShowPDFPreview(true);
        }
      }
    } catch (error) {
      console.error("Error fetching invoice for PDF:", error);
      alert('Failed to load invoice details for PDF');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const tenantId = JSON.parse(localStorage.getItem("user"))?.tenantId;
      const token = localStorage.getItem("token");
      
      console.log('📥 Fetching full invoice details for PDF download:', invoice.id);
      
      // Fetch full invoice details from backend
      const response = await fetch(
        `${API_BASE}/api/invoices/${invoice.id}?tenantId=${tenantId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.invoice) {
          const fullInvoice = {
            ...invoice,
            ...data.invoice,
            lineItems: data.invoice.lineItems || invoice.lineItems || [],
            companyLogo: data.invoice.companyLogo || null
          };
          
          setSelectedInvoiceForPDF(fullInvoice);
          setShowPDFPreview(true);
        }
      }
    } catch (error) {
      console.error("Error fetching invoice for PDF:", error);
      alert('Failed to load invoice details for PDF');
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-content invoice-modal"
          onClick={(e) => e.stopPropagation()}
          style={{maxWidth: '800px', borderRadius: '12px'}}
        >
          {/* Modern Header matching Timesheet design */}
          <div className="modal-header" style={{background: 'linear-gradient(135deg, #4285f4 0%, #1967d2 100%)', borderRadius: '12px 12px 0 0', padding: '20px 24px'}}>
            <h4 style={{color: '#ffffff', margin: 0, fontSize: '18px', fontWeight: '600'}}>Invoice Details</h4>
            <button className="modal-close" onClick={onClose} style={{background: 'rgba(255,255,255,0.2)', border: 'none', color: '#ffffff', fontSize: '24px', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer'}}>
              ×
            </button>
          </div>

          <div className="modal-body" style={{padding: '24px'}}>
            {/* Employee Information */}
            <div style={{marginBottom: '24px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
                <div style={{background: '#e8f0fe', padding: '8px', borderRadius: '8px', display: 'flex'}}>
                  <i className="fas fa-user" style={{fontSize: '16px', color: '#1967d2'}}></i>
                </div>
                <h5 style={{margin: 0, fontSize: '15px', fontWeight: '600', color: '#202124'}}>Employee Information</h5>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e8eaed'}}>
                <div>
                  <label style={{display: 'block', fontSize: '12px', fontWeight: '600', color: '#5f6368', marginBottom: '4px'}}>EMPLOYEE NAME</label>
                  <div style={{fontSize: '14px', color: '#202124'}}>
                    {(() => {
                      // Try multiple paths to find employee name
                      if (invoice.employee?.firstName && invoice.employee?.lastName) {
                        return `${invoice.employee.firstName} ${invoice.employee.lastName}`;
                      } else if (invoice.timesheet?.employee?.firstName && invoice.timesheet?.employee?.lastName) {
                        return `${invoice.timesheet.employee.firstName} ${invoice.timesheet.employee.lastName}`;
                      } else if (invoice.employeeName) {
                        return invoice.employeeName;
                      }
                      return 'N/A';
                    })()}
                  </div>
                </div>
                <div>
                  <label style={{display: 'block', fontSize: '12px', fontWeight: '600', color: '#5f6368', marginBottom: '4px'}}>EMPLOYEE EMAIL</label>
                  <div style={{fontSize: '14px', color: '#202124'}}>
                    {invoice.employee?.email || invoice.timesheet?.employee?.email || invoice.employeeEmail || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Timesheet Period */}
            <div style={{marginBottom: '24px'}}>
              <h5 style={{fontSize: '15px', fontWeight: '600', color: '#202124', marginBottom: '12px'}}>Timesheet Period</h5>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e8eaed'}}>
                <div>
                  <label style={{display: 'block', fontSize: '12px', fontWeight: '600', color: '#5f6368', marginBottom: '4px'}}>WEEK START:</label>
                  <div style={{fontSize: '14px', color: '#202124'}}>{invoice.weekStart || invoice.week?.split(' - ')[0] || 'N/A'}</div>
                </div>
                <div>
                  <label style={{display: 'block', fontSize: '12px', fontWeight: '600', color: '#5f6368', marginBottom: '4px'}}>WEEK END:</label>
                  <div style={{fontSize: '14px', color: '#202124'}}>{invoice.weekEnd || invoice.week?.split(' - ')[1] || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div style={{marginBottom: '24px'}}>
              <h5 style={{fontSize: '15px', fontWeight: '600', color: '#202124', marginBottom: '12px'}}>Line Items</h5>
              <div style={{overflowX: 'auto'}}>
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                  <thead>
                    <tr style={{background: '#4285f4'}}>
                      <th style={{padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#ffffff', textTransform: 'uppercase'}}>DESCRIPTION</th>
                      <th style={{padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#ffffff', textTransform: 'uppercase'}}>HOURS</th>
                      <th style={{padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#ffffff', textTransform: 'uppercase'}}>RATE</th>
                      <th style={{padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#ffffff', textTransform: 'uppercase'}}>AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(invoice.lineItems || []).map((item, index) => (
                      <tr key={index} style={{borderBottom: '1px solid #e8eaed'}}>
                        <td style={{padding: '12px', fontSize: '14px', color: '#202124'}}>{item.description || 'Service'}</td>
                        <td style={{padding: '12px', textAlign: 'center', fontSize: '14px', color: '#202124'}}>{formatCurrency(item.hours)}</td>
                        <td style={{padding: '12px', textAlign: 'center', fontSize: '14px', color: '#202124'}}>${formatCurrency(item.rate)}</td>
                        <td style={{padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#202124'}}>${formatCurrency(parseFloat(item.hours || 0) * parseFloat(item.rate || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer with Preview and Download buttons */}
          <div className="modal-footer" style={{padding: '16px 24px', borderTop: '1px solid #e8eaed', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <button 
              className="btn-outline" 
              onClick={onClose}
              style={{padding: '10px 20px', border: '1px solid #dadce0', borderRadius: '6px', fontSize: '14px', fontWeight: '500', color: '#5f6368', background: '#ffffff', cursor: 'pointer'}}
            >
              Close
            </button>
            <div style={{display: 'flex', gap: '12px'}}>
              <button
                onClick={handlePreviewPDF}
                style={{padding: '10px 20px', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '500', color: '#ffffff', background: '#34a853', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}
              >
                <i className="fas fa-eye"></i>
                Preview
              </button>
              <button
                onClick={handleDownloadPDF}
                style={{padding: '10px 20px', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '500', color: '#ffffff', background: '#1967d2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}
              >
                <i className="fas fa-download"></i>
                Download Invoice
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPDFPreview && selectedInvoiceForPDF && (
        <InvoicePDFPreviewModal
          invoice={selectedInvoiceForPDF}
          onClose={() => {
            setShowPDFPreview(false);
            setSelectedInvoiceForPDF(null);
          }}
        />
      )}
    </>
  );
};

// Invoice Upload Modal Component
const InvoiceUploadModal = ({ onClose, onUpload }) => {
  const [formData, setFormData] = useState({
    vendor: "",
    weekStart: "",
    weekEnd: "",
    employee: "",
    timesheetId: "",
    useTimesheet: true,
    total: "",
    file: null,
    quickbooksSync: false});

  const [employees, setEmployees] = useState([]);
  const [approvedTimesheets, setApprovedTimesheets] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);

  useEffect(() => {
    fetchEmployees();
    fetchVendors();
  }, []);

  useEffect(() => {
    if (formData.employee && formData.weekStart && formData.weekEnd) {
      fetchApprovedTimesheets(
        formData.employee,
        formData.weekStart,
        formData.weekEnd
      );
    } else {
      setApprovedTimesheets([]);
    }
  }, [formData.employee, formData.weekStart, formData.weekEnd]);

  const fetchEmployees = async () => {
    try {
      const tenantId = localStorage.getItem("tenantId");
      console.log("Fetching employees for tenantId:", tenantId);

      if (!tenantId) {
        console.error("No tenantId found in localStorage");
        return;
      }
      
      const response = await apiClient.get('/api/employees', { tenantId });

      console.log("Employees API response:", response);

      if (response.success && response.employees) {
        console.log(
          "Setting employees:",
          response.employees.length,
          "employees"
        );
        setEmployees(response.employees);
      } else {
        console.warn("No employees data in response");
        setEmployees([]);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      console.error("Error details:", error.response?.data || error.message);
      setEmployees([]);
    }
  };

  const fetchVendors = async () => {
    try {
      const tenantId = localStorage.getItem("tenantId");
      console.log("Fetching vendors for tenantId:", tenantId);

      if (!tenantId) {
        console.error("No tenantId found in localStorage");
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API_BASE}/api/vendors`, {
        params: { tenantId }
      });

      console.log("Vendors API response:", response.data);

      if (response.data.success && response.data.vendors) {
        console.log(
          "Setting vendors:",
          response.data.vendors.length,
          "vendors"
        );
        setVendors(response.data.vendors);
      } else {
        console.warn("No vendors data in response");
        setVendors([]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      console.error("Error details:", error.response?.data || error.message);
      setVendors([]);
      setLoading(false);
    }
  };

  const fetchApprovedTimesheets = async (employeeId, weekStart, weekEnd) => {
    try {
      const tenantId = localStorage.getItem('tenantId');
      const response = await axios.get(`${API_BASE}/api/timesheets/employee/${employeeId}/approved`, {
        params: { tenantId }
      });
      
      if (response.data.success) {
        // Filter timesheets by week range
        const filtered = response.data.timesheets.filter((ts) => {
          return ts.weekStart === weekStart && ts.weekEnd === weekEnd;
        });
        setApprovedTimesheets(filtered);
      }
    } catch (error) {
      console.error("Error fetching approved timesheets:", error);
      setApprovedTimesheets([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (name === "timesheetId" && value) {
      const timesheet = approvedTimesheets.find((ts) => ts.id === value);
      setSelectedTimesheet(timesheet);
    }

    setFormData({
      ...formData,
      [name]:
        type === "checkbox" ? checked : type === "file" ? files[0] : value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const tenantId = localStorage.getItem("tenantId");

      // Calculate invoice details from timesheet if selected
      let lineItems = [];
      let total = 0;
      let weekStart = formData.weekStart;
      let weekEnd = formData.weekEnd;

      if (formData.useTimesheet && selectedTimesheet) {
        const hours = selectedTimesheet.totalHours || 0;
        const rate = selectedTimesheet.hourlyRate || 0;
        total = hours * rate;

        lineItems = [
          {
            description: `Professional Services - ${
              selectedTimesheet.client?.clientName || "Services"
            }`,
            hours: hours,
            rate: rate,
            amount: total},
        ];
      } else {
        total = parseFloat(formData.total) || 0;
        lineItems = [
          {
            description: "Professional Services",
            hours: 0,
            rate: 0,
            amount: total},
        ];
      }

      const invoiceData = {
        tenantId,
        vendorId: formData.vendor || null,
        clientId: selectedTimesheet?.clientId || null,
        employeeId: formData.employee || null,
        timesheetId: formData.timesheetId || null,
        weekStart,
        weekEnd,
        lineItems,
        subtotal: total,
        tax: 0,
        total: total,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        notes: "",
        attachments: formData.file ? [{ name: formData.file.name }] : [],
        quickbooksSync: formData.quickbooksSync};

      console.log('Submitting invoice data:', invoiceData);
      
      const response = await axios.post(`${API_BASE}/api/invoices`, invoiceData);
      
      if (response.data.success) {
        alert("Invoice created successfully!");
        onUpload(); // Refresh the invoice list
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      alert(
        "Failed to create invoice: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content invoice-upload-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h4>Upload New Invoice</h4>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <p>Loading data...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="vendor">Vendor</label>
                <select
                  id="vendor"
                  name="vendor"
                  className="form-control"
                  value={formData.vendor}
                  onChange={handleChange}
                >
                  <option value="">Select Vendor (Optional)</option>
                  {vendors.length === 0 ? (
                    <option disabled>No vendors available</option>
                  ) : (
                    vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))
                  )}
                </select>
                {vendors.length === 0 && !loading && (
                  <small className="form-text text-muted">
                    No vendors found. Add vendors first.
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="employee">Employee</label>
                <select
                  id="employee"
                  name="employee"
                  className="form-control"
                  value={formData.employee}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.length === 0 ? (
                    <option disabled>No employees available</option>
                  ) : (
                    employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </option>
                    ))
                  )}
                </select>
                {employees.length === 0 && !loading && (
                  <small className="form-text text-danger">
                    No employees found. Add employees first.
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="weekStart">Week Start Date</label>
                <input
                  type="date"
                  id="weekStart"
                  name="weekStart"
                  className="form-control"
                  value={formData.weekStart}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="weekEnd">Week End Date</label>
                <input
                  type="date"
                  id="weekEnd"
                  name="weekEnd"
                  className="form-control"
                  value={formData.weekEnd}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="timesheetId">
                  Statement of Work (Approved Timesheets)
                </label>
                <select
                  id="timesheetId"
                  name="timesheetId"
                  className="form-control"
                  value={formData.timesheetId}
                  onChange={handleChange}
                  disabled={
                    !formData.employee ||
                    !formData.weekStart ||
                    !formData.weekEnd ||
                    !formData.useTimesheet
                  }
                >
                  <option value="">Select Approved Timesheet</option>
                  {approvedTimesheets.map((ts) => (
                    <option key={ts.id} value={ts.id}>
                      {ts.client?.clientName || "N/A"} - {ts.totalHours}hrs @ $
                      {ts.hourlyRate}/hr = $
                      {formatCurrency(ts.totalHours * ts.hourlyRate)}
                    </option>
                  ))}
                </select>
                {formData.employee &&
                  formData.weekStart &&
                  formData.weekEnd &&
                  approvedTimesheets.length === 0 && (
                    <small className="form-text text-muted">
                      No approved timesheets found for this employee in the
                      selected week range
                    </small>
                  )}
                {(!formData.employee ||
                  !formData.weekStart ||
                  !formData.weekEnd) && (
                  <small className="form-text text-muted">
                    Please select employee and week range first
                  </small>
                )}
              </div>

              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  id="useTimesheet"
                  name="useTimesheet"
                  className="form-check-input"
                  checked={formData.useTimesheet}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="useTimesheet">
                  Auto-pull hours from approved timesheets
                </label>
              </div>

              {!formData.useTimesheet && (
                <div className="form-group">
                  <label htmlFor="total">Total Amount ($)</label>
                  <input
                    type="number"
                    id="total"
                    name="total"
                    className="form-control"
                    value={formData.total}
                    onChange={handleChange}
                    required={!formData.useTimesheet}
                    min="0"
                    step="0.01"
                    placeholder="Enter invoice total"
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="file">Upload Invoice File (Optional)</label>
                <input
                  type="file"
                  id="file"
                  name="file"
                  className="form-control"
                  onChange={handleChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
                />
                <small className="form-text">
                  Supported formats: PDF, Word, Excel, Images
                </small>
              </div>

              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  id="quickbooksSync"
                  name="quickbooksSync"
                  className="form-check-input"
                  checked={formData.quickbooksSync}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="quickbooksSync">
                  Sync with QuickBooks
                </label>
              </div>
            </form>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit}>
            Upload Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

// Discrepancy Matching Component
const DiscrepancyMatching = ({ discrepancy }) => {
  return (
    <div className="discrepancy-matching">
      <div className="discrepancy-header">
        <h6>
          SOW: {discrepancy.sowName} ({discrepancy.hours} hrs @ $
          {discrepancy.rate}/hr)
        </h6>
      </div>

      <table className="discrepancy-table">
        <thead>
          <tr>
            <th>Source</th>
            <th>Hours</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(discrepancy.sources).map(([source, data], index) => (
            <tr
              key={index}
              className={
                source.toLowerCase() === "mismatch" ? "mismatch-row" : ""
              }
            >
              <td>{source}</td>
              <td>{data.hours}</td>
              <td>{data.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Invoice = () => {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  // Hydration fix: Track if component is mounted on client
  const [isMounted, setIsMounted] = useState(false);
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("invoices");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [invoiceSettings, setInvoiceSettings] = useState(null);
  const [openActionsId, setOpenActionsId] = useState(null);
  const [actionsType, setActionsType] = useState(null);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [selectedInvoiceForPDF, setSelectedInvoiceForPDF] = useState(null);
  
  // New Invoice Details Modal state (from Reports & Analytics)
  const [showNewDetailsModal, setShowNewDetailsModal] = useState(false);
  const [selectedInvoiceForNewDetails, setSelectedInvoiceForNewDetails] = useState(null);
  
  // Edit invoice modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editInvoiceData, setEditInvoiceData] = useState(null);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [timesheetFile, setTimesheetFile] = useState(null);
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successInvoiceData, setSuccessInvoiceData] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Sample discrepancy data
  const discrepancyData = {
    sowName: "Developer (40 hrs @ $40/hr)",
    hours: 40,
    rate: 40,
    sources: {
      Timesheet: { hours: 38, notes: "Submitted by John Doe" },
      Invoice: { hours: 40, notes: "Uploaded by Vendor" },
      Client: { hours: 36, notes: "From SAP dump" },
      Mismatch: { hours: "", notes: "Needs employer review" }}};

  // Hydration fix: Set mounted state on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      console.log('🚀 Invoice component mounted');
      loadInvoiceSettings();
      fetchInvoices();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  // Refetch when filter changes
  useEffect(() => {
    if (filterStatus) {
      console.log('🔄 Filter changed to:', filterStatus);
      fetchInvoices();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  // Load invoice settings
  const loadInvoiceSettings = async () => {
    try {
      const savedSettings = localStorage.getItem("invoiceSettings");
      if (savedSettings) {
        setInvoiceSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error("Error loading invoice settings:", error);
    }
  };

  // Fetch invoices from API (using reports endpoint - exactly like Reports module)
  const fetchInvoices = async () => {
    console.log('🔄 fetchInvoices called');
    try {
      // Get user info from localStorage (EXACTLY like Reports module)
      const userInfoStr = localStorage.getItem("user");
      console.log('📦 Raw user string from localStorage:', userInfoStr ? 'Found' : 'NOT FOUND');
      
      if (!userInfoStr) {
        console.error("❌ No user information found in localStorage");
        console.error("💡 User needs to log in");
        setInvoices([]);
        return;
      }

      const userInfo = JSON.parse(userInfoStr);
      console.log('👤 Parsed user info:', userInfo);
      console.log('🔑 TenantId:', userInfo.tenantId);
      
      if (!userInfo.tenantId) {
        console.error("❌ No tenantId in user info");
        setInvoices([]);
        return;
      }

      // Set date range (last 6 months)
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      const endDate = now;
      
      console.log('📅 Date range:', {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      });

      // Build URL with query params (EXACTLY like Reports module)
      const apiUrl = `${API_BASE}/api/reports/invoices`;
      const queryParams = `tenantId=${userInfo.tenantId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      const fullUrl = `${apiUrl}?${queryParams}`;
      
      console.log('🌐 Full API URL:', fullUrl);

      // Headers (EXACTLY like Reports module)
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`};
      
      console.log('🔐 Headers:', { ...headers, Authorization: 'Bearer [HIDDEN]' });

      // Use fetch (EXACTLY like Reports module)
      console.log('📡 Making fetch request...');
      const response = await fetch(fullUrl, { headers });
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Response data:', data);

      if (data.success && data.data) {
        const invoiceData = data.data;
        console.log('✅ API Success! Invoices count:', invoiceData.length);
        console.log('📦 Received invoices:', invoiceData);
        
        if (invoiceData.length === 0) {
          console.warn('⚠️ No invoices in response');
          setInvoices([]);
          return;
        }
        
        // Format invoices
        const formattedInvoices = invoiceData.map((inv, index) => {
          console.log(`🔄 Formatting invoice ${index + 1}:`, inv.invoiceNumber);
          
          // Calculate week from invoice date
          const invoiceDate = new Date(inv.issueDate || inv.createdAt);
          const weekStart = new Date(invoiceDate);
          weekStart.setDate(invoiceDate.getDate() - invoiceDate.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          const week = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}`;
          
          return {
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            vendor: inv.clientName || 'N/A',
            week: week,
            issueDate: inv.issueDate || inv.createdAt,
            createdAt: inv.createdAt,
            total: parseFloat(inv.amount) || 0,
            status: inv.status || 'Draft',
            lineItems: [],
            attachments: [],
            discrepancies: null,
            notes: '',
            hours: inv.totalHours || 0};
        });
        
        console.log('✅ Formatted invoices:', formattedInvoices);
        console.log('📊 Setting', formattedInvoices.length, 'invoices to state');
        setInvoices(formattedInvoices);
      } else {
        console.warn('⚠️ API returned success:false or no data');
        console.log('Full response:', data);
        setInvoices([]);
      }
    } catch (error) {
      console.error("❌ Error fetching invoices:", error);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);
      setInvoices([]);
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesStatus =
      filterStatus === "all" ||
      invoice.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.vendor.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  // Pagination handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm]);

  const handleViewInvoice = async (invoice) => {
    try {
      const tenantId = JSON.parse(localStorage.getItem("user"))?.tenantId;
      const token = localStorage.getItem("token");
      
      console.log('📥 Fetching complete invoice details for viewing:', invoice.id);
      
      // Fetch full invoice details including employee and vendor data from backend
      const response = await fetch(
        `${API_BASE}/api/invoices/${invoice.id}?tenantId=${tenantId}`,
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
            ...invoice,
            ...inv,
            employeeName: employeeName,
            employeeEmail: employeeEmail,
            employee: inv.employee,
            vendor: inv.vendor,
            timesheet: inv.timesheet,
            client: inv.client
          };
          
          console.log('📋 Opening view modal with complete data:', fullInvoice);
          setSelectedInvoiceForNewDetails(fullInvoice);
          setShowNewDetailsModal(true);
        } else {
          console.warn('API returned success:false, using original invoice data');
          setSelectedInvoiceForNewDetails(invoice);
          setShowNewDetailsModal(true);
        }
      } else {
        console.error('Failed to fetch invoice details:', response.status);
        // Fallback to original invoice data
        setSelectedInvoiceForNewDetails(invoice);
        setShowNewDetailsModal(true);
      }
    } catch (error) {
      console.error("Error fetching invoice details for viewing:", error);
      // Fallback to original invoice data
      setSelectedInvoiceForNewDetails(invoice);
      setShowNewDetailsModal(true);
    }
  };

  const toggleActions = (invoiceId, type = 'invoice') => {
    if (openActionsId === invoiceId && actionsType === type) {
      setOpenActionsId(null);
      setActionsType(null);
    } else {
      setOpenActionsId(invoiceId);
      setActionsType(type);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openActionsId) {
        setOpenActionsId(null);
        setActionsType(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openActionsId]);

  const handleApproveInvoice = (invoiceId, notes) => {
    setInvoices(
      invoices.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: "Approved", notes } : inv
      )
    );
    setShowDetailModal(false);
  };

  const handleRejectInvoice = (invoiceId, notes) => {
    setInvoices(
      invoices.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: "Rejected", notes } : inv
      )
    );
    setShowDetailModal(false);
  };

  const handleUploadInvoice = () => {
    // Refresh invoice list after upload
    fetchInvoices();
    setShowUploadModal(false);
  };

  // Fetch full invoice details before opening PDF modal
  const handleDownloadInvoice = async (invoice) => {
    try {
      const tenantId = JSON.parse(localStorage.getItem("user"))?.tenantId;
      const token = localStorage.getItem("token");
      
      console.log('Fetching full invoice details for:', invoice.id);
      
      // Fetch full invoice details from backend
      const response = await fetch(
        `${API_BASE}/api/invoices/${invoice.id}?tenantId=${tenantId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('Full invoice data:', data);
        
        if (data.success && data.invoice) {
          // Merge the full invoice data with the existing invoice
          const fullInvoice = {
            ...invoice,
            ...data.invoice,
            lineItems: data.invoice.lineItems || [],
            clientName: data.invoice.clientName || invoice.vendor,
            vendorName: data.invoice.vendorName || invoice.vendor
          };
          
          setSelectedInvoiceForPDF(fullInvoice);
          setShowPDFModal(true);
        } else {
          // If API fails, use the basic invoice data
          setSelectedInvoiceForPDF(invoice);
          setShowPDFModal(true);
        }
      } else {
        // If API fails, use the basic invoice data
        console.warn('Failed to fetch full invoice details, using basic data');
        setSelectedInvoiceForPDF(invoice);
        setShowPDFModal(true);
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      // If error, use the basic invoice data
      setSelectedInvoiceForPDF(invoice);
      setShowPDFModal(true);
    } finally {
      setOpenActionsId(null);
      setActionsType(null);
    }
  };

  // Check if invoice settings are configured
  const isInvoiceSettingsConfigured = () => {
    if (!invoiceSettings) return false;

    // Check required company info
    if (
      !invoiceSettings.companyInfo?.companyName ||
      !invoiceSettings.companyInfo?.address ||
      !invoiceSettings.companyInfo?.email
    ) {
      return false;
    }

    // Check required invoice setup
    if (
      !invoiceSettings.invoiceSetup?.invoicePrefix ||
      !invoiceSettings.invoiceSetup?.defaultPaymentTerms
    ) {
      return false;
    }

    return true;
  };

  // Handle create invoice button click
  const handleCreateInvoice = () => {
    if (!isInvoiceSettingsConfigured()) {
      setShowSettingsModal(true);
    } else {
      setShowUploadModal(true);
    }
  };

  // Prevent hydration mismatch - don't render until mounted
  if (!isMounted) {
    return (
      <div className="nk-conten">
        <div className="container-flui">
          <div className="nk-content-innr">
            <div className="nk-content-body">
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div className="spinner-border text-primary" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nk-conten">
      <div className="container-flui">
        <div className="nk-content-innr">
          <div className="nk-content-body">
            <div className="nk-block-head nk-block-head-sm">
              <div className="nk-block-between">
                <div className="nk-block-head-content">
                  <h3 className="nk-block-title page-title">
                    Invoice Management
                  </h3>
                  <div className="nk-block-des text-soft">
                    <p>Manage and track all vendor invoices</p>
                  </div>
                </div>

                <div className="nk-block-head-content">
                  <div className="toggle-wrap nk-block-tools-toggle">
                    <ul className="nk-block-tools g-3">
                      <li>
                        <button
                          className="btn btn-primary"
                          onClick={handleCreateInvoice}
                        >
                          <em className="icon ni ni-plus"></em>
                          <span>Create Invoice</span>
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Summary Cards in Header */}
              <div className="row g-gs" style={{ marginTop: '24px' }}>
                {/* Total Invoiced Card */}
                <div className="col-md-4">
                  <div className="card card-bordered invoice-summary-card-header">
                    <div className="card-inner">
                      <div className="summary-header-content">
                        <div className="summary-header-label">Total Invoiced</div>
                        <div className="summary-header-value">
                          ${invoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="summary-header-period">This Month</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payments Received Card */}
                <div className="col-md-4">
                  <div className="card card-bordered invoice-summary-card-header">
                    <div className="card-inner">
                      <div className="summary-header-content">
                        <div className="summary-header-label">Payments Received</div>
                        <div className="summary-header-value">
                          ${invoices.filter(inv => inv.status.toLowerCase() === 'paid').reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="summary-header-period">This Month</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Outstanding Amount Card */}
                <div className="col-md-4">
                  <div className="card card-bordered invoice-summary-card-header">
                    <div className="card-inner">
                      <div className="summary-header-content">
                        <div className="summary-header-label">Outstanding Amount</div>
                        <div className="summary-header-value">
                          ${invoices.filter(inv => inv.status.toLowerCase() !== 'paid').reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="summary-header-period">Total</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="nk-block">
              <div className="card card-bordered card-stretch">
                <div className="card-inner-group">
                  <div className="card-inner position-relative">
                    <div className="card-title-group">
                      <div className="card-tools">
                        <ul className="nav nav-tabs">
                          <li className="nav-item">
                            <button
                              className={`nav-link ${
                                activeTab === "invoices" ? "active" : ""
                              }`}
                              onClick={() => setActiveTab("invoices")}
                            >
                              Invoices
                            </button>
                          </li>
                          <li className="nav-item">
                            <button
                              className={`nav-link ${
                                activeTab === "discrepancies" ? "active" : ""
                              }`}
                              onClick={() => setActiveTab("discrepancies")}
                            >
                              Discrepancies
                            </button>
                          </li>
                        </ul>
                      </div>

                      <div className="card-tools mr-n1">
                        <ul className="btn-toolbar gx-1">
                          <li>
                            <div className="form-group">
                              <div className="form-control-wrap">
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  placeholder="Search..."
                                  value={searchTerm}
                                  onChange={(e) =>
                                    setSearchTerm(e.target.value)
                                  }
                                />
                              </div>
                            </div>
                          </li>
                          <li>
                            <div className="form-group">
                              <select
                                className="form-select form-select-sm"
                                value={filterStatus}
                                onChange={(e) =>
                                  setFilterStatus(e.target.value)
                                }
                              >
                                <option value="all">All Status</option>
                                <option value="draft">Draft</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="sent">Sent</option>
                                <option value="paid">Paid</option>
                              </select>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {activeTab === "invoices" ? (
                    <div className="card-inner p-0">
                      <div className="nk-tb-list nk-tb-orders">
                        <div className="nk-tb-item nk-tb-head">
                          <div className="nk-tb-col">
                            <span>Invoice #</span>
                          </div>
                          <div className="nk-tb-col tb-col-md">
                            <span>Vendor</span>
                          </div>
                          <div className="nk-tb-col tb-col-md">
                            <span>Week</span>
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
                            <span className="sub-text">ACTIONS</span>
                          </div>
                        </div>

                        {paginatedInvoices.length > 0 ? (
                          paginatedInvoices.map((invoice) => (
                            <div key={invoice.id} className={`nk-tb-item ${openActionsId === invoice.id && actionsType === 'invoice' ? 'dropdown-open' : ''}`}>
                              <div className="nk-tb-col">
                                <span className="tb-lead">
                                  {invoice.invoiceNumber}
                                </span>
                              </div>
                              <div className="nk-tb-col tb-col-md">
                                <span>{invoice.vendor}</span>
                              </div>
                              <div className="nk-tb-col tb-col-md">
                                <span>{invoice.week}</span>
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
                                <span>{invoice.hours || 0}</span>
                              </div>
                              <div className="nk-tb-col">
                                <span className="tb-amount">
                                  ${invoice.total.toLocaleString()}
                                </span>
                              </div>
                              <div className="nk-tb-col">
                                <span
                                  className={`badge bg-outline-${
                                    invoice.status === "Paid" || invoice.status === "Active"
                                      ? "success"
                                      : invoice.status === "Pending"
                                      ? "warning"
                                      : "secondary"
                                  }`}
                                >
                                  {invoice.status}
                                </span>
                              </div>
                              <div className="nk-tb-col nk-tb-col-tools">
                                <div className="dropdown" style={{ position: 'relative' }}>
                                  <button
                                    className="btn btn-sm btn-outline-secondary dropdown-toggle"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleActions(invoice.id, 'invoice');
                                    }}
                                    type="button"
                                    ref={(el) => {
                                      if (el && openActionsId === invoice.id) {
                                        const rect = el.getBoundingClientRect();
                                        const spaceBelow = window.innerHeight - rect.bottom;
                                        if (spaceBelow < 200) {
                                          el.nextElementSibling?.classList.add('dropup');
                                        }
                                      }
                                    }}
                                  >
                                    Actions
                                  </button>
                                  {openActionsId === invoice.id && actionsType === 'invoice' && (
                                    <div className="dropdown-menu dropdown-menu-right show">
                                      <button
                                        className="dropdown-item"
                                        onClick={() => {
                                          handleViewInvoice(invoice);
                                          setOpenActionsId(null);
                                          setActionsType(null);
                                        }}
                                      >
                                        <i className="fas fa-eye mr-1"></i> View Details
                                      </button>
                                      <button
                                        className="dropdown-item"
                                        onClick={async () => {
                                          try {
                                            const tenantId = JSON.parse(localStorage.getItem("user"))?.tenantId;
                                            const token = localStorage.getItem("token");
                                            
                                            console.log('📥 Fetching complete invoice details for editing:', invoice.id);
                                            
                                            // Fetch full invoice details including timesheet data from backend
                                            const response = await fetch(
                                              `${API_BASE}/api/invoices/${invoice.id}?tenantId=${tenantId}`,
                                              {
                                                headers: {
                                                  'Authorization': `Bearer ${token}`,
                                                  'Content-Type': 'application/json'
                                                }
                                              }
                                            );
                                            
                                            if (response.ok) {
                                              const data = await response.json();
                                              console.log('✅ Full invoice data fetched:', data);
                                              
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
                                                
                                                // Extract vendor data from multiple sources
                                                const vendorName = inv.vendor?.name 
                                                  || inv.employee?.vendor?.name
                                                  || inv.timesheet?.employee?.vendor?.name
                                                  || (typeof inv.vendor === 'string' ? inv.vendor : 'N/A');
                                                
                                                const vendorEmail = inv.vendor?.email 
                                                  || inv.employee?.vendor?.email
                                                  || inv.timesheet?.employee?.vendor?.email
                                                  || 'N/A';
                                                
                                                // Merge full invoice data with existing invoice
                                                const fullInvoice = {
                                                  ...invoice,
                                                  ...inv,
                                                  lineItems: inv.lineItems || [],
                                                  employeeName: employeeName,
                                                  employeeEmail: employeeEmail,
                                                  vendor: vendorName,
                                                  vendorContact: vendorEmail,
                                                  week: inv.week || invoice.week,
                                                  notes: inv.notes || '',
                                                  companyLogo: inv.companyLogo || null,
                                                  timesheetFile: inv.timesheetFile || null,
                                                  timesheetFileName: inv.timesheetFileName || null,
                                                  // Store IDs for backend updates
                                                  employeeId: inv.employeeId || inv.employee?.id || inv.timesheet?.employeeId,
                                                  vendorId: inv.vendorId || inv.vendor?.id || inv.employee?.vendor?.id,
                                                  clientId: inv.clientId || inv.client?.id
                                                };
                                                
                                                // Ensure line items have proper structure
                                                fullInvoice.lineItems = fullInvoice.lineItems.map(item => ({
                                                  ...item,
                                                  description: item.description || 'Service',
                                                  hours: parseFloat(item.hours || item.quantity || 0),
                                                  rate: parseFloat(item.rate || item.hourlyRate || 0),
                                                  amount: parseFloat(item.amount || (item.hours * item.rate) || 0)
                                                }));
                                                
                                                console.log('📝 Opening edit modal with data:', fullInvoice);
                                                setEditInvoiceData(fullInvoice);
                                                setEditModalOpen(true);
                                              } else {
                                                console.error('API returned success:false or no invoice data');
                                                alert('Failed to fetch invoice details. Opening with available data.');
                                                setEditInvoiceData(invoice);
                                                setEditModalOpen(true);
                                              }
                                            } else {
                                              console.error('Failed to fetch invoice details:', response.status);
                                              alert('Failed to fetch complete invoice details. Opening with available data.');
                                              setEditInvoiceData(invoice);
                                              setEditModalOpen(true);
                                            }
                                          } catch (error) {
                                            console.error("Error fetching invoice details:", error);
                                            alert('An error occurred. Opening with available data.');
                                            setEditInvoiceData(invoice);
                                            setEditModalOpen(true);
                                          } finally {
                                            setOpenActionsId(null);
                                            setActionsType(null);
                                          }
                                        }}
                                      >
                                        <i className="fas fa-edit mr-1"></i> Edit Invoice
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="nk-tb-item">
                            <div className="" colSpan="">
                              <div className="empty-state">
                                <p>No invoices found matching your criteria.</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Pagination - Employee Module Style */}
                      {filteredInvoices.length > 0 && (
                        <div className="card-inner">
                          <div className="invoice-pagination">
                            <div className="pagination-info">
                              Showing {startIndex + 1} to {Math.min(endIndex, filteredInvoices.length)} of {filteredInvoices.length} invoices
                            </div>
                            <div className="pagination-controls">
                              <button
                                className="btn btn-sm btn-outline-light"
                                onClick={handlePreviousPage}
                                disabled={currentPage === 1}
                              >
                                <em className="icon ni ni-chevron-left"></em> Previous
                              </button>
                              
                              {/* Page Numbers */}
                              <ul className="pagination-numbers">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                  <li key={page}>
                                    <button
                                      className={`page-number ${currentPage === page ? 'active' : ''}`}
                                      onClick={() => setCurrentPage(page)}
                                    >
                                      {page}
                                    </button>
                                  </li>
                                ))}
                              </ul>

                              <button
                                className="btn btn-sm btn-outline-light"
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                              >
                                Next <em className="icon ni ni-chevron-right"></em>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="">
                      <div className="">
                        <div className="">
                          <DiscrepancyMatching discrepancy={discrepancyData} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setShowDetailModal(false)}
          onApprove={handleApproveInvoice}
          onReject={handleRejectInvoice}
        />
      )}

      {/* Invoice Upload Modal */}
      {showUploadModal && (
        <InvoiceUploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUploadInvoice}
        />
      )}

      {/* Invoice Settings Modal */}
      {showSettingsModal && (
        <InvoiceSettingsModal
          onClose={() => setShowSettingsModal(false)}
          onCreateAnyway={() => {
            setShowSettingsModal(false);
            setShowUploadModal(true);
          }}
        />
      )}

      {/* Invoice PDF Preview Modal */}
      {showPDFModal && selectedInvoiceForPDF && (
        <InvoicePDFPreviewModal
          invoice={selectedInvoiceForPDF}
          onClose={() => {
            setShowPDFModal(false);
            setSelectedInvoiceForPDF(null);
          }}
        />
      )}

      {/* New Invoice Details Modal - Replicated from Reports & Analytics */}
      {showNewDetailsModal && selectedInvoiceForNewDetails && (
        <InvoiceDetailsModal
          invoice={selectedInvoiceForNewDetails}
          onClose={() => {
            setShowNewDetailsModal(false);
            setSelectedInvoiceForNewDetails(null);
          }}
        />
      )}

      {/* Invoice Preview & Edit Modal - From Reports & Analytics */}
      {editModalOpen && editInvoiceData && (
        <InvoicePDFPreviewModal
          invoice={editInvoiceData}
          onClose={() => {
            setEditModalOpen(false);
            setEditInvoiceData(null);
          }}
          onUpdate={(updatedInvoice) => {
            // Show success modal after saving
            setSuccessInvoiceData(updatedInvoice);
            setShowSuccessModal(true);
            setEditModalOpen(false);
            // Refresh invoices list
            fetchInvoices();
          }}
        />
      )}

      {/* Old Edit Invoice Modal - REMOVED - Replaced with InvoicePDFPreviewModal above */}
      {false && editModalOpen && editInvoiceData && (
        <div className="invoice-modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="invoice-modal-content modern-edit-modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '1400px', width: '98%', maxHeight: '95vh', overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
            {/* Modern Header with Gradient */}
            <div className="invoice-modal-header" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '24px 32px', borderRadius: '12px 12px 0 0'}}>
              <div className="invoice-modal-title" style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                <div style={{background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <em className="icon ni ni-file-docs" style={{fontSize: '28px', color: '#ffffff'}}></em>
                </div>
                <div>
                  <h3 style={{margin: 0, fontSize: '24px', fontWeight: '600', color: '#ffffff'}}>Edit Invoice</h3>
                  <p style={{margin: '4px 0 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.9)'}}>{editInvoiceData.invoiceNumber}</p>
                </div>
              </div>
              <button 
                className="invoice-modal-close"
                onClick={() => setEditModalOpen(false)}
                title="Close"
                style={{background: 'rgba(255,255,255,0.2)', border: 'none', color: '#ffffff', fontSize: '28px', width: '40px', height: '40px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s'}}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
              >
                ×
              </button>
            </div>
            
            <div className="edit-invoice-modal-body" style={{flex: 1, overflowY: 'auto', padding: '32px', background: '#f8f9fa'}}>
              
              {/* Upload Section - Employer Logo & Timesheet */}
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px'}}>
                {/* Employer Logo Upload */}
                <div style={{background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '2px dashed #e0e0e0', transition: 'all 0.3s'}}
                     onMouseEnter={(e) => e.currentTarget.style.borderColor = '#667eea'}
                     onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
                    <div style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '10px', borderRadius: '10px', display: 'flex'}}>
                      <em className="icon ni ni-building" style={{fontSize: '20px', color: '#ffffff'}}></em>
                    </div>
                    <div>
                      <h4 style={{margin: 0, fontSize: '16px', fontWeight: '600', color: '#2c3e50'}}>Employer Logo</h4>
                      <p style={{margin: '2px 0 0 0', fontSize: '13px', color: '#7f8c8d'}}>Company branding for invoice</p>
                    </div>
                  </div>
                  <div style={{position: 'relative', textAlign: 'center', padding: '32px 16px', background: '#f8f9fa', borderRadius: '12px', cursor: 'pointer'}}
                       onClick={() => document.getElementById('logoUpload').click()}>
                    <input
                      id="logoUpload"
                      type="file"
                      accept="image/*"
                      style={{display: 'none'}}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setCompanyLogo(file);
                        }
                      }}
                    />
                    {!companyLogo ? (
                      <>
                        <em className="icon ni ni-upload-cloud" style={{fontSize: '48px', color: '#667eea', marginBottom: '12px', display: 'block'}}></em>
                        <p style={{margin: 0, fontSize: '14px', fontWeight: '500', color: '#2c3e50'}}>Click to upload logo</p>
                        <p style={{margin: '4px 0 0 0', fontSize: '12px', color: '#95a5a6'}}>PNG, JPG up to 5MB</p>
                      </>
                    ) : (
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'}}>
                        <em className="icon ni ni-check-circle" style={{fontSize: '32px', color: '#27ae60'}}></em>
                        <div style={{textAlign: 'left'}}>
                          <p style={{margin: 0, fontSize: '14px', fontWeight: '500', color: '#27ae60'}}>Logo uploaded</p>
                          <p style={{margin: '2px 0 0 0', fontSize: '12px', color: '#7f8c8d'}}>{companyLogo.name}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timesheet Upload */}
                <div style={{background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '2px dashed #e0e0e0', transition: 'all 0.3s'}}
                     onMouseEnter={(e) => e.currentTarget.style.borderColor = '#667eea'}
                     onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
                    <div style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '10px', borderRadius: '10px', display: 'flex'}}>
                      <em className="icon ni ni-file-text" style={{fontSize: '20px', color: '#ffffff'}}></em>
                    </div>
                    <div>
                      <h4 style={{margin: 0, fontSize: '16px', fontWeight: '600', color: '#2c3e50'}}>Timesheet Document</h4>
                      <p style={{margin: '2px 0 0 0', fontSize: '13px', color: '#7f8c8d'}}>Upload timesheet file</p>
                    </div>
                  </div>
                  <div style={{position: 'relative', textAlign: 'center', padding: '32px 16px', background: '#f8f9fa', borderRadius: '12px', cursor: 'pointer'}}
                       onClick={() => document.getElementById('timesheetUpload').click()}>
                    <input
                      id="timesheetUpload"
                      type="file"
                      accept=".pdf,.xlsx,.xls,.csv"
                      style={{display: 'none'}}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setTimesheetFile(file);
                        }
                      }}
                    />
                    {!timesheetFile ? (
                      <>
                        <em className="icon ni ni-upload" style={{fontSize: '48px', color: '#667eea', marginBottom: '12px', display: 'block'}}></em>
                        <p style={{margin: 0, fontSize: '14px', fontWeight: '500', color: '#2c3e50'}}>Click to upload timesheet</p>
                        <p style={{margin: '4px 0 0 0', fontSize: '12px', color: '#95a5a6'}}>PDF, Excel, CSV files</p>
                      </>
                    ) : (
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'}}>
                        <em className="icon ni ni-check-circle" style={{fontSize: '32px', color: '#27ae60'}}></em>
                        <div style={{textAlign: 'left'}}>
                          <p style={{margin: 0, fontSize: '14px', fontWeight: '500', color: '#27ae60'}}>Timesheet uploaded</p>
                          <p style={{margin: '2px 0 0 0', fontSize: '12px', color: '#7f8c8d'}}>{timesheetFile.name}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Employee & Vendor Details Section */}
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px'}}>
                {/* Employee Details */}
                <div style={{background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #f0f0f0'}}>
                    <div style={{background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', padding: '10px', borderRadius: '10px', display: 'flex'}}>
                      <em className="icon ni ni-user" style={{fontSize: '20px', color: '#ffffff'}}></em>
                    </div>
                    <h4 style={{margin: 0, fontSize: '16px', fontWeight: '600', color: '#2c3e50'}}>Employee Details</h4>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                    <div>
                      <label style={{display: 'block', fontSize: '12px', fontWeight: '600', color: '#7f8c8d', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Employee Name</label>
                      <input
                        type="text"
                        style={{width: '100%', padding: '12px 16px', border: '2px solid #e8e8e8', borderRadius: '10px', fontSize: '14px', fontWeight: '500', color: '#2c3e50', transition: 'all 0.3s'}}
                        value={editInvoiceData.employeeName || 'N/A'}
                        onChange={(e) => setEditInvoiceData({...editInvoiceData, employeeName: e.target.value})}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
                      />
                    </div>
                    <div>
                      <label style={{display: 'block', fontSize: '12px', fontWeight: '600', color: '#7f8c8d', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Employee Email</label>
                      <input
                        type="email"
                        style={{width: '100%', padding: '12px 16px', border: '2px solid #e8e8e8', borderRadius: '10px', fontSize: '14px', color: '#2c3e50', transition: 'all 0.3s'}}
                        value={editInvoiceData.employeeEmail || 'N/A'}
                        onChange={(e) => setEditInvoiceData({...editInvoiceData, employeeEmail: e.target.value})}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
                      />
                    </div>
                  </div>
                </div>

                {/* Vendor Details */}
                <div style={{background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #f0f0f0'}}>
                    <div style={{background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', padding: '10px', borderRadius: '10px', display: 'flex'}}>
                      <em className="icon ni ni-briefcase" style={{fontSize: '20px', color: '#ffffff'}}></em>
                    </div>
                    <h4 style={{margin: 0, fontSize: '16px', fontWeight: '600', color: '#2c3e50'}}>Vendor Details</h4>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                    <div>
                      <label style={{display: 'block', fontSize: '12px', fontWeight: '600', color: '#7f8c8d', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Vendor Name</label>
                      <input
                        type="text"
                        style={{width: '100%', padding: '12px 16px', border: '2px solid #e8e8e8', borderRadius: '10px', fontSize: '14px', fontWeight: '500', color: '#2c3e50', transition: 'all 0.3s'}}
                        value={editInvoiceData.vendor || ''}
                        onChange={(e) => setEditInvoiceData({...editInvoiceData, vendor: e.target.value})}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
                      />
                    </div>
                    <div>
                      <label style={{display: 'block', fontSize: '12px', fontWeight: '600', color: '#7f8c8d', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Vendor Contact</label>
                      <input
                        type="text"
                        style={{width: '100%', padding: '12px 16px', border: '2px solid #e8e8e8', borderRadius: '10px', fontSize: '14px', color: '#2c3e50', transition: 'all 0.3s'}}
                        value={editInvoiceData.vendorContact || 'N/A'}
                        onChange={(e) => setEditInvoiceData({...editInvoiceData, vendorContact: e.target.value})}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Information Section */}
              <div style={{background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: '32px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #f0f0f0'}}>
                  <div style={{background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)', padding: '10px', borderRadius: '10px', display: 'flex'}}>
                    <em className="icon ni ni-file-docs" style={{fontSize: '20px', color: '#ffffff'}}></em>
                  </div>
                  <h4 style={{margin: 0, fontSize: '16px', fontWeight: '600', color: '#2c3e50'}}>Invoice Information</h4>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px'}}>
                  <div>
                    <label style={{display: 'block', fontSize: '12px', fontWeight: '600', color: '#7f8c8d', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Invoice Number</label>
                    <input
                      type="text"
                      style={{width: '100%', padding: '12px 16px', border: '2px solid #e8e8e8', borderRadius: '10px', fontSize: '14px', fontWeight: '600', color: '#2c3e50', transition: 'all 0.3s'}}
                      value={editInvoiceData.invoiceNumber || ''}
                      onChange={(e) => setEditInvoiceData({...editInvoiceData, invoiceNumber: e.target.value})}
                      onFocus={(e) => e.target.style.borderColor = '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: '12px', fontWeight: '600', color: '#7f8c8d', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Issue Date</label>
                    <input
                      type="date"
                      style={{width: '100%', padding: '12px 16px', border: '2px solid #e8e8e8', borderRadius: '10px', fontSize: '14px', color: '#2c3e50', transition: 'all 0.3s'}}
                      value={editInvoiceData.issueDate ? new Date(editInvoiceData.issueDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditInvoiceData({...editInvoiceData, issueDate: e.target.value})}
                      onFocus={(e) => e.target.style.borderColor = '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: '12px', fontWeight: '600', color: '#7f8c8d', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Status</label>
                    <select
                      style={{width: '100%', padding: '12px 16px', border: '2px solid #e8e8e8', borderRadius: '10px', fontSize: '14px', fontWeight: '500', color: '#2c3e50', transition: 'all 0.3s', cursor: 'pointer'}}
                      value={editInvoiceData.status || 'Draft'}
                      onChange={(e) => setEditInvoiceData({...editInvoiceData, status: e.target.value})}
                      onFocus={(e) => e.target.style.borderColor = '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Sent">Sent</option>
                      <option value="Paid">Paid</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: '12px', fontWeight: '600', color: '#7f8c8d', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Total Hours (Auto-calculated)</label>
                    <div
                      style={{width: '100%', padding: '12px 16px', border: '2px solid #e8e8e8', borderRadius: '10px', fontSize: '16px', fontWeight: '600', color: '#3498db', background: '#eff6ff'}}
                    >
                      {formatCurrency(editInvoiceData.hours || 0)} hrs
                    </div>
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: '12px', fontWeight: '600', color: '#7f8c8d', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Total Amount (Auto-calculated)</label>
                    <div
                      style={{width: '100%', padding: '12px 16px', border: '2px solid #e8e8e8', borderRadius: '10px', fontSize: '18px', fontWeight: '700', color: '#27ae60', background: '#f0fdf4'}}
                    >
                      ${formatCurrency(editInvoiceData.total || 0)}
                    </div>
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: '12px', fontWeight: '600', color: '#7f8c8d', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Timesheet Period</label>
                    <input
                      type="text"
                      style={{width: '100%', padding: '12px 16px', border: '2px solid #e8e8e8', borderRadius: '10px', fontSize: '14px', color: '#2c3e50', transition: 'all 0.3s'}}
                      value={editInvoiceData.week || 'N/A'}
                      onChange={(e) => setEditInvoiceData({...editInvoiceData, week: e.target.value})}
                      onFocus={(e) => e.target.style.borderColor = '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
                      placeholder="e.g., Nov 02 - Nov 08"
                    />
                  </div>
                </div>
              </div>

              {/* Timesheet Details / Line Items Section - Modern Table */}
              <div style={{background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: '32px'}}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #f0f0f0'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={{background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)', padding: '10px', borderRadius: '10px', display: 'flex'}}>
                      <em className="icon ni ni-list-check" style={{fontSize: '20px', color: '#ffffff'}}></em>
                    </div>
                    <div>
                      <h4 style={{margin: 0, fontSize: '16px', fontWeight: '600', color: '#2c3e50'}}>Timesheet Details</h4>
                      <p style={{margin: '2px 0 0 0', fontSize: '13px', color: '#7f8c8d'}}>Work hours and billing information</p>
                    </div>
                  </div>
                  <button
                    style={{padding: '10px 20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'}}
                    onClick={() => {
                      const newItems = [
                        ...(editInvoiceData.lineItems || []),
                        { description: 'Extra Hours', hours: 0, rate: 0, amount: 0 }
                      ];
                      setEditInvoiceData({...editInvoiceData, lineItems: newItems});
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    <em className="icon ni ni-plus-circle" style={{fontSize: '18px'}}></em>
                    Add Extra Hours
                  </button>
                </div>
                
                <div style={{overflowX: 'auto'}}>
                  <table style={{width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px'}}>
                    <thead>
                      <tr style={{background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'}}>
                        <th style={{padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '0.5px', borderRadius: '10px 0 0 10px'}}>Description</th>
                        <th style={{padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Hours</th>
                        <th style={{padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Rate ($/hr)</th>
                        <th style={{padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Amount</th>
                        <th style={{padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '0.5px', borderRadius: '0 10px 10px 0'}}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(editInvoiceData.lineItems || []).map((item, index) => (
                        <tr key={index} style={{background: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'all 0.3s'}}
                            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'}
                            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}>
                          <td style={{padding: '16px', borderRadius: '10px 0 0 10px'}}>
                            <input
                              type="text"
                              value={item.description || ''}
                              onChange={(e) => {
                                const newItems = [...editInvoiceData.lineItems];
                                newItems[index].description = e.target.value;
                                setEditInvoiceData({...editInvoiceData, lineItems: newItems});
                              }}
                              style={{width: '100%', padding: '10px 14px', border: '2px solid #e8e8e8', borderRadius: '8px', fontSize: '14px', color: '#2c3e50', transition: 'all 0.3s'}}
                              onFocus={(e) => e.target.style.borderColor = '#667eea'}
                              onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
                              placeholder="Enter description..."
                            />
                          </td>
                          <td style={{padding: '16px', textAlign: 'center'}}>
                            <input
                              type="number"
                              step="0.01"
                              value={item.hours || item.quantity || 0}
                              onChange={(e) => {
                                const newItems = [...editInvoiceData.lineItems];
                                const newHours = parseFloat(e.target.value) || 0;
                                newItems[index].hours = newHours;
                                newItems[index].quantity = newHours;
                                const rate = parseFloat(newItems[index].rate || 0);
                                newItems[index].amount = newHours * rate;
                                
                                // Recalculate total amount and total hours
                                const newTotal = newItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                                const newTotalHours = newItems.reduce((sum, item) => sum + (parseFloat(item.hours || item.quantity) || 0), 0);
                                
                                setEditInvoiceData({
                                  ...editInvoiceData, 
                                  lineItems: newItems,
                                  total: newTotal,
                                  totalAmount: newTotal,
                                  hours: newTotalHours
                                });
                              }}
                              style={{width: '100px', padding: '10px 14px', border: '2px solid #e8e8e8', borderRadius: '8px', fontSize: '14px', color: '#2c3e50', textAlign: 'center', transition: 'all 0.3s'}}
                              onFocus={(e) => e.target.style.borderColor = '#667eea'}
                              onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
                            />
                          </td>
                          <td style={{padding: '16px', textAlign: 'center'}}>
                            <input
                              type="number"
                              step="0.01"
                              value={item.rate || 0}
                              onChange={(e) => {
                                const newItems = [...editInvoiceData.lineItems];
                                const newRate = parseFloat(e.target.value) || 0;
                                newItems[index].rate = newRate;
                                const hours = parseFloat(newItems[index].hours || newItems[index].quantity || 0);
                                newItems[index].amount = hours * newRate;
                                
                                // Recalculate total amount and total hours
                                const newTotal = newItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                                const newTotalHours = newItems.reduce((sum, item) => sum + (parseFloat(item.hours || item.quantity) || 0), 0);
                                
                                setEditInvoiceData({
                                  ...editInvoiceData, 
                                  lineItems: newItems,
                                  total: newTotal,
                                  totalAmount: newTotal,
                                  hours: newTotalHours
                                });
                              }}
                              style={{width: '120px', padding: '10px 14px', border: '2px solid #e8e8e8', borderRadius: '8px', fontSize: '14px', color: '#2c3e50', textAlign: 'center', transition: 'all 0.3s'}}
                              onFocus={(e) => e.target.style.borderColor = '#667eea'}
                              onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
                            />
                          </td>
                          <td style={{padding: '16px', textAlign: 'center'}}>
                            <div style={{padding: '10px 14px', background: '#f8f9fa', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#27ae60'}}>
                              ${formatCurrency(item.amount)}
                            </div>
                          </td>
                          <td style={{padding: '16px', textAlign: 'center', borderRadius: '0 10px 10px 0'}}>
                            <button
                              onClick={() => {
                                const newItems = editInvoiceData.lineItems.filter((_, i) => i !== index);
                                setEditInvoiceData({...editInvoiceData, lineItems: newItems});
                              }}
                              style={{padding: '8px 16px', background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto'}}
                              onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.05)';
                                e.target.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.boxShadow = 'none';
                              }}
                            >
                              <em className="icon ni ni-trash" style={{fontSize: '14px'}}></em>
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Total Summary */}
                <div style={{marginTop: '24px', padding: '20px', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', borderRadius: '12px', display: 'flex', justifyContent: 'flex-end'}}>
                  <div style={{textAlign: 'right'}}>
                    <p style={{margin: '0 0 8px 0', fontSize: '14px', color: '#7f8c8d', fontWeight: '600'}}>TOTAL AMOUNT</p>
                    <p style={{margin: 0, fontSize: '32px', fontWeight: '700', color: '#27ae60'}}>
                      ${formatCurrency((editInvoiceData.lineItems || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes Section - Modern Design */}
              <div style={{background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: '32px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #f0f0f0'}}>
                  <div style={{background: 'linear-gradient(135deg, #16a085 0%, #138d75 100%)', padding: '10px', borderRadius: '10px', display: 'flex'}}>
                    <em className="icon ni ni-notes" style={{fontSize: '20px', color: '#ffffff'}}></em>
                  </div>
                  <div>
                    <h4 style={{margin: 0, fontSize: '16px', fontWeight: '600', color: '#2c3e50'}}>Additional Notes</h4>
                    <p style={{margin: '2px 0 0 0', fontSize: '13px', color: '#7f8c8d'}}>Comments or special instructions</p>
                  </div>
                </div>
                <textarea
                  style={{width: '100%', minHeight: '120px', padding: '16px', border: '2px solid #e8e8e8', borderRadius: '12px', fontSize: '14px', color: '#2c3e50', resize: 'vertical', transition: 'all 0.3s', fontFamily: 'inherit'}}
                  placeholder="Add any additional notes, comments, or special instructions..."
                  value={editInvoiceData.notes || ''}
                  onChange={(e) => setEditInvoiceData({...editInvoiceData, notes: e.target.value})}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
                />
              </div>
            </div>
            
            {/* Modern Footer with Action Buttons */}
            <div style={{padding: '24px 32px', background: '#ffffff', borderTop: '2px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '0 0 12px 12px'}}>
              <div style={{display: 'flex', gap: '12px'}}>
                <button 
                  style={{padding: '12px 24px', background: '#ffffff', border: '2px solid #e8e8e8', borderRadius: '10px', fontSize: '14px', fontWeight: '600', color: '#7f8c8d', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s'}}
                  onClick={() => {
                    setEditModalOpen(false);
                    setCompanyLogo(null);
                    setTimesheetFile(null);
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.color = '#667eea';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#e8e8e8';
                    e.target.style.color = '#7f8c8d';
                  }}
                >
                  <em className="icon ni ni-cross" style={{fontSize: '16px'}}></em>
                  Cancel
                </button>
              </div>
              <div style={{display: 'flex', gap: '12px'}}>
                <button 
                  style={{padding: '14px 32px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.3s', boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)'}}
                  onClick={async () => {
                    try {
                      const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
                      const token = localStorage.getItem("token");
                      
                      if (!userInfo.tenantId) {
                        throw new Error('Tenant ID not found');
                      }
                      
                      console.log('💾 Saving invoice changes...', editInvoiceData);
                      
                      // Calculate total from line items
                      const lineItems = (editInvoiceData.lineItems || []).map(item => {
                        const hours = parseFloat(item.hours || item.quantity || 0);
                        const rate = parseFloat(item.rate || 0);
                        const amount = hours * rate; // Recalculate amount
                        return {
                          description: item.description,
                          hours: hours,
                          rate: rate,
                          amount: amount
                        };
                      });
                      
                      // Calculate total amount from all line items
                      const calculatedTotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
                      
                      // Calculate total hours from all line items
                      const totalHours = lineItems.reduce((sum, item) => sum + item.hours, 0);
                      
                      console.log('📊 Calculated totals:', {
                        lineItems: lineItems,
                        totalHours: totalHours,
                        calculatedTotal: calculatedTotal
                      });
                      
                      // Prepare the invoice data for API
                      const invoiceUpdateData = {
                        invoiceNumber: editInvoiceData.invoiceNumber,
                        issueDate: editInvoiceData.issueDate,
                        vendor: editInvoiceData.vendor,
                        employeeName: editInvoiceData.employeeName,
                        employeeEmail: editInvoiceData.employeeEmail,
                        vendorContact: editInvoiceData.vendorContact,
                        total: calculatedTotal, // Use calculated total
                        totalAmount: calculatedTotal, // Also set totalAmount field
                        status: editInvoiceData.status,
                        hours: totalHours, // Use calculated total hours
                        week: editInvoiceData.week,
                        notes: editInvoiceData.notes,
                        lineItems: lineItems,
                        tenantId: userInfo.tenantId
                      };
                      
                      // Convert logo to base64 if uploaded
                      if (companyLogo) {
                        const logoBase64 = await new Promise((resolve) => {
                          const reader = new FileReader();
                          reader.onloadend = () => resolve(reader.result);
                          reader.readAsDataURL(companyLogo);
                        });
                        invoiceUpdateData.companyLogo = logoBase64;
                      }
                      
                      // Convert timesheet to base64 if uploaded
                      if (timesheetFile) {
                        const timesheetBase64 = await new Promise((resolve) => {
                          const reader = new FileReader();
                          reader.onloadend = () => resolve(reader.result);
                          reader.readAsDataURL(timesheetFile);
                        });
                        invoiceUpdateData.timesheetFile = timesheetBase64;
                        invoiceUpdateData.timesheetFileName = timesheetFile.name;
                      }
                      
                      console.log('📤 Sending update to API:', invoiceUpdateData);
                      
                      // Call API to update invoice
                      const response = await axios.put(
                        `${API_BASE}/api/invoices/${editInvoiceData.id}?tenantId=${userInfo.tenantId}`,
                        invoiceUpdateData,
                        {
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          }
                        }
                      );
                      
                      console.log('✅ Invoice updated successfully:', response.data);
                      
                      // Close edit modal and reset states
                      setEditModalOpen(false);
                      setCompanyLogo(null);
                      setTimesheetFile(null);
                      
                      // Reload all invoice data from API to refresh the screen
                      console.log('🔄 Reloading invoice data...');
                      await fetchInvoices();
                      
                      // Show success modal with updated invoice data
                      setSuccessInvoiceData(response.data.invoice || editInvoiceData);
                      setShowSuccessModal(true);
                    } catch (error) {
                      console.error('❌ Error updating invoice:', error);
                      console.error('Error details:', error.response?.data);
                      alert(error.response?.data?.message || 'Failed to update invoice. Please try again.');
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.4)';
                  }}
                >
                  <em className="icon ni ni-save" style={{fontSize: '18px'}}></em>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && successInvoiceData && (
        <InvoiceSuccessModal
          invoice={successInvoiceData}
          onClose={() => {
            setShowSuccessModal(false);
            setSuccessInvoiceData(null);
          }}
          onPreview={async () => {
            // Close success modal
            setShowSuccessModal(false);
            
            try {
              // Fetch complete invoice data from API
              const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
              const tenantId = userInfo.tenantId || localStorage.getItem('tenantId');
              const token = localStorage.getItem('token');
              
              console.log('🔍 Fetching complete invoice data for PDF generation...');
              
              const response = await fetch(
                `${API_BASE}/api/invoices/${successInvoiceData.id}?tenantId=${tenantId}`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
              
              let completeInvoice = successInvoiceData;
              if (response.ok) {
                const data = await response.json();
                if (data.success && data.invoice) {
                  // Merge API data with modal data (modal data takes precedence)
                  completeInvoice = {
                    ...data.invoice,
                    ...successInvoiceData,
                    // Ensure nested objects are preserved
                    employee: successInvoiceData.employee || data.invoice.employee,
                    client: successInvoiceData.client || data.invoice.client,
                    vendor: successInvoiceData.vendor || data.invoice.vendor
                  };
                  console.log('✅ Complete invoice data merged:', completeInvoice);
                }
              }
              
              // If employee data is missing, fetch from employee API
              if (!completeInvoice.employee && completeInvoice.employeeId) {
                console.log('🔍 Fetching employee data...');
                try {
                  const empResponse = await fetch(
                    `${API_BASE}/api/employees/${completeInvoice.employeeId}?tenantId=${tenantId}`,
                    {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    }
                  );
                  if (empResponse.ok) {
                    const empData = await empResponse.json();
                    if (empData.success) {
                      completeInvoice.employee = empData.employee || empData.data;
                      console.log('✅ Employee data fetched:', completeInvoice.employee);
                    }
                  }
                } catch (err) {
                  console.error('Error fetching employee:', err);
                }
              }
              
              // If vendor data is missing, fetch from vendor API
              if (!completeInvoice.vendor && completeInvoice.vendorId) {
                console.log('🔍 Fetching vendor data...');
                try {
                  const vendorResponse = await fetch(
                    `${API_BASE}/api/vendors/${completeInvoice.vendorId}?tenantId=${tenantId}`,
                    {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    }
                  );
                  if (vendorResponse.ok) {
                    const vendorData = await vendorResponse.json();
                    if (vendorData.success) {
                      completeInvoice.vendor = vendorData.vendor || vendorData.data;
                      console.log('✅ Vendor data fetched:', completeInvoice.vendor);
                    }
                  }
                } catch (err) {
                  console.error('Error fetching vendor:', err);
                }
              }
              
              // If client data is missing, fetch from client API
              if (!completeInvoice.client && completeInvoice.clientId) {
                console.log('🔍 Fetching client data...');
                try {
                  const clientResponse = await fetch(
                    `${API_BASE}/api/clients/${completeInvoice.clientId}?tenantId=${tenantId}`,
                    {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    }
                  );
                  if (clientResponse.ok) {
                    const clientData = await clientResponse.json();
                    if (clientData.success) {
                      completeInvoice.client = clientData.client || clientData.data;
                      console.log('✅ Client data fetched:', completeInvoice.client);
                    }
                  }
                } catch (err) {
                  console.error('Error fetching client:', err);
                }
              }
              
              // Generate professional PDF with complete data
              const jsPDF = (await import('jspdf')).default;
              const autoTable = (await import('jspdf-autotable')).default;
              
              const doc = new jsPDF();
              const pageWidth = doc.internal.pageSize.getWidth();
              const margin = 20;
              let yPos = 20;
              
              // Company Logo and Header
              // Add tenant uploaded logo if available
              if (completeInvoice.companyLogo) {
                try {
                  // Logo from modal (tenant uploaded)
                  doc.addImage(completeInvoice.companyLogo, 'PNG', margin, yPos - 5, 50, 25);
                  yPos += 5; // Add space after logo
                } catch (error) {
                  console.error('Error adding logo to PDF:', error);
                  // If logo fails, show company name instead
                  if (completeInvoice.companyName) {
                    doc.setFontSize(16);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(41, 128, 185);
                    doc.text(completeInvoice.companyName, margin, yPos);
                    doc.setTextColor(0, 0, 0);
                  }
                }
              } else if (completeInvoice.companyName) {
                // No logo, show company name
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(41, 128, 185);
                doc.text(completeInvoice.companyName, margin, yPos);
                doc.setTextColor(0, 0, 0);
              }
              
              // Company name from database
              // const companyName = completeInvoice.companyName || 
              //                    successInvoiceData.companyName || 
              //                    '';
              doc.setFontSize(24);
              doc.setFont('helvetica', 'bold');
              // doc.text(companyName, margin, yPos);
              
              doc.setFontSize(20);
              doc.setTextColor(41, 128, 185);
              doc.text('INVOICE', pageWidth - margin, yPos, { align: 'right' });
              doc.setTextColor(0, 0, 0);
              
              yPos += 5;
              doc.setFontSize(9);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(100, 100, 100);
              doc.text('Staffing Services Invoice', pageWidth - margin, yPos, { align: 'right' });
              doc.setTextColor(0, 0, 0);
              
              yPos += 15;
              doc.setLineWidth(0.5);
              doc.line(margin, yPos, pageWidth - margin, yPos);
              yPos += 10;
              
              // From and Billed To sections
              doc.setFontSize(10);
              doc.setFont('helvetica', 'bold');
              doc.text('From:', margin, yPos);
              doc.text('Billed To:', pageWidth / 2 + 10, yPos);
              
              yPos += 6;
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(9);
              
              // From (Company) details - Use real data from database
              const fromStartY = yPos;
              const fromDetails = [];
              if (completeInvoice.companyName) {
                fromDetails.push(completeInvoice.companyName);
              }
              if (completeInvoice.companyAddress) {
                fromDetails.push(completeInvoice.companyAddress);
              }
              if (completeInvoice.companyCity) {
                fromDetails.push(completeInvoice.companyCity);
              }
              if (completeInvoice.companyEmail) {
                fromDetails.push(`Email: ${completeInvoice.companyEmail}`);
              }
              if (completeInvoice.companyPhone) {
                fromDetails.push(`Phone: ${completeInvoice.companyPhone}`);
              }
              if (completeInvoice.taxId) {
                fromDetails.push(`Tax ID: ${completeInvoice.taxId}`);
              }
              
              let fromYPos = fromStartY;
              fromDetails.forEach(line => {
                doc.text(line, margin, fromYPos);
                fromYPos += 5;
              });
              
              // Billed To (Vendor/Client) details - Use real data from database
              // Start at same Y position as From section
              let billedToYPos = fromStartY;
              const vendor = completeInvoice.vendor || {};
              const client = completeInvoice.client || {};
              
              const billedToDetails = [];
              const billedToName = vendor.vendorName || vendor.name || client.clientName || 
                                  completeInvoice.clientName || completeInvoice.billToName;
              if (billedToName) {
                billedToDetails.push(billedToName);
              }
              
              const billedToAddress = vendor.address || client.address || 
                                     completeInvoice.billToAddress;
              if (billedToAddress) {
                billedToDetails.push(billedToAddress);
              }
              
              const billedToCity = vendor.city || client.city || 
                                  completeInvoice.billToCity;
              if (billedToCity) {
                billedToDetails.push(billedToCity);
              }
              
              billedToDetails.push('Attn: Accounts Payable');
              
              const billedToEmail = vendor.email || client.email || 
                                   completeInvoice.billToEmail;
              if (billedToEmail) {
                billedToDetails.push(`Email: ${billedToEmail}`);
              }
              
              billedToDetails.forEach(line => {
                doc.text(line, pageWidth / 2 + 10, billedToYPos);
                billedToYPos += 5;
              });
              
              // Move yPos to the maximum of both sections
              yPos = Math.max(fromYPos, billedToYPos) + 5;
              
              // Invoice details box
              doc.setFillColor(240, 240, 240);
              doc.rect(margin, yPos, pageWidth - 2 * margin, 25, 'F');
              
              yPos += 7;
              doc.setFontSize(9);
              doc.setFont('helvetica', 'bold');
              doc.text('Invoice Number:', margin + 5, yPos);
              doc.text('Invoice Date:', margin + 65, yPos);
              doc.text('Due Date:', margin + 125, yPos);
              
              yPos += 5;
              doc.setFont('helvetica', 'normal');
              
              // Format dates properly
              const formatDate = (dateStr) => {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
              };
              
              const invoiceNumber = completeInvoice.invoiceNumber || '';
              const invoiceDate = formatDate(completeInvoice.issueDate || completeInvoice.invoiceDate || completeInvoice.createdAt);
              const dueDate = formatDate(completeInvoice.dueDate);
              
              doc.text(invoiceNumber, margin + 5, yPos);
              doc.text(invoiceDate, margin + 65, yPos);
              doc.text(dueDate, margin + 125, yPos);
              
              yPos += 7;
              doc.setFont('helvetica', 'bold');
              doc.text('Payment Terms:', margin + 5, yPos);
              doc.setFont('helvetica', 'normal');
              const paymentTerms = completeInvoice.paymentTerms || 'Net 15';
              doc.text(paymentTerms, margin + 35, yPos);
              
              yPos += 10;
              
              // Billing Period and Engagement
              doc.setFontSize(9);
              doc.setFont('helvetica', 'bold');
              doc.text('Billing Period:', margin, yPos);
              doc.setFont('helvetica', 'normal');
              
              // Calculate billing period from timesheet or invoice data
              const timesheetData = completeInvoice.timesheet || {};
              const startDate = formatDate(timesheetData.startDate || completeInvoice.invoiceDurationFrom);
              const endDate = formatDate(timesheetData.endDate || completeInvoice.invoiceDurationTo);
              const billingPeriod = (startDate && endDate) ? `${startDate} - ${endDate}` : 
                                   `${completeInvoice.month || ''} ${completeInvoice.year || ''}`;
              doc.text(billingPeriod, margin + 30, yPos);
              
              yPos += 5;
              doc.setFont('helvetica', 'bold');
              doc.text('Engagement:', margin, yPos);
              doc.setFont('helvetica', 'normal');
              const engagement = completeInvoice.projectDescription || 
                                completeInvoice.description || 
                                'Staffing engagement details';
              doc.text(engagement, margin + 30, yPos);
              
              yPos += 10;
              
              // Employee details table - Use lineItems from modal if available
              const lineItems = completeInvoice.lineItems || [];
              const tableBody = [];
              
              if (lineItems.length > 0) {
                // Use line items from modal
                lineItems.forEach(item => {
                  const empName = item.employeeName || 'Employee Name';
                  const empRole = item.role || item.position || 'Software Engineer';
                  const itemHours = parseFloat(item.hoursWorked || item.hours || 0);
                  const itemRate = parseFloat(item.hourlyRate || item.rate || 0);
                  const itemTotal = parseFloat(item.total || (itemHours * itemRate));
                  
                  tableBody.push([
                    `${empName}\n(${empRole})`,
                    item.description || billingPeriod,
                    itemHours.toFixed(2),
                    `$${itemRate.toFixed(2)}`,
                    `$${itemTotal.toFixed(2)}`
                  ]);
                });
              } else {
                // Fallback to single employee
                const employee = completeInvoice.employee || {};
                const employeeName = employee.fullName || 
                                    (employee.firstName && employee.lastName ? 
                                      `${employee.firstName} ${employee.lastName}` : 
                                      completeInvoice.employeeName || 'Employee Name');
                const employeeRole = employee.position || employee.title || employee.role || 'Software Engineer';
                const hours = parseFloat(timesheetData.totalHours || completeInvoice.hours || completeInvoice.totalHours || 0);
                const rate = parseFloat(employee.hourlyRate || completeInvoice.hourlyRate || 0);
                const total = hours * rate;
                
                tableBody.push([
                  `${employeeName}\n(${employeeRole})`,
                  billingPeriod,
                  hours.toFixed(2),
                  `$${rate.toFixed(2)}`,
                  `$${total.toFixed(2)}`
                ]);
              }
              
              autoTable(doc, {
                startY: yPos,
                head: [['Employee (Role)', 'Billing Period', 'Hours', 'Rate (USD)', 'Total (USD)']],
                body: tableBody,
                theme: 'grid',
                headStyles: {
                  fillColor: [41, 128, 185],
                  textColor: 255,
                  fontSize: 9,
                  fontStyle: 'bold'
                },
                bodyStyles: {
                  fontSize: 9
                },
                columnStyles: {
                  0: { cellWidth: 50 },
                  1: { cellWidth: 50 },
                  2: { cellWidth: 25, halign: 'center' },
                  3: { cellWidth: 30, halign: 'right' },
                  4: { cellWidth: 30, halign: 'right' }
                }
              });
              
              yPos = doc.lastAutoTable.finalY + 10;
              
              // Totals section - Calculate from all line items
              const subtotal = tableBody.reduce((sum, row) => {
                // Extract number from '$1234.56' format
                const amount = parseFloat(row[4].replace('$', '').replace(',', '')) || 0;
                return sum + amount;
              }, 0);
              const taxExempt = true;
              const totalDue = completeInvoice.totalAmount || completeInvoice.total || subtotal;
              
              const totalsX = pageWidth - margin - 60;
              doc.setFontSize(9);
              
              doc.setFont('helvetica', 'bold');
              doc.text('Subtotal:', totalsX, yPos);
              doc.setFont('helvetica', 'normal');
              doc.text(`$${subtotal.toFixed(2)}`, totalsX + 50, yPos, { align: 'right' });
              
              yPos += 6;
              doc.setFont('helvetica', 'bold');
              doc.text('Tax:', totalsX, yPos);
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(8);
              if (taxExempt) {
                doc.text('Exempt (Professional Services)', totalsX + 50, yPos, { align: 'right' });
              } else {
                doc.text('$0.00', totalsX + 50, yPos, { align: 'right' });
              }
              doc.setFontSize(9);
              
              yPos += 8;
              doc.setFillColor(240, 240, 240);
              doc.rect(totalsX - 5, yPos - 5, 65, 8, 'F');
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(10);
              doc.text('Total Due:', totalsX, yPos);
              doc.text(`$${totalDue.toFixed(2)} USD`, totalsX + 50, yPos, { align: 'right' });
              
              yPos += 15;
              
              // Payment instructions
              doc.setFillColor(250, 250, 250);
              doc.rect(margin, yPos, pageWidth - 2 * margin, 35, 'F');
              
              yPos += 7;
              doc.setFontSize(10);
              doc.setFont('helvetica', 'bold');
              doc.text('Remit Payment To:', margin + 5, yPos);
              
              yPos += 6;
              doc.setFontSize(9);
              doc.setFont('helvetica', 'normal');
              
              // Use real payment data from database
              const paymentDetails = [];
              if (completeInvoice.bankName) {
                paymentDetails.push(`Bank: ${completeInvoice.bankName}`);
              }
              if (completeInvoice.accountName) {
                paymentDetails.push(`Account Name: ${completeInvoice.accountName}`);
              }
              if (completeInvoice.accountNumber || completeInvoice.routingNumber) {
                const accNum = completeInvoice.accountNumber || 'XXXX1234';
                const routing = completeInvoice.routingNumber || 'XXXXXXXX';
                paymentDetails.push(`Account #: ${accNum} | Routing #: ${routing}`);
              }
              if (completeInvoice.swiftCode || paymentTerms) {
                const swift = completeInvoice.swiftCode || 'CHASUS33';
                paymentDetails.push(`Swift Code: ${swift} | Payment Terms: ${paymentTerms}`);
              }
              
              paymentDetails.forEach(line => {
                doc.text(line, margin + 5, yPos);
                yPos += 5;
              });
              
              yPos += 10;
              
              // Note section
              doc.setFillColor(255, 250, 205);
              doc.rect(margin, yPos, pageWidth - 2 * margin, 20, 'F');
              
              yPos += 7;
              doc.setFont('helvetica', 'bold');
              doc.text('NOTE:', margin + 5, yPos);
              
              yPos += 5;
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(8);
              doc.text('We appreciate your continued partnership and trust in our services.', margin + 5, yPos);
              yPos += 4;
              doc.text('Kindly quote this invoice number in all future correspondence for faster reference.', margin + 5, yPos);
              
              // Footer
              yPos = doc.internal.pageSize.getHeight() - 20;
              doc.setFontSize(9);
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(41, 128, 185);
              doc.text('', pageWidth / 2, yPos, { align: 'center' });
              
              yPos += 5;
              doc.setFontSize(8);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(100, 100, 100);
              doc.text('www.selsoft.com | support@selsoft.com', pageWidth / 2, yPos, { align: 'center' });
              
              // Open PDF in new tab
              const pdfBlob = doc.output('blob');
              const pdfUrl = URL.createObjectURL(pdfBlob);
              window.open(pdfUrl, '_blank');
              
            } catch (error) {
              console.error('Error generating PDF:', error);
              alert('Failed to generate PDF preview. Please try again.');
            }
          }}
          onDownload={() => {
            // Trigger PDF download
            const handleDownload = async () => {
              try {
                const jsPDF = (await import('jspdf')).default;
                const autoTable = (await import('jspdf-autotable')).default;
                
                const doc = new jsPDF();
                const pageWidth = doc.internal.pageSize.getWidth();
                const margin = 15;
                
                // Add header
                doc.setFillColor(41, 128, 185);
                doc.rect(0, 0, pageWidth, 35, 'F');
                
                // Add logo if available
                if (successInvoiceData.companyLogo) {
                  try {
                    doc.addImage(successInvoiceData.companyLogo, 'PNG', margin, 7, 30, 20);
                  } catch (error) {
                    console.error('Error adding logo:', error);
                  }
                }
                
                // Add title
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(24);
                doc.setFont('helvetica', 'bold');
                doc.text('INVOICE', pageWidth / 2, 22, { align: 'center' });
                
                // Add invoice details
                let yPos = 45;
                doc.setTextColor(44, 62, 80);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(`Invoice #: ${successInvoiceData.invoiceNumber || 'N/A'}`, margin, yPos);
                doc.text(`Total: $${(successInvoiceData.total || 0).toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
                
                // Save PDF
                doc.save(`${successInvoiceData.invoiceNumber || 'invoice'}.pdf`);
              } catch (error) {
                console.error('Error generating PDF:', error);
                alert('Failed to generate PDF. Please try again.');
              }
            };
            handleDownload();
          }}
        />
      )}
    </div>
  );
};

export default Invoice;
