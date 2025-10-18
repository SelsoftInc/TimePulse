// src/utils/roles.js
// Role definitions and permission management for Selsoft

/**
 * Role definitions
 * - Admin: Can create Employees, Vendors, End Clients and manage all aspects of the system
 * - Approver: Can approve timesheets and invoices but has limited management capabilities
 * - Employee: Can create and view their own timesheets
 */
export const ROLES = {
  ADMIN: "admin",
  APPROVER: "approver",
  EMPLOYEE: "employee",
};

/**
 * Permission definitions
 */
export const PERMISSIONS = {
  // User management permissions
  CREATE_EMPLOYEE: "create_employee",
  EDIT_EMPLOYEE: "edit_employee",
  VIEW_EMPLOYEE: "view_employee",
  DELETE_EMPLOYEE: "delete_employee",

  CREATE_VENDOR: "create_vendor",
  EDIT_VENDOR: "edit_vendor",
  VIEW_VENDOR: "view_vendor",
  DELETE_VENDOR: "delete_vendor",

  CREATE_CLIENT: "create_client",
  EDIT_CLIENT: "edit_client",
  VIEW_CLIENT: "view_client",
  DELETE_CLIENT: "delete_client",

  CREATE_IMPLEMENTATION_PARTNER: "create_implementation_partner",
  EDIT_IMPLEMENTATION_PARTNER: "edit_implementation_partner",
  VIEW_IMPLEMENTATION_PARTNER: "view_implementation_partner",
  DELETE_IMPLEMENTATION_PARTNER: "delete_implementation_partner",

  // Timesheet permissions
  CREATE_TIMESHEET: "create_timesheet",
  EDIT_TIMESHEET: "edit_timesheet",
  VIEW_TIMESHEET: "view_timesheet",
  APPROVE_TIMESHEET: "approve_timesheet",
  APPROVE_TIMESHEETS: "approve_timesheets", // Bulk approval workflow

  // Invoice permissions
  CREATE_INVOICE: "create_invoice",
  EDIT_INVOICE: "edit_invoice",
  VIEW_INVOICE: "view_invoice",
  APPROVE_INVOICE: "approve_invoice",

  // Report permissions
  VIEW_REPORTS: "view_reports",
  EXPORT_REPORTS: "export_reports",

  // Settings permissions
  VIEW_SETTINGS: "view_settings",
  MANAGE_SETTINGS: "manage_settings",
};

/**
 * Role-based permission mapping
 */
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Admin has all permissions
    ...Object.values(PERMISSIONS),
  ],

  [ROLES.APPROVER]: [
    // Employee management - full access
    PERMISSIONS.CREATE_EMPLOYEE,
    PERMISSIONS.EDIT_EMPLOYEE,
    PERMISSIONS.VIEW_EMPLOYEE,
    PERMISSIONS.DELETE_EMPLOYEE,

    // Vendor management - full access
    PERMISSIONS.CREATE_VENDOR,
    PERMISSIONS.EDIT_VENDOR,
    PERMISSIONS.VIEW_VENDOR,
    PERMISSIONS.DELETE_VENDOR,

    // Client management - full access
    PERMISSIONS.CREATE_CLIENT,
    PERMISSIONS.EDIT_CLIENT,
    PERMISSIONS.VIEW_CLIENT,
    PERMISSIONS.DELETE_CLIENT,

    // Implementation Partner management - full access
    PERMISSIONS.CREATE_IMPLEMENTATION_PARTNER,
    PERMISSIONS.EDIT_IMPLEMENTATION_PARTNER,
    PERMISSIONS.VIEW_IMPLEMENTATION_PARTNER,
    PERMISSIONS.DELETE_IMPLEMENTATION_PARTNER,

    // Timesheet - view and approve only
    PERMISSIONS.VIEW_TIMESHEET,
    PERMISSIONS.APPROVE_TIMESHEET,
    PERMISSIONS.APPROVE_TIMESHEETS,

    // Invoice - view and approve only
    PERMISSIONS.VIEW_INVOICE,
    PERMISSIONS.APPROVE_INVOICE,

    // Reports - view only
    PERMISSIONS.VIEW_REPORTS,

    // Settings - view only
    PERMISSIONS.VIEW_SETTINGS,
  ],

  [ROLES.EMPLOYEE]: [
    // Timesheet - create and view own timesheets
    PERMISSIONS.CREATE_TIMESHEET,
    PERMISSIONS.VIEW_TIMESHEET,
    PERMISSIONS.EDIT_TIMESHEET,

    // Settings - view only
    PERMISSIONS.VIEW_SETTINGS,
  ],
};

/**
 * Check if a user has a specific permission
 * @param {string} userRole - The role of the user
 * @param {string} permission - The permission to check
 * @returns {boolean} - Whether the user has the permission
 */
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;

  // Convert role to lowercase for case-insensitive comparison
  const normalizedRole = userRole.toLowerCase();

  // Check if the role exists
  if (!ROLE_PERMISSIONS[normalizedRole]) return false;

  // Check if the role has the permission
  return ROLE_PERMISSIONS[normalizedRole].includes(permission);
};

/**
 * Check if a user has any of the specified permissions
 * @param {string} userRole - The role of the user
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} - Whether the user has any of the permissions
 */
export const hasAnyPermission = (userRole, permissions) => {
  if (!userRole || !permissions || !Array.isArray(permissions)) return false;

  return permissions.some((permission) => hasPermission(userRole, permission));
};

/**
 * Get all permissions for a role
 * @param {string} userRole - The role of the user
 * @returns {string[]} - Array of permissions for the role
 */
export const getRolePermissions = (userRole) => {
  if (!userRole) return [];

  // Convert role to lowercase for case-insensitive comparison
  const normalizedRole = userRole.toLowerCase();

  // Return permissions for the role or empty array if role doesn't exist
  return ROLE_PERMISSIONS[normalizedRole] || [];
};
