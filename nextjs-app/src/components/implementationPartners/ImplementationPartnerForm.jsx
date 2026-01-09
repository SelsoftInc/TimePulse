'use client';

import { useRouter, useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { API_BASE } from '@/config/api';
import {
  COUNTRY_OPTIONS,
  STATES_BY_COUNTRY,
  getPostalLabel,
  getPostalPlaceholder,
  getCountryCode,
  getTaxIdLabel,
  getTaxIdPlaceholder,
  parsePhoneNumber
} from '../../config/lookups';
import { PERMISSIONS } from '@/utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
  validatePhoneNumber,
  validateZipCode,
  validateEmail,
  validateName,
  formatPostalInput
} from '@/utils/validations';
import "./ImplementationPartners.css";

const ImplementationPartnerForm = ({
  mode = "create",
  initialData = null,
  onSubmitOverride = null,
  submitLabel = null
}) => {
  const router = useRouter();
  const { subdomain } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [validationTouched, setValidationTouched] = useState({});
  
  // Hydration fix: Track if component is mounted on client
  const [isMounted, setIsMounted] = useState(false);
  
  // UI-only state for separated country code and Phone
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dialCodes, setDialCodes] = useState([]);
  
  const [formData, setFormData] = useState({
    name: "",
    legalName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
    specialization: "",
    status: "active",
    notes: ""
  });

  // Hydration fix: Set mounted state on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch and set country codes filtered by COUNTRY_OPTIONS
  useEffect(() => {
    const fetchCountryCodes = async () => {
      try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,idd,cca2');
        const data = await response.json();

        const formattedCodes = data
          .filter((c) => c.idd?.root)
          .map((c) => {
            const root = c.idd.root;
            const suffix = (c.idd.suffixes && c.idd.suffixes.length === 1) ? c.idd.suffixes[0] : "";
            return {
              label: `${c.cca2} (${root}${suffix})`,
              code: `${root}${suffix}`,
              name: c.name.common
            };
          })
          .filter((c) => COUNTRY_OPTIONS.includes(c.name))
          .sort((a, b) => a.name.localeCompare(b.name));

        setDialCodes(formattedCodes);
        
        // Set default country code if not in edit mode
        if (mode === "create" && countryCode === "+1") {
          const usCode = formattedCodes.find(c => c.name === "United States");
          if (usCode) {
            setCountryCode(usCode.code);
          }
        }
      } catch (error) {
        console.error("Error fetching country codes:", error);
        const fallbackCodes = [
          { label: "US (+1)", code: "+1", name: "United States" },
          { label: "IN (+91)", code: "+91", name: "India" },
          { label: "CA (+1)", code: "+1", name: "Canada" },
          { label: "GB (+44)", code: "+44", name: "United Kingdom" },
          { label: "AU (+61)", code: "+61", name: "Australia" },
          { label: "DE (+49)", code: "+49", name: "Germany" },
          { label: "SG (+65)", code: "+65", name: "Singapore" },
          { label: "AE (+971)", code: "+971", name: "United Arab Emirates" }
        ];
        setDialCodes(fallbackCodes);
        
        if (mode === "create") {
          setCountryCode("+1");
        }
      }
    };

    fetchCountryCodes();
  }, [mode, countryCode]);

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormData({
        name: initialData.name || "",
        legalName: initialData.legalName || "",
        contactPerson: initialData.contactPerson || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
        city: initialData.city || "",
        state: initialData.state || "",
        zip: initialData.zip || "",
        country: initialData.country || "United States",
        specialization: initialData.specialization || "",
        status: initialData.status || "active",
        notes: initialData.notes || ""
      });
    }
  }, [mode, initialData]);

  // UI-only: Split phone into country code and Phone when formData.phone changes
  // This only runs on initial load or when editing an existing partner
  useEffect(() => {
    if (!isMounted) return;
    
    // Only parse if we have a Phone
    if (formData.phone && formData.phone.length > 0) {
      // Use intelligent phone parsing that matches against known country codes
      const parsed = parsePhoneNumber(formData.phone, formData.country);
      setCountryCode(parsed.countryCode);
      setPhoneNumber(parsed.phoneNumber);
    }
  }, [isMounted, formData.phone, formData.country]);

  // Get expected Phone length for a country
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

  // UI-only: Handle Phone input change
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

    // Restrict name fields to alphabetic characters and spaces only
    if (name === "name" || name === "contactPerson") {
      // Only allow letters and spaces
      processedValue = value.replace(/[^a-zA-Z\s]/g, '');
      updates[name] = processedValue;
    }

    // Auto-update country code when country is selected
    if (name === "country") {
      const newCountryCode = getCountryCode(value);
      setCountryCode(newCountryCode);
      // Keep existing Phone, just update country code
      const combinedPhone = phoneNumber ? `${newCountryCode}${phoneNumber}` : newCountryCode;
      updates.phone = combinedPhone;
      // Reset state when country changes
      updates.state = "";
      // Clear validation errors when country changes
      setErrors((prev) => ({ ...prev, phone: "" }));
    }

    // Format Phone as user types - E.164 only (kept for backward compatibility)
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

    // Format zip code - only allow digits and limit to country-specific length
    if (name === "zip") {
      processedValue = formatPostalInput(value, formData.country);
      updates.zip = processedValue;
    }

    setFormData((prev) => ({
      ...prev,
      ...updates
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      // Phone validation handled by handlePhoneBlur
      return;
    } else if (name === "zip") {
      setValidationTouched((prev) => ({ ...prev, zip: true }));
    }

    // Mark field as touched
    setValidationTouched((prev) => ({ ...prev, [name]: true }));

    let validation = null;

    switch (name) {
      case "name":
        validation = validateName(value, "Implementation Partner name");
        break;
      case "email":
        if (value) {
          validation = validateEmail(value);
        }
        break;
      case "contactPerson":
        if (value) {
          validation = validateName(value, "Contact Person", { requireAtLeastTwoWords: true });
        }
        break;
      default:
        break;
    }

    if (validation && !validation.isValid) {
      setErrors((prev) => ({
        ...prev,
        [name]: validation.message
      }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = "Implementation Partner name is required";
    } else {
      const nameValidation = validateName(
        formData.name,
        "Implementation Partner name"
      );
      if (!nameValidation.isValid) newErrors.name = nameValidation.message;
    }

    // Optional but validated fields
    if (formData.contactPerson) {
      const contactValidation = validateName(formData.contactPerson, "Contact Person", { requireAtLeastTwoWords: true });
      if (!contactValidation.isValid) newErrors.contactPerson = contactValidation.message;
    }

    if (formData.email) {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.isValid) newErrors.email = emailValidation.message;
    }

    // Phone is optional
    if (formData.phone) {
      const phoneValidation = validatePhoneNumber(formData.phone, formData.country);
      if (!phoneValidation.isValid) newErrors.phone = phoneValidation.message;
    }

    if (formData.zip) {
      const zipValidation = validateZipCode(formData.zip, formData.country);
      if (!zipValidation.isValid) newErrors.zip = zipValidation.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

    if (!validateForm() || !phoneValidation.isValid) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        phone: formData.phone || null,
        tenantId: user.tenantId
      };

      let response;
      if (mode === "create") {
        response = await fetch(`${API_BASE}/api/implementation-partners`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(
          `${API_BASE}/api/implementation-partners/${initialData.id}?tenantId=${user.tenantId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify(payload)
          }
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (onSubmitOverride) {
        onSubmitOverride(data.implementationPartner);
      } else {
        toast.success(
          `Implementation Partner ${
            mode === "create" ? "created" : "updated"
          } successfully`
        );
        router.push(`/${subdomain}/implementation-partners`);
      }
    } catch (err) {
      console.error(
        `Error ${
          mode === "create" ? "creating" : "updating"
        } implementation partner:`,
        err
      );
      setError(
        err.message ||
          `Failed to ${
            mode === "create" ? "create" : "update"
          } implementation partner`
      );
      toast.error(
        err.message ||
          `Failed to ${
            mode === "create" ? "create" : "update"
          } implementation partner`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onSubmitOverride) {
      onSubmitOverride(null);
    } else {
      router.push(`/${subdomain}/implementation-partners`);
    }
  };

  return (
    <div className="implementation-partner-form nk-content min-h-screen bg-slate-50 p-4 md:p-8">
  <div className="mx-auto max-w-8xl">
    
    {/* ================= HEADER ================= */}
    <div className="mb-8 rounded-2xl border border-slate-200 bg-indigo-50 p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {mode === "create" ? "Add New Implementation Partner" : "Edit Implementation Partner"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {mode === "create" ? "Create and manage implementation partner details" : "Update Implementation Partner Details"}
          </p>
        </div>
      </div>
    </div>

    {/* ================= ERROR ALERT ================= */}
    {error && (
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800" role="alert">
        <i className="fas fa-exclamation-triangle text-xl"></i>
        <div className="flex-1 text-sm font-medium">{error}</div>
      </div>
    )}

    <form onSubmit={handleSubmit}>
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

        {/* ================= LEFT COLUMN ================= */}
        <div className="space-y-8">

          {/* BASIC INFORMATION */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <header className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-800">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-600">1</span>
                Basic Information
              </div>
            </header>
            
            <div className="p-6 grid grid-cols-1 gap-6">
              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Partner Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={255}
                  required
                  placeholder="e.g. Tech Solutions Inc."
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

              {/* Legal Name */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Legal Name
                </label>
                <input
                  type="text"
                  name="legalName"
                  value={formData.legalName}
                  onChange={handleChange}
                  maxLength={255}
                  placeholder="Registered Legal Entity Name"
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              {/* Contact Person */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Contact Person
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={255}
                  placeholder="Primary Contact Name"
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

              {/* Specialization */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Specialization
                </label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  maxLength={255}
                  placeholder="Cloud Migration, Analytics, Security"
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            </div>
          </section>

          {/* CONTACT INFORMATION */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <header className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-800">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-600">2</span>
                Contact Information
              </div>
            </header>
            <div className="p-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={255}
                  placeholder="partner@example.com"
                  className={`block w-full rounded-lg border p-2.5 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                    errors.email 
                      ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500/10' 
                      : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/10'
                  }`}
                />
                {errors.email && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Phone
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    className="w-[80px] min-w-[80px] shrink-0 rounded-lg border border-slate-200 bg-slate-100 p-2.5 text-center text-sm font-bold text-slate-600 shadow-sm cursor-not-allowed"
                    value={countryCode}
                    readOnly
                    maxLength="4"
                    title="Country code"
                  />
                  <input
                    type="tel"
                    className={`block flex-1 rounded-lg border p-2.5 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                      errors.phone 
                        ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500/10' 
                        : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/10'
                    }`}
                    value={phoneNumber}
                    onChange={handlePhoneNumberChange}
                    onBlur={handlePhoneBlur}
                    placeholder="Enter Phone"
                    maxLength="15"
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Auto-updates based on country
                </p>
                {errors.phone && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.phone}</p>}
              </div>
            </div>
          </section>
        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="space-y-8">

          {/* ADDRESS */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <header className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-800">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-600">3</span>
                Address Details
              </div>
            </header>
            <div className="p-6 space-y-6">
              {/* Address Line */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  maxLength={255}
                  placeholder="Street Address, PO Box"
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {/* City */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    maxLength={100}
                    placeholder="City"
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    State / Province
                  </label>
                  <div className="relative">
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="block w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    >
                      <option value="">Select</option>
                      {STATES_BY_COUNTRY[formData.country]?.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                {/* Zip Code */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {getPostalLabel(formData.country)}
                  </label>
                  {formData.country !== "United Arab Emirates" ? (
                    <>
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
                      {errors.zip && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.zip}</p>}
                    </>
                  ) : (
                    <input
                      type="text"
                      name="zip"
                      value=""
                      disabled
                      className="block w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 p-2.5 text-sm text-slate-400 shadow-sm"
                    />
                  )}
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Country
                </label>
                <div className="relative">
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="block w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  >
                    {COUNTRY_OPTIONS.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ADDITIONAL INFORMATION */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <header className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-800">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-600">4</span>
                Additional Information
              </div>
            </header>
            <div className="p-6 grid grid-cols-1 gap-6">
              {/* Status */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Status
                </label>
                <div className="relative">
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="block w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Notes
                </label>
                <textarea
                  rows="4"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional notes about this implementation partner..."
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ================= ACTIONS ================= */}
      <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-indigo-600 focus:outline-none focus:ring-4 focus:ring-slate-100 w-full sm:w-auto"
        >
          Cancel
        </button>

        <PermissionGuard
          requiredPermission={
            mode === "create"
              ? PERMISSIONS.CREATE_IMPLEMENTATION_PARTNER
              : PERMISSIONS.EDIT_IMPLEMENTATION_PARTNER
          }
        >
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-70 disabled:shadow-none w-full sm:w-auto"
          >
            {loading ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {mode === "create" ? "Creating..." : "Updating..."}
              </>
            ) : (
              submitLabel ||
              (mode === "create"
                ? "Add Implementation Partner"
                : "Update Implementation Partner")
            )}
          </button>
        </PermissionGuard>
      </div>
    </form>
  </div>
</div>
  );
};

export default ImplementationPartnerForm;
