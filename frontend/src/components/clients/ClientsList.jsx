import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PERMISSIONS } from '../../utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import './Clients.css';

const ClientsList = () => {
  const { subdomain } = useParams();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch clients from API
    // For now, using mock data
    setTimeout(() => {
      const mockClients = [
        {
          id: 1,
          name: 'JPMC',
          contactPerson: 'John Morgan',
          email: 'john@jpmc.com',
          phone: '(555) 123-4567',
          status: 'active',
          employeeCount: 7,
          totalBilled: 80000
        },
        {
          id: 2,
          name: 'Accenture',
          contactPerson: 'Jane Smith',
          email: 'jane@accenture.com',
          phone: '(555) 987-6543',
          status: 'active',
          employeeCount: 5,
          totalBilled: 50000
        },
        {
          id: 3,
          name: 'Virtusa',
          contactPerson: 'Tony Veer',
          email: 'tony@virtusa.com',
          phone: '(555) 111-2222',
          status: 'active',
          employeeCount: 3,
          totalBilled: 30000
        },
        {
          id: 4,
          name: 'Cognizant',
          contactPerson: 'Bruce Cohen',
          email: 'bruce@cognizant.com',
          phone: '(555) 333-4444',
          status: 'active',
          employeeCount: 5,
          totalBilled: 45000
        },
        {
          id: 5,
          name: 'IBM',
          contactPerson: 'Lisa Blue',
          email: 'lisa@ibm.com',
          phone: '(555) 555-5555',
          status: 'active',
          employeeCount: 10,
          totalBilled: 90000
        }
      ];
      
      setClients(mockClients);
      setLoading(false);
    }, 800);
  }, []);

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
          {loading ? (
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
