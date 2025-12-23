'use client';

import Link from 'next/link';
import { useRouter, useParams, usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { PERMISSIONS } from '@/utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { API_BASE, apiFetch } from '@/config/api';
import {
  COUNTRY_OPTIONS,
  STATES_BY_COUNTRY,
  getPostalLabel,
  getPostalPlaceholder,
  getCountryCode
} from '../../config/lookups';
import {
  validatePhoneNumber,
  validateZipCode,
  validateEmail,
  validateName,
  formatPostalInput} from '@/utils/validations';
import "./Employees.css";

const EmployeeForm = () => {
  const router = useRouter();
  const { subdomain, id } = useParams(); // Add id parameter for edit mode
  const pathname = usePathname();
  const { checkPermission, user } = useAuth();
  const { toast } = useToast();
  
  // Hydration fix: Track if component is mounted on client
  const [isMounted, setIsMounted] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const isEditMode = !!id; // Determine if we're in edit mode
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    startDate: "",
    clientId: "",
    client: "",
    clientType: "internal",
    approver: "",
    hourlyRate: "",
    overtimeRate: "",
    enableOvertime: false,
    overtimeMultiplier: 1.5,
    status: "active",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
    notes: ""});

  const [workOrder, setWorkOrder] = useState(null);
  const [workOrderPreview, setWorkOrderPreview] = useState("");
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState("");
  const [approvers, setApprovers] = useState([]);
  const [approversLoading, setApproversLoading] = useState(false);
  const [approversError, setApproversError] = useState("");

  // Hydration fix: Set mounted state on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch clients from API
  useEffect(() => {
    if (!isMounted) return;
    const fetchClients = async () => {
      if (!user?.tenantId) return;
      try {
        setClientsLoading(true);
        setClientsError("");
        console.log('🔍 Fetching clients from API...');
        console.log('🔍 API URL:', `${API_BASE}/api/clients?tenantId=${user.tenantId}`);
        
        const resp = await fetch(
          `${API_BASE}/api/clients?tenantId=${user.tenantId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`}}
        );
        
        console.log('📦 Response status:', resp.status);
        
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          console.error('❌ Failed to fetch clients:', err);
          throw new Error(
            err.details || err.error || `Failed to fetch clients (${resp.status})`
          );
        }
        const data = await resp.json();
        console.log('✅ Clients data received:', data);
        const list = data.clients || data || [];
        console.log('✅ Clients list:', list.length, 'clients');
        setClients(list);
      } catch (e) {
        console.error("❌ Failed to fetch clients:", e);
        setClientsError(e.message);
      } finally {
        setClientsLoading(false);
      }
    };
    fetchClients();
  }, [isMounted, user?.tenantId]);

  // Prefill from query params (clientId, clientName)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qpClientId = params.get("clientId");
    const qpClientName = params.get("clientName");
    if (qpClientId && clients.length > 0) {
      const found = clients.find((c) => String(c.id) === String(qpClientId));
      if (found) {
        setFormData((prev) => ({
          ...prev,
          clientId: String(found.id),
          client: found.clientName || found.name || "",
          clientType: found.clientType || prev.clientType}));
        return;
      }
    }
    if (qpClientName) {
      setFormData((prev) => ({ ...prev, client: qpClientName }));
    }
  }, [location.search, clients]);

  // Fetch existing employee data when in edit mode
  useEffect(() => {
    if (!isMounted) return;
    const fetchEmployee = async () => {
      if (!isEditMode || !id || !user?.tenantId) return;

      try {
        setEmployeeLoading(true);
        const response = await fetch(
          `${API_BASE}/api/employees/${id}?tenantId=${user.tenantId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json"}}
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch employee: ${response.status}`);
        }

        const data = await response.json();
        const employee = data.employee || data;

        // Populate form with existing employee data
        setFormData({
          firstName: employee.firstName || "",
          lastName: employee.lastName || "",
          email: employee.email || "",
          phone: employee.phone || "",
          position: employee.position || employee.title || "",
          department: employee.department || "",
          startDate: employee.startDate || employee.joinDate || "",
          clientId: employee.clientId || "",
          client: employee.client || "",
          clientType: employee.clientType || "internal",
          approver: employee.approver || "",
          hourlyRate: employee.hourlyRate || "",
          overtimeRate: employee.overtimeRate || "",
          enableOvertime: employee.enableOvertime || false,
          overtimeMultiplier: employee.overtimeMultiplier || 1.5,
          status: employee.status || "active",
          address: employee.address || "",
          city: employee.city || "",
          state: employee.state || "",
          zip: employee.zip || "",
          country: employee.country || "United States",
          notes: employee.notes || ""});
      } catch (error) {
        console.error("Error fetching employee:", error);
        // Could add toast notification here
      } finally {
        setEmployeeLoading(false);
      }
    };

    fetchEmployee();
  }, [isMounted, isEditMode, id, user?.tenantId]);

  // Fetch approvers (users with admin or approver role) from API
  useEffect(() => {
    if (!isMounted) return;
    const fetchApprovers = async () => {
      if (!user?.tenantId) return;
      try {
        setApproversLoading(true);
        setApproversError("");
        console.log('🔍 Fetching approvers from API...');
        console.log('🔍 API URL:', `${API_BASE}/api/users?tenantId=${user.tenantId}`);
        
        const resp = await fetch(
          `${API_BASE}/api/users?tenantId=${user.tenantId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`}}
        );
        
        console.log('📦 Response status:', resp.status);
        
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          console.error('❌ Failed to fetch approvers:', err);
          throw new Error(
            err.details || err.error || `Failed to fetch approvers (${resp.status})`
          );
        }
        const data = await resp.json();
        console.log('✅ Users data received:', data);
        
        // Filter users with admin or approver role
        const allUsers = data.users || data || [];
        const approverUsers = allUsers.filter(
          u => u.role === 'admin' || u.role === 'approver'
        );
        
        console.log('✅ Filtered approvers:', approverUsers.length, 'users');
        setApprovers(approverUsers);
      } catch (e) {
        console.error("❌ Failed to fetch approvers:", e);
        setApproversError(e.message);
      } finally {
        setApproversLoading(false);
      }
    };
    fetchApprovers();
  }, [isMounted, user?.tenantId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    let updates = { [name]: processedValue };

    // Auto-prefill country code when country is selected
    if (name === "country") {
      const countryCode = getCountryCode(value);
      // Only prefill if phone is empty or just has a country code
      if (!formData.phone || /^\+\d{0,3}$/.test(formData.phone)) {
        updates.phone = countryCode;
      }
    }

    // Format phone number as user types - E.164 only
    if (name === "phone") {
      const trimmed = String(value || '');
      // Only allow + followed by digits (E.164 format)
      if (trimmed.startsWith('+') || trimmed === '') {
        const digits = trimmed.replace(/\D/g, '').slice(0, 15);
        processedValue = digits ? `+${digits}` : (trimmed === '+' ? '+' : '');
      } else if (/^\d/.test(trimmed)) {
        // If user starts typing digits without +, prepend it
        const digits = trimmed.replace(/\D/g, '').slice(0, 15);
        processedValue = digits ? `+${digits}` : '';
      } else {
        processedValue = trimmed.startsWith('+') ? trimmed : '';
      }
      updates.phone = processedValue;
    }

    // Format zip code - only allow digits and limit to 5
    if (name === "zip") {
      processedValue = formatPostalInput(value, formData.country);
      updates.zip = processedValue;
    }

    setFormData({
      ...formData,
      ...updates});

    // Clear field-specific error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      if (!value) {
        setErrors((prev) => ({ ...prev, phone: "" }));
        return;
      }
      const validation = validatePhoneNumber(value);
      setErrors((prev) => ({
        ...prev,
        phone: validation.isValid ? "" : validation.message}));
    } else if (name === "zip") {
      if (!value) {
        setErrors((prev) => ({ ...prev, zip: "" }));
        return;
      }
      const validation = validateZipCode(value, formData.country);
      setErrors((prev) => ({
        ...prev,
        zip: validation.isValid ? "" : validation.message}));
    } else if (name === "email") {
      const validation = validateEmail(value);
      setErrors((prev) => ({
        ...prev,
        email: validation.isValid ? "" : validation.message}));
    } else if (name === "firstName") {
      const validation = validateName(value, "First Name");
      setErrors((prev) => ({
        ...prev,
        firstName: validation.isValid ? "" : validation.message}));
    } else if (name === "lastName") {
      const validation = validateName(value, "Last Name");
      setErrors((prev) => ({
        ...prev,
        lastName: validation.isValid ? "" : validation.message}));
    }
  };

  const handleClientChange = (e) => {
    const clientIdStr = e.target.value;
    const selectedClient = clients.find(
      (client) => String(client.id) === String(clientIdStr)
    );
    setFormData((prev) => ({
      ...prev,
      clientId: clientIdStr,
      client: selectedClient
        ? selectedClient.clientName || selectedClient.name || ""
        : "",
      clientType: selectedClient
        ? selectedClient.clientType || selectedClient.type || "internal"
        : "internal"}));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setWorkOrder(file);

      // Create a preview URL for the uploaded file
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setWorkOrderPreview(fileReader.result);
      };
      fileReader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form fields
    const phoneValidation = formData.phone
      ? validatePhoneNumber(formData.phone)
      : { isValid: true, message: 'Valid' };
    const zipValidation = formData.zip
      ? validateZipCode(formData.zip, formData.country)
      : { isValid: true, message: 'Valid' };
    const emailValidation = validateEmail(formData.email);
    const firstNameValidation = validateName(formData.firstName, "First Name");
    const lastNameValidation = validateName(formData.lastName, "Last Name");

    const newErrors = {};
    if (!phoneValidation.isValid) newErrors.phone = phoneValidation.message;
    if (!zipValidation.isValid) newErrors.zip = zipValidation.message;
    if (!emailValidation.isValid) newErrors.email = emailValidation.message;
    if (!firstNameValidation.isValid)
      newErrors.firstName = firstNameValidation.message;
    if (!lastNameValidation.isValid)
      newErrors.lastName = lastNameValidation.message;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    // Validation
    if (!formData.clientId) {
      toast.error("Please select a client");
      return;
    }

    if (!user?.tenantId) {
      toast.error("No tenant information available");
      return;
    }

    setLoading(true);

    try {
      // Calculate overtime rate if overtime is enabled
      let overtimeRate = null;
      if (formData.enableOvertime && formData.hourlyRate) {
        overtimeRate =
          parseFloat(formData.hourlyRate) *
          parseFloat(formData.overtimeMultiplier);
      }

      // Prepare employee data for backend
      const employeeData = {
        tenantId: user.tenantId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || null,
        title: formData.position,
        department: formData.department || null,
        startDate: formData.startDate,
        hourlyRate: formData.hourlyRate
          ? parseFloat(formData.hourlyRate)
          : null,
        salaryType:
          formData.clientType === "Subcontractor" ? "subcontractor" : "hourly",
        status: formData.status || "active",
        contactInfo: JSON.stringify({
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country}),
        // Additional fields
        overtimeRate: overtimeRate,
        enableOvertime: formData.enableOvertime || false,
        overtimeMultiplier: formData.overtimeMultiplier || 1.5,
        approver: formData.approver,
        notes: formData.notes,
        clientId: formData.clientId,
        role: 'employee' // Add default role
      };

      // Make API call to create employee
      const response = await apiFetch(
        `/api/employees`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"},
          body: JSON.stringify(employeeData)},
        { timeoutMs: 15000 }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.details ||
            errorData.error ||
            `Failed to create employee (${response.status})`
        );
      }

      await response.json(); // Consume the response

      toast.success("Employee created successfully!");

      // Navigate based on where we came from
      const params = new URLSearchParams(location.search);
      const qpClientId = params.get("clientId");
      if (qpClientId) {
        router.push(`/${subdomain}/clients/${qpClientId}`);
      } else {
        router.push(`/${subdomain}/employees`);
      }
    } catch (error) {
      console.error("Error creating employee:", error);
      toast.error(
        error.message || "Failed to create employee. Please try again."
      );
    } finally {
      setLoading(false);
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
   <PermissionGuard requiredPermission={PERMISSIONS.CREATE_EMPLOYEE}>
  <div className="nk-content min-h-screen bg-slate-50">
    <div className="container-fluid">
      {/* <div className="nk-content-inner">
      <div className="nk-content-body py-6"> */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-indigo-50 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                {isEditMode ? "Edit Employee" : "Add Employee"}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {isEditMode ? "Update employee details" : "Enter employee details"}
              </p>
            </div>
          </div>
        </div>

        {/* <div className="nk-block nk-block-lg"> */}
          <div className="card card-bordered rounded-2xl border-slate-200 shadow-sm">
            <div className="card-inner card-inner-lg">

            {employeeLoading ? (
              <div className="d-flex justify-content-center py-5">
                <div className="spinner-border text-primary" role="status" />
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
                      <div className="text-sm font-semibold text-slate-900">Personal Information</div>
                    </div>
                    <div className="p-4">
                      <div className="row g-4">
                        <div className="col-lg-6">
                          <div className="form-group">
                            <label className="form-label" htmlFor="firstName">
                              First Name
                            </label>
                            <input
                              type="text"
                              className="form-control rounded-lg border-slate-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                              id="firstName"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              placeholder="Enter first name"
                              required
                            />
                            {errors.firstName && (
                              <div className="mt-1">
                                <small className="text-danger">
                                  {errors.firstName}
                                </small>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="col-lg-6">
                          <div className="form-group">
                            <label className="form-label" htmlFor="lastName">
                              Last Name*
                            </label>
                            <input
                              type="text"
                              className="form-control rounded-lg border-slate-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                              id="lastName"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              placeholder="Enter last name"
                              required
                            />
                            {errors.lastName && (
                              <div className="mt-1">
                                <small className="text-danger">
                                  {errors.lastName}
                                </small>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="col-lg-6">
                          <div className="form-group">
                            <label className="form-label" htmlFor="email">
                              Email Address*
                            </label>
                            <input
                              type="email"
                              className="form-control rounded-lg border-slate-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                              id="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              placeholder="Enter email address"
                              required
                            />
                            {errors.email && (
                              <div className="mt-1">
                                <small className="text-danger">
                                  {errors.email}
                                </small>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="col-lg-6">
                          <div className="form-group">
                            <label className="form-label" htmlFor="phone">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              className="form-control rounded-lg border-slate-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                              id="phone"
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              placeholder="Enter phone number"
                              maxLength="14"
                            />
                            {errors.phone && (
                              <div className="mt-1">
                                <small className="text-danger">
                                  {errors.phone}
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
                      <div className="text-sm font-semibold text-slate-900">Job & Assignment Details</div>
                    </div>
                    <div className="p-4">
                      <div className="row g-4">
                        <div className="col-lg-6">
                          <div className="form-group">
                            <label className="form-label" htmlFor="position">
                              Position*
                            </label>
                            <input
                              type="text"
                              className="form-control rounded-lg border-slate-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                              id="position"
                              name="position"
                              value={formData.position}
                              onChange={handleChange}
                              placeholder="Enter position"
                              required
                            />
                          </div>
                        </div>

                        <div className="col-lg-6">
                          <div className="form-group">
                            <label className="form-label" htmlFor="department">
                              Department
                            </label>
                            <input
                              type="text"
                              className="form-control rounded-lg border-slate-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                              id="department"
                              name="department"
                              value={formData.department}
                              onChange={handleChange}
                              placeholder="Enter department"
                            />
                          </div>
                        </div>

                        <div className="col-lg-6">
                          <div className="form-group">
                            <label className="form-label" htmlFor="startDate">
                              Start Date*
                            </label>
                            <input
                              type="date"
                              className="form-control rounded-lg border-slate-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                              id="startDate"
                              name="startDate"
                              value={formData.startDate}
                              onChange={handleChange}
                              required
                            />
                          </div>
                        </div>

                        <div className="col-lg-6">
                          <div className="form-group">
                            <label className="form-label" htmlFor="status">
                              Status
                            </label>
                            <select
                              className="form-select rounded-lg border-slate-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                              id="status"
                              name="status"
                              value={formData.status}
                              onChange={handleChange}
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="onleave">On Leave</option>
                            </select>
                          </div>
                        </div>

                        {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && (
                          <div className="col-lg-12">
                            <div className="form-group mt-3">
                              <div className="custom-control custom-switch">
                                <input
                                  type="checkbox"
                                  className="custom-control-input"
                                  id="enableOvertime"
                                  name="enableOvertime"
                                  checked={formData.enableOvertime}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      enableOvertime: e.target.checked})
                                  }
                                />
                                <label
                                  className="custom-control-label"
                                  htmlFor="enableOvertime"
                                >
                                  Enable Overtime
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
                      <div className="text-sm font-semibold text-slate-900">Client & Approval Details</div>
                    </div>
                    <div className="p-4">
                      <div className="row g-4">
                        <div className="col-lg-6">
                          <div className="form-group">
                            <label className="form-label" htmlFor="clientId">
                              Assigned Client*
                            </label>
                            <select
                              className="form-select rounded-lg border-slate-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                              id="clientId"
                              name="clientId"
                              value={formData.clientId}
                              onChange={handleClientChange}
                              required
                            >
                              <option value="">Select Client</option>
                              {clients.map((client) => (
                                <option key={client.id} value={client.id}>
                                  {client.clientName || client.name}
                                  {client.clientType || client.type
                                    ? ` (${client.clientType || client.type})`
                                    : ""}
                                </option>
                              ))}
                            </select>
                            {clientsLoading && (
                              <div className="form-note mt-1">
                                <small className="text-soft">
                                  Loading clients…
                                </small>
                              </div>
                            )}
                            {clientsError && (
                              <div className="form-note mt-1">
                                <small className="text-danger">
                                  {clientsError}
                                </small>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="col-lg-6">
                          <div className="form-group">
                            <label className="form-label" htmlFor="clientType">
                              Client Type
                            </label>
                            <input
                              type="text"
                              className="form-control rounded-lg border-slate-300 bg-slate-100 text-slate-700 shadow-sm"
                              id="clientType"
                              name="clientType"
                              value={formData.clientType}
                              readOnly
                              placeholder="Auto-filled based on client selection"
                            />
                            <div className="form-note mt-1">
                              <small className="text-soft">
                                Automatically set based on selected client
                              </small>
                            </div>
                          </div>
                        </div>

                        <div className="col-lg-6">
                          <div className="form-group">
                            <label className="form-label" htmlFor="approver">
                              Assigned Approver*
                            </label>
                            <select
                              className="form-select rounded-lg border-slate-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                              id="approver"
                              name="approver"
                              value={formData.approver}
                              onChange={handleChange}
                              required
                            >
                              <option value="">Select Approver</option>
                              {approvers.map((approver) => (
                                <option key={approver.id} value={approver.id}>
                                  {approver.firstName} {approver.lastName} - {approver.department || approver.role}
                                </option>
                              ))}
                            </select>
                            {approversLoading && (
                              <div className="form-note mt-1">
                                <small className="text-soft">
                                  Loading approvers…
                                </small>
                              </div>
                            )}
                            {approversError && (
                              <div className="form-note mt-1">
                                <small className="text-danger">
                                  {approversError}
                                </small>
                              </div>
                            )}
                            <div className="form-note mt-1">
                              <small className="text-soft">
                                This person will approve/reject employee
                                timesheets
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && (
                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
                        <div className="text-sm font-semibold text-slate-900">Compensation (Admin Only)</div>
                      </div>
                      <div className="p-4">
                        <div className="row g-4">
                          <div className="col-lg-6">
                            <div className="form-group">
                              <label className="form-label" htmlFor="hourlyRate">
                                Hourly Rate ($)*
                              </label>
                              <input
                                type="number"
                                className="form-control rounded-lg border-slate-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                id="hourlyRate"
                                name="hourlyRate"
                                value={formData.hourlyRate}
                                onChange={handleChange}
                                placeholder="Enter hourly rate"
                                min="0"
                                step="0.01"
                                required
                              />
                              <small className="text-muted">
                                This information is only visible to administrators
                              </small>
                            </div>
                          </div>

                          {formData.enableOvertime && (
                            <div className="col-lg-6">
                              <div className="form-group">
                                <label
                                  className="form-label"
                                  htmlFor="overtimeMultiplier"
                                >
                                  Overtime Multiplier
                                </label>
                                <input
                                  type="number"
                                  className="form-control"
                                  id="overtimeMultiplier"
                                  name="overtimeMultiplier"
                                  value={formData.overtimeMultiplier}
                                  onChange={handleChange}
                                  placeholder="1.5"
                                  min="1"
                                  step="0.1"
                                />
                                <small className="text-muted">
                                  Standard rate × multiplier = overtime rate
                                </small>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                  {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && (
                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
                      <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
                        <div className="text-sm font-semibold text-slate-900">Work Order / SOW</div>
                      </div>
                      <div className="p-4">
                        <div className="row g-4">
                          <div className="col-lg-12">
                            <div className="form-group">
                              <label className="form-label">
                                Work Order / SOW{" "}
                                <span className="text-muted">(Optional)</span>
                              </label>
                              <div className="form-control-wrap">
                                <div className="custom-file">
                                  <input
                                    type="file"
                                    className="custom-file-input rounded-lg"
                                    id="workOrder"
                                    onChange={handleFileChange}
                                    accept=".pdf,.doc,.docx"
                                  />
                                  <label
                                    className="custom-file-label rounded-lg"
                                    htmlFor="workOrder"
                                  >
                                    {workOrder ? workOrder.name : "Choose file"}
                                  </label>
                                </div>
                              </div>
                              <small className="form-hint">
                                Upload the Statement of Work or Work Order
                                document
                              </small>

                              {workOrderPreview && (
                                <div className="document-preview mt-3">
                                  <div className="document-preview-header">
                                    <span className="document-name">
                                      {workOrder?.name}
                                    </span>
                                    <span className="document-size">
                                      {Math.round((workOrder?.size || 0) / 1024)}{" "}
                                      KB
                                    </span>
                                  </div>
                                  <div className="document-preview-content">
                                    {workOrder?.type.includes("image") ? (
                                      <img
                                        src={workOrderPreview}
                                        alt="Preview"
                                        className="preview-image"
                                      />
                                    ) : (
                                      <div className="document-icon">
                                        <i className="fas fa-file-pdf"></i>
                                        <span>
                                          Document uploaded successfully
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="col-lg-12">
                            <div className="form-group mt-3">
                              <label className="form-label">
                                SOW Approval Workflow
                              </label>
                              <select
                                className="form-select rounded-lg border-slate-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                id="approvalWorkflow"
                                name="approvalWorkflow"
                                value={formData.approvalWorkflow || "manual"}
                                onChange={handleChange}
                              >
                                <option value="auto">Auto-approve</option>
                                <option value="manual">Manual approval</option>
                                <option value="manager">Manager approval</option>
                                <option value="client">Client approval</option>
                              </select>
                              <small className="form-hint">
                                Select how work hours for this employee should be
                                approved
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
                      <div className="text-sm font-semibold text-slate-900">Address Information</div>
                    </div>
                    <div className="p-4">
                      <div className="row g-4">
                        <div className="col-lg-12">
                          <div className="form-group">
                            <label className="form-label" htmlFor="address">
                              Address
                            </label>
                            <input
                              type="text"
                              className="form-control rounded-lg border-slate-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                              id="address"
                              name="address"
                              value={formData.address}
                              onChange={handleChange}
                              placeholder="Enter street address"
                            />
                          </div>
                        </div>

                        <div className="col-lg-4">
                          <div className="form-group">
                            <label className="form-label" htmlFor="city">
                              City
                            </label>
                            <input
                              type="text"
                              className="form-control rounded-lg border-slate-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                              id="city"
                              name="city"
                              value={formData.city}
                              onChange={handleChange}
                              placeholder="Enter city"
                            />
                          </div>
                        </div>

                        <div className="col-lg-4">
                          <div className="form-group">
                            <label className="form-label" htmlFor="state">
                              State/Province
                            </label>
                            {STATES_BY_COUNTRY[formData.country] &&
                            STATES_BY_COUNTRY[formData.country].length > 0 ? (
                              <select
                                className="form-select rounded-lg border-slate-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                id="state"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                              >
                                <option value="">Select state</option>
                                {STATES_BY_COUNTRY[formData.country].map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                className="form-control rounded-lg border-slate-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                id="state"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                placeholder="Enter state"
                              />
                            )}
                          </div>
                        </div>

                        {formData.country !== 'United Arab Emirates' && (
                          <div className="col-lg-4">
                            <div className="form-group">
                              <label className="form-label" htmlFor="zip">
                                {getPostalLabel(formData.country)}
                              </label>
                              <input
                                type="text"
                                className="form-control rounded-lg border-slate-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                id="zip"
                                name="zip"
                                value={formData.zip}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder={getPostalPlaceholder(formData.country)}
                                maxLength={
                                  formData.country === 'United States'
                                    ? 10
                                    : formData.country === 'India'
                                      ? 6
                                      : formData.country === 'Canada'
                                        ? 7
                                        : formData.country === 'United Kingdom'
                                          ? 8
                                          : formData.country === 'Australia'
                                            ? 4
                                            : formData.country === 'Singapore'
                                              ? 6
                                              : formData.country === 'Germany'
                                                ? 5
                                                : 20
                                }
                              />
                              {errors.zip && (
                                <div className="mt-1">
                                  <small className="text-danger">
                                    {errors.zip}
                                  </small>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="col-lg-4">
                          <div className="form-group">
                            <label className="form-label" htmlFor="country">
                              Country
                            </label>
                            <select
                              className="form-select rounded-lg border-slate-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                              id="country"
                              name="country"
                              value={formData.country}
                              onChange={handleChange}
                            >
                              {COUNTRY_OPTIONS.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
                      <div className="text-sm font-semibold text-slate-900">Notes</div>
                    </div>
                    <div className="p-4">
                      <div className="row g-4">
                        <div className="col-lg-12">
                          <div className="form-group">
                            <label className="form-label" htmlFor="notes">
                              Notes
                            </label>
                            <textarea
                              className="form-control rounded-lg border-slate-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                              id="notes"
                              name="notes"
                              value={formData.notes}
                              onChange={handleChange}
                              placeholder="Enter any additional notes"
                              rows="4"
                            ></textarea>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="sticky bottom-0 z-10 mt-3 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur">
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <button
                        type="submit"
                        className="btn btn-primary btn-create-employee !bg-sky-600"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm mr-1"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            {isEditMode ? "Updating..." : "Creating..."}
                          </>
                        ) : isEditMode ? (
                          "Update Employee"
                        ) : (
                          "Create Employee"
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-light ml-3"
                        onClick={() => {
                          const params = new URLSearchParams(
                            location.search
                          );
                          const qpClientId = params.get("clientId");
                          if (qpClientId) {
                            router.push(`/${subdomain}/clients/${qpClientId}`);
                          } else {
                            router.push(`/${subdomain}/employees`);
                          }
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
                  </form>
                )}
            </div>
          </div>
        </div>
      {/* </div> */}
    {/* </div>
    </div> */}
  </div>
    </PermissionGuard>
  );
};

export default EmployeeForm;
