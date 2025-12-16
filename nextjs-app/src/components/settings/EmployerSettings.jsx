'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/utils/roles';
import "./EmployerSettings.css";
import CompanyInformation from './CompanyInformation';
import ProfileSettings from './ProfileSettings';
import BillingSettings from './BillingSettings';
import NotificationSettings from './NotificationSettings';
import UserManagement from './UserManagement';
// import IntegrationSettings from './IntegrationSettings';
import ConfirmDialog from '../common/ConfirmDialog';
import InvoiceSettings from './InvoiceSettings';

const EmployerSettings = () => {
  const { checkPermission, isEmployee } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    checkPermission(PERMISSIONS.MANAGE_SETTINGS) ? "company" : "company"
  );

  // Handle tab parameter from URL
  useEffect(() => {
    if (searchParams) {
      const tabFromUrl = searchParams.get("tab");
      if (
        tabFromUrl &&
        [
          "company",
          "users",
          "security",
          "invoices",
          "billing",
          "notifications",
        ].includes(tabFromUrl)
      ) {
        setActiveTab(tabFromUrl);
      }
    }
  }, [searchParams]);

  // Logout function available for use in settings components
  const handleLogout = () => {
    // In a real app, this would call an API to log the user out
    // Clear all localStorage data including theme
    localStorage.clear();

    // Remove dark-mode class from body to reset to light theme
    document.body.classList.remove("dark-mode");

    // Use window.location for full page reload to reset app state
    window.location.href = "/";
  };

  // Confirmation modal for logout
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const handleSettingsLogout = () => setShowLogoutConfirm(true);

  const getPageTitle = () => {
    switch (activeTab) {
      case "company":
        return "Company Information";
      case "users":
        return "User Management";
      case "security":
        return "Profile Settings";
      case "invoices":
        return "Invoice Settings";
      case "billing":
        return "Billing & Subscription";
      case "notifications":
        return "Notification Settings";
      default:
        return "Settings";
    }
  };

  const getPageSubtitle = () => {
    switch (activeTab) {
      case "company":
        return "Manage your company information and settings";
      case "users":
        return "Manage user accounts and permissions";
      case "security":
        return "Manage your personal profile and account settings";
      case "invoices":
        return "Configure invoice templates and preferences";
      case "billing":
        return "Manage your subscription and billing information";
      case "notifications":
        return "Configure your notification preferences";
      default:
        return "Manage your account and system settings";
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "company":
        return <CompanyInformation />;
      case "users":
        return <UserManagement />;
      case "security":
        return <ProfileSettings />;
      case "invoices":
        return <InvoiceSettings />;
      case "billing":
        return <BillingSettings />;
      case "notifications":
        return <NotificationSettings />;
      // case "integrations":
      //   return <IntegrationSettings />;
      default:
        return checkPermission(PERMISSIONS.MANAGE_SETTINGS) ? (
          <CompanyInformation />
        ) : (
          <ProfileSettings />
        );
    }
  };

  return (
    <div className="employer-settings-container">
      <div className="settings-header">
        <div>
          <h1 className="nk-block-title">{getPageTitle()}</h1>
          <p className="nk-block-subtitle">{getPageSubtitle()}</p>
        </div>
        <button onClick={handleSettingsLogout} className="btn-logout">
          <i className="fas fa-sign-out-alt mr-1"></i> Logout
        </button>
      </div>

      <ul className="settings-menu">
        {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && (
          <>
            <li className={activeTab === "company" ? "active" : ""}>
              <button onClick={() => setActiveTab("company")}>
                <i className="fas fa-building"></i>
                <span>Company Information</span>
              </button>
            </li>
            <li className={activeTab === "billing" ? "active" : ""}>
              <button onClick={() => setActiveTab("billing")}>
                <i className="fas fa-credit-card"></i>
                <span>Billing & Subscription</span>
              </button>
            </li>
            {/* <li className={activeTab === "integrations" ? "active" : ""}>
              <button onClick={() => setActiveTab("integrations")}>
                <i className="fas fa-plug"></i>
                <span>Integrations</span>
              </button>
            </li> */}
            <li className={activeTab === "invoices" ? "active" : ""}>
              <button onClick={() => setActiveTab("invoices")}>
                <i className="fas fa-file-invoice"></i>
                <span>Invoice Settings</span>
              </button>
            </li>
            <li className={activeTab === "users" ? "active" : ""}>
              <button onClick={() => setActiveTab("users")}>
                <i className="fas fa-users"></i>
                <span>User Management</span>
              </button>
            </li>
          </>
        )}
        <li className={activeTab === "security" ? "active" : ""}>
          <button onClick={() => setActiveTab("security")}>
            <i className="fas fa-user"></i>
            <span>Profile & Account</span>
          </button>
        </li>
        <li className={activeTab === "notifications" ? "active" : ""}>
          <button onClick={() => setActiveTab("notifications")}>
            <i className="fas fa-bell"></i>
            <span>Notifications</span>
          </button>
        </li>
      </ul>

      <div className="employer-settings-content">{renderTabContent()}</div>

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
