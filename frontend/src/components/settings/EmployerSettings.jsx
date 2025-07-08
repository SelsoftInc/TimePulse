import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './EmployerSettings.css';
import CompanyInformation from './CompanyInformation';
import SecurityPrivacy from './SecurityPrivacy';
import BillingSettings from './BillingSettings';
import NotificationSettings from './NotificationSettings';
import IntegrationSettings from './IntegrationSettings';

const EmployerSettings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('company');

  // Logout function available for use in settings components
  const handleLogout = () => {
    // In a real app, this would call an API to log the user out
    // For now, just clear localStorage and redirect to login
    localStorage.removeItem('user');
    localStorage.removeItem('currentEmployer');
    navigate('/simple-login');
  };
  
  // We'll use the logout function in the UI
  const handleSettingsLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      handleLogout();
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'company':
        return <CompanyInformation />;
      case 'security':
        return <SecurityPrivacy />;
      case 'billing':
        return <BillingSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'integrations':
        return <IntegrationSettings />;
      default:
        return <CompanyInformation />;
    }
  };

  return (
    <div className="nk-content">
      <div className="container-fluid">
        <div className="nk-block-head">
          <div className="nk-block-between">
            <div className="nk-block-head-content">
              <h3 className="nk-block-title">Employer Settings</h3>
              <p className="nk-block-subtitle">
              Manage your employer settings for automated invoice generation
              </p>
            </div>
            <div className="nk-block-head-content">
              <button onClick={handleSettingsLogout} className="btn btn-outline-danger">
                <i className="fas fa-sign-out-alt mr-1"></i> Logout
              </button>
            </div>
          </div>
        </div>
        
      <div className="employer-settings-container">
        <div className="settings-sidebar">
          <ul className="settings-menu">
            <li className={activeTab === 'company' ? 'active' : ''}>
              <button onClick={() => setActiveTab('company')}>
                <i className="fas fa-building"></i> Company Information
              </button>
            </li>
            <li className={activeTab === 'security' ? 'active' : ''}>
              <button onClick={() => setActiveTab('security')}>
                <i className="fas fa-shield-alt"></i> Security & Privacy
              </button>
            </li>
            <li className={activeTab === 'billing' ? 'active' : ''}>
              <button onClick={() => setActiveTab('billing')}>
                <i className="fas fa-credit-card"></i> Billing & Subscription
              </button>
            </li>
            <li className={activeTab === 'notifications' ? 'active' : ''}>
              <button onClick={() => setActiveTab('notifications')}>
                <i className="fas fa-bell"></i> Notifications
              </button>
            </li>
            <li className={activeTab === 'integrations' ? 'active' : ''}>
              <button onClick={() => setActiveTab('integrations')}>
                <i className="fas fa-plug"></i> Integrations
              </button>
            </li>
          </ul>
        </div>
        
        <div className="employer-settings-content">
          {renderTabContent()}
        </div>
      </div>
      </div>
    </div>
  );
};

export default EmployerSettings;
