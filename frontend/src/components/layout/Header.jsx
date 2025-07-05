// src/components/layout/Header.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Header = ({ toggleSidebar }) => {
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light'); // Default theme
  
  // Sample workspaces data - in a real app, this would come from an API
  const workspaces = [
    { id: 1, name: "Acme Corp", active: true },
    { id: 2, name: "TechStart Inc", active: false },
    { id: 3, name: "Globex Corp", active: false },
  ];

  // Available themes
  const themes = [
    { id: 'light', name: 'Light Theme', icon: 'sun' },
    { id: 'blue', name: 'Blue Theme', icon: 'star' },
    { id: 'dark', name: 'Dark Theme', icon: 'moon' },
  ];

  // Apply theme to document
  useEffect(() => {
    document.body.className = `theme-${currentTheme}`;
  }, [currentTheme]);

  const toggleWorkspaceDropdown = () => {
    setShowWorkspaceDropdown(!showWorkspaceDropdown);
    if (showThemeDropdown) setShowThemeDropdown(false);
  };

  const toggleThemeDropdown = () => {
    setShowThemeDropdown(!showThemeDropdown);
    if (showWorkspaceDropdown) setShowWorkspaceDropdown(false);
  };

  const changeTheme = (themeId) => {
    setCurrentTheme(themeId);
    setShowThemeDropdown(false);
  };

  return (
    <header className="nk-header bg-white">
      <div className="container-fluid">
        <div className="nk-header-wrap">
          {/* Mobile menu toggle */}
          <div className="nk-menu-trigger d-xl-none mr-3">
            <button 
              className="nk-nav-toggle nk-quick-nav-icon" 
              onClick={toggleSidebar}
              aria-label="Toggle Sidebar"
            >
              <em className="icon ni ni-menu"></em>
            </button>
          </div>
          
          {/* Workspace selector */}
          <div className="workspace-selector">
            <div className="workspace-dropdown" onClick={toggleWorkspaceDropdown}>
              <div className="workspace-icon">
                <span>DE</span>
              </div>
              <div className="workspace-info">
                <span className="workspace-name">{workspaces.find(w => w.active)?.name || "Select Workspace"}</span>
                <span className="workspace-action">Tap to create</span>
              </div>
              <div className="workspace-arrow">
                <em className="icon ni ni-chevron-down"></em>
              </div>
            </div>
            
            {showWorkspaceDropdown && (
              <div className="workspace-dropdown-menu">
                <div className="workspace-create">
                  <div className="workspace-create-icon">
                    <em className="icon ni ni-plus"></em>
                  </div>
                  <div className="workspace-create-info">
                    <span className="create-title">Create New Workspace</span>
                    <span className="create-subtitle">Tap to create</span>
                  </div>
                </div>
                
                <div className="workspace-list">
                  {workspaces.map(workspace => (
                    <div key={workspace.id} className={`workspace-item ${workspace.active ? 'active' : ''}`}>
                      <div className="workspace-item-icon">
                        <span>DE</span>
                      </div>
                      <div className="workspace-item-name">{workspace.name}</div>
                      {workspace.active && <em className="icon ni ni-check"></em>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Page title */}
          <nav className="nk-header-menu">
            <div className="nk-header-app-name">
              <h2 className="mb-0">Dashboard</h2>
            </div>
          </nav>
          
          {/* Right side with timesheet actions, theme selector, logo and sidebar toggle */}
          <div className="nk-header-tools">
            {/* Quick timesheet actions */}
            <div className="mr-3">
              <Link to="/timesheets" className="btn btn-sm btn-outline-primary">
                <em className="icon ni ni-clock mr-1"></em>
                <span>Log Time</span>
              </Link>
            </div>
            
            {/* Theme selector */}
            <div className="theme-selector mr-3">
              <div className="theme-toggle" onClick={toggleThemeDropdown}>
                <em className={`icon ni ni-${themes.find(t => t.id === currentTheme)?.icon || 'sun'}`}></em>
              </div>
              
              {showThemeDropdown && (
                <div className="theme-dropdown-menu">
                  {themes.map(theme => (
                    <div 
                      key={theme.id} 
                      className={`theme-item ${theme.id === currentTheme ? 'active' : ''}`}
                      onClick={() => changeTheme(theme.id)}
                    >
                      <div className="theme-icon">
                        <em className={`icon ni ni-${theme.icon}`}></em>
                      </div>
                      <div className="theme-name">{theme.name}</div>
                      {theme.id === currentTheme && <em className="icon ni ni-check"></em>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* TimePulse logo moved to right */}
            <Link to="/" className="logo-link d-flex align-items-center mr-3">
              <img 
                src="/assets/images/logo.svg" 
                alt="TimePulse Logo" 
                className="logo-img" 
                style={{ height: '32px' }} 
              />
            </Link>
            
            {/* Desktop sidebar toggle */}
            <button className="btn btn-icon btn-sm btn-trigger d-none d-lg-block" onClick={toggleSidebar}>
              <em className="icon ni ni-menu-alt-r"></em>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
