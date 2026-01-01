'use client';

// src/components/layout/Header.jsx
import { useRouter, useParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/config/api';
import { useTheme } from '@/contexts/ThemeContext';
// import PermissionGuard from '../common/PermissionGuard';
import NotificationBell from '../common/NotificationBell';
import TimesheetAlerts from '../notifications/TimesheetAlerts';
import AskAIButton from '../ai/AskAIButton';
import GlobalSearch from '../common/GlobalSearch';
import './Header.css';


const Header = ({ toggleSidebar }) => {
  const router = useRouter();
  const { subdomain } = useParams();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [tenantLogo, setTenantLogo] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
          `${API_BASE}/api/tenants/${tenantId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`}}
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
      router.push(settingsPath);
    } else {
      console.log("No tenant found, redirecting to login");
      router.push("/login");
    }
  };

  // Profile icon - goes to profile settings tab
  const goToProfileSettings = () => {
    console.log("👤 Profile icon clicked - navigating to profile settings");
    const tenant = getTenantInfo();

    if (tenant && tenant.subdomain) {
      const profilePath = `/${tenant.subdomain}/settings?tab=security`;
      console.log("Navigating to profile settings:", profilePath);
      router.push(profilePath);
    } else {
      console.log("No tenant found, redirecting to login");
      router.push("/login");
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

  // Handle logout
  const handleLogout = () => {
    // Clear all authentication data
    logout();
    
    // DO NOT clear Remember Me data - keep credentials saved for next login
    // Only clear them if user unchecks "Remember Me" on next login
    // localStorage.removeItem('rememberedEmail');
    // localStorage.removeItem('rememberedPassword');
    // localStorage.removeItem('rememberMeChecked');
    
    // Clear session storage
    sessionStorage.clear();
    
    // Clear static mode flag
    localStorage.removeItem('staticMode');
    
    // Redirect to login
    router.push('/login');
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  return (
    <header className="w-full h-[60px] flex items-center 
  bg-[#05253D] shadow-md transition-colors duration-300">

  <div className="w-full px-4 lg:px-6">
    <div className="flex items-center w-full">

      {/* Mobile Menu Toggle */}
      <button
        onClick={toggleSidebar}
        aria-label="Toggle Menu"
        title="Toggle Menu"
        className="lg:hidden text-[#466D81] text-2xl p-2 mr-2"
      >
        <i className="fas fa-bars"></i>
      </button>

      {/* Logo */}
      <div
        className="flex items-center cursor-pointer mr-4"
        onClick={() => router.push(`/${subdomain}/employee-dashboard`)}
      >
        <img
          src={tenantLogo || "/assets/images/jsTree/TimePulse4.png"}
          alt="Logo"
          className={`object-contain mr-2
            ${tenantLogo ? "max-h-[30px] max-w-[200px]" : "max-h-[70px] max-w-[280px]"}`}
        />
      </div>

<div className="hidden md:flex flex-1 max-w-xl mx-4">
        <GlobalSearch />
      </div>

      {/* Tools */}
      <div className="flex items-center gap-4 ml-auto">

        {/* Ask AI Button */}
        <div className="text-[#466D81]">
          <AskAIButton />
        </div>

        {/* Notification Bell - All Notifications */}
        <div className="text-[#466D81]">
          <NotificationBell />
        </div>

        {/* Timesheet Alerts - Specific to Timesheets */}
        {/* <div className="text-[#466D81]">
          <TimesheetAlerts subdomain={subdomain} />
        </div> */}

        {/* Theme Toggle
        <div
          className="p-2 rounded-lg hover:bg-white/10 cursor-pointer text-[#466D81]"
          onClick={toggleTheme}
          title={`Switch to ${isDarkMode ? "light" : "dark"} mode text-white`}
        >
          <i className={`fas ${isDarkMode ? "fa-sun" : "fa-moon"} text-xl text-white`}></i>
        </div> */}

        {/* Settings */}
        {(user?.role === "admin" || user?.role === "approver") && (
          <div
            className="p-2 rounded-lg hover:bg-white/10 cursor-pointer text-[#466D81]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToSettings();
            }}
            title="Settings"
          >
            <i className="fas fa-cog text-xl text-white"></i>
          </div>
        )}

        {/* User Avatar with Dropdown */}
        <div className="user-menu-container relative">
          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-8 h-8 rounded-full bg-gray-200 text-[#466D81] font-bold flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors"
            title="User Menu"
          >
            {getUserInitials()}
          </div>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email || ''}
                </p>
              </div>
              
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  goToProfileSettings();
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <i className="fas fa-user"></i>
                Profile Settings
              </button>
              
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  handleLogout();
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <i className="fas fa-sign-out-alt"></i>
                Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  </div>
</header>


  );
};

export default Header;
