'use client';

// src/components/clients/ClientDetails.jsx
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import { TAX_ID_LABELS, getPostalLabel } from '../../config/lookups';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { API_BASE } from '@/config/api';
import { PERMISSIONS } from '@/utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import './ClientDetails.css';

const ClientDetails = () => {
  const { id, subdomain } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Hydration fix: Track if component is mounted on client
  const [isMounted, setIsMounted] = useState(false);
  
  const [client, setClient] = useState(null);
  // Assigned employees are derived from allEmployees by matching clientId
  const [allEmployees, setAllEmployees] = useState([]);
  const [assignEmployeeId, setAssignEmployeeId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [tenantInfo, setTenantInfo] = useState(null);
  
  // Hydration fix: Set mounted state on client
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Fetch client by ID from backend
  const fetchClientData = useCallback(async () => {
    try {
      setLoading(true);
      const tenantId = user?.tenantId;
      if (!tenantId) throw new Error('No tenant information');
      const resp = await fetch(`${API_BASE}/api/clients/${id}?tenantId=${tenantId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.details || `Fetch failed with status ${resp.status}`);
      }
      const data = await resp.json();
      setClient(data.client);
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  }, [id, user?.tenantId]);

  // Fetch all employees for the tenant (reusable)
  const fetchAllEmployees = useCallback(async () => {
    try {
      const tenantId = user?.tenantId;
      if (!tenantId) return;
      const resp = await fetch(`${API_BASE}/api/employees?tenantId=${tenantId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.details || `Fetch employees failed (${resp.status})`);
      }
      const data = await resp.json();
      const list = data.employees || [];
      setAllEmployees(list);
    } catch (e) {
      console.error('Error fetching employees:', e);
    }
  }, [user?.tenantId]);
  
  // Get tenant information from localStorage
  useEffect(() => {
    if (!isMounted) return;
    
    const currentTenant = JSON.parse(localStorage.getItem('currentTenant'));
    setTenantInfo(currentTenant || { subdomain });
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Fetch client and employee data
    fetchClientData();
    fetchAllEmployees();
  }, [isMounted, fetchClientData, fetchAllEmployees, subdomain, user?.tenantId]);

  const handleAssignEmployee = async () => {
    if (!assignEmployeeId || !client?.id) return;
    try {
      setAssignLoading(true);
      setAssignError('');
      const tenantId = user?.tenantId;
      const employeeId = assignEmployeeId;
      const body = {
        clientId: client.id,
        client: client.clientName || client.name || ''
      };
      const resp = await fetch(`${API_BASE}/api/employees/${employeeId}?tenantId=${tenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.details || `Assign failed (${resp.status})`);
      }
      // Optimistically update local list and then refetch for consistency
      const updated = allEmployees.map(e => e.id === employeeId ? { ...e, clientId: client.id, client: body.client } : e);
      setAllEmployees(updated);
      await fetchAllEmployees();
      setAssignEmployeeId('');
      toast.success('Employee assigned to client');
    } catch (e) {
      console.error('Failed to assign employee:', e);
      setAssignError(e.message);
      toast.error(`Failed to assign employee: ${e.message}`);
    } finally {
      setAssignLoading(false);
    }
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Function to render status badge
  const renderStatusBadge = (status) => {
    switch(status) {
      case 'Approved':
        return <span className="badge badge-success">✅ Approved</span>;
      case 'Submitted':
        return <span className="badge badge-info">✅ Submitted</span>;
      case 'Draft':
        return <span className="badge badge-light">📝 Draft</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  // Derive employees assigned to this client from allEmployees
  const assignedEmployees = allEmployees.filter(
    (emp) => String(emp.clientId || '') === String(client?.id || '')
  );

  // Filter employees based on status (if a status exists on the employee objects)
  const filteredEmployees = statusFilter === 'all'
    ? assignedEmployees
    : assignedEmployees.filter((emp) =>
        (emp.status || '').toLowerCase() === statusFilter.toLowerCase()
      );

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

  if (loading) {
    return (
      <div className="nk-content">
        <div className="container-fluid">
          <div className="nk-content-inner">
            <div className="nk-content-body">
              <div className="nk-block-head nk-block-head-sm">
                <div className="loading-spinner">Loading client data...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="nk-content">
        <div className="container-fluid">
          <div className="nk-content-inner">
            <div className="nk-content-body">
              <div className="nk-block-head nk-block-head-sm">
                <div className="nk-block-between">
                  <div className="nk-block-head-content">
                    <h3 className="nk-block-title page-title">Client Details</h3>
                    <div className="nk-block-des text-soft">
                      <p>Client not found.</p>
                    </div>
                  </div>
                  <div className="nk-block-head-content">
                    <Link href={`/${tenantInfo?.subdomain || subdomain}/clients`} className="btn btn-outline-light">
                      <em className="icon ni ni-arrow-left"></em>
                      <span>Back</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nk-content min-h-screen bg-slate-50">
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body py-6">
            {/* Header */}
            <div className="mb-6 rounded-xl border border-slate-200 bg-indigo-50 p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">
                    {client?.name || 'Client Details'}
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    Details for {client?.name || 'Client'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link href={`/${tenantInfo?.subdomain || subdomain}/clients/edit/${client?.id}`} className="btn btn-primary">
                    <em className="icon ni ni-edit"></em>
                    <span>Edit Client</span>
                  </Link>
                  <Link href={`/${tenantInfo?.subdomain || subdomain}/clients`} className="btn btn-outline-light">
                    <em className="icon ni ni-arrow-left"></em>
                    <span>Back</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              
              {/* Client Information */}
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <header className="rounded-t-xl border-b border-slate-200 bg-slate-50 px-6 py-4">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Client Information
                  </h4>
                </header>
                <div className="p-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Client Name
                    </label>
                    <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                      {client?.name || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Contact Person
                    </label>
                    <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                      {client?.contactPerson || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Email Address
                    </label>
                    <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                      {client?.email || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Phone Number
                    </label>
                    <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                      {client?.phone || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Status
                    </label>
                    <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        client?.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        <span className={`w-2 h-2 mr-2 rounded-full ${
                          client?.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></span>
                        {(client?.status || '').charAt(0).toUpperCase() + (client?.status || '').slice(1)}
                      </span>
                    </p>
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Client Type
                    </label>
                    <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        client?.clientType === 'internal' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {client?.clientType === 'internal' ? 'Internal' : 'External'}
                      </span>
                    </p>
                  </div>
                </div>
              </section>

              {/* Address Information */}
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <header className="rounded-t-xl border-b border-slate-200 bg-slate-50 px-6 py-4">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Address Information
                  </h4>
                </header>
                <div className="p-6 grid grid-cols-1 gap-5">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Address
                    </label>
                    <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                      {client?.billingAddress?.line1 || '—'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        City
                      </label>
                      <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                        {client?.billingAddress?.city || '—'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        State
                      </label>
                      <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                        {client?.billingAddress?.state || '—'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        {getPostalLabel(client?.billingAddress?.country)}
                      </label>
                      <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                        {client?.billingAddress?.zip || '—'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Country
                    </label>
                    <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                      {client?.billingAddress?.country || 'United States'}
                    </p>
                  </div>
                </div>
              </section>
              
              {/* Billing & Payment Information */}
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
                <header className="rounded-t-xl border-b border-slate-200 bg-slate-50 px-6 py-4">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Billing & Payment Information
                  </h4>
                </header>
                <div className="p-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Payment Terms
                    </label>
                    <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                      {client?.paymentTerms === 0 ? 'Due upon receipt' : `Net ${client?.paymentTerms}`}
                    </p>
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Payment Method
                    </label>
                    <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                      {client?.paymentMethod || '—'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Currency
                    </label>
                    <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                      {client?.currency || 'USD'}
                    </p>
                  </div>
                  
                  {(client?.taxId || client?.vatNumber) && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        {TAX_ID_LABELS[client?.country] || 'Tax ID'}
                      </label>
                      <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                        {client?.taxId || client?.vatNumber}
                      </p>
                    </div>
                  )}
                  
                  {client?.bankDetails && (
                    <div className="sm:col-span-3">
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Bank Details
                      </label>
                      <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                        {client?.bankDetails}
                      </p>
                    </div>
                  )}
                </div>
              </section>
              
              {/* Notes */}
              {client?.notes && (
                <section className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
                  <header className="rounded-t-xl border-b border-slate-200 bg-slate-50 px-6 py-4">
                    <h4 className="text-sm font-semibold text-slate-900">
                      Notes
                    </h4>
                  </header>
                  <div className="p-6">
                    <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                      {client?.notes || 'No notes available'}
                    </p>
                  </div>
                </section>
              )}
            </div>

            {/* Employee List */}
            <div className="nk-block mt-6">
              <div className="card card-bordered card-stretch">
                <div className="card-inner-group">
                  <div className="card-inner position-relative">
                    <div className="card-title-group">
                      <div className="card-title">
                        <h5 className="title">Employee List</h5>
                      </div>
                      <div className="card-tools">
                        <div className="form-inline">
                          <div className="form-wrap">
                            <Link href={`/${tenantInfo?.subdomain || subdomain}/employees/new?clientId=${encodeURIComponent(client?.id)}&clientName=${encodeURIComponent(client?.clientName || client?.name || '')}`}
                              className="btn btn-sm btn-primary"
                            >
                              <em className="icon ni ni-plus"></em>
                              <span>Add Employee</span>
                            </Link>
                          </div>
                          <div className="form-wrap w-250px">
                            <select
                              className="form-select form-select-sm"
                              value={assignEmployeeId}
                              onChange={(e) => setAssignEmployeeId(e.target.value)}
                            >
                              <option value="">Assign existing employee…</option>
                              {allEmployees
                                // Show only unassigned employees in dropdown
                                .filter(emp => !emp.clientId)
                                .map(emp => (
                                  <option key={emp.id} value={emp.id}>
                                    {`${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || 'Employee'} {emp.email ? `- ${emp.email}` : ''}
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div className="form-wrap">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              disabled={!assignEmployeeId || assignLoading}
                              onClick={handleAssignEmployee}
                            >
                              {assignLoading ? 'Assigning…' : 'Assign to Client'}
                            </button>
                          </div>
                          {assignError && (
                            <div className="form-wrap">
                              <span className="text-danger small">{assignError}</span>
                            </div>
                          )}
                          <div className="form-wrap w-150px">
                            <select 
                              className="form-select form-select-sm" 
                              value={statusFilter}
                              onChange={handleStatusFilterChange}
                            >
                              <option value="all">All Status</option>
                              <option value="draft">Draft</option>
                              <option value="submitted">Submitted</option>
                              <option value="approved">Approved</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="card-inner p-0">
                    <div className="nk-tb-list nk-tb-ulist">
                      <div className="nk-tb-item nk-tb-head">
                        <div className="nk-tb-col"><span className="sub-text">Employee Name</span></div>
                        <div className="nk-tb-col tb-col-md"><span className="sub-text">Role</span></div>
                        <div className="nk-tb-col tb-col-md"><span className="sub-text">Current Week Hours</span></div>
                        <div className="nk-tb-col tb-col-md"><span className="sub-text">Status</span></div>
                        <div className="nk-tb-col nk-tb-col-tools text-end">Actions</div>
                      </div>
                      
                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map(employee => (
                          <div key={employee.id} className="nk-tb-item">
                            <div className="nk-tb-col">
                              <div className="user-card">
                                <div className="user-avatar bg-primary">
                                  <span>{(() => {
                                    const fn = employee.firstName || '';
                                    const ln = employee.lastName || '';
                                    const nm = `${fn} ${ln}`.trim() || employee.name || employee.email || '?';
                                    return nm.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
                                  })()}</span>
                                </div>
                                <div className="user-info">
                                  <span className="tb-lead">{`${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.name || 'Employee'}</span>
                                  <span>{employee.email || ''}</span>
                                </div>
                              </div>
                            </div>
                            <div className="nk-tb-col tb-col-md">
                              <span>{employee.role}</span>
                            </div>
                            <div className="nk-tb-col tb-col-md">
                              <span>{employee.weeklyHours} hours</span>
                            </div>
                            <div className="nk-tb-col tb-col-md">
                              {renderStatusBadge(employee.status)}
                            </div>
                            <div className="nk-tb-col nk-tb-col-tools">
                              <ul className="nk-tb-actions gx-1">
                                <li>
                                  <Link href={`/${tenantInfo?.subdomain}/timesheets/edit/${employee.id}`} className="btn btn-trigger btn-icon">
                                    <em className="icon ni ni-edit-alt"></em>
                                  </Link>
                                </li>
                                <li>
                                  <Link href={`/${tenantInfo?.subdomain}/timesheets/view/${employee.id}`} className="btn btn-trigger btn-icon">
                                    <em className="icon ni ni-eye"></em>
                                  </Link>
                                </li>
                              </ul>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="nk-tb-item">
                          <div className="nk-tb-col" colSpan="5">
                            <div className="empty-state">
                              <p>No employees match the selected filter.</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;
