import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE } from "../../config/api";
import {
  COUNTRY_OPTIONS,
  STATES_BY_COUNTRY,
  getPostalLabel,
  getPostalPlaceholder,
} from "../../config/lookups";
import { PERMISSIONS } from "../../utils/roles";
import PermissionGuard from "../common/PermissionGuard";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import {
  validatePhoneNumber,
  validateZipCode,
  validateEmail,
  validateName,
} from "../../utils/validations";
import "./ImplementationPartners.css";

const ImplementationPartnerForm = ({
  mode = "create",
  initialData = null,
  onSubmitOverride = null,
  submitLabel = null,
}) => {
  const navigate = useNavigate();
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
    notes: "",
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
        notes: initialData.notes || "",
      });
    }
  }, [mode, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

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

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    let error = "";

    switch (name) {
      case "name":
        error = validateName(value, "Implementation Partner name");
        break;
      case "email":
        if (value) {
          error = validateEmail(value);
        }
        break;
      case "phone":
        if (value) {
          error = validatePhoneNumber(value);
        }
        break;
      case "zip":
        if (value) {
          error = validateZipCode(value, formData.country);
        }
        break;
      default:
        break;
    }

    if (error && error !== null) {
      setErrors((prev) => ({
        ...prev,
        [name]: error,
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
      const nameError = validateName(
        formData.name,
        "Implementation Partner name"
      );
      if (nameError) newErrors.name = nameError;
    }

    // Optional but validated fields
    if (formData.email) {
      const emailError = validateEmail(formData.email);
      if (emailError) newErrors.email = emailError;
    }

    if (formData.phone) {
      const phoneError = validatePhoneNumber(formData.phone);
      if (phoneError) newErrors.phone = phoneError;
    }

    if (formData.zip) {
      const zipError = validateZipCode(formData.zip, formData.country);
      if (zipError) newErrors.zip = zipError;
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
        tenantId: user.tenantId,
      };

      let response;
      if (mode === "create") {
        response = await fetch(`${API_BASE}/api/implementation-partners`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(
          `${API_BASE}/api/implementation-partners/${initialData.id}?tenantId=${user.tenantId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(payload),
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
        navigate(`/${subdomain}/implementation-partners`);
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
      navigate(`/${subdomain}/implementation-partners`);
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">
                {mode === "create"
                  ? "Add New Implementation Partner"
                  : "Edit Implementation Partner"}
              </h4>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row">
                  {/* Basic Information */}
                  <div className="col-md-6">
                    <h5 className="mb-3">Basic Information</h5>

                    <div className="mb-3">
                      <label htmlFor="name" className="form-label">
                        Implementation Partner Name{" "}
                        <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${
                          errors.name ? "is-invalid" : ""
                        }`}
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength={255}
                        required
                      />
                      {errors.name && (
                        <div className="invalid-feedback">{errors.name}</div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="legalName" className="form-label">
                        Legal Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="legalName"
                        name="legalName"
                        value={formData.legalName}
                        onChange={handleChange}
                        maxLength={255}
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="contactPerson" className="form-label">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="contactPerson"
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleChange}
                        maxLength={255}
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="specialization" className="form-label">
                        Specialization
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="specialization"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleChange}
                        maxLength={255}
                        placeholder="e.g., Cloud Migration, Data Analytics, Security"
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="col-md-6">
                    <h5 className="mb-3">Contact Information</h5>

                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">
                        Email
                      </label>
                      <input
                        type="email"
                        className={`form-control ${
                          errors.email ? "is-invalid" : ""
                        }`}
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength={255}
                      />
                      {errors.email && (
                        <div className="invalid-feedback">{errors.email}</div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="phone" className="form-label">
                        Phone
                      </label>
                      <input
                        type="tel"
                        className={`form-control ${
                          errors.phone ? "is-invalid" : ""
                        }`}
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength={14}
                        placeholder="(555) 123-4567"
                      />
                      {errors.phone && (
                        <div className="invalid-feedback">{errors.phone}</div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="address" className="form-label">
                        Address
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        maxLength={255}
                      />
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="city" className="form-label">
                            City
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            maxLength={100}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="state" className="form-label">
                            State/Province
                          </label>
                          <select
                            className="form-control"
                            id="state"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                          >
                            <option value="">Select State/Province</option>
                            {STATES_BY_COUNTRY[formData.country]?.map(
                              (state) => (
                                <option key={state} value={state}>
                                  {state}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="zip" className="form-label">
                            {getPostalLabel(formData.country)}
                          </label>
                          <input
                            type="text"
                            className={`form-control ${
                              errors.zip ? "is-invalid" : ""
                            }`}
                            id="zip"
                            name="zip"
                            value={formData.zip}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            maxLength={5}
                            placeholder={getPostalPlaceholder(formData.country)}
                          />
                          {errors.zip && (
                            <div className="invalid-feedback">{errors.zip}</div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="country" className="form-label">
                            Country
                          </label>
                          <select
                            className="form-control"
                            id="country"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                          >
                            {COUNTRY_OPTIONS.map((country) => (
                              <option key={country} value={country}>
                                {country}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="row">
                  <div className="col-12">
                    <h5 className="mb-3">Additional Information</h5>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="status" className="form-label">
                            Status
                          </label>
                          <select
                            className="form-control"
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="pending">Pending</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="notes" className="form-label">
                        Notes
                      </label>
                      <textarea
                        className="form-control"
                        id="notes"
                        name="notes"
                        rows="4"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Additional notes about this implementation partner..."
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancel}
                    disabled={loading}
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
                      className="btn btn-primary"
                      disabled={loading}
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
                          ? "Create Implementation Partner"
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
    </div>
  );
};

export default ImplementationPartnerForm;
