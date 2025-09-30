import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { API_BASE } from '../../config/api';
import { PERMISSIONS } from '../../utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import ConfirmDialog from '../common/ConfirmDialog';

const VendorList = () => {
  const { subdomain } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const isImplPartnerView = new URLSearchParams(location.search).get('implPartner');
  const { toast } = useToast();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        setError('');
        if (!user?.tenantId) {
          setError('No tenant information available');
          setVendors([]);
          return;
        }
        const resp = await fetch(`${API_BASE}/api/vendors?tenantId=${user.tenantId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (data.success) {
          setVendors(data.vendors || []);
        } else {
          setError(data.error || 'Failed to fetch vendors');
        }
      } catch (e) {
        console.error('Error fetching vendors:', e);
        setError('Failed to load vendors. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, [user?.tenantId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      // Close dropdown when clicking outside
      if (openMenuId !== null) {
        const dropdownEl = document.querySelector(`[data-dropdown-id="${openMenuId}"]`);
        const isClickInside = dropdownEl?.contains(e.target);
        if (!isClickInside) {
          setOpenMenuId(null);
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenuId]);

  const toggleMenu = (id) => setOpenMenuId(prev => (prev === id ? null : id));

  const handleDelete = async (vendorId) => {
    try {
      const resp = await fetch(`${API_BASE}/api/vendors/${vendorId}?tenantId=${user.tenantId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Delete failed with status ${resp.status}`);
      }
      // Refresh list
      const refreshed = await fetch(`${API_BASE}/api/vendors?tenantId=${user.tenantId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await refreshed.json().catch(() => ({ vendors: [] }));
      setVendors(data.vendors || []);
      toast.success('Vendor deleted');
    } catch (e) {
      toast.error(`Failed to delete: ${e.message}`);
    } finally {
      setOpenMenuId(null);
      setConfirmOpen(false);
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="nk-conten">
      <div className="container-fluid">
        <div className="nk-block-head">
          <div className="nk-block-between">
            <div className="nk-block-head-content">
              <h3 className="nk-block-title">{isImplPartnerView ? 'Impl Partners' : 'Vendors'}</h3>
              <p className="nk-block-subtitle">Manage your {isImplPartnerView ? 'implementation partner' : 'vendor'} relationships</p>
            </div>
            <div className="nk-block-head-content">
              <PermissionGuard requiredPermission={PERMISSIONS.CREATE_VENDOR}>
                <Link to={`/${subdomain}/vendors/new`} className="btn btn-primary">
                  <i className="fas fa-plus mr-1"></i> {isImplPartnerView ? 'Add Impl Partner' : 'Add New Vendor'}
                </Link>
              </PermissionGuard>
            </div>
          </div>
        </div>

        <div className="nk-block">
          {error ? (
            <div className="alert alert-danger" role="alert">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              {error}
            </div>
          ) : loading ? (
            <div className="d-flex justify-content-center mt-5">
              <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-inne">
                {vendors.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    <p className="mb-2">No vendors found.</p>
                    <PermissionGuard requiredPermission={PERMISSIONS.CREATE_VENDOR}>
                      <Link to={`/${subdomain}/vendors/new`} className="btn btn-primary">
                        <i className="fas fa-plus mr-1"></i> Add Your First Vendor
                      </Link>
                    </PermissionGuard>
                  </div>
                ) : (
                  <table className="table table-vendors">
                    <thead>
                      <tr>
                        <th>Vendor Name</th>
                        <th>Contact Person</th>
                        <th>Category</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Status</th>
                        <th>Total Spent</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendors.map(vendor => (
                        <tr key={vendor.id}>
                          <td>
                            <Link to={`/${subdomain}/vendors/${vendor.id}`} className="vendor-name">
                              {vendor.name}
                            </Link>
                          </td>
                          <td>{vendor.contactPerson}</td>
                          <td>{vendor.category}</td>
                          <td>{vendor.email}</td>
                          <td>{vendor.phone}</td>
                          <td>
                            <span className={`badge badge-${vendor.status === 'active' ? 'success' : vendor.status === 'pending' ? 'warning' : 'secondary'}`}>
                              {vendor.status === 'active' ? 'Active' : vendor.status === 'pending' ? 'Pending' : 'Inactive'}
                            </span>
                          </td>
                          <td>${Number(vendor.totalSpent || 0).toLocaleString()}</td>
                          <td className="text-right">
                            <div className="dropdown" data-dropdown-id={vendor.id} style={{ position: 'relative' }}>
                              <button 
                                className="btn btn-sm btn-icon btn-trigger" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMenu(vendor.id);
                                }}
                                type="button"
                              >
                                <i className="fas fa-ellipsis-h"></i>
                              </button>
                              <div className={`dropdown-menu dropdown-menu-right ${openMenuId === vendor.id ? 'show' : ''}`}>
                                <Link 
                                  to={`/${subdomain}/vendors/${vendor.id}`} 
                                  className="dropdown-item"
                                  onClick={() => setOpenMenuId(null)}
                                >
                                  <i className="fas fa-eye mr-1"></i> View Details
                                </Link>
                                <PermissionGuard requiredPermission={PERMISSIONS.EDIT_VENDOR}>
                                  <Link 
                                    to={`/${subdomain}/vendors/edit/${vendor.id}`} 
                                    className="dropdown-item"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    <i className="fas fa-edit mr-1"></i> Edit
                                  </Link>
                                </PermissionGuard>
                                <PermissionGuard requiredPermission={PERMISSIONS.DELETE_VENDOR}>
                                  <button
                                    type="button"
                                    className="dropdown-item text-danger"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(null);
                                      setPendingDeleteId(vendor.id);
                                      setConfirmOpen(true);
                                    }}
                                  >
                                    <i className="fas fa-trash-alt mr-1"></i> Delete
                                  </button>
                                </PermissionGuard>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
        <ConfirmDialog
          open={confirmOpen}
          title="Delete Vendor"
          message="Are you sure you want to delete this vendor? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={() => pendingDeleteId && handleDelete(pendingDeleteId)}
          onCancel={() => { setConfirmOpen(false); setPendingDeleteId(null); }}
        />
      </div>
    </div>
  );
};

export default VendorList;
