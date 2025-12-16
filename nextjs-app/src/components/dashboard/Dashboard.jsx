'use client';

import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ModernDashboard from './ModernDashboard';
import "./Dashboard.css";

// Main Dashboard component
const Dashboard = () => {
  const { currentEmployer } = useAuth();
  const router = useRouter();
  const { subdomain } = useParams();

  // Redirect employees to their dedicated dashboard
  useEffect(() => {
    console.log("Dashboard - currentEmployer:", currentEmployer);
    console.log("Dashboard - currentEmployer.role:", currentEmployer?.role);

    // Only redirect if user is ONLY an employee (not admin or approver)
    if (currentEmployer?.role === "employee") {
      console.log("Redirecting employee to employee-dashboard");
      router.push(`/${subdomain}/employee-dashboard`, { replace: true });
    }
  }, [currentEmployer, router, subdomain]);

  // Determine if user is in employee role
  const isEmployeeRole = currentEmployer?.role === "employee";

  // If employee role, show employee dashboard
  if (isEmployeeRole) {
    return <div>Redirecting to employee dashboard...</div>;
  }

  // Show modern dashboard for admin/approver roles
  return <ModernDashboard />;
};

export default Dashboard;
