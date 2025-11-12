import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { API_BASE } from '../../config/api';
import axios from 'axios';
import './InvoiceView.css';

const InvoiceView = () => {
  const { invoiceId, subdomain } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const fetchInvoiceDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/invoices/${invoiceId}`, {
        params: { tenantId: user.tenantId }
      });

      if (response.data.success) {
        setInvoice(response.data.invoice);
      } else {
        toast.error('Failed to load invoice');
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  }, [invoiceId, user?.tenantId, toast]);

  useEffect(() => {
    if (invoiceId && user?.tenantId) {
      fetchInvoiceDetails();
    }
  }, [invoiceId, user?.tenantId, fetchInvoiceDetails]);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      
      const response = await axios.get(
        `${API_BASE}/api/invoices/${invoiceId}/download-pdf`,
        {
          params: { tenantId: user.tenantId },
          responseType: 'blob'
        }
      );

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleEditInvoice = () => {
    navigate(`/${subdomain}/invoices/edit/${invoiceId}`);
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'badge-warning', text: 'Pending' },
      paid: { class: 'badge-success', text: 'Paid' },
      overdue: { class: 'badge-danger', text: 'Overdue' },
      cancelled: { class: 'badge-secondary', text: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  if (loading) {
    return (
      <div className="invoice-view-container">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="invoice-view-container">
        <div className="empty-state">
          <i className="fas fa-file-invoice"></i>
          <h3>Invoice Not Found</h3>
          <p>The invoice you're looking for doesn't exist.</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/${subdomain}/invoices`)}
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-view-container">
      {/* Header Actions */}
      <div className="invoice-view-header">
        <button
          className="btn btn-secondary"
          onClick={() => navigate(`/${subdomain}/invoices`)}
        >
          <i className="fas fa-arrow-left"></i> Back to Invoices
        </button>
        <div className="header-actions">
          <button
            className="btn btn-outline-primary"
            onClick={handleEditInvoice}
          >
            <i className="fas fa-edit"></i> Edit Invoice
          </button>
          <button
            className="btn btn-primary"
            onClick={handleDownloadPDF}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Downloading...
              </>
            ) : (
              <>
                <i className="fas fa-download"></i> Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="invoice-view-content">
        {/* Invoice Header */}
        <div className="invoice-header-section">
          <div className="invoice-title">
            <h1>INVOICE</h1>
            <p className="invoice-subtitle">TimePulse Timesheet Management</p>
          </div>
          <div className="invoice-info">
            <div className="info-row">
              <span className="info-label">Invoice Number:</span>
              <span className="info-value invoice-number">{invoice.invoiceNumber}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Invoice Date:</span>
              <span className="info-value">{formatDate(invoice.invoiceDate)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Due Date:</span>
              <span className="info-value">{formatDate(invoice.dueDate)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Payment Status:</span>
              <span className="info-value">{getStatusBadge(invoice.paymentStatus)}</span>
            </div>
          </div>
        </div>

        {/* Billing Information */}
        <div className="invoice-billing-section">
          <div className="billing-column">
            <h3>BILLED TO</h3>
            <div className="billing-details">
              <p className="company-name">
                {invoice.vendor?.name || invoice.client?.clientName || 'N/A'}
              </p>
              {(invoice.vendor?.email || invoice.client?.email) && (
                <p className="detail-line">
                  <i className="fas fa-envelope"></i>
                  {invoice.vendor?.email || invoice.client?.email}
                </p>
              )}
              {invoice.vendor?.address && (
                <p className="detail-line">
                  <i className="fas fa-map-marker-alt"></i>
                  {invoice.vendor.address}
                </p>
              )}
              {invoice.vendor?.city && (
                <p className="detail-line">
                  {invoice.vendor.city}, {invoice.vendor.state} {invoice.vendor.zip}
                </p>
              )}
              {invoice.vendor?.phone && (
                <p className="detail-line">
                  <i className="fas fa-phone"></i>
                  {invoice.vendor.phone}
                </p>
              )}
            </div>
          </div>

          <div className="billing-column">
            <h3>EMPLOYEE</h3>
            <div className="billing-details">
              {invoice.employee && (
                <>
                  <p className="company-name">
                    {invoice.employee.firstName} {invoice.employee.lastName}
                  </p>
                  {invoice.employee.email && (
                    <p className="detail-line">
                      <i className="fas fa-envelope"></i>
                      {invoice.employee.email}
                    </p>
                  )}
                  {invoice.employee.title && (
                    <p className="detail-line">
                      <i className="fas fa-briefcase"></i>
                      {invoice.employee.title}
                    </p>
                  )}
                  {invoice.employee.department && (
                    <p className="detail-line">
                      <i className="fas fa-building"></i>
                      {invoice.employee.department}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Timesheet Details */}
        {invoice.timesheet && (
          <div className="timesheet-details-section">
            <h3>TIMESHEET DETAILS</h3>
            <div className="timesheet-info-grid">
              <div className="timesheet-info-item">
                <span className="label">Week Period:</span>
                <span className="value">
                  {formatDate(invoice.timesheet.weekStart)} - {formatDate(invoice.timesheet.weekEnd)}
                </span>
              </div>
              <div className="timesheet-info-item">
                <span className="label">Total Hours:</span>
                <span className="value">{parseFloat(invoice.timesheet.totalHours || 0).toFixed(2)} hrs</span>
              </div>
              <div className="timesheet-info-item">
                <span className="label">Status:</span>
                <span className="value">
                  <span className="badge badge-success">{invoice.timesheet.status}</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Line Items Table */}
        <div className="line-items-section">
          <h3>LINE ITEMS</h3>
          <table className="line-items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th className="text-right">Hours</th>
                <th className="text-right">Rate</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems && invoice.lineItems.length > 0 ? (
                invoice.lineItems.map((item, index) => (
                  <tr key={index}>
                    <td>{item.description}</td>
                    <td className="text-right">
                      {parseFloat(item.hours || item.hoursWorked || 0).toFixed(2)}
                    </td>
                    <td className="text-right">
                      {formatCurrency(item.rate || item.hourlyRate || 0)}
                    </td>
                    <td className="text-right">
                      {formatCurrency(item.amount || item.total || 0)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center">No line items</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Invoice Summary */}
        <div className="invoice-summary-section">
          <div className="summary-box">
            <div className="summary-row">
              <span className="summary-label">Subtotal:</span>
              <span className="summary-value">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Tax:</span>
              <span className="summary-value">{formatCurrency(invoice.taxAmount || 0)}</span>
            </div>
            <div className="summary-row summary-total">
              <span className="summary-label">TOTAL:</span>
              <span className="summary-value">{formatCurrency(invoice.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="notes-section">
            <h3>NOTES</h3>
            <p>{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="invoice-footer">
          <p>Thank you for your business! Please remit payment by the due date.</p>
          <p className="footer-meta">
            Generated on {formatDate(new Date())} | Invoice #{invoice.invoiceNumber}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;
