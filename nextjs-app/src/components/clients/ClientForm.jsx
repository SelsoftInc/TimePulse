'use client';

import { useRouter, useParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { PERMISSIONS } from '@/utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import './Clients.css';
import { PAYMENT_METHODS, CURRENCIES, CLIENT_TYPES } from '@/constants/lookups';
import { formatPhoneInput } from '@/utils/validation';
import { validatePhoneNumber, validateZipCode, validateEmail, validateName } from '@/utils/validations';
import { apiFetch } from '@/config/api';
import {
  COUNTRY_OPTIONS,
  STATES_BY_COUNTRY,
  TAX_ID_LABELS,
  TAX_ID_PLACEHOLDERS,
  PAYMENT_TERMS_OPTIONS,
  fetchPaymentTerms,
  getPostalLabel,
  getPostalPlaceholder,
  validateCountryTaxId
} from '../../config/lookups';

const ClientForm = ({ mode = 'create', initialData = null, onSubmitOverride = null, submitLabel }) => {
  const router = useRouter();
  const { subdomain } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const addressInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  
  // Hydration fix: Track if component is mounted on client
  const [isMounted, setIsMounted] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ phone: '', taxId: '' });
  const [paymentTermsOptions, setPaymentTermsOptions] = useState(PAYMENT_TERMS_OPTIONS);

  // Hydration fix: Set mounted state on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    status: 'active',
    clientType: 'external',
    notes: '',
    // Billing Information
    billingAddress: '',
    billingAddressSameAsMain: true,
    paymentTerms: 'net30',
    paymentMethod: 'Bank Transfer',
    bankDetails: '',
    taxId: '',
    vatNumber: '',
    currency: 'USD'
  });

  // Prefill when in edit mode
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        name: initialData.name || prev.name,
        contactPerson: initialData.contactPerson || prev.contactPerson,
        email: initialData.email || prev.email,
        phone: initialData.phone || prev.phone,
        address: initialData.billingAddress?.line1 || prev.address,
        city: initialData.billingAddress?.city || prev.city,
        state: initialData.billingAddress?.state || prev.state,
        zip: initialData.billingAddress?.zip || prev.zip,
        country: initialData.billingAddress?.country || prev.country,
        status: initialData.status || prev.status,
        clientType: initialData.clientType || prev.clientType,
        paymentTerms: (initialData.paymentTerms === 60
          ? 'net60'
          : initialData.paymentTerms === 90
            ? 'net90'
            : 'net30'),
        paymentMethod: initialData.paymentMethod || prev.paymentMethod,
        bankDetails: initialData.bankDetails || prev.bankDetails,
        taxId: initialData.taxId || prev.taxId,
        vatNumber: initialData.vatNumber || prev.vatNumber,
        currency: initialData.currency || prev.currency}));
    }
  }, [initialData]);

  // Load payment terms from API
  useEffect(() => {
    const loadPaymentTerms = async () => {
      const terms = await fetchPaymentTerms();
      setPaymentTermsOptions(terms);
    };
    loadPaymentTerms();
  }, []);

  // Load Google Places script and wire Autocomplete to address field
  useEffect(() => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || process.env.REACT_APP_GOOGLE_PLACES_API_KEY;
    if (!addressInputRef.current) return;

    function initAutocomplete() {
      if (!window.google || !window.google.maps || !window.google.maps.places) return;
      if (autocompleteRef.current) return; // already initialized
      const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
        types: ['geocode'],
        fields: ['address_components', 'formatted_address']
      });
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place || !place.address_components) return;
        const comps = place.address_components;
        const get = (type) => comps.find(c => c.types.includes(type));
        const streetNumber = get('street_number')?.long_name || '';
        const route = get('route')?.long_name || '';
        const city = get('locality')?.long_name || get('sublocality_level_1')?.long_name || '';
        const state = get('administrative_area_level_1')?.short_name || '';
        const zip = get('postal_code')?.long_name || '';
        const country = get('country')?.long_name;
        setFormData(prev => ({
          ...prev,
          address: [streetNumber, route].filter(Boolean).join(' ').trim() || place.formatted_address || prev.address,
          city: city || prev.city,
          state: state || prev.state,
          zip: zip || prev.zip,
          country: country || prev.country
        }));
      });
      autocompleteRef.current = autocomplete;
    }

    if (window.google && window.google.maps && window.google.maps.places) {
      initAutocomplete();
      return;
    }

    if (!apiKey) return; // graceful fallback without autocomplete

    const scriptId = 'google-places-script';
    if (document.getElementById(scriptId)) {
      // Another page loaded it already; wait a bit and init
      const t = setTimeout(initAutocomplete, 300);
      return () => clearTimeout(t);
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initAutocomplete;
    document.body.appendChild(script);
    return () => {
      // No cleanup of script to allow reuse across pages
    };
  }, [addressInputRef]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Reset state when country changes to avoid stale values
    if (name === 'country') {
      setFormData({ ...formData, country: value, state: '' });
      return;
    }
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // Clear field-specific error on change
    if (name === 'phone' && errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
    if (name === 'taxId' && errors.taxId) {
      setErrors(prev => ({ ...prev, taxId: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const validation = validatePhoneNumber(value);
      setErrors(prev => ({ ...prev, phone: validation.isValid ? '' : validation.message }));
    } else if (name === 'taxId') {
      const msg = validateCountryTaxId(formData.country, value);
      setErrors(prev => ({ ...prev, taxId: msg }));
    } else if (name === 'zip') {
      const validation = validateZipCode(value);
      setErrors(prev => ({ ...prev, zip: validation.isValid ? '' : validation.message }));
    } else if (name === 'email') {
      const validation = validateEmail(value);
      setErrors(prev => ({ ...prev, email: validation.isValid ? '' : validation.message }));
    } else if (name === 'clientName') {
      const validation = validateName(value, 'Client Name');
      setErrors(prev => ({ ...prev, clientName: validation.isValid ? '' : validation.message }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const tenantId = user?.tenantId;
      if (!tenantId) throw new Error('No tenant information');

      // Validate critical fields
      const phoneValidation = validatePhoneNumber(formData.phone);
      const taxErr = validateCountryTaxId(formData.country, formData.taxId);
      const zipValidation = validateZipCode(formData.zip);
      const emailValidation = validateEmail(formData.email);
      const nameValidation = validateName(formData.clientName, 'Client Name');
      
      const newErrors = {};
      if (!phoneValidation.isValid) newErrors.phone = phoneValidation.message;
      if (taxErr) newErrors.taxId = taxErr;
      if (!zipValidation.isValid) newErrors.zip = zipValidation.message;
      if (!emailValidation.isValid) newErrors.email = emailValidation.message;
      if (!nameValidation.isValid) newErrors.clientName = nameValidation.message;
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setLoading(false);
        return;
      }

      // Build payload matching backend model fields
      const mainAddressObj = {
        line1: formData.address || '',
        city: formData.city || '',
        state: formData.state || '',
        zip: formData.zip || '',
        country: formData.country || 'United States'
      };

      const billingAddressObj = formData.billingAddressSameAsMain
        ? mainAddressObj
        : { line1: formData.billingAddress || '', city: '', state: '', zip: '', country: formData.country || 'United States' };

      const shippingAddressObj = billingAddressObj; // keep same for now

      const payload = {
        tenantId,
        clientName: formData.name,
        legalName: formData.name,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        billingAddress: billingAddressObj,
        shippingAddress: shippingAddressObj,
        taxId: formData.taxId || null,
        paymentTerms: formData.paymentTerms === 'net60' ? 60 : formData.paymentTerms === 'net90' ? 90 : 30,
        hourlyRate: null,
        status: formData.status,
        // clientType may or may not exist in schema; include if supported server-side
        clientType: formData.clientType
      };
      if (onSubmitOverride) {
        await onSubmitOverride(payload);
      } else {
        const resp = await apiFetch(`/api/clients`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(payload)
        }, { timeoutMs: 15000 });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.details || `Create failed with status ${resp.status}`);
        }
        // Navigate to clients list
        router.push(`/${subdomain}/clients`);
      }
    } catch (err) {
      console.error(`Failed to ${mode === 'edit' ? 'update' : 'create'} client:`, err);
      toast.error(err.message, {
        title: `Failed to ${mode === 'edit' ? 'Update' : 'Create'} Client`
      });
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
    <PermissionGuard requiredPermission={mode === 'edit' ? PERMISSIONS.EDIT_CLIENT : PERMISSIONS.CREATE_CLIENT}>
      <div className="nk-conten">
        <div className="container-fluid">
          <div className="nk-block-head">
            <div className="nk-block-between">
              <div className="nk-block-head-content">
                <h3 className="nk-block-title">{mode === 'edit' ? 'Edit Client' : 'Add New Client'}</h3>
                <p className="nk-block-subtitle">{mode === 'edit' ? 'Update client information' : 'Create a new client record'}</p>
              </div>
            </div>
          </div>

          <div className="nk-block">
            <div className="card card-bordered">
              <div className="card-inne">
                <form onSubmit={handleSubmit}>
                  <div className="row g-4">
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="name">Client Name*</label>
                        <input
                          type="text"
                          className="form-control"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Enter client name"
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
                          onChange={(e) => {
                            const formatted = formatPhoneInput(e.target.value);
                            setFormData(prev => ({ ...prev, phone: formatted }));
                            if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                          }}
                          onBlur={handleBlur}
                          inputMode="tel"
                          maxLength={20}
                          placeholder="Enter phone number"
                          required
                        />
                        {errors.phone && (
                          <div className="mt-1"><small className="text-danger">{errors.phone}</small></div>
                        )}
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <div className="form-group">
                        <label className="form-label" htmlFor="address">Address</label>
                        <input
                          ref={addressInputRef}
                          type="text"
                          className="form-control"
                          id="address"
                          name="address"
                          autoComplete="street-address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="Start typing an address"
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
                        <label className="form-label" htmlFor="state">State/Province</label>
                        {STATES_BY_COUNTRY[formData.country] ? (
                          <select
                            className="form-select"
                            id="state"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                          >
                            <option value="" disabled>Select state</option>
                            {STATES_BY_COUNTRY[formData.country].map((s) => (
                              <option key={s} value={s}>{s}</option>
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
                          onBlur={handleBlur}
                          placeholder={getPostalPlaceholder(formData.country)}
                          maxLength={formData.country === 'United States' ? 5 : 10}
                        />
                        {errors.zip && (
                          <div className="mt-1"><small className="text-danger">{errors.zip}</small></div>
                        )}
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
                          <option value="pending">Pending</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="clientType">Client Type*</label>
                        <select
                          className="form-select"
                          id="clientType"
                          name="clientType"
                          value={formData.clientType}
                          onChange={handleChange}
                          required
                        >
                          {CLIENT_TYPES.map(ct => (
                            <option key={ct.value} value={ct.value}>{ct.label}</option>
                          ))}
                        </select>
                        <div className="form-note mt-2">
                          <small>
                            {formData.clientType === 'internal' 
                              ? 'Internal clients allow manual hour entry and AI timesheet upload'
                              : 'External clients require uploading client-submitted timesheet files'
                            }
                          </small>
                        </div>
                      </div>
                    </div>
                    
                    {/* Billing & Payment Information Section */}
                    <div className="col-12">
                      <hr className="my-4" />
                      <h5 className="mb-3">
                        <em className="icon ni ni-credit-card mr-2"></em>
                        Billing & Payment Information
                      </h5>
                    </div>
                    
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="paymentTerms">Payment Term*</label>
                        <select
                          className="form-select"
                          id="paymentTerms"
                          name="paymentTerms"
                          value={formData.paymentTerms}
                          onChange={handleChange}
                          required
                        >
                          {paymentTermsOptions.map(pt => (
                            <option key={pt.value} value={pt.value}>{pt.label}</option>
                          ))}
                        </select>
                        <small className="text-muted">Invoices are generated after timesheet approval. Invoice cycle determines when an invoice is created (e.g., Net 30 = monthly after approval).</small>
                      </div>
                    </div>
                    
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="paymentMethod">Payment Method*</label>
                        <select
                          className="form-select"
                          id="paymentMethod"
                          name="paymentMethod"
                          value={formData.paymentMethod}
                          onChange={handleChange}
                          required
                        >
                          {PAYMENT_METHODS.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="currency">Currency*</label>
                        <select
                          className="form-select"
                          id="currency"
                          name="currency"
                          value={formData.currency}
                          onChange={handleChange}
                          required
                        >
                          {CURRENCIES.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="taxId">{TAX_ID_LABELS[formData.country] || 'Tax ID'}*</label>
                        <input
                          type="text"
                          className="form-control"
                          id="taxId"
                          name="taxId"
                          value={formData.taxId}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, taxId: e.target.value }));
                            if (errors.taxId) setErrors(prev => ({ ...prev, taxId: '' }));
                          }}
                          onBlur={handleBlur}
                          placeholder={TAX_ID_PLACEHOLDERS[formData.country] || 'Enter tax identifier'}
                          required
                        />
                        <small className="text-muted">This identifier varies by country (e.g., EIN in US, GSTIN in India, VAT in UK).</small>
                        {errors.taxId && (
                          <div className="mt-1"><small className="text-danger">{errors.taxId}</small></div>
                        )}
                      </div>
                    </div>
                    
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="vatNumber">VAT Number</label>
                        <input
                          type="text"
                          className="form-control"
                          id="vatNumber"
                          name="vatNumber"
                          value={formData.vatNumber}
                          onChange={handleChange}
                          placeholder="Enter VAT Number (if applicable)"
                        />
                      </div>
                    </div>
                    
                    {(formData.paymentMethod === 'Bank Transfer' || formData.paymentMethod === 'Wire Transfer') && (
                      <div className="col-12">
                        <div className="form-group">
                          <label className="form-label" htmlFor="bankDetails">Bank Details</label>
                          <textarea
                            className="form-control"
                            id="bankDetails"
                            name="bankDetails"
                            value={formData.bankDetails}
                            onChange={handleChange}
                            placeholder="Enter bank details (Bank name, Account number, Routing number, etc.)"
                            rows="3"
                          ></textarea>
                        </div>
                      </div>
                    )}
                    
                    <div className="col-12">
                      <div className="form-group">
                        <div className="custom-control custom-checkbox">
                          <input
                            type="checkbox"
                            className="custom-control-input"
                            id="billingAddressSameAsMain"
                            name="billingAddressSameAsMain"
                            checked={formData.billingAddressSameAsMain}
                            onChange={handleChange}
                          />
                          <label className="custom-control-label" htmlFor="billingAddressSameAsMain">
                            Billing address is the same as main address
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {!formData.billingAddressSameAsMain && (
                      <div className="col-12">
                        <div className="form-group">
                          <label className="form-label" htmlFor="billingAddress">Billing Address*</label>
                          <textarea
                            className="form-control"
                            id="billingAddress"
                            name="billingAddress"
                            value={formData.billingAddress}
                            onChange={handleChange}
                            placeholder="Enter billing address"
                            rows="3"
                            required={!formData.billingAddressSameAsMain}
                          ></textarea>
                        </div>
                      </div>
                    )}
                    
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
                        <button type="submit" className="btn btn-primary btn-create-client" disabled={loading}>
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm mr-1" role="status" aria-hidden="true"></span>
                              {mode === 'edit' ? 'Saving...' : 'Creating...'}
                            </>
                          ) : (
                            submitLabel || (mode === 'edit' ? 'Save Changes' : 'Create Client')
                          )}
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-outline-light ml-3"
                          onClick={() => router.push(`/${subdomain}/clients`)}
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

export default ClientForm;
