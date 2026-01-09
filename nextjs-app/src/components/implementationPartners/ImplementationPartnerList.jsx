'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { API_BASE } from '@/config/api';
import { PERMISSIONS } from '@/utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import ConfirmDialog from '../common/ConfirmDialog';
import "../common/Pagination.css";
import "../common/TableScroll.css";

 const MOCK_IMPLEMENTATION_PARTNERS = [
   {
     id: "mock-ip-001",
     name: "Acme Implementation Co.",
     contactPerson: "Riya Sharma",
     email: "riya.sharma@acme-impl.example",
     phone: "+1 415 555 0123",
     status: "active",
     specialization: "Payroll Integrations",
   },
   {
     id: "mock-ip-002",
     name: "Northwind Delivery Partners",
     contactPerson: "Arjun Mehta",
     email: "arjun.mehta@northwind-impl.example",
     phone: "+91 98765 43210",
     status: "inactive",
     specialization: "HRIS Implementation",
   },
 ];

const ImplementationPartnerList = () => {
  const { subdomain } = useParams();
  const { user, currentEmployer, checkPermission } = useAuth();
  const pathname = usePathname();
  const { toast } = useToast();
  const [implementationPartners, setImplementationPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Hydration fix: Track if component is mounted on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchImplementationPartners = async () => {
    try {
      setLoading(true);
      setError("");
      if (!user?.tenantId) {
        setError("No tenant information available");
        setImplementationPartners([]);
        return;
      }
      const resp = await fetch(
        `${API_BASE}/api/implementation-partners?tenantId=${user.tenantId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`}}
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const fetchedPartners = data.implementationPartners || [];
      if (Array.isArray(fetchedPartners) && fetchedPartners.length === 0) {
        setImplementationPartners(MOCK_IMPLEMENTATION_PARTNERS);
      } else {
        setImplementationPartners(fetchedPartners);
      }
    } catch (err) {
      console.error("Error fetching implementation partners:", err);
      setError("Failed to load implementation partners");
      toast.error("Failed to load implementation partners");
      setImplementationPartners((prev) =>
        Array.isArray(prev) && prev.length > 0 ? prev : MOCK_IMPLEMENTATION_PARTNERS
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted) {
      fetchImplementationPartners();
    }
  }, [user?.tenantId, isMounted]);

  const handleDelete = async (id) => {
    try {
      const resp = await fetch(
        `${API_BASE}/api/implementation-partners/${id}?tenantId=${user.tenantId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`}}
      );

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || `HTTP ${resp.status}`);
      }

      setImplementationPartners((prev) =>
        prev.filter((partner) => partner.id !== id)
      );
      toast.success("Implementation Partner deleted successfully");
    } catch (err) {
      console.error("Error deleting implementation partner:", err);
      toast.error(err.message || "Failed to delete implementation partner");
    } finally {
      setConfirmOpen(false);
      setPendingDeleteId(null);
    }
  };

  const handleSoftDelete = async (id) => {
    try {
      const resp = await fetch(
        `${API_BASE}/api/implementation-partners/${id}/soft-delete?tenantId=${user.tenantId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`}}
      );

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || `HTTP ${resp.status}`);
      }

      setImplementationPartners((prev) =>
        prev.map((partner) =>
          partner.id === id ? { ...partner, status: "inactive" } : partner
        )
      );
      toast.success("Implementation Partner deactivated successfully");
    } catch (err) {
      console.error("Error deactivating implementation partner:", err);
      toast.error(err.message || "Failed to deactivate implementation partner");
    }
  };

  const handleRestore = async (id) => {
    try {
      const resp = await fetch(
        `${API_BASE}/api/implementation-partners/${id}/restore?tenantId=${user.tenantId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`}}
      );

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || `HTTP ${resp.status}`);
      }

      setImplementationPartners((prev) =>
        prev.map((partner) =>
          partner.id === id ? { ...partner, status: "active" } : partner
        )
      );
      toast.success("Implementation Partner restored successfully");
    } catch (err) {
      console.error("Error restoring implementation partner:", err);
      toast.error(err.message || "Failed to restore implementation partner");
    }
  };

  const confirmDelete = (id) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteId) {
      handleDelete(pendingDeleteId);
    }
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setPendingDeleteId(null);
  };

  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMounted || !openMenuId) return; // Only add listener when mounted and menu is open

    const handleClickOutside = (event) => {
      // Check if click is outside dropdown menu and action button
      const isDropdownClick = event.target.closest('[role="menu"]') || 
                             event.target.closest('.dropdown-menu');
      const isButtonClick = event.target.closest('button[aria-haspopup="true"]') ||
                           event.target.closest('.action-menu-button');
      
      if (!isDropdownClick && !isButtonClick) {
        setOpenMenuId(null);
      }
    };

    // Use setTimeout to ensure the click event that opened the menu completes first
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside, true);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [openMenuId, isMounted]);

  // Pagination calculations
  const totalPages = Math.ceil(implementationPartners.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentImplementationPartners = implementationPartners.slice(
    startIndex,
    endIndex
  );

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "200px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error && implementationPartners.length === 0) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="nk-content min-h-screen bg-slate-50">
      <div className="container-fluid px-4 py-6">
        {/* ================= IMPLEMENTATION PARTNERS HEADER ================= */}
<div
  className="
    top-4 z-30 mb-9
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
          Implementation Partners
        </h1>

        <p className="mt-0 text-sm text-white/80 dark:text-slate-300">
          Manage your implementation partner relationships
        </p>
      </div>

      {/* RIGHT */}
      <div className="flex flex-wrap items-center gap-3">
        <PermissionGuard
          requiredPermission={PERMISSIONS.CREATE_IMPLEMENTATION_PARTNER}
        >
          <Link
            href={`/${subdomain}/implementation-partners/new`}
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
            Add Partner
          </Link>
        </PermissionGuard>
      </div>

    </div>
  </div>
</div>


        <div className="nk-block">
          {error && (
            <div
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <i className="fas fa-exclamation-triangle mt-0.5"></i>
                  <div>
                    <div className="font-medium">{error}</div>
                    <div className="text-red-700/80">
                      Showing temporary sample data to verify UI.
                    </div>
                  </div>
                </div>
                <button className="btn btn-sm btn-outline-danger" onClick={fetchImplementationPartners}>
                  Retry
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="d-flex justify-content-center mt-5">
              <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          ) : implementationPartners.length === 0 ? (
            <div className="text-center py-5 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <i className="fas fa-handshake fa-3x text-muted mb-3"></i>
              <h4 className="text-muted">No Implementation Partners Found</h4>
              <p className="text-muted">
                Get started by adding your first implementation partner.
              </p>
              <PermissionGuard
                requiredPermission={PERMISSIONS.CREATE_IMPLEMENTATION_PARTNER}
              >
                <Link href={`/${subdomain}/implementation-partners/new`}
                  className="btn btn-primary"
                >
                  <i className="fas fa-plus me-2"></i>
                  Add Implementation Partner
                </Link>
              </PermissionGuard>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="overflow-x-auto" style={{ overflow: 'visible' }}>
                <table className="w-full relative" style={{ overflow: 'visible' }}>
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Implementation Partner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Contact Person
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Specialization
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ overflow: 'visible' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200" style={{ overflow: 'visible' }}>
                    {currentImplementationPartners.map((partner) => (
                      <tr key={partner.id} className="hover:bg-gray-50 transition-colors relative" style={{ overflow: 'visible' }}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link 
                            href={`/${subdomain}/implementation-partners/${partner.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {partner.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {partner.contactPerson || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {partner.email || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {partner.phone || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              partner.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {partner.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {partner.specialization || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" style={{ overflow: 'visible', position: 'relative' }}>
                          <div className="relative inline-block" style={{ zIndex: openMenuId === partner.id ? 9999 : 10 }}>
                            <button
                              type="button"
                              className="action-menu-button inline-flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Button clicked, partner ID:', partner.id);
                                toggleMenu(partner.id);
                              }}
                              aria-haspopup="true"
                              aria-expanded={openMenuId === partner.id}
                            >
                              <i className="fas fa-ellipsis-h"></i>
                            </button>
                            {openMenuId === partner.id && (
                              <div
                                role="menu"
                                className="dropdown-menu absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                                style={{ top: "100%", zIndex: 99999, pointerEvents: 'auto' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Link 
                                  href={`/${subdomain}/implementation-partners/${partner.id}`}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                                  onClick={(e) => {
                                    console.log('👁️ View clicked for partner:', partner.id);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <i className="fas fa-eye w-4 mr-3 text-gray-500"></i>
                                  View
                                </Link>
                                <Link
                                  href={`/${subdomain}/implementation-partners/${partner.id}/edit`}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                                  onClick={(e) => {
                                    console.log('✏️ Edit clicked for partner:', partner.id);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <i className="fas fa-edit w-4 mr-3 text-gray-500"></i>
                                  Edit
                                </Link>
                                <PermissionGuard
                                  requiredPermission={PERMISSIONS.DELETE_IMPLEMENTATION_PARTNER}
                                >
                                  {partner.status === "active" ? (
                                    <button
                                      type="button"
                                      className="flex items-center w-full px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 transition-colors cursor-pointer"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('⏸️ Deactivate clicked for partner:', partner.id);
                                        handleSoftDelete(partner.id);
                                        setOpenMenuId(null);
                                      }}
                                    >
                                      <i className="fas fa-pause w-4 mr-3 text-yellow-600"></i>
                                      Deactivate
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors cursor-pointer"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('▶️ Activate clicked for partner:', partner.id);
                                        handleRestore(partner.id);
                                        setOpenMenuId(null);
                                      }}
                                    >
                                      <i className="fas fa-play w-4 mr-3 text-green-600"></i>
                                      Activate
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log('🗑️ Delete clicked for partner:', partner.id);
                                      confirmDelete(partner.id);
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    <i className="fas fa-trash w-4 mr-3 text-red-600"></i>
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
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Implementation Partners pagination">
              <ul className="pagination justify-content-center">
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <li
                      key={page}
                      className={`page-item ${
                        currentPage === page ? "active" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </button>
                    </li>
                  )
                )}
                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>

        {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title="Delete Implementation Partner"
          message="Are you sure you want to delete this implementation partner? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      </div>
    </div>
  );
};

export default ImplementationPartnerList;
