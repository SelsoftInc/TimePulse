import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './InvoiceSettingsModal.css';

const InvoiceSettingsModal = ({ onClose, onCreateAnyway }) => {
  const navigate = useNavigate();
  const { subdomain } = useParams();

  const handleGoToSettings = () => {
    onClose();
    navigate(`/${subdomain}/settings/invoices`);
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
          <h3 className="modal-title">Invoice Settings Not Configured</h3>
          <p className="modal-description">
            You haven't set up your invoice settings yet.<br />
            Creating an invoice now will use default values.
          </p>
          
          <div className="modal-actions">
            <button 
              className="btn btn-outline-secondary"
              onClick={handleCreateAnyway}
            >
              Create Anyway
            </button>
            <button 
              className="btn btn-primary"
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
