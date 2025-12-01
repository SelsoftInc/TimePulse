'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/config/api';
import { PERMISSIONS } from '@/utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import './Employees.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const EmployeeDetail = () => {
  const { subdomain, id } = useParams();
  const { checkPermission, isAdmin, isApprover, user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
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
    enabled: !!tenantId
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
    enabled: !!tenantId
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
      const data = await response.json();
      return data.employee || data;
    },
    enabled: !!tenantId && !!id
  });

  // When employee query resolves, normalize and sync local state for display and form
  useEffect(() => {
    if (!employeeData) return;
    const emp = employeeData;
    const transformedEmployee = {
      ...emp,
      joinDate: emp.joinDate ? new Date(emp.joinDate).toISOString().split('T')[0] : (emp.startDate ? new Date(emp.startDate).toISOString().split('T')[0] : ''),
      address: emp.address?.street || emp.address || '—',
      city: emp.address?.city || '',
      state: emp.address?.state || '',
      zip: emp.address?.zip || '',
      country: emp.address?.country || '',
      client: emp.client || emp.clientName || emp.clientId || 'Not assigned'
    };
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

  if (employeeLoading || clientsLoading || vendorsLoading) {
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
    <div className="nk-content">
      <div className="container-fluid">
        <div className="nk-block-head">
          <div className="nk-block-between">
            <div className="nk-block-head-content">
              <h3 className="nk-block-title">Employee Details</h3>
              <p className="nk-block-subtitle">Viewing details for {employee.name}</p>
            </div>
            <div className="nk-block-head-content">
              <Link href={`/${subdomain}/employees`} className="btn btn-outline-light">
                <i className="fas fa-arrow-left mr-1"></i> Back to Employees
              </Link>
              {canEditBasics && !isEditing && (
                <button className="btn btn-primary ml-2" onClick={handleStartEdit}>
                  <i className="fas fa-edit mr-1"></i> Edit
                </button>
              )}
              {isEditing && (
                <div className="d-inline-flex ml-2">
                  <button className="btn btn-success mr-2" onClick={handleSave} disabled={updateEmployeeMutation.isLoading}>
                    {updateEmployeeMutation.isLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button className="btn btn-outline-light" onClick={handleCancelEdit} disabled={updateEmployeeMutation.isLoading}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="nk-block">
          <div className="card card-bordered">
            <div className="card-aside-wrap">
              <div className="card-content">
                <div className="card-inner">
                  <div className="nk-block">
                    <div className="nk-block-head">
                      <h5 className="title">Personal Information</h5>
                    </div>
                    <div className="profile-ud-list">
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Full Name</div>
                        <div className="profile-ud-value">{employee.name}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Email</div>
                        <div className="profile-ud-value">{employee.email}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Phone</div>
                        <div className="profile-ud-value">{employee.phone}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Status</div>
                        <div className="profile-ud-value">
                          <span className={`badge badge-${employee.status === 'active' ? 'success' : 'warning'}`}>
                            {employee.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="nk-block">
                    <div className="nk-block-head">
                      <h5 className="title">Work Information</h5>
                    </div>
                    <div className="profile-ud-list">
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Position</div>
                        <div className="profile-ud-value">{employee.position}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Department</div>
                        <div className="profile-ud-value">{employee.department}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">End Client</div>
                        <div className="profile-ud-value">
                          {!isEditing && (
                            <>{employee.client || <span className="text-muted">Not assigned</span>}</>
                          )}
                          {isEditing && (
                            <div className="d-flex align-items-center">
                              <select
                                name="clientId"
                                className="form-control"
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
                                className="btn btn-sm btn-outline-light ml-2"
                                onClick={() => setFormValues(prev => ({ ...prev, clientId: '' }))}
                                title="Clear end client"
                              >
                                Clear
                              </button>
                            </div>
                          )}
                          {isEditing && (
                            <small className="text-muted d-block mt-1">Choose "-- Select End Client --" or click Clear to unassign.</small>
                          )}
                        </div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Employment Type</div>
                        <div className="profile-ud-value">
                          <span className={`badge badge-${employee.employmentType === 'W2' ? 'primary' : 'info'}`}>
                            {employee.employmentType}
                          </span>
                        </div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Vendor</div>
                        <div className="profile-ud-value">
                          {!isEditing && (
                            <>
                              {employee.vendor ? (
                                <Link href={`/${subdomain}/vendors/${employee.vendorId}`}>
                                  {employee.vendor}
                                </Link>
                              ) : (
                                <span className="text-muted">No vendor assigned</span>
                              )}
                            </>
                          )}
                          {isEditing && (
                            <div className="d-flex align-items-center">
                              <select
                                name="vendorId"
                                className="form-control"
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
                                className="btn btn-sm btn-outline-light ml-2"
                                onClick={() => setFormValues(prev => ({ ...prev, vendorId: '' }))}
                                title="Clear vendor"
                              >
                                Clear
                              </button>
                            </div>
                          )}
                          {isEditing && (
                            <small className="text-muted d-block mt-1">Choose "-- Select Vendor --" or click Clear to unassign.</small>
                          )}
                        </div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Impl Partner</div>
                        <div className="profile-ud-value">
                          {!isEditing && (
                            <>
                              {employee.implPartner ? (
                                <Link href={`/${subdomain}/vendors/${employee.implPartnerId}`}>
                                  {employee.implPartner}
                                </Link>
                              ) : (
                                <span className="text-muted">No impl partner assigned</span>
                              )}
                            </>
                          )}
                          {isEditing && (
                            <div className="d-flex align-items-center">
                              <select
                                name="implPartnerId"
                                className="form-control"
                                value={formValues.implPartnerId || ''}
                                onChange={handleChange}
                              >
                                <option value="">-- Select Impl Partner --</option>
                                {vendorsData.map(v => (
                                  <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-light ml-2"
                                onClick={() => setFormValues(prev => ({ ...prev, implPartnerId: '' }))}
                                title="Clear implementation partner"
                              >
                                Clear
                              </button>
                            </div>
                          )}
                          {isEditing && (
                            <small className="text-muted d-block mt-1">Choose "-- Select Impl Partner --" or click Clear to unassign.</small>
                          )}
                        </div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Join Date</div>
                        <div className="profile-ud-value">
                          {!isEditing && (
                            <>{employee.joinDate ? new Date(employee.joinDate).toLocaleDateString() : '—'}</>
                          )}
                          {isEditing && (
                            <input
                              type="date"
                              name="joinDate"
                              className="form-control"
                              value={formValues.joinDate || ''}
                              onChange={handleChange}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="nk-block">
                    <div className="nk-block-head">
                      <h5 className="title">Address</h5>
                    </div>
                    <div className="profile-ud-list">
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Address</div>
                        <div className="profile-ud-value">{employee.address}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">City</div>
                        <div className="profile-ud-value">{employee.city}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">State</div>
                        <div className="profile-ud-value">{employee.state}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">ZIP Code</div>
                        <div className="profile-ud-value">{employee.zip}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Country</div>
                        <div className="profile-ud-value">{employee.country}</div>
                      </div>
                    </div>
                  </div>

                  {/* SOW Details - Only visible to Admin */}
                  {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && (
                    <div className="nk-block">
                      <div className="nk-block-head">
                        <h5 className="title">Statement of Work (SOW) Details</h5>
                        <p className="text-muted">This information is only visible to administrators</p>
                      </div>
                      <div className="profile-ud-list">
                        <div className="profile-ud-item">
                          <div className="profile-ud-label">Hourly Rate</div>
                          <div className="profile-ud-value">${employee.hourlyRate}</div>
                        </div>
                        <div className="profile-ud-item">
                          <div className="profile-ud-label">Overtime Enabled</div>
                          <div className="profile-ud-value">
                            {employee.enableOvertime ? (
                              <span className="badge badge-success">Yes</span>
                            ) : (
                              <span className="badge badge-light">No</span>
                            )}
                          </div>
                        </div>
                        {employee.enableOvertime && (
                          <>
                            <div className="profile-ud-item">
                              <div className="profile-ud-label">Overtime Multiplier</div>
                              <div className="profile-ud-value">{employee.overtimeMultiplier}x</div>
                            </div>
                            <div className="profile-ud-item">
                              <div className="profile-ud-label">Overtime Rate</div>
                              <div className="profile-ud-value">${employee.overtimeRate}</div>
                            </div>
                          </>
                        )}
                        <div className="profile-ud-item">
                          <div className="profile-ud-label">Approval Workflow</div>
                          <div className="profile-ud-value">
                            {employee.approvalWorkflow === 'auto' && 'Auto-approve'}
                            {employee.approvalWorkflow === 'manual' && 'Manual approval'}
                            {employee.approvalWorkflow === 'manager' && 'Manager approval'}
                            {employee.approvalWorkflow === 'client' && 'Client approval'}
                          </div>
                        </div>
                      </div>

                      {/* SOW Document */}
                      <div className="nk-block-head mt-4">
                        <h6 className="title">SOW Document</h6>
                      </div>
                      {employee.sowDocument ? (
                        <div className="document-preview mb-4">
                          <div className="document-preview-header">
                            <span className="document-name">{employee.sowDocument?.name || 'Untitled'}</span>
                            {typeof employee.sowDocument?.size === 'number' && (
                              <span className="document-size">{Math.round(employee.sowDocument.size / 1024)} KB</span>
                            )}
                          </div>
                          <div className="document-preview-content">
                            <div className="document-icon">
                              <i className="fas fa-file-pdf"></i>
                              {employee.sowDocument?.uploadDate && (
                                <span>Uploaded on {new Date(employee.sowDocument.uploadDate).toLocaleDateString()}</span>
                              )}
                            </div>
                            {employee.sowDocument?.url ? (
                              <a href={employee.sowDocument.url} className="btn btn-sm btn-outline-primary mt-2">
                                <i className="fas fa-download mr-1"></i> Download
                              </a>
                            ) : (
                              <span className="text-muted d-block mt-2">No download available</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted mb-4">No SOW document uploaded.</div>
                      )}
                    </div>
                  )}

                  {/* End Client Details */}
                  {employee.endClient && (
                    <div className="nk-block">
                      <div className="nk-block-head">
                        <h5 className="title">End Client Details</h5>
                      </div>
                      <div className="card card-bordered">
                        <div className="card-inner">
                          <div className="profile-ud-list">
                            <div className="profile-ud-item">
                              <div className="profile-ud-label">Client Name</div>
                              <div className="profile-ud-value">{employee.endClient.name}</div>
                            </div>
                            <div className="profile-ud-item">
                              <div className="profile-ud-label">Location</div>
                              <div className="profile-ud-value">{employee.endClient.location}</div>
                            </div>
                          </div>
                          
                          {employee.endClient.hiringManager && (
                            <>
                              <div className="nk-divider divider md"></div>
                              
                              <div className="nk-block-head">
                                <h6 className="title">Hiring Manager</h6>
                              </div>
                              <div className="profile-ud-list">
                                <div className="profile-ud-item">
                                  <div className="profile-ud-label">Name</div>
                                  <div className="profile-ud-value">{employee.endClient.hiringManager.name}</div>
                                </div>
                                <div className="profile-ud-item">
                                  <div className="profile-ud-label">Email</div>
                                  <div className="profile-ud-value">
                                    <a href={`mailto:${employee.endClient.hiringManager.email}`}>
                                      {employee.endClient.hiringManager.email}
                                    </a>
                                  </div>
                                </div>
                                <div className="profile-ud-item">
                                  <div className="profile-ud-label">Phone</div>
                                  <div className="profile-ud-value">
                                    <a href={`tel:${employee.endClient.hiringManager.phone}`}>
                                      {employee.endClient.hiringManager.phone}
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Timesheet Settings */}
                  <div className="nk-block">
                    <div className="nk-block-head nk-block-between">
                      <div>
                        <h5 className="title">Timesheet Settings</h5>
                      </div>
                      <div>
                        <PermissionGuard requiredPermission={PERMISSIONS.EDIT_EMPLOYEE}>
                          <Link href={`/${subdomain}/employees/${id}/settings`} className="btn btn-sm btn-primary">
                            <i className="fas fa-cog mr-1"></i> Configure Settings
                          </Link>
                        </PermissionGuard>
                      </div>
                    </div>
                    <div className="card card-bordered">
                      <div className="card-inner">
                        <div className="row">
                          <div className="col-md-6">
                            <div className="profile-ud-list">
                              <div className="profile-ud-item">
                                <div className="profile-ud-label">Client</div>
                                <div className="profile-ud-value">
                                  {employee.client || 'Not assigned'}
                                </div>
                              </div>
                              <div className="profile-ud-item">
                                <div className="profile-ud-label">Client Type</div>
                                <div className="profile-ud-value">
                                  <span className={`badge badge-${employee.clientType === 'internal' ? 'primary' : 'warning'}`}>
                                    {employee.clientType === 'internal' ? 'Internal' : 'External'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="profile-ud-list">
                              <div className="profile-ud-item">
                                <div className="profile-ud-label">Timesheet Approver</div>
                                <div className="profile-ud-value">
                                  {employee.approver || 'Not assigned'}
                                </div>
                              </div>
                              <div className="profile-ud-item">
                                <div className="profile-ud-label">Approval Workflow</div>
                                <div className="profile-ud-value">
                                  {employee.approvalWorkflow || 'Manager Approval'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="nk-block">
                    <div className="nk-block-head">
                      <h5 className="title">Notes</h5>
                    </div>
                    <div className="card card-bordered">
                      <div className="card-inner">
                        <p>{employee.notes || 'No notes available.'}</p>
                      </div>
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

export default EmployeeDetail;
