'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import PermissionGuard from '../common/PermissionGuard';
import { PERMISSIONS } from '@/utils/roles';
import { API_BASE } from '@/config/api';
import { decryptApiResponse } from '@/utils/encryption';
import {
  COUNTRY_OPTIONS,
  STATES_BY_COUNTRY,
  getPostalLabel,
  getPostalPlaceholder,
  getCountryCode
} from '../../config/lookups';
import {
  validatePhoneNumber,
  validateZipCode,
  validateEmail,
  validateName,
  formatPostalInput
} from '@/utils/validations';
import './Employees.css';

const EmployeeEdit = () => {
  const { subdomain, id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [initialEmployee, setInitialEmployee] = useState(null);
  const [clients, setClients] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [implPartners, setImplPartners] = useState([]);
  const [approvers, setApprovers] = useState([]);
  const tenantId = user?.tenantId;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    department: '',
    startDate: '',
    endDate: '',
    clientId: '',
    vendorId: '',
    implPartnerId: '',
    hourlyRate: '',
    salaryAmount: '',
    salaryType: 'hourly',
    status: 'active',
    overtimeRate: '',
    enableOvertime: false,
    overtimeMultiplier: 1.5,
    approver: '',
    notes: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States'
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch employee data
  useEffect(() => {
    if (!isMounted) return;
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        setError('');
        if (!tenantId) throw new Error('No tenant information');
        
        const resp = await fetch(`${API_BASE}/api/employees/${id}?tenantId=${tenantId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.details || `Fetch failed with status ${resp.status}`);
        }
        
        const rawData = await resp.json();
        const data = decryptApiResponse(rawData);
        const emp = data?.employee || data;
        setInitialEmployee(emp);
        
        let contactInfo = {};
        if (emp.contactInfo) {
          try {
            contactInfo = typeof emp.contactInfo === 'string' 
              ? JSON.parse(emp.contactInfo) 
              : emp.contactInfo;
          } catch (e) {
            console.error('Failed to parse contactInfo:', e);
          }
        }
        
        console.log('📋 Employee data loaded:', {
          id: emp.id,
          vendorId: emp.vendorId,
          clientId: emp.clientId,
          implPartnerId: emp.implPartnerId,
          contactInfo: contactInfo
        });
        
        setFormData({
          firstName: emp.firstName || '',
          lastName: emp.lastName || '',
          email: emp.email || '',
          phone: emp.phone || '',
          title: emp.title || '',
          department: emp.department || '',
          startDate: emp.startDate ? new Date(emp.startDate).toISOString().slice(0,10) : '',
          endDate: emp.endDate ? new Date(emp.endDate).toISOString().slice(0,10) : '',
          clientId: emp.clientId || '',
          vendorId: emp.vendorId || '',
          implPartnerId: emp.implPartnerId || '',
          hourlyRate: emp.hourlyRate || '',
          salaryAmount: emp.salaryAmount || '',
          salaryType: emp.salaryType || 'hourly',
          status: emp.status || 'active',
          overtimeRate: emp.overtimeRate || '',
          enableOvertime: emp.enableOvertime || false,
          overtimeMultiplier: emp.overtimeMultiplier || 1.5,
          approver: emp.approver || '',
          notes: emp.notes || '',
          address: contactInfo.address || '',
          city: contactInfo.city || '',
          state: contactInfo.state || '',
          zip: contactInfo.zip || '',
          country: contactInfo.country || 'United States'
        });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [isMounted, id, tenantId]);

  // Fetch clients, vendors, implementation partners, and approvers
  useEffect(() => {
    if (!isMounted || !tenantId) return;
    
    const fetchData = async () => {
      try {
        const clientsResp = await fetch(`${API_BASE}/api/clients?tenantId=${tenantId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (clientsResp.ok) {
          const clientsData = await clientsResp.json();
          setClients(clientsData.clients || []);
        }
        
        const vendorsResp = await fetch(`${API_BASE}/api/vendors?tenantId=${tenantId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (vendorsResp.ok) {
          const rawVendorsData = await vendorsResp.json();
          console.log('📦 Raw vendors response:', rawVendorsData);
          
          // Decrypt the response if encrypted
          const vendorsData = decryptApiResponse(rawVendorsData);
          console.log('🔓 Decrypted vendors data:', vendorsData);
          
          const vendorsList = vendorsData.vendors || [];
          console.log('📦 Vendors loaded:', vendorsList.length);
          setVendors(vendorsList);
        }
        
        const implPartnersResp = await fetch(`${API_BASE}/api/implementation-partners?tenantId=${tenantId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (implPartnersResp.ok) {
          const implPartnersData = await implPartnersResp.json();
          const implPartnersList = implPartnersData.implementationPartners || [];
          console.log('🤝 Implementation partners loaded:', implPartnersList.length);
          setImplPartners(implPartnersList);
        }
        
        const approversResp = await fetch(`${API_BASE}/api/approvers?tenantId=${tenantId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (approversResp.ok) {
          const approversData = await approversResp.json();
          setApprovers(approversData.approvers || approversData || []);
        }
      } catch (e) {
        console.error('Failed to fetch dropdown data:', e);
      }
    };
    
    fetchData();
  }, [isMounted, tenantId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = type === 'checkbox' ? checked : value;
    let updates = { [name]: processedValue };

    if (name === 'country') {
      const countryCode = getCountryCode(value);
      if (!formData.phone || /^\+\d{0,3}$/.test(formData.phone)) {
        updates.phone = countryCode;
      }
      updates.state = '';
    }

    if (name === 'phone') {
      const trimmed = String(value || '');
      if (trimmed.startsWith('+') || trimmed === '') {
        const digits = trimmed.replace(/\D/g, '').slice(0, 15);
        processedValue = digits ? `+${digits}` : (trimmed === '+' ? '+' : '');
      } else if (/^\d/.test(trimmed)) {
        const digits = trimmed.replace(/\D/g, '').slice(0, 15);
        processedValue = digits ? `+${digits}` : '';
      } else {
        processedValue = trimmed.startsWith('+') ? trimmed : '';
      }
      updates.phone = processedValue;
    }

    if (name === 'zip') {
      processedValue = formatPostalInput(value, formData.country);
      updates.zip = processedValue;
    }

    setFormData({ ...formData, ...updates });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    if (name === 'phone' && value) {
      const validation = validatePhoneNumber(value);
      setErrors((prev) => ({
        ...prev,
        phone: validation.isValid ? '' : validation.message
      }));
    } else if (name === 'zip' && value) {
      const validation = validateZipCode(value, formData.country);
      setErrors((prev) => ({
        ...prev,
        zip: validation.isValid ? '' : validation.message
      }));
    } else if (name === 'email') {
      const validation = validateEmail(value);
      setErrors((prev) => ({
        ...prev,
        email: validation.isValid ? '' : validation.message
      }));
    } else if (name === 'firstName') {
      const validation = validateName(value, 'First Name');
      setErrors((prev) => ({
        ...prev,
        firstName: validation.isValid ? '' : validation.message
      }));
    } else if (name === 'lastName') {
      const validation = validateName(value, 'Last Name');
      setErrors((prev) => ({
        ...prev,
        lastName: validation.isValid ? '' : validation.message
      }));
    }
  };

  const handleUpdate = async () => {
    const phoneValidation = formData.phone ? validatePhoneNumber(formData.phone) : { isValid: true };
    const zipValidation = formData.zip ? validateZipCode(formData.zip, formData.country) : { isValid: true };
    const emailValidation = validateEmail(formData.email);
    const firstNameValidation = validateName(formData.firstName, 'First Name');
    const lastNameValidation = validateName(formData.lastName, 'Last Name');

    const newErrors = {};
    if (!phoneValidation.isValid) newErrors.phone = phoneValidation.message;
    if (!zipValidation.isValid) newErrors.zip = zipValidation.message;
    if (!emailValidation.isValid) newErrors.email = emailValidation.message;
    if (!firstNameValidation.isValid) newErrors.firstName = firstNameValidation.message;
    if (!lastNameValidation.isValid) newErrors.lastName = lastNameValidation.message;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix validation errors');
      return;
    }

    if (!tenantId) {
      toast.error('No tenant information');
      return;
    }

    try {
      setSaving(true);
      
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        title: formData.title.trim() || null,
        department: formData.department.trim() || null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        clientId: formData.clientId || null,
        vendorId: formData.vendorId || null,
        implPartnerId: formData.implPartnerId || null,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
        salaryAmount: formData.salaryAmount ? parseFloat(formData.salaryAmount) : null,
        salaryType: formData.salaryType,
        status: formData.status,
        overtimeRate: formData.overtimeRate ? parseFloat(formData.overtimeRate) : null,
        enableOvertime: formData.enableOvertime,
        overtimeMultiplier: formData.overtimeMultiplier ? parseFloat(formData.overtimeMultiplier) : 1.5,
        approver: formData.approver || null,
        notes: formData.notes || null,
        contactInfo: JSON.stringify({
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country
        })
      };

      const resp = await fetch(`${API_BASE}/api/employees/${id}?tenantId=${tenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.details ? JSON.stringify(err.details) : `Update failed with status ${resp.status}`);
      }

      const rawData = await resp.json().catch(() => ({}));
      const data = decryptApiResponse(rawData);
      
      if (data && data.success === false) {
        throw new Error(data.error || 'Failed to update employee');
      }

      toast.success('Employee updated successfully');
      router.push(`/${subdomain}/employees/${id}`);
    } catch (e) {
      console.error('Update failed:', e);
      toast.error(e.message || 'Failed to update employee');
    } finally {
      setSaving(false);
    }
  };

  if (!isMounted || loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) return <div className="nk-content"><div className="container-fluid text-danger">{error}</div></div>;
  if (!initialEmployee) return <div className="nk-content"><div className="container-fluid">Employee not found.</div></div>;

  return (
    <PermissionGuard requiredPermission={PERMISSIONS.EDIT_EMPLOYEE}>
      <div className="nk-content min-h-screen bg-slate-50">
        <div className="container-fluid">
          <div className="mb-6 rounded-xl border border-slate-200 bg-indigo-50 p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="nk-block-head-content">
                <h3 className="nk-block-title">Edit Employee</h3>
                <div className="nk-block-des text-soft">
                  <p>Editing: {initialEmployee?.firstName} {initialEmployee?.lastName}</p>
                </div>
              </div>
              <div className="nk-block-head-content">
                <Link href={`/${subdomain}/employees/${id}`} className="btn btn-outline-light">
                  <em className="icon ni ni-arrow-left"></em>
                  <span>Back</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              
              {/* Personal Information */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-700">
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      First Name *
                    </label>
                    <input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-200 ${
                        errors.firstName ? 'border-red-500 bg-red-50' : 'border-slate-200'
                      }`}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Last Name *
                    </label>
                    <input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm shadow-sm ${
                        errors.lastName ? 'border-red-500 bg-red-50' : 'border-slate-200'
                      }`}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm shadow-sm ${
                        errors.email ? 'border-red-500 bg-red-50' : 'border-slate-200'
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      maxLength="16"
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm shadow-sm ${
                        errors.phone ? 'border-red-500 bg-red-50' : 'border-slate-200'
                      }`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Job Details */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-700">
                  Job Details
                </h2>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Title/Position
                    </label>
                    <input
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Department
                    </label>
                    <input
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="terminated">Terminated</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Assignment Details */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-700">
                  Assignment Details
                </h2>
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      End Client
                    </label>
                    <select
                      name="clientId"
                      value={formData.clientId}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm"
                    >
                      <option value="">-- Unassigned --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.clientName || c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Vendor
                    </label>
                    <select
                      name="vendorId"
                      value={formData.vendorId}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm"
                    >
                      <option value="">-- Unassigned --</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Implementation Partner
                    </label>
                    <select
                      name="implPartnerId"
                      value={formData.implPartnerId}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm"
                    >
                      <option value="">-- Unassigned --</option>
                      {implPartners.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Compensation & Overtime */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-700">
                  Compensation & Overtime
                </h2>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Hourly Rate ($)
                    </label>
                    <input
                      type="number"
                      name="hourlyRate"
                      value={formData.hourlyRate}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Salary Type
                    </label>
                    <select
                      name="salaryType"
                      value={formData.salaryType}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="salary">Salary</option>
                      <option value="contract">Contract</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Overtime Multiplier
                    </label>
                    <input
                      type="number"
                      name="overtimeMultiplier"
                      value={formData.overtimeMultiplier}
                      onChange={handleChange}
                      min="1"
                      step="0.1"
                      placeholder="1.5"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <input
                        type="checkbox"
                        id="enableOvertime"
                        name="enableOvertime"
                        checked={formData.enableOvertime}
                        onChange={handleChange}
                        className="h-5 w-5 rounded border-slate-300 text-sky-600 focus:ring-2 focus:ring-sky-500"
                      />
                      <label htmlFor="enableOvertime" className="flex-1 cursor-pointer">
                        <span className="block text-sm font-semibold text-slate-700">
                          Enable Overtime
                        </span>
                        <span className="block text-xs text-slate-500">
                          Allow this employee to submit overtime hours for invoice generation
                        </span>
                      </label>
                    </div>
                  </div>

                  {formData.enableOvertime && (
                    <div className="md:col-span-3">
                      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                        <div className="flex items-start gap-3">
                          <i className="fas fa-info-circle text-sky-600 mt-0.5"></i>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-sky-900">
                              Overtime Calculation
                            </p>
                            <p className="mt-1 text-xs text-sky-700">
                              Overtime Rate = Hourly Rate × Overtime Multiplier
                              {formData.hourlyRate && formData.overtimeMultiplier && (
                                <span className="ml-2 font-semibold">
                                  (${formData.hourlyRate} × {formData.overtimeMultiplier} = ${(parseFloat(formData.hourlyRate) * parseFloat(formData.overtimeMultiplier)).toFixed(2)}/hr)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Address Information */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-700">
                  Address Information
                </h2>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <div className="md:col-span-3">
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Address
                    </label>
                    <input
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      City
                    </label>
                    <input
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      State
                    </label>
                    <input
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm"
                    />
                  </div>

                  {formData.country !== "United Arab Emirates" && (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">
                        {getPostalLabel(formData.country)}
                      </label>
                      <input
                        type="text"
                        name="zip"
                        value={formData.zip}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder={getPostalPlaceholder(formData.country)}
                        className={`w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm ${
                          errors.zip ? 'border-red-500' : ''
                        }`}
                      />
                      {errors.zip && (
                        <p className="mt-1 text-xs text-red-600">{errors.zip}</p>
                      )}
                    </div>
                  )}

                  <div className="md:col-span-3">
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Country *
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm"
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

              {/* Notes */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-700">
                  Notes
                </h2>
                <textarea
                  rows={4}
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 lg:col-span-2">
                <button
                  type="button"
                  onClick={() => router.push(`/${subdomain}/employees/${id}`)}
                  className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={saving}
                  className="rounded-xl bg-sky-700 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-sky-800 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default EmployeeEdit;
