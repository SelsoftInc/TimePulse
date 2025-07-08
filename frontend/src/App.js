import React from "react";
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
import ClientForm from "./components/clients/ClientForm";
import EmployeeList from "./components/employees/EmployeeList";
import EmployeeForm from "./components/employees/EmployeeForm";
import EmployeeDetail from "./components/employees/EmployeeDetail";
import VendorList from "./components/vendors/VendorList";
import VendorForm from "./components/vendors/VendorForm";
import TenantSettings from "./components/settings/TenantSettings";
import TestLogin from "./components/auth/TestLogin";
import SimpleLogin from "./components/auth/SimpleLogin";
import Register from "./components/auth/Register";
import Workspaces from "./components/workspaces/Workspaces";
import TenantLayout from "./components/layout/TenantLayout";

// Import AuthProvider and useAuth hook
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { PERMISSIONS } from "./utils/roles";

// Protected route component that checks authentication and permissions
const ProtectedRoute = ({ children, requiredPermission }) => {
  const { isAuthenticated, checkPermission, loading } = useAuth();
  
  // Show loading state while auth is being initialized
  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }
  
  // Check authentication
  if (!isAuthenticated) {
    return <Navigate to="/simple-login" />;
  }
  
  // If permission is required, check if user has it
  if (requiredPermission && !checkPermission(requiredPermission)) {
    // Redirect to dashboard if user doesn't have required permission
    return <Navigate to="/workspaces" />;
  }
  
  // User is authenticated and has required permission
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/simple-login" />} />
        <Route path="/login" element={<Navigate to="/simple-login" />} />
        <Route path="/test-login" element={<TestLogin />} />
        <Route path="/simple-login" element={<SimpleLogin />} />
        <Route path="/register" element={<Register />} />
        
        {/* Workspace management route */}
        <Route 
          path="/workspaces" 
          element={<ProtectedRoute><Workspaces /></ProtectedRoute>} 
        />
        
        {/* Tenant-specific routes using TenantLayout */}
        <Route path="/:subdomain" element={
          <ProtectedRoute><TenantLayout><Dashboard /></TenantLayout></ProtectedRoute>
        } />
        <Route path="/:subdomain/dashboard" element={
          <ProtectedRoute><TenantLayout><Dashboard /></TenantLayout></ProtectedRoute>
        } />
        <Route path="/:subdomain/timesheets" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_TIMESHEET}>
            <TenantLayout><Timesheet /></TenantLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/timesheets/edit/:employeeId" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.EDIT_TIMESHEET}>
            <TenantLayout><EmployeeTimesheet /></TenantLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/clients" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_CLIENT}>
            <TenantLayout><ClientsList /></TenantLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/clients/new" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.CREATE_CLIENT}>
            <TenantLayout><ClientForm /></TenantLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/clients/:clientId" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_CLIENT}>
            <TenantLayout><ClientOverview /></TenantLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/employees" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_EMPLOYEE}>
            <TenantLayout><EmployeeList /></TenantLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/employees/new" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.CREATE_EMPLOYEE}>
            <TenantLayout><EmployeeForm /></TenantLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/employees/:id" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_EMPLOYEE}>
            <TenantLayout><EmployeeDetail /></TenantLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/vendors" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_VENDOR}>
            <TenantLayout><VendorList /></TenantLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/vendors/new" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.CREATE_VENDOR}>
            <TenantLayout><VendorForm /></TenantLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/invoices" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_INVOICE}>
            <TenantLayout><Invoice /></TenantLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/invoices/dashboard" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_INVOICE}>
            <TenantLayout><InvoiceDashboard /></TenantLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/reports" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_REPORTS}>
            <TenantLayout><ReportsDashboard /></TenantLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/settings" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_SETTINGS}>
            <TenantLayout><TenantSettings /></TenantLayout>
          </ProtectedRoute>
        } />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/simple-login" />} />
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
