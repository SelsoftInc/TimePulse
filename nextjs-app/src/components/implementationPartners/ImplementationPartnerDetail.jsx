'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { API_BASE } from '@/config/api';
import { PERMISSIONS } from '@/utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import ConfirmDialog from '../common/ConfirmDialog';
import './ImplementationPartners.css';

const ImplementationPartnerDetail = () => {
  const { subdomain, id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [implementationPartner, setImplementationPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    const fetchImplementationPartner = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await fetch(
          `${API_BASE}/api/implementation-partners/${id}?tenantId=${user.tenantId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Implementation Partner not found');
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setImplementationPartner(data.implementationPartner);
      } catch (err) {
        console.error('Error fetching implementation partner:', err);
        setError(err.message || 'Failed to load implementation partner');
        toast.error(err.message || 'Failed to load implementation partner');
      } finally {
        setLoading(false);
      }
    };

    if (user?.tenantId) {
      fetchImplementationPartner();
    }
  }, [id, user?.tenantId, toast]);

  const handleDelete = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/implementation-partners/${id}?tenantId=${user.tenantId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      toast.success('Implementation Partner deleted successfully');
      router.push(`/${subdomain}/implementation-partners`);
    } catch (err) {
      console.error('Error deleting implementation partner:', err);
      toast.error(err.message || 'Failed to delete implementation partner');
    } finally {
      setConfirmOpen(false);
    }
  };

  const handleSoftDelete = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/implementation-partners/${id}/soft-delete?tenantId=${user.tenantId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      setImplementationPartner(prev => ({
        ...prev,
        status: 'inactive'
      }));
      toast.success('Implementation Partner deactivated successfully');
    } catch (err) {
      console.error('Error deactivating implementation partner:', err);
      toast.error(err.message || 'Failed to deactivate implementation partner');
    } finally {
      setConfirmOpen(false);
    }
  };

  const handleRestore = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/implementation-partners/${id}/restore?tenantId=${user.tenantId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      setImplementationPartner(prev => ({
        ...prev,
        status: 'active'
      }));
      toast.success('Implementation Partner restored successfully');
    } catch (err) {
      console.error('Error restoring implementation partner:', err);
      toast.error(err.message || 'Failed to restore implementation partner');
    } finally {
      setConfirmOpen(false);
    }
  };

  const confirmAction = (type) => {
    setActionType(type);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    switch (actionType) {
      case 'delete':
        handleDelete();
        break;
      case 'deactivate':
        handleSoftDelete();
        break;
      case 'restore':
        handleRestore();
        break;
      default:
        break;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'badge bg-success';
      case 'inactive':
        return 'badge bg-warning';
      case 'pending':
        return 'badge bg-secondary';
      default:
        return 'badge bg-secondary';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <Link href={`/${subdomain}/implementation-partners`} className="btn btn-secondary">
          Back to Implementation Partners
        </Link>
      </div>
    );
  }

  if (!implementationPartner) {
    return (
      <div className="container-fluid">
        <div className="alert alert-warning" role="alert">
          Implementation Partner not found
        </div>
        <Link href={`/${subdomain}/implementation-partners`} className="btn btn-secondary">
          Back to Implementation Partners
        </Link>
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
                    {implementationPartner.name}
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    Implementation Partner Details
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/${subdomain}/implementation-partners/edit/${id}`}
                    className="btn btn-primary"
                  >
                    <em className="icon ni ni-edit"></em>
                    <span>Edit Partner</span>
                  </Link>
                  <button
                    onClick={() => router.push(`/${subdomain}/implementation-partners`)}
                    className="btn btn-outline-light"
                  >
                    <em className="icon ni ni-arrow-left"></em>
                    <span>Back</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              
              {/* Basic Information */}
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <header className="rounded-t-xl border-b border-slate-200 bg-slate-50 px-6 py-4">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Basic Information
                  </h4>
                </header>
                <div className="p-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Implementation Partner Name
                    </label>
                    <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                      {implementationPartner.name || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Legal Name
                    </label>
                    <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                      {implementationPartner.legalName || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Contact Person
                    </label>
                    <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                      {implementationPartner.contactPerson || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Specialization
                    </label>
                    <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                      {implementationPartner.specialization || 'N/A'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Contact Information */}
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <header className="rounded-t-xl border-b border-slate-200 bg-slate-50 px-6 py-4">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Contact Information
                  </h4>
                </header>
                <div className="p-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Email
                    </label>
                    <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                      {implementationPartner.email ? (
                        <a href={`mailto:${implementationPartner.email}`} className="text-blue-600 hover:underline">
                          {implementationPartner.email}
                        </a>
                      ) : 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Phone
                    </label>
                    <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                      {implementationPartner.phone ? (
                        <a href={`tel:${implementationPartner.phone}`} className="text-blue-600 hover:underline">
                          {implementationPartner.phone}
                        </a>
                      ) : 'N/A'}
                    </p>
                  </div>
                </div>
              </section>
              
              {/* Address */}
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <header className="rounded-t-xl border-b border-slate-200 bg-slate-50 px-6 py-4">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Address
                  </h4>
                </header>
                <div className="p-6 grid grid-cols-1 gap-5">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Address
                    </label>
                    <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                      {implementationPartner.address || 'N/A'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        City
                      </label>
                      <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                        {implementationPartner.city || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        State / Province
                      </label>
                      <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                        {implementationPartner.state || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        PIN Code
                      </label>
                      <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                        {implementationPartner.zip || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Country
                    </label>
                    <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                      {implementationPartner.country || 'N/A'}
                    </p>
                  </div>
                </div>
              </section>
              
              {/* Additional Information */}
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <header className="rounded-t-xl border-b border-slate-200 bg-slate-50 px-6 py-4">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Additional Information
                  </h4>
                </header>
                <div className="p-6 grid grid-cols-1 gap-5">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Status
                    </label>
                    <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        implementationPartner.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : implementationPartner.status === 'inactive'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <span className={`w-2 h-2 mr-2 rounded-full ${
                          implementationPartner.status === 'active' 
                            ? 'bg-green-500' 
                            : implementationPartner.status === 'inactive'
                            ? 'bg-yellow-500'
                            : 'bg-gray-500'
                        }`}></span>
                        {(implementationPartner.status || '').charAt(0).toUpperCase() + (implementationPartner.status || '').slice(1)}
                      </span>
                    </p>
                  </div>
                  
                  {implementationPartner.notes && (
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Notes
                      </label>
                      <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                        {implementationPartner.notes}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        title={
          actionType === 'delete' ? 'Delete Implementation Partner' :
          actionType === 'deactivate' ? 'Deactivate Implementation Partner' :
          'Activate Implementation Partner'
        }
        message={
          actionType === 'delete' ? 
            'Are you sure you want to delete this implementation partner? This action cannot be undone.' :
          actionType === 'deactivate' ?
            'Are you sure you want to deactivate this implementation partner?' :
            'Are you sure you want to activate this implementation partner?'
        }
        confirmText={
          actionType === 'delete' ? 'Delete' :
          actionType === 'deactivate' ? 'Deactivate' :
          'Activate'
        }
        cancelText="Cancel"
        variant={actionType === 'delete' ? 'danger' : 'warning'}
      />
    </div>
  );
};

export default ImplementationPartnerDetail;
