import React, { useState, useEffect } from "react";
import { API_BASE } from '../../config/api';
import "./Invoice.css";

// Utility function for status display
const getStatusDisplay = (status) => {
  const statusLower = (status || 'draft').toLowerCase();
  switch (statusLower) {
    case "draft":
      return { class: "secondary", icon: "fas fa-edit", text: "Draft" };
    case "pending":
      return { class: "warning", icon: "fas fa-clock", text: "Pending" };
    case "approved":
    case "active":
      return { class: "success", icon: "fas fa-check-circle", text: "Active" };
    case "rejected":
      return { class: "danger", icon: "fas fa-times-circle", text: "Rejected" };
    case "sent":
      return { class: "info", icon: "fas fa-paper-plane", text: "Sent" };
    case "paid":
      return { class: "success", icon: "fas fa-dollar-sign", text: "Paid" };
    default:
      return { class: "secondary", icon: "fas fa-question-circle", text: status };
  }
};

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    console.log('🚀 InvoiceList component mounted');
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    console.log('🔄 Starting fetchInvoices...');
    setLoading(true);
    setError(null);

    try {
      // Get user info from localStorage (exactly like Reports module)
      const userInfoStr = localStorage.getItem("user");
      console.log('📦 Raw user string from localStorage:', userInfoStr);
      
      if (!userInfoStr) {
        throw new Error("No user information found. Please log in again.");
      }

      const userInfo = JSON.parse(userInfoStr);
      console.log('👤 Parsed user info:', userInfo);
      console.log('🔑 TenantId:', userInfo.tenantId);

      if (!userInfo.tenantId) {
        throw new Error("No tenant information available. Please log in again.");
      }

      // Set date range (last 6 months)
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      const endDate = now;

      console.log('📅 Date range:', {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      });

      // Prepare API call (exactly like Reports module)
      const apiUrl = `${API_BASE}/api/reports/invoices`;
      const queryParams = `tenantId=${userInfo.tenantId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      const fullUrl = `${apiUrl}?${queryParams}`;

      console.log('🌐 Full API URL:', fullUrl);

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      };

      console.log('🔐 Request headers:', { ...headers, Authorization: 'Bearer [HIDDEN]' });

      // Make API call using fetch (like Reports module)
      console.log('📡 Making fetch request...');
      const response = await fetch(fullUrl, { headers });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Response data:', data);

      if (data.success && data.data) {
        console.log('✅ Success! Invoice count:', data.data.length);
        
        // Format invoices for display
        const formattedInvoices = data.data.map((inv, index) => {
          console.log(`🔄 Formatting invoice ${index + 1}:`, inv.invoiceNumber);
          
          // Calculate week from invoice date
          const invoiceDate = new Date(inv.issueDate || inv.createdAt);
          const weekStart = new Date(invoiceDate);
          weekStart.setDate(invoiceDate.getDate() - invoiceDate.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          const week = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}`;
          
          return {
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            vendor: inv.clientName || 'N/A',
            week: week,
            issueDate: inv.issueDate || inv.createdAt,
            total: parseFloat(inv.amount) || 0,
            status: inv.status || 'Draft',
            hours: inv.totalHours || 0,
          };
        });

        console.log('✅ Formatted invoices:', formattedInvoices);
        setInvoices(formattedInvoices);
      } else {
        console.warn('⚠️ API returned success:false or no data');
        setInvoices([]);
      }
    } catch (err) {
      console.error('❌ Error fetching invoices:', err);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error stack:', err.stack);
      setError(err.message);
      setInvoices([]);
    } finally {
      setLoading(false);
      console.log('✅ fetchInvoices completed');
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesStatus =
      filterStatus === "all" ||
      invoice.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.vendor.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  console.log('📊 Filtered invoices count:', filteredInvoices.length);

  return (
    <div className="nk-content">
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            {/* Header */}
            <div className="nk-block-head nk-block-head-sm">
              <div className="nk-block-between">
                <div className="nk-block-head-content">
                  <h3 className="nk-block-title page-title">
                    Invoice Management
                  </h3>
                  <div className="nk-block-des text-soft">
                    <p>Manage and track all vendor invoices</p>
                  </div>
                </div>

                <div className="nk-block-head-content">
                  <div className="toggle-wrap nk-block-tools-toggle">
                    <ul className="nk-block-tools g-3">
                      <li>
                        <button className="btn btn-primary">
                          <em className="icon ni ni-plus"></em>
                          <span>Create Invoice</span>
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="nk-block">
              <div className="card card-bordered card-stretch">
                <div className="card-inner-group">
                  {/* Filters */}
                  <div className="card-inner position-relative">
                    <div className="card-title-group">
                      <div className="card-tools">
                        <ul className="nav nav-tabs">
                          <li className="nav-item">
                            <button className="nav-link active">
                              Invoices
                            </button>
                          </li>
                        </ul>
                      </div>

                      <div className="card-tools mr-n1">
                        <ul className="btn-toolbar gx-1">
                          <li>
                            <div className="form-group">
                              <div className="form-control-wrap">
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  placeholder="Search..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                />
                              </div>
                            </div>
                          </li>
                          <li>
                            <div className="form-group">
                              <select
                                className="form-select form-select-sm"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                              >
                                <option value="all">All Status</option>
                                <option value="draft">Draft</option>
                                <option value="pending">Pending</option>
                                <option value="active">Active</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="sent">Sent</option>
                                <option value="paid">Paid</option>
                              </select>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="card-inner p-0">
                    {loading ? (
                      <div className="text-center p-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="sr-only">Loading...</span>
                        </div>
                        <p className="mt-2">Loading invoices...</p>
                      </div>
                    ) : error ? (
                      <div className="alert alert-danger m-3">
                        <strong>Error:</strong> {error}
                      </div>
                    ) : (
                      <div className="nk-tb-list nk-tb-ulist">
                        {/* Table Header */}
                        <div className="nk-tb-item nk-tb-head">
                          <div className="nk-tb-col">
                            <span className="sub-text">Invoice #</span>
                          </div>
                          <div className="nk-tb-col">
                            <span className="sub-text">Vendor</span>
                          </div>
                          <div className="nk-tb-col">
                            <span className="sub-text">Week</span>
                          </div>
                          <div className="nk-tb-col">
                            <span className="sub-text">Issue Date</span>
                          </div>
                          <div className="nk-tb-col">
                            <span className="sub-text">Total</span>
                          </div>
                          <div className="nk-tb-col">
                            <span className="sub-text">Status</span>
                          </div>
                          <div className="nk-tb-col nk-tb-col-tools text-right">
                            <span className="sub-text">Actions</span>
                          </div>
                        </div>

                        {/* Table Body */}
                        {filteredInvoices.length > 0 ? (
                          filteredInvoices.map((invoice) => {
                            const statusInfo = getStatusDisplay(invoice.status);
                            return (
                              <div key={invoice.id} className="nk-tb-item">
                                <div className="nk-tb-col">
                                  <span className="tb-lead">
                                    {invoice.invoiceNumber}
                                  </span>
                                </div>
                                <div className="nk-tb-col">
                                  <span className="tb-sub">{invoice.vendor}</span>
                                </div>
                                <div className="nk-tb-col">
                                  <span className="tb-sub">{invoice.week}</span>
                                </div>
                                <div className="nk-tb-col">
                                  <span className="tb-sub">
                                    {new Date(invoice.issueDate).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: '2-digit',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                                <div className="nk-tb-col">
                                  <span className="tb-lead">
                                    ${invoice.total.toFixed(2)}
                                  </span>
                                </div>
                                <div className="nk-tb-col">
                                  <span
                                    className={`badge badge-${statusInfo.class} d-inline-flex align-items-center`}
                                  >
                                    <i
                                      className={`${statusInfo.icon} me-1`}
                                      style={{ fontSize: "12px" }}
                                    ></i>
                                    {statusInfo.text}
                                  </span>
                                </div>
                                <div className="nk-tb-col nk-tb-col-tools">
                                  <ul className="nk-tb-actions gx-1">
                                    <li>
                                      <button
                                        className="btn btn-sm btn-icon btn-trigger"
                                        onClick={() => console.log('View invoice:', invoice.id)}
                                      >
                                        <em className="icon ni ni-eye"></em>
                                      </button>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="nk-tb-item">
                            <div className="text-center p-4">
                              <p className="text-muted">
                                No invoices found matching your criteria.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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

export default InvoiceList;
