// src/components/clients/ClientOverview.jsx (renamed to ClientDetails)
import React, { useState, useEffect, useCallback } from 'react';
import { TAX_ID_LABELS } from '../../config/lookups';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import './ClientDetails.css';

const ClientDetails = () => {
  const { clientId, subdomain } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [client, setClient] = useState(null);
  // Assigned employees are derived from allEmployees by matching clientId
  const [allEmployees, setAllEmployees] = useState([]);
  const [assignEmployeeId, setAssignEmployeeId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [tenantInfo, setTenantInfo] = useState(null);
  
  // Fetch client by ID from backend
  const fetchClientData = useCallback(async () => {
    try {
      setLoading(true);
      const tenantId = user?.tenantId;
      if (!tenantId) throw new Error('No tenant information');
      const resp = await fetch(`http://localhost:5000/api/clients/${clientId}?tenantId=${tenantId}`, {
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
  }, [clientId, user?.tenantId]);

  // Fetch all employees for the tenant (reusable)
  const fetchAllEmployees = useCallback(async () => {
    try {
      const tenantId = user?.tenantId;
      if (!tenantId) return;
      const resp = await fetch(`http://localhost:5000/api/employees?tenantId=${tenantId}`, {
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
    const currentTenant = JSON.parse(localStorage.getItem('currentTenant'));
    setTenantInfo(currentTenant || { subdomain });
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Fetch client and employee data
    fetchClientData();
    fetchAllEmployees();
  }, [navigate, fetchClientData, fetchAllEmployees, subdomain, user?.tenantId]);

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
      const resp = await fetch(`http://localhost:5000/api/employees/${employeeId}?tenantId=${tenantId}`, {
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
                    <Link to={`/${tenantInfo?.subdomain || subdomain}/clients`} className="btn btn-outline-light">
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
    <div className="nk-conten">
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            {/* Tenant Info Banner */}
            {tenantInfo && (
              <div className="tenant-banner">
                <span>Workspace: {tenantInfo.name}</span>
              </div>
            )}
            
            {/* Client Header */}
            <div className="nk-block-head nk-block-head-sm">
              <div className="nk-block-between">
                <div className="nk-block-head-content">
                  <h3 className="nk-block-title page-title">Client Details</h3>
                  <div className="nk-block-des text-soft">
                    <p>Details for {client?.name || 'Client'}</p>
                  </div>
                </div>
                <div className="nk-block-head-content">
                  <div className="toggle-wrap nk-block-tools-toggle">
                    <div className="toggle-expand-content expanded">
                      <ul className="nk-block-tools g-3">
                        <li className="nk-block-tools-opt">
                          <Link to={`/${tenantInfo?.subdomain || subdomain}/clients`} className="btn btn-outline-light">
                            <em className="icon ni ni-arrow-left"></em>
                            <span>Back</span>
                          </Link>
                        </li>
                        <li className="nk-block-tools-opt">
                          <Link to={`/${tenantInfo?.subdomain || subdomain}/clients/edit/${client?.id}`} className="btn btn-primary">
                            <em className="icon ni ni-edit"></em>
                            <span>Edit Client</span>
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Details Card */}
            <div className="nk-block">
              <div className="card card-bordered">
                <div className="card-inner">
                  <div className="row g-4">
                    <div className="col-lg-6">
                      <div className="client-detail-item">
                        <span className="detail-label">Client Type:</span>
                        <span className="detail-value">
                          <span className={`badge badge-dim rounded-pill ${client?.clientType === 'internal' ? 'bg-outline-primary' : 'bg-outline-warning'}`}>
                            {client?.clientType === 'internal' ? 'Internal' : 'External'}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="client-detail-item">
                        <span className="detail-label">Contact Person:</span>
                        <span className="detail-value">{client?.contactPerson}</span>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="client-detail-item">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{client?.email}</span>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="client-detail-item">
                        <span className="detail-label">Phone Number:</span>
                        <span className="detail-value">{client?.phone}</span>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="client-detail-item">
                        <span className="detail-label">Status:</span>
                        <span className="detail-value">
                          <span className={`badge ${client?.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                            {(client?.status || '').charAt(0).toUpperCase() + (client?.status || '').slice(1)}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="client-detail-item">
                        <span className="detail-label">Address:</span>
                        <span className="detail-value client-address">
                          {client?.billingAddress ? [
                            client.billingAddress.line1,
                            [client.billingAddress.city, client.billingAddress.state].filter(Boolean).join(', '),
                            client.billingAddress.zip
                          ].filter(Boolean).join(' '): ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing & Payment Information */}
            <div className="card card-bordered mt-4">
              <div className="card-inner">
                <h5 className="card-title mb-4">
                  <em className="icon ni ni-credit-card mr-2"></em>
                  Billing & Payment Information
                </h5>
                <div className="row g-4">
                  <div className="col-lg-6">
                    <div className="client-detail-item">
                      <span className="detail-label">Invoice Cycle:</span>
                      <span className="detail-value">
                        <span className="badge badge-dim badge-outline-info">
                          {client?.paymentTerms === 0 ? 'Due upon receipt' : `Net ${client?.paymentTerms}`}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="client-detail-item">
                      <span className="detail-label">Payment Method:</span>
                      <span className="detail-value">
                        <span className="badge badge-dim badge-outline-success">
                          {client?.paymentMethod || '—'}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="client-detail-item">
                      <span className="detail-label">Currency:</span>
                      <span className="detail-value">
                        <span className="badge badge-dim badge-outline-primary">
                          {client?.currency || 'USD'}
                        </span>
                      </span>
                    </div>
                  </div>
                  {(client?.taxId || client?.vatNumber) && (
                    <div className="col-lg-6">
                      <div className="client-detail-item">
                        <span className="detail-label">{TAX_ID_LABELS[client?.country] || 'Tax ID'}:</span>
                        <span className="detail-value">{client?.taxId || client?.vatNumber}</span>
                      </div>
                    </div>
                  )}
                  {client?.bankDetails && (
                    <div className="col-12">
                      <div className="client-detail-item">
                        <span className="detail-label">Bank Details:</span>
                        <span className="detail-value">{client?.bankDetails}</span>
                      </div>
                    </div>
                  )}
                  <div className="col-12">
                    <div className="client-detail-item">
                      <span className="detail-label">Billing Address:</span>
                      <span className="detail-value client-address">
                        {client?.billingAddress ? [
                          client.billingAddress.line1,
                          [client.billingAddress.city, client.billingAddress.state].filter(Boolean).join(', '),
                          client.billingAddress.zip
                        ].filter(Boolean).join(' ') : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Employee List */}
            <div className="nk-block mt-4">
              <div className="card card-bordered card-stretch">
                <div className="card-inner-group">
                  <div className="card-inner position-relative">
                    <div className="card-title-group">
                      <div className="card-title">
                        <h5 className="title">Employee List</h5>
                      </div>
                      <div className="card-tools">
                        <div className="form-inline flex-nowrap gx-3">
                          <div className="form-wrap mr-2">
                            <Link
                              to={`/${tenantInfo?.subdomain || subdomain}/employees/new?clientId=${encodeURIComponent(client?.id)}&clientName=${encodeURIComponent(client?.clientName || client?.name || '')}`}
                              className="btn btn-sm btn-primary"
                            >
                              <em className="icon ni ni-plus"></em>
                              <span className="ml-1">Add Employee</span>
                            </Link>
                          </div>
                          <div className="form-wrap mr-2 w-250px">
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
                          <div className="form-wrap mr-2">
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
                            <div className="form-wrap mr-2">
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
                                  <Link to={`/${tenantInfo?.subdomain}/timesheets/edit/${employee.id}`} className="btn btn-trigger btn-icon">
                                    <em className="icon ni ni-edit-alt"></em>
                                  </Link>
                                </li>
                                <li>
                                  <Link to={`/${tenantInfo?.subdomain}/timesheets/view/${employee.id}`} className="btn btn-trigger btn-icon">
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
