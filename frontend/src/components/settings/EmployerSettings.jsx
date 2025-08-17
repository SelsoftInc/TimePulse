import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../utils/roles';
import './EmployerSettings.css';
import CompanyInformation from './CompanyInformation';
import ProfileSettings from './ProfileSettings';
import BillingSettings from './BillingSettings';
import NotificationSettings from './NotificationSettings';
import IntegrationSettings from './IntegrationSettings';
import ConfirmDialog from '../common/ConfirmDialog';

const EmployerSettings = () => {
  const navigate = useNavigate();
  const { checkPermission, isEmployee } = useAuth();
  const [activeTab, setActiveTab] = useState(checkPermission(PERMISSIONS.MANAGE_SETTINGS) ? 'company' : 'security');

  // Logout function available for use in settings components
  const handleLogout = () => {
    // In a real app, this would call an API to log the user out
    // For now, just clear localStorage and redirect to login
    localStorage.removeItem('user');
    localStorage.removeItem('currentEmployer');
    navigate('/simple-login');
  };
  
  // We'll use a confirmation modal in the UI
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const handleSettingsLogout = () => setShowLogoutConfirm(true);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'company':
        return <CompanyInformation />;
      case 'security':
        // Show ProfileSettings for all roles
        return <ProfileSettings />;
      case 'billing':
        return <BillingSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'integrations':
        return <IntegrationSettings />;
      default:
        return checkPermission(PERMISSIONS.MANAGE_SETTINGS) ? <CompanyInformation /> : <ProfileSettings />;
    }
  };

  return (
    <div className="nk-content">
      <div className="container-fluid">
        <div className="nk-block-head">
          <div className="nk-block-between">
            <div className="nk-block-head-content">
              <h3 className="nk-block-title">{isEmployee() ? 'Profile Settings' : 'Settings'}</h3>
              <p className="nk-block-subtitle">
              {isEmployee() 
                ? 'Manage your profile and notification preferences'
                : 'Manage your employer settings for automated invoice generation'
              }
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
            {/* Admin-only tabs */}
            {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && (
              <>
                <li className={activeTab === 'company' ? 'active' : ''}>
                  <button onClick={() => setActiveTab('company')}>
                    <i className="fas fa-building"></i> Company Information
                  </button>
                </li>
                <li className={activeTab === 'billing' ? 'active' : ''}>
                  <button onClick={() => setActiveTab('billing')}>
                    <i className="fas fa-credit-card"></i> Billing & Subscription
                  </button>
                </li>
                <li className={activeTab === 'integrations' ? 'active' : ''}>
                  <button onClick={() => setActiveTab('integrations')}>
                    <i className="fas fa-plug"></i> Integrations
                  </button>
                </li>
                <li className={activeTab === 'invoices' ? 'active' : ''}>
                  <button onClick={() => navigate(`/${window.location.pathname.split('/')[1]}/settings/invoices`)}>
                    <i className="fas fa-file-invoice"></i> Invoice Settings
                  </button>
                </li>
              </>
            )}
            
            {/* Available to all roles */}
            <li className={activeTab === 'security' ? 'active' : ''}>
              <button onClick={() => setActiveTab('security')}>
                <i className="fas fa-user"></i> Profile & Account
              </button>
            </li>
            <li className={activeTab === 'notifications' ? 'active' : ''}>
              <button onClick={() => setActiveTab('notifications')}>
                <i className="fas fa-bell"></i> Notifications
              </button>
            </li>
          </ul>
        </div>
        
        <div className="employer-settings-content">
          {renderTabContent()}
        </div>
      </div>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Log out"
        message="Are you sure you want to log out?"
        confirmLabel="Log out"
        cancelLabel="Cancel"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};

export default EmployerSettings;
