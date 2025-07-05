import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
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
          name: 'Acme Corporation',
          contactPerson: 'John Doe',
          email: 'john@acmecorp.com',
          phone: '(555) 123-4567',
          status: 'active',
          projectCount: 3,
          totalBilled: 12500
        },
        {
          id: 2,
          name: 'Globex Industries',
          contactPerson: 'Jane Smith',
          email: 'jane@globex.com',
          phone: '(555) 987-6543',
          status: 'active',
          projectCount: 2,
          totalBilled: 8750
        },
        {
          id: 3,
          name: 'Stark Enterprises',
          contactPerson: 'Tony Stark',
          email: 'tony@stark.com',
          phone: '(555) 111-2222',
          status: 'inactive',
          projectCount: 1,
          totalBilled: 5000
        },
        {
          id: 4,
          name: 'Wayne Industries',
          contactPerson: 'Bruce Wayne',
          email: 'bruce@wayne.com',
          phone: '(555) 333-4444',
          status: 'active',
          projectCount: 4,
          totalBilled: 15000
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
              <button className="btn btn-primary">
                <i className="fas fa-plus mr-1"></i> Add New Client
              </button>
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
                      <th>Projects</th>
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
                        <td>{client.projectCount}</td>
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
