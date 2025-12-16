'use client';

import { useRouter, useParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { API_BASE } from '@/config/api';
import "./InvoiceCreation.css";

const InvoiceCreation = () => {
  const router = useRouter();
  const { subdomain } = useParams();

  const [creationMode, setCreationMode] = useState(null); // 'quick' or 'manual'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Data for manual population
  const [vendors, setVendors] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
      const token = localStorage.getItem("token");

      if (!userInfo.tenantId) {
        throw new Error("No tenant information available");
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`};

      // Fetch vendors, employees, and clients in parallel
      const [vendorsRes, employeesRes, clientsRes] = await Promise.all([
        fetch(
          `${API_BASE}/api/vendors?tenantId=${userInfo.tenantId}`,
          { headers }
        ),
        fetch(
          `${API_BASE}/api/employees?tenantId=${userInfo.tenantId}`,
          { headers }
        ),
        fetch(
          `${API_BASE}/api/clients?tenantId=${userInfo.tenantId}`,
          { headers }
        ),
      ]);

      const [vendorsData, employeesData, clientsData] = await Promise.all([
        vendorsRes.json(),
        employeesRes.json(),
        clientsRes.json(),
      ]);

      if (vendorsData.success) setVendors(vendorsData.vendors || []);
      if (employeesData.success) setEmployees(employeesData.employees || []);
      if (clientsData.success) setClients(clientsData.clients || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCreate = () => {
    // Navigate to quick invoice creation (existing form)
    router.push(`/${subdomain}/invoices`);
  };

  const handleManualCreate = () => {
    // Navigate to manual invoice creation with pre-populated data
    router.push(`/${subdomain}/invoices/new/manual`);
  };

  const handleBack = () => {
    router.push(`/${subdomain}/invoices/new`);
  };

  if (loading) {
    return (
      <div className="invoice-creation-container">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invoice-creation-container">
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={fetchData} className="btn btn-primary">
            <i className="fas fa-refresh mr-1"></i> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-creation-container">
      <div className="invoice-creation-header">
        <button onClick={handleBack} className="btn btn-back">
          <i className="fas fa-arrow-left mr-1"></i> Back to Invoices
        </button>
        <h1>Create New Invoice</h1>
        <p>Choose how you'd like to create your invoice</p>
      </div>

      <div className="creation-options">
        <div className="creation-option-card" onClick={handleQuickCreate}>
          <div className="option-icon">
            <i className="fas fa-bolt"></i>
          </div>
          <h3>Quick Create</h3>
          <p>
            Create an invoice quickly with basic information. You can add vendor
            and employee details manually.
          </p>
          <div className="option-features">
            <div className="feature-item">
              <i className="fas fa-check"></i>
              <span>Fast setup</span>
            </div>
            <div className="feature-item">
              <i className="fas fa-check"></i>
              <span>Manual data entry</span>
            </div>
            <div className="feature-item">
              <i className="fas fa-check"></i>
              <span>Custom line items</span>
            </div>
          </div>
          <button className="btn btn-primary btn-block">
            <i className="fas fa-plus mr-1"></i> Quick Create
          </button>
        </div>

        <div className="creation-option-card" onClick={handleManualCreate}>
          <div className="option-icon">
            <i className="fas fa-users-cog"></i>
          </div>
          <h3>Manual Population</h3>
          <p>
            Create an invoice by selecting from existing vendors, employees, and
            clients. Pre-populate data automatically.
          </p>
          <div className="option-features">
            <div className="feature-item">
              <i className="fas fa-check"></i>
              <span>Select from existing data</span>
            </div>
            <div className="feature-item">
              <i className="fas fa-check"></i>
              <span>Auto-populate details</span>
            </div>
            <div className="feature-item">
              <i className="fas fa-check"></i>
              <span>Vendor & employee integration</span>
            </div>
          </div>
          <div className="data-summary">
            <div className="data-item">
              <i className="fas fa-building"></i>
              <span>{vendors.length} Vendors</span>
            </div>
            <div className="data-item">
              <i className="fas fa-users"></i>
              <span>{employees.length} Employees</span>
            </div>
            <div className="data-item">
              <i className="fas fa-handshake"></i>
              <span>{clients.length} Clients</span>
            </div>
          </div>
          <button className="btn btn-primary btn-block">
            <i className="fas fa-cogs mr-1"></i> Manual Population
          </button>
        </div>
      </div>

      <div className="creation-help">
        <div className="help-card">
          <i className="fas fa-info-circle"></i>
          <div>
            <h4>Need Help?</h4>
            <p>
              Choose "Quick Create" for simple invoices or "Manual Population"
              to leverage your existing vendor, employee, and client data for
              faster invoice creation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCreation;
