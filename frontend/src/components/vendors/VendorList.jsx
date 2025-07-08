import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PERMISSIONS } from '../../utils/roles';
import PermissionGuard from '../common/PermissionGuard';

const VendorList = () => {
  const { subdomain } = useParams();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch vendors from API
    // For now, using mock data
    setTimeout(() => {
      const mockVendors = [
        {
          id: 1,
          name: 'Tech Solutions Inc.',
          contactPerson: 'Robert Chen',
          email: 'robert@techsolutions.com',
          phone: '(555) 123-7890',
          status: 'active',
          category: 'Software',
          totalSpent: 25000
        },
        {
          id: 2,
          name: 'Office Supplies Co.',
          contactPerson: 'Lisa Wong',
          email: 'lisa@officesupplies.com',
          phone: '(555) 234-8901',
          status: 'active',
          category: 'Office Equipment',
          totalSpent: 12500
        },
        {
          id: 3,
          name: 'Creative Design Studio',
          contactPerson: 'David Miller',
          email: 'david@creativedesign.com',
          phone: '(555) 345-9012',
          status: 'inactive',
          category: 'Design Services',
          totalSpent: 18750
        },
        {
          id: 4,
          name: 'Cloud Hosting Services',
          contactPerson: 'Amanda Johnson',
          email: 'amanda@cloudhosting.com',
          phone: '(555) 456-0123',
          status: 'active',
          category: 'Infrastructure',
          totalSpent: 32000
        }
      ];
      
      setVendors(mockVendors);
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div className="nk-content">
      <div className="container-fluid">
        <div className="nk-block-head">
          <div className="nk-block-between">
            <div className="nk-block-head-content">
              <h3 className="nk-block-title">Vendors</h3>
              <p className="nk-block-subtitle">Manage your vendor relationships</p>
            </div>
            <div className="nk-block-head-content">
              <PermissionGuard requiredPermission={PERMISSIONS.CREATE_VENDOR}>
                <Link to={`/${subdomain}/vendors/new`} className="btn btn-primary">
                  <i className="fas fa-plus mr-1"></i> Add New Vendor
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
                <table className="table table-vendors">
                  <thead>
                    <tr>
                      <th>Vendor Name</th>
                      <th>Contact Person</th>
                      <th>Category</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Total Spent</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map(vendor => (
                      <tr key={vendor.id}>
                        <td>
                          <Link to={`/${subdomain}/vendors/${vendor.id}`} className="vendor-name">
                            {vendor.name}
                          </Link>
                        </td>
                        <td>{vendor.contactPerson}</td>
                        <td>{vendor.category}</td>
                        <td>{vendor.email}</td>
                        <td>{vendor.phone}</td>
                        <td>
                          <span className={`badge badge-${vendor.status === 'active' ? 'success' : 'warning'}`}>
                            {vendor.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>${vendor.totalSpent.toLocaleString()}</td>
                        <td className="text-right">
                          <div className="dropdown">
                            <button className="btn btn-sm btn-icon btn-trigger dropdown-toggle">
                              <i className="fas fa-ellipsis-h"></i>
                            </button>
                            <div className="dropdown-menu dropdown-menu-right">
                              <Link to={`/${subdomain}/vendors/${vendor.id}`} className="dropdown-item">
                                <i className="fas fa-eye mr-1"></i> View Details
                              </Link>
                              <PermissionGuard requiredPermission={PERMISSIONS.EDIT_VENDOR}>
                                <button type="button" className="dropdown-item">
                                  <i className="fas fa-edit mr-1"></i> Edit
                                </button>
                              </PermissionGuard>
                              <PermissionGuard requiredPermission={PERMISSIONS.DELETE_VENDOR}>
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

export default VendorList;
