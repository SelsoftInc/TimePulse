// src/utils/roles.js
// Role definitions and permission management for Selsoft

/**
 * Role definitions
 * - Admin: Can create Employees, Vendors, End Clients and manage all aspects of the system
 * - Account Manager: Can manage projects, timesheets, and invoices but cannot create users
 * - Approver: Can approve timesheets and invoices but has limited management capabilities
 */
export const ROLES = {
  ADMIN: 'admin',
  ACCOUNT_MANAGER: 'account_manager',
  APPROVER: 'approver',
};

/**
 * Permission definitions
 */
export const PERMISSIONS = {
  // User management permissions
  CREATE_EMPLOYEE: 'create_employee',
  EDIT_EMPLOYEE: 'edit_employee',
  VIEW_EMPLOYEE: 'view_employee',
  DELETE_EMPLOYEE: 'delete_employee',
  
  CREATE_VENDOR: 'create_vendor',
  EDIT_VENDOR: 'edit_vendor',
  VIEW_VENDOR: 'view_vendor',
  DELETE_VENDOR: 'delete_vendor',
  
  CREATE_CLIENT: 'create_client',
  EDIT_CLIENT: 'edit_client',
  VIEW_CLIENT: 'view_client',
  DELETE_CLIENT: 'delete_client',
  
  // Timesheet permissions
  CREATE_TIMESHEET: 'create_timesheet',
  EDIT_TIMESHEET: 'edit_timesheet',
  VIEW_TIMESHEET: 'view_timesheet',
  APPROVE_TIMESHEET: 'approve_timesheet',
  
  // Invoice permissions
  CREATE_INVOICE: 'create_invoice',
  EDIT_INVOICE: 'edit_invoice',
  VIEW_INVOICE: 'view_invoice',
  APPROVE_INVOICE: 'approve_invoice',
  
  // Report permissions
  VIEW_REPORTS: 'view_reports',
  EXPORT_REPORTS: 'export_reports',
  
  // Settings permissions
  MANAGE_SETTINGS: 'manage_settings',
};

/**
 * Role-based permission mapping
 */
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Admin has all permissions
    ...Object.values(PERMISSIONS),
  ],
  
  [ROLES.ACCOUNT_MANAGER]: [
    // User management - limited
    PERMISSIONS.VIEW_EMPLOYEE,
    PERMISSIONS.EDIT_EMPLOYEE,
    
    PERMISSIONS.VIEW_VENDOR,
    PERMISSIONS.EDIT_VENDOR,
    
    PERMISSIONS.VIEW_CLIENT,
    PERMISSIONS.EDIT_CLIENT,
    
    // Full timesheet management
    PERMISSIONS.CREATE_TIMESHEET,
    PERMISSIONS.EDIT_TIMESHEET,
    PERMISSIONS.VIEW_TIMESHEET,
    PERMISSIONS.APPROVE_TIMESHEET,
    
    // Full invoice management
    PERMISSIONS.CREATE_INVOICE,
    PERMISSIONS.EDIT_INVOICE,
    PERMISSIONS.VIEW_INVOICE,
    PERMISSIONS.APPROVE_INVOICE,
    
    // Reports
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    
    // Limited settings
    PERMISSIONS.MANAGE_SETTINGS,
  ],
  
  [ROLES.APPROVER]: [
    // User management - view only
    PERMISSIONS.VIEW_EMPLOYEE,
    PERMISSIONS.VIEW_VENDOR,
    PERMISSIONS.VIEW_CLIENT,
    
    // Timesheet - view and approve only
    PERMISSIONS.VIEW_TIMESHEET,
    PERMISSIONS.APPROVE_TIMESHEET,
    
    // Invoice - view and approve only
    PERMISSIONS.VIEW_INVOICE,
    PERMISSIONS.APPROVE_INVOICE,
    
    // Reports - view only
    PERMISSIONS.VIEW_REPORTS,
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
  
  return permissions.some(permission => hasPermission(userRole, permission));
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
