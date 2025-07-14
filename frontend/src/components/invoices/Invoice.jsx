import React, { useState, useEffect } from "react";
import "./Invoice.css";

// Utility function for status display
const getStatusDisplay = (status) => {
  switch(status.toLowerCase()) {
    case "draft":
      return { class: "secondary", icon: "fas fa-edit", text: "Draft" };
    case "pending":
      return { class: "warning", icon: "fas fa-clock", text: "Pending" };
    case "approved":
      return { class: "success", icon: "fas fa-check-circle", text: "Approved" };
    case "rejected":
      return { class: "danger", icon: "fas fa-times-circle", text: "Rejected" };
    case "sent":
      return { class: "info", icon: "fas fa-paper-plane", text: "Sent" };
    case "paid":
      return { class: "success", icon: "fas fa-dollar-sign", text: "Paid" };
    default:
      return { class: "secondary", icon: "fas fa-question-circle", text: status };
  }
};

// Invoice Detail Modal Component
const InvoiceDetailModal = ({ invoice, onClose, onApprove, onReject }) => {
  const [notes, setNotes] = useState("");
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content invoice-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h4>Invoice Details - {invoice.invoiceNumber}</h4>
          <button className="modal-close" onClick={onClose}>×</button>
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
                    <span className={`badge badge-${statusInfo.class} d-inline-flex align-items-center`}>
                      <i className={`${statusInfo.icon} me-1`} style={{ fontSize: '12px' }}></i>
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
                  <td colSpan="3" className="text-right"><strong>Total</strong></td>
                  <td><strong>${invoice.total.toFixed(2)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {invoice.discrepancies && (
            <div className="invoice-discrepancies">
              <h5>Discrepancies Found</h5>
              <div className="alert alert-warning">
                <i className="fas fa-exclamation-triangle"></i>
                <span>There are discrepancies between the invoice and timesheet data.</span>
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
                  {Object.entries(invoice.discrepancies).map(([source, data], index) => (
                    <tr key={index} className={data.mismatch ? "mismatch-row" : ""}>
                      <td>{source}</td>
                      <td>{data.hours}</td>
                      <td>{data.notes}</td>
                    </tr>
                  ))}
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
            {invoice.attachments && invoice.attachments.length > 0 ? (
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
          <button className="btn-outline" onClick={onClose}>Close</button>
          {invoice.status === "Draft" || invoice.status === "Pending" ? (
            <>
              <button className="btn-outline btn-reject" onClick={() => onReject(invoice.id, notes)}>
                Reject
              </button>
              <button className="btn-primary" onClick={() => onApprove(invoice.id, notes)}>
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
    week: "",
    employee: "",
    sow: "",
    useTimesheet: true,
    total: "",
    file: null,
    quickbooksSync: false
  });
  
  const [employees] = useState([
    { id: "emp1", name: "John Doe" },
    { id: "emp2", name: "Jane Smith" },
    { id: "emp3", name: "Robert Johnson" }
  ]);
  
  const [sows] = useState([
    { id: "sow1", name: "Developer - ABC Inc", rate: 40 },
    { id: "sow2", name: "Designer - XYZ Corp", rate: 35 },
    { id: "sow3", name: "Project Manager - 123 LLC", rate: 50 }
  ]);
  
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : type === "file" ? files[0] : value
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create new invoice object
    const newInvoice = {
      id: `inv-${Math.floor(Math.random() * 10000)}`,
      invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      vendor: formData.vendor,
      week: formData.week,
      total: parseFloat(formData.total) || 0,
      status: "Draft",
      employee: employees.find(emp => emp.id === formData.employee)?.name,
      sow: sows.find(s => s.id === formData.sow)?.name,
      lineItems: [
        {
          description: sows.find(s => s.id === formData.sow)?.name || "Services",
          hours: formData.useTimesheet ? 40 : Math.floor(parseFloat(formData.total) / (sows.find(s => s.id === formData.sow)?.rate || 40)),
          rate: sows.find(s => s.id === formData.sow)?.rate || 40
        }
      ],
      attachments: formData.file ? [{ name: formData.file.name }] : [],
      quickbooksSync: formData.quickbooksSync
    };
    
    onUpload(newInvoice);
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content invoice-upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h4>Upload New Invoice</h4>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="vendor">Vendor</label>
              <input
                type="text"
                id="vendor"
                name="vendor"
                className="form-control"
                value={formData.vendor}
                onChange={handleChange}
                required
                placeholder="Enter vendor name"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="week">Week</label>
              <input
                type="week"
                id="week"
                name="week"
                className="form-control"
                value={formData.week}
                onChange={handleChange}
                required
              />
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
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="sow">Statement of Work</label>
              <select
                id="sow"
                name="sow"
                className="form-control"
                value={formData.sow}
                onChange={handleChange}
                required
              >
                <option value="">Select SOW</option>
                {sows.map(sow => (
                  <option key={sow.id} value={sow.id}>
                    {sow.name} (${sow.rate}/hr)
                  </option>
                ))}
              </select>
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
              <small className="form-text">Supported formats: PDF, Word, Excel, Images</small>
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
        </div>
        
        <div className="modal-footer">
          <button className="btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit}>Upload Invoice</button>
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
        <h5>SOW: {discrepancy.sowName} ({discrepancy.hours} hrs @ ${discrepancy.rate}/hr)</h5>
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
          {Object.entries(discrepancy.sources).map(([source, data], index) => (
            <tr key={index} className={source === "Mismatch" ? "mismatch-row" : ""}>
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

// Main Invoice Component
const Invoice = () => {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("invoices");
  
  // Sample discrepancy data
  const discrepancyData = {
    sowName: "Developer (40 hrs @ $40/hr)",
    hours: 40,
    rate: 40,
    sources: {
      "Timesheet": { hours: 38, notes: "Submitted by John Doe" },
      "Invoice": { hours: 40, notes: "Uploaded by Vendor" },
      "Client": { hours: 36, notes: "From SAP dump" },
      "Mismatch": { hours: "", notes: "Needs employer review" }
    }
  };
  
  useEffect(() => {
    // Simulate fetching invoices from API
    const fetchInvoices = async () => {
      // Mock data
      const mockInvoices = [
        {
          id: "inv-1023",
          invoiceNumber: "INV-1023",
          vendor: "AcmeCo",
          week: "6/17",
          total: 1600,
          status: "Draft",
          lineItems: [
            { description: "Developer Services", hours: 40, rate: 40 }
          ],
          attachments: [
            { name: "invoice-1023.pdf" }
          ],
          discrepancies: {
            "Timesheet": { hours: 38, notes: "Submitted by John Doe", mismatch: true },
            "Invoice": { hours: 40, notes: "Uploaded by Vendor", mismatch: false },
            "Client": { hours: 36, notes: "From SAP dump", mismatch: true },
            "mismatch": true
          }
        },
        {
          id: "inv-1022",
          invoiceNumber: "INV-1022",
          vendor: "AcmeCo",
          week: "6/10",
          total: 1500,
          status: "Sent",
          lineItems: [
            { description: "Developer Services", hours: 37.5, rate: 40 }
          ],
          attachments: [
            { name: "invoice-1022.pdf" }
          ]
        },
        {
          id: "inv-1021",
          invoiceNumber: "INV-1021",
          vendor: "TechPro",
          week: "6/10",
          total: 2000,
          status: "Paid",
          lineItems: [
            { description: "Project Management", hours: 40, rate: 50 }
          ],
          attachments: [
            { name: "invoice-1021.pdf" }
          ]
        },
        {
          id: "inv-1020",
          invoiceNumber: "INV-1020",
          vendor: "DesignHub",
          week: "6/3",
          total: 1400,
          status: "Pending",
          lineItems: [
            { description: "UI/UX Design", hours: 40, rate: 35 }
          ],
          attachments: [
            { name: "invoice-1020.pdf" }
          ]
        }
      ];
      
      setInvoices(mockInvoices);
    };
    
    fetchInvoices();
  }, []);
  
  const filteredInvoices = invoices.filter(invoice => {
    const matchesStatus = filterStatus === "all" || invoice.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });
  
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailModal(true);
  };
  
  const handleApproveInvoice = (invoiceId, notes) => {
    setInvoices(invoices.map(inv => 
      inv.id === invoiceId ? { ...inv, status: "Approved", notes } : inv
    ));
    setShowDetailModal(false);
  };
  
  const handleRejectInvoice = (invoiceId, notes) => {
    setInvoices(invoices.map(inv => 
      inv.id === invoiceId ? { ...inv, status: "Rejected", notes } : inv
    ));
    setShowDetailModal(false);
  };
  
  const handleUploadInvoice = (newInvoice) => {
    setInvoices([newInvoice, ...invoices]);
    setShowUploadModal(false);
  };
  



  
  return (
    <div className="nk-content">
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            <div className="nk-block-head nk-block-head-sm">
              <div className="nk-block-between">
                <div className="nk-block-head-content">
                  <h3 className="nk-block-title page-title">Invoice Management</h3>
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
                          onClick={() => setShowUploadModal(true)}
                        >
                          <em className="icon ni ni-plus"></em>
                          <span>Upload Invoice</span>
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
                              className={`nav-link ${activeTab === 'invoices' ? 'active' : ''}`}
                              onClick={() => setActiveTab('invoices')}
                            >
                              Invoices
                            </button>
                          </li>
                          <li className="nav-item">
                            <button 
                              className={`nav-link ${activeTab === 'discrepancies' ? 'active' : ''}`}
                              onClick={() => setActiveTab('discrepancies')}
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
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                />
                              </div>
                            </div>
                          </li>
                          <li>
                            <div className="form-group">
                              <select
                                className="form-select form-select-sm"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
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
                  
                  {activeTab === 'invoices' ? (
                    <div className="card-inner p-0">
                      <div className="nk-tb-list nk-tb-ulist">
                        <div className="nk-tb-item nk-tb-head">
                          <div className="nk-tb-col"><span className="sub-text">Invoice #</span></div>
                          <div className="nk-tb-col"><span className="sub-text">Vendor</span></div>
                          <div className="nk-tb-col"><span className="sub-text">Week</span></div>
                          <div className="nk-tb-col"><span className="sub-text">Total</span></div>
                          <div className="nk-tb-col"><span className="sub-text">Status</span></div>
                          <div className="nk-tb-col nk-tb-col-tools text-right">
                            <span className="sub-text">Actions</span>
                          </div>
                        </div>
                        
                        {filteredInvoices.length > 0 ? (
                          filteredInvoices.map(invoice => (
                            <div key={invoice.id} className="nk-tb-item">
                              <div className="nk-tb-col">
                                <span className="tb-lead">{invoice.invoiceNumber}</span>
                              </div>
                              <div className="nk-tb-col">
                                <span className="tb-sub">{invoice.vendor}</span>
                              </div>
                              <div className="nk-tb-col">
                                <span className="tb-sub">{invoice.week}</span>
                              </div>
                              <div className="nk-tb-col">
                                <span className="tb-lead">${invoice.total.toFixed(2)}</span>
                              </div>
                              <div className="nk-tb-col">
                                {(() => {
                                  const statusInfo = getStatusDisplay(invoice.status);
                                  return (
                                    <span className={`badge badge-${statusInfo.class} d-inline-flex align-items-center`}>
                                      <i className={`${statusInfo.icon} me-1`} style={{ fontSize: '12px' }}></i>
                                      {statusInfo.text}
                                    </span>
                                  );
                                })()}
                              </div>
                              <div className="nk-tb-col nk-tb-col-tools">
                                <ul className="nk-tb-actions gx-1">
                                  <li>
                                    <button 
                                      className="btn btn-sm btn-icon btn-trigger"
                                      onClick={() => handleViewInvoice(invoice)}
                                    >
                                      {invoice.status === "Draft" ? (
                                        <span>Edit</span>
                                      ) : (
                                        <span>View</span>
                                      )}
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="nk-tb-item">
                            <div className="nk-tb-col" colSpan="6">
                              <div className="empty-state">
                                <p>No invoices found matching your criteria.</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="card-inner p-0">
                      <div className="nk-tb-list">
                        <div className="discrepancy-section">
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
    </div>
  );
};

export default Invoice;
