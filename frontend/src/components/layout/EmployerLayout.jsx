import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import './EmployerLayout.css';

const EmployerLayout = ({ children }) => {
  // These variables are used for context in child components
  // and for potential future features like employer-specific styling
  const { subdomain } = useParams();
  const { currentEmployer } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  
  // Initialize sidebar state from localStorage on component mount
  useEffect(() => {
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarState !== null) {
      setSidebarCollapsed(savedSidebarState === 'true');
    }
  }, []);
  
  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', newState.toString());
  };
  
  // Log employer info for debugging purposes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Rendering employer layout for: ${subdomain}`, currentEmployer);
    }
  }, [subdomain, currentEmployer]);
  
  return (
    <div className={`nk-body bg-lighter npc-default has-sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="nk-app-root">
        <div className="nk-main">
          <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          <div className="nk-wrap">
            <Header toggleSidebar={toggleSidebar} />
            <div className="nk-content">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerLayout;
