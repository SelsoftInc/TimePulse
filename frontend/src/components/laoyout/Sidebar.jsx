// src/components/layout/Sidebar.jsx
import React from "react";

const Sidebar = () => {
  return (
    <aside className="nk-sidebar bg-light">
      <div className="nk-sidebar-content">
        <ul className="nk-menu">
          <li className="nk-menu-item">
            <a href="/dashboard" className="nk-menu-link">
              Dashboard
            </a>
          </li>
          <li className="nk-menu-item">
            <a href="/timesheets" className="nk-menu-link">
              Timesheets
            </a>
          </li>
          <li className="nk-menu-item">
            <a href="/invoices" className="nk-menu-link">
              Invoices
            </a>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
