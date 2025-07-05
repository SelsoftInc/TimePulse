// src/components/layout/Header.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  
  // Initialize theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.body.classList.add('dark-mode');
    }
  }, []);
  
  // Toggle theme function
  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  };
  
  const goToSettings = () => {
    // Get current tenant from localStorage
    const currentTenant = localStorage.getItem('currentTenant');
    if (currentTenant) {
      const tenant = JSON.parse(currentTenant);
      // Navigate to tenant-specific settings page
      navigate(`/${tenant.subdomain}/settings`);
    } else {
      // Fallback to workspaces if no tenant is selected
      navigate('/workspaces');
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (userInfo.name) {
      return userInfo.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
    return 'TP';
  };

  return (
    <header className="nk-header">
      <div className="container-fluid">
        <div className="nk-header-wrap">
          {/* Brand logo and name */}
          <div className="app-brand">
            <img 
              src="/assets/images/logo-text.svg" 
              alt="TimePulse Logo" 
              className="app-brand-logo" 
            />
          </div>
          
          {/* Mobile menu toggle */}
          <div className="d-xl-none mr-3">
            <button 
              className="btn btn-icon btn-sm btn-light" 
              onClick={toggleSidebar}
              aria-label="Toggle Sidebar"
            >
              <i className="fas fa-bars"></i>
            </button>
          </div>
          
          {/* Right side tools */}
          <div className="nk-header-tools">
            {/* Action icons */}
            <div className="header-action-item">
              <i className="fas fa-bell header-action-icon"></i>
            </div>
            
            <div className="header-action-item" onClick={toggleTheme} style={{ cursor: 'pointer' }}>
              <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'} header-action-icon`}></i>
            </div>
            
            <div className="header-action-item" onClick={goToSettings} style={{ cursor: 'pointer' }}>
              <i className="fas fa-cog header-action-icon"></i>
            </div>
            
            {/* User dropdown */}
            <div className="user-dropdown">
              <div className="user-avatar">
                {getUserInitials()}
              </div>

            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
