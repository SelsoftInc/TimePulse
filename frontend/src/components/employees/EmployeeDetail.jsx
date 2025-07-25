import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import './Employees.css';

const EmployeeDetail = () => {
  const { subdomain, id } = useParams();
  const { checkPermission } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch employee data from API
    // For now, using mock data
    setLoading(true);
    setTimeout(() => {
      // Mock employee data with SOW details
      // For demo purposes, we'll show different data based on the ID
      // In a real app, this would come from an API
      const isSubcontractor = id === '3' || id === '4';
      
      const mockEmployee = {
        id: parseInt(id),
        firstName: 'John',
        lastName: 'Smith',
        name: id === '1' ? 'John Smith' : id === '2' ? 'Sarah Johnson' : id === '3' ? 'Michael Brown' : 'Emily Davis',
        position: id === '1' ? 'Senior Developer' : id === '2' ? 'Project Manager' : id === '3' ? 'UI/UX Designer' : 'QA Engineer',
        email: id === '1' ? 'john.smith@selsoft.com' : id === '2' ? 'sarah.johnson@selsoft.com' : id === '3' ? 'michael.brown@selsoft.com' : 'emily.davis@selsoft.com',
        phone: id === '1' ? '(555) 123-4567' : id === '2' ? '(555) 234-5678' : id === '3' ? '(555) 345-6789' : '(555) 456-7890',
        status: id === '4' ? 'inactive' : 'active',
        department: id === '1' ? 'Engineering' : id === '2' ? 'Project Management' : id === '3' ? 'Design' : 'Quality Assurance',
        joinDate: id === '1' ? '2023-01-15' : id === '2' ? '2023-01-31' : id === '3' ? '2023-03-09' : '2023-01-19',
        address: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105',
        country: 'United States',
        client: id === '1' ? 'JPMC' : id === '2' ? 'IBM' : id === '3' ? 'Accenture' : 'Cognizant',
        employmentType: isSubcontractor ? 'Subcontractor' : 'W2',
        vendor: isSubcontractor ? (id === '3' ? 'TechVendor Inc.' : 'QA Solutions LLC') : null,
        vendorId: isSubcontractor ? (id === '3' ? 1 : 2) : null,
        endClient: {
          name: id === '1' ? 'JPMorgan Chase' : 
                id === '2' ? 'IBM Corporation' : 
                id === '3' ? 'Accenture PLC' : 
                'Cognizant Technology Solutions',
          location: id === '1' ? 'New York, NY' : 
                   id === '2' ? 'Austin, TX' : 
                   id === '3' ? 'Chicago, IL' : 
                   'Teaneck, NJ',
          hiringManager: {
            name: id === '1' ? 'Robert Wilson' : 
                 id === '2' ? 'Jennifer Lee' : 
                 id === '3' ? 'Michael Chen' : 
                 'Sarah Thompson',
            email: id === '1' ? 'robert.wilson@jpmc.com' : 
                  id === '2' ? 'jennifer.lee@ibm.com' : 
                  id === '3' ? 'michael.chen@accenture.com' : 
                  'sarah.thompson@cognizant.com',
            phone: id === '1' ? '(212) 555-1234' : 
                  id === '2' ? '(512) 555-6789' : 
                  id === '3' ? '(312) 555-9012' : 
                  '(201) 555-3456'
          }
        },
        hourlyRate: id === '1' ? 125 : id === '2' ? 150 : id === '3' ? 110 : 95,
        enableOvertime: true,
        overtimeMultiplier: 1.5,
        overtimeRate: id === '1' ? 187.5 : id === '2' ? 225 : id === '3' ? 165 : 142.5,
        approvalWorkflow: 'manager',
        notes: id === '1' ? 'Experienced developer with 8+ years in React and Node.js' : 
               id === '2' ? 'Certified PMP with experience managing large-scale IT projects' :
               id === '3' ? 'Creative designer with expertise in UI/UX and design systems' :
               'Detail-oriented QA engineer with automation testing skills',
        sowDocument: {
          name: 'John_Smith_SOW_2023.pdf',
          size: 1024 * 1024 * 2.5, // 2.5MB
          uploadDate: '2023-01-10',
          url: '#'
        }
      };
      
      setEmployee(mockEmployee);
      setLoading(false);
    }, 800);
  }, [id]);

  if (loading) {
    return (
      <div className="nk-content">
        <div className="container-fluid">
          <div className="d-flex justify-content-center mt-5">
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="nk-content">
        <div className="container-fluid">
          <div className="alert alert-danger">
            Employee not found. <Link to={`/${subdomain}/employees`}>Return to employee list</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nk-content">
      <div className="container-fluid">
        <div className="nk-block-head">
          <div className="nk-block-between">
            <div className="nk-block-head-content">
              <h3 className="nk-block-title">Employee Details</h3>
              <p className="nk-block-subtitle">Viewing details for {employee.name}</p>
            </div>
            <div className="nk-block-head-content">
              <Link to={`/${subdomain}/employees`} className="btn btn-outline-light">
                <i className="fas fa-arrow-left mr-1"></i> Back to Employees
              </Link>
              <PermissionGuard requiredPermission={PERMISSIONS.EDIT_EMPLOYEE}>
                <button className="btn btn-primary ml-2">
                  <i className="fas fa-edit mr-1"></i> Edit Employee
                </button>
              </PermissionGuard>
            </div>
          </div>
        </div>

        <div className="nk-block">
          <div className="card card-bordered">
            <div className="card-aside-wrap">
              <div className="card-content">
                <div className="card-inner">
                  <div className="nk-block">
                    <div className="nk-block-head">
                      <h5 className="title">Personal Information</h5>
                    </div>
                    <div className="profile-ud-list">
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Full Name</div>
                        <div className="profile-ud-value">{employee.name}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Email</div>
                        <div className="profile-ud-value">{employee.email}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Phone</div>
                        <div className="profile-ud-value">{employee.phone}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Status</div>
                        <div className="profile-ud-value">
                          <span className={`badge badge-${employee.status === 'active' ? 'success' : 'warning'}`}>
                            {employee.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="nk-block">
                    <div className="nk-block-head">
                      <h5 className="title">Work Information</h5>
                    </div>
                    <div className="profile-ud-list">
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Position</div>
                        <div className="profile-ud-value">{employee.position}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Department</div>
                        <div className="profile-ud-value">{employee.department}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Client</div>
                        <div className="profile-ud-value">
                          {employee.client || <span className="text-muted">Not assigned</span>}
                        </div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Employment Type</div>
                        <div className="profile-ud-value">
                          <span className={`badge badge-${employee.employmentType === 'W2' ? 'primary' : 'info'}`}>
                            {employee.employmentType}
                          </span>
                        </div>
                      </div>
                      {employee.employmentType === 'Subcontractor' && (
                        <div className="profile-ud-item">
                          <div className="profile-ud-label">Vendor</div>
                          <div className="profile-ud-value">
                            {employee.vendor ? (
                              <Link to={`/${subdomain}/vendors/${employee.vendorId}`}>
                                {employee.vendor}
                              </Link>
                            ) : (
                              <span className="text-muted">No vendor assigned</span>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Join Date</div>
                        <div className="profile-ud-value">{new Date(employee.joinDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>

                  <div className="nk-block">
                    <div className="nk-block-head">
                      <h5 className="title">Address</h5>
                    </div>
                    <div className="profile-ud-list">
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Address</div>
                        <div className="profile-ud-value">{employee.address}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">City</div>
                        <div className="profile-ud-value">{employee.city}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">State</div>
                        <div className="profile-ud-value">{employee.state}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">ZIP Code</div>
                        <div className="profile-ud-value">{employee.zip}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Country</div>
                        <div className="profile-ud-value">{employee.country}</div>
                      </div>
                    </div>
                  </div>

                  {/* SOW Details - Only visible to Admin */}
                  {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && (
                    <div className="nk-block">
                      <div className="nk-block-head">
                        <h5 className="title">Statement of Work (SOW) Details</h5>
                        <p className="text-muted">This information is only visible to administrators</p>
                      </div>
                      <div className="profile-ud-list">
                        <div className="profile-ud-item">
                          <div className="profile-ud-label">Hourly Rate</div>
                          <div className="profile-ud-value">${employee.hourlyRate}</div>
                        </div>
                        <div className="profile-ud-item">
                          <div className="profile-ud-label">Overtime Enabled</div>
                          <div className="profile-ud-value">
                            {employee.enableOvertime ? (
                              <span className="badge badge-success">Yes</span>
                            ) : (
                              <span className="badge badge-light">No</span>
                            )}
                          </div>
                        </div>
                        {employee.enableOvertime && (
                          <>
                            <div className="profile-ud-item">
                              <div className="profile-ud-label">Overtime Multiplier</div>
                              <div className="profile-ud-value">{employee.overtimeMultiplier}x</div>
                            </div>
                            <div className="profile-ud-item">
                              <div className="profile-ud-label">Overtime Rate</div>
                              <div className="profile-ud-value">${employee.overtimeRate}</div>
                            </div>
                          </>
                        )}
                        <div className="profile-ud-item">
                          <div className="profile-ud-label">Approval Workflow</div>
                          <div className="profile-ud-value">
                            {employee.approvalWorkflow === 'auto' && 'Auto-approve'}
                            {employee.approvalWorkflow === 'manual' && 'Manual approval'}
                            {employee.approvalWorkflow === 'manager' && 'Manager approval'}
                            {employee.approvalWorkflow === 'client' && 'Client approval'}
                          </div>
                        </div>
                      </div>

                      {/* SOW Document */}
                      <div className="nk-block-head mt-4">
                        <h6 className="title">SOW Document</h6>
                      </div>
                      <div className="document-preview mb-4">
                        <div className="document-preview-header">
                          <span className="document-name">{employee.sowDocument.name}</span>
                          <span className="document-size">{Math.round(employee.sowDocument.size / 1024)} KB</span>
                        </div>
                        <div className="document-preview-content">
                          <div className="document-icon">
                            <i className="fas fa-file-pdf"></i>
                            <span>Uploaded on {new Date(employee.sowDocument.uploadDate).toLocaleDateString()}</span>
                          </div>
                          <a href={employee.sowDocument.url} className="btn btn-sm btn-outline-primary mt-2">
                            <i className="fas fa-download mr-1"></i> Download
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* End Client Details */}
                  {employee.endClient && (
                    <div className="nk-block">
                      <div className="nk-block-head">
                        <h5 className="title">End Client Details</h5>
                      </div>
                      <div className="card card-bordered">
                        <div className="card-inner">
                          <div className="profile-ud-list">
                            <div className="profile-ud-item">
                              <div className="profile-ud-label">Client Name</div>
                              <div className="profile-ud-value">{employee.endClient.name}</div>
                            </div>
                            <div className="profile-ud-item">
                              <div className="profile-ud-label">Location</div>
                              <div className="profile-ud-value">{employee.endClient.location}</div>
                            </div>
                          </div>
                          
                          {employee.endClient.hiringManager && (
                            <>
                              <div className="nk-divider divider md"></div>
                              
                              <div className="nk-block-head">
                                <h6 className="title">Hiring Manager</h6>
                              </div>
                              <div className="profile-ud-list">
                                <div className="profile-ud-item">
                                  <div className="profile-ud-label">Name</div>
                                  <div className="profile-ud-value">{employee.endClient.hiringManager.name}</div>
                                </div>
                                <div className="profile-ud-item">
                                  <div className="profile-ud-label">Email</div>
                                  <div className="profile-ud-value">
                                    <a href={`mailto:${employee.endClient.hiringManager.email}`}>
                                      {employee.endClient.hiringManager.email}
                                    </a>
                                  </div>
                                </div>
                                <div className="profile-ud-item">
                                  <div className="profile-ud-label">Phone</div>
                                  <div className="profile-ud-value">
                                    <a href={`tel:${employee.endClient.hiringManager.phone}`}>
                                      {employee.endClient.hiringManager.phone}
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Timesheet Settings */}
                  <div className="nk-block">
                    <div className="nk-block-head nk-block-between">
                      <div>
                        <h5 className="title">Timesheet Settings</h5>
                      </div>
                      <div>
                        <PermissionGuard requiredPermission={PERMISSIONS.EDIT_EMPLOYEE}>
                          <Link to={`/${subdomain}/employees/${id}/settings`} className="btn btn-sm btn-primary">
                            <i className="fas fa-cog mr-1"></i> Configure Settings
                          </Link>
                        </PermissionGuard>
                      </div>
                    </div>
                    <div className="card card-bordered">
                      <div className="card-inner">
                        <div className="row">
                          <div className="col-md-6">
                            <div className="profile-ud-list">
                              <div className="profile-ud-item">
                                <div className="profile-ud-label">Client</div>
                                <div className="profile-ud-value">
                                  {employee.client || 'Not assigned'}
                                </div>
                              </div>
                              <div className="profile-ud-item">
                                <div className="profile-ud-label">Client Type</div>
                                <div className="profile-ud-value">
                                  <span className={`badge badge-${employee.clientType === 'internal' ? 'primary' : 'warning'}`}>
                                    {employee.clientType === 'internal' ? 'Internal' : 'External'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="profile-ud-list">
                              <div className="profile-ud-item">
                                <div className="profile-ud-label">Timesheet Approver</div>
                                <div className="profile-ud-value">
                                  {employee.approver || 'Not assigned'}
                                </div>
                              </div>
                              <div className="profile-ud-item">
                                <div className="profile-ud-label">Approval Workflow</div>
                                <div className="profile-ud-value">
                                  {employee.approvalWorkflow || 'Manager Approval'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="nk-block">
                    <div className="nk-block-head">
                      <h5 className="title">Notes</h5>
                    </div>
                    <div className="card card-bordered">
                      <div className="card-inner">
                        <p>{employee.notes || 'No notes available.'}</p>
                      </div>
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

export default EmployeeDetail;
