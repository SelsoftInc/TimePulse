import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = ({ collapsed, toggleSidebar }) => {
  const [clientsExpanded, setClientsExpanded] = useState(false);
  
  // Client data with employee counts
  const clients = [
    { id: 1, name: "JPMC", employeeCount: 7 },
    { id: 2, name: "Accenture", employeeCount: 5 },
    { id: 3, name: "Virtusa", employeeCount: 3 },
    { id: 4, name: "Cognizant", employeeCount: 5 },
    { id: 5, name: "IBM", employeeCount: 10 }
  ];
  
  const toggleClientsMenu = () => {
    setClientsExpanded(!clientsExpanded);
  };
  
  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-content">
        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <Link to="/" className="sidebar-link">
              <div className="sidebar-icon">
                <i className="fa fa-tachometer"></i>
              </div>
              {!collapsed && <span className="sidebar-text">Dashboard</span>}
            </Link>
          </li>
          
          {/* Clients expandable menu */}
          <li className="sidebar-item">
            <div className="sidebar-link" onClick={toggleClientsMenu}>
              <div className="sidebar-icon">
                <i className="fa fa-building"></i>
              </div>
              {!collapsed && (
                <>
                  <span className="sidebar-text">Clients</span>
                  <span className="sidebar-arrow ml-auto">
                    <i className={`fa fa-angle-${clientsExpanded ? 'down' : 'right'}`}></i>
                  </span>
                </>
              )}
            </div>
            
            {/* Submenu for clients */}
            {!collapsed && clientsExpanded && (
              <ul className="sidebar-submenu">
                {clients.map(client => (
                  <li key={client.id} className="sidebar-submenu-item">
                    <Link to={`/clients/${client.id}`} className="sidebar-submenu-link">
                      <span className="sidebar-text">{client.name}</span>
                      <span className="sidebar-badge">{client.employeeCount}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
          
          <li className="sidebar-item">
            <Link to="/timesheets" className="sidebar-link">
              <div className="sidebar-icon">
                <i className="fa fa-clock-o"></i>
              </div>
              {!collapsed && <span className="sidebar-text">Timesheets</span>}
            </Link>
          </li>
          
          <li className="sidebar-item">
            <Link to="/invoices" className="sidebar-link">
              <div className="sidebar-icon">
                <i className="fa fa-file-text-o"></i>
              </div>
              {!collapsed && <span className="sidebar-text">Invoices</span>}
            </Link>
          </li>
          
          <li className="sidebar-item">
            <Link to="/reports" className="sidebar-link">
              <div className="sidebar-icon">
                <i className="fa fa-bar-chart"></i>
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
