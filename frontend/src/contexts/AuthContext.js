// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import { hasPermission, ROLES } from "../utils/roles";

// Create the context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentEmployer, setCurrentEmployer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on component mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        // Check for token
        const token = localStorage.getItem("token");

        if (!token) {
          setLoading(false);
          return;
        }

        // Get user info
        const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
        const employer = JSON.parse(
          localStorage.getItem("currentEmployer") ||
            localStorage.getItem("currentTenant") ||
            "null"
        );

        if (userInfo && Object.keys(userInfo).length > 0) {
          setUser(userInfo);
          setIsAuthenticated(true);
          setCurrentEmployer(employer);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = (userData, employerData, token) => {
    // Store user data in localStorage
    if (token) {
      localStorage.setItem("token", token);
    }
    localStorage.setItem("userInfo", JSON.stringify(userData));

    if (employerData) {
      localStorage.setItem("currentEmployer", JSON.stringify(employerData));
      setCurrentEmployer(employerData);
    }

    setUser(userData);
    setIsAuthenticated(true);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    localStorage.removeItem("currentEmployer");
    localStorage.removeItem("currentTenant"); // Remove legacy item too

    setUser(null);
    setIsAuthenticated(false);
    setCurrentEmployer(null);
  };

  // Set current employer
  const switchEmployer = (employer) => {
    localStorage.setItem("currentEmployer", JSON.stringify(employer));
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
    logout,
    switchEmployer,
    checkPermission,
    isAdmin,
    isApprover,
    isEmployee,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
