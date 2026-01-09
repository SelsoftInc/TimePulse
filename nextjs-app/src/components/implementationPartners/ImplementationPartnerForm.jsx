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
  
  // UI-only state for separated country code and phone number
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  
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

  // UI-only: Split phone into country code and phone number when formData.phone changes
  // This only runs on initial load or when editing an existing partner
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
    
    // Phone is now required
    if (!phoneNumber || phoneNumber.trim() === '') {
      setErrors((prev) => ({ ...prev, phone: "Phone number is required" }));
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

    // Restrict name fields to letters, spaces, hyphens, and apostrophes only
    if (name === "legalName" || name === "contactPerson") {
      // Only allow letters (including international), spaces, hyphens, and apostrophes
      processedValue = value.replace(/[^a-zA-Z\s'-]/g, '');
      updates[name] = processedValue;
    }

    // Restrict city to letters, spaces, hyphens, and apostrophes only
    if (name === "city") {
      processedValue = value.replace(/[^a-zA-Z\s'-]/g, '');
      updates[name] = processedValue;
    }

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
        if (!value.trim()) {
          validation = { isValid: false, message: "Implementation Partner name is required" };
        } else {
          validation = validateName(value, "Implementation Partner name");
        }
        break;
      case "legalName":
        if (!value.trim()) {
          validation = { isValid: false, message: "First Name is required" };
        } else {
          validation = validateName(value, "First Name");
        }
        break;
      case "contactPerson":
        if (!value.trim()) {
          validation = { isValid: false, message: "Last Name is required" };
        } else {
          validation = validateName(value, "Last Name");
        }
        break;
      case "email":
        if (!value.trim()) {
          validation = { isValid: false, message: "Email is required" };
        } else {
          validation = validateEmail(value);
        }
        break;
      case "address":
        if (!value.trim()) {
          validation = { isValid: false, message: "Address is required" };
        }
        break;
      case "city":
        if (!value.trim()) {
          validation = { isValid: false, message: "City is required" };
        }
        break;
      case "state":
        if (!value.trim()) {
          validation = { isValid: false, message: "State/Province is required" };
        }
        break;
      case "zip":
        if (!value.trim()) {
          validation = { isValid: false, message: `${getPostalLabel(formData.country)} is required` };
        } else {
          const zipValidation = validateZipCode(value, formData.country);
          if (!zipValidation.isValid) {
            validation = zipValidation;
          }
        }
        break;
      case "specialization":
        if (!value.trim()) {
          validation = { isValid: false, message: "Specialization is required" };
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

    // All fields are now required
    if (!formData.name.trim()) {
      newErrors.name = "Implementation Partner name is required";
    } else {
      const nameValidation = validateName(
        formData.name,
        "Implementation Partner name"
      );
      if (!nameValidation.isValid) newErrors.name = nameValidation.message;
    }

    if (!formData.legalName.trim()) {
      newErrors.legalName = "First Name is required";
    } else {
      const legalNameValidation = validateName(formData.legalName, "First Name");
      if (!legalNameValidation.isValid) newErrors.legalName = legalNameValidation.message;
    }

    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = "Last Name is required";
    } else {
      const contactValidation = validateName(formData.contactPerson, "Last Name");
      if (!contactValidation.isValid) newErrors.contactPerson = contactValidation.message;
    }

    if (!formData.specialization.trim()) {
      newErrors.specialization = "Specialization is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.isValid) newErrors.email = emailValidation.message;
    }

    // Phone is required and must be valid
    if (!phoneNumber || phoneNumber.trim() === '') {
      newErrors.phone = "Phone number is required";
    } else if (formData.phone) {
      const phoneValidation = validatePhoneNumber(formData.phone, formData.country);
      if (!phoneValidation.isValid) newErrors.phone = phoneValidation.message;
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State/Province is required";
    }

    if (!formData.zip.trim()) {
      newErrors.zip = `${getPostalLabel(formData.country)} is required`;
    } else {
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
      legalName: true,
      contactPerson: true,
      specialization: true,
      address: true,
      city: true,
      state: true
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
    <div className="implementation-partner-form nk-content min-h-screen bg-slate-50">
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body py-6">
            {/* Header */}
            <div className="mb-6 rounded-xl border border-slate-200 bg-indigo-50 p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">
                    {mode === "create" ? "Add New Implementation Partner" : "Edit Implementation Partner"}
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    {mode === "create" ? "Create and manage implementation partner details" : "Implementation Partner Details"}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger mb-6" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Main Content Grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                {/* ================= BASIC INFORMATION ================= */}
                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <header className="rounded-t-xl border-b border-slate-200 bg-slate-50 px-6 py-4">
                    <h4 className="text-sm font-semibold text-slate-900">
                      Basic Information
                    </h4>
                  </header>
                  <div className="p-6 grid grid-cols-1 gap-5 sm:grid-cols-2">

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Implementation Partner Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength={255}
                        required
                        className={`form-control rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 ${
                          errors.name ? "is-invalid" : ""
                        }`}
                      />
                      {validationTouched.name && errors.name && (
                        <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Legal Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="legalName"
                        value={formData.legalName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength={255}
                        required
                        className={`form-control rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 ${
                          errors.legalName ? "is-invalid" : ""
                        }`}
                      />
                      {validationTouched.legalName && errors.legalName && (
                        <p className="mt-1 text-xs text-red-600">{errors.legalName}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength={255}
                        required
                        className={`form-control rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 ${
                          errors.contactPerson ? "is-invalid" : ""
                        }`}
                      />
                      {validationTouched.contactPerson && errors.contactPerson && (
                        <p className="mt-1 text-xs text-red-600">{errors.contactPerson}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Specialization <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength={255}
                        required
                        placeholder="Cloud Migration, Analytics, Security"
                        className={`form-control rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 ${
                          errors.specialization ? "is-invalid" : ""
                        }`}
                      />
                      {validationTouched.specialization && errors.specialization && (
                        <p className="mt-1 text-xs text-red-600">{errors.specialization}</p>
                      )}
                    </div>
                  </div>
                </section>

                {/* ================= CONTACT INFORMATION ================= */}
                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <header className="rounded-t-xl border-b border-slate-200 bg-slate-50 px-6 py-4">
                    <h4 className="text-sm font-semibold text-slate-900">
                      Contact Information
                    </h4>
                  </header>
                  <div className="p-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Email <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength={255}
                        required
                        className={`form-control rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 ${
                          errors.email ? "is-invalid" : ""
                        }`}
                      />
                      {validationTouched.email && errors.email && (
                        <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Phone <span className="text-danger">*</span>
                      </label>
                      <div className="flex items-stretch gap-2">
                        <input
                          type="text"
                          className="w-[70px] min-w-[70px] shrink-0 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-center text-sm font-semibold text-slate-700 shadow-sm"
                          value={countryCode}
                          readOnly
                          maxLength="4"
                          title="Country code (auto-filled based on selected country)"
                        />
                        <input
                          type="tel"
                          className={`flex-1 min-w-0 form-control rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 ${
                            errors.phone ? "is-invalid" : ""
                          }`}
                          value={phoneNumber}
                          onChange={handlePhoneNumberChange}
                          onBlur={handlePhoneBlur}
                          placeholder="Enter phone number"
                          maxLength="15"
                          required
                        />
                      </div>
                      <small className="mt-1 block text-xs text-slate-500">
                        Country code updates automatically based on selected country
                      </small>
                      {validationTouched.phone && errors.phone && (
                        <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                      )}
                    </div>
                  </div>
                </section>

                {/* ================= ADDRESS ================= */}
                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <header className="rounded-t-xl border-b border-slate-200 bg-slate-50 px-6 py-4">
                    <h4 className="text-sm font-semibold text-slate-900">
                      Address
                    </h4>
                  </header>
                  <div className="p-6 grid grid-cols-1 gap-5">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Country <span className="text-danger">*</span>
                      </label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        required
                        className="form-control rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        {COUNTRY_OPTIONS.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Address <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength={255}
                        required
                        className={`form-control rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 ${
                          errors.address ? "is-invalid" : ""
                        }`}
                      />
                      {validationTouched.address && errors.address && (
                        <p className="mt-1 text-xs text-red-600">{errors.address}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
                      <div className="min-w-0">
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          City <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          maxLength={100}
                          required
                          className={`form-control w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 ${
                            errors.city ? "is-invalid" : ""
                          }`}
                        />
                        {validationTouched.city && errors.city && (
                          <p className="mt-1 text-xs text-red-600">{errors.city}</p>
                        )}
                      </div>

                      <div className="min-w-0">
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          State / Province <span className="text-danger">*</span>
                        </label>
                        <select
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          required
                          className={`form-control w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 ${
                            errors.state ? "is-invalid" : ""
                          }`}
                        >
                          <option value="">Select</option>
                          {STATES_BY_COUNTRY[formData.country]?.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                        {validationTouched.state && errors.state && (
                          <p className="mt-1 text-xs text-red-600">{errors.state}</p>
                        )}
                      </div>

                      <div className="min-w-0">
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          {getPostalLabel(formData.country)} <span className="text-danger">*</span>
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
                              required
                              className={`form-control w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 ${
                                errors.zip ? "is-invalid" : ""
                              }`}
                            />
                            {validationTouched.zip && errors.zip && (
                              <p className="mt-1 text-xs text-red-600">{errors.zip}</p>
                            )}
                          </>
                        ) : (
                          <input
                            type="text"
                            name="zip"
                            value=""
                            disabled
                            className="form-control w-full rounded-lg border-slate-300 bg-slate-100"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* ================= ADDITIONAL INFORMATION ================= */}
                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <header className="rounded-t-xl border-b border-slate-200 bg-slate-50 px-6 py-4">
                    <h4 className="text-sm font-semibold text-slate-900">
                      Additional Information
                    </h4>
                  </header>
                  <div className="p-6 grid grid-cols-1 gap-5">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="form-control rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Notes
                      </label>
                      <textarea
                        rows="4"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Additional notes about this implementation partner..."
                        className="form-control rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 w-full"
                      />
                    </div>
                  </div>
                </section>
              </div>


              {/* ================= ACTIONS ================= */}
              <div className="mt-8 flex flex-wrap items-center justify-end gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4 rounded-b-xl">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        {mode === "create" ? "Creating..." : "Updating..."}
                      </>
                    ) : (
                      <>
                        <i className="fas fa-plus-circle me-2"></i>
                        {submitLabel ||
                          (mode === "create"
                            ? "Add Implementation Partner"
                            : "Update Implementation Partner")}
                      </>
                    )}
                  </button>
                </PermissionGuard>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImplementationPartnerForm;
