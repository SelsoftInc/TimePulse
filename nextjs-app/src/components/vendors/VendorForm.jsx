'use client';

import { useRouter, useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { API_BASE } from '@/config/api';
import {
  COUNTRY_OPTIONS,
  STATES_BY_COUNTRY,
  TAX_ID_LABELS,
  TAX_ID_PLACEHOLDERS,
  PAYMENT_TERMS_OPTIONS,
  fetchPaymentTerms,
  getPostalLabel,
  getPostalPlaceholder,
  validateCountryTaxId} from '../../config/lookups';
import { PERMISSIONS } from '@/utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
  validatePhoneNumber,
  validateZipCode,
  validateEmail,
  validateName} from '@/utils/validations';
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

  // Hydration fix: Set mounted state on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === "country") {
      // Reset state when country changes
      setFormData({ ...formData, country: value, state: "" });
      return;
    }

    // Format phone number as user types
    if (name === "phone") {
      // Remove all non-digit characters
      const digits = value.replace(/\D/g, "");

      // Limit to 10 digits
      const limitedDigits = digits.slice(0, 10);

      // Format as (XXX) XXX-XXXX
      if (limitedDigits.length >= 6) {
        processedValue = `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(
          3,
          6
        )}-${limitedDigits.slice(6)}`;
      } else if (limitedDigits.length >= 3) {
        processedValue = `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(
          3
        )}`;
      } else if (limitedDigits.length > 0) {
        processedValue = `(${limitedDigits}`;
      } else {
        processedValue = "";
      }
    }

    // Format zip code - only allow digits and limit to 5
    if (name === "zip") {
      const digits = value.replace(/\D/g, "");
      processedValue = digits.slice(0, 5);
    }

    setFormData({
      ...formData,
      [name]: processedValue});

    // Clear field-specific error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const validation = validatePhoneNumber(value);
      setErrors((prev) => ({
        ...prev,
        phone: validation.isValid ? "" : validation.message}));
    } else if (name === "zip") {
      const validation = validateZipCode(value);
      setErrors((prev) => ({
        ...prev,
        zip: validation.isValid ? "" : validation.message}));
    } else if (name === "email") {
      const validation = validateEmail(value);
      setErrors((prev) => ({
        ...prev,
        email: validation.isValid ? "" : validation.message}));
    } else if (name === "name") {
      const validation = validateName(value, "Vendor Name");
      setErrors((prev) => ({
        ...prev,
        name: validation.isValid ? "" : validation.message}));
    } else if (name === "contactPerson") {
      const validation = validateName(value, "Contact Person");
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form fields
    const phoneValidation = validatePhoneNumber(formData.phone);
    const zipValidation = validateZipCode(formData.zip);
    const emailValidation = validateEmail(formData.email);
    const nameValidation = validateName(formData.name, "Vendor Name");
    const contactValidation = validateName(
      formData.contactPerson,
      "Contact Person"
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
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    try {
      setError("");
      setLoading(true);
      // Country-specific tax id validation
      const taxErr = validateCountryTaxId(formData.country, formData.taxId);
      if (taxErr) {
        setError(taxErr);
        setLoading(false);
        return;
      }
      if (!user?.tenantId) {
        setError("No tenant information available");
        setLoading(false);
        return;
      }

      if (onSubmitOverride) {
        // Build payload similar to create for editor convenience
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
      <div className="nk-conten">
        <div className="container-fluid">
          <div className="nk-block-head">
            <div className="nk-block-between">
              <div className="nk-block-head-content">
                <h3 className="nk-block-title">Add New Vendor</h3>
                {/* <p className="nk-block-subtitle">Create a new vendor record</p> */}
              </div>
            </div>
          </div>

          <div className="nk-block">
            <div className="card card-bordered">
              <div className="card-inne">
                {error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <div className="row g-4">
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="name">
                          Vendor Name*
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Enter vendor name"
                          required
                        />
                        {errors.name && (
                          <div className="mt-1">
                            <small className="text-danger">{errors.name}</small>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="contactPerson">
                          Contact Person*
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="contactPerson"
                          name="contactPerson"
                          value={formData.contactPerson}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Enter contact person name"
                          required
                        />
                        {errors.contactPerson && (
                          <div className="mt-1">
                            <small className="text-danger">
                              {errors.contactPerson}
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
                          className="form-control"
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
                          Phone Number*
                        </label>
                        <input
                          type="tel"
                          className="form-control"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Enter phone number"
                          maxLength="14"
                          required
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
                    <div className="col-lg-12">
                      <div className="form-group">
                        <label className="form-label" htmlFor="address">
                          Address
                        </label>
                        <input
                          type="text"
                          className="form-control"
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
                          className="form-control"
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
                          State
                        </label>
                        {STATES_BY_COUNTRY[formData.country] &&
                        STATES_BY_COUNTRY[formData.country].length > 0 ? (
                          <select
                            className="form-select"
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
                            className="form-control"
                            id="state"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            placeholder="Enter state"
                          />
                        )}
                      </div>
                    </div>
                    <div className="col-lg-4">
                      <div className="form-group">
                        <label className="form-label" htmlFor="zip">
                          {getPostalLabel(formData.country)}
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="zip"
                          name="zip"
                          value={formData.zip}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder={getPostalPlaceholder(formData.country)}
                          maxLength={
                            formData.country === "United States" ? 5 : 10
                          }
                        />
                        {errors.zip && (
                          <div className="mt-1">
                            <small className="text-danger">{errors.zip}</small>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="country">
                          Country
                        </label>
                        <select
                          className="form-select"
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
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="taxId">
                          {TAX_ID_LABELS[formData.country] || "Tax ID"}
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="taxId"
                          name="taxId"
                          value={formData.taxId}
                          onChange={handleChange}
                          placeholder={
                            TAX_ID_PLACEHOLDERS[formData.country] ||
                            "Enter tax identifier"
                          }
                        />
                        <small className="text-muted">
                          This identifier varies by country (e.g., EIN in US,
                          GSTIN in India, VAT in UK).
                        </small>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="vendorType">
                          Vendor Type*
                        </label>
                        <select
                          className="form-select"
                          id="vendorType"
                          name="vendorType"
                          value={formData.vendorType}
                          onChange={handleChange}
                          required
                        >
                          <option value="consultant">Consultant</option>
                          <option value="contractor">Contractor</option>
                          <option value="supplier">Supplier</option>
                          <option value="service">Service Provider</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="paymentTerms">
                          Payment Term*
                        </label>
                        <select
                          className="form-select"
                          id="paymentTerms"
                          name="paymentTerms"
                          value={formData.paymentTerms}
                          onChange={handleChange}
                          required
                        >
                          {paymentTermsOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <small className="text-muted">
                          Invoices are generated after timesheet approval.
                          Invoice cycle controls when the invoice is created
                          (e.g., Net 30).
                        </small>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="status">
                          Status
                        </label>
                        <select
                          className="form-select"
                          id="status"
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="pending">Pending Approval</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <div className="form-group">
                        <label className="form-label">
                          Contract / Agreement
                        </label>
                        <div className="form-control-wrap">
                          <div className="custom-file">
                            <input
                              type="file"
                              className="custom-file-input"
                              id="contractFile"
                              accept=".pdf,.doc,.docx"
                              onChange={handleFileChange}
                            />
                            <label
                              className="custom-file-label"
                              htmlFor="contractFile"
                            >
                              {contractFile ? contractFile.name : "Choose file"}
                            </label>
                          </div>
                        </div>
                        <small className="text-muted">
                          Upload vendor contract or agreement (PDF, DOC, DOCX)
                        </small>

                        {contractPreview && (
                          <div className="document-preview mt-3">
                            <p>Document uploaded: {contractFile.name}</p>
                            {contractFile.type.includes("image") ? (
                              <img
                                src={contractPreview}
                                alt="Contract Preview"
                                style={{ maxWidth: "100%", maxHeight: "200px" }}
                              />
                            ) : (
                              <div className="document-icon">
                                <i className="fas fa-file-pdf fa-3x"></i>
                                <p>Document ready for upload</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <div className="form-group">
                        <label className="form-label" htmlFor="notes">
                          Notes
                        </label>
                        <textarea
                          className="form-control"
                          id="notes"
                          name="notes"
                          value={formData.notes}
                          onChange={handleChange}
                          placeholder="Enter any additional notes"
                          rows="4"
                        ></textarea>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-group">
                        <button
                          type="submit"
                          className="btn btn-primary btn-create-vendor"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm mr-1"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              {mode === "edit" ? "Saving..." : "Creating..."}
                            </>
                          ) : (
                            submitLabel ||
                            (mode === "edit" ? "Save Changes" : "Create Vendor")
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-light ml-3"
                          onClick={() => router.push(`/${subdomain}/vendors`)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default VendorForm;
