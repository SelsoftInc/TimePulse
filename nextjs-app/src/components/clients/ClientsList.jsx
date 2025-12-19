'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { PERMISSIONS } from '@/utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { API_BASE } from '@/config/api';
import { decryptApiResponse } from '@/utils/encryption';
import "./Clients.css";
import "../common/Pagination.css";
import "../common/TableScroll.css";
import "../common/ActionsDropdown.css";
import "../common/DropdownFix.css";
import "./ClientsDropdownFix.css";

const ClientsList = () => {
  const { subdomain } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Hydration fix: Track if component is mounted on client
  const [isMounted, setIsMounted] = useState(false);

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  // Hydration fix: Set mounted state on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close dropdown on outside click - EXACT VENDORS IMPLEMENTATION
  useEffect(() => {
    const handler = (e) => {
      // Close dropdown when clicking outside
      if (openMenuId !== null) {
        const dropdownEl = document.querySelector(
          `[data-dropdown-id="${openMenuId}"]`
        );
        const isClickInside = dropdownEl?.contains(e.target);
        if (!isClickInside) {
          setOpenMenuId(null);
        }
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenuId]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch clients from backend API
  const fetchClients = async () => {
    try {
      setLoading(true);
      setError("");

      if (!user?.tenantId) {
        setError("No tenant information available");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/clients?tenantId=${user.tenantId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`}}
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawData = await response.json();
      console.log('📦 Raw clients response:', rawData);
      
      // Decrypt the response if encrypted
      const data = decryptApiResponse(rawData);
      console.log('🔓 Decrypted clients data:', data);

      if (data.success) {
        setClients(data.clients || []);
      } else {
        setError(data.error || "Failed to fetch clients");
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      setError("Failed to load clients. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted) {
      fetchClients();
    }
  }, [isMounted, user?.tenantId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMenu = (id) => setOpenMenuId((prev) => (prev === id ? null : id));

  // Pagination calculations
  const totalPages = Math.ceil(clients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = clients.slice(startIndex, endIndex);


  const handleDelete = async (clientId) => {
    if (!window.confirm("Delete this client? This action can be done."))
      return;
    try {
      const resp = await fetch(
        `${API_BASE}/api/clients/${clientId}?tenantId=${user.tenantId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`}}
      );
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(
          err.error || `Delete failed with status ${resp.status}`
        );
      }
      await fetchClients();
      toast.success("Client has been deleted.", {
        title: "Client Deleted"});
    } catch (e) {
      toast.error(e.message, {
        title: "Failed to Delete"});
    } finally {
      setOpenMenuId(null);
    }
  };

  const handleDuplicate = async (clientId) => {
    try {
      // Fetch full client details first
      const getResp = await fetch(
        `${API_BASE}/api/clients/${clientId}?tenantId=${user.tenantId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`}}
      );
      if (!getResp.ok)
        throw new Error(`Fetch details failed (${getResp.status})`);
      const data = await getResp.json();
      const c = data.client;
      if (!c) throw new Error("Client not found");

      // Build payload similar to create
      const payload = {
        tenantId: user.tenantId,
        clientName: `Copy of ${c.name}`,
        legalName: `Copy of ${c.name}`,
        contactPerson: c.contactPerson || "",
        email: c.email || "",
        phone: c.phone || "",
        billingAddress: c.billingAddress || {
          line1: "",
          city: "",
          state: "",
          zip: "",
          country: c.country || "United States"},
        shippingAddress: c.shippingAddress || {
          line1: "",
          city: "",
          state: "",
          zip: "",
          country: c.country || "United States"},
        taxId: c.taxId || null,
        paymentTerms: Number(c.paymentTerms) || 30,
        hourlyRate: c.hourlyRate || null,
        status: c.status || "active",
        clientType: c.clientType || "external"};

      const postResp = await fetch(`${API_BASE}/api/clients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`},
        body: JSON.stringify(payload)});
      if (!postResp.ok) {
        const err = await postResp.json().catch(() => ({}));
        throw new Error(
          err.error || `Duplicate failed with status ${postResp.status}`
        );
      }
      await fetchClients();
      toast.success("Client has been duplicated.", {
        title: "Client Duplicated"});
    } catch (e) {
      toast.error(e.message, {
        title: "Failed to Duplicate"});
    } finally {
      setOpenMenuId(null);
    }
  };

  const handleEdit = (clientId) => {
    setOpenMenuId(null);
    router.push(`/${subdomain}/clients/edit/${clientId}`);
  };

  // Prevent hydration mismatch - don't render until mounted
  if (!isMounted) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
     <div className="nk-content min-h-screen bg-slate-50">
  <div className="max-w-8xl mx-auto space-y-4">

    {/* ================= PAGE HEADER ================= */}
    <div
      className="
        sticky top-4 z-30 mb-9
        rounded-3xl
        bg-[#7cbdf2]
        dark:bg-gradient-to-br dark:from-[#0f1a25] dark:via-[#121f33] dark:to-[#162a45]
        shadow-sm dark:shadow-[0_8px_24px_rgba(0,0,0,0.6)]
        backdrop-blur-md
        border border-transparent dark:border-white/5
      "
    >
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-center">

          {/* LEFT */}
          <div className="relative pl-5">
            <span className="absolute left-0 top-2 h-10 w-1 rounded-full bg-purple-900 dark:bg-indigo-400" />

            <h1
              className="
                text-[2rem]
                font-bold
                text-white
                leading-[1.15]
                tracking-tight
                drop-shadow-[0_2px_8px_rgba(0,0,0,0.18)]
              "
            >
              Clients
            </h1>

            <p className="mt-0 text-sm text-white/80 dark:text-slate-300">
              Manage end clients and their information
            </p>
          </div>

          {/* RIGHT */}
          <div className="flex flex-wrap items-center gap-3">
           <PermissionGuard requiredPermission={PERMISSIONS.CREATE_CLIENT}>
        <Link
          href={`/${subdomain}/clients/new`}
          className="
            flex items-center gap-2.5
                rounded-full
                bg-slate-900 px-6 py-3
                text-sm font-semibold !text-white
                shadow-md
                transition-all
                cursor-pointer
                hover:bg-slate-800 hover:scale-[1.04]
                active:scale-[0.97]
                dark:bg-indigo-600 dark:hover:bg-indigo-500
                dark:shadow-[0_6px_18px_rgba(79,70,229,0.45)]
          "
        >
          <i className="fas fa-plus-circle text-base text-white" />
          Add End Client
        </Link>
      </PermissionGuard>
          </div>

        </div>
      </div>
    </div>

    {/* ================= CONTENT ================= */}
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

      {/* ERROR */}
      {error ? (
        <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center justify-between">
            <div>
              <i className="fas fa-exclamation-triangle mr-2" />
              {error}
            </div>
            <button
              onClick={fetchClients}
              className="text-sm font-medium text-red-700 hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-16">
          <div className="spinner-border text-indigo-600" role="status" />
        </div>
      ) : (
        <>
          {/* ================= TABLE ================= */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th className="px-4 py-3">End Client Name</th>
                  <th className="px-4 py-3">Contact Person</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Employees</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {paginatedClients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-indigo-600">
                      <Link href={`/${subdomain}/clients/${client.id}`}>
                        {client.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {client.contactPerson}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {client.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {client.phone}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          client.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {client.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {client.employeeCount}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMenu(client.id);
                          }}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          Actions
                        </button>

                        {openMenuId === client.id && (
                          <div className="absolute right-0 z-20 mt-2 w-44 rounded-lg border border-slate-200 bg-white shadow-lg">
                            <Link
                              href={`/${subdomain}/clients/${client.id}`}
                              className="block px-4 py-2 text-sm hover:bg-slate-50"
                              onClick={() => setOpenMenuId(null)}
                            >
                              View Details
                            </Link>

                            <PermissionGuard requiredPermission={PERMISSIONS.EDIT_CLIENT}>
                              <button
                                onClick={() => handleEdit(client.id)}
                                className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                              >
                                Edit
                              </button>
                            </PermissionGuard>

                            <PermissionGuard requiredPermission={PERMISSIONS.CREATE_CLIENT}>
                              <button
                                onClick={() => handleDuplicate(client.id)}
                                className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                              >
                                Duplicate
                              </button>
                            </PermissionGuard>

                            <PermissionGuard requiredPermission={PERMISSIONS.DELETE_CLIENT}>
                              <button
                                onClick={() => handleDelete(client.id)}
                                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </PermissionGuard>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ================= PAGINATION ================= */}
          {clients.length > itemsPerPage && (
            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                Showing {startIndex + 1}–{Math.min(endIndex, clients.length)} of{" "}
                {clients.length} clients
              </p>

              <div className="flex gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
                >
                  Previous
                </button>

                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`rounded-md border px-3 py-1 text-sm ${
                      currentPage === i + 1
                        ? "bg-indigo-600 text-white"
                        : "hover:bg-slate-100"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  </div>
</div>

  );
};

export default ClientsList;
