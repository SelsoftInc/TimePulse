import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PERMISSIONS } from '../../utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import { useAuth } from '../../contexts/AuthContext';
import './Clients.css';

const ClientsList = () => {
  const { subdomain } = useParams();
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch clients from backend API
  const fetchClients = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!user?.tenantId) {
        setError('No tenant information available');
        setLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:5001/api/clients?tenantId=${user.tenantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setClients(data.clients || []);
      } else {
        setError(data.error || 'Failed to fetch clients');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError('Failed to load clients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [user?.tenantId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="nk-content">
      <div className="container-fluid">
        <div className="nk-block-head">
          <div className="nk-block-between">
            <div className="nk-block-head-content">
              <h3 className="nk-block-title">Clients</h3>
              <p className="nk-block-subtitle">Manage your client relationships</p>
            </div>
            <div className="nk-block-head-content">
              <PermissionGuard requiredPermission={PERMISSIONS.CREATE_CLIENT}>
                <Link to={`/${subdomain}/clients/new`} className="btn btn-primary">
                  <i className="fas fa-plus mr-1"></i> Add New Client
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
              <button 
                className="btn btn-sm btn-outline-danger ml-3"
                onClick={fetchClients}
              >
                <i className="fas fa-redo mr-1"></i> Retry
              </button>
            </div>
          ) : loading ? (
            <div className="d-flex justify-content-center mt-5">
              <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-inner">
                <table className="table table-clients">
                  <thead>
                    <tr>
                      <th>Client Name</th>
                      <th>Contact Person</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Employees</th>
                      <th>Total Billed</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(client => (
                      <tr key={client.id}>
                        <td>
                          <Link to={`/${subdomain}/clients/${client.id}`} className="client-name">
                            {client.name}
                          </Link>
                        </td>
                        <td>{client.contactPerson}</td>
                        <td>{client.email}</td>
                        <td>{client.phone}</td>
                        <td>
                          <span className={`badge badge-${client.status === 'active' ? 'success' : 'warning'}`}>
                            {client.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>{client.employeeCount}</td>
                        <td>${client.totalBilled.toLocaleString()}</td>
                        <td className="text-right">
                          <div className="dropdown">
                            <button className="btn btn-sm btn-icon btn-trigger dropdown-toggle">
                              <i className="fas fa-ellipsis-h"></i>
                            </button>
                            <div className="dropdown-menu dropdown-menu-right">
                              <Link to={`/${subdomain}/clients/${client.id}`} className="dropdown-item">
                                <i className="fas fa-eye mr-1"></i> View Details
                              </Link>
                              <button type="button" className="dropdown-item">
                                <i className="fas fa-edit mr-1"></i> Edit
                              </button>
                              <button type="button" className="dropdown-item text-danger">
                                <i className="fas fa-trash-alt mr-1"></i> Delete
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientsList;
