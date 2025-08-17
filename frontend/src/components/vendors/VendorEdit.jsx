import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PermissionGuard from '../common/PermissionGuard';
import { PERMISSIONS } from '../../utils/roles';
import { API_BASE } from '../../config/api';
import VendorForm from './VendorForm';

const VendorEdit = () => {
  const { id, subdomain } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initialVendor, setInitialVendor] = useState(null);

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        setLoading(true);
        setError('');
        const tenantId = user?.tenantId;
        if (!tenantId) throw new Error('No tenant information');
        const resp = await fetch(`${API_BASE}/api/vendors/${id}?tenantId=${tenantId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.details || `Fetch failed with status ${resp.status}`);
        }
        const data = await resp.json();
        setInitialVendor(data.vendor || null);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
  }, [id, user?.tenantId]);

  const handleUpdate = async (payload) => {
    const tenantId = user?.tenantId;
    const resp = await fetch(`${API_BASE}/api/vendors/${id}?tenantId=${tenantId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.details ? JSON.stringify(err.details) : `Update failed with status ${resp.status}`);
    }
    navigate(`/${subdomain}/vendors/${id}`);
  };

  if (loading) return <div className="nk-content"><div className="container-fluid">Loading vendor...</div></div>;
  if (error) return <div className="nk-content"><div className="container-fluid text-danger">{error}</div></div>;
  if (!initialVendor) return <div className="nk-content"><div className="container-fluid">Vendor not found.</div></div>;

  return (
    <PermissionGuard requiredPermission={PERMISSIONS.EDIT_VENDOR}>
      <div className="nk-content">
        <div className="container-fluid">
          <div className="nk-block-head nk-block-head-sm">
            <div className="nk-block-between">
              <div className="nk-block-head-content">
                <h3 className="nk-block-title">Edit Vendor</h3>
                <div className="nk-block-des text-soft">
                  <p>Editing: {initialVendor?.name || 'Vendor'}</p>
                </div>
              </div>
              <div className="nk-block-head-content">
                <Link to={`/${subdomain}/vendors/${id}`} className="btn btn-outline-light">
                  <em className="icon ni ni-arrow-left"></em>
                  <span>Back</span>
                </Link>
              </div>
            </div>
          </div>
          <VendorForm
            mode="edit"
            initialData={initialVendor}
            onSubmitOverride={handleUpdate}
            submitLabel="Save Changes"
          />
        </div>
      </div>
    </PermissionGuard>
  );
};

export default VendorEdit;
