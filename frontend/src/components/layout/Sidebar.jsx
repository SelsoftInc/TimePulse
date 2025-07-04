// src/components/layout/Sidebar.jsx
import React from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <aside className="nk-sidebar bg-light">
      <div className="nk-sidebar-content">
        <ul className="nk-menu">
          <li className="nk-menu-item">
            <Link to="/" className="nk-menu-link">
              Dashboard
            </Link>
          </li>
          <li className="nk-menu-item">
            <Link to="/timesheets" className="nk-menu-link">
              Timesheets
            </Link>
          </li>
          <li className="nk-menu-item">
            <Link to="/invoices" className="nk-menu-link">
              Invoices
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
