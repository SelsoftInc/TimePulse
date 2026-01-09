'use client';

// src/components/common/InvoiceDetailsModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '@/config/api';
import InvoicePDFPreviewModal from './InvoicePDFPreviewModal';
import './InvoiceDetailsModal.css';

const InvoiceDetailsModal = ({ invoice, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [fullInvoiceData, setFullInvoiceData] = useState(null);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState(null);

  const fetchCompleteInvoiceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const tenantId = JSON.parse(localStorage.getItem("user"))?.tenantId;
      const token = localStorage.getItem("token");

      console.log('📄 Fetching complete invoice details for:', invoice.id);

      // Fetch complete invoice data from backend
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
        console.log('✅ Complete invoice data received:', data);
        console.log('📋 LineItems in response:', data.invoice?.lineItems);
        console.log('📋 LineItems type:', typeof data.invoice?.lineItems);
        console.log('📋 LineItems array check:', Array.isArray(data.invoice?.lineItems));

        if (data.success && data.invoice) {
          // Parse lineItems if it's a string
          let invoiceData = { ...data.invoice };
          if (typeof invoiceData.lineItems === 'string') {
            try {
              invoiceData.lineItems = JSON.parse(invoiceData.lineItems);
              console.log('✅ Parsed lineItems from string:', invoiceData.lineItems);
            } catch (err) {
              console.error('❌ Failed to parse lineItems:', err);
              invoiceData.lineItems = [];
            }
          }
          
          // Log final lineItems
          console.log('📋 Final lineItems to display:', invoiceData.lineItems);
          if (invoiceData.lineItems && invoiceData.lineItems.length > 0) {
            console.log('📋 First line item:', invoiceData.lineItems[0]);
          }
          
          setFullInvoiceData(invoiceData);
        } else {
          setError('Failed to load invoice details');
        }
      } else {
        setError('Failed to fetch invoice details');
      }
    } catch (error) {
      console.error('❌ Error fetching invoice details:', error);
      setError('Error loading invoice details');
    } finally {
      setLoading(false);
    }
  }, [invoice.id]);

  useEffect(() => {
    fetchCompleteInvoiceData();
  }, [fetchCompleteInvoiceData]);

  const handleDownloadPDF = async () => {
    if (fullInvoiceData) {
      try {
        console.log('📥 Downloading PDF for invoice:', fullInvoiceData.invoiceNumber);
        
        const tenantId = JSON.parse(localStorage.getItem("user"))?.tenantId;
        const token = localStorage.getItem("token");
        
        // Download PDF directly
        const downloadUrl = `${API_BASE}/api/invoices/${fullInvoiceData.id}/download-pdf?tenantId=${tenantId}`;
        
        const response = await fetch(downloadUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          
          // Get employee name from invoice data
          const employeeName = fullInvoiceData.employeeName || 
                              fullInvoiceData.employee?.firstName + ' ' + fullInvoiceData.employee?.lastName || 
                              fullInvoiceData.lineItems?.[0]?.employeeName || 
                              'Employee';
          const sanitizedEmployeeName = employeeName.replace(/[^a-zA-Z0-9]/g, '_');
          const filename = `${sanitizedEmployeeName}_${fullInvoiceData.invoiceNumber || 'invoice'}.pdf`;
          
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          console.log('✅ PDF downloaded successfully');
        } else {
          console.error('❌ Failed to download PDF');
          // Fallback: Open edit modal if download fails
          setShowEditModal(true);
        }
      } catch (error) {
        console.error('❌ Error downloading PDF:', error);
        // Fallback: Open edit modal if error occurs
        setShowEditModal(true);
      }
    }
  };

  const handleUpdateInvoice = (updatedInvoice) => {
    console.log('✅ Invoice updated:', updatedInvoice);
    setShowEditModal(false);
    // Refresh invoice data after update
    fetchCompleteInvoiceData();
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content invoice-details-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h4>Invoice Details</h4>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div className="modal-body" style={{ textAlign: 'center', padding: '40px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p style={{ marginTop: '16px', color: '#6c757d' }}>Loading invoice details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !fullInvoiceData) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content invoice-details-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h4>Invoice Details</h4>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div className="modal-body" style={{ textAlign: 'center', padding: '40px' }}>
            <i className="fas fa-exclamation-triangle" style={{ fontSize: '48px', color: '#dc3545', marginBottom: '16px' }}></i>
            <p style={{ color: '#dc3545', fontWeight: '600' }}>{error || 'Failed to load invoice details'}</p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  const invoiceData = fullInvoiceData;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content invoice-details-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h4>Invoice Details</h4>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          <div className="modal-body">
            <div className="details-container">
              {/* Invoice Information Section */}
              <div className="details-section">
                <h5 className="section-title">
                  <i className="fas fa-file-invoice"></i> Invoice Information
                </h5>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Invoice ID:</label>
                    <span>{invoiceData.invoiceNumber || invoiceData.id}</span>
                  </div>
                  <div className="detail-item">
                    <label>Client:</label>
                    <span>{invoiceData.client?.clientName || invoiceData.clientName || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Issue Date:</label>
                    <span>
                      {invoiceData.issueDate 
                        ? new Date(invoiceData.issueDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                        : invoiceData.createdAt
                          ? new Date(invoiceData.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })
                          : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Due Date:</label>
                    <span>
                      {invoiceData.dueDate 
                        ? new Date(invoiceData.dueDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className={`status-badge ${invoiceData.status?.toLowerCase()}`}>
                      {invoiceData.status || 'N/A'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Total Amount:</label>
                    <span className="amount">${parseFloat(invoiceData.totalAmount || invoiceData.amount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Employee/Vendor Information Section */}
              {(invoiceData.employee || invoiceData.vendor) && (
                <div className="details-section">
                  <h5 className="section-title">
                    <i className="fas fa-user"></i> {invoiceData.vendor ? 'Vendor' : 'Employee'} Information
                  </h5>
                  <div className="details-grid">
                    {invoiceData.vendor ? (
                      <>
                        <div className="detail-item">
                          <label>Vendor Name:</label>
                          <span>{invoiceData.vendor.name || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <label>Email:</label>
                          <span>{invoiceData.vendor.email || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <label>Phone:</label>
                          <span>{invoiceData.vendor.phone || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <label>Address:</label>
                          <span>
                            {invoiceData.vendor.address 
                              ? `${invoiceData.vendor.address}${invoiceData.vendor.city ? `, ${invoiceData.vendor.city}` : ''}${invoiceData.vendor.state ? `, ${invoiceData.vendor.state}` : ''}${invoiceData.vendor.zipCode ? ` ${invoiceData.vendor.zipCode}` : ''}`
                              : 'N/A'
                            }
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="detail-item">
                          <label>Employee Name:</label>
                          <span>
                            {invoiceData.employee?.firstName && invoiceData.employee?.lastName
                              ? `${invoiceData.employee.firstName} ${invoiceData.employee.lastName}`
                              : 'N/A'
                            }
                          </span>
                        </div>
                        <div className="detail-item">
                          <label>Email:</label>
                          <span>{invoiceData.employee?.email || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <label>Position:</label>
                          <span>{invoiceData.employee?.position || invoiceData.employee?.title || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <label>Department:</label>
                          <span>{invoiceData.employee?.department || 'N/A'}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Timesheet Period Section */}
              {invoiceData.timesheet && (
                <div className="details-section">
                  <h5 className="section-title">
                    <i className="fas fa-calendar-alt"></i> Timesheet Period
                  </h5>
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Week Start:</label>
                      <span>
                        {invoiceData.timesheet.weekStart 
                          ? new Date(invoiceData.timesheet.weekStart).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })
                          : invoiceData.weekStart || 'N/A'
                        }
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Week End:</label>
                      <span>
                        {invoiceData.timesheet.weekEnd 
                          ? new Date(invoiceData.timesheet.weekEnd).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })
                          : invoiceData.weekEnd || 'N/A'
                        }
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Total Hours:</label>
                      <span>{invoiceData.timesheet.totalHours || invoiceData.totalHours || 0}</span>
                    </div>
                    <div className="detail-item">
                      <label>Status:</label>
                      <span className={`status-badge ${invoiceData.timesheet.status?.toLowerCase()}`}>
                        {invoiceData.timesheet.status || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Line Items Section */}
              {invoiceData.lineItems && invoiceData.lineItems.length > 0 && (
                <div className="details-section">
                  <h5 className="section-title">
                    <i className="fas fa-list"></i> Line Items
                  </h5>
                  <div className="line-items-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th>Hours</th>
                          <th>Rate</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceData.lineItems.map((item, index) => (
                          <tr key={index}>
                            <td>{item.description || 'Service'}</td>
                            <td>{parseFloat(item.hours || 0).toFixed(2)}</td>
                            <td>${parseFloat(item.rate || 0).toFixed(2)}</td>
                            <td>${parseFloat(item.amount || (item.hours * item.rate) || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'right', fontWeight: '600' }}>Total:</td>
                          <td style={{ fontWeight: '700', fontSize: '16px' }}>
                            ${parseFloat(invoiceData.totalAmount || invoiceData.amount || 0).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Notes Section */}
              {invoiceData.notes && (
                <div className="details-section">
                  <h5 className="section-title">
                    <i className="fas fa-sticky-note"></i> Notes
                  </h5>
                  <div className="notes-content">
                    {invoiceData.notes}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            {/* <button 
              className="btn btn-primary" 
              onClick={handleDownloadPDF}
            >
              <i className="fas fa-download mr-1"></i> Download PDF
            </button> */}
          </div>
        </div>
      </div>

      {/* Edit Invoice Modal - Opens when Download PDF is clicked */}
      {showEditModal && fullInvoiceData && (
        <InvoicePDFPreviewModal
          show={true}
          invoice={fullInvoiceData}
          onClose={() => {
            setShowEditModal(false);
            console.log('📋 Edit modal closed');
          }}
          onUpdate={handleUpdateInvoice}
        />
      )}
    </>
  );
};

export default InvoiceDetailsModal;
