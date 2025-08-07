import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PERMISSIONS } from '../../utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import { useAuth } from '../../contexts/AuthContext';
import DataGridFilter from '../common/DataGridFilter';
import './Employees.css';

const EmployeeList = () => {
  const { subdomain } = useParams();
  const { checkPermission, user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    employmentType: 'all',
    status: 'all',
    search: ''
  });

  // Fetch employees from backend API
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!user?.tenantId) {
        setError('No tenant information available');
        setLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:5001/api/employees?tenantId=${user.tenantId}`, {
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
        setEmployees(data.employees || []);
      } else {
        setError(data.error || 'Failed to fetch employees');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [user?.tenantId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter employees based on all filters
  const filteredEmployees = employees.filter(employee => {
    // Employment type filter
    if (filters.employmentType !== 'all' && employee.employmentType !== filters.employmentType) {
      return false;
    }
    
    // Status filter
    if (filters.status !== 'all' && employee.status !== filters.status) {
      return false;
    }
    

    // Search filter
    if (filters.search && !employee.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !employee.email.toLowerCase().includes(filters.search.toLowerCase()) &&
        !employee.position.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Handle filter changes
  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      employmentType: 'all',
      status: 'all',
      search: ''
    });
  };

  // Define filter configuration
  const filterConfig = [
    {
      key: 'employmentType',
      label: 'Employment Type',
      type: 'select',
      value: filters.employmentType,
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'W2', label: 'W2 Only' },
        { value: 'Subcontractor', label: 'Subcontractors Only' }
      ]
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      value: filters.status,
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    },
    {
      key: 'search',
      label: 'Search',
      type: 'text',
      value: filters.search,
      defaultValue: '',
      placeholder: 'Search by name, email, or position...'
    }
  ];

  return (
    <div className="nk-content">
      <div className="container-fluid">
        <div className="nk-block-head">
          <div className="nk-block-between">
            <div className="nk-block-head-content">
              <h3 className="nk-block-title">Employees</h3>
              <p className="nk-block-subtitle">Manage your team members</p>
            </div>
            <div className="nk-block-head-content">
              <PermissionGuard requiredPermission={PERMISSIONS.CREATE_EMPLOYEE}>
                <Link to={`/${subdomain}/employees/new`} className="btn btn-primary">
                  <i className="fas fa-plus mr-1"></i> Add New Employee
                </Link>
              </PermissionGuard>
            </div>
          </div>
        </div>

        <div className="nk-block">
          {/* Filter Section */}
          <div className="card card-bordered mb-4">
            <div className="card-inner">
              <DataGridFilter
                filters={filterConfig}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                resultCount={filteredEmployees.length}
                totalCount={employees.length}
              />
            </div>
          </div>
          
          {error ? (
            <div className="alert alert-danger" role="alert">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              {error}
              <button 
                className="btn btn-sm btn-outline-danger ml-3"
                onClick={fetchEmployees}
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
              <div className="card-inner table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Position</th>
                      <th>Vendor</th>
                      <th>Client</th>
                      <th>End Client</th>
                      <th>Employment Type</th>
                      {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && (
                        <th>Hourly Rate</th>
                      )}
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Join Date</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map(employee => (
                      <tr key={employee.id}>
                        <td>
                          <Link to={`/${subdomain}/employees/${employee.id}`} className="employee-name fw-medium">
                            {employee.name}
                          </Link>
                        </td>
                        <td>{employee.position}</td>
                        <td>
                          {employee.employmentType === 'Subcontractor' ? (
                            employee.vendor ? (
                              <Link to={`/${subdomain}/vendors/${employee.vendorId}`} className="vendor-link">
                                {employee.vendor}
                              </Link>
                            ) : (
                              <span className="text-muted">No vendor assigned</span>
                            )
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </td>
                        <td>
                          {employee.client ? (
                            employee.client
                          ) : (
                            <span className="text-muted">Not assigned</span>
                          )}
                        </td>
                        <td>
                          {employee.endClient ? (
                            <div className="d-flex flex-column">
                              <span>{employee.endClient.name}</span>
                              <small className="text-muted">{employee.endClient.location}</small>
                            </div>
                          ) : (
                            <span className="text-muted">Not assigned</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge-${employee.employmentType === 'W2' ? 'primary' : 'info'}`}>
                            {employee.employmentType}
                          </span>
                        </td>
                        {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && (
                          <td>
                            {employee.hourlyRate ? `$${employee.hourlyRate}` : (
                              <span className="text-muted">Not set</span>
                            )}
                          </td>
                        )}
                        <td>{employee.email}</td>
                        <td>
                          {employee.phone ? employee.phone : (
                            <span className="text-muted">Not provided</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge-${employee.status === 'active' ? 'success' : 'warning'}`}>
                            {employee.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          {employee.joinDate ? new Date(employee.joinDate).toLocaleDateString() : (
                            <span className="text-muted">Not set</span>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="dropdown">
                            <button className="btn btn-sm btn-icon btn-trigger dropdown-toggle">
                              <i className="fas fa-ellipsis-h"></i>
                            </button>
                            <div className="dropdown-menu dropdown-menu-right">
                              <Link to={`/${subdomain}/employees/${employee.id}`} className="dropdown-item">
                                <i className="fas fa-eye mr-1"></i> View Details
                              </Link>
                              <PermissionGuard requiredPermission={PERMISSIONS.EDIT_EMPLOYEE}>
                                <button type="button" className="dropdown-item">
                                  <i className="fas fa-edit mr-1"></i> Edit
                                </button>
                              </PermissionGuard>
                              <PermissionGuard requiredPermission={PERMISSIONS.DELETE_EMPLOYEE}>
                                <button type="button" className="dropdown-item text-danger">
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeList;
