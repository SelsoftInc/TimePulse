import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PERMISSIONS } from '../../utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import { useAuth } from '../../contexts/AuthContext';
import './Employees.css';

const EmployeeList = () => {
  const { subdomain } = useParams();
  const { checkPermission } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch employees from API
    // For now, using mock data
    setTimeout(() => {
      const mockEmployees = [
        {
          id: 1,
          name: 'John Smith',
          position: 'Senior Developer',
          email: 'john.smith@selsoft.com',
          phone: '(555) 123-4567',
          status: 'active',
          department: 'Engineering',
          joinDate: '2023-01-15',
          hourlyRate: 125,
          client: 'JPMC',
          employmentType: 'W2',
          endClient: {
            name: 'JPMorgan Chase',
            location: 'New York, NY',
            hiringManager: {
              name: 'Robert Wilson',
              email: 'robert.wilson@jpmc.com',
              phone: '(212) 555-1234'
            }
          }
        },
        {
          id: 2,
          name: 'Sarah Johnson',
          position: 'Project Manager',
          email: 'sarah.johnson@selsoft.com',
          phone: '(555) 234-5678',
          status: 'active',
          department: 'Project Management',
          joinDate: '2023-02-01',
          hourlyRate: 150,
          employmentType: 'W2',
          // Example of employee without client info
        },
        {
          id: 3,
          name: 'Michael Brown',
          position: 'UI/UX Designer',
          email: 'michael.brown@selsoft.com',
          phone: '(555) 345-6789',
          status: 'active',
          department: 'Design',
          joinDate: '2023-03-10',
          hourlyRate: 110,
          client: 'Accenture',
          employmentType: 'Subcontractor',
          vendorId: 1,
          vendor: 'TechVendor Inc.',
          endClient: {
            name: 'Accenture PLC',
            location: 'Chicago, IL',
            hiringManager: {
              name: 'Michael Chen',
              email: 'michael.chen@accenture.com',
              phone: '(312) 555-9012'
            }
          }
        },
        {
          id: 4,
          name: 'Emily Davis',
          position: 'QA Engineer',
          email: 'emily.davis@selsoft.com',
          phone: '(555) 456-7890',
          status: 'inactive',
          department: 'Quality Assurance',
          joinDate: '2023-01-20',
          hourlyRate: 95,
          client: 'Cognizant',
          employmentType: 'Subcontractor',
          vendorId: 2,
          vendor: 'QA Solutions LLC',
          endClient: {
            name: 'Cognizant Technology Solutions',
            location: 'Teaneck, NJ',
            hiringManager: {
              name: 'Sarah Thompson',
              email: 'sarah.thompson@cognizant.com',
              phone: '(201) 555-3456'
            }
          }
        }
      ];
      
      setEmployees(mockEmployees);
      setLoading(false);
    }, 800);
  }, []);

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
          {loading ? (
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
                      <th>Department</th>
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
                    {employees.map(employee => (
                      <tr key={employee.id}>
                        <td>
                          <Link to={`/${subdomain}/employees/${employee.id}`} className="employee-name fw-medium">
                            {employee.name}
                          </Link>
                        </td>
                        <td>{employee.position}</td>
                        <td>{employee.department}</td>
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
                          <td>${employee.hourlyRate}</td>
                        )}
                        <td>{employee.email}</td>
                        <td>{employee.phone}</td>
                        <td>
                          <span className={`badge badge-${employee.status === 'active' ? 'success' : 'warning'}`}>
                            {employee.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>{new Date(employee.joinDate).toLocaleDateString()}</td>
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
