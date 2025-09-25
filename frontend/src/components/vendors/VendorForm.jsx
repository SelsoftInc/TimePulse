import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE } from '../../config/api';
import {
  COUNTRY_OPTIONS,
  STATES_BY_COUNTRY,
  TAX_ID_LABELS,
  TAX_ID_PLACEHOLDERS,
  PAYMENT_TERMS_OPTIONS,
  getPostalLabel,
  getPostalPlaceholder,
  validateCountryTaxId
} from '../../config/lookups';
import { PERMISSIONS } from '../../utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import './Vendors.css';

const VendorForm = ({ mode = 'create', initialData = null, onSubmitOverride = null, submitLabel = null }) => {
  const navigate = useNavigate();
  const { subdomain } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    taxId: '', // not sent to backend currently
    vendorType: 'consultant', // mapped to category
    paymentTerms: 'net30',
    status: 'active',
    notes: ''
  });
  
  const [contractFile, setContractFile] = useState(null);
  const [contractPreview, setContractPreview] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'country') {
      // Reset state when country changes
      setFormData({ ...formData, country: value, state: '' });
      return;
    }
    setFormData({
      ...formData,
      [name]: value
    });
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

  // Prefill when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        contactPerson: initialData.contactPerson || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        city: initialData.city || '',
        state: initialData.state || '',
        zip: initialData.zip || '',
        country: initialData.country || 'United States',
        taxId: '',
        vendorType: initialData.category || 'consultant',
        paymentTerms: initialData.paymentTerms || 'net30',
        status: initialData.status || 'active',
        notes: initialData.notes || ''
      });
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      // Country-specific tax id validation
      const taxErr = validateCountryTaxId(formData.country, formData.taxId);
      if (taxErr) {
        setError(taxErr);
        setLoading(false);
        return;
      }
      if (!user?.tenantId) {
        setError('No tenant information available');
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
          status: formData.status || 'active',
          address: formData.address.trim() || null,
          city: formData.city.trim() || null,
          state: formData.state.trim() || null,
          zip: formData.zip.trim() || null,
          country: formData.country.trim() || null,
          website: initialData?.website ?? null,
          paymentTerms: formData.paymentTerms || null,
          contractStart: initialData?.contractStart ?? null,
          contractEnd: initialData?.contractEnd ?? null,
          notes: formData.notes || null
        };
        await onSubmitOverride(payload);
        toast.success('Vendor updated');
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
        status: formData.status || 'active',
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        zip: formData.zip.trim() || null,
        country: formData.country.trim() || null,
        website: null,
        paymentTerms: formData.paymentTerms || null,
        contractStart: null,
        contractEnd: null,
        notes: formData.notes || null
      };

      const resp = await fetch(`${API_BASE}/api/vendors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.details ? JSON.stringify(err.details) : `Create failed with status ${resp.status}`);
      }
      toast.success('Vendor created');
      navigate(`/${subdomain}/vendors`);
    } catch (err) {
      console.error('Create vendor failed:', err);
      setError(err.message || 'Failed to create vendor');
      toast.error(err.message || 'Failed to save vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PermissionGuard requiredPermission={PERMISSIONS.CREATE_VENDOR}>
      <div className="nk-conten">
        <div className="container-fluid">
          <div className="nk-block-head">
            <div className="nk-block-between">
              <div className="nk-block-head-content">
                <h3 className="nk-block-title">Add New Vendor</h3>
                <p className="nk-block-subtitle">Create a new vendor record</p>
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
                        <label className="form-label" htmlFor="name">Vendor Name*</label>
                        <input
                          type="text"
                          className="form-control"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Enter vendor name"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="contactPerson">Contact Person*</label>
                        <input
                          type="text"
                          className="form-control"
                          id="contactPerson"
                          name="contactPerson"
                          value={formData.contactPerson}
                          onChange={handleChange}
                          placeholder="Enter contact person name"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="email">Email Address*</label>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter email address"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="phone">Phone Number*</label>
                        <input
                          type="tel"
                          className="form-control"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Enter phone number"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <div className="form-group">
                        <label className="form-label" htmlFor="address">Address</label>
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
                        <label className="form-label" htmlFor="city">City</label>
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
                        <label className="form-label" htmlFor="state">State</label>
                        {STATES_BY_COUNTRY[formData.country] && STATES_BY_COUNTRY[formData.country].length > 0 ? (
                          <select
                            className="form-select"
                            id="state"
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
                        <label className="form-label" htmlFor="zip">{getPostalLabel(formData.country)}</label>
                        <input
                          type="text"
                          className="form-control"
                          id="zip"
                          name="zip"
                          value={formData.zip}
                          onChange={handleChange}
                          placeholder={getPostalPlaceholder(formData.country)}
                        />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="country">Country</label>
                        <select
                          className="form-select"
                          id="country"
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
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="taxId">{TAX_ID_LABELS[formData.country] || 'Tax ID'}</label>
                        <input
                          type="text"
                          className="form-control"
                          id="taxId"
                          name="taxId"
                          value={formData.taxId}
                          onChange={handleChange}
                          placeholder={TAX_ID_PLACEHOLDERS[formData.country] || 'Enter tax identifier'}
                        />
                        <small className="text-muted">This identifier varies by country (e.g., EIN in US, GSTIN in India, VAT in UK).</small>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="vendorType">Vendor Type*</label>
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
                        <label className="form-label" htmlFor="paymentTerms">Invoice Cycle*</label>
                        <select
                          className="form-select"
                          id="paymentTerms"
                          name="paymentTerms"
                          value={formData.paymentTerms}
                          onChange={handleChange}
                          required
                        >
                          {PAYMENT_TERMS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <small className="text-muted">Invoices are generated after timesheet approval. Invoice cycle controls when the invoice is created (e.g., Net 30).</small>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="status">Status</label>
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
                        <label className="form-label">Contract / Agreement</label>
                        <div className="form-control-wrap">
                          <div className="custom-file">
                            <input
                              type="file"
                              className="custom-file-input"
                              id="contractFile"
                              accept=".pdf,.doc,.docx"
                              onChange={handleFileChange}
                            />
                            <label className="custom-file-label" htmlFor="contractFile">
                              {contractFile ? contractFile.name : 'Choose file'}
                            </label>
                          </div>
                        </div>
                        <small className="text-muted">Upload vendor contract or agreement (PDF, DOC, DOCX)</small>
                        
                        {contractPreview && (
                          <div className="document-preview mt-3">
                            <p>Document uploaded: {contractFile.name}</p>
                            {contractFile.type.includes('image') ? (
                              <img 
                                src={contractPreview} 
                                alt="Contract Preview" 
                                style={{ maxWidth: '100%', maxHeight: '200px' }} 
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
                        <label className="form-label" htmlFor="notes">Notes</label>
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
                        <button type="submit" className="btn btn-primary btn-create-vendor" disabled={loading}>
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm mr-1" role="status" aria-hidden="true"></span>
                              {mode === 'edit' ? 'Saving...' : 'Creating...'}
                            </>
                          ) : (
                            submitLabel || (mode === 'edit' ? 'Save Changes' : 'Create Vendor')
                          )}
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-outline-light ml-3"
                          onClick={() => navigate(`/${subdomain}/vendors`)}
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
