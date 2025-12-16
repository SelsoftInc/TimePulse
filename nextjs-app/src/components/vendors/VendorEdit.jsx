'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PermissionGuard from '../common/PermissionGuard';
import { PERMISSIONS } from '@/utils/roles';
import { API_BASE } from '@/config/api';
import { decryptApiResponse } from '@/utils/encryption';
import VendorForm from './VendorForm';

const VendorEdit = () => {
  const { id, subdomain } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  // Hydration fix: Track if component is mounted on client
  const [isMounted, setIsMounted] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initialVendor, setInitialVendor] = useState(null);

  // Hydration fix: Set mounted state on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const fetchVendor = async () => {
      try {
        setLoading(true);
        setError('');
        const tenantId = user?.tenantId;
        if (!tenantId) throw new Error('No tenant information');
        const resp = await fetch(`${API_BASE}/api/vendors/${id}?tenantId=${tenantId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`}});
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.details || `Fetch failed with status ${resp.status}`);
        }
        const rawData = await resp.json();
        const data = decryptApiResponse(rawData);
        setInitialVendor(data?.vendor || null);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
  }, [isMounted, id, user?.tenantId]);

  const handleUpdate = async (payload) => {
    const tenantId = user?.tenantId;
    const resp = await fetch(`${API_BASE}/api/vendors/${id}?tenantId=${tenantId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`},
      body: JSON.stringify(payload)});
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.details ? JSON.stringify(err.details) : `Update failed with status ${resp.status}`);
    }
    // Consume response body to avoid unhandled promise issues and to verify success
    const rawData = await resp.json().catch(() => ({}));
    const data = decryptApiResponse(rawData);
    if (data && data.success === false) {
      throw new Error(data.error || 'Failed to update vendor');
    }
    router.push(`/${subdomain}/vendors/${id}`);
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
                <Link href={`/${subdomain}/vendors/${id}`} className="btn btn-outline-light">
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
