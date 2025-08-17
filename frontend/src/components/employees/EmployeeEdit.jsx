import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { PERMISSIONS } from '../../utils/roles';
import { API_BASE } from '../../config/api';
import './Employees.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const EmployeeEdit = () => {
  const { subdomain, id } = useParams();
  const navigate = useNavigate();
  const { user, checkPermission } = useAuth();
  const { toast } = useToast();

  const [employee, setEmployee] = useState(null);
  const tenantId = user?.tenantId;
  const queryClient = useQueryClient();
  // React Query: fetch clients
  const {
    data: clientsData = [],
    isLoading: clientsLoading,
  } = useQuery(['clients', tenantId], async () => {
    if (!tenantId) return [];
    const resp = await fetch(`${API_BASE}/api/clients?tenantId=${tenantId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!resp.ok) throw new Error(`Failed to fetch clients (${resp.status})`);
    const data = await resp.json();
    return data.clients || [];
  }, { enabled: !!tenantId });

  // React Query: fetch vendors (also used for impl partners)
  const {
    data: vendorsData = [],
    isLoading: vendorsLoading,
  } = useQuery(['vendors', tenantId], async () => {
    if (!tenantId) return [];
    const resp = await fetch(`${API_BASE}/api/vendors?tenantId=${tenantId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!resp.ok) throw new Error(`Failed to fetch vendors (${resp.status})`);
    const data = await resp.json();
    return data.vendors || [];
  }, { enabled: !!tenantId });

  const [form, setForm] = useState({
    joinDate: '',
    clientId: '',
    vendorId: '',
    implPartnerId: ''
  });

  // React Query: fetch employee
  const { data: employeeData, isLoading: employeeLoading } = useQuery(
    ['employee', tenantId, id],
    async () => {
      if (!tenantId || !id) return null;
      const resp = await fetch(`${API_BASE}/api/employees/${id}?tenantId=${tenantId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!resp.ok) throw new Error(`Failed to fetch employee (${resp.status})`);
      const data = await resp.json();
      return data.employee || data;
    },
    { enabled: !!tenantId && !!id }
  );

  // Sync local state when employee query resolves
  useEffect(() => {
    if (!employeeData) return;
    const emp = employeeData;
    setEmployee(emp);
    setForm({
      joinDate: emp?.startDate ? new Date(emp.startDate).toISOString().slice(0,10) : (emp?.joinDate || ''),
      clientId: emp?.clientId || '',
      vendorId: emp?.vendorId || '',
      implPartnerId: emp?.implPartnerId || ''
    });
  }, [employeeData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // React Query: mutation for update
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
      if (!resp.ok) throw new Error(`Update failed (${resp.status})`);
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || 'Update failed');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['employee', tenantId, id]);
      toast.success('Employee updated');
      navigate(`/${subdomain}/employees/${id}`);
    },
    onError: (e) => {
      console.error('Save failed:', e);
      toast.error(e.message || 'Failed to save');
    }
  });

  const handleSave = () => {
    if (!tenantId) {
      toast.error('No tenant information');
      return;
    }
    const body = {
      startDate: form.joinDate || null,
      clientId: form.clientId || null,
      vendorId: form.vendorId || null,
      implPartnerId: form.implPartnerId || null,
    };
    updateEmployeeMutation.mutate(body);
  };

  if (!checkPermission(PERMISSIONS.EDIT_EMPLOYEE)) {
    return (
      <div className="nk-content">
        <div className="container-fluid">
          <div className="alert alert-warning">You do not have permission to edit employees.</div>
        </div>
      </div>
    );
  }

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
            Employee not found. <Link to={`/${subdomain}/employees`}>Return to employee list</Link>
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
              <h3 className="nk-block-title">Edit Employee</h3>
              <p className="nk-block-subtitle">Update details for {employee.name}</p>
            </div>
            <div className="nk-block-head-content">
              <Link to={`/${subdomain}/employees/${id}`} className="btn btn-outline-light">
                <i className="fas fa-arrow-left mr-1"></i> Back to Details
              </Link>
            </div>
          </div>
        </div>

        <div className="nk-block">
          <div className="card card-bordered">
            <div className="card-inner">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Join Date</label>
                    <input
                      type="date"
                      name="joinDate"
                      className="form-control"
                      value={form.joinDate || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">End Client</label>
                    <div className="d-flex align-items-center">
                      <select
                        name="clientId"
                        className="form-select"
                        value={form.clientId || ''}
                        onChange={handleChange}
                      >
                        <option value="">-- Unassigned --</option>
                        {clientsData.map(c => (
                          <option key={c.id} value={c.id}>{c.clientName || c.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-light ml-2"
                        onClick={() => setForm(prev => ({ ...prev, clientId: '' }))}
                        title="Clear end client"
                      >
                        Clear
                      </button>
                    </div>
                    <small className="text-muted">Choose "Unassigned" or click Clear to remove the end client.</small>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Vendor</label>
                    <div className="d-flex align-items-center">
                      <select
                        name="vendorId"
                        className="form-select"
                        value={form.vendorId || ''}
                        onChange={handleChange}
                      >
                        <option value="">-- Unassigned --</option>
                        {vendorsData.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-light ml-2"
                        onClick={() => setForm(prev => ({ ...prev, vendorId: '' }))}
                        title="Clear vendor"
                      >
                        Clear
                      </button>
                    </div>
                    <small className="text-muted">Choose "Unassigned" or click Clear to remove the vendor.</small>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Impl Partner</label>
                    <div className="d-flex align-items-center">
                      <select
                        name="implPartnerId"
                        className="form-select"
                        value={form.implPartnerId || ''}
                        onChange={handleChange}
                      >
                        <option value="">-- Unassigned --</option>
                        {vendorsData.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-light ml-2"
                        onClick={() => setForm(prev => ({ ...prev, implPartnerId: '' }))}
                        title="Clear implementation partner"
                      >
                        Clear
                      </button>
                    </div>
                    <small className="text-muted">Choose "Unassigned" or click Clear to remove the implementation partner.</small>
                  </div>
                </div>
              </div>
              <div className="mt-4 d-flex justify-content-end">
                <button className="btn btn-outline-light mr-2" onClick={() => navigate(-1)} disabled={updateEmployeeMutation.isLoading}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={updateEmployeeMutation.isLoading}>
                  {updateEmployeeMutation.isLoading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EmployeeEdit;
