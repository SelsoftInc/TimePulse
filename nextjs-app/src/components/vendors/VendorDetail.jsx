'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { API_BASE } from '@/config/api';
import { TAX_ID_LABELS, getPostalLabel } from '../../config/lookups';
import { useAuth } from '@/contexts/AuthContext';
import { decryptApiResponse } from '@/utils/encryption';
import { PERMISSIONS } from '@/utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import './Vendors.css';

const VendorDetail = () => {
  const { subdomain, id } = useParams();
  const { user, checkPermission } = useAuth();
  
  // Hydration fix: Track if component is mounted on client
  const [isMounted, setIsMounted] = useState(false);
  
  const [vendor, setVendor] = useState(null);
  const [vendorEmployees, setVendorEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Hydration fix: Set mounted state on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const fetchVendor = async () => {
      try {
        setLoading(true);
        setError('');
        if (!user?.tenantId) {
          setError('No tenant information available');
          setVendor(null);
          return;
        }
        const resp = await fetch(`${API_BASE}/api/vendors/${id}?tenantId=${user.tenantId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const rawData = await resp.json();
        const data = decryptApiResponse(rawData);
        if (data?.success) {
          setVendor(data?.vendor || null);
        } else {
          setError(data?.error || 'Failed to fetch vendor');
          setVendor(null);
        }
      } catch (e) {
        console.error('Error fetching vendor:', e);
        setError('Failed to load vendor. Please try again.');
        setVendor(null);
      } finally {
        setVendorEmployees([]); // Not implemented yet on backend
        setLoading(false);
      }
    };
    fetchVendor();
  }, [isMounted, id, user?.tenantId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent hydration mismatch - don't render until mounted
  if (!isMounted) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

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

  if (error || !vendor) {
    return (
      <div className="nk-content">
        <div className="container-fluid">
          {error ? (
            <div className="alert alert-danger">
              {error} <Link href={`/${subdomain}/vendors`}>Return to vendor list</Link>
            </div>
          ) : (
            <div className="alert alert-danger">
              Vendor not found. <Link href={`/${subdomain}/vendors`}>Return to vendor list</Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="nk-conten">
      <div className="container-flui">
        <div className="nk-block-head">
          <div className="nk-block-between">
            <div className="nk-block-head-content">
              <h3 className="nk-block-title">Vendor Details</h3>
              <p className="nk-block-subtitle">Viewing details for vendor</p>
            </div>
            <div className="nk-block-head-content">
              <Link href={`/${subdomain}/vendors`} className="btn btn-outline-light">
                <i className="fas fa-arrow-left mr-1"></i> Back to Vendors
              </Link>
              <PermissionGuard requiredPermission={PERMISSIONS.EDIT_VENDOR}>
                <Link href={`/${subdomain}/vendors/edit/${id}`} className="btn btn-primary ml-2">
                  <i className="fas fa-edit mr-1"></i> Edit Vendor
                </Link>
              </PermissionGuard>
            </div>
          </div>
        </div>

        <div className="nk-block">
          <div className="card card-bordered">
            <div className="card-aside-wrap">
              <div className="card-content">
                <div className="card-inne">
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
                          {vendor.website}
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
                        <div className="profile-ud-label">{getPostalLabel(vendor.country)}</div>
                        <div className="profile-ud-value">{vendor.zip}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Country</div>
                        <div className="profile-ud-value">{vendor.country}</div>
                      </div>
                      {vendor.taxId && (
                        <div className="profile-ud-item">
                          <div className="profile-ud-label">{TAX_ID_LABELS[vendor.country] || 'Tax ID'}</div>
                          <div className="profile-ud-value">{vendor.taxId}</div>
                        </div>
                      )}
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
                        <div className="profile-ud-label">Payment Term</div>
                        <div className="profile-ud-value">{vendor.paymentTerms ? `Net ${vendor.paymentTerms}` : '—'}</div>
                      </div>
                      <div className="profile-ud-item">
                        <div className="profile-ud-label">Total Spent</div>
                        <div className="profile-ud-value">{vendor.totalSpent}</div>
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
                                    <Link href={`/${subdomain}/employees/${employee.id}`} className="employee-name fw-medium">
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
                                    <Link href={`/${subdomain}/employees/${employee.id}`} className="btn btn-sm btn-outline-primary">
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
                      <div className="card-inne">
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
