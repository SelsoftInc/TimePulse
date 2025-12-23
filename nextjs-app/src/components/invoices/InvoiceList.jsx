'use client';

import React, { useState, useEffect } from 'react';
import { API_BASE } from '@/config/api';
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
        Authorization: `Bearer ${localStorage.getItem("token")}`};

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
          console.log(`🔄 Formatting invoice ${index + 1}:`, {
            invoiceNumber: inv.invoiceNumber,
            vendorName: inv.vendorName,
            clientName: inv.clientName,
            rawInvoice: inv
          });
          
          // Calculate week from invoice date
          const invoiceDate = new Date(inv.issueDate || inv.createdAt);
          const weekStart = new Date(invoiceDate);
          weekStart.setDate(invoiceDate.getDate() - invoiceDate.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          const week = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}`;
          
          // Use vendorName if available, otherwise fallback to clientName
          const vendorDisplay = inv.vendorName || inv.clientName || 'N/A';
          
          console.log(`✅ Vendor display for ${inv.invoiceNumber}: "${vendorDisplay}"`);
          
          return {
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            vendor: vendorDisplay,
            week: week,
            issueDate: inv.issueDate || inv.createdAt,
            total: parseFloat(inv.amount) || 0,
            status: inv.status || 'Draft',
            hours: inv.totalHours || 0};
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
    <div className="invoicelist-dashboard">
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
  <div className="mx-auto max-w-7xl space-y-6">

    {/* ================= HEADER ================= */}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Invoice Management
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage and track all vendor invoices
        </p>
      </div>

      <button
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 transition"
      >
        <span className="text-lg leading-none">+</span>
        Create Invoice
      </button>
    </div>

    {/* ================= FILTERS ================= */}
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">
            Invoices
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:w-56"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
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
      </div>
    </div>

    {/* ================= TABLE ================= */}
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {loading ? (
        <div className="py-16 text-center text-slate-600">
          Loading invoices…
        </div>
      ) : error ? (
        <div className="py-16 text-center text-red-600">
          {error}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-100 text-xs font-semibold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Invoice #</th>
                <th className="px-4 py-3 text-left">Vendor</th>
                <th className="px-4 py-3 text-left">Week</th>
                <th className="px-4 py-3 text-left">Issue Date</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-sm text-slate-500"
                  >
                    No invoices found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => {
                  const statusInfo = getStatusDisplay(invoice.status);

                  return (
                    <tr
                      key={invoice.id}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {invoice.invoiceNumber}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {invoice.vendor}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {invoice.week}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {new Date(invoice.issueDate).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "2-digit", year: "numeric" }
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        ${invoice.total.toFixed(2)}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            invoice.status === "paid"
                              ? "bg-green-100 text-green-700"
                              : invoice.status === "pending" ||
                                invoice.status === "sent"
                              ? "bg-amber-100 text-amber-700"
                              : invoice.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {statusInfo.text}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => console.log("View invoice:", invoice.id)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
</div>
  </div>
</div>

  );
};

export default InvoiceList;
