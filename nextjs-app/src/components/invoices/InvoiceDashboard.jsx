'use client';

// src/components/invoices/InvoiceDashboard.jsx
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { API_BASE } from '@/config/api';
import { isServerConnectedCached } from '@/utils/serverCheck';
import "../common/ActionsDropdown.css";

const InvoiceDashboard = () => {
  const { subdomain } = useParams();

  // Hydration fix: Track if component is mounted on client
  const [isMounted, setIsMounted] = useState(false);

  // Initialize with empty data - will be populated from server
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isServerAvailable, setIsServerAvailable] = useState(false);

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [openMenuId, setOpenMenuId] = useState(null);

  // Hydration fix: Set mounted state on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check server connection and fetch data accordingly
  useEffect(() => {
    async function checkAndFetch() {
      if (!isMounted) return;
      
      const serverConnected = await isServerConnectedCached();
      setIsServerAvailable(serverConnected);
      
      if (serverConnected) {
        // Server is connected - fetch real data
        console.log('✅ Server connected - fetching invoice data');
        fetchInvoices();
      } else {
        // Server not connected - show empty state
        console.log('⚠️ Server not connected - no invoice data available');
        setLoading(false);
      }
    }
    
    checkAndFetch();
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

      const url = `${API_BASE}/api/invoices?tenantId=${userInfo.tenantId}`;
      console.log("Fetching invoices from:", url);

      const response = await fetch(url, { headers });
      console.log("Response status:", response.status);

      const data = await response.json();
      console.log("Invoice data received:", data);
      
      if (data.success) {
        console.log("Setting invoices:", data.invoices);
        setInvoices(data.invoices || []);
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
              <div className="py-10 text-center">
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
    <div className="invoice-dashboard min-h-screen bg-slate-50">
      <div className="container-fluid">
        {/* <div className="nk-content-inner">
          <div className="nk-content-body px-1"> */}
            <div className="mx-auto max-w-8xl px-5 py-5">
              <div className="mb-6 mt-1 overflow-hidden rounded-3xl bg-[#7cbdf2] shadow-sm">
                <div className="px-5 py-5 sm:px-7 sm:py-6">
                  <div className="nk-block-head nk-block-head-sm !m-0 !p-0">
                    <div className="nk-block-between flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                       <div className="relative pl-4">
                        <span className="absolute left-0 top-2 h-10 w-1 rounded-full bg-purple-900 dark:bg-indigo-400" />
                        <h3 className="nk-block-title page-title text-2xl font-bold tracking-tight text-white sm:text-[2rem]">
                          Invoice Management
                        </h3>
                        <div className="nk-block-des text-soft">
                          <p className="!mt-2 text-sm font-medium text-white/90 sm:text-base">
                            Manage and track all vendor invoices
                          </p>
                        </div>
                      </div>
                      
                        <div className="flex flex-wrap items-center gap-3">
                          <Link
                            href={`/${subdomain}/invoices/new`}
                            className="flex items-center gap-2.5
                rounded-full
                bg-slate-900 px-6 py-3
                text-sm font-semibold !text-white
                shadow-md
                transition-all
                cursor-pointer
                hover:bg-slate-800 hover:scale-[1.04]
                active:scale-[0.97]
                dark:bg-indigo-600 dark:hover:bg-indigo-500
                dark:shadow-[0_6px_18px_rgba(79,70,229,0.45)] "
                          >
                            <i className="fas fa-plus-circle text-base" />
                            Create Invoice
                          </Link>
                        </div>
                      
                    </div>
                  </div>
                </div>
                <div className="h-px bg-white/25" />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
  {/* HEADER */}
  <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
    <h3 className="text-lg font-semibold text-slate-900">
      All Invoices
    </h3>

    <div className="flex flex-wrap gap-2">
      <select
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
      >
        <option value="all">All Status</option>
        <option value="draft">Draft</option>
        <option value="generated">Generated</option>
        <option value="sent">Sent</option>
        <option value="paid">Paid</option>
      </select>

      <select
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        value={filterMonth}
        onChange={(e) => setFilterMonth(e.target.value)}
      >
        <option value="all">All Months</option>
        <option value="july">July</option>
        <option value="june">June</option>
        <option value="may">May</option>
      </select>
    </div>
  </div>

  {/* TABLE */}
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-sm">
      <thead className="bg-slate-100 text-slate-600">
        <tr>
          <th className="px-4 py-3 text-left font-semibold">Invoice ID</th>
          <th className="px-4 py-3 text-left font-semibold">Vendor</th>
          <th className="px-4 py-3 text-left font-semibold">Week</th>
          <th className="px-4 py-3 text-center font-semibold">Hours</th>
          <th className="px-4 py-3 text-right font-semibold">Amount</th>
          <th className="px-4 py-3 text-center font-semibold">Status</th>
          <th className="px-4 py-3 text-right font-semibold">Actions</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-200">
        {loading ? (
          <tr>
            <td colSpan="7" className="px-4 py-10 text-center text-slate-500">
              Loading invoices...
            </td>
          </tr>
        ) : error ? (
          <tr>
            <td colSpan="7" className="px-4 py-10 text-center text-red-600">
              {error}
            </td>
          </tr>
        ) : filteredInvoices.length === 0 ? (
          <tr>
            <td colSpan="7" className="px-4 py-10 text-center text-slate-500">
              No invoices found.
            </td>
          </tr>
        ) : (
          filteredInvoices.map((invoice) => (
            <tr
              key={invoice.id}
              className="hover:bg-slate-50 transition"
            >
              <td className="px-4 py-3 font-medium text-slate-900">
                {invoice.invoiceNumber || invoice.id}
              </td>

              <td className="px-4 py-3 text-slate-700">
                {invoice.vendor || 'N/A'}
              </td>

              <td className="px-4 py-3 text-slate-700">
                {invoice.week || 'N/A'}
              </td>

              <td className="px-4 py-3 text-center text-slate-700">
                {invoice.totalHours || invoice.timesheet?.totalHours || 0}
              </td>

              <td className="px-4 py-3 text-right font-semibold text-slate-900">
                ${(invoice.amount || invoice.total || 0).toFixed(2)}
              </td>

              <td className="px-4 py-3 text-center">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold
                    ${
                      invoice.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : invoice.status === 'generated'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                    }
                  `}
                >
                  {invoice.status}
                </span>
              </td>

              <td className="px-4 py-3 text-right">
                <div className="relative inline-block">
                  <button
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100"
                    onClick={() => toggleMenu(invoice.id)}
                  >
                    Actions
                  </button>

                  {openMenuId === invoice.id && (
                    <div className="absolute right-0 z-10 mt-2 w-44 rounded-lg border border-slate-200 bg-white shadow-lg">
                      <Link
                        href={`/${subdomain}/invoices/view/${invoice.id}`}
                        className="block px-4 py-2 text-sm hover:bg-slate-100"
                        onClick={() => setOpenMenuId(null)}
                      >
                        View Invoice
                      </Link>
                      <button className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-100">
                        Download
                      </button>
                      <button className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-100">
                        Send Invoice
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
</div>


              <div className="mt-6">
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    
    {/* Total Invoiced */}
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Total Invoiced
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            $295,000.00
          </p>
          <p className="mt-1 text-xs text-slate-400">
            This Month
          </p>
        </div>
      </div>
    </div>

    {/* Payments Received */}
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Payments Received
          </p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            $135,000.00
          </p>
          <p className="mt-1 text-xs text-slate-400">
            This Month
          </p>
        </div>
      </div>
    </div>

    {/* Outstanding Amount */}
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Outstanding Amount
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            $160,000.00
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Total
          </p>
        </div>
      </div>
    </div>

  </div>
</div>

            </div>
          </div>
        {/* </div>
      </div> */}
    </div>
  );
};

export default InvoiceDashboard;
