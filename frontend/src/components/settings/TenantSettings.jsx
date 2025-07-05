import React, { useState } from 'react';
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

  // Settings sections with their icons and titles
  const settingsSections = [
    { id: 'company', title: 'Company Information', icon: 'fa-building' },
    { id: 'invoice', title: 'Invoice Preferences', icon: 'fa-file-invoice' },
    { id: 'payment', title: 'Payment Information', icon: 'fa-credit-card' },
    { id: 'sow', title: 'Statement of Work (SOW) Settings', icon: 'fa-file-contract' },
    { id: 'email', title: 'Email Notifications', icon: 'fa-envelope' },
    { id: 'security', title: 'Security & Privacy', icon: 'fa-shield-alt' },
    { id: 'time', title: 'Time & Region', icon: 'fa-globe' },
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
          {settingsSections.map((section) => (
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
        </div>

        <div className="settings-detail">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
};

export default TenantSettings;
