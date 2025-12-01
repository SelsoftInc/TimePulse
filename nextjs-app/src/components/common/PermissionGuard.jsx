// src/components/common/PermissionGuard.jsx
import { useAuth } from '@/contexts/AuthContext';

/**
 * PermissionGuard component to conditionally render children based on user permissions
 * 
 * @param {Object} props
 * @param {string|string[]} props.requiredPermission - Permission(s) required to render children
 * @param {React.ReactNode} props.children - Content to render if user has permission
 * @param {React.ReactNode} props.fallback - Optional content to render if user doesn't have permission
 * @returns {React.ReactNode}
 */
const PermissionGuard = ({ requiredPermission, children, fallback = null }) => {
  const { checkPermission } = useAuth();
  
  // Check if user has any of the required permissions
  const hasAccess = Array.isArray(requiredPermission)
    ? requiredPermission.some(permission => checkPermission(permission))
    : checkPermission(requiredPermission);
  
  // Render children if user has permission, otherwise render fallback
  return hasAccess ? children : fallback;
};

export default PermissionGuard;
