'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { hasPermission, ROLES } from '@/utils/roles';
import Cookies from 'js-cookie';

// Create the context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentEmployer, setCurrentEmployer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage/cookies on component mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        // Check for token in cookies (for SSR compatibility)
        const token = Cookies.get('token') || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

        if (!token) {
          setLoading(false);
          return;
        }

        // Get user info
        const userInfo = typeof window !== 'undefined' 
          ? JSON.parse(localStorage.getItem('userInfo') || '{}')
          : {};
        const employer = typeof window !== 'undefined'
          ? JSON.parse(
              localStorage.getItem('currentEmployer') ||
                localStorage.getItem('currentTenant') ||
                'null'
            )
          : null;

        if (userInfo && Object.keys(userInfo).length > 0) {
          setUser(userInfo);
          setIsAuthenticated(true);
          setCurrentEmployer(employer);
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
  const login = (userData, employerData, token) => {
    // Store user data in localStorage and cookies
    if (token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
      }
      Cookies.set('token', token, { expires: 7 }); // 7 days
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('userInfo', JSON.stringify(userData));
      localStorage.setItem('user', JSON.stringify(userData));
      Cookies.set('user', JSON.stringify(userData), { expires: 7 });

      if (employerData) {
        localStorage.setItem('currentEmployer', JSON.stringify(employerData));
        localStorage.setItem('currentTenant', JSON.stringify(employerData));
        setCurrentEmployer(employerData);
      }
    }

    setUser(userData);
    setIsAuthenticated(true);
  };

  // OAuth login function (for Google OAuth)
  const loginWithOAuth = (userData, tenantData, token) => {
    // Store authentication token
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      Cookies.set('token', token, { expires: 7 });
    }

    // Store user info
    if (typeof window !== 'undefined') {
      const userInfo = {
        id: userData.id,
        email: userData.email,
        name: `${userData.firstName} ${userData.lastName}`,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        tenantId: userData.tenantId,
        employeeId: userData.employeeId,
        status: userData.status,
        authProvider: 'google'
      };
      localStorage.setItem('user', JSON.stringify(userInfo));
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      Cookies.set('user', JSON.stringify(userInfo), { expires: 7 });

      // Store tenant info
      if (tenantData) {
        const tenantInfo = {
          id: tenantData.id,
          name: tenantData.tenantName,
          subdomain: tenantData.subdomain,
          status: tenantData.status,
          role: userData.role
        };
        localStorage.setItem('tenants', JSON.stringify([tenantInfo]));
        localStorage.setItem('currentTenant', JSON.stringify(tenantInfo));
        localStorage.setItem('currentEmployer', JSON.stringify(tenantInfo));
        setCurrentEmployer(tenantInfo);
      }

      setUser(userInfo);
      setIsAuthenticated(true);
    }
  };

  // Logout function
  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('currentEmployer');
      localStorage.removeItem('currentTenant'); // Remove legacy item too
    }
    
    Cookies.remove('token');
    Cookies.remove('user');

    setUser(null);
    setIsAuthenticated(false);
    setCurrentEmployer(null);
  };

  // Set current employer
  const switchEmployer = (employer) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentEmployer', JSON.stringify(employer));
    }
    setCurrentEmployer(employer);
  };

  // Check if user has a specific permission
  const checkPermission = (permission) => {
    if (!user || !currentEmployer) return false;
    return hasPermission(currentEmployer.role, permission);
  };

  // Check if user is an admin
  const isAdmin = () => {
    if (!currentEmployer) return false;
    return currentEmployer.role === ROLES.ADMIN;
  };

  // Check if user is an approver
  const isApprover = () => {
    if (!currentEmployer) return false;
    return currentEmployer.role === ROLES.APPROVER;
  };

  // Check if user is an employee
  const isEmployee = () => {
    if (!currentEmployer) return false;
    return currentEmployer.role === ROLES.EMPLOYEE;
  };

  // Context value
  const value = {
    user,
    isAuthenticated,
    currentEmployer,
    loading,
    login,
    loginWithOAuth,
    logout,
    switchEmployer,
    checkPermission,
    isAdmin,
    isApprover,
    isEmployee
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
