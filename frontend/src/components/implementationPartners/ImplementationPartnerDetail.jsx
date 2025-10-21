import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { API_BASE } from '../../config/api';
import { PERMISSIONS } from '../../utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import ConfirmDialog from '../common/ConfirmDialog';
import './ImplementationPartners.css';

const ImplementationPartnerDetail = () => {
  const { subdomain, id } = useParams();
  const navigate = useNavigate();
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
      navigate(`/${subdomain}/implementation-partners`);
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
        <Link to={`/${subdomain}/implementation-partners`} className="btn btn-secondary">
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
        <Link to={`/${subdomain}/implementation-partners`} className="btn btn-secondary">
          Back to Implementation Partners
        </Link>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to={`/${subdomain}/implementation-partners`}>
                      Implementation Partners
                    </Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    {implementationPartner.name}
                  </li>
                </ol>
              </nav>
              <h2 className="mb-0">{implementationPartner.name}</h2>
            </div>
            <div className="d-flex gap-2">
              <PermissionGuard requiredPermission={PERMISSIONS.EDIT_IMPLEMENTATION_PARTNER}>
                <Link
                  to={`/${subdomain}/implementation-partners/${id}/edit`}
                  className="btn btn-outline-primary"
                >
                  <i className="fas fa-edit me-2"></i>
                  Edit
                </Link>
              </PermissionGuard>
              <PermissionGuard requiredPermission={PERMISSIONS.DELETE_IMPLEMENTATION_PARTNER}>
                {implementationPartner.status === 'active' ? (
                  <button
                    className="btn btn-outline-warning"
                    onClick={() => confirmAction('deactivate')}
                  >
                    <i className="fas fa-pause me-2"></i>
                    Deactivate
                  </button>
                ) : (
                  <button
                    className="btn btn-outline-success"
                    onClick={() => confirmAction('restore')}
                  >
                    <i className="fas fa-play me-2"></i>
                    Activate
                  </button>
                )}
                <button
                  className="btn btn-outline-danger"
                  onClick={() => confirmAction('delete')}
                >
                  <i className="fas fa-trash me-2"></i>
                  Delete
                </button>
              </PermissionGuard>
            </div>
          </div>

          <div className="row">
            <div className="col-md-8">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Implementation Partner Details</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-bold">Status</label>
                        <div>
                          <span className={getStatusBadgeClass(implementationPartner.status)}>
                            {implementationPartner.status}
                          </span>
                        </div>
                      </div>

                      {implementationPartner.legalName && (
                        <div className="mb-3">
                          <label className="form-label fw-bold">Legal Name</label>
                          <p className="form-control-plaintext">{implementationPartner.legalName}</p>
                        </div>
                      )}

                      {implementationPartner.contactPerson && (
                        <div className="mb-3">
                          <label className="form-label fw-bold">Contact Person</label>
                          <p className="form-control-plaintext">{implementationPartner.contactPerson}</p>
                        </div>
                      )}

                      {implementationPartner.email && (
                        <div className="mb-3">
                          <label className="form-label fw-bold">Email</label>
                          <p className="form-control-plaintext">
                            <a href={`mailto:${implementationPartner.email}`}>
                              {implementationPartner.email}
                            </a>
                          </p>
                        </div>
                      )}

                      {implementationPartner.phone && (
                        <div className="mb-3">
                          <label className="form-label fw-bold">Phone</label>
                          <p className="form-control-plaintext">
                            <a href={`tel:${implementationPartner.phone}`}>
                              {implementationPartner.phone}
                            </a>
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      {implementationPartner.specialization && (
                        <div className="mb-3">
                          <label className="form-label fw-bold">Specialization</label>
                          <p className="form-control-plaintext">{implementationPartner.specialization}</p>
                        </div>
                      )}

                      {implementationPartner.address && (
                        <div className="mb-3">
                          <label className="form-label fw-bold">Address</label>
                          <p className="form-control-plaintext">{implementationPartner.address}</p>
                        </div>
                      )}

                      {(implementationPartner.city || implementationPartner.state || implementationPartner.zip) && (
                        <div className="mb-3">
                          <label className="form-label fw-bold">Location</label>
                          <p className="form-control-plaintext">
                            {[implementationPartner.city, implementationPartner.state, implementationPartner.zip]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        </div>
                      )}

                      {implementationPartner.country && (
                        <div className="mb-3">
                          <label className="form-label fw-bold">Country</label>
                          <p className="form-control-plaintext">{implementationPartner.country}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {implementationPartner.notes && (
                    <div className="mb-3">
                      <label className="form-label fw-bold">Notes</label>
                      <div className="form-control-plaintext bg-light p-3 rounded">
                        {implementationPartner.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Additional Information</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Created</label>
                    <p className="form-control-plaintext">
                      {new Date(implementationPartner.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Last Updated</label>
                    <p className="form-control-plaintext">
                      {new Date(implementationPartner.updated_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Category</label>
                    <p className="form-control-plaintext">
                      <span className="badge bg-info">
                        {implementationPartner.category || 'Implementation Partner'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
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
