'use client';

import Link from 'next/link';
import { useRouter, useParams, usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { PERMISSIONS } from '@/utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { API_BASE, apiFetch } from '@/config/api';
import { decryptApiResponse } from '@/utils/encryption';
import {
  COUNTRY_OPTIONS,
  STATES_BY_COUNTRY,
  getPostalLabel,
  getPostalPlaceholder,
  getCountryCode,
  parsePhoneNumber
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
  const [validationTouched, setValidationTouched] = useState({});
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
    vendorId: "",
    implPartnerId: "",
    client: "",
    clientType: "internal",
    approver: "",
    hourlyRate: "",
    salaryAmount: "",
    salaryType: "hourly",
    overtimeRate: "",
    enableOvertime: false,
    overtimeMultiplier: 1,
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
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [implPartners, setImplPartners] = useState([]);
  const [implPartnersLoading, setImplPartnersLoading] = useState(false);
  const [approvers, setApprovers] = useState([]);
  const [approversLoading, setApproversLoading] = useState(false);
  const [approversError, setApproversError] = useState("");
  
  // UI-only state for separated country code and phone number
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");

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
          overtimeMultiplier: employee.overtimeMultiplier || 1,
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

  // UI-only: Split phone into country code and phone number when formData.phone changes
  // This only runs on initial load or when editing an existing employee
  useEffect(() => {
    if (!isMounted) return;
    
    // Only parse if we have a phone number
    if (formData.phone && formData.phone.length > 0) {
      // Use intelligent phone parsing that matches against known country codes
      const parsed = parsePhoneNumber(formData.phone, formData.country);
      setCountryCode(parsed.countryCode);
      setPhoneNumber(parsed.phoneNumber);
    }
  }, [isMounted, formData.phone, formData.country]);

  // Fetch vendors from API
  useEffect(() => {
    if (!isMounted) return;
    const fetchVendors = async () => {
      if (!user?.tenantId) return;
      try {
        setVendorsLoading(true);
        console.log('🔍 Fetching vendors from API...');
        
        const resp = await fetch(
          `${API_BASE}/api/vendors?tenantId=${user.tenantId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`}}
        );
        
        if (resp.ok) {
          const rawData = await resp.json();
          console.log('📦 Raw vendors response:', rawData);
          
          // Decrypt the response if encrypted
          const data = decryptApiResponse(rawData);
          console.log('🔓 Decrypted vendors data:', data);
          
          setVendors(data.vendors || []);
        }
      } catch (e) {
        console.error("❌ Failed to fetch vendors:", e);
      } finally {
        setVendorsLoading(false);
      }
    };
    fetchVendors();
  }, [isMounted, user?.tenantId]);

  // Fetch implementation partners from API
  useEffect(() => {
    if (!isMounted) return;
    const fetchImplPartners = async () => {
      if (!user?.tenantId) return;
      try {
        setImplPartnersLoading(true);
        console.log('🔍 Fetching implementation partners from API...');
        
        const resp = await fetch(
          `${API_BASE}/api/implementation-partners?tenantId=${user.tenantId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`}}
        );
        
        if (resp.ok) {
          const data = await resp.json();
          console.log('✅ Implementation partners data received:', data);
          setImplPartners(data.implementationPartners || []);
        }
      } catch (e) {
        console.error("❌ Failed to fetch implementation partners:", e);
      } finally {
        setImplPartnersLoading(false);
      }
    };
    fetchImplPartners();
  }, [isMounted, user?.tenantId]);

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

  // Get expected phone number length for a country
  const getPhoneNumberLength = (country) => {
    const lengthMap = {
      'United States': 10,
      'Canada': 10,
      'United Kingdom': 10,
      'India': 10,
      'Australia': 9,
      'Germany': 10,
      'France': 9,
      'Japan': 10,
      'China': 11,
      'Brazil': 11,
      'Mexico': 10,
      'South Africa': 9,
      'United Arab Emirates': 9,
      'Singapore': 8,
      'Italy': 10,
      'Spain': 9,
      'Russia': 10
    };
    return lengthMap[country] || 10;
  };
// --- ADD THIS AT THE TOP OF YOUR COMPONENT ---
const [dialCodes, setDialCodes] = useState([]);

useEffect(() => {
  const fetchCountryCodes = async () => {
    try {
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,idd,cca2');
      const data = await response.json();

      const formattedCodes = data
        .filter((c) => c.idd?.root) // Filter valid codes
        .map((c) => {
          const root = c.idd.root;
          const suffix = c.idd.suffixes?.[0] || "";
          return {
            label: `${c.cca2} (${root}${suffix})`, // e.g., "US (+1)"
            code: `${root}${suffix}`,              // e.g., "+1"
            name: c.name.common
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

      setDialCodes(formattedCodes);
    } catch (error) {
      console.error("Error fetching codes:", error);
      // Fallback if API fails
      setDialCodes([
        { label: "US (+1)", code: "+1" }, 
        { label: "IN (+91)", code: "+91" }
      ]);
    }
  };

  fetchCountryCodes();
}, []);
  // UI-only: Handle phone number input change
  const handlePhoneNumberChange = (e) => {
    const value = e.target.value;
    // Only allow digits with country-specific max length
    const maxLength = getPhoneNumberLength(formData.country);
    const digitsOnly = value.replace(/\D/g, '').slice(0, maxLength);
    setPhoneNumber(digitsOnly);
    // Combine with country code and update formData.phone
    const combinedPhone = digitsOnly ? `${countryCode}${digitsOnly}` : countryCode;
    setFormData(prev => ({ ...prev, phone: combinedPhone }));
    // Clear phone validation errors
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: "" }));
    }
  };

  // UI-only: Handle phone blur for validation
  const handlePhoneBlur = () => {
    // Mark field as touched
    setValidationTouched((prev) => ({ ...prev, phone: true }));
    
    // Allow empty (optional field)
    if (!phoneNumber || phoneNumber.trim() === '') {
      setErrors((prev) => ({ ...prev, phone: "" }));
      return;
    }
    
    // Build combined phone for validation
    const combinedPhone = `${countryCode}${phoneNumber}`;
    
    // Use the validation utility which handles all country-specific rules
    const validation = validatePhoneNumber(combinedPhone, formData.country);
    setErrors((prev) => ({
      ...prev,
      phone: validation.isValid ? "" : validation.message
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    let updates = { [name]: processedValue };

    // Auto-update country code when country is selected
    if (name === "country") {
      const newCountryCode = getCountryCode(value);
      setCountryCode(newCountryCode);
      // Keep existing phone number, just update country code
      const combinedPhone = phoneNumber ? `${newCountryCode}${phoneNumber}` : newCountryCode;
      updates.phone = combinedPhone;
      // Clear validation errors when country changes
      setErrors((prev) => ({ ...prev, phone: "" }));
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

    // Restrict hourly rate to 3 digits maximum (0-999)
    if (name === "hourlyRate") {
      const numValue = parseFloat(value);
      // Allow empty value or values up to 999
      if (value === "" || (numValue >= 0 && numValue <= 999)) {
        processedValue = value;
      } else if (numValue > 999) {
        // If user tries to enter more than 999, cap it at 999
        processedValue = "999";
      } else {
        // Keep the previous value if invalid
        processedValue = formData.hourlyRate;
      }
      updates.hourlyRate = processedValue;
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
      // Phone validation handled by handlePhoneBlur
      return;
    } else if (name === "zip") {
      setValidationTouched((prev) => ({ ...prev, zip: true }));
      if (!value) {
        setErrors((prev) => ({ ...prev, zip: "" }));
        return;
      }
      const validation = validateZipCode(value, formData.country);
      setErrors((prev) => ({
        ...prev,
        zip: validation.isValid ? "" : validation.message}));
    } else if (name === "email") {
      setValidationTouched((prev) => ({ ...prev, email: true }));
      const validation = validateEmail(value);
      setErrors((prev) => ({
        ...prev,
        email: validation.isValid ? "" : validation.message}));
    } else if (name === "firstName") {
      setValidationTouched((prev) => ({ ...prev, firstName: true }));
      const validation = validateName(value, "First Name");
      setErrors((prev) => ({
        ...prev,
        firstName: validation.isValid ? "" : validation.message}));
    } else if (name === "lastName") {
      setValidationTouched((prev) => ({ ...prev, lastName: true }));
      const validation = validateName(value, "Last Name");
      setErrors((prev) => ({
        ...prev,
        lastName: validation.isValid ? "" : validation.message}));
    } else if (name === "hourlyRate") {
      setValidationTouched((prev) => ({ ...prev, hourlyRate: true }));
      if (!value) {
        setErrors((prev) => ({ ...prev, hourlyRate: "" }));
        return;
      }
      const rate = parseFloat(value);
      if (isNaN(rate)) {
        setErrors((prev) => ({
          ...prev,
          hourlyRate: "Please enter a valid hourly rate"
        }));
      } else if (rate < 0) {
        setErrors((prev) => ({
          ...prev,
          hourlyRate: "Hourly rate cannot be negative"
        }));
      } else if (rate > 999) {
        setErrors((prev) => ({
          ...prev,
          hourlyRate: "Hourly rate cannot exceed 3 digits (max $999)"
        }));
      } else {
        setErrors((prev) => ({ ...prev, hourlyRate: "" }));
      }
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

    // Mark all fields as touched on submit
    setValidationTouched({
      phone: true,
      zip: true,
      email: true,
      firstName: true,
      lastName: true,
      hourlyRate: true
    });

    // Validate form fields - only validate phone if it has a value beyond country code
    const phoneValidation = (formData.phone && formData.phone !== countryCode)
      ? validatePhoneNumber(formData.phone, formData.country)
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
    
    // Validate hourly rate (UI-level validation)
    if (formData.hourlyRate) {
      const rate = parseFloat(formData.hourlyRate);
      if (isNaN(rate)) {
        newErrors.hourlyRate = "Please enter a valid hourly rate";
      } else if (rate < 0) {
        newErrors.hourlyRate = "Hourly rate cannot be negative";
      } else if (rate > 999) {
        newErrors.hourlyRate = "Hourly rate cannot exceed 3 digits (max $999)";
      }
    }

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
      // Prepare employee data for backend
      // Note: Only include fields that exist in the database schema
      const employeeData = {
        tenantId: user.tenantId,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone || null,
        title: formData.position || null,
        department: formData.department || null,
        startDate: formData.startDate || null,
        endDate: null,
        // clientId, vendorId, implPartnerId removed - not in database schema
        hourlyRate: formData.hourlyRate
          ? parseFloat(formData.hourlyRate)
          : null,
        salaryAmount: formData.salaryAmount
          ? parseFloat(formData.salaryAmount)
          : null,
        salaryType: formData.salaryType || "hourly",
        status: formData.status || "active",
        contactInfo: JSON.stringify({
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country}),
        role: 'employee' // Add default role
      };
      
      console.log('📤 Sending employee data:', employeeData);

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
        const rawError = await response.json().catch(() => ({}));
        const errorData = decryptApiResponse(rawError);
        console.error('❌ Employee creation failed:', errorData);
        throw new Error(
          errorData.details ||
            errorData.error ||
            `Failed to create employee (${response.status})`
        );
      }

      const rawData = await response.json();
      const data = decryptApiResponse(rawData);
      console.log('✅ Employee created:', data);

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
  <div className="min-h-screen bg-slate-50 p-4 md:p-8">
    <div className="mx-auto max-w-8xl">
      
      {/* Header */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-indigo-50 p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isEditMode ? "Edit Employee" : "Add Employee"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {isEditMode ? "Update the employee's information below." : "Fill in the details to onboard a new employee."}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        {employeeLoading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            
            {/* Master Grid */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              
              {/* --- SECTION 1: Personal Information --- */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-800">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-600">1</span>
                    Personal Information
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
                    
                    {/* First Name */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">First Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="e.g. John"
                        required
                      />
                      {validationTouched.firstName && errors.firstName && (
                        <p className="mt-1.5 text-xs font-medium text-red-500">{errors.firstName}</p>
                      )}
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Last Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="e.g. Doe"
                        required
                      />
                      {validationTouched.lastName && errors.lastName && (
                        <p className="mt-1.5 text-xs font-medium text-red-500">{errors.lastName}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Email <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                        </div>
                        <input
                          type="email"
                          className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 pl-10 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="john.doe@company.com"
                          required
                        />
                      </div>
                      {validationTouched.email && errors.email && (
                        <p className="mt-1.5 text-xs font-medium text-red-500">{errors.email}</p>
                      )}
                    </div>

                    {/* Phone Number */}
                   {/* Phone Number */}
<div className="md:col-span-2">
  <label className="mb-2 block text-sm font-semibold text-slate-700">Phone <span className="text-red-500">*</span></label>
  <div className="flex gap-3">
    
    {/* Country Code Dropdown */}
    <div className="relative w-[140px]">
      <select
        className="block w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 p-2.5 pr-8 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 truncate"
        value={countryCode}
        onChange={(e) => setCountryCode(e.target.value)}
      >
        {dialCodes.length === 0 && <option value="">Loading...</option>}
        {dialCodes.map((item) => (
          <option key={`${item.name}-${item.code}`} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
      
      {/* Custom Dropdown Arrow */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
    </div>

    {/* Phone Input */}
    <input
      type="tel"
      className="block flex-1 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
      id="phoneNumber"
      value={phoneNumber}
      onChange={handlePhoneNumberChange}
      onBlur={handlePhoneBlur}
      placeholder="e.g. 9876543210"
      maxLength="15"
    />
  </div>
  
  {validationTouched.phone && errors.phone && (
    <p className="mt-1.5 text-xs font-medium text-red-500">{errors.phone}</p>
  )}
</div>

                    {/* Address */}
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Residential Address <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Street address, Apt, Suite"
                      />
                    </div>

                    {/* City */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">City <span className="text-red-500">*</span></label>
                        <input
                        type="text"
                        className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="City"
                        />
                    </div>

                    {/* State */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">State/Province</label>
                        {STATES_BY_COUNTRY[formData.country] && STATES_BY_COUNTRY[formData.country].length > 0 ? (
                        <select
                            className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                        >
                            <option value="">Select state</option>
                            {STATES_BY_COUNTRY[formData.country].map((st) => (
                            <option key={st} value={st}>{st}</option>
                            ))}
                        </select>
                        ) : (
                        <input
                            type="text"
                            className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            placeholder="State"
                        />
                        )}
                    </div>

                    {/* Zip */}
                    {formData.country !== 'United Arab Emirates' && (
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">{getPostalLabel(formData.country)} <span className="text-red-500">*</span></label>
                            <input
                            type="text"
                            className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                            name="zip"
                            value={formData.zip}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder={getPostalPlaceholder(formData.country)}
                            maxLength={20}
                            />
                            {errors.zip && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.zip}</p>}
                        </div>
                    )}
                    
                      {/* Country */}
                      <div className={formData.country === 'United Arab Emirates' ? "md:col-span-2" : ""}>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Country</label>
                        <select
                            className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                        >
                            {COUNTRY_OPTIONS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                  </div>
                </div>
              </section>

              {/* --- SECTION 2: Job Details --- */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-800">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-600">2</span>
                    Job & Assignment
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
                    
                    {/* Position */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Position <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        placeholder="e.g. Senior Consultant"
                        required
                      />
                    </div>

                    {/* Department */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Department</label>
                      <input
                        type="text"
                        className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        placeholder="e.g. Engineering"
                      />
                    </div>

                    {/* Start Date */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Start Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Status</label>
                      <div className="relative">
                        <select
                            className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 appearance-none"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="onleave">On Leave</option>
                        </select>
                         {/* Custom Arrow because appearance-none removes it */}
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>

                    {/* Overtime Checkbox */}
                    {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && (
                      <div className="md:col-span-2 mt-1">
                        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50">
                          <div className="flex h-5 items-center">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                id="enableOvertime"
                                name="enableOvertime"
                                checked={formData.enableOvertime}
                                onChange={(e) => setFormData({ ...formData, enableOvertime: e.target.checked })}
                            />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-900">Enable Overtime</span>
                            <p className="text-xs text-slate-500">Allow this employee to log overtime hours</p>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* --- SECTION 3: Client Details --- */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-800">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-600">3</span>
                    Client & Approval
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
                    
                    {/* Client */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Assigned Client <span className="text-red-500">*</span></label>
                      <select
                        className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                        name="clientId"
                        value={formData.clientId}
                        onChange={handleClientChange}
                        required
                      >
                        <option value="">Select Client</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.clientName || client.name}
                            {client.clientType || client.type ? ` (${client.clientType || client.type})` : ""}
                          </option>
                        ))}
                      </select>
                      {clientsLoading && <p className="mt-1.5 text-xs text-slate-500">Loading clients...</p>}
                      {clientsError && <p className="mt-1.5 text-xs text-red-600">{clientsError}</p>}
                    </div>

                    {/* Client Type */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Client Type</label>
                      <input
                        type="text"
                        className="block w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 p-2.5 text-sm text-slate-500 shadow-sm"
                        value={formData.clientType}
                        readOnly
                        placeholder="Auto-filled"
                      />
                    </div>

                    {/* Vendor */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Vendor</label>
                      <select
                        className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                        name="vendorId"
                        value={formData.vendorId}
                        onChange={handleChange}
                      >
                        <option value="">-- Unassigned --</option>
                        {vendors.map((vendor) => (
                          <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                        ))}
                      </select>
                      {vendorsLoading && <p className="mt-1.5 text-xs text-slate-500">Loading vendors...</p>}
                    </div>

                    {/* Implementation Partner */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Implementation Partner</label>
                      <select
                        className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                        name="implPartnerId"
                        value={formData.implPartnerId}
                        onChange={handleChange}
                      >
                        <option value="">-- Unassigned --</option>
                        {implPartners.map((partner) => (
                          <option key={partner.id} value={partner.id}>{partner.name}</option>
                        ))}
                      </select>
                      {implPartnersLoading && <p className="mt-1.5 text-xs text-slate-500">Loading partners...</p>}
                    </div>

                    {/* Approver */}
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Assigned Approver <span className="text-red-500">*</span></label>
                      <select
                        className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
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
                      {approversLoading && <p className="mt-1.5 text-xs text-slate-500">Loading approvers...</p>}
                      {approversError && <p className="mt-1.5 text-xs text-red-600">{approversError}</p>}
                    </div>
                  </div>
                </div>
              </section>

              {/* --- SECTION 4: Compensation (Admin Only) --- */}
              {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && (
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                  <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-800">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100 text-xs text-yellow-700">4</span>
                      Compensation
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Hourly Rate ($) <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-slate-500">$</span>
                          </div>
                          <input
                            type="number"
                            className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 pl-8 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                            name="hourlyRate"
                            value={formData.hourlyRate}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="0.00"
                            min="0"
                            max="999"
                            step="0.01"
                            required
                          />
                        </div>
                        {errors.hourlyRate && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.hourlyRate}</p>}
                      </div>

                      {formData.enableOvertime && (
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-700">Overtime Multiplier</label>
                          <input
                            type="number"
                            className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                            name="overtimeMultiplier"
                            value={formData.overtimeMultiplier}
                            onChange={handleChange}
                            placeholder="1.5"
                            min="1"
                            step="0.1"
                          />
                          <p className="mt-1.5 text-xs text-slate-500">Usually 1.5x or 2.0x</p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* --- SECTION 5: Work Order / SOW --- */}
              {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && (
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md lg:col-span-2">
                  <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-800">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-600">5</span>
                      Documents
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 gap-6">
                      {/* File Upload */}
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Work Order / SOW (Optional)</label>
                        
                        {/* Styled Upload Area */}
                        <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 transition-all hover:border-indigo-400 hover:bg-slate-100">
                            <div className="flex flex-col items-center justify-center text-center">
                                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                                   <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                </div>
                                <p className="mb-1 text-sm text-slate-700">
                                    <span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-slate-500">PDF, DOC or DOCX (MAX. 10MB)</p>
                            </div>
                            <input 
                                id="workOrder" 
                                type="file" 
                                className="hidden" 
                                onChange={handleFileChange} 
                                accept=".pdf,.doc,.docx"
                            />
                        </label>

                        {/* File Preview Card */}
                        {workOrder ? (
                            <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                                <div className="flex items-center gap-3">
                                    {workOrder.type.includes("image") || workOrderPreview ? (
                                        <img src={workOrderPreview || ""} alt="Preview" className="h-10 w-10 rounded-md object-cover" />
                                    ) : (
                                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-red-50 text-red-500">
                                            <i className="fas fa-file-pdf text-lg"></i>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{workOrder.name}</p>
                                        <p className="text-xs text-slate-500">{Math.round((workOrder.size || 0) / 1024)} KB</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => {/* Logic to clear if needed */}} className="text-slate-400 hover:text-red-500">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ) : null}
                      </div>

                      {/* Approval Workflow */}
                      <div className="max-w-md">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Approval Workflow</label>
                        <select
                          className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                          name="approvalWorkflow"
                          value={formData.approvalWorkflow || "manual"}
                          onChange={handleChange}
                        >
                          <option value="auto">Auto-approve (No intervention)</option>
                          <option value="manual">Manual (Admin approves)</option>
                          <option value="manager">Manager (Reporting Mgr approves)</option>
                          <option value="client">Client (Client Email approves)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* --- SECTION 6: Notes --- */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md lg:col-span-2">
                <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                  <div className="text-sm font-semibold uppercase tracking-wider text-slate-800">Additional Notes</div>
                </div>
                <div className="p-6">
                  <textarea
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Enter any additional information about this employee..."
                    rows="4"
                  ></textarea>
                </div>
              </section>

            </div>

            {/* --- FOOTER ACTIONS --- */}
            <div className="mt-10 flex items-center justify-end gap-4 border-t border-slate-200 pt-8">
                <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
                onClick={() => {
                    const params = new URLSearchParams(location.search);
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
                <button
                type="submit"
                className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-50 disabled:shadow-none"
                disabled={loading}
                >
                {loading ? (
                    <>
                    <svg className="-ml-1 mr-2 h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    {isEditMode ? "Updating..." : "Creating..."}
                    </>
                ) : isEditMode ? (
                    "Update Employee"
                ) : (
                    "Add Employee"
                )}
                </button>
            </div>

          </form>
        )}
      </div>
    </div>
  </div>
</PermissionGuard>
  );
};

export default EmployeeForm;
