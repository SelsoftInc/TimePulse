import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TenantSettings.css';
import CompanyInformation from './CompanyInformation';
import InvoicePreferences from './InvoicePreferences';
import PaymentInformation from './PaymentInformation';
import SowSettings from './SowSettings';
import EmailNotifications from './EmailNotifications';
import SecurityPrivacy from './SecurityPrivacy';
import TimeRegion from './TimeRegion';

const TenantSettings = () => {
  const [activeSection, setActiveSection] = useState('company');
  const navigate = useNavigate();
  
  // Handle logout
  const handleLogout = () => {
    // Clear all authentication data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('currentTenant');
    
    // Redirect to simple login page
    navigate('/simple-login');
  };

  // Settings sections with their icons and titles
  const settingsSections = [
    { id: 'company', title: 'Company Information', icon: 'fa-building' },
    { id: 'invoice', title: 'Invoice Preferences', icon: 'fa-file-invoice' },
    { id: 'payment', title: 'Payment Information', icon: 'fa-credit-card' },
    { id: 'sow', title: 'Statement of Work (SOW) Settings', icon: 'fa-file-contract' },
    { id: 'email', title: 'Email Notifications', icon: 'fa-envelope' },
    { id: 'security', title: 'Security & Privacy', icon: 'fa-shield-alt' },
    { id: 'time', title: 'Time & Region', icon: 'fa-globe' },
    { id: 'logout', title: 'Logout', icon: 'fa-sign-out-alt' },
  ];

  // Render the active settings section
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'company':
        return <CompanyInformation />;
      case 'invoice':
        return <InvoicePreferences />;
      case 'payment':
        return <PaymentInformation />;
      case 'sow':
        return <SowSettings />;
      case 'email':
        return <EmailNotifications />;
      case 'security':
        return <SecurityPrivacy />;
      case 'time':
        return <TimeRegion />;
      case 'logout':
        // Handle logout when this section is selected
        handleLogout();
        return <div>Logging out...</div>;
      default:
        return <CompanyInformation />;
    }
  };

  return (
    <div className="tenant-settings-container">
      <div className="nk-block-head">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <h3 className="nk-block-title">Tenant Settings</h3>
            <p className="nk-block-des">
              Manage your tenant settings for automated invoice generation
            </p>
          </div>
        </div>
      </div>

      <div className="tenant-settings-content">
        <div className="settings-menu">
          {settingsSections
            .filter(section => section.id !== 'logout') // Filter out the logout from regular settings
            .map((section) => (
              <div
                key={section.id}
                className={`settings-card ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <div className="settings-card-icon">
                  <i className={`fa ${section.icon}`}></i>
                </div>
                <div className="settings-card-title">{section.title}</div>
              </div>
            ))}
            
            {/* Dedicated logout button */}
            <div className="settings-logout-container">
              <button 
                className="settings-logout-button" 
                onClick={handleLogout}
              >
                <i className="fa fa-sign-out-alt"></i>
                Logout
              </button>
            </div>
        </div>

        <div className="settings-detail">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
};

export default TenantSettings;
