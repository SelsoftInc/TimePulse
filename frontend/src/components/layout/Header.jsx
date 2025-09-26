// src/components/layout/Header.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PERMISSIONS } from "../../utils/roles";
import { useAuth } from "../../contexts/AuthContext";
import PermissionGuard from "../common/PermissionGuard";
import TimesheetAlerts from "../notifications/TimesheetAlerts";

import "./Header.css";

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { subdomain } = useParams();
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [tenantLogo, setTenantLogo] = useState(null);

  // Initialize theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.body.classList.add("dark-mode");
    }
  }, []);

  // Fetch tenant logo
  useEffect(() => {
    const fetchTenantLogo = async () => {
      try {
        // Get tenant ID from multiple possible sources
        let tenantId = user?.tenantId;

        if (!tenantId) {
          const storedUser = JSON.parse(
            localStorage.getItem("userInfo") || "{}"
          );
          tenantId = storedUser.tenantId;
        }

        if (!tenantId) {
          const currentTenant = JSON.parse(
            localStorage.getItem("currentTenant") || "{}"
          );
          tenantId = currentTenant.id;
        }

        if (!tenantId) return;

        const response = await fetch(
          `http://localhost:5001/api/tenants/${tenantId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.tenant?.logo) {
            setTenantLogo(data.tenant.logo);
          }
        }
      } catch (error) {
        console.error("Error fetching tenant logo:", error);
      }
    };

    fetchTenantLogo();
  }, [user]);

  // Toggle theme function
  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);

    if (newDarkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  };

  const goToSettings = () => {
    // Get current tenant from localStorage
    const currentTenant = localStorage.getItem("currentTenant");
    if (currentTenant) {
      const tenant = JSON.parse(currentTenant);
      // Navigate to tenant-specific settings page
      navigate(`/${tenant.subdomain}/settings`);
    } else {
      // Fallback to workspaces if no tenant is selected
      navigate("/workspaces");
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    // Use user from context if available, otherwise fall back to localStorage
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }

    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    if (userInfo.name) {
      return userInfo.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    return "TP";
  };

  return (
    <header className="nk-header">
      <div className="container-fluid">
        <div className="nk-header-wrap">
          {/* Brand logo and name */}
          <div className="app-brand">
            <img
              src={tenantLogo || "/assets/images/jsTree/time-pulse-logo.png"}
              alt={tenantLogo ? "Company Logo" : "TimePulse Logo"}
              className="app-brand-logo"
              style={
                tenantLogo
                  ? {
                      maxHeight: "60px",
                      maxWidth: "250px",
                      objectFit: "contain",
                    }
                  : {}
              }
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
            <div className="header-action-item dropdown">
              <TimesheetAlerts subdomain={subdomain} />
            </div>
            <div
              className="header-action-item"
              onClick={toggleTheme}
              style={{ cursor: "pointer" }}
            >
              <i
                className={`fas ${
                  darkMode ? "fa-sun" : "fa-moon"
                } header-action-icon`}
              ></i>
            </div>

            <PermissionGuard
              requiredPermission={PERMISSIONS.VIEW_SETTINGS}
              fallback={null}
            >
              <div
                className="header-action-item"
                onClick={goToSettings}
                style={{ cursor: "pointer" }}
              >
                <i className="fas fa-cog header-action-icon"></i>
              </div>
            </PermissionGuard>

            {/* User dropdown */}
            <div className="user-dropdown">
              <div className="user-avatar">{getUserInitials()}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
