// src/components/clients/ClientOverview.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import './ClientOverview.css';

const ClientOverview = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [tenantInfo, setTenantInfo] = useState(null);
  
  // Define fetchClientData with useCallback to avoid dependency issues
  const fetchClientData = useCallback(async () => {
    try {
      setLoading(true);
      // In a real app, this would be an API call with the tenant ID included
      // For example: `/api/${tenantInfo?.subdomain}/clients/${clientId}`
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      
      // Sample client data - in a real app, this would come from an API
      const clientData = {
        1: { id: 1, name: "JPMC", employeeCount: 7, industry: "Finance", contactPerson: "John Smith", email: "john.smith@jpmc.com", status: "Active" },
        2: { id: 2, name: "Accenture", employeeCount: 5, industry: "Consulting", contactPerson: "Sarah Johnson", email: "sarah.j@accenture.com", status: "Active" },
        3: { id: 3, name: "Virtusa", employeeCount: 3, industry: "IT Services", contactPerson: "Mike Chen", email: "mike.chen@virtusa.com", status: "Pending" },
        4: { id: 4, name: "Cognizant", employeeCount: 5, industry: "IT Services", contactPerson: "Lisa Wong", email: "lisa.wong@cognizant.com", status: "Active" },
        5: { id: 5, name: "IBM", employeeCount: 10, industry: "Technology", contactPerson: "David Miller", email: "david.miller@ibm.com", status: "Active" }
      };

      // Sample employee data - in a real app, this would come from an API
      const employeeData = {
        1: [ // JPMC
          { id: 1, name: "John Doe", weeklyHours: 40, status: "Submitted", role: "Developer", email: "john.doe@example.com" },
          { id: 2, name: "Jane Smith", weeklyHours: 36, status: "Draft", role: "Designer", email: "jane.smith@example.com" },
          { id: 3, name: "Robert Johnson", weeklyHours: 42, status: "Approved", role: "Project Manager", email: "robert.j@example.com" },
          { id: 4, name: "Emily Davis", weeklyHours: 38, status: "Submitted", role: "Developer", email: "emily.d@example.com" },
          { id: 5, name: "Michael Brown", weeklyHours: 40, status: "Draft", role: "QA Engineer", email: "michael.b@example.com" },
          { id: 6, name: "Sarah Wilson", weeklyHours: 35, status: "Submitted", role: "Business Analyst", email: "sarah.w@example.com" },
          { id: 7, name: "David Miller", weeklyHours: 40, status: "Approved", role: "Developer", email: "david.m@example.com" }
        ],
        2: [ // Accenture
          { id: 8, name: "Thomas Anderson", weeklyHours: 40, status: "Submitted", role: "Developer", email: "thomas.a@example.com" },
          { id: 9, name: "Lisa Taylor", weeklyHours: 38, status: "Draft", role: "Designer", email: "lisa.t@example.com" },
          { id: 10, name: "James Martinez", weeklyHours: 40, status: "Approved", role: "Project Manager", email: "james.m@example.com" },
          { id: 11, name: "Jennifer Garcia", weeklyHours: 36, status: "Submitted", role: "Developer", email: "jennifer.g@example.com" },
          { id: 12, name: "Daniel Rodriguez", weeklyHours: 40, status: "Draft", role: "QA Engineer", email: "daniel.r@example.com" }
        ],
        // Other clients' employees would be here
      };
      
      setClient(clientData[clientId]);
      setEmployees(employeeData[clientId] || []);
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);
  
  // Get tenant information from localStorage
  useEffect(() => {
    const currentTenant = JSON.parse(localStorage.getItem('currentTenant'));
    if (!currentTenant) {
      navigate('/workspaces');
      return;
    }
    setTenantInfo(currentTenant);
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Fetch client and employee data
    fetchClientData();
  }, [navigate, fetchClientData]);
  
  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Function to render status badge
  const renderStatusBadge = (status) => {
    switch(status) {
      case 'Approved':
        return <span className="badge badge-success">✅ Approved</span>;
      case 'Submitted':
        return <span className="badge badge-info">✅ Submitted</span>;
      case 'Draft':
        return <span className="badge badge-light">📝 Draft</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  // Filter employees based on status
  const filteredEmployees = statusFilter === 'all' 
    ? employees 
    : employees.filter(emp => emp.status.toLowerCase() === statusFilter.toLowerCase());

  if (loading) {
    return (
      <div className="nk-content">
        <div className="container-fluid">
          <div className="nk-content-inner">
            <div className="nk-content-body">
              <div className="nk-block-head nk-block-head-sm">
                <div className="loading-spinner">Loading client data...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nk-content">
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            {/* Tenant Info Banner */}
            {tenantInfo && (
              <div className="tenant-banner">
                <span>Workspace: {tenantInfo.name}</span>
              </div>
            )}
            
            {/* Client Header */}
            <div className="nk-block-head nk-block-head-sm">
              <div className="nk-block-between">
                <div className="nk-block-head-content">
                  <h3 className="nk-block-title page-title">{client?.name}</h3>
                  <div className="nk-block-des text-soft">
                    <p>{client?.employeeCount} employees assigned</p>
                  </div>
                </div>
                <div className="nk-block-head-content">
                  <div className="toggle-wrap nk-block-tools-toggle">
                    <button className="btn btn-primary">
                      <em className="icon ni ni-plus"></em>
                      <span>Add Employee</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Details Card */}
            <div className="nk-block">
              <div className="card card-bordered">
                <div className="card-inner">
                  <div className="row g-4">
                    <div className="col-lg-6">
                      <div className="client-detail-item">
                        <span className="detail-label">Industry:</span>
                        <span className="detail-value">{client?.industry}</span>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="client-detail-item">
                        <span className="detail-label">Contact Person:</span>
                        <span className="detail-value">{client?.contactPerson}</span>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="client-detail-item">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{client?.email}</span>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="client-detail-item">
                        <span className="detail-label">Status:</span>
                        <span className="detail-value">
                          <span className={`badge ${client?.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                            {client?.status}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Employee List */}
            <div className="nk-block mt-4">
              <div className="card card-bordered card-stretch">
                <div className="card-inner-group">
                  <div className="card-inner position-relative">
                    <div className="card-title-group">
                      <div className="card-title">
                        <h5 className="title">Employee List</h5>
                      </div>
                      <div className="card-tools">
                        <div className="form-inline flex-nowrap gx-3">
                          <div className="form-wrap w-150px">
                            <select 
                              className="form-select form-select-sm" 
                              value={statusFilter}
                              onChange={handleStatusFilterChange}
                            >
                              <option value="all">All Status</option>
                              <option value="draft">Draft</option>
                              <option value="submitted">Submitted</option>
                              <option value="approved">Approved</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="card-inner p-0">
                    <div className="nk-tb-list nk-tb-ulist">
                      <div className="nk-tb-item nk-tb-head">
                        <div className="nk-tb-col"><span className="sub-text">Employee Name</span></div>
                        <div className="nk-tb-col tb-col-md"><span className="sub-text">Role</span></div>
                        <div className="nk-tb-col tb-col-md"><span className="sub-text">Current Week Hours</span></div>
                        <div className="nk-tb-col tb-col-md"><span className="sub-text">Status</span></div>
                        <div className="nk-tb-col nk-tb-col-tools text-end">Actions</div>
                      </div>
                      
                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map(employee => (
                          <div key={employee.id} className="nk-tb-item">
                            <div className="nk-tb-col">
                              <div className="user-card">
                                <div className="user-avatar bg-primary">
                                  <span>{employee.name.split(' ').map(n => n[0]).join('')}</span>
                                </div>
                                <div className="user-info">
                                  <span className="tb-lead">{employee.name}</span>
                                  <span>{employee.email}</span>
                                </div>
                              </div>
                            </div>
                            <div className="nk-tb-col tb-col-md">
                              <span>{employee.role}</span>
                            </div>
                            <div className="nk-tb-col tb-col-md">
                              <span>{employee.weeklyHours} hours</span>
                            </div>
                            <div className="nk-tb-col tb-col-md">
                              {renderStatusBadge(employee.status)}
                            </div>
                            <div className="nk-tb-col nk-tb-col-tools">
                              <ul className="nk-tb-actions gx-1">
                                <li>
                                  <Link to={`/${tenantInfo?.subdomain}/timesheets/edit/${employee.id}`} className="btn btn-trigger btn-icon">
                                    <em className="icon ni ni-edit-alt"></em>
                                  </Link>
                                </li>
                                <li>
                                  <Link to={`/${tenantInfo?.subdomain}/timesheets/view/${employee.id}`} className="btn btn-trigger btn-icon">
                                    <em className="icon ni ni-eye"></em>
                                  </Link>
                                </li>
                              </ul>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="nk-tb-item">
                          <div className="nk-tb-col" colSpan="5">
                            <div className="empty-state">
                              <p>No employees match the selected filter.</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientOverview;
