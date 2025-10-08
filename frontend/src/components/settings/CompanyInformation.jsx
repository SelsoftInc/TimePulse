import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { apiFetch } from "../../config/api";
import "./CompanyInformation.css";

const CompanyInformation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [companyInfo, setCompanyInfo] = useState({
    tenantName: "",
    address: "",
    taxId: "",
    contactEmail: "",
    contactPhone: "",
    logo: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch tenant information from backend API
  const fetchTenantInfo = async () => {
    try {
      setLoading(true);
      setError("");

      // Get tenant ID from multiple possible sources
      let tenantId = user?.tenantId;

      // Fallback to localStorage if not in user context
      if (!tenantId) {
        const storedUser = JSON.parse(localStorage.getItem("userInfo") || "{}");
        tenantId = storedUser.tenantId;
      }

      // Fallback to current tenant
      if (!tenantId) {
        const currentTenant = JSON.parse(
          localStorage.getItem("currentTenant") || "{}"
        );
        tenantId = currentTenant.id;
      }

      if (!tenantId) {
        setError("No tenant information available. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await apiFetch(
        `/api/tenants/${tenantId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const tenant = data.tenant;

        // Helper function to safely get nested values
        const safeGet = (obj, key) => {
          if (
            !obj ||
            typeof obj !== "object" ||
            Object.keys(obj).length === 0
          ) {
            return "";
          }
          return obj[key] || "";
        };

        console.log("🔍 Tenant data received:", tenant);
        console.log("🖼️ Logo in tenant data:", !!tenant.logo);
        if (tenant.logo) {
          console.log("📏 Logo length from API:", tenant.logo.length);
        }

        setCompanyInfo({
          tenantName: tenant.tenantName || "",
          address: formatAddress(tenant.contactAddress),
          taxId: safeGet(tenant.taxInfo, "taxId"),
          contactEmail: safeGet(tenant.contactInfo, "email"),
          contactPhone: safeGet(tenant.contactInfo, "phone"),
          logo: tenant.logo || null,
        });

        console.log(
          "✅ Company info updated with logo:",
          !!(tenant.logo || null)
        );
      } else {
        setError(data.error || "Failed to fetch tenant information");
      }
    } catch (error) {
      console.error("Error fetching tenant info:", error);
      setError("Failed to load company information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format address
  const formatAddress = (addressObj) => {
    if (
      !addressObj ||
      typeof addressObj !== "object" ||
      Object.keys(addressObj).length === 0
    ) {
      return "";
    }
    const { street, city, state, zipCode } = addressObj;

    // Only include parts that have actual values
    const addressParts = [];
    if (street) addressParts.push(street);
    if (city || state || zipCode) {
      const cityStateZip = [city, state, zipCode].filter(Boolean).join(" ");
      if (cityStateZip) addressParts.push(cityStateZip);
    }

    return addressParts.join("\n");
  };

  useEffect(() => {
    fetchTenantInfo();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCompanyInfo({
      ...companyInfo,
      [name]: value,
    });
  };

  const handleLogoUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        setCompanyInfo({
          ...companyInfo,
          logo: event.target.result,
        });
      };

      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      console.log("🔄 Starting save process...");
      console.log("📋 Current company info:", companyInfo);
      setLoading(true);
      setError("");

      // Get tenant ID from multiple possible sources
      let tenantId = user?.tenantId;

      // Fallback to localStorage if not in user context
      if (!tenantId) {
        const storedUser = JSON.parse(localStorage.getItem("userInfo") || "{}");
        tenantId = storedUser.tenantId;
      }

      // Fallback to current tenant
      if (!tenantId) {
        const currentTenant = JSON.parse(
          localStorage.getItem("currentTenant") || "{}"
        );
        tenantId = currentTenant.id;
      }

      if (!tenantId) {
        setError("No tenant information available. Please log in again.");
        return;
      }

      // Transform frontend data to backend format
      const updateData = {
        tenantName: companyInfo.tenantName || "",
        contactAddress: parseAddress(companyInfo.address),
        taxInfo: companyInfo.taxId ? { taxId: companyInfo.taxId } : {},
        contactInfo: {
          ...(companyInfo.contactEmail && { email: companyInfo.contactEmail }),
          ...(companyInfo.contactPhone && { phone: companyInfo.contactPhone }),
        },
        ...(companyInfo.logo && { logo: companyInfo.logo }),
      };

      console.log("📦 Update data to send:", updateData);
      console.log("🖼️ Logo included:", !!companyInfo.logo);
      if (companyInfo.logo) {
        console.log("📏 Logo length:", companyInfo.logo.length);
      }

      console.log(
        `🌐 Making API call to: http://localhost:5000/api/tenants/${tenantId}`
      );

      const response = await fetch(
        `http://localhost:5000/api/tenants/${tenantId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      console.log("📡 API Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ API Response data:", data);

      if (data.success) {
        console.log("🎉 Save successful!");
        toast.success("Your company information has been saved.", {
          title: "Company Information Saved"
        });
      } else {
        console.log("❌ Save failed:", data.error);
        setError(data.error || "Failed to save company information");
        toast.error(data.error || "Failed to save company information", {
          title: "Save Failed"
        });
      }
    } catch (error) {
      console.error("Error saving company info:", error);
      setError("Failed to save company information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to parse address string back to object
  const parseAddress = (addressString) => {
    if (!addressString || addressString.trim() === "") return {};

    const lines = addressString
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) return {};

    if (lines.length === 1) {
      // Single line - treat as street address
      return { street: lines[0] };
    }

    // Multiple lines - first is street, second is city/state/zip
    const street = lines[0];
    const cityStateZip = lines[1];

    // Try to parse city, state, zip
    const parts = cityStateZip.split(",");
    if (parts.length >= 2) {
      const city = parts[0].trim();
      const stateZipPart = parts[1].trim();
      const stateZipMatch = stateZipPart.match(
        /^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/
      );

      if (stateZipMatch) {
        return {
          street,
          city,
          state: stateZipMatch[1],
          zipCode: stateZipMatch[2],
        };
      } else {
        // Fallback - split by space
        const stateZipParts = stateZipPart.split(" ");
        return {
          street,
          city,
          state: stateZipParts[0] || "",
          zipCode: stateZipParts.slice(1).join(" ") || "",
        };
      }
    }

    return { street, city: cityStateZip };
  };  

  if (loading) {
    return (
      <div className="company-information-setting">
        <h3 className="settings-section-title">Company Information</h3>
        <div className="loading-state">
          <div className="spinner-border" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p>Loading company information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="company-information-setting">
      <h3 className="settings-section-title">Company Information</h3>

      {error && (
        <div className="alert alert-danger" role="alert">
          <div className="alert-content">
            <span>
              <strong>Error: </strong> {error}
            </span>
            <button
              className="btn-retry"
              onClick={fetchTenantInfo}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="tenantName">
          Tenant Name
        </label>
        <input
          type="text"
          className="form-control"
          id="tenantName"
          name="tenantName"
          value={companyInfo.tenantName}
          onChange={handleInputChange}
          placeholder="Enter your company name"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="address">
          Company Address
        </label>
        <textarea
          className="form-control"
          id="address"
          name="address"
          value={companyInfo.address}
          onChange={handleInputChange}
          placeholder="Enter your company address"
          rows="3"
        ></textarea>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="taxId">
            Tax ID Number
          </label>
          <input
            type="text"
            className="form-control"
            id="taxId"
            name="taxId"
            value={companyInfo.taxId}
            onChange={handleInputChange}
            placeholder="Enter your tax ID"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="contactEmail">
            Contact Email
          </label>
          <input
            type="email"
            className="form-control"
            id="contactEmail"
            name="contactEmail"
            value={companyInfo.contactEmail}
            onChange={handleInputChange}
            placeholder="Enter contact email"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="contactPhone">
            Contact Phone
          </label>
          <input
            type="tel"
            className="form-control"
            id="contactPhone"
            name="contactPhone"
            value={companyInfo.contactPhone}
            onChange={handleInputChange}
            placeholder="Enter contact phone"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Company Logo</label>
        <div className="logo-upload-container">
          {companyInfo.logo ? (
            <div className="logo-preview">
              <img src={companyInfo.logo} alt="Company Logo" />
              <button
                className="btn btn-sm btn-outline-light"
                onClick={() => setCompanyInfo({ ...companyInfo, logo: null })}
              >
                Remove
              </button>
            </div>
          ) : (
            <div
              className="file-upload"
              onClick={() => document.getElementById("logoUpload").click()}
            >
              <div className="file-upload-icon">
                <i className="fa fa-cloud-upload-alt"></i>
              </div>
              <div className="file-upload-text">
                Drag & drop your logo here or click to browse
              </div>
              <div className="file-upload-hint">
                Recommended size: 200x200px. Max file size: 2MB
              </div>
            </div>
          )}
          <input
            type="file"
            id="logoUpload"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleLogoUpload}
          />
        </div>
      </div>

      <div className="button-group">
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
        <button className="btn btn-outline-light">Cancel</button>
      </div>
    </div>
  );
};

export default CompanyInformation;
