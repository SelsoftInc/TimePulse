import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles/theme.css";
import Dashboard from "./components/dashboard/Dashboard";
import EmployeeDashboard from "./components/dashboard/EmployeeDashboard";
import TimesheetSummary from "./components/timesheets/TimesheetSummary";
import EmployeeTimesheet from "./components/timesheets/EmployeeTimesheet";
import TimesheetSubmit from "./components/timesheets/TimesheetSubmit";
import TimesheetApproval from "./components/timesheets/TimesheetApproval";
import MobileTimesheetUpload from "./components/timesheets/MobileTimesheetUpload";
import TimesheetToInvoice from './components/timesheets/TimesheetToInvoice';
import TimesheetAutoConvert from './components/timesheets/TimesheetAutoConvert';
import Invoice from "./components/invoices/Invoice";
import InvoiceDashboard from "./components/invoices/InvoiceDashboard";
import InvoiceForm from "./components/invoices/InvoiceForm";
import ReportsDashboard from "./components/reports/ReportsDashboard";
import ClientsList from "./components/clients/ClientsList";
import ClientDetails from "./components/clients/ClientDetails";
import ClientForm from "./components/clients/ClientForm";
import EmployeeList from "./components/employees/EmployeeList";
import EmployeeForm from "./components/employees/EmployeeForm";
import EmployeeDetail from "./components/employees/EmployeeDetail";
import EmployeeSettings from "./components/employees/EmployeeSettings";
import EmployeeInvite from "./components/employees/EmployeeInvite";
import EmployeeRegister from "./components/auth/EmployeeRegister";
import LeaveManagement from "./components/leave/LeaveManagement";
import EmployeeDocuments from "./components/documents/EmployeeDocuments";
import VendorList from "./components/vendors/VendorList";
import VendorForm from "./components/vendors/VendorForm";
import VendorDetail from "./components/vendors/VendorDetail";
import EmployerSettings from './components/settings/EmployerSettings';
import InvoiceSettings from './components/settings/InvoiceSettings';
import TestLogin from "./components/auth/TestLogin";
import SimpleLogin from "./components/auth/SimpleLogin";
import Register from "./components/auth/Register";
import Workspaces from "./components/workspaces/Workspaces";
import EmployerLayout from "./components/layout/EmployerLayout";

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
        <Route path="/register/:token" element={<EmployeeRegister />} />
        
        {/* Workspace management route */}
        <Route 
          path="/workspaces" 
          element={<ProtectedRoute><Workspaces /></ProtectedRoute>} 
        />
        
        {/* Employer-specific routes using EmployerLayout */}
        <Route path="/:subdomain" element={
          <ProtectedRoute><EmployerLayout><Dashboard /></EmployerLayout></ProtectedRoute>
        } />
        <Route path="/:subdomain/dashboard" element={
          <ProtectedRoute><EmployerLayout><Dashboard /></EmployerLayout></ProtectedRoute>
        } />
        <Route path="/:subdomain/employee-dashboard" element={
          <ProtectedRoute><EmployerLayout><EmployeeDashboard /></EmployerLayout></ProtectedRoute>
        } />
        <Route path="/:subdomain/timesheets" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_TIMESHEET}>
            <EmployerLayout><TimesheetSummary /></EmployerLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/timesheets/edit/:employeeId" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.EDIT_TIMESHEET}>
            <EmployerLayout><EmployeeTimesheet /></EmployerLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/timesheets/submit" element={
          <ProtectedRoute>
            <EmployerLayout><TimesheetSubmit /></EmployerLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/timesheets/mobile-upload" element={
          <ProtectedRoute>
            <EmployerLayout><MobileTimesheetUpload /></EmployerLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/timesheets/submit/:weekId" element={
          <ProtectedRoute>
            <EmployerLayout><TimesheetSubmit /></EmployerLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/timesheets/approval" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.APPROVE_TIMESHEETS}>
            <EmployerLayout><TimesheetApproval /></EmployerLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/timesheets/to-invoice" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.CREATE_INVOICE}>
            <EmployerLayout><TimesheetToInvoice /></EmployerLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/timesheets/auto-convert" element={
          <ProtectedRoute>
            <EmployerLayout><TimesheetAutoConvert /></EmployerLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/leave" element={
          <ProtectedRoute>
            <EmployerLayout><LeaveManagement /></EmployerLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/documents" element={
          <ProtectedRoute>
            <EmployerLayout><EmployeeDocuments /></EmployerLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/clients" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_CLIENT}>
            <EmployerLayout><ClientsList /></EmployerLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/clients/new" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.CREATE_CLIENT}>
            <EmployerLayout><ClientForm /></EmployerLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/clients/:clientId" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_CLIENT}>
            <EmployerLayout><ClientDetails /></EmployerLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/employees" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_EMPLOYEE}>
            <EmployerLayout><EmployeeList /></EmployerLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/employees/new" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.CREATE_EMPLOYEE}>
            <EmployerLayout><EmployeeForm /></EmployerLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/employees/invite" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.CREATE_EMPLOYEE}>
            <EmployerLayout><EmployeeInvite /></EmployerLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/employees/:id" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_EMPLOYEE}>
            <EmployerLayout><EmployeeDetail /></EmployerLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/employees/:id/settings" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.EDIT_EMPLOYEE}>
            <EmployerLayout><EmployeeSettings /></EmployerLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/vendors" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_VENDOR}>
            <EmployerLayout><VendorList /></EmployerLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/vendors/new" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.CREATE_VENDOR}>
            <EmployerLayout><VendorForm /></EmployerLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/vendors/:id" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_VENDOR}>
            <EmployerLayout><VendorDetail /></EmployerLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/invoices" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_INVOICE}>
            <EmployerLayout><Invoice /></EmployerLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/invoices/dashboard" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_INVOICE}>
            <EmployerLayout><InvoiceDashboard /></EmployerLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/invoices/create" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.CREATE_INVOICE}>
            <EmployerLayout><InvoiceForm /></EmployerLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/reports" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_REPORTS}>
            <EmployerLayout><ReportsDashboard /></EmployerLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/settings" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_SETTINGS}>
            <EmployerLayout><EmployerSettings /></EmployerLayout>
          </ProtectedRoute>
        } />
        <Route path="/:subdomain/settings/invoices" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_SETTINGS}>
            <EmployerLayout><InvoiceSettings /></EmployerLayout>
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
