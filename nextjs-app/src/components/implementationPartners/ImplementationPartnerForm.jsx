'use client';

import { useRouter, useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { API_BASE } from '@/config/api';
import {
  COUNTRY_OPTIONS,
  STATES_BY_COUNTRY,
  getPostalLabel,
  getPostalPlaceholder,
  getCountryCode
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
      case "phone":
        if (value) {
          validation = validatePhoneNumber(value);
        }
        break;
      case "zip":
        if (value) {
          validation = validateZipCode(value, formData.country);
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

    if (formData.phone) {
      const phoneValidation = validatePhoneNumber(formData.phone);
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

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
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
                      {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Legal Name
                      </label>
                      <input
                        type="text"
                        name="legalName"
                        value={formData.legalName}
                        onChange={handleChange}
                        maxLength={255}
                        className="form-control rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength={255}
                        className={`form-control rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 ${
                          errors.contactPerson ? "is-invalid" : ""
                        }`}
                      />
                      {errors.contactPerson && <div className="invalid-feedback">{errors.contactPerson}</div>}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Specialization
                      </label>
                      <input
                        type="text"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleChange}
                        maxLength={255}
                        placeholder="Cloud Migration, Analytics, Security"
                        className="form-control rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                      />
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
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength={255}
                        className={`form-control rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 ${
                          errors.email ? "is-invalid" : ""
                        }`}
                      />
                      {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength={14}
                        placeholder="(555) 123-4567"
                        className={`form-control rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 ${
                          errors.phone ? "is-invalid" : ""
                        }`}
                      />
                      {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
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
                        Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        maxLength={255}
                        className="form-control rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          City
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          maxLength={100}
                          className="form-control rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          State / Province
                        </label>
                        <select
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          className="form-control rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          <option value="">Select</option>
                          {STATES_BY_COUNTRY[formData.country]?.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
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
                              className={`form-control rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 ${
                                errors.zip ? "is-invalid" : ""
                              }`}
                            />
                            {errors.zip && <div className="invalid-feedback">{errors.zip}</div>}
                          </>
                        ) : (
                          <input
                            type="text"
                            name="zip"
                            value=""
                            disabled
                            className="form-control rounded-lg border-slate-300 bg-slate-100"
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Country
                      </label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="form-control rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        {COUNTRY_OPTIONS.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
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

                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Notes
                      </label>
                      <textarea
                        rows="4"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Additional notes about this implementation partner..."
                        className="form-control rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </section>
              </div>


              {/* ================= ACTIONS ================= */}
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="btn btn-outline-light"
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
                    className="btn btn-primary"
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
      </div>
    </div>
  );
};

export default ImplementationPartnerForm;
