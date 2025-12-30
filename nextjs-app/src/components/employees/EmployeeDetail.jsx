'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/config/api';
import { PERMISSIONS } from '@/utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const EmployeeDetail = () => {
  const { subdomain, id } = useParams();
  const { checkPermission, isAdmin, isApprover, user } = useAuth();
  
  // Hydration fix: Track if component is mounted on client
  const [isMounted, setIsMounted] = useState(false);
  
  const [employee, setEmployee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  
  // Hydration fix: Set mounted state on client
  useEffect(() => {
    setIsMounted(true);
  }, []);
  // React Query: server state for clients and vendors
  const tenantId = user?.tenantId;
  const {
    data: clientsData = [],
    isLoading: clientsLoading} = useQuery({
    queryKey: ['clients', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const resp = await fetch(`${API_BASE}/api/clients?tenantId=${tenantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
      const payload = await resp.json();
      return payload.success && payload.clients ? payload.clients : [];
    },
    enabled: isMounted && !!tenantId
  });

  const {
    data: vendorsData = [],
    isLoading: vendorsLoading} = useQuery({
    queryKey: ['vendors', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const resp = await fetch(`${API_BASE}/api/vendors?tenantId=${tenantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
      const payload = await resp.json();
      return payload.success && payload.vendors ? payload.vendors : [];
    },
    enabled: isMounted && !!tenantId
  });
  const [formValues, setFormValues] = useState({ joinDate: '', clientId: '', vendorId: '', implPartnerId: '' });

  // React Query: fetch employee
  const {
    data: employeeData,
    isLoading: employeeLoading} = useQuery({
    queryKey: ['employee', tenantId, id],
    queryFn: async () => {
      if (!tenantId || !id) return null;
      const response = await fetch(`${API_BASE}/api/employees/${id}?tenantId=${tenantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const rawData = await response.json();
      console.log('📦 Raw API response:', rawData);
      
      // Handle encrypted response
      let data = rawData;
      if (rawData.encrypted && rawData.data) {
        // Response is encrypted, decrypt it
        const { decryptApiResponse } = await import('@/utils/encryption');
        data = decryptApiResponse(rawData);
        console.log('🔓 Decrypted response:', data);
      }
      
      const employeeData = data.employee || data;
      console.log('👤 Employee data to use:', employeeData);
      return employeeData;
    },
    enabled: isMounted && !!tenantId && !!id
  });

  // When employee query resolves, normalize and sync local state for display and form
  useEffect(() => {
    if (!employeeData) return;
    const emp = employeeData;
    
    // Build full name from firstName and lastName
    const fullName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'N/A';
    
    // Handle client data - could be object or string
    let clientDisplay = 'Not assigned';
    if (emp.client) {
      if (typeof emp.client === 'object') {
        clientDisplay = emp.client.name || emp.client.clientName || emp.client.legalName || 'Not assigned';
      } else {
        clientDisplay = emp.client;
      }
    } else if (emp.clientName) {
      clientDisplay = emp.clientName;
    }
    
    // Handle vendor data - could be object or string
    let vendorDisplay = null;
    if (emp.vendor) {
      if (typeof emp.vendor === 'object') {
        vendorDisplay = emp.vendor.name || null;
      } else {
        vendorDisplay = emp.vendor;
      }
    } else if (emp.vendorName) {
      vendorDisplay = emp.vendorName;
    }
    
    const transformedEmployee = {
      ...emp,
      name: fullName,
      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      email: emp.email || 'N/A',
      phone: emp.phone || 'N/A',
      position: emp.position || emp.title || 'N/A',
      department: emp.department || 'N/A',
      status: emp.status || 'active',
      employmentType: emp.employmentType || 'W2',
      joinDate: emp.joinDate ? new Date(emp.joinDate).toISOString().split('T')[0] : (emp.startDate ? new Date(emp.startDate).toISOString().split('T')[0] : ''),
      address: emp.address?.street || emp.address || '—',
      city: emp.address?.city || '',
      state: emp.address?.state || '',
      zip: emp.address?.zip || '',
      country: emp.address?.country || '',
      client: clientDisplay,
      clientId: emp.clientId || null,
      vendor: vendorDisplay,
      vendorId: emp.vendorId || null,
      implPartnerId: emp.implPartnerId || null
    };
    
    console.log('📊 Transformed employee data:', transformedEmployee);
    setEmployee(transformedEmployee);
    setFormValues({
      joinDate: transformedEmployee.joinDate || '',
      clientId: emp.clientId || '',
      vendorId: emp.vendorId || '',
      implPartnerId: emp.implPartnerId || ''
    });
  }, [employeeData]);

  const canEditBasics = isAdmin() || isApprover();

  const handleStartEdit = () => {
    if (!canEditBasics) return;
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    // Reset form to current employee values
    setFormValues({
      joinDate: employee?.joinDate || '',
      clientId: employee?.clientId || '',
      vendorId: employee?.vendorId || '',
      implPartnerId: employee?.implPartnerId || ''
    });
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  // React Query: mutation for updating employee
  const updateEmployeeMutation = useMutation({
    mutationFn: async (body) => {
      const resp = await fetch(`${API_BASE}/api/employees/${id}?tenantId=${tenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      });
      if (!resp.ok) throw new Error(`Update failed with status ${resp.status}`);
      const payload = await resp.json();
      if (!payload.success) throw new Error(payload.error || 'Unknown update error');
      return payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['employee', tenantId, id]);
      setIsEditing(false);
    },
    onError: (e) => {
      // eslint-disable-next-line no-alert
      alert(`Failed to save changes: ${e.message}`);
    }
  });

  const handleSave = () => {
    if (!tenantId) {
      alert('No tenant information');
      return;
    }
    const updateBody = {
      startDate: formValues.joinDate || null,
      clientId: formValues.clientId || null,
      vendorId: formValues.vendorId || null,
      implPartnerId: formValues.implPartnerId || null};
    updateEmployeeMutation.mutate(updateBody);
  };

  // Prevent hydration mismatch - don't render until mounted
  if (!isMounted || employeeLoading || clientsLoading || vendorsLoading) {
    return (
      <div className="nk-content">
        <div className="container-fluid">
          <div className="d-flex justify-content-center mt-5">
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="nk-content">
        <div className="container-fluid">
          <div className="alert alert-danger">
            Employee not found. <Link href={`/${subdomain}/employees`}>Return to employee list</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nk-content min-h-screen bg-slate-50">
      <div className="container-fluid">
        {/* Header */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-indigo-50 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="nk-block-head-content">
              <h3 className="nk-block-title">{employee.name}</h3>
              <div className="nk-block-des text-soft">
                <p>{employee.position} • {employee.department}</p>
              </div>
            </div>
            <div className="nk-block-head-content flex items-center gap-3">
              {canEditBasics && !isEditing && (
                <Link 
                  href={`/${subdomain}/employees/${id}/edit`}
                  className="btn btn-primary"
                >
                  <em className="icon ni ni-edit"></em>
                  <span>Edit Details</span>
                </Link>
              )}
              {isEditing && (
                <>
                  <button 
                    onClick={handleSave}
                    disabled={updateEmployeeMutation.isLoading}
                    className="btn btn-success"
                  >
                    {updateEmployeeMutation.isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    onClick={handleCancelEdit}
                    disabled={updateEmployeeMutation.isLoading}
                    className="btn btn-outline-light"
                  >
                    Cancel
                  </button>
                </>
              )}
              <Link href={`/${subdomain}/employees`} className="btn btn-outline-light">
                <em className="icon ni ni-arrow-left"></em>
                <span>Back</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
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
                    First Name
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {employee.firstName || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Last Name
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {employee.lastName || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Email
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {employee.email}
                  </p>
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Phone
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {employee.phone}
                  </p>
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
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {employee.position}
                  </p>
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Department
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {employee.department}
                  </p>
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Start Date
                  </label>
                  {!isEditing ? (
                    <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                      {employee.joinDate ? new Date(employee.joinDate).toLocaleDateString() : '—'}
                    </p>
                  ) : (
                    <input
                      type="date"
                      name="joinDate"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm"
                      value={formValues.joinDate || ''}
                      onChange={handleChange}
                    />
                  )}
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Status
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      employee.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      <span className={`w-2 h-2 mr-2 rounded-full ${
                        employee.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></span>
                      {employee.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </p>
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
                  {!isEditing ? (
                    <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                      {employee.client || '-- Unassigned --'}
                    </p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <select
                        name="clientId"
                        className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm"
                        value={formValues.clientId || ''}
                        onChange={handleChange}
                      >
                        <option value="">-- Unassigned --</option>
                        {clientsData.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Vendor
                  </label>
                  {!isEditing ? (
                    <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                      {employee.vendor && employee.vendor !== 'Not assigned' ? employee.vendor : '-- Unassigned --'}
                    </p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <select
                        name="vendorId"
                        className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm"
                        value={formValues.vendorId || ''}
                        onChange={handleChange}
                      >
                        <option value="">-- Unassigned --</option>
                        {vendorsData.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Implementation Partner
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {employee.implPartner || '-- Unassigned --'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Compensation & Overtime */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-700">
                Compensation & Overtime
              </h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Hourly Rate ($)
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    ${employee.hourlyRate || '0.00'}
                  </p>
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Salary Type
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {employee.salaryType || 'Hourly'}
                  </p>
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Overtime Multiplier
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {employee.overtimeMultiplier || '1.5'}
                  </p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={employee.enableOvertime || false}
                      disabled
                      className="rounded border-slate-300"
                    />
                    Enable Overtime
                  </label>
                  <p className="mt-1 text-xs text-slate-500">
                    Allow this employee to submit overtime hours for invoice generation
                  </p>
                </div>
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
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {employee.address || '—'}
                  </p>
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    City
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {employee.city || '—'}
                  </p>
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    State
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {employee.state || '—'}
                  </p>
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    ZIP Code
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {employee.zip || '—'}
                  </p>
                </div>
                
                <div className="md:col-span-3">
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Country
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {employee.country || 'United States'}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes (if admin) */}
            {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-700">
                  Notes
                </h2>
                <div>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {employee.notes || 'No notes available'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default EmployeeDetail;
