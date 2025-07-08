// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { hasPermission, ROLES } from '../utils/roles';

// Create the context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTenant, setCurrentTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on component mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        // Check for token
        const token = localStorage.getItem('token');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        // Get user info
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const tenant = JSON.parse(localStorage.getItem('currentTenant') || 'null');
        
        if (userInfo && Object.keys(userInfo).length > 0) {
          setUser(userInfo);
          setIsAuthenticated(true);
          setCurrentTenant(tenant);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = (userData, tenantData) => {
    // Store user data in localStorage
    localStorage.setItem('token', 'mock-jwt-token');
    localStorage.setItem('userInfo', JSON.stringify(userData));
    
    if (tenantData) {
      localStorage.setItem('currentTenant', JSON.stringify(tenantData));
      setCurrentTenant(tenantData);
    }
    
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('currentTenant');
    
    setUser(null);
    setIsAuthenticated(false);
    setCurrentTenant(null);
  };

  // Set current tenant
  const switchTenant = (tenant) => {
    localStorage.setItem('currentTenant', JSON.stringify(tenant));
    setCurrentTenant(tenant);
  };

  // Check if user has a specific permission
  const checkPermission = (permission) => {
    if (!user || !currentTenant) return false;
    return hasPermission(currentTenant.role, permission);
  };

  // Check if user is an admin
  const isAdmin = () => {
    if (!currentTenant) return false;
    return currentTenant.role === ROLES.ADMIN;
  };

  // Check if user is an account manager
  const isAccountManager = () => {
    if (!currentTenant) return false;
    return currentTenant.role === ROLES.ACCOUNT_MANAGER;
  };

  // Check if user is an approver
  const isApprover = () => {
    if (!currentTenant) return false;
    return currentTenant.role === ROLES.APPROVER;
  };

  // Context value
  const value = {
    user,
    isAuthenticated,
    currentTenant,
    loading,
    login,
    logout,
    switchTenant,
    checkPermission,
    isAdmin,
    isAccountManager,
    isApprover
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
