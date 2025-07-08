import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import './Vendors.css';

const VendorDetail = () => {
  const { subdomain, id } = useParams();
  const { checkPermission } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [vendorEmployees, setVendorEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch vendor data from API
    // For now, using mock data
    setLoading(true);
    setTimeout(() => {
      // Mock vendor data
      const mockVendor = {
        id: parseInt(id),
        name: id === '1' ? 'TechVendor Inc.' : id === '2' ? 'QA Solutions LLC' : 'Creative Design Studio',
        contactPerson: id === '1' ? 'Robert Chen' : id === '2' ? 'Lisa Wong' : 'David Miller',
        email: id === '1' ? 'robert@techvendor.com' : id === '2' ? 'lisa@qasolutions.com' : 'david@creativedesign.com',
        phone: id === '1' ? '(555) 123-7890' : id === '2' ? '(555) 234-8901' : '(555) 345-9012',
        status: 'active',
        category: id === '1' ? 'Software Development' : id === '2' ? 'Quality Assurance' : 'Design Services',
        address: '456 Business Ave',
        city: 'San Francisco',
        state: 'CA',
        zip: '94107',
        country: 'United States',
        website: id === '1' ? 'www.techvendor.com' : id === '2' ? 'www.qasolutions.com' : 'www.creativedesign.com',
        totalSpent: id === '1' ? 125000 : id === '2' ? 85000 : 65000,
        contractStart: '2022-06-15',
        contractEnd: '2023-06-14',
        paymentTerms: 'Net 30',
        notes: id === '1' ? 'Reliable vendor for technical resources' : 
               id === '2' ? 'Specialized in QA automation and testing' : 
               'Creative design services for marketing materials'
      };
      
      // Mock employees from this vendor
      const mockVendorEmployees = [];
      
      if (id === '1') {
        mockVendorEmployees.push({
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
          employmentType: 'Subcontractor'
        });
      } else if (id === '2') {
        mockVendorEmployees.push({
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
          employmentType: 'Subcontractor'
        });
      }
      
      setVendor(mockVendor);
      setVendorEmployees(mockVendorEmployees);
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

  if (!vendor) {
    return (
      <div className="nk-content">
        <div className="container-fluid">
          <div className="alert alert-danger">
            Vendor not found. <Link to={`/${subdomain}/vendors`}>Return to vendor list</Link>
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
              <h3 className="nk-block-title">Vendor Details</h3>
              <p className="nk-block-subtitle">Viewing details for {vendor.name}</p>
            </div>
            <div className="nk-block-head-content">
              <Link to={`/${subdomain}/vendors`} className="btn btn-outline-light">
                <i className="fas fa-arrow-left mr-1"></i> Back to Vendors
              </Link>
              <PermissionGuard requiredPermission={PERMISSIONS.EDIT_VENDOR}>
                <button className="btn btn-primary ml-2">
                  <i className="fas fa-edit mr-1"></i> Edit Vendor
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
                      <h5 className="title">Vendor Information</h5>
                    </div>
                    <div className="profile-ud-list">
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Vendor Name</div>
                        <div className="profile-ud-value">{vendor.name}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Contact Person</div>
                        <div className="profile-ud-value">{vendor.contactPerson}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Email</div>
                        <div className="profile-ud-value">{vendor.email}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Phone</div>
                        <div className="profile-ud-value">{vendor.phone}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Status</div>
                        <div className="profile-ud-value">
                          <span className={`badge badge-${vendor.status === 'active' ? 'success' : 'warning'}`}>
                            {vendor.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Category</div>
                        <div className="profile-ud-value">{vendor.category}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Website</div>
                        <div className="profile-ud-value">
                          <a href={`https://${vendor.website}`} target="_blank" rel="noopener noreferrer">
                            {vendor.website}
                          </a>
                        </div>
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
                        <div className="profile-ud-value">{vendor.address}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">City</div>
                        <div className="profile-ud-value">{vendor.city}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">State</div>
                        <div className="profile-ud-value">{vendor.state}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">ZIP Code</div>
                        <div className="profile-ud-value">{vendor.zip}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Country</div>
                        <div className="profile-ud-value">{vendor.country}</div>
                      </div>
                    </div>
                  </div>

                  <div className="nk-block">
                    <div className="nk-block-head">
                      <h5 className="title">Contract Details</h5>
                    </div>
                    <div className="profile-ud-list">
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Contract Start</div>
                        <div className="profile-ud-value">{new Date(vendor.contractStart).toLocaleDateString()}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Contract End</div>
                        <div className="profile-ud-value">{new Date(vendor.contractEnd).toLocaleDateString()}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Payment Terms</div>
                        <div className="profile-ud-value">{vendor.paymentTerms}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Total Spent</div>
                        <div className="profile-ud-value">${vendor.totalSpent.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Subcontractor Employees from this Vendor */}
                  <div className="nk-block">
                    <div className="nk-block-head">
                      <h5 className="title">Subcontractor Employees</h5>
                      <p className="text-muted">Employees provided by this vendor</p>
                    </div>
                    
                    {vendorEmployees.length > 0 ? (
                      <div className="card">
                        <div className="card-inner p-0">
                          <table className="table table-employees">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Position</th>
                                <th>Department</th>
                                <th>Client</th>
                                <th>Status</th>
                                {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && (
                                  <th>Hourly Rate</th>
                                )}
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {vendorEmployees.map(employee => (
                                <tr key={employee.id}>
                                  <td>
                                    <Link to={`/${subdomain}/employees/${employee.id}`} className="employee-name fw-medium">
                                      {employee.name}
                                    </Link>
                                  </td>
                                  <td>{employee.position}</td>
                                  <td>{employee.department}</td>
                                  <td>{employee.client}</td>
                                  <td>
                                    <span className={`badge badge-${employee.status === 'active' ? 'success' : 'warning'}`}>
                                      {employee.status === 'active' ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                  {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && (
                                    <td>${employee.hourlyRate}</td>
                                  )}
                                  <td>
                                    <Link to={`/${subdomain}/employees/${employee.id}`} className="btn btn-sm btn-outline-primary">
                                      <i className="fas fa-eye mr-1"></i> View
                                    </Link>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="alert alert-info">
                        No subcontractor employees from this vendor.
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="nk-block">
                    <div className="nk-block-head">
                      <h5 className="title">Notes</h5>
                    </div>
                    <div className="card card-bordered">
                      <div className="card-inner">
                        <p>{vendor.notes || 'No notes available.'}</p>
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

export default VendorDetail;
