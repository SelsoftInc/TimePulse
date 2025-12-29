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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-4">
              <Link 
                href={`/${subdomain}/employees`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Employees
              </Link>
            </div>
            <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">{employee.name}</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{employee.position} • {employee.department}</p>
          </div>
          <div className="flex items-center space-x-3">
            {canEditBasics && !isEditing && (
              <button 
                onClick={handleStartEdit}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Details
              </button>
            )}
            {isEditing && (
              <>
                <button 
                  onClick={handleSave}
                  disabled={updateEmployeeMutation.isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updateEmployeeMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  onClick={handleCancelEdit}
                  disabled={updateEmployeeMutation.isLoading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</label>
                  <p className="mt-1 text-base text-gray-900 dark:text-white">{employee.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                  <p className="mt-1 text-base text-gray-900 dark:text-white">{employee.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                  <p className="mt-1 text-base text-gray-900 dark:text-white">{employee.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      employee.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      <span className={`w-2 h-2 mr-2 rounded-full ${
                        employee.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></span>
                      {employee.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
                  
            {/* Work Information Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Work Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Position</label>
                  <p className="mt-1 text-base text-gray-900 dark:text-white">{employee.position}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</label>
                  <p className="mt-1 text-base text-gray-900 dark:text-white">{employee.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Employment Type</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      employee.employmentType === 'W2' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                    }`}>
                      {employee.employmentType}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Join Date</label>
                  {!isEditing ? (
                    <p className="mt-1 text-base text-gray-900 dark:text-white">
                      {employee.joinDate ? new Date(employee.joinDate).toLocaleDateString() : '—'}
                    </p>
                  ) : (
                    <input
                      type="date"
                      name="joinDate"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formValues.joinDate || ''}
                      onChange={handleChange}
                    />
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">End Client</label>
                  {!isEditing ? (
                    <p className="mt-1 text-base text-gray-900 dark:text-white">
                      {employee.client || <span className="text-gray-400">Not assigned</span>}
                    </p>
                  ) : (
                    <div className="mt-1">
                      <div className="flex items-center space-x-2">
                        <select
                          name="clientId"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formValues.clientId || ''}
                          onChange={handleChange}
                        >
                          <option value="">-- Select End Client --</option>
                          {clientsData.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setFormValues(prev => ({ ...prev, clientId: '' }))}
                          title="Clear end client"
                        >
                          Clear
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Choose "-- Select End Client --" or click Clear to unassign.</p>
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Vendor</label>
                  {!isEditing ? (
                    <p className="mt-1 text-base text-gray-900 dark:text-white">
                      {employee.vendor && employee.vendor !== 'Not assigned' ? (
                        <Link href={`/${subdomain}/vendors/${employee.vendorId}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                          {employee.vendor}
                        </Link>
                      ) : (
                        <span className="text-gray-400">No vendor assigned</span>
                      )}
                    </p>
                  ) : (
                    <div className="mt-1">
                      <div className="flex items-center space-x-2">
                        <select
                          name="vendorId"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formValues.vendorId || ''}
                          onChange={handleChange}
                        >
                          <option value="">-- Select Vendor --</option>
                          {vendorsData.map(v => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setFormValues(prev => ({ ...prev, vendorId: '' }))}
                          title="Clear vendor"
                        >
                          Clear
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Choose "-- Select Vendor --" or click Clear to unassign.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Address Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Street Address</label>
                  <p className="mt-1 text-base text-gray-900 dark:text-white">{employee.address || '—'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">City</label>
                  <p className="mt-1 text-base text-gray-900 dark:text-white">{employee.city || '—'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">State</label>
                  <p className="mt-1 text-base text-gray-900 dark:text-white">{employee.state || '—'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">ZIP Code</label>
                  <p className="mt-1 text-base text-gray-900 dark:text-white">{employee.zip || '—'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Country</label>
                  <p className="mt-1 text-base text-gray-900 dark:text-white">{employee.country || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Additional Info */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Info</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Employee ID</label>
                  <p className="mt-1 text-base text-gray-900 dark:text-white">{employee.employeeId || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Hourly Rate</label>
                  <p className="mt-1 text-base text-gray-900 dark:text-white">${employee.hourlyRate || '0.00'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Salary</label>
                  <p className="mt-1 text-base text-gray-900 dark:text-white">${employee.salaryAmount || '0.00'}</p>
                </div>
              </div>
            </div>

            {/* SOW Details - Admin Only */}
            {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">SOW Details</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Administrator only</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Hourly Rate</label>
                    <p className="mt-1 text-base text-gray-900 dark:text-white">${employee.hourlyRate}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Overtime Enabled</label>
                    <div className="mt-1">
                      {employee.enableOvertime ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Yes</span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400">No</span>
                      )}
                    </div>
                  </div>
                  {employee.enableOvertime && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Overtime Multiplier</label>
                        <p className="mt-1 text-base text-gray-900 dark:text-white">{employee.overtimeMultiplier}x</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Overtime Rate</label>
                        <p className="mt-1 text-base text-gray-900 dark:text-white">${employee.overtimeRate}</p>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Approval Workflow</label>
                    <p className="mt-1 text-base text-gray-900 dark:text-white">
                      {employee.approvalWorkflow === 'auto' && 'Auto-approve'}
                      {employee.approvalWorkflow === 'manual' && 'Manual approval'}
                      {employee.approvalWorkflow === 'manager' && 'Manager approval'}
                      {employee.approvalWorkflow === 'client' && 'Client approval'}
                    </p>
                  </div>
                </div>

                {employee.sowDocument && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">SOW Document</h3>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{employee.sowDocument?.name || 'Untitled'}</p>
                          {employee.sowDocument?.uploadDate && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">Uploaded {new Date(employee.sowDocument.uploadDate).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                      {employee.sowDocument?.url && (
                        <a href={employee.sowDocument.url} className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default EmployeeDetail;
