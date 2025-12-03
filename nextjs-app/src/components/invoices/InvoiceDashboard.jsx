'use client';

// src/components/invoices/InvoiceDashboard.jsx
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { API_BASE } from '@/config/api';
import "./InvoiceDashboard.css";
import "../common/ActionsDropdown.css";

const InvoiceDashboard = () => {
  const { subdomain } = useParams();

  // Hydration fix: Track if component is mounted on client
  const [isMounted, setIsMounted] = useState(false);

  // Real data from API
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [openMenuId, setOpenMenuId] = useState(null);

  // Hydration fix: Set mounted state on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch invoices from API
  useEffect(() => {
    if (isMounted) {
      fetchInvoices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.dropdown')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleMenu = (id) => {
    setOpenMenuId(prev => prev === id ? null : id);
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
      console.log("User Info:", userInfo);
      
      if (!userInfo.tenantId) {
        throw new Error("No tenant information available");
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`};

      const url = `${API_BASE}/api/reports/invoices?tenantId=${userInfo.tenantId}`;
      console.log("Fetching invoices from:", url);

      const response = await fetch(url, { headers });
      console.log("Response status:", response.status);

      const data = await response.json();
      console.log("Invoice data received:", data);
      
      if (data.success) {
        console.log("Setting invoices:", data.data);
        setInvoices(data.data || []);
      } else {
        throw new Error(data.error || "Failed to fetch invoices");
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice) => {
    if (filterStatus !== "all") {
      const invoiceStatus = (invoice.status || '').toLowerCase();
      if (invoiceStatus !== filterStatus.toLowerCase()) {
        return false;
      }
    }
    if (filterMonth !== "all") {
      const invoiceMonth = (invoice.month || '').toLowerCase();
      if (invoiceMonth !== filterMonth.toLowerCase()) {
        return false;
      }
    }
    return true;
  });

  console.log("Total invoices:", invoices.length);
  console.log("Filtered invoices:", filteredInvoices.length);
  console.log("Filter status:", filterStatus);
  console.log("Filter month:", filterMonth);

  // Prevent hydration mismatch - don't render until mounted
  if (!isMounted) {
    return (
      <div className="nk-content">
        <div className="container-fluid">
          <div className="nk-content-inner">
            <div className="nk-content-body">
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div className="spinner-border text-primary" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nk-content">
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            <div className="nk-block-head nk-block-head-sm">
              <div className="nk-block-between">
                <div className="nk-block-head-content">
                  <h3 className="nk-block-title page-title">
                    Invoice Management
                  </h3>
                  <div className="nk-block-des text-soft">
                    <p>
                      Manage and track all vendor invoices
                    </p>
                  </div>
                </div>
                <div className="nk-block-head-content">
                  <div className="toggle-wrap nk-block-tools-toggle">
                    <Link href={`/${subdomain}/invoices/new`}
                      className="btn btn-primary"
                    >
                      <em className="icon ni ni-plus"></em>
                      <span>Create Invoice</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="nk-block">
              <div className="card card-bordered card-stretch">
                <div className="card-inner-group">
                  <div className="card-inner position-relative">
                    <div className="card-title-group">
                      <div className="card-title">
                        <h5 className="title">All Invoices</h5>
                      </div>
                      <div className="card-tools me-n1">
                        <ul className="btn-toolbar gx-1">
                          <li>
                            <div className="form-group">
                              <div className="form-control-wrap">
                                <select
                                  className="form-select form-select-sm"
                                  value={filterStatus}
                                  onChange={(e) =>
                                    setFilterStatus(e.target.value)
                                  }
                                >
                                  <option value="all">All Status</option>
                                  <option value="draft">Draft</option>
                                  <option value="generated">Generated</option>
                                  <option value="sent">Sent</option>
                                  <option value="paid">Paid</option>
                                </select>
                              </div>
                            </div>
                          </li>
                          <li>
                            <div className="form-group">
                              <div className="form-control-wrap">
                                <select
                                  className="form-select form-select-sm"
                                  value={filterMonth}
                                  onChange={(e) =>
                                    setFilterMonth(e.target.value)
                                  }
                                >
                                  <option value="all">All Months</option>
                                  <option value="july">July</option>
                                  <option value="june">June</option>
                                  <option value="may">May</option>
                                </select>
                              </div>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="card-inner p-0">
                    <div className="nk-tb-list nk-tb-orders">
                      <div className="nk-tb-item nk-tb-head">
                        <div className="nk-tb-col">
                          <span>Invoice ID</span>
                        </div>
                        <div className="nk-tb-col tb-col-md">
                          <span>Vendor</span>
                        </div>
                        <div className="nk-tb-col tb-col-md">
                          <span>Week</span>
                        </div>
                        <div className="nk-tb-col tb-col-md">
                          <span>Hours</span>
                        </div>
                        <div className="nk-tb-col">
                          <span>Amount</span>
                        </div>
                        <div className="nk-tb-col">
                          <span>Status</span>
                        </div>
                        <div className="nk-tb-col nk-tb-col-tools text-end">
                          <span className="sub-text">Actions</span>
                        </div>
                      </div>

                      {loading ? (
                        <div className="nk-tb-item">
                          <div className="nk-tb-col" style={{ textAlign: 'center', padding: '40px' }}>
                            <span>Loading invoices...</span>
                          </div>
                        </div>
                      ) : error ? (
                        <div className="nk-tb-item">
                          <div className="nk-tb-col" style={{ textAlign: 'center', padding: '40px', color: '#e85347' }}>
                            <span>{error}</span>
                          </div>
                        </div>
                      ) : filteredInvoices.length === 0 ? (
                        <div className="nk-tb-item">
                          <div className="nk-tb-col" style={{ textAlign: 'center', padding: '40px' }}>
                            <span>No invoices found matching your criteria.</span>
                          </div>
                        </div>
                      ) : (
                        filteredInvoices.map((invoice) => (
                        <div key={invoice.id} className="nk-tb-item">
                          <div className="nk-tb-col">
                            <span className="tb-lead">
                              {invoice.invoiceId || invoice.id}
                            </span>
                          </div>
                          <div className="nk-tb-col tb-col-md">
                            <span>{invoice.vendorName || invoice.vendor || 'N/A'}</span>
                          </div>
                          <div className="nk-tb-col tb-col-md">
                            <span>{invoice.week || invoice.month || 'N/A'}</span>
                          </div>
                          <div className="nk-tb-col tb-col-md">
                            <span>{invoice.totalHours || 0}</span>
                          </div>
                          <div className="nk-tb-col">
                            <span className="tb-amount">
                              ${(invoice.amount || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="nk-tb-col">
                            <span
                              className={`badge bg-outline-${
                                invoice.status === 'Active' || invoice.status === 'Paid'
                                  ? 'success'
                                  : invoice.status === 'Pending' || invoice.status === 'Generated'
                                  ? 'warning'
                                  : 'danger'
                              }`}
                            >
                              {invoice.status}
                            </span>
                          </div>
                          <div className="nk-tb-col nk-tb-col-tools">
                            <div className="dropdown" style={{ position: 'relative' }}>
                              <button
                                className="btn btn-sm btn-outline-secondary dropdown-toggle"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMenu(invoice.id);
                                }}
                                type="button"
                                ref={(el) => {
                                  if (el && openMenuId === invoice.id) {
                                    const rect = el.getBoundingClientRect();
                                    const spaceBelow = window.innerHeight - rect.bottom;
                                    if (spaceBelow < 200) {
                                      el.nextElementSibling?.classList.add('dropup');
                                    }
                                  }
                                }}
                              >
                                Actions
                              </button>
                              {openMenuId === invoice.id && (
                                <div className="dropdown-menu dropdown-menu-right show" style={{ position: 'absolute' }}>
                                  <Link href={`/invoices/view/${invoice.id}`}
                                    className="dropdown-item"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    <i className="fas fa-eye mr-1"></i> View Invoice
                                  </Link>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => {
                                      alert(`Viewing details for invoice ${invoice.invoiceId || invoice.id}`);
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    <i className="fas fa-eye mr-1"></i> View Details
                                  </button>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => {
                                      alert(`Downloading invoice ${invoice.invoiceId || invoice.id}`);
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    <i className="fas fa-download mr-1"></i> Download Invoice
                                  </button>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => {
                                      alert(`Sending invoice ${invoice.invoiceId || invoice.id}`);
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    <i className="fas fa-paper-plane mr-1"></i> Send Invoice
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="nk-block mt-5">
              <div className="row g-gs">
                <div className="col-md-6 col-lg-4">
                  <div className="card card-bordered">
                    <div className="card-inner">
                      <div className="card-title-group align-start mb-2">
                        <div className="card-title">
                          <h6 className="title">Total Invoiced</h6>
                        </div>
                      </div>
                      <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                        <div className="nk-sale-data">
                          <span className="amount">$295,000.00</span>
                          <span className="sub-title">This Month</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 col-lg-4">
                  <div className="card card-bordered">
                    <div className="card-inner">
                      <div className="card-title-group align-start mb-2">
                        <div className="card-title">
                          <h6 className="title">Payments Received</h6>
                        </div>
                      </div>
                      <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                        <div className="nk-sale-data">
                          <span className="amount">$135,000.00</span>
                          <span className="sub-title">This Month</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-12 col-lg-4">
                  <div className="card card-bordered">
                    <div className="card-inner">
                      <div className="card-title-group align-start mb-2">
                        <div className="card-title">
                          <h6 className="title">Outstanding Amount</h6>
                        </div>
                      </div>
                      <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                        <div className="nk-sale-data">
                          <span className="amount">$160,000.00</span>
                          <span className="sub-title">Total</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDashboard;
