import React from 'react';
import './InvoiceSuccessModal.css';

const InvoiceSuccessModal = ({ invoice, onClose, onPreview, onDownload }) => {
  return (
    <div className="invoice-success-modal-overlay" onClick={onClose}>
      <div className="invoice-success-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Success Icon */}
        <div className="success-icon-container">
          <div className="success-icon">
            <i className="fas fa-check-circle"></i>
          </div>
        </div>

        {/* Success Message */}
        <h2 className="success-title">Invoice Updated Successfully!</h2>
        <p className="success-message">
          {invoice?.invoiceNumber || 'Invoice'} has been updated. 
          {invoice?.companyLogo && ' Your logo will appear in the PDF.'}
        </p>

        {/* Invoice Info */}
        <div className="invoice-info-card">
          <div className="info-row">
            <span className="info-label">Invoice Number:</span>
            <span className="info-value">{invoice?.invoiceNumber || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Amount:</span>
            <span className="info-value">
              ${parseFloat(invoice?.totalAmount || invoice?.total || 0).toFixed(2)}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Status:</span>
            <span className="info-value status-badge">
              {(invoice?.status || 'active').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="success-modal-actions">
          <button className="btn-success-outline" onClick={onClose}>
            <i className="fas fa-times"></i>
            Close
          </button>
          <button className="btn-success-preview" onClick={() => {
            onPreview();
            onClose();
          }}>
            <i className="fas fa-eye"></i>
            Preview PDF
          </button>
          <button className="btn-success-download" onClick={() => {
            onDownload();
            onClose();
          }}>
            <i className="fas fa-download"></i>
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSuccessModal;
