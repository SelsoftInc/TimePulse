import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../../config/api';
import { PERMISSIONS } from '../../utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import ImplementationPartnerForm from './ImplementationPartnerForm';
import './ImplementationPartners.css';

const ImplementationPartnerEdit = () => {
  const { subdomain, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [implementationPartner, setImplementationPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const handleSubmit = (updatedImplementationPartner) => {
    if (updatedImplementationPartner) {
      toast.success('Implementation Partner updated successfully');
      navigate(`/${subdomain}/implementation-partners/${id}`);
    } else {
      navigate(`/${subdomain}/implementation-partners`);
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
        <button 
          className="btn btn-secondary"
          onClick={() => navigate(`/${subdomain}/implementation-partners`)}
        >
          Back to Implementation Partners
        </button>
      </div>
    );
  }

  if (!implementationPartner) {
    return (
      <div className="container-fluid">
        <div className="alert alert-warning" role="alert">
          Implementation Partner not found
        </div>
        <button 
          className="btn btn-secondary"
          onClick={() => navigate(`/${subdomain}/implementation-partners`)}
        >
          Back to Implementation Partners
        </button>
      </div>
    );
  }

  return (
    <PermissionGuard requiredPermission={PERMISSIONS.EDIT_IMPLEMENTATION_PARTNER}>
      <ImplementationPartnerForm
        mode="edit"
        initialData={implementationPartner}
        onSubmitOverride={handleSubmit}
        submitLabel="Update Implementation Partner"
      />
    </PermissionGuard>
  );
};

export default ImplementationPartnerEdit;
