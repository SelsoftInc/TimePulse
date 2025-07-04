// src/components/layout/Header.jsx
import React from "react";

const Header = () => {
  return (
    <header className="nk-header bg-white">
      <div className="container-fluid">
        <div className="nk-header-wrap">
          <div className="nk-header-brand">
            <a href="/" className="logo-link">
              <img src="/assets/images/logo.png" alt="TimePulse Logo" />
            </a>
          </div>
          <nav className="nk-header-menu">
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
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
