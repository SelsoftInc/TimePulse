// src/components/common/RoleSelector.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../utils/roles';
import './RoleSelector.css';

/**
 * RoleSelector component for switching between roles
 * This is primarily for testing purposes in the demo environment
 */
const RoleSelector = () => {
  const { currentTenant, switchTenant } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  // Only admins can switch roles in a real environment
  // For demo purposes, we'll allow role switching regardless
  
  const handleRoleChange = (role) => {
    if (!currentTenant) return;
    
    // Create a new tenant object with the updated role
    const updatedTenant = {
      ...currentTenant,
      role: role
    };
    
    // Update the tenant in context and localStorage
    switchTenant(updatedTenant);
    setIsOpen(false);
  };
  
  // Get current role display name
  const getCurrentRoleDisplay = () => {
    if (!currentTenant) return 'No Role';
    
    switch (currentTenant.role) {
      case ROLES.ADMIN:
        return 'Admin';
      case ROLES.ACCOUNT_MANAGER:
        return 'Account Manager';
      case ROLES.APPROVER:
        return 'Approver';
      default:
        return currentTenant.role || 'Unknown Role';
    }
  };
  
  return (
    <div className="role-selector">
      <div className="role-selector-current" onClick={() => setIsOpen(!isOpen)}>
        <span className="role-label">Role:</span>
        <span className="role-value">{getCurrentRoleDisplay()}</span>
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
      </div>
      
      {isOpen && (
        <div className="role-selector-dropdown">
          <div 
            className={`role-option ${currentTenant?.role === ROLES.ADMIN ? 'active' : ''}`}
            onClick={() => handleRoleChange(ROLES.ADMIN)}
          >
            Admin
          </div>
          <div 
            className={`role-option ${currentTenant?.role === ROLES.ACCOUNT_MANAGER ? 'active' : ''}`}
            onClick={() => handleRoleChange(ROLES.ACCOUNT_MANAGER)}
          >
            Account Manager
          </div>
          <div 
            className={`role-option ${currentTenant?.role === ROLES.APPROVER ? 'active' : ''}`}
            onClick={() => handleRoleChange(ROLES.APPROVER)}
          >
            Approver
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSelector;
