import React, { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { API_BASE } from "../../config/api";
import { PERMISSIONS } from "../../utils/roles";
import PermissionGuard from "../common/PermissionGuard";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import ConfirmDialog from "../common/ConfirmDialog";
import "../common/Pagination.css";

const ImplementationPartnerList = () => {
  const { subdomain } = useParams();
  const { user, currentEmployer, checkPermission } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [implementationPartners, setImplementationPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setImplementationPartners(data.implementationPartners || []);
    } catch (err) {
      console.error("Error fetching implementation partners:", err);
      setError("Failed to load implementation partners");
      toast.error("Failed to load implementation partners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImplementationPartners();
  }, [user?.tenantId, toast]);

  const handleDelete = async (id) => {
    try {
      const resp = await fetch(
        `${API_BASE}/api/implementation-partners/${id}?tenantId=${user.tenantId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
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
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
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
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
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
    const handleClickOutside = (event) => {
      if (
        !event.target.closest(".dropdown-menu") &&
        !event.target.closest(".btn-trigger")
      ) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

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

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="nk-conten">
      <div className="container-fluid">
        <div className="nk-block-head">
          <div className="nk-block-between">
            <div className="nk-block-head-content">
              <h3 className="nk-block-title">Implementation Partners</h3>
              <p className="nk-block-subtitle">
                Manage your implementation partner relationships
              </p>
            </div>
            <div className="nk-block-head-content">
              <PermissionGuard
                requiredPermission={PERMISSIONS.CREATE_IMPLEMENTATION_PARTNER}
              >
                <Link
                  to={`/${subdomain}/implementation-partners/new`}
                  className="btn btn-primary"
                >
                  <i className="fas fa-plus me-2"></i>
                  Add Implementation Partner
                </Link>
              </PermissionGuard>
            </div>
          </div>
        </div>

        <div className="nk-block">
          {error ? (
            <div className="alert alert-danger" role="alert">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              {error}
              <button
                className="btn-retry"
                onClick={fetchImplementationPartners}
              >
                <i className=""></i> Retry
              </button>
            </div>
          ) : loading ? (
            <div className="d-flex justify-content-center mt-5">
              <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          ) : implementationPartners.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-handshake fa-3x text-muted mb-3"></i>
              <h4 className="text-muted">No Implementation Partners Found</h4>
              <p className="text-muted">
                Get started by adding your first implementation partner.
              </p>
              <PermissionGuard
                requiredPermission={PERMISSIONS.CREATE_IMPLEMENTATION_PARTNER}
              >
                <Link
                  to={`/${subdomain}/implementation-partners/new`}
                  className="btn btn-primary"
                >
                  <i className="fas fa-plus me-2"></i>
                  Add Implementation Partner
                </Link>
              </PermissionGuard>
            </div>
          ) : (
            <div className="card">
              <div className="card-inne">
                <table className="table table-implementation-partners">
                  <thead>
                    <tr>
                      <th>Implementation Partner Name</th>
                      <th>Contact Person</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Specialization</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentImplementationPartners.map((partner) => (
                      <tr key={partner.id}>
                        <td>
                          <Link
                            to={`/${subdomain}/implementation-partners/${partner.id}`}
                            className="implementation-partner-name"
                          >
                            {partner.name}
                          </Link>
                        </td>
                        <td>{partner.contactPerson || "-"}</td>
                        <td>{partner.email || "-"}</td>
                        <td>{partner.phone || "-"}</td>
                        <td>
                          <span
                            className={`badge badge-${
                              partner.status === "active"
                                ? "success"
                                : "warning"
                            }`}
                          >
                            {partner.status === "active"
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>
                        <td>{partner.specialization || "-"}</td>
                        <td className="text-right">
                          <div
                            className="btn-group"
                            style={{ position: "relative" }}
                          >
                            <button
                              type="button"
                              className="btn btn-sm btn-icon btn-trigger"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMenu(partner.id);
                              }}
                              aria-haspopup="true"
                              aria-expanded={openMenuId === partner.id}
                              style={{ cursor: "pointer" }}
                            >
                              <i className="fas fa-ellipsis-h"></i>
                            </button>
                            {openMenuId === partner.id && (
                              <div
                                className="dropdown-menu dropdown-menu-right show"
                                style={{
                                  position: "absolute",
                                  right: 0,
                                  top: "100%",
                                  zIndex: 1000,
                                  minWidth: "160px",
                                }}
                              >
                                <Link
                                  to={`/${subdomain}/implementation-partners/${partner.id}`}
                                  className="dropdown-item"
                                  onClick={() => setOpenMenuId(null)}
                                >
                                  <i className="fas fa-eye me-2"></i>
                                  View
                                </Link>
                                <PermissionGuard
                                  requiredPermission={
                                    PERMISSIONS.UPDATE_IMPLEMENTATION_PARTNER
                                  }
                                >
                                  <Link
                                    className="dropdown-item"
                                    to={`/${subdomain}/implementation-partners/${partner.id}/edit`}
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    <i className="fas fa-edit me-2"></i>
                                    Edit
                                  </Link>
                                </PermissionGuard>
                                <PermissionGuard
                                  requiredPermission={
                                    PERMISSIONS.DELETE_IMPLEMENTATION_PARTNER
                                  }
                                >
                                  {partner.status === "active" ? (
                                    <button
                                      className="dropdown-item text-warning"
                                      onClick={() => {
                                        handleSoftDelete(partner.id);
                                        setOpenMenuId(null);
                                      }}
                                    >
                                      <i className="fas fa-pause me-2"></i>
                                      Deactivate
                                    </button>
                                  ) : (
                                    <button
                                      className="dropdown-item text-success"
                                      onClick={() => {
                                        handleRestore(partner.id);
                                        setOpenMenuId(null);
                                      }}
                                    >
                                      <i className="fas fa-play me-2"></i>
                                      Activate
                                    </button>
                                  )}
                                  <button
                                    className="dropdown-item text-danger"
                                    onClick={() => {
                                      confirmDelete(partner.id);
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    <i className="fas fa-trash me-2"></i>
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
