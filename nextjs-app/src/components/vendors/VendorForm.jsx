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
      <div className="nk-conten bg-slate-50">
        <div className="container-fluid px-4 py-6 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit}>
            {/* <div className="nk-block-head">
              <div className="mb-6 rounded-xl border border-slate-200 bg-indigo-50 p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h1 className="text-xl font-semibold text-slate-900">
                      Add New Vendor
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                      Create a new vendor record
                    </p>
                    <p className="nk-block-subtitle">Create a new vendor record</p>
                  </div>
                </div>
              </div>
            </div> */}

            <div className="nk-block">
  <div className="mx-auto max-w-7xl">

    {error && (
      <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <i className="fas fa-exclamation-triangle mr-2" />
        {error}
      </div>
    )}

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

      {/* ================= Vendor Information ================= */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-700">
          Vendor Information
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* name */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Vendor Name *
            </label>
            <input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-200 ${
                errors.name ? 'border-red-500 bg-red-50' : 'border-slate-200'
              }`}
            />
            {validationTouched.name && errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          {/* contact */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Contact Person *
            </label>
            <input
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm shadow-sm ${
                errors.contactPerson ? 'border-red-500 bg-red-50' : 'border-slate-200'
              }`}
            />
            {validationTouched.contactPerson && errors.contactPerson && (
              <p className="mt-1 text-xs text-red-600">{errors.contactPerson}</p>
            )}
          </div>

          {/* email */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm shadow-sm ${
                errors.email ? 'border-red-500 bg-red-50' : 'border-slate-200'
              }`}
            />
            {validationTouched.email && errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          {/* phone */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Phone *
            </label>
            <div className="flex items-stretch gap-2">
              <input
                type="text"
                className="w-[70px] min-w-[70px] flex-shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-sm font-semibold text-slate-700 shadow-sm"
                value={countryCode}
                readOnly
                maxLength="4"
                title="Country code (auto-filled based on selected country)"
              />
              <input
                type="tel"
                className={`flex-1 min-w-0 rounded-xl border px-4 py-2.5 text-sm shadow-sm transition-all ${
                  errors.phone ? 'border-red-500 bg-red-50' : 'border-slate-200'
                }`}
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                onBlur={handlePhoneBlur}
                placeholder="Enter phone number"
                maxLength="15"
              />
            </div>
            <small className="mt-1 block text-xs text-slate-500">
              Country code updates automatically based on selected country
            </small>
            {validationTouched.phone && errors.phone && (
              <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* vendor type */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Vendor Type *
            </label>
            <select
              name="vendorType"
              value={formData.vendorType}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm"
            >
              <option value="consultant">Consultant</option>
              <option value="contractor">Contractor</option>
              <option value="supplier">Supplier</option>
              <option value="service">Service Provider</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* status */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm"
            >
              <option value="active">Active</option>
              <option value="pending">Pending Approval</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================= Address Information ================= */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-700">
          Address Information
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Address
            </label>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              City
            </label>
            <input
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              State
            </label>
            <input
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm"
            />
          </div>

          {formData.country !== "United Arab Emirates" && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                {getPostalLabel(formData.country)}
              </label>
              <input
                type="text"
                name="zip"
                value={formData.zip}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={getPostalPlaceholder(formData.country)}
                className={`w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm ${
                  errors.zip ? 'border-red-500' : ''
                }`}
              />
              {validationTouched.zip && errors.zip && (
                <p className="mt-1 text-xs text-red-600">{errors.zip}</p>
              )}
            </div>
          )}

          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Country *
            </label>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              required
              className="form-control w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              style={{ color: '#000000', backgroundColor: '#ffffff' }}
            >
              {COUNTRY_OPTIONS.map((country) => (
                <option key={country} value={country} style={{ color: '#000000', backgroundColor: '#ffffff' }}>
                  {country}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Changing country will update the phone number country code
            </p>
          </div>
        </div>
      </div>

      {/* ================= Tax & Payment ================= */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-700">
          Tax & Payment Information
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              {getTaxIdLabel(formData.country)}
            </label>
            <input
              name="taxId"
              value={formData.taxId}
              onChange={handleChange}
              placeholder={getTaxIdPlaceholder(formData.country)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Payment Terms *
            </label>
            <select
              name="paymentTerms"
              value={formData.paymentTerms}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm"
            >
              {paymentTermsOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ================= Contract ================= */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-700">
          Contract / Agreement
        </h2>

        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          className="block w-full text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sky-700 hover:file:bg-sky-100"
        />
      </div>

      {/* ================= Notes ================= */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-700">
          Notes
        </h2>

        <textarea
          rows={4}
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm"
        />
      </div>

      {/* ================= Actions ================= */}
      <div className="flex justify-end gap-3 lg:col-span-2">
        <button
          type="button"
          onClick={() => router.push(`/${subdomain}/vendors`)}
          className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-sky-700 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-sky-800 disabled:opacity-60"
        >
          {mode === "edit" ? "Save Changes" : "Add Vendor"}
        </button>
      </div>

    </div>
  </div>
</div>



          </form>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default VendorForm;
