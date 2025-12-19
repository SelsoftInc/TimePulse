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
import { validatePhoneNumber, validateZipCode, validateEmail, validateName, formatPostalInput } from '@/utils/validations';
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
import {
  getCountryCode,
  getPhonePlaceholder,
  validatePhoneForCountry,
  formatPhoneWithCountryCode,
  extractPhoneNumber
} from '@/config/countryPhoneCodes';

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

  // Track country code separately for display
  const [phoneCountryCode, setPhoneCountryCode] = useState('+1');

  // Prefill when in edit mode
  useEffect(() => {
    if (initialData) {
      const country = initialData.billingAddress?.country || 'United States';
      const countryCode = getCountryCode(country);
      setPhoneCountryCode(countryCode);
      
      setFormData(prev => ({
        ...prev,
        name: initialData.name || prev.name,
        contactPerson: initialData.contactPerson || prev.contactPerson,
        email: initialData.email || prev.email,
        phone: initialData.phone ? extractPhoneNumber(initialData.phone, country) : prev.phone,
        address: initialData.billingAddress?.line1 || prev.address,
        city: initialData.billingAddress?.city || prev.city,
        state: initialData.billingAddress?.state || prev.state,
        zip: initialData.billingAddress?.zip || prev.zip,
        country: country,
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

  // Helper function to convert payment terms code to integer
  const convertPaymentTermsToInteger = (code) => {
    // Handle both old format (net30, net60, net90) and new database codes
    if (!code) return 30; // Default
    
    // Extract number from code (e.g., "net30" -> 30, "net_30" -> 30, "due_on_receipt" -> 0)
    if (code === 'due_on_receipt' || code === 'immediate') return 0;
    
    const match = code.match(/(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
    
    // Fallback to 30 days
    return 30;
  };

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
    let updates = { [name]: type === 'checkbox' ? checked : value };
    
    // Auto-prefill country code when country changes
    if (name === 'country') {
      const countryCode = getCountryCode(value);
      if (!formData.phone || /^\+\d{0,3}$/.test(formData.phone)) {
        updates.phone = countryCode;
      }
      // Reset state when country changes to avoid stale values
      updates.state = '';
    }
    
    setFormData({
      ...formData,
      ...updates
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
      const validation = validatePhoneForCountry(value, formData.country);
      setErrors(prev => ({ ...prev, phone: validation.isValid ? '' : validation.message }));
    } else if (name === 'zip') {
      const validation = validateZipCode(value, formData.country);
      setErrors(prev => ({ ...prev, zip: validation.isValid ? '' : validation.message }));
    } else if (name === 'email') {
      const validation = validateEmail(value);
      setErrors(prev => ({ ...prev, email: validation.isValid ? '' : validation.message }));
    } else if (name === 'name') {
      const validation = validateName(value, 'Client Name');
      setErrors(prev => ({ ...prev, name: validation.isValid ? '' : validation.message }));
    } else if (name === 'contactPerson') {
      const validation = validateName(value, 'Contact Person', { requireAtLeastTwoWords: true });
      setErrors(prev => ({ ...prev, contactPerson: validation.isValid ? '' : validation.message }));
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
      const zipValidation = formData.zip
        ? validateZipCode(formData.zip, formData.country)
        : { isValid: true, message: 'Valid' };
      const emailValidation = validateEmail(formData.email);
      const nameValidation = validateName(formData.name, 'Client Name');
      const contactValidation = validateName(formData.contactPerson, 'Contact Person', { requireAtLeastTwoWords: true });
      
      const newErrors = {};
      if (!phoneValidation.isValid) newErrors.phone = phoneValidation.message;
      if (!zipValidation.isValid) newErrors.zip = zipValidation.message;
      if (!emailValidation.isValid) newErrors.email = emailValidation.message;
      if (!nameValidation.isValid) newErrors.name = nameValidation.message;
      if (!contactValidation.isValid) newErrors.contactPerson = contactValidation.message;
      
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
        name: formData.name,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formatPhoneWithCountryCode(formData.phone, formData.country),
        billingAddress: billingAddressObj,
        shippingAddress: shippingAddressObj,
        taxId: formData.taxId || null,
        paymentTerms: convertPaymentTermsToInteger(formData.paymentTerms),
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
        
        const result = await resp.json();
        toast.success('Client created successfully', {
          title: 'Success'
        });
        
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
     <div className="nk-content min-h-screen bg-slate-50">
        <div className="container-fluid">
          <div className="nk-content-inner">
      <div className="nk-content-body py-6">
             <div className="mb-6 rounded-xl border border-slate-200 bg-indigo-50 p-5 shadow-sm">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    
    {/* LEFT */}
    <div>
      <h1 className="text-xl font-semibold text-slate-900">
        {mode === "edit" ? "Edit Client" : "Add New Client"}
      </h1>

      <p className="mt-1 text-sm text-slate-600">
        {mode === "edit"
          ? "Update client details, billing, and payment information"
          : "Create a new client with contact, billing, and payment details"}
      </p>
    </div>
    </div>
    </div>

              {/* <div className="px-6 py-6 sm:px-8"> */}
                <div className="nk-block">
                  <div className="space-y-6">
                    <form onSubmit={handleSubmit}>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                       {/* <div className="grid grid-cols-1 gap-6 lg:grid-cols-2"> */}

  {/* ================= LEFT COLUMN ================= */}
  <div className="space-y-6">

    {/* CLIENT INFORMATION */}
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="rounded-t-xl border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h4 className="text-sm font-semibold text-slate-900">
          Client Information
        </h4>
      </header>

      <div className="p-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Client Name */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Client Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g. Acme Corporation"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                       focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        {/* Contact Person */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Contact Person <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="contactPerson"
            value={formData.contactPerson}
            onChange={handleChange}
            required
            placeholder="John Doe"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                       focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        {/* Email */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="email@example.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                       focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => {
              const formatted = formatPhoneInput(e.target.value);
              setFormData((p) => ({ ...p, phone: formatted }));
            }}
            required
            placeholder="+1 555 123 4567"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                       focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                       focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Client Type */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Client Type <span className="text-red-500">*</span>
          </label>
          <select
            name="clientType"
            value={formData.clientType}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                       focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
            {CLIENT_TYPES.map((ct) => (
              <option key={ct.value} value={ct.value}>
                {ct.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            {formData.clientType === "internal"
              ? "Internal clients allow manual hours & AI upload"
              : "External clients require uploaded timesheets"}
          </p>
        </div>
      </div>
    </section>

    {/* NOTES */}
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="rounded-t-xl border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h4 className="text-sm font-semibold text-slate-900">Notes</h4>
      </header>
      <div className="p-6">
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={4}
          placeholder="Any additional notes..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                     focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
      </div>
    </section>
  </div>

  {/* ================= RIGHT COLUMN ================= */}
  <div className="space-y-6">

    {/* ADDRESS INFORMATION */}
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="rounded-t-xl border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h4 className="text-sm font-semibold text-slate-900">
          Address Information
        </h4>
      </header>

      <div className="p-6 space-y-4">
        <input
          ref={addressInputRef}
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Start typing address"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                     focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <input
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="City"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="State"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="zip"
            value={formData.zip}
            onChange={handleChange}
            placeholder="ZIP / Postal"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
    </section>
  </div>

  {/* ================= ACTION BUTTONS ================= */}
  <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-end">
    <button
      type="button"
      className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 focus:z-10 focus:outline-none focus:ring-4 focus:ring-slate-100 w-full sm:w-auto"
      onClick={() => router.push(`/${subdomain}/clients`)}
    >
      Cancel
    </button>

    <button
      type="submit"
      className="inline-flex items-center justify-center rounded-lg bg-sky-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-70 w-full sm:w-auto"
      disabled={loading}
    >
      {loading ? (
        <>
          <svg className="mr-2 h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {mode === 'edit' ? 'Saving...' : 'Creating...'}
        </>
      ) : (
        submitLabel || (mode === 'edit' ? 'Save Changes' : 'Add New Client')
      )}
    </button>
  </div>

                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </PermissionGuard>
  );
};

export default ClientForm;
