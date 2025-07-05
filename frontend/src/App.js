import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles/theme.css";
import Dashboard from "./components/dashboard/Dashboard";
import Timesheet from "./components/timesheets/Timesheet";
import EmployeeTimesheet from "./components/timesheets/EmployeeTimesheet";
import Invoice from "./components/invoices/Invoice";
import InvoiceDashboard from "./components/invoices/InvoiceDashboard";
import ReportsDashboard from "./components/reports/ReportsDashboard";
import ClientsList from "./components/clients/ClientsList";
import ClientOverview from "./components/clients/ClientOverview";
import TenantSettings from "./components/settings/TenantSettings";
import TestLogin from "./components/auth/TestLogin";
import SimpleLogin from "./components/auth/SimpleLogin";
import Register from "./components/auth/Register";
import Workspaces from "./components/workspaces/Workspaces";
import TenantLayout from "./components/layout/TenantLayout";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userInfo = localStorage.getItem('userInfo');
      
      if (token && userInfo) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    };
    
    // Initial check
    checkAuth();
    
    // Set up event listener for storage changes
    const handleStorageChange = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for auth changes within the same window
    window.addEventListener('auth-change', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleStorageChange);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/simple-login" />} />
        <Route path="/login" element={<Navigate to="/simple-login" />} />
        <Route path="/test-login" element={!isAuthenticated ? <TestLogin /> : <Navigate to="/workspaces" />} />
        <Route path="/simple-login" element={!isAuthenticated ? <SimpleLogin /> : <Navigate to="/workspaces" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/workspaces" />} />
        
        {/* Workspace management route */}
        <Route 
          path="/workspaces" 
          element={isAuthenticated ? <Workspaces /> : <Navigate to="/login" />} 
        />
        
        {/* Tenant-specific routes using TenantLayout */}
        <Route path="/:subdomain" element={
          isAuthenticated ? <TenantLayout><Dashboard /></TenantLayout> : <Navigate to="/simple-login" />
        } />
        <Route path="/:subdomain/dashboard" element={
          isAuthenticated ? <TenantLayout><Dashboard /></TenantLayout> : <Navigate to="/simple-login" />
        } />
        <Route path="/:subdomain/timesheets" element={
          isAuthenticated ? <TenantLayout><Timesheet /></TenantLayout> : <Navigate to="/simple-login" />
        } />
        <Route path="/:subdomain/timesheets/edit/:employeeId" element={
          isAuthenticated ? <TenantLayout><EmployeeTimesheet /></TenantLayout> : <Navigate to="/simple-login" />
        } />
        <Route path="/:subdomain/clients" element={
          isAuthenticated ? <TenantLayout><ClientsList /></TenantLayout> : <Navigate to="/simple-login" />
        } />
        <Route path="/:subdomain/clients/:clientId" element={
          isAuthenticated ? <TenantLayout><ClientOverview /></TenantLayout> : <Navigate to="/simple-login" />
        } />
        <Route path="/:subdomain/invoices" element={
          isAuthenticated ? <TenantLayout><Invoice /></TenantLayout> : <Navigate to="/simple-login" />
        } />
        <Route path="/:subdomain/invoices/dashboard" element={
          isAuthenticated ? <TenantLayout><InvoiceDashboard /></TenantLayout> : <Navigate to="/simple-login" />
        } />
        <Route path="/:subdomain/reports" element={
          isAuthenticated ? <TenantLayout><ReportsDashboard /></TenantLayout> : <Navigate to="/simple-login" />
        } />
        <Route path="/:subdomain/settings" element={
          isAuthenticated ? <TenantLayout><TenantSettings /></TenantLayout> : <Navigate to="/simple-login" />
        } />
        
        {/* Fallback route */}
        <Route path="*" element={isAuthenticated ? <Navigate to="/workspaces" /> : <Navigate to="/simple-login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
