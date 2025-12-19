'use client';

import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { PERMISSIONS } from '@/utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import "./Sidebar.css";
import WorkspaceSelector from './WorkspaceSelector';

const Sidebar = ({ collapsed, toggleSidebar, mobileVisible = false, isMobile = false, className = "" }) => {
  const { subdomain } = useParams();
  const [currentSubdomain, setCurrentSubdomain] = useState("selsoft");
  const pathname = usePathname();
  const currentPath = pathname;

  useEffect(() => {
    if (subdomain) {
      setCurrentSubdomain(subdomain);
    } else {
      const storedTenant = localStorage.getItem("currentTenant");
      if (storedTenant) {
        const tenant = JSON.parse(storedTenant);
        setCurrentSubdomain(tenant.subdomain || "selsoft");
      }
    }
  }, [subdomain]);

  // Determine sidebar classes based on mobile/desktop state
  const sidebarClasses = `app-sidebar ${
    isMobile 
      ? (mobileVisible ? 'mobile-visible' : '') 
      : (collapsed ? 'collapsed' : '')
  } ${className}`;

  return (
    
    <aside className={`${sidebarClasses} !bg-[#05253D] dark:!bg-[#00121F] !pt-2`}>

      <div className="sidebar-header">
        {(isMobile || !collapsed) && <WorkspaceSelector />}
        <div className="sidebar-collapse-button" onClick={toggleSidebar}>
          <i className={`fa fa-angle-${collapsed ? "right" : "left"}`}></i>
        </div>
      </div>

      <div className="sidebar-content">
        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <Link href={`/${currentSubdomain}`}
              className={`sidebar-link ${
                currentPath === `/${currentSubdomain}` ||
                currentPath === `/${currentSubdomain}/dashboard`
                  ? "active"
                  : ""
              }`}
            >
              <div className="sidebar-icon">
                <i className="fa fa-tachometer-alt"></i>
              </div>
              {(isMobile || !collapsed) && <span className="sidebar-text">Dashboard</span>}
            </Link>
          </li>

          <PermissionGuard
            requiredPermission={PERMISSIONS.VIEW_TIMESHEET}
            fallback={null}
          >
            <li className="sidebar-item">
              <Link href={`/${currentSubdomain}/timesheets`}
                className={`sidebar-link ${
                  currentPath.includes(`/${currentSubdomain}/timesheets`) &&
                  !currentPath.includes("/approval")
                    ? "active"
                    : ""
                }`}
              >
                <div className="sidebar-icon">
                  <i className="fa fa-clock"></i>
                </div>
                {(isMobile || !collapsed) && <span className="sidebar-text">Timesheets</span>}
              </Link>
            </li>
          </PermissionGuard>

          {/* Submenu hidden when collapsed */}
          {!collapsed && (
            <PermissionGuard
              requiredPermission={PERMISSIONS.APPROVE_TIMESHEETS}
              fallback={null}
            >
              <li className="sidebar-item sub-item with-vertical-line">
                <Link href={`/${currentSubdomain}/timesheets/approval`}
                  className={`sidebar-link ${
                    currentPath.includes(
                      `/${currentSubdomain}/timesheets/approval`
                    )
                      ? "active"
                      : ""
                  }`}
                >
                  <div className="sidebar-icon">
                    <i className="fa fa-check-circle"></i>
                  </div>
                  <span className="sidebar-text">Timesheet Approval</span>
                </Link>
              </li>
            </PermissionGuard>
          )}

          <PermissionGuard
            requiredPermission={PERMISSIONS.VIEW_INVOICE}
            fallback={null}
          >
            <li className="sidebar-item">
              <Link href={`/${currentSubdomain}/invoices/new`}
                className={`sidebar-link ${
                  currentPath.includes(`/${currentSubdomain}/invoices`)
                    ? "active"
                    : ""
                }`}
              >
                <div className="sidebar-icon">
                  <i className="fa fa-file-invoice"></i>
                </div>
                {(isMobile || !collapsed) && <span className="sidebar-text">Invoices</span>}
              </Link>
            </li>
          </PermissionGuard>

          <PermissionGuard
            requiredPermission={PERMISSIONS.VIEW_EMPLOYEE}
            fallback={null}
          >
            <li className="sidebar-item">
              <Link href={`/${currentSubdomain}/employees`}
                className={`sidebar-link ${
                  currentPath.includes(`/${currentSubdomain}/employees`)
                    ? "active"
                    : ""
                }`}
              >
                <div className="sidebar-icon">
                  <i className="fa fa-user-tie"></i>
                </div>
                {(isMobile || !collapsed) && <span className="sidebar-text">Employees</span>}
              </Link>
            </li>
          </PermissionGuard>

          <PermissionGuard
            requiredPermission={PERMISSIONS.VIEW_VENDOR}
            fallback={null}
          >
            <li className="sidebar-item">
              <Link href={`/${currentSubdomain}/vendors`}
                className={`sidebar-link ${
                  currentPath.includes(`/${currentSubdomain}/vendors`) &&
                  !new URLSearchParams(window.location.search).get(
                    "implPartner"
                  )
                    ? "active"
                    : ""
                }`}
              >
                <div className="sidebar-icon">
                  <i class="fa-solid fa-people-carry-box"></i>
                </div>
                {(isMobile || !collapsed) && <span className="sidebar-text">Vendors</span>}
              </Link>
            </li>
          </PermissionGuard>

          <PermissionGuard
            requiredPermission={PERMISSIONS.VIEW_CLIENT}
            fallback={null}
          >
            <li className="sidebar-item">
              <Link href={`/${currentSubdomain}/clients`}
                className={`sidebar-link ${
                  currentPath.includes(`/${currentSubdomain}/clients`)
                    ? "active"
                    : ""
                }`}
              >
                <div className="sidebar-icon">
                  <i className="fa fa-users"></i>
                </div>
                {!collapsed && (
                  <span className="sidebar-text">End Clients</span>
                )}
              </Link>
            </li>
          </PermissionGuard>

          <PermissionGuard
            requiredPermission={PERMISSIONS.VIEW_IMPLEMENTATION_PARTNER}
            fallback={null}
          >
            <li className="sidebar-item">
              <Link href={`/${currentSubdomain}/implementation-partners`}
                className={`sidebar-link ${
                  currentPath.includes(`/${currentSubdomain}/implementation-partners`)
                    ? "active"
                    : ""
                }`}
              >
                <div className="sidebar-icon">
                  <i className="fa fa-handshake"></i>
                </div>
                {!collapsed && (
                  <span className="sidebar-text">Impl Partners</span>
                )}
              </Link>
            </li>
          </PermissionGuard>

          <li className="sidebar-item">
            <Link href={`/${currentSubdomain}/leave-management`}
              className={`sidebar-link ${
                currentPath.includes(`/${currentSubdomain}/leave-management`)
                  ? "active"
                  : ""
              }`}
            >
              <div className="sidebar-icon">
                <i className="fa fa-calendar-alt"></i>
              </div>
              {(isMobile || !collapsed) && <span className="sidebar-text">Leave Management</span>}
            </Link>
          </li>

          <PermissionGuard
            requiredPermission={PERMISSIONS.VIEW_REPORTS}
            fallback={null}
          >
            <li className="sidebar-item">
              <Link href={`/${currentSubdomain}/reports`}
                className={`sidebar-link ${
                  currentPath.includes(`/${currentSubdomain}/reports`)
                    ? "active"
                    : ""
                }`}
              >
                <div className="sidebar-icon">
                  <i className="fa fa-chart-bar"></i>
                </div>
                {(isMobile || !collapsed) && <span className="sidebar-text">Reports</span>}
              </Link>
            </li>
          </PermissionGuard>

          <PermissionGuard
            requiredPermission={PERMISSIONS.VIEW_SETTINGS}
            fallback={null}
          >
            <li className="sidebar-item">
              <Link href={`/${currentSubdomain}/settings`}
                className={`sidebar-link ${
                  currentPath.includes(`/${currentSubdomain}/settings`)
                    ? "active"
                    : ""
                }`}
              >
                <div className="sidebar-icon">
                  <i className="fa fa-cog"></i>
                </div>
                {(isMobile || !collapsed) && <span className="sidebar-text">Settings</span>}
              </Link>
            </li>
          </PermissionGuard>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
