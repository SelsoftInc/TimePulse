'use client';

import { useRouter, useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { API_BASE } from '@/config/api';
import {
  COUNTRY_OPTIONS,
  STATES_BY_COUNTRY,
  PAYMENT_TERMS_OPTIONS,
  fetchPaymentTerms,
  getPostalLabel,
  getPostalPlaceholder,
  validateCountryTaxId,
  getCountryCode,
  getTaxIdLabel,
  getTaxIdPlaceholder,
  parsePhoneNumber} from '../../config/lookups';
import { PERMISSIONS } from '@/utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
  validatePhoneNumber,
  validateZipCode,
  validateEmail,
  validateName,
  formatPostalInput} from '@/utils/validations';
import "./Vendors.css";

const VendorForm = ({
  mode = "create",
  initialData = null,
  onSubmitOverride = null,
  submitLabel = null}) => {
  const router = useRouter();
  const { subdomain } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

  // Hydration fix: Track if component is mounted on client
  const [isMounted, setIsMounted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [validationTouched, setValidationTouched] = useState({});
  const [paymentTermsOptions, setPaymentTermsOptions] = useState(
    PAYMENT_TERMS_OPTIONS
  );
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
    taxId: "", // not sent to backend currently
    vendorType: "consultant", // mapped to category
    paymentTerms: "net30",
    status: "active",
    notes: ""});

  const [contractFile, setContractFile] = useState(null);
  const [contractPreview, setContractPreview] = useState("");
  
  // UI-only state for separated country code and phone number
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Hydration fix: Set mounted state on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      // Reset state when country changes
      updates.state = "";
      // Clear validation errors when country changes
      setErrors((prev) => ({ ...prev, phone: "" }));
    }

    // Format phone number as user types - E.164 only (kept for backward compatibility)
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
      // Phone validation handled by handlePhoneBlur
      return;
    } else if (name === "zip") {
      setValidationTouched((prev) => ({ ...prev, zip: true }));
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
    } else if (name === "name") {
      setValidationTouched((prev) => ({ ...prev, name: true }));
      const validation = validateName(value, "Vendor Name");
      setErrors((prev) => ({
        ...prev,
        name: validation.isValid ? "" : validation.message}));
    } else if (name === "contactPerson") {
      setValidationTouched((prev) => ({ ...prev, contactPerson: true }));
      const validation = validateName(value, "Contact Person", { requireAtLeastTwoWords: true });
      setErrors((prev) => ({
        ...prev,
        contactPerson: validation.isValid ? "" : validation.message}));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setContractFile(file);

      // Create a preview URL for the uploaded file
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setContractPreview(fileReader.result);
      };
      fileReader.readAsDataURL(file);
    }
  };

  // Load payment terms from API
  useEffect(() => {
    const loadPaymentTerms = async () => {
      const terms = await fetchPaymentTerms();
      setPaymentTermsOptions(terms);
    };
    loadPaymentTerms();
  }, []);

  // Prefill when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        contactPerson: initialData.contactPerson || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
        city: initialData.city || "",
        state: initialData.state || "",
        zip: initialData.zip || "",
        country: initialData.country || "United States",
        taxId: "",
        vendorType: initialData.category || "consultant",
        paymentTerms: initialData.paymentTerms || "net30",
        status: initialData.status || "active",
        notes: initialData.notes || ""});
    }
  }, [initialData]);

  // UI-only: Split phone into country code and phone number when formData.phone changes
  // This only runs on initial load or when editing an existing vendor
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched on submit
    setValidationTouched({
      phone: true,
      zip: true,
      email: true,
      name: true,
      contactPerson: true
    });

    // Validate form fields - only validate phone if it has a value beyond country code
    const phoneValidation = (formData.phone && formData.phone !== countryCode)
      ? validatePhoneNumber(formData.phone, formData.country)
      : { isValid: true, message: 'Valid' };
    const zipValidation = formData.zip
      ? validateZipCode(formData.zip, formData.country)
      : { isValid: true, message: 'Valid' };
    const emailValidation = validateEmail(formData.email);
    const nameValidation = validateName(formData.name, "Vendor Name");
    const contactValidation = validateName(
      formData.contactPerson,
      "Contact Person",
      { requireAtLeastTwoWords: true }
    );

    const newErrors = {};
    if (!phoneValidation.isValid) newErrors.phone = phoneValidation.message;
    if (!zipValidation.isValid) newErrors.zip = zipValidation.message;
    if (!emailValidation.isValid) newErrors.email = emailValidation.message;
    if (!nameValidation.isValid) newErrors.name = nameValidation.message;
    if (!contactValidation.isValid)
      newErrors.contactPerson = contactValidation.message;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const errorFields = Object.keys(newErrors).map(field => {
        const fieldNames = {
          name: 'Vendor Name',
          contactPerson: 'Contact Person',
          email: 'Email',
          phone: 'Phone',
          zip: 'Postal Code'
        };
        return fieldNames[field] || field;
      }).join(', ');
      toast.error(`Please fix errors in: ${errorFields}`);
      
      // Scroll to first error field
      const firstErrorField = Object.keys(newErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }

    try {
      setError("");
      setLoading(true);
      // Country-specific tax id validation (optional)
      if (formData.taxId) {
        const taxErr = validateCountryTaxId(formData.country, formData.taxId);
        if (taxErr) {
          setError(taxErr);
          toast.error(taxErr);
          setLoading(false);
          return;
        }
      }
      if (!user?.tenantId) {
        setError("No tenant information available");
        setLoading(false);
        return;
      }

      if (onSubmitOverride) {
        // Build payload for edit mode
        const payload = {
          tenantId: user.tenantId,
          name: formData.name.trim(),
          contactPerson: formData.contactPerson.trim() || null,
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          category: formData.vendorType || null,
          status: formData.status || "active",
          address: formData.address.trim() || null,
          city: formData.city.trim() || null,
          state: formData.state.trim() || null,
          zip: formData.zip.trim() || null,
          country: formData.country.trim() || null,
          website: initialData?.website ?? null,
          paymentTerms: formData.paymentTerms || null,
          contractStart: initialData?.contractStart ?? null,
          contractEnd: initialData?.contractEnd ?? null,
          notes: formData.notes || null};
        await onSubmitOverride(payload);
        toast.success("Vendor updated");
        return;
      }

      // Build payload matching backend Vendor model
      const payload = {
        tenantId: user.tenantId,
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        category: formData.vendorType || null,
        status: formData.status || "active",
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        zip: formData.zip.trim() || null,
        country: formData.country.trim() || null,
        website: null,
        paymentTerms: formData.paymentTerms || null,
        contractStart: null,
        contractEnd: null,
        notes: formData.notes || null};

      const resp = await fetch(`${API_BASE}/api/vendors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`},
        body: JSON.stringify(payload)});
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(
          err.details
            ? JSON.stringify(err.details)
            : `Create failed with status ${resp.status}`
        );
      }
      toast.success("Vendor created");
      router.push(`/${subdomain}/vendors`);
    } catch (err) {
      console.error("Create vendor failed:", err);
      setError(err.message || "Failed to create vendor");
      toast.error(err.message || "Failed to save vendor");
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
    <PermissionGuard requiredPermission={PERMISSIONS.CREATE_VENDOR}>
  <div className="min-h-screen bg-slate-50 p-4 md:p-8">
    <div className="mx-auto max-w-8xl">
      
      {/* ================= HEADER ================= */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-indigo-50 p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {mode === "edit" ? "Edit Vendor" : "Add New Vendor"}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {mode === "edit" ? "Update vendor details and settings" : "Create a new vendor record"}
            </p>
          </div>
        </div>
      </div>

      {/* ================= MAIN FORM ================= */}
      <div className="relative">
        <form onSubmit={handleSubmit}>
          
          {/* Error Alert */}
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
              <i className="fas fa-exclamation-triangle text-xl"></i>
              <div className="flex-1 text-sm font-medium">{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

            {/* ================= LEFT COLUMN ================= */}
            <div className="space-y-8">

              {/* VENDOR INFORMATION CARD */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <header className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-800">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-600">1</span>
                    Vendor Information
                  </div>
                </header>

                <div className="p-6 grid grid-cols-1 gap-6">
                  {/* Name */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Vendor Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="e.g. Acme Supplies"
                      className={`block w-full rounded-lg border p-2.5 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                        errors.name 
                          ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500/10' 
                          : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/10'
                      }`}
                    />
                    {validationTouched.name && errors.name && (
                      <p className="mt-1.5 text-xs font-medium text-red-500">{errors.name}</p>
                    )}
                  </div>

                  {/* Contact Person */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Vendor SPOC <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="e.g. John Doe"
                      className={`block w-full rounded-lg border p-2.5 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                        errors.contactPerson 
                          ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500/10' 
                          : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/10'
                      }`}
                    />
                    {validationTouched.contactPerson && errors.contactPerson && (
                      <p className="mt-1.5 text-xs font-medium text-red-500">{errors.contactPerson}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="vendor@example.com"
                        className={`block w-full rounded-lg border p-2.5 pl-10 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                          errors.email 
                            ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500/10' 
                            : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/10'
                        }`}
                      />
                    </div>
                    {validationTouched.email && errors.email && (
                      <p className="mt-1.5 text-xs font-medium text-red-500">{errors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        className="w-[80px] min-w-[80px] shrink-0 rounded-lg border border-slate-200 bg-slate-100 p-2.5 text-center text-sm font-bold text-slate-600 shadow-sm cursor-not-allowed"
                        value={countryCode}
                        readOnly
                        maxLength="4"
                        title="Country code (auto-filled based on selected country)"
                      />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={handlePhoneNumberChange}
                        onBlur={handlePhoneBlur}
                        placeholder="Enter phone number"
                        maxLength="15"
                        className={`block flex-1 rounded-lg border p-2.5 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                          errors.phone 
                            ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500/10' 
                            : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/10'
                        }`}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      Country code updates automatically based on selected country
                    </p>
                    {validationTouched.phone && errors.phone && (
                      <p className="mt-1.5 text-xs font-medium text-red-500">{errors.phone}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Vendor Type */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Vendor Type <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select
                          name="vendorType"
                          value={formData.vendorType}
                          onChange={handleChange}
                          className="block w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                        >
                          <option value="consultant">Consultant</option>
                          <option value="contractor">Contractor</option>
                          <option value="supplier">Supplier</option>
                          <option value="service">Service Provider</option>
                          <option value="other">Other</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Status</label>
                      <div className="relative">
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          className="block w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                        >
                          <option value="active">Active</option>
                          <option value="pending">Pending Approval</option>
                          <option value="inactive">Inactive</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* TAX & PAYMENT CARD */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <header className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-800">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-600">3</span>
                    Tax & Payment
                  </div>
                </header>
                <div className="p-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      {getTaxIdLabel(formData.country)}
                    </label>
                    <input
                      name="taxId"
                      value={formData.taxId}
                      onChange={handleChange}
                      placeholder={getTaxIdPlaceholder(formData.country)}
                      className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Payment Terms <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="paymentTerms"
                        value={formData.paymentTerms}
                        onChange={handleChange}
                        className="block w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                      >
                        {paymentTermsOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
               {/* NOTES */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <header className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                  <div className="text-sm font-semibold uppercase tracking-wider text-slate-800">Additional Notes</div>
                </header>
                <div className="p-6">
                  <textarea
                    rows={4}
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Enter any additional notes..."
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </section>
            </div>

            {/* ================= RIGHT COLUMN ================= */}
            <div className="space-y-8">

              {/* ADDRESS INFORMATION CARD */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <header className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-800">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-600">2</span>
                    Address Information
                  </div>
                </header>

                <div className="p-6 space-y-6">
                  {/* Address */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Address</label>
                    <input
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Street address"
                      className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">City</label>
                      <input
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="City"
                        className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">State</label>
                      <input
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="State"
                        className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                      />
                    </div>

                    {/* Zip - Conditional */}
                    {formData.country !== "United Arab Emirates" && (
                      <div className="sm:col-span-2">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          {getPostalLabel(formData.country)}
                        </label>
                        <input
                          type="text"
                          name="zip"
                          value={formData.zip}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder={getPostalPlaceholder(formData.country)}
                          className={`block w-full rounded-lg border p-2.5 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                            errors.zip 
                              ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500/10' 
                              : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/10'
                          }`}
                        />
                        {validationTouched.zip && errors.zip && (
                          <p className="mt-1.5 text-xs font-medium text-red-500">{errors.zip}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Country */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        required
                        className="block w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                        style={{ color: '#0f172a', backgroundColor: '#f8fafc' }}
                      >
                        {COUNTRY_OPTIONS.map((country) => (
                          <option key={country} value={country} style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>
                            {country}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      Changing country will update the phone number country code
                    </p>
                  </div>
                </div>
              </section>

              {/* CONTRACT UPLOAD */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <header className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-800">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs text-slate-600">
                      <i className="fas fa-file-contract text-[10px]"></i>
                    </span>
                    Contract / Agreement
                  </div>
                </header>
                <div className="p-6">
                  <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 transition-all hover:border-indigo-400 hover:bg-slate-100">
                      <div className="flex flex-col items-center justify-center text-center">
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                              <i className="fas fa-cloud-upload-alt text-lg"></i>
                          </div>
                          <p className="mb-1 text-sm text-slate-700">
                              <span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-slate-500">PDF, DOC or DOCX</p>
                      </div>
                      <input 
                          type="file" 
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="hidden" 
                      />
                  </label>
                </div>
              </section>

             
            </div>

          </div>

          {/* ================= ACTION BUTTONS ================= */}
          <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => router.push(`/${subdomain}/vendors`)}
              className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-indigo-600 focus:outline-none focus:ring-4 focus:ring-slate-100 w-full sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-70 disabled:shadow-none w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  {mode === "edit" ? "Saving..." : "Creating..."}
                </>
              ) : (
                mode === "edit" ? "Save Changes" : "Add Vendor"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  </div>
</PermissionGuard>
  );
};

export default VendorForm;
