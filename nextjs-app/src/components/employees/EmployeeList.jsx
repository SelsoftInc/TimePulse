'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { PERMISSIONS } from '@/utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import DataGridFilter from '../common/DataGridFilter';
import ConfirmationDialog from '../common/ConfirmationDialog';
import { useConfirmation } from '@/hooks/useConfirmation';
import { decryptApiResponse } from '@/utils/encryption';
import "./Employees.css";
import "./EmployeeManagement.css";
import "./EmployeeTable.css";
import "./EmployeeDropdownFix.css";
import "../common/Pagination.css";
import "../common/TableScroll.css";
import "../common/ActionsDropdown.css";
import "../common/DropdownFix.css";
import { apiFetch } from '@/config/api';

const EmployeeList = () => {
  const { subdomain } = useParams();
  const pathname = usePathname();
  const { checkPermission, user } = useAuth();
  const { toast } = useToast();
  const { confirmation, showConfirmation, confirm, cancel } = useConfirmation();
  
  // Hydration fix: Track if component is mounted on client
  const [isMounted, setIsMounted] = useState(false);
  
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    employmentType: "all",
    status: "all", // Default to all employees (active and inactive)
    search: ""});

  // Hydration fix: Set mounted state on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRefs = useRef({});

  // Quick Add Client state
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAdd, setQuickAdd] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    taxId: ""});

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleDocClick = (e) => {
      if (!openMenuFor) return;
      
      // Check if click is on the dropdown menu or the button
      const dropdownMenu = document.querySelector('.dropdown-menu.show');
      const actionButton = buttonRefs.current[openMenuFor];
      
      if (dropdownMenu && dropdownMenu.contains(e.target)) return; // click inside dropdown
      if (actionButton && actionButton.contains(e.target)) return; // click on button
      
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
          country: "United States"},
        shippingAddress: {
          line1: "",
          city: "",
          state: "",
          zip: "",
          country: "United States"},
        taxId: quickAdd.taxId,
        paymentTerms: 30,
        hourlyRate: null,
        status: "active",
        clientType: "external"};
      const resp = await apiFetch(
        `/api/clients`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"},
          body: JSON.stringify(payload)},
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
            status: "active"},
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

      console.log('🔄 Fetching employees list...');
      console.log('📍 Current location:', pathname);

      if (!user?.tenantId) {
        setError("No tenant information available");
        setLoading(false);
        return;
      }

      const response = await apiFetch(
        `/api/employees?tenantId=${user.tenantId}&status=${filters.status}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`}},
        { timeoutMs: 15000 }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawData = await response.json();
      console.log('📦 Raw employees response:', rawData);
      
      // Decrypt the response if encrypted
      const data = decryptApiResponse(rawData);
      console.log('🔓 Decrypted employees data:', data);

      if (data.success) {
        console.log('✅ Employees fetched:', data.employees?.length || 0, 'employees');
        
        // Check for duplicate IDs
        const employeeIds = data.employees?.map(e => e.id) || [];
        const uniqueIds = [...new Set(employeeIds)];
        if (employeeIds.length !== uniqueIds.length) {
          console.log('⚠️ WARNING: Duplicate employee IDs in response!');
          console.log('📋 All IDs:', employeeIds);
          console.log('📋 Unique IDs:', uniqueIds);
          
          // Find duplicates
          const duplicates = employeeIds.filter((id, index) => employeeIds.indexOf(id) !== index);
          console.log('🔍 Duplicate IDs:', [...new Set(duplicates)]);
        }
        
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
    if (isMounted) {
      fetchEmployees();
    }
  }, [isMounted, user?.tenantId, filters.status, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

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
            Authorization: `Bearer ${localStorage.getItem("token")}`}},
        { timeoutMs: 15000 }
      );
      if (!resp.ok) {
        const rawErr = await resp.json().catch(() => ({}));
        const err = decryptApiResponse(rawErr);
        throw new Error(
          err.details || `Failed to fetch clients (${resp.status})`
        );
      }
      const rawData = await resp.json();
      const data = decryptApiResponse(rawData);
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
      taxId: ""});
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
          Authorization: `Bearer ${localStorage.getItem("token")}`}});
      if (!resp.ok) throw new Error(`Failed to fetch vendors`);
      const rawData = await resp.json();
      const data = decryptApiResponse(rawData);
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
            Authorization: `Bearer ${localStorage.getItem("token")}`},
          body: JSON.stringify(body)}
      );
      if (!resp.ok) throw new Error("Failed to assign vendor");
      
      const rawCData = await resp.json();
      const cData = decryptApiResponse(rawCData);
      console.log("✅ Vendor assignment response:", cData);
      
      // Optimistically update the employee in the local state
      if (cData.employee) {
        setEmployees(prevEmployees => 
          prevEmployees.map(emp => 
            emp.id === assignTarget.id 
              ? {
                  ...emp,
                  vendorId: cData.employee.vendorId,
                  vendor: cData.employee.vendor ? {
                    id: cData.employee.vendor.id,
                    name: cData.employee.vendor.name,
                    category: cData.employee.vendor.category
                  } : null
                }
              : emp
          )
        );
      }
      
      toast.success("Vendor assigned successfully");
      closeVendorModal();
      
      // Also fetch fresh data from server to ensure consistency
      await fetchEmployees();
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
            Authorization: `Bearer ${localStorage.getItem("token")}`}}
      );
      if (!resp.ok) throw new Error(`Failed to fetch impl partners`);
      const rawData = await resp.json();
      const data = decryptApiResponse(rawData);
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
            Authorization: `Bearer ${localStorage.getItem("token")}`},
          body: JSON.stringify(body)}
      );
      if (!resp.ok) throw new Error("Failed to assign impl partner");
      
      const data = await resp.json();
      console.log("✅ Impl partner assignment response:", data);
      
      // Optimistically update the employee in the local state
      if (data.employee) {
        setEmployees(prevEmployees => 
          prevEmployees.map(emp => 
            emp.id === assignTarget.id 
              ? {
                  ...emp,
                  implPartnerId: data.employee.implPartnerId,
                  implPartner: data.employee.implPartner ? {
                    id: data.employee.implPartner.id,
                    name: data.employee.implPartner.name,
                    specialization: data.employee.implPartner.specialization
                  } : null
                }
              : emp
          )
        );
      }
      
      toast.success("Implementation Partner assigned successfully");
      closeImplPartnerModal();
      
      // Also fetch fresh data from server to ensure consistency
      await fetchEmployees();
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
            Authorization: `Bearer ${localStorage.getItem("token")}`},
          body: JSON.stringify(body)},
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
                  : null}
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
      message: `Are you sure you want to delete ${employee.name}? This action can be done.`,
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
                Authorization: `Bearer ${localStorage.getItem("token")}`}},
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
      }});
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

    // Status filter (handled by backend API, but keep for frontend filtering if needed)
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
      [filterKey]: value}));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      employmentType: "all",
      status: "all",
      search: ""});
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
        { value: "Sub-Contract", label: "Sub-Contract Only" },
      ]},
    {
      key: "status",
      label: "Status",
      type: "select",
      value: filters.status,
      defaultValue: "active", // Default to active employees
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "all", label: "All Statuses" },
      ]},
    {
      key: "search",
      label: "Search",
      type: "text",
      value: filters.search,
      defaultValue: "",
      placeholder: "Search by name, email, or position..."},
  ];

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

    <div className="employeelist">
      <div className="container-fluid">
        {/* ================= EMPLOYEES HEADER ================= */}
<div className="top-4 z-30 mb-6">
  <div
    className="
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
            Employees
          </h1>

          <p className="mt-0 text-sm text-white/80 dark:text-slate-300">
            Manage your team members
          </p>
        </div>

        {/* RIGHT */}
        <div className="flex flex-wrap items-center gap-3">
          <PermissionGuard requiredPermission={PERMISSIONS.CREATE_EMPLOYEE}>
            <Link
              href={`/${subdomain}/employees/new`}
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
              Add New Employee
            </Link>
          </PermissionGuard>
        </div>

      </div>
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
            <div className="card card-bordered">
              <div className="card-inner p-0">
                <div className="nk-tb-list nk-tb-orders">
                  <div className="nk-tb-item nk-tb-head">
                    <div className="nk-tb-col"><span>Name</span></div>
                    <div className="nk-tb-col tb-col-md"><span>Vendor</span></div>
                    <div className="nk-tb-col tb-col-md"><span>Client</span></div>
                    <div className="nk-tb-col"><span>Employment Type</span></div>
                    {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && (
                      <div className="nk-tb-col"><span>Hourly Rate</span></div>
                    )}
                    <div className="nk-tb-col"><span>Email</span></div>
                    <div className="nk-tb-col tb-col-md"><span>Phone</span></div>
                    <div className="nk-tb-col"><span>Status</span></div>
                    <div className="nk-tb-col nk-tb-col-tools text-end"><span className="sub-text">ACTIONS</span></div>
                  </div>
                  {paginatedEmployees.map((employee) => (
                    <div key={employee.id} className={`nk-tb-item ${openMenuFor === employee.id ? 'dropdown-open' : ''}`}>
                      <div className="nk-tb-col">
                        <Link href={`/${subdomain}/employees/${employee.id}`}
                          className="tb-lead"
                        >
                          {employee.name}
                        </Link>
                      </div>
                      <div className="nk-tb-col tb-col-md">
                        {employee.vendor?.name ? (
                          <Link href={`/${subdomain}/vendors/${employee.vendorId}`}
                            className="tb-sub"
                          >
                            {employee.vendor.name}
                          </Link>
                        ) : (
                          <span className="tb-sub text-soft">Not assigned</span>
                        )}
                      </div>
                      <div className="nk-tb-col tb-col-md">
                        {employee.client?.name ? (
                          <Link href={`/${subdomain}/clients/${employee.clientId}`}
                            className="tb-sub"
                          >
                            {employee.client.name}
                          </Link>
                        ) : (
                          <span className="tb-sub text-soft">Not assigned</span>
                        )}
                      </div>
                      <div className="nk-tb-col">
                        <span
                          className={`badge badge-dim bg-outline-${
                            employee.employmentType === "W2" ? "primary" : "info"
                          }`}
                        >
                          {employee.employmentType}
                        </span>
                      </div>
                      {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && (
                        <div className="nk-tb-col">
                          <span className="tb-amount">
                            {employee.hourlyRate ? `$${employee.hourlyRate}` : <span className="text-soft">Not set</span>}
                          </span>
                        </div>
                      )}
                      <div className="nk-tb-col">
                        <span className="tb-sub">{employee.email}</span>
                      </div>
                      <div className="nk-tb-col tb-col-md">
                        <span className="tb-sub">
                          {employee.phone || <span className="text-soft">Not provided</span>}
                        </span>
                      </div>
                      <div className="nk-tb-col">
                        <span
                          className={`badge bg-outline-${
                            employee.status === "active" ? "success" : "secondary"
                          }`}
                        >
                          {employee.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="nk-tb-col nk-tb-col-tools">
                        <div className="dropdown">
                          <button
                            ref={(el) => {
                              if (el) buttonRefs.current[employee.id] = el;
                            }}
                            className="btn btn-sm btn-outline-secondary dropdown-toggle"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('🖱️ Actions button clicked for employee:', employee.id);
                              const isOpening = openMenuFor !== employee.id;
                              if (isOpening) {
                                // Calculate position
                                const rect = e.currentTarget.getBoundingClientRect();
                                const position = {
                                  top: rect.bottom + 4,
                                  left: rect.right - 200, // 200px is dropdown width
                                };
                                console.log('📍 Dropdown position:', position);
                                setDropdownPosition(position);
                                setOpenMenuFor(employee.id);
                                console.log('✅ Dropdown opened for:', employee.id);
                              } else {
                                console.log('❌ Dropdown closed');
                                setOpenMenuFor(null);
                              }
                            }}
                            type="button"
                            style={{ paddingLeft: '12px', paddingRight: '12px' }}
                          >
                            <span style={{ marginRight: '8px' }}>Actions</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

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

      {/* Fixed Position Dropdown Menu - Using Portal for proper z-index */}
      {openMenuFor && (() => {
        console.log('🎨 Rendering dropdown for:', openMenuFor);
        console.log('📊 Total filtered employees:', filteredEmployees.length);
        // Search in filteredEmployees instead of employees to handle pagination/filtering
        let employee = filteredEmployees.find(e => e.id === openMenuFor);
        
        // Fallback to searching in all employees if not found in filtered
        if (!employee) {
          console.log('🔍 Not found in filtered, searching in all employees...');
          employee = employees.find(e => e.id === openMenuFor);
        }
        
        console.log('👤 Found employee:', employee ? `${employee.firstName} ${employee.lastName}` : 'NOT FOUND');
        
        if (!employee) {
          console.error('❌ Employee not found in any array');
          return null;
        }
        
        // Render dropdown using Portal to ensure it appears above everything
        return ReactDOM.createPortal(
          <div
            className="dropdown-menu dropdown-menu-right show"
            style={{
              position: 'fixed',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              zIndex: 999999,
              minWidth: '200px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'}}
          >
            <Link href={`/${subdomain}/employees/${employee.id}`}
              className="dropdown-item"
              onClick={() => setOpenMenuFor(null)}
            >
              <i className="fas fa-eye mr-1"></i> View Details
            </Link>
            <PermissionGuard requiredPermission={PERMISSIONS.EDIT_EMPLOYEE}>
              {/* <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setOpenMenuFor(null);
                  openAssignModal(employee);
                }}
              >
                <i className="fas fa-users mr-1"></i> Assign End Client
              </button> */}
              {/* <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setOpenMenuFor(null);
                  openVendorModal(employee);
                }}
              >
                <i className="fas fa-truck mr-1"></i> Assign Vendor
              </button> */}
              {/* <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setOpenMenuFor(null);
                  openImplPartnerModal(employee);
                }}
              >
                <i className="fas fa-handshake mr-1"></i> Assign Impl Partner
              </button> */}
              <Link href={`/${subdomain}/employees/${employee.id}/edit`}
                className="dropdown-item"
                onClick={() => setOpenMenuFor(null)}
              >
                <i className="fas fa-edit mr-1"></i> Edit
              </Link>
            </PermissionGuard>
            <PermissionGuard requiredPermission={PERMISSIONS.DELETE_EMPLOYEE}>
              <button
                type="button"
                className="dropdown-item text-danger"
                onClick={() => {
                  setOpenMenuFor(null);
                  handleDeleteEmployee(employee);
                }}
              >
                <i className="fas fa-trash mr-1"></i> Delete
              </button>
            </PermissionGuard>
          </div>,
          document.body
        );
      })()}

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
                      <Link href={`/${subdomain}/clients/new`}
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
                                name: e.target.value}))
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
                                contactPerson: e.target.value}))
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
                                email: e.target.value}))
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
                                phone: e.target.value}))
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
                                taxId: e.target.value}))
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
