'use client';

import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { API_BASE } from '@/config/api';
import { isServerConnectedCached } from '@/utils/serverCheck';
import { PERMISSIONS } from '@/utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import ConfirmDialog from '../common/ConfirmDialog';
import { decryptApiResponse } from '@/utils/encryption';
import "../common/Pagination.css";
import "../common/TableScroll.css";
import "../common/ActionsDropdown.css";
import "../common/DropdownFix.css";
import "./VendorsDropdownFix.css";
import "./Vendors.css"

const VendorList = () => {
  const router = useRouter();
  const { subdomain } = useParams();
  const { user } = useAuth();
  const pathname = usePathname();
  const isImplPartnerView = new URLSearchParams(location.search).get(
    "implPartner"
  );
  const { toast } = useToast();

  // Hydration fix: Track if component is mounted on client
  const [isMounted, setIsMounted] = useState(false);

  // Initialize with empty data - will be populated from server
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isServerAvailable, setIsServerAvailable] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, openUpward: false });
  const buttonRefs = React.useRef({});

  // Hydration fix: Set mounted state on client
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Check server connection and fetch data accordingly
  useEffect(() => {
    if (!isMounted) return;
    
    async function checkAndFetch() {
      const serverConnected = await isServerConnectedCached();
      setIsServerAvailable(serverConnected);
      
      if (serverConnected) {
        // Server is connected - fetch real data
        console.log('✅ Server connected - fetching vendor data');
        await fetchVendors();
      } else {
        // Server not connected - show empty state
        console.log('⚠️ Server not connected - no vendor data available');
        setLoading(false);
      }
    }
    
    const fetchVendors = async () => {
      try {
        setLoading(true);
        setError("");
        if (!user?.tenantId) {
          setError("No tenant information available");
          setVendors([]);
          return;
        }
        const resp = await fetch(
          `${API_BASE}/api/vendors?tenantId=${user.tenantId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`}}
        );
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const rawData = await resp.json();
        console.log('📦 Raw vendors response:', rawData);
        
        // Decrypt the response if encrypted
        const data = decryptApiResponse(rawData);
        console.log('🔓 Decrypted vendors data:', data);
        
        if (data.success) {
          setVendors(data.vendors || []);
        } else {
          setError(data.error || "Failed to fetch vendors");
        }
      } catch (e) {
        console.error("Error fetching vendors:", e);
        setError("Failed to load vendors. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    checkAndFetch();
  }, [isMounted, user?.tenantId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      // Close dropdown when clicking outside
      if (openMenuId !== null) {
        const dropdownButton = document.querySelector(
          `[data-dropdown-id="${openMenuId}"]`
        );
        const dropdownMenu = document.querySelector('.fixed.z-\\[99999\\]');
        
        const isClickInsideButton = dropdownButton?.contains(e.target);
        const isClickInsideMenu = dropdownMenu?.contains(e.target);
        
        if (!isClickInsideButton && !isClickInsideMenu) {
          setOpenMenuId(null);
        }
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenuId]);

  const toggleMenu = (id, event) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
      return;
    }

    // Calculate dropdown position
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const dropdownHeight = 200; // Approximate dropdown height
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    const position = {
      top: openUpward ? rect.top - dropdownHeight : rect.bottom + 4,
      left: rect.right - 176, // 176px is dropdown width
      openUpward
    };

    setDropdownPosition(position);
    setOpenMenuId(id);
  };

  // Pagination calculations
  const totalPages = Math.ceil(vendors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVendors = vendors.slice(startIndex, endIndex);

  const handleEdit = (vendorId) => {
    console.log('📝 handleEdit called for vendor:', vendorId);
    console.log('📍 Navigating to:', `/${subdomain}/vendors/edit/${vendorId}`);
    setOpenMenuId(null);
    router.push(`/${subdomain}/vendors/edit/${vendorId}`);
  };

  const handleDelete = async (vendorId) => {
    try {
      const resp = await fetch(
        `${API_BASE}/api/vendors/${vendorId}?tenantId=${user.tenantId}`,
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
      // Refresh list
      const refreshed = await fetch(
        `${API_BASE}/api/vendors?tenantId=${user.tenantId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }}
      );
      const refreshedRaw = await refreshed.json().catch(() => ({ vendors: [] }));
      const refreshedData = decryptApiResponse(refreshedRaw);
      setVendors(refreshedData.vendors || []);
      toast.success("Vendor deleted");
    } catch (e) {
      toast.error(`Failed to delete: ${e.message}`);
    } finally {
      setOpenMenuId(null);
      setConfirmOpen(false);
      setPendingDeleteId(null);
    }
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
    <div className="vendor-dashboard">
      <div className="container-fluid">
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
          {isImplPartnerView ? "Impl Partners" : "Vendors"}
        </h1>

        <p className="mt-0 text-sm text-white/80 dark:text-slate-300">
          Manage your{" "}
          {isImplPartnerView ? "implementation partner" : "vendor"} relationships
        </p>
      </div>

      {/* RIGHT */}
      <div className="flex flex-wrap items-center gap-3">
        <PermissionGuard requiredPermission={PERMISSIONS.CREATE_VENDOR}>
          <Link
            href={`/${subdomain}/vendors/new`}
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
            {isImplPartnerView ? "Add Impl Partner" : "Add Vendor"}
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
              </div>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-16">
              <div className="spinner-border text-indigo-600" role="status" />
            </div>
          ) : vendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="mb-4 text-slate-600">No vendors found.</p>
              <PermissionGuard requiredPermission={PERMISSIONS.CREATE_VENDOR}>
                <Link
                  href={`/${subdomain}/vendors/new`}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  <i className="fas fa-plus"></i> Add Your First Vendor
                </Link>
              </PermissionGuard>
            </div>
          ) : (
            <>
              {/* ================= TABLE ================= */}
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      <th className="px-4 py-3">Vendor Name</th>
                      <th className="px-4 py-3">Contact Person</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {paginatedVendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-indigo-600">
                          <Link href={`/${subdomain}/vendors/${vendor.id}`}>
                            {vendor.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {vendor.contactPerson}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {vendor.category}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {vendor.email}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {vendor.phone}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              vendor.status === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : vendor.status === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {vendor.status === "active"
                              ? "Active"
                              : vendor.status === "pending"
                              ? "Pending"
                              : "Inactive"}
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td className="px-4 py-3 text-right">
                          <div className="relative inline-block" data-dropdown-id={vendor.id}>
                            <button
                              ref={(el) => {
                                if (el) buttonRefs.current[vendor.id] = el;
                              }}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('🔘 Actions button clicked for vendor:', vendor.id);
                                toggleMenu(vendor.id, e);
                              }}
                              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                            >
                              Actions
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ================= PAGINATION ================= */}
              {vendors.length > itemsPerPage && (
                <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-600">
                    Showing {startIndex + 1}–{Math.min(endIndex, vendors.length)} of{" "}
                    {vendors.length} vendors
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>

                    {[...Array(totalPages)].map((_, index) => (
                      <button
                        key={index + 1}
                        onClick={() => setCurrentPage(index + 1)}
                        className={`rounded-md px-3 py-1.5 text-sm ${
                          currentPage === index + 1
                            ? "bg-indigo-600 text-white"
                            : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <ConfirmDialog
          open={confirmOpen}
          title="Delete Vendor"
          message="Are you sure you want to delete this vendor? This action can be done."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={() => pendingDeleteId && handleDelete(pendingDeleteId)}
          onCancel={() => {
            setConfirmOpen(false);
            setPendingDeleteId(null);
          }}
        />
      </div>

      {/* Fixed Position Dropdown Menu */}
      {openMenuId && (() => {
        const vendor = paginatedVendors.find(v => v.id === openMenuId);
        if (!vendor) return null;

        return (
          <div
            className="fixed z-[99999] w-44 rounded-lg border border-slate-200 bg-white shadow-lg"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              pointerEvents: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('👁️ View Details clicked for vendor:', vendor.id);
                setOpenMenuId(null);
                router.push(`/${subdomain}/vendors/${vendor.id}`);
              }}
              className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50 cursor-pointer"
            >
              <i className="fas fa-eye mr-2"></i>
              View Details
            </button>

            <PermissionGuard requiredPermission={PERMISSIONS.EDIT_VENDOR}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('✏️ Edit clicked for vendor:', vendor.id);
                  handleEdit(vendor.id);
                }}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50 cursor-pointer"
              >
                <i className="fas fa-edit mr-2"></i>
                Edit
              </button>
            </PermissionGuard>

            <PermissionGuard requiredPermission={PERMISSIONS.DELETE_VENDOR}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🗑️ Delete clicked for vendor:', vendor.id);
                  setOpenMenuId(null);
                  setPendingDeleteId(vendor.id);
                  setConfirmOpen(true);
                }}
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <i className="fas fa-trash mr-2"></i>
                Delete
              </button>
            </PermissionGuard>
          </div>
        );
      })()}
    </div>
  );
};

export default VendorList;
