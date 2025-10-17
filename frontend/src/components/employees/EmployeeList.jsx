import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { PERMISSIONS } from "../../utils/roles";
import PermissionGuard from "../common/PermissionGuard";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import DataGridFilter from "../common/DataGridFilter";
import ConfirmationDialog from "../common/ConfirmationDialog";
import { useConfirmation } from "../../hooks/useConfirmation";
import "./Employees.css";
import "./EmployeeManagement.css";
import "../common/Pagination.css";
import { apiFetch } from "../../config/api";

const EmployeeList = () => {
  const { subdomain } = useParams();
  const { checkPermission, user } = useAuth();
  const { toast } = useToast();
  const { confirmation, showConfirmation, confirm, cancel } = useConfirmation();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    employmentType: "all",
    status: "all",
    search: "",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal state for assigning client
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null); // employee object
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");

  // Modal state for assigning vendor
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState("");

  // Modal state for assigning impl partner
  const [implPartnerModalOpen, setImplPartnerModalOpen] = useState(false);
  const [implPartners, setImplPartners] = useState([]);
  const [implPartnersLoading, setImplPartnersLoading] = useState(false);
  const [selectedImplPartnerId, setSelectedImplPartnerId] = useState("");

  // Track which row's actions menu is open
  const [openMenuFor, setOpenMenuFor] = useState(null);

  // Quick Add Client state
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAdd, setQuickAdd] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    taxId: "",
  });

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleDocClick = (e) => {
      if (!openMenuFor) return;
      const menuEl = document.querySelector(
        `[data-actions-menu="${openMenuFor}"]`
      );
      if (menuEl && menuEl.contains(e.target)) return; // click inside menu wrapper
      setOpenMenuFor(null);
    };
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [openMenuFor]);

  // Create a new client from within the modal (minimal fields)
  const createClientInline = async () => {
    if (!user?.tenantId) {
      toast.error("No tenant information");
      return;
    }
    if (
      !quickAdd.name ||
      !quickAdd.contactPerson ||
      !quickAdd.email ||
      !quickAdd.phone ||
      !quickAdd.taxId
    ) {
      toast.error("Please fill Name, Contact Person, Email, Phone, and Tax ID");
      return;
    }
    try {
      setQuickAddLoading(true);
      const payload = {
        tenantId: user.tenantId,
        clientName: quickAdd.name,
        legalName: quickAdd.name,
        contactPerson: quickAdd.contactPerson,
        email: quickAdd.email,
        phone: quickAdd.phone || "",
        billingAddress: {
          line1: "",
          city: "",
          state: "",
          zip: "",
          country: "United States",
        },
        shippingAddress: {
          line1: "",
          city: "",
          state: "",
          zip: "",
          country: "United States",
        },
        taxId: quickAdd.taxId,
        paymentTerms: 30,
        hourlyRate: null,
        status: "active",
        clientType: "external",
      };
      const resp = await apiFetch(
        `/api/clients`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
        { timeoutMs: 15000 }
      );
      if (!resp.ok) {
        // Try to extract best error message and field errors
        const text = await resp.text().catch(() => "");
        let errJson = null;
        try {
          errJson = text ? JSON.parse(text) : null;
        } catch (_) {
          /* not json */
        }
        const fieldErrors = errJson?.errors || errJson?.validationErrors;
        let firstFieldError = "";
        if (Array.isArray(fieldErrors) && fieldErrors.length) {
          const fe = fieldErrors[0];
          firstFieldError =
            typeof fe === "string"
              ? fe
              : fe?.message || fe?.msg || JSON.stringify(fe);
        } else if (fieldErrors && typeof fieldErrors === "object") {
          const feKey = Object.keys(fieldErrors)[0];
          const feVal = fieldErrors[feKey];
          firstFieldError = Array.isArray(feVal)
            ? feVal[0]
            : feVal?.message || JSON.stringify(feVal);
        }
        const serverMsg =
          errJson?.message ||
          errJson?.error ||
          errJson?.details ||
          firstFieldError ||
          text;
        const msg =
          typeof serverMsg === "string"
            ? serverMsg
            : JSON.stringify(serverMsg || {});
        throw new Error(msg || `Create client failed (${resp.status})`);
      }
      // Parse success body
      const created = await resp.json().catch(() => ({}));
      // Try to get id and name from response; fallback to refresh
      const newClientId = created?.client?.id || created?.id;
      const newClientName =
        created?.client?.clientName || created?.clientName || quickAdd.name;
      if (newClientId) {
        // Update local list and select
        setClients((prev) => [
          {
            id: newClientId,
            clientName: newClientName,
            name: newClientName,
            status: "active",
          },
          ...prev,
        ]);
        setSelectedClientId(String(newClientId));
        toast.success("Client created");
      } else {
        // Fallback: refresh list then try to select by name
        await fetchClients();
        const found = (clients || []).find(
          (x) => (x.clientName || x.name) === newClientName
        );
        if (found?.id) setSelectedClientId(String(found.id));
        toast.success("Client created");
      }
      setQuickAddOpen(false);
    } catch (e) {
      console.error("Inline client create failed:", e);
      const msg =
        typeof e?.message === "string" ? e.message : JSON.stringify(e || {});
      toast.error(msg || "Failed to create client");
    } finally {
      setQuickAddLoading(false);
    }
  };

  // Fetch employees from backend API
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      if (!user?.tenantId) {
        setError("No tenant information available");
        setLoading(false);
        return;
      }

      const response = await apiFetch(
        `/api/employees?tenantId=${user.tenantId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
        { timeoutMs: 15000 }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setEmployees(data.employees || []);
      } else {
        setError(data.error || "Failed to fetch employees");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setError("Failed to load employees. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [user?.tenantId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch clients when opening modal
  const fetchClients = async () => {
    if (!user?.tenantId) return;
    try {
      setClientsLoading(true);
      setClientsError("");
      const resp = await apiFetch(
        `/api/clients?tenantId=${user.tenantId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
        { timeoutMs: 15000 }
      );
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(
          err.details || `Failed to fetch clients (${resp.status})`
        );
      }
      const data = await resp.json();
      const list = (data.clients || data || []).filter(
        (c) => (c.status || "active") === "active"
      );
      setClients(list);
    } catch (e) {
      console.error("Failed to fetch clients:", e);
      setClientsError(e.message);
    } finally {
      setClientsLoading(false);
    }
  };

  const openAssignModal = (employee) => {
    setAssignTarget(employee);
    setSelectedClientId(employee.clientId ? String(employee.clientId) : "");
    setAssignModalOpen(true);
    setQuickAddOpen(false);
    setQuickAdd({
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      taxId: "",
    });
    fetchClients();
  };

  const closeAssignModal = () => {
    setAssignModalOpen(false);
    setAssignTarget(null);
    setSelectedClientId("");
    setClientsError("");
  };

  // Fetch vendors when opening modal
  const fetchVendors = async () => {
    if (!user?.tenantId) return;
    try {
      setVendorsLoading(true);
      const resp = await apiFetch(`/api/vendors?tenantId=${user.tenantId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!resp.ok) throw new Error(`Failed to fetch vendors`);
      const data = await resp.json();
      const list = (data.vendors || data || []).filter(
        (v) => !v.isImplPartner && v.status === "active"
      );
      setVendors(list);
    } catch (e) {
      console.error("Failed to fetch vendors:", e);
    } finally {
      setVendorsLoading(false);
    }
  };

  const openVendorModal = (employee) => {
    setAssignTarget(employee);
    setSelectedVendorId(employee.vendorId ? String(employee.vendorId) : "");
    setVendorModalOpen(true);
    fetchVendors();
  };

  const closeVendorModal = () => {
    setVendorModalOpen(false);
    setAssignTarget(null);
    setSelectedVendorId("");
  };

  const saveVendorAssignment = async () => {
    if (!assignTarget) return;
    try {
      const body = { vendorId: selectedVendorId || null };
      const resp = await apiFetch(
        `/api/employees/${assignTarget.id}?tenantId=${user.tenantId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(body),
        }
      );
      if (!resp.ok) throw new Error("Failed to assign vendor");
      toast.success("Vendor assigned successfully");
      closeVendorModal();
      fetchEmployees();
    } catch (e) {
      console.error("Error assigning vendor:", e);
      toast.error(e.message || "Failed to assign vendor");
    }
  };

  // Fetch impl partners when opening modal
  const fetchImplPartners = async () => {
    if (!user?.tenantId) return;
    try {
      setImplPartnersLoading(true);
      const resp = await apiFetch(
        `/api/vendors?tenantId=${user.tenantId}&implPartner=1`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (!resp.ok) throw new Error(`Failed to fetch impl partners`);
      const data = await resp.json();
      const list = (data.vendors || data || []).filter(
        (v) => v.isImplPartner && v.status === "active"
      );
      setImplPartners(list);
    } catch (e) {
      console.error("Failed to fetch impl partners:", e);
    } finally {
      setImplPartnersLoading(false);
    }
  };

  const openImplPartnerModal = (employee) => {
    setAssignTarget(employee);
    setSelectedImplPartnerId(
      employee.implPartnerId ? String(employee.implPartnerId) : ""
    );
    setImplPartnerModalOpen(true);
    fetchImplPartners();
  };

  const closeImplPartnerModal = () => {
    setImplPartnerModalOpen(false);
    setAssignTarget(null);
    setSelectedImplPartnerId("");
  };

  const saveImplPartnerAssignment = async () => {
    if (!assignTarget) return;
    try {
      const body = { implPartnerId: selectedImplPartnerId || null };
      const resp = await apiFetch(
        `/api/employees/${assignTarget.id}?tenantId=${user.tenantId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(body),
        }
      );
      if (!resp.ok) throw new Error("Failed to assign impl partner");
      toast.success("Implementation Partner assigned successfully");
      closeImplPartnerModal();
      fetchEmployees();
    } catch (e) {
      console.error("Error assigning impl partner:", e);
      toast.error(e.message || "Failed to assign impl partner");
    }
  };

  const saveAssignment = async () => {
    if (!assignTarget) return;
    try {
      const body = { clientId: selectedClientId || null };
      // Show heads-up toast when unassigning instead of a blocking confirm dialog
      if (!body.clientId && assignTarget?.clientId) {
        toast.info(
          `Unassigning ${
            assignTarget.name || "this employee"
          } from their current client...`
        );
      }
      const resp = await apiFetch(
        `/api/employees/${assignTarget.id}?tenantId=${user.tenantId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(body),
        },
        { timeoutMs: 15000 }
      );
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.details || `Update failed (${resp.status})`);
      }
      // Update local list
      const selectedClient = clients.find(
        (c) => String(c.id) === String(selectedClientId)
      );
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === assignTarget.id
            ? {
                ...e,
                clientId: body.clientId,
                client: body.clientId
                  ? selectedClient?.clientName || selectedClient?.name || ""
                  : null,
              }
            : e
        )
      );
      toast.success(body.clientId ? "Client assigned" : "Client unassigned");
      closeAssignModal();
    } catch (e) {
      console.error("Failed to update employee client:", e);
      toast.error(`Failed to update: ${e.message}`);
    }
  };

  const handleDeleteEmployee = (employee) => {
    showConfirmation({
      title: "Delete Employee",
      message: `Are you sure you want to delete ${employee.name}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "error",
      onConfirm: async () => {
        try {
          setOpenMenuFor(null);
          const response = await apiFetch(
            `/api/employees/${employee.id}?tenantId=${user.tenantId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
            { timeoutMs: 15000 }
          );

          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(
              error.message ||
                error.details ||
                `Failed to delete employee (${response.status})`
            );
          }

          // Remove from local state
          setEmployees((prev) => prev.filter((e) => e.id !== employee.id));
        } catch (error) {
          console.error("Error deleting employee:", error);
          throw error; // Re-throw to be caught by the confirmation hook
        }
      }
    });
  };

  // Filter employees based on all filters
  const filteredEmployees = employees.filter((employee) => {
    // Employment type filter
    if (
      filters.employmentType !== "all" &&
      employee.employmentType !== filters.employmentType
    ) {
      return false;
    }

    // Status filter
    if (filters.status !== "all" && employee.status !== filters.status) {
      return false;
    }

    // Search filter
    if (
      filters.search &&
      !employee.name.toLowerCase().includes(filters.search.toLowerCase()) &&
      !employee.email.toLowerCase().includes(filters.search.toLowerCase()) &&
      !employee.position.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (filterKey, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      employmentType: "all",
      status: "all",
      search: "",
    });
  };

  // Define filter configuration
  const filterConfig = [
    {
      key: "employmentType",
      label: "Employment Type",
      type: "select",
      value: filters.employmentType,
      defaultValue: "all",
      options: [
        { value: "all", label: "All Types" },
        { value: "W2", label: "W2 Only" },
        { value: "Subcontractor", label: "Subcontractors Only" },
      ],
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      value: filters.status,
      defaultValue: "all",
      options: [
        { value: "all", label: "All Statuses" },
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
    {
      key: "search",
      label: "Search",
      type: "text",
      value: filters.search,
      defaultValue: "",
      placeholder: "Search by name, email, or position...",
    },
  ];

  return (
    <div className="">
      <div className="container-fluid">
        <div className="nk-block-head">
          <div className="nk-block-between">
            <div className="nk-block-head-content">
              <h3 className="nk-block-title">Employees</h3>
              <p className="nk-block-subtitle">Manage your team members</p>
            </div>
            <div className="nk-block-head-content">
              <PermissionGuard requiredPermission={PERMISSIONS.CREATE_EMPLOYEE}>
                <Link
                  to={`/${subdomain}/employees/new`}
                  className="btn btn-primary"
                >
                  <i className="fas fa-plus mr-1"></i> Add New Employee
                </Link>
              </PermissionGuard>
            </div>
          </div>
        </div>

        <div className="nk-block">
          <div className="card card-bordered mb-4">
            <div className="">
              <DataGridFilter
                filters={filterConfig}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                resultCount={filteredEmployees.length}
                totalCount={employees.length}
              />
            </div>
          </div>

          {error ? (
            <div className="alert alert-danger" role="alert">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              {error}
              <button className="btn-retry" onClick={fetchEmployees}>
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
              <div className="card-inner table-responsive">
                <table className="table employee-table">
                  <thead>
                    <tr>
                      <th className="table-header">Name</th>
                      <th className="table-header">Vendor</th>
                      <th className="table-header">Client</th>
                      <th className="table-header">End Client</th>
                      <th className="table-header">Employment Type</th>
                      {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && (
                        <th className="table-header">Hourly Rate</th>
                      )}
                      <th className="table-header">Email</th>
                      <th className="table-header">Phone</th>
                      <th className="table-header">Status</th>
                      <th className="table-header text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEmployees.map((employee) => (
                      <tr key={employee.id}>
                        <td className="table-cell">
                          <Link
                            to={`/${subdomain}/employees/${employee.id}`}
                            className="employee-name"
                          >
                            {employee.name}
                          </Link>
                        </td>
                        <td className="table-cell">
                          {employee.employmentType === "Subcontractor" ? (
                            employee.vendor ? (
                              <Link
                                to={`/${subdomain}/vendors/${employee.vendorId}`}
                                className="vendor-link"
                              >
                                {employee.vendor}
                              </Link>
                            ) : (
                              <span className="text-tertiary">
                                No vendor assigned
                              </span>
                            )
                          ) : (
                            <span className="text-tertiary">N/A</span>
                          )}
                        </td>
                        <td className="table-cell">
                          {employee.client ? (
                            employee.client
                          ) : (
                            <span className="text-tertiary">Not assigned</span>
                          )}
                        </td>
                        <td className="table-cell">
                          {employee.endClient ? (
                            <div className="d-flex flex-column">
                              <span className="table-cell">
                                {employee.endClient.name}
                              </span>
                              <small className="text-tertiary">
                                {employee.endClient.location}
                              </small>
                            </div>
                          ) : (
                            <span className="text-tertiary">Not assigned</span>
                          )}
                        </td>
                        <td className="table-cell">
                          <span
                            className={`employment-type-badge ${
                              employee.employmentType === "W2"
                                ? "primary"
                                : "info"
                            }`}
                          >
                            {employee.employmentType}
                          </span>
                        </td>
                        {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && (
                          <td className="table-cell">
                            {employee.hourlyRate ? (
                              `$${employee.hourlyRate}`
                            ) : (
                              <span className="text-tertiary">Not set</span>
                            )}
                          </td>
                        )}
                        <td className="table-cell">{employee.email}</td>
                        <td className="table-cell">
                          {employee.phone ? (
                            employee.phone
                          ) : (
                            <span className="text-tertiary">Not provided</span>
                          )}
                        </td>
                        <td className="table-cell">
                          <span
                            className={`status-badge ${
                              employee.status === "active"
                                ? "active"
                                : "inactive"
                            }`}
                          >
                            {employee.status === "active"
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>
                        <td className="text-right">
                          <div
                            className="btn-group"
                            data-actions-menu={employee.id}
                          >
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary dropdown-toggle"
                              onClick={() =>
                                setOpenMenuFor(
                                  openMenuFor === employee.id
                                    ? null
                                    : employee.id
                                )
                              }
                            >
                              Actions
                            </button>
                            {openMenuFor === employee.id && (
                              <div
                                className="dropdown-menu dropdown-menu-right show"
                                style={{ position: "absolute" }}
                              >
                                <Link
                                  to={`/${subdomain}/employees/${employee.id}`}
                                  className="dropdown-item"
                                  onClick={() => setOpenMenuFor(null)}
                                >
                                  <i className="fas fa-eye mr-1"></i> View
                                  Details
                                </Link>
                                <PermissionGuard
                                  requiredPermission={PERMISSIONS.EDIT_EMPLOYEE}
                                >
                                  <button
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => {
                                      setOpenMenuFor(null);
                                      openAssignModal(employee);
                                    }}
                                  >
                                    <i className="fas fa-users mr-1"></i> Assign
                                    End Client
                                  </button>
                                  <button
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => {
                                      setOpenMenuFor(null);
                                      openVendorModal(employee);
                                    }}
                                  >
                                    <i className="fas fa-truck mr-1"></i> Assign
                                    Vendor
                                  </button>
                                  <button
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => {
                                      setOpenMenuFor(null);
                                      openImplPartnerModal(employee);
                                    }}
                                  >
                                    <i className="fas fa-handshake mr-1"></i>{" "}
                                    Assign Impl Partner
                                  </button>
                                  <div className="dropdown-divider"></div>
                                  <Link
                                    to={`/${subdomain}/employees/${employee.id}/edit`}
                                    className="dropdown-item"
                                    onClick={() => setOpenMenuFor(null)}
                                  >
                                    <i className="fas fa-edit mr-1"></i> Edit
                                  </Link>
                                </PermissionGuard>
                                <PermissionGuard
                                  requiredPermission={
                                    PERMISSIONS.DELETE_EMPLOYEE
                                  }
                                >
                                  <button
                                    type="button"
                                    className="dropdown-item text-danger"
                                    onClick={() =>
                                      handleDeleteEmployee(employee)
                                    }
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
                {filteredEmployees.length > itemsPerPage && (
                  <div className="pagination-wrapper">
                    <div className="pagination-info">
                      Showing {startIndex + 1} to{" "}
                      {Math.min(endIndex, filteredEmployees.length)} of{" "}
                      {filteredEmployees.length} employees
                    </div>
                    <div className="pagination-controls">
                      <nav>
                        <ul className="pagination">
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
                              <i className="fas fa-chevron-left"></i>
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
                              <i className="fas fa-chevron-right"></i>
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

      {assignModalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {assignTarget?.clientId
                    ? "Change End Client"
                    : "Assign End Client"}
                </h5>
                <button
                  type="button"
                  className="close"
                  onClick={closeAssignModal}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label d-flex align-items-center justify-content-between">
                    <span>Client</span>
                    <span className="d-flex align-items-center gap-2">
                      <Link
                        to={`/${subdomain}/clients/new`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-primary small mr-2"
                        onClick={() => setOpenMenuFor(null)}
                      >
                        <i className="fas fa-plus-circle mr-1"></i> Add New
                        Client
                      </Link>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-secondary"
                        onClick={fetchClients}
                        disabled={clientsLoading}
                        title="Refresh clients"
                      >
                        <i className="fas fa-sync-alt"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-primary ml-2"
                        onClick={() => setQuickAddOpen((v) => !v)}
                      >
                        {quickAddOpen ? "Close quick add" : "Quick add"}
                      </button>
                    </span>
                  </label>
                  <select
                    className="form-select"
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                  >
                    <option value="">-- Unassign --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.clientName || c.name}
                      </option>
                    ))}
                  </select>
                  {clientsLoading && (
                    <div className="form-note mt-1">
                      <small className="text-soft">Loading clients…</small>
                    </div>
                  )}
                  {clientsError && (
                    <div className="form-note mt-1">
                      <small className="text-danger">{clientsError}</small>
                    </div>
                  )}
                  {quickAddOpen && (
                    <div className="border rounded p-2 mt-3">
                      <div className="row g-2">
                        <div className="col-md-6">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Client Name*"
                            value={quickAdd.name}
                            onChange={(e) =>
                              setQuickAdd((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-md-6">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Contact Person*"
                            value={quickAdd.contactPerson}
                            onChange={(e) =>
                              setQuickAdd((prev) => ({
                                ...prev,
                                contactPerson: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-md-6 mt-2">
                          <input
                            type="email"
                            className="form-control"
                            placeholder="Email*"
                            value={quickAdd.email}
                            onChange={(e) =>
                              setQuickAdd((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-md-6 mt-2">
                          <input
                            type="tel"
                            className="form-control"
                            placeholder="Phone*"
                            value={quickAdd.phone}
                            onChange={(e) =>
                              setQuickAdd((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-md-6 mt-2">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Tax ID* (e.g., 13-1234567)"
                            value={quickAdd.taxId}
                            onChange={(e) =>
                              setQuickAdd((prev) => ({
                                ...prev,
                                taxId: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-12 mt-2 d-flex justify-content-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={createClientInline}
                            disabled={quickAddLoading}
                          >
                            {quickAddLoading ? "Creating…" : "Create & Select"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-light"
                  onClick={closeAssignModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={saveAssignment}
                  disabled={clientsLoading}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Assignment Modal */}
      {vendorModalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Assign Vendor</h5>
                <button
                  type="button"
                  className="close"
                  onClick={closeVendorModal}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Vendor</label>
                  <select
                    className="form-control"
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value)}
                    disabled={vendorsLoading}
                  >
                    <option value="">-- Select Vendor --</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                  {vendorsLoading && (
                    <small className="text-muted">Loading vendors...</small>
                  )}
                </div>
                <p className="text-muted small">
                  Assign a vendor to this employee. The tenant will send
                  invoices to this vendor.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-light"
                  onClick={closeVendorModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={saveVendorAssignment}
                  disabled={vendorsLoading}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Impl Partner Assignment Modal */}
      {implPartnerModalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Assign Implementation Partner</h5>
                <button
                  type="button"
                  className="close"
                  onClick={closeImplPartnerModal}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Implementation Partner</label>
                  <select
                    className="form-control"
                    value={selectedImplPartnerId}
                    onChange={(e) => setSelectedImplPartnerId(e.target.value)}
                    disabled={implPartnersLoading}
                  >
                    <option value="">
                      -- Select Implementation Partner --
                    </option>
                    {implPartners.map((partner) => (
                      <option key={partner.id} value={partner.id}>
                        {partner.name}
                      </option>
                    ))}
                  </select>
                  {implPartnersLoading && (
                    <small className="text-muted">
                      Loading implementation partners...
                    </small>
                  )}
                </div>
                <p className="text-muted small">
                  Assign an implementation partner to this employee.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-light"
                  onClick={closeImplPartnerModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={saveImplPartnerAssignment}
                  disabled={implPartnersLoading}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmation.isOpen}
        onClose={cancel}
        onConfirm={confirm}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        type={confirmation.type}
        isLoading={confirmation.isLoading}
      />
    </div>
  );
};

export default EmployeeList;
