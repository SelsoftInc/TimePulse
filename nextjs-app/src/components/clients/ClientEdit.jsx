'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { API_BASE } from '@/config/api';
import PermissionGuard from '../common/PermissionGuard';
import { PERMISSIONS } from '@/utils/roles';
import ClientForm from './ClientForm';

const ClientEdit = () => {
  const { id, subdomain } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Hydration fix: Track if component is mounted on client
  const [isMounted, setIsMounted] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initialClient, setInitialClient] = useState(null);

  // Hydration fix: Set mounted state on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const fetchClient = async () => {
      try {
        setLoading(true);
        const tenantId = user?.tenantId;
        if (!tenantId) throw new Error('No tenant information');
        const resp = await fetch(`${API_BASE}/api/clients/${id}?tenantId=${tenantId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`}});
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
  }, [isMounted, id, user?.tenantId]);

  const handleUpdate = async (payload) => {
    const tenantId = user?.tenantId;
    const resp = await fetch(`${API_BASE}/api/clients/${id}?tenantId=${tenantId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`},
      body: JSON.stringify(payload)});
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.details ? JSON.stringify(err.details) : `Update failed with status ${resp.status}`);
    }
    
    const result = await resp.json();
    toast.success('Client updated successfully', {
      title: 'Success'
    });
    
    router.push(`/${subdomain}/clients/${id}`);
  };

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

  if (loading) return <div className="nk-content"><div className="container-fluid">Loading client...</div></div>;
  if (error) return <div className="nk-content"><div className="container-fluid text-danger">{error}</div></div>;
  if (!initialClient) return <div className="nk-content"><div className="container-fluid">Client not found.</div></div>;

  return (
    <PermissionGuard requiredPermission={PERMISSIONS.EDIT_CLIENT}>
      <div className="nk-content">
        <div className="container-fluid">
          {/* <div className="nk-block-head nk-block-head-sm">
            <div className="nk-block-between">
              <div className="nk-block-head-content">
                <h3 className="nk-block-title">Edit Client</h3>
                <div className="nk-block-des text-soft">
                  <p>Editing: {initialClient?.name || 'Client'}</p>
                </div>
              </div>
              <div className="nk-block-head-content">
                <Link href={`/${subdomain}/clients/${id}`} className="btn btn-outline-light">
                  <em className="icon ni ni-arrow-left"></em>
                  <span>Back</span>
                </Link>
              </div>
            </div>
          </div> */}
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
