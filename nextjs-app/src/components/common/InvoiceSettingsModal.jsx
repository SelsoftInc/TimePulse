'use client';

import { useRouter, useParams } from 'next/navigation';
import React from 'react';
import './InvoiceSettingsModal.css';

const InvoiceSettingsModal = ({ onClose, onCreateAnyway }) => {
  const router = useRouter();
  const { subdomain } = useParams();

  const handleGoToSettings = () => {
    onClose();
    router.push(`/${subdomain}/settings/invoices`);
  };

  const handleCreateAnyway = () => {
    onCreateAnyway();
    onClose();
  };

  return (
    <div className="modal-overlay invoice-settings-modal-overlay" onClick={onClose}>
      <div className="modal-content invoice-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon">
            <i className="fas fa-info-circle"></i>
          </div>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="modal-body">
          <h3 className="modal-title">Invoice Settings Not Configured <span className="text-danger">*</span></h3>
          <p className="modal-description">
            You haven't set up your invoice settings yet.<br />
            Creating an invoice now will use default values.
          </p>
          
          <div className="modal-actions">
            <button 
              className="btn btn-outline-secondary !bg-sky-100"
              onClick={handleCreateAnyway}
            >
              Create Anyway
            </button>
            <button 
              className="btn !bg-sky-300"
              onClick={handleGoToSettings}
            >
              Go to Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSettingsModal;
