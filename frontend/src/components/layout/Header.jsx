// src/components/layout/Header.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
// import { PERMISSIONS } from "../../utils/roles";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
// import PermissionGuard from "../common/PermissionGuard";
import TimesheetAlerts from "../notifications/TimesheetAlerts";
import AskAIButton from "../ai/AskAIButton";
// import logo2 from "../../assets/images/jsTree/logo2.png";
import logo3 from "../../assets/images/jsTree/TimePulse6.png";

import "./Header.css";

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { subdomain } = useParams();
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [tenantLogo, setTenantLogo] = useState(null);

  // Theme is now managed by ThemeContext, so we don't need this useEffect

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
          `http://localhost:5000/api/tenants/${tenantId}`,
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

  // Theme toggle is now handled by ThemeContext

  // Helper function to get tenant info
  const getTenantInfo = () => {
    let tenant = null;

    // Method 1: From localStorage
    const currentTenant = localStorage.getItem("currentTenant");
    if (currentTenant) {
      try {
        tenant = JSON.parse(currentTenant);
      } catch (e) {
        console.error("Error parsing tenant from localStorage:", e);
      }
    }

    // Method 2: From user context
    if (!tenant && user?.tenantId) {
      const currentPath = window.location.pathname;
      const subdomainMatch = currentPath.match(/\/([^/]+)\//);
      if (subdomainMatch) {
        tenant = { subdomain: subdomainMatch[1] };
      }
    }

    // Method 3: From URL params
    if (!tenant && subdomain) {
      tenant = { subdomain };
    }

    return tenant;
  };

  // Gear icon - goes to main settings page
  const goToSettings = () => {
    console.log("🔧 Gear icon clicked - navigating to main settings");
    const tenant = getTenantInfo();

    if (tenant && tenant.subdomain) {
      const settingsPath = `/${tenant.subdomain}/settings`;
      console.log("Navigating to main settings:", settingsPath);
      navigate(settingsPath);
    } else {
      console.log("No tenant found, navigating to workspaces");
      navigate("/workspaces");
    }
  };

  // Profile icon - goes to profile settings tab
  const goToProfileSettings = () => {
    console.log("👤 Profile icon clicked - navigating to profile settings");
    const tenant = getTenantInfo();

    if (tenant && tenant.subdomain) {
      const profilePath = `/${tenant.subdomain}/settings?tab=security`;
      console.log("Navigating to profile settings:", profilePath);
      navigate(profilePath);
    } else {
      console.log("No tenant found, navigating to workspaces");
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
          <div
            className="app-brand"
            onClick={() => navigate(`/${subdomain}/employee-dashboard`)}
            style={{ cursor: "pointer" }}
          >
            <img
              src={tenantLogo || logo3}
              alt={tenantLogo ? "Company Logo" : "TimePulse Logo"}
              className="app-brand-logo"
              style={
                tenantLogo
                  ? {
                      maxHeight: "30px",
                      maxWidth: "200px",
                      objectFit: "contain",
                    }
                  : {}
              }
              title="Go to Employee Dashboard"
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
            {/* Ask AI Button */}
            <div className="header-action-item">
              <AskAIButton />
            </div>

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
                  isDarkMode ? "fa-sun" : "fa-moon"
                } header-action-icon`}
                title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
              ></i>
            </div>

            {/* Settings icon - only show for admin/approver roles */}
            {user?.role === "admin" || user?.role === "approver" ? (
              <div
                className="header-action-item"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("Gear icon clicked!");
                  console.log(
                    "Current URL before navigation:",
                    window.location.href
                  );
                  goToSettings();
                }}
                style={{ cursor: "pointer" }}
                title="Settings"
              >
                <i className="fas fa-cog header-action-icon"></i>
              </div>
            ) : null}

            {/* User dropdown */}
            <div
              className="user-dropdown"
              onClick={goToProfileSettings}
              style={{ cursor: "pointer" }}
              title="Edit Profile"
            >
              <div className="user-avatar">{getUserInitials()}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
