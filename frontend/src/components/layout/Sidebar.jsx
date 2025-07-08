import React, { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import "./Sidebar.css";
import WorkspaceSelector from "./WorkspaceSelector";

const Sidebar = ({ collapsed, toggleSidebar, className = '' }) => {
  const { subdomain } = useParams();
  const [currentSubdomain, setCurrentSubdomain] = useState('');
  const location = useLocation();
  const currentPath = location.pathname;
  
  useEffect(() => {
    if (subdomain) {
      setCurrentSubdomain(subdomain);
    } else {
      // Fallback to getting subdomain from localStorage if not in URL params
      const storedTenant = localStorage.getItem('currentTenant');
      if (storedTenant) {
        const tenant = JSON.parse(storedTenant);
        setCurrentSubdomain(tenant.subdomain);
      }
    }
  }, [subdomain]);
  
  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''} ${className}`}>
      <div className="sidebar-content">
        {/* Single workspace selector */}
        {!collapsed && <WorkspaceSelector />}
        
        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <Link 
              to={`/${currentSubdomain}`} 
              className={`sidebar-link ${currentPath === `/${currentSubdomain}` || currentPath === `/${currentSubdomain}/dashboard` ? 'active' : ''}`}
            >
              <div className="sidebar-icon">
                <i className="fa fa-tachometer-alt"></i>
              </div>
              {!collapsed && <span className="sidebar-text">Dashboard</span>}
            </Link>
          </li>
          
          <li className="sidebar-item">
            <Link 
              to={`/${currentSubdomain}/clients`} 
              className={`sidebar-link ${currentPath.includes(`/${currentSubdomain}/clients`) ? 'active' : ''}`}
            >
              <div className="sidebar-icon">
                <i className="fa fa-users"></i>
              </div>
              {!collapsed && <span className="sidebar-text">Clients</span>}
            </Link>
          </li>
          
          <li className="sidebar-item">
            <Link 
              to={`/${currentSubdomain}/timesheets`} 
              className={`sidebar-link ${currentPath.includes(`/${currentSubdomain}/timesheets`) ? 'active' : ''}`}
            >
              <div className="sidebar-icon">
                <i className="fa fa-clock"></i>
              </div>
              {!collapsed && <span className="sidebar-text">Timesheets</span>}
            </Link>
          </li>
          
          <li className="sidebar-item">
            <Link 
              to={`/${currentSubdomain}/invoices`} 
              className={`sidebar-link ${currentPath.includes(`/${currentSubdomain}/invoices`) ? 'active' : ''}`}
            >
              <div className="sidebar-icon">
                <i className="fa fa-file-invoice"></i>
              </div>
              {!collapsed && <span className="sidebar-text">Invoices</span>}
            </Link>
          </li>
          
          <li className="sidebar-item">
            <Link 
              to={`/${currentSubdomain}/reports`} 
              className={`sidebar-link ${currentPath.includes(`/${currentSubdomain}/reports`) ? 'active' : ''}`}
            >
              <div className="sidebar-icon">
                <i className="fa fa-chart-bar"></i>
              </div>
              {!collapsed && <span className="sidebar-text">Reports</span>}
            </Link>
          </li>
          
          <li className="sidebar-item">
            <Link 
              to={`/${currentSubdomain}/settings`} 
              className={`sidebar-link ${currentPath.includes(`/${currentSubdomain}/settings`) ? 'active' : ''}`}
            >
              <div className="sidebar-icon">
                <i className="fa fa-cog"></i>
              </div>
              {!collapsed && <span className="sidebar-text">Settings</span>}
            </Link>
          </li>
        </ul>
        
        {/* Sidebar collapse button */}
        <div className="sidebar-footer">
          <div className="sidebar-collapse-button" onClick={toggleSidebar}>
            <i className={`fa fa-angle-${collapsed ? 'right' : 'left'}`}></i>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
