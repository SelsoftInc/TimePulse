import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { PERMISSIONS } from "../../utils/roles";
import PermissionGuard from "../common/PermissionGuard";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { API_BASE } from "../../config/api";
import "./Clients.css";
import "../common/Pagination.css";

const ClientsList = () => {
  const { subdomain } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

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
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

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
    fetchClients();
  }, [user?.tenantId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      const inMenu = e.target.closest(".dropdown-menu");
      const inTrigger = e.target.closest(".btn-trigger");
      if (!inMenu && !inTrigger) setOpenMenuId(null);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const toggleMenu = (id) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  // Pagination calculations
  const totalPages = Math.ceil(clients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = clients.slice(startIndex, endIndex);

  const handleEdit = (clientId) => {
    navigate(`/${subdomain}/clients/edit/${clientId}`);
  };

  const handleDelete = async (clientId) => {
    if (!window.confirm("Delete this client? This action cannot be undone."))
      return;
    try {
      const resp = await fetch(
        `${API_BASE}/api/clients/${clientId}?tenantId=${user.tenantId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(
          err.error || `Delete failed with status ${resp.status}`
        );
      }
      await fetchClients();
      toast.success("Client has been deleted.", {
        title: "Client Deleted",
      });
    } catch (e) {
      toast.error(e.message, {
        title: "Failed to Delete",
      });
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
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
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
          country: c.country || "United States",
        },
        shippingAddress: c.shippingAddress || {
          line1: "",
          city: "",
          state: "",
          zip: "",
          country: c.country || "United States",
        },
        taxId: c.taxId || null,
        paymentTerms: Number(c.paymentTerms) || 30,
        hourlyRate: c.hourlyRate || null,
        status: c.status || "active",
        clientType: c.clientType || "external",
      };

      const postResp = await fetch(`${API_BASE}/api/clients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });
      if (!postResp.ok) {
        const err = await postResp.json().catch(() => ({}));
        throw new Error(
          err.error || `Duplicate failed with status ${postResp.status}`
        );
      }
      await fetchClients();
      toast.success("Client has been duplicated.", {
        title: "Client Duplicated",
      });
    } catch (e) {
      toast.error(e.message, {
        title: "Failed to Duplicate",
      });
    } finally {
      setOpenMenuId(null);
    }
  };

  return (
    <div className="nk-conten">
      <div className="container-fluid">
        <div className="nk-block-head">
          <div className="nk-block-between">
            <div className="nk-block-head-content">
              <h3 className="nk-block-title">End Clients</h3>
              <p className="nk-block-subtitle">
                Manage your end client relationships
              </p>
            </div>
            <div className="nk-block-head-content">
              <PermissionGuard requiredPermission={PERMISSIONS.CREATE_CLIENT}>
                <Link
                  to={`/${subdomain}/clients/new`}
                  className="btn btn-primary"
                >
                  <i className="fas fa-plus mr-1"></i> Add End Client
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
              <button className="btn-retry" onClick={fetchClients}>
                <i className=""></i> Retry
              </button>
            </div>
          ) : loading ? (
            <div className="d-flex justify-content-center mt-5">
              <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-inne">
                <table className="table table-clients">
                  <thead>
                    <tr>
                      <th>End Client Name</th>
                      <th>Contact Person</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Employees</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedClients.map((client) => (
                      <tr key={client.id}>
                        <td>
                          <Link
                            to={`/${subdomain}/clients/${client.id}`}
                            className="client-name"
                          >
                            {client.name}
                          </Link>
                        </td>
                        <td>{client.contactPerson}</td>
                        <td>{client.email}</td>
                        <td>{client.phone}</td>
                        <td>
                          <span
                            className={`badge badge-${
                              client.status === "active" ? "success" : "warning"
                            }`}
                          >
                            {client.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>{client.employeeCount}</td>
                        <td className="text-right">
                          <div className="btn-group">
                            <button
                              type="button"
                              className="btn btn-sm btn-icon btn-trigger"
                              onClick={() => toggleMenu(client.id)}
                              aria-haspopup="true"
                              aria-expanded={openMenuId === client.id}
                            >
                              <i className="fas fa-ellipsis-h"></i>
                            </button>
                            {openMenuId === client.id && (
                              <div
                                className="dropdown-menu dropdown-menu-right show"
                                style={{ position: "absolute" }}
                              >
                                <Link
                                  to={`/${subdomain}/clients/${client.id}`}
                                  className="dropdown-item"
                                  onClick={() => setOpenMenuId(null)}
                                >
                                  <i className="fas fa-eye mr-1"></i> View
                                  Details
                                </Link>
                                <PermissionGuard
                                  requiredPermission={PERMISSIONS.EDIT_CLIENT}
                                >
                                  <button
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => handleEdit(client.id)}
                                  >
                                    <i className="fas fa-edit mr-1"></i> Edit
                                  </button>
                                </PermissionGuard>
                                <PermissionGuard
                                  requiredPermission={PERMISSIONS.CREATE_CLIENT}
                                >
                                  <button
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => handleDuplicate(client.id)}
                                  >
                                    <i className="fas fa-clone mr-1"></i>{" "}
                                    Duplicate
                                  </button>
                                </PermissionGuard>
                                <PermissionGuard
                                  requiredPermission={PERMISSIONS.DELETE_CLIENT}
                                >
                                  <button
                                    type="button"
                                    className="dropdown-item text-danger"
                                    onClick={() => handleDelete(client.id)}
                                  >
                                    <i className="fas fa-trash-alt mr-1"></i>{" "}
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

                {/* Pagination Controls */}
                {clients.length > itemsPerPage && (
                  <div className="card-inner">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="text-muted">
                        Showing {startIndex + 1} to{" "}
                        {Math.min(endIndex, clients.length)} of {clients.length}{" "}
                        clients
                      </div>
                      <nav>
                        <ul className="pagination pagination-sm mb-0">
                          <li
                            className={`page-item ${
                              currentPage === 1 ? "disabled" : ""
                            }`}
                          >
                            <button
                              className="page-link"
                              onClick={() =>
                                setCurrentPage((prev) => Math.max(1, prev - 1))
                              }
                              disabled={currentPage === 1}
                            >
                              Previous
                            </button>
                          </li>
                          {[...Array(totalPages)].map((_, index) => (
                            <li
                              key={index + 1}
                              className={`page-item ${
                                currentPage === index + 1 ? "active" : ""
                              }`}
                            >
                              <button
                                className="page-link"
                                onClick={() => setCurrentPage(index + 1)}
                              >
                                {index + 1}
                              </button>
                            </li>
                          ))}
                          <li
                            className={`page-item ${
                              currentPage === totalPages ? "disabled" : ""
                            }`}
                          >
                            <button
                              className="page-link"
                              onClick={() =>
                                setCurrentPage((prev) =>
                                  Math.min(totalPages, prev + 1)
                                )
                              }
                              disabled={currentPage === totalPages}
                            >
                              Next
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientsList;
