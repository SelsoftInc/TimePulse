import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { PERMISSIONS } from '../../utils/roles';
import { API_BASE } from '../../config/api';
import './Employees.css';

const EmployeeEdit = () => {
  const { subdomain, id } = useParams();
  const navigate = useNavigate();
  const { user, checkPermission } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [clients, setClients] = useState([]);
  const [vendors, setVendors] = useState([]);

  const [form, setForm] = useState({
    joinDate: '',
    clientId: '',
    vendorId: '',
    implPartnerId: ''
  });

  const fetchEmployee = useCallback(async () => {
    try {
      setLoading(true);
      if (!user?.tenantId) throw new Error('No tenant information');
      const resp = await fetch(`${API_BASE}/api/employees/${id}?tenantId=${user.tenantId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!resp.ok) throw new Error(`Failed to fetch employee (${resp.status})`);
      const data = await resp.json();
      const emp = data.employee || data;
      setEmployee(emp);
      setForm({
        joinDate: emp?.startDate ? new Date(emp.startDate).toISOString().slice(0,10) : (emp?.joinDate || ''),
        clientId: emp?.clientId || '',
        vendorId: emp?.vendorId || '',
        implPartnerId: emp?.implPartnerId || ''
      });
    } catch (e) {
      console.error('Fetch employee failed:', e);
      toast.error(e.message || 'Failed to load employee');
    } finally {
      setLoading(false);
    }
  }, [id, user?.tenantId, toast]);

  const fetchClients = useCallback(async () => {
    try {
      if (!user?.tenantId) return;
      const resp = await fetch(`${API_BASE}/api/clients?tenantId=${user.tenantId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!resp.ok) throw new Error(`Failed to fetch clients (${resp.status})`);
      const data = await resp.json();
      setClients(data.clients || []);
    } catch (e) {
      console.error('Fetch clients failed:', e);
    }
  }, [user?.tenantId]);

  const fetchVendors = useCallback(async () => {
    try {
      if (!user?.tenantId) return;
      const resp = await fetch(`${API_BASE}/api/vendors?tenantId=${user.tenantId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!resp.ok) throw new Error(`Failed to fetch vendors (${resp.status})`);
      const data = await resp.json();
      setVendors(data.vendors || []);
    } catch (e) {
      console.error('Fetch vendors failed:', e);
    }
  }, [user?.tenantId]);

  useEffect(() => {
    fetchEmployee();
    fetchClients();
    fetchVendors();
  }, [fetchEmployee, fetchClients, fetchVendors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!user?.tenantId) throw new Error('No tenant information');

      const body = {
        startDate: form.joinDate || null,
        clientId: form.clientId || null,
        vendorId: form.vendorId || null,
        implPartnerId: form.implPartnerId || null,
      };

      const resp = await fetch(`${API_BASE}/api/employees/${id}?tenantId=${user.tenantId}`, {
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
      toast.success('Employee updated');
      navigate(`/${subdomain}/employees/${id}`);
    } catch (e) {
      console.error('Save failed:', e);
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
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

  if (loading) {
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
                    <select
                      name="clientId"
                      className="form-select"
                      value={form.clientId || ''}
                      onChange={handleChange}
                    >
                      <option value="">-- Unassigned --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.clientName || c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Vendor</label>
                    <select
                      name="vendorId"
                      className="form-select"
                      value={form.vendorId || ''}
                      onChange={handleChange}
                    >
                      <option value="">-- Unassigned --</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Impl Partner</label>
                    <select
                      name="implPartnerId"
                      className="form-select"
                      value={form.implPartnerId || ''}
                      onChange={handleChange}
                    >
                      <option value="">-- Unassigned --</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-4 d-flex justify-content-end">
                <button className="btn btn-outline-light mr-2" onClick={() => navigate(-1)} disabled={saving}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
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
