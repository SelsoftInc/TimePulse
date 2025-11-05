import React, { useState, useEffect } from "react";
import InvoiceSettingsModal from "../common/InvoiceSettingsModal";
import InvoicePDFPreviewModal from '../common/InvoicePDFPreviewModal';
import axios from "axios";
import { API_BASE } from "../../config/api";
import "./Invoice.css";
import '../common/ActionsDropdown.css';

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
        text: "Approved",
      };
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
        text: status,
      };
  }
};

// Invoice Detail Modal Component
const InvoiceDetailModal = ({ invoice, onClose, onApprove, onReject }) => {
  const [notes, setNotes] = useState("");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content invoice-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h4>Invoice Details - {invoice.invoiceNumber}</h4>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="invoice-detail-header">
            <div className="invoice-detail-info">
              <div className="detail-group">
                <span className="detail-label">Vendor:</span>
                <span className="detail-value">{invoice.vendor}</span>
              </div>
              <div className="detail-group">
                <span className="detail-label">Week:</span>
                <span className="detail-value">{invoice.week}</span>
              </div>
              <div className="detail-group">
                <span className="detail-label">Status:</span>
                {(() => {
                  const statusInfo = getStatusDisplay(invoice.status);
                  return (
                    <span
                      className={`badge badge-${statusInfo.class} d-inline-flex align-items-center`}
                    >
                      <i
                        className={`${statusInfo.icon} me-1`}
                        style={{ fontSize: "12px" }}
                      ></i>
                      {statusInfo.text}
                    </span>
                  );
                })()}
              </div>
            </div>
            <div className="invoice-detail-total">
              <span className="total-label">Total Amount:</span>
              <span className="total-value">${invoice.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="invoice-line-items">
            <h5>Line Items</h5>
            <table className="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Hours</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item, index) => (
                  <tr key={index}>
                    <td>{item.description}</td>
                    <td>{item.hours}</td>
                    <td>${item.rate.toFixed(2)}/hr</td>
                    <td>${(item.hours * item.rate).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" className="text-right">
                    <strong>Total</strong>
                  </td>
                  <td>
                    <strong>${invoice.total.toFixed(2)}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {invoice.discrepancies && (
            <div className="invoice-discrepancies">
              <h5>Discrepancies Found</h5>
              <div className="alert alert-warning">
                <i className="fas fa-exclamation-triangle"></i>
                <span>
                  There are discrepancies between the invoice and timesheet
                  data.
                </span>
              </div>

              <table className="table discrepancy-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Hours</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(invoice.discrepancies).map(
                    ([source, data], index) => (
                      <tr
                        key={index}
                        className={data.mismatch ? "mismatch-row" : ""}
                      >
                        <td>{source}</td>
                        <td>{data.hours}</td>
                        <td>{data.notes}</td>
                      </tr>
                    )
                  )}
                  {invoice.discrepancies.mismatch && (
                    <tr className="mismatch-alert">
                      <td>
                        <i className="fas fa-flag"></i> Mismatch
                      </td>
                      <td colSpan="2">Needs employer review</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="invoice-attachments">
            <h5>Attachments</h5>
            {Array.isArray(invoice.attachments) &&
            invoice.attachments.length > 0 ? (
              <ul className="attachment-list">
                {invoice.attachments.map((attachment, index) => (
                  <li key={index} className="attachment-item">
                    <i className="fas fa-file-pdf"></i>
                    <span>{attachment.name}</span>
                    <a href="#download" className="attachment-download">
                      <i className="fas fa-download"></i>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No attachments found</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              className="form-control"
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this invoice..."
            ></textarea>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-outline" onClick={onClose}>
            Close
          </button>
          {invoice.status === "Draft" || invoice.status === "Pending" ? (
            <>
              <button
                className="btn-outline btn-reject"
                onClick={() => onReject(invoice.id, notes)}
              >
                Reject
              </button>
              <button
                className="btn-primary"
                onClick={() => onApprove(invoice.id, notes)}
              >
                Approve
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
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
    quickbooksSync: false,
  });

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
      
      const response = await axios.get(`${API_BASE}/api/employees`, {
        params: { tenantId }
      });

      console.log("Employees API response:", response.data);

      if (response.data.success && response.data.employees) {
        console.log(
          "Setting employees:",
          response.data.employees.length,
          "employees"
        );
        setEmployees(response.data.employees);
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
        type === "checkbox" ? checked : type === "file" ? files[0] : value,
    });
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
            amount: total,
          },
        ];
      } else {
        total = parseFloat(formData.total) || 0;
        lineItems = [
          {
            description: "Professional Services",
            hours: 0,
            rate: 0,
            amount: total,
          },
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
        quickbooksSync: formData.quickbooksSync,
      };

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
                      {(ts.totalHours * ts.hourlyRate).toFixed(2)}
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
      Mismatch: { hours: "", notes: "Needs employer review" },
    },
  };

  useEffect(() => {
    console.log('🚀 Invoice component mounted');
    loadInvoiceSettings();
    fetchInvoices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      };
      
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
            hours: inv.totalHours || 0,
          };
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

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailModal(true);
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
                            <div key={invoice.id} className="nk-tb-item">
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

                      {/* Pagination */}
                      {filteredInvoices.length > itemsPerPage && (
                        <div className="card-inner">
                          <div className="pagination-wrapper">
                            <div className="pagination-info">
                              Showing {startIndex + 1} to {Math.min(endIndex, filteredInvoices.length)} of {filteredInvoices.length} entries
                            </div>
                            <div className="pagination-controls">
                              <button
                                className="pagination-btn"
                                onClick={handlePreviousPage}
                                disabled={currentPage === 1}
                                title="Previous page"
                              >
                                <i className="fas fa-chevron-left"></i>
                              </button>
                              <div className="pagination-pages">
                                <span className="current-page">{currentPage}</span>
                                <span className="page-separator">/</span>
                                <span className="total-pages">{totalPages}</span>
                              </div>
                              <button
                                className="pagination-btn"
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                title="Next page"
                              >
                                <i className="fas fa-chevron-right"></i>
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
    </div>
  );
};

export default Invoice;
