import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import Dashboard from "./components/dashboard/Dashboard";
import Timesheet from "./components/timesheets/Timesheet";
import EmployeeTimesheet from "./components/timesheets/EmployeeTimesheet";
import InvoiceDashboard from "./components/invoices/InvoiceDashboard";
import ReportsDashboard from "./components/reports/ReportsDashboard";
import ClientOverview from "./components/clients/ClientOverview";
import TenantSettings from "./components/settings/TenantSettings";

// Settings component now uses TenantSettings

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <BrowserRouter>
      <div className="nk-app-root">
        <Header toggleSidebar={toggleSidebar} />
        <div className="nk-main-container">
          <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          <main className={`nk-main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/timesheets" element={<Timesheet />} />
              <Route path="/timesheets/edit/:employeeId" element={<EmployeeTimesheet />} />
              <Route path="/clients/:clientId" element={<ClientOverview />} />
              <Route path="/invoices" element={<InvoiceDashboard />} />
              <Route path="/reports" element={<ReportsDashboard />} />
              <Route path="/settings" element={<TenantSettings />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
