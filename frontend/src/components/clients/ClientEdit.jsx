import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PermissionGuard from '../common/PermissionGuard';
import { PERMISSIONS } from '../../utils/roles';
import ClientForm from './ClientForm';

const ClientEdit = () => {
  const { clientId, subdomain } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initialClient, setInitialClient] = useState(null);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        setLoading(true);
        const tenantId = user?.tenantId;
        if (!tenantId) throw new Error('No tenant information');
        const resp = await fetch(`http://localhost:5000/api/clients/${clientId}?tenantId=${tenantId}`, {
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
        setInitialClient(data.client || null);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [clientId, user?.tenantId]);

  const handleUpdate = async (payload) => {
    const tenantId = user?.tenantId;
    const resp = await fetch(`http://localhost:5000/api/clients/${clientId}?tenantId=${tenantId}`, {
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
    navigate(`/${subdomain}/clients/${clientId}`);
  };

  if (loading) return <div className="nk-content"><div className="container-fluid">Loading client...</div></div>;
  if (error) return <div className="nk-content"><div className="container-fluid text-danger">{error}</div></div>;
  if (!initialClient) return <div className="nk-content"><div className="container-fluid">Client not found.</div></div>;

  return (
    <PermissionGuard requiredPermission={PERMISSIONS.EDIT_CLIENT}>
      <div className="nk-content">
        <div className="container-fluid">
          <div className="nk-block-head nk-block-head-sm">
            <div className="nk-block-between">
              <div className="nk-block-head-content">
                <h3 className="nk-block-title">Edit Client</h3>
                <div className="nk-block-des text-soft">
                  <p>Editing: {initialClient?.name || 'Client'}</p>
                </div>
              </div>
              <div className="nk-block-head-content">
                <Link to={`/${subdomain}/clients/${clientId}`} className="btn btn-outline-light">
                  <em className="icon ni ni-arrow-left"></em>
                  <span>Back</span>
                </Link>
              </div>
            </div>
          </div>
          <ClientForm
            mode="edit"
            initialData={initialClient}
            onSubmitOverride={handleUpdate}
            submitLabel="Save Changes"
          />
        </div>
      </div>
    </PermissionGuard>
  );
};

export default ClientEdit;
