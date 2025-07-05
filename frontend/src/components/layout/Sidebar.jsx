import React from "react";
import { Link } from "react-router-dom";
import "./Sidebar.css";
import WorkspaceSelector from "./WorkspaceSelector";

const Sidebar = ({ collapsed, toggleSidebar }) => {
  
  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-content">
        {/* Single workspace selector */}
        {!collapsed && <WorkspaceSelector />}
        
        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <Link to="/" className="sidebar-link active">
              <div className="sidebar-icon">
                <i className="fa fa-tachometer-alt"></i>
              </div>
              {!collapsed && <span className="sidebar-text">Dashboard</span>}
            </Link>
          </li>
          
          <li className="sidebar-item">
            <Link to="/clients" className="sidebar-link">
              <div className="sidebar-icon">
                <i className="fa fa-users"></i>
              </div>
              {!collapsed && <span className="sidebar-text">Clients</span>}
            </Link>
          </li>
          
          <li className="sidebar-item">
            <Link to="/timesheets" className="sidebar-link">
              <div className="sidebar-icon">
                <i className="fa fa-clock"></i>
              </div>
              {!collapsed && <span className="sidebar-text">Timesheets</span>}
            </Link>
          </li>
          
          <li className="sidebar-item">
            <Link to="/invoices" className="sidebar-link">
              <div className="sidebar-icon">
                <i className="fa fa-file-invoice"></i>
              </div>
              {!collapsed && <span className="sidebar-text">Invoices</span>}
            </Link>
          </li>
          
          <li className="sidebar-item">
            <Link to="/reports" className="sidebar-link">
              <div className="sidebar-icon">
                <i className="fa fa-chart-bar"></i>
              </div>
              {!collapsed && <span className="sidebar-text">Reports</span>}
            </Link>
          </li>
          
          <li className="sidebar-item">
            <Link to="/settings" className="sidebar-link">
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
