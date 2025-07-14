// src/components/common/RoleSelector.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../utils/roles';
import RoleAuthService from '../../services/RoleAuthService';
import './RoleSelector.css';

/**
 * RoleSelector component for switching between roles
 * This is primarily for testing purposes in the demo environment
 */
const RoleSelector = () => {
  const { currentEmployer, switchEmployer, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.role-selector')) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);
  
  const handleRoleChange = (role) => {
    if (!currentEmployer) return;
    
    // Create a new employer object with the updated role
    const updatedEmployer = {
      ...currentEmployer,
      role: role
    };
    
    // Update the employer in context and localStorage
    switchEmployer(updatedEmployer);
    setIsOpen(false);
  };
  
  // Function to get a user-friendly display name for the current role
  const getCurrentRoleDisplay = () => {
    if (!currentEmployer) return 'Employee';
    
    switch(currentEmployer.role) {
      case ROLES.ADMIN:
        return 'Admin';
      case ROLES.ACCOUNT_MANAGER:
        return 'Manager';
      case ROLES.APPROVER:
        return 'Approver';
      case 'employee':
      default:
        return 'Employee';
    }
  };
  
  // Function to get the icon for the current role
  const getCurrentRoleIcon = () => {
    if (!currentEmployer) return 'fa-user';
    
    switch(currentEmployer.role) {
      case ROLES.ADMIN:
        return 'fa-user-shield';
      case ROLES.ACCOUNT_MANAGER:
        return 'fa-user-tie';
      case ROLES.APPROVER:
        return 'fa-user-check';
      case 'employee':
      default:
        return 'fa-user';
    }
  };
  
  // Check if a separate login is required for a role
  const isRoleLoginRequired = (role) => {
    return RoleAuthService.isLoginRequiredForRole(role);
  };
  
  // Get available roles for the current user
  const availableRoles = user ? RoleAuthService.getAvailableRolesForUser(user) : [
    { id: 'employee', name: 'Employee', icon: 'fa-user' },
    { id: ROLES.ADMIN, name: 'Admin', icon: 'fa-user-shield' },
    { id: ROLES.ACCOUNT_MANAGER, name: 'Manager', icon: 'fa-user-tie' },
    { id: ROLES.APPROVER, name: 'Approver', icon: 'fa-user-check' }
  ];

  return (
    <div className="role-selector">
      <button 
        className="role-selector-button" 
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title="Switch role"
        data-testid="role-selector-button"
      >
        <div className="role-button-content">
          <i className={`fas ${getCurrentRoleIcon()} role-button-icon`}></i>
          <span className="role-current">{getCurrentRoleDisplay()}</span>
        </div>
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} role-chevron`}></i>
      </button>
      
      {isOpen && (
        <div className="role-selector-dropdown">
          <div className="role-dropdown-header">Switch Role</div>
          
          {availableRoles.map(role => (
            <div 
              key={role.id}
              className={`role-option ${currentEmployer?.role === role.id ? 'active' : ''}`}
              onClick={() => handleRoleChange(role.id)}
              data-testid={`role-option-${role.id}`}
            >
              <i className={`fas ${role.icon} role-icon`}></i>
              <span>{role.name}</span>
              {currentEmployer?.role === role.id && <i className="fas fa-check role-check"></i>}
              {isRoleLoginRequired(role.id) && <span className="role-login-required">Login Required</span>}
            </div>
          ))}
          
          <div className="role-dropdown-footer">
            <small>Future version will require separate login for each role</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSelector;
