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
  PAYMENT_TERMS_OPTIONS,
  fetchPaymentTerms,
  getPostalLabel,
  getPostalPlaceholder,
  getCountryCode,
  getTaxIdLabel,
  getTaxIdPlaceholder,
  parsePhoneNumber
} from '../../config/lookups';
import {
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
  const [validationTouched, setValidationTouched] = useState({});
  const [paymentTermsOptions, setPaymentTermsOptions] = useState(PAYMENT_TERMS_OPTIONS);
  
  // UI-only state for separated country code and phone number
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");

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

  // UI-only: Split phone into country code and phone number when formData.phone changes
  // This only runs on initial load or when editing an existing client
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
    const { name, value, type, checked } = e.target;
    let processedValue = value;
    let updates = { [name]: type === 'checkbox' ? checked : processedValue };
    
    // Auto-update country code when country is selected
    if (name === 'country') {
      const newCountryCode = getCountryCode(value);
      setCountryCode(newCountryCode);
      // Keep existing phone number, just update country code
      const combinedPhone = phoneNumber ? `${newCountryCode}${phoneNumber}` : newCountryCode;
      updates.phone = combinedPhone;
      // Reset state when country changes to avoid stale values
      updates.state = '';
      // Clear validation errors when country changes
      setErrors((prev) => ({ ...prev, phone: "" }));
    }
    
    // Format phone number as user types - E.164 only (kept for backward compatibility)
    if (name === 'phone') {
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
    if (name === 'zip') {
      processedValue = formatPostalInput(value, formData.country);
      updates.zip = processedValue;
    }
    
    setFormData({
      ...formData,
      ...updates
    });

    // Clear field-specific error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      // Phone validation handled by handlePhoneBlur
      return;
    } else if (name === 'zip') {
      setValidationTouched(prev => ({ ...prev, zip: true }));
      const validation = validateZipCode(value, formData.country);
      setErrors(prev => ({ ...prev, zip: validation.isValid ? '' : validation.message }));
    } else if (name === 'email') {
      setValidationTouched(prev => ({ ...prev, email: true }));
      const validation = validateEmail(value);
      setErrors(prev => ({ ...prev, email: validation.isValid ? '' : validation.message }));
    } else if (name === 'name') {
      setValidationTouched(prev => ({ ...prev, name: true }));
      const validation = validateName(value, 'Client Name');
      setErrors(prev => ({ ...prev, name: validation.isValid ? '' : validation.message }));
    } else if (name === 'contactPerson') {
      setValidationTouched(prev => ({ ...prev, contactPerson: true }));
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

      // Mark all fields as touched on submit
      setValidationTouched({
        phone: true,
        zip: true,
        email: true,
        name: true,
        contactPerson: true
      });

      // Validate critical fields - only validate phone if it has a value beyond country code
      const phoneValidation = (formData.phone && formData.phone !== countryCode)
        ? validatePhoneNumber(formData.phone, formData.country)
        : { isValid: true, message: 'Valid' };
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
      
      // Validate tax ID if provided (optional field)
      if (formData.taxId) {
        const taxErr = validateCountryTaxId(formData.country, formData.taxId);
        if (taxErr) {
          newErrors.taxId = taxErr;
        }
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        const errorFields = Object.keys(newErrors).map(field => {
          const fieldNames = {
            name: 'Client Name',
            contactPerson: 'Contact Person',
            email: 'Email',
            phone: 'Phone',
            zip: 'ZIP/Postal Code'
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
        phone: formData.phone || null,
        billingAddress: billingAddressObj,
        shippingAddress: shippingAddressObj,
        taxId: formData.taxId || null,
        paymentTerms: convertPaymentTermsToInteger(formData.paymentTerms),
        hourlyRate: null,
        status: formData.status,
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
  <div className="min-h-screen bg-slate-50 p-4 md:p-8">
    <div className="mx-auto max-w-8xl">
      
      {/* ================= HEADER (Kept structure, polished styles) ================= */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-indigo-50 p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {mode === "edit" ? "Edit Client" : "Add New Client"}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {mode === "edit"
                ? "Update client details"
                : "Create a new client with contact details"}
            </p>
          </div>
        </div>
      </div>

      {/* ================= MAIN FORM ================= */}
      <div className="relative">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

            {/* ================= LEFT COLUMN ================= */}
            <div className="space-y-8">

              {/* CLIENT INFORMATION CARD */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <header className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-800">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-600">1</span>
                    Client Information
                  </div>
                </header>

                <div className="p-6 grid grid-cols-1 gap-6">
                  {/* Client Name */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Client Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      placeholder="e.g. Acme Corporation"
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

                  {/* Contact Person */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Client SPOC <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      placeholder="John Doe"
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

                  {/* Email */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        placeholder="email@example.com"
                        className={`block w-full rounded-lg border p-2.5 pl-10 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                          errors.email 
                            ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500/10' 
                            : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/10'
                        }`}
                      />
                    </div>
                    {validationTouched.email && errors.email && (
                      <p className="mt-1.5 text-xs font-medium text-red-500">{errors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        className="w-[80px] min-w-[80px] shrink-0 rounded-lg border border-slate-200 bg-slate-100 p-2.5 text-center text-sm font-bold text-slate-600 shadow-sm cursor-not-allowed"
                        value={countryCode}
                        readOnly
                        maxLength="4"
                        title="Country code (auto-filled based on selected country)"
                      />
                      <input
                        type="tel"
                        name="phone"
                        value={phoneNumber}
                        onChange={handlePhoneNumberChange}
                        onBlur={handlePhoneBlur}
                        placeholder="Enter phone number"
                        maxLength="15"
                        className={`block flex-1 rounded-lg border p-2.5 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                          errors.phone 
                            ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500/10' 
                            : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/10'
                        }`}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      Country code updates automatically based on selected country
                    </p>
                    {validationTouched.phone && errors.phone && (
                      <p className="mt-1.5 text-xs font-medium text-red-500">{errors.phone}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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

                    {/* Client Type */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Client Type <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="clientType"
                          value={formData.clientType}
                          onChange={handleChange}
                          required
                          className="block w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                        >
                          {CLIENT_TYPES.map((ct) => (
                            <option key={ct.value} value={ct.value}>
                              {ct.label}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Client Type Helper Text */}
                  <div className="-mt-3 rounded-lg bg-blue-50/50 p-3 text-xs text-blue-700">
                    <i className="fas fa-info-circle mr-1.5"></i>
                    {formData.clientType === "internal"
                      ? "Internal clients allow manual hours & AI upload"
                      : "External clients require uploaded timesheets"}
                  </div>
                </div>
              </section>

              {/* NOTES CARD */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <header className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-800">
                     {/* <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs text-slate-600">
                       <i className="fas fa-sticky-note text-[10px]"></i>
                     </span> */}
                     Additional Notes
                  </div>
                </header>
                <div className="p-6">
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Any additional notes..."
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </section>
            </div>

            {/* ================= RIGHT COLUMN ================= */}
            <div className="space-y-8">

              {/* ADDRESS INFORMATION CARD */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <header className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-800">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-600">2</span>
                    Address Information
                  </div>
                </header>

                <div className="p-6 space-y-6">
                  {/* Address */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Address</label>
                    <input
                      ref={addressInputRef}
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Start typing address"
                      className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* City */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">City</label>
                      <input
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="City"
                        className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                      />
                    </div>
                    {/* State */}
                    <div>
                       <label className="mb-2 block text-sm font-semibold text-slate-700">State</label>
                      <input
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="State"
                        className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                      />
                    </div>
                    
                    {/* Zip Code - Conditional */}
                    {formData.country !== "United Arab Emirates" && (
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Zip / Postal Code</label>
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
                        {validationTouched.zip && errors.zip && (
                          <p className="mt-1.5 text-xs font-medium text-red-500">{errors.zip}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Country Dropdown */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        required
                        className="block w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 shadow-sm transition-all hover:bg-white hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                        style={{ color: '#0f172a', backgroundColor: '#f8fafc' }}
                      >
                        {COUNTRY_OPTIONS.map((country) => (
                          <option key={country} value={country} style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>
                            {country}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      Changing country will update the phone number country code
                    </p>
                  </div>
                </div>
              </section>
            </div>

          </div>

          {/* ================= ACTION BUTTONS ================= */}
          <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-indigo-600 focus:outline-none focus:ring-4 focus:ring-slate-100 w-full sm:w-auto"
              onClick={() => router.push(`/${subdomain}/clients`)}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-70 disabled:shadow-none w-full sm:w-auto"
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
        </form>
      </div>

    </div>
  </div>
</PermissionGuard>
  );
};

export default ClientForm;
