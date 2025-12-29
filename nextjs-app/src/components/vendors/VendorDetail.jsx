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
    <div className="nk-content min-h-screen bg-slate-50">
      <div className="container-fluid">
        {/* Header */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-indigo-50 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="nk-block-head-content">
              <h3 className="nk-block-title">{vendor.name || 'Vendor Details'}</h3>
              <div className="nk-block-des text-soft">
                <p>Viewing details for vendor</p>
              </div>
            </div>
            <div className="nk-block-head-content flex items-center gap-3">
              <PermissionGuard requiredPermission={PERMISSIONS.EDIT_VENDOR}>
                <Link href={`/${subdomain}/vendors/edit/${id}`} className="btn btn-primary">
                  <em className="icon ni ni-edit"></em>
                  <span>Edit Vendor</span>
                </Link>
              </PermissionGuard>
              <Link href={`/${subdomain}/vendors`} className="btn btn-outline-light">
                <em className="icon ni ni-arrow-left"></em>
                <span>Back</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            
            {/* Vendor Information */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-700">
                Vendor Information
              </h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Vendor Name
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {vendor.name || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Contact Person
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {vendor.contactPerson || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Email
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {vendor.email || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Phone
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {vendor.phone || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Vendor Type
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {vendor.category || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Status
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      vendor.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      <span className={`w-2 h-2 mr-2 rounded-full ${
                        vendor.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></span>
                      {vendor.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
                  
            {/* Address Information */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-700">
                Address Information
              </h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div className="md:col-span-3">
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Address
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {vendor.address || '—'}
                  </p>
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    City
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {vendor.city || '—'}
                  </p>
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    State
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {vendor.state || '—'}
                  </p>
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    {getPostalLabel(vendor.country)}
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {vendor.zip || '—'}
                  </p>
                </div>
                
                <div className="md:col-span-3">
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Country
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {vendor.country || 'United States'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tax & Payment Information */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-700">
                Tax & Payment Information
              </h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Tax ID
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {vendor.taxId || '—'}
                  </p>
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Payment Terms
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {vendor.paymentTerms ? `Net ${vendor.paymentTerms}` : '—'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Contract Details */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-700">
                Contract Details
              </h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Contract Start
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {vendor.contractStart ? new Date(vendor.contractStart).toLocaleDateString() : '—'}
                  </p>
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Contract End
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {vendor.contractEnd ? new Date(vendor.contractEnd).toLocaleDateString() : '—'}
                  </p>
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Total Spent
                  </label>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                    {vendor.totalSpent || '$0.00'}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-700">
                Notes
              </h2>
              <div>
                <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                  {vendor.notes || 'No notes available'}
                </p>
              </div>
            </div>
            
            {/* Subcontractor Employees */}
            {vendorEmployees.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-700">
                  Subcontractor Employees
                </h2>
                <p className="mb-4 text-xs text-slate-500">Employees provided by this vendor</p>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Position</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Department</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Client</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                        {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && (
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Hourly Rate</th>
                        )}
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {vendorEmployees.map(employee => (
                        <tr key={employee.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <Link href={`/${subdomain}/employees/${employee.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                              {employee.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900">{employee.position}</td>
                          <td className="px-4 py-3 text-sm text-slate-900">{employee.department}</td>
                          <td className="px-4 py-3 text-sm text-slate-900">{employee.client}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {employee.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && (
                            <td className="px-4 py-3 text-sm text-slate-900">${employee.hourlyRate}</td>
                          )}
                          <td className="px-4 py-3">
                            <Link href={`/${subdomain}/employees/${employee.id}`} className="btn btn-sm btn-outline-primary">
                              View
                            </Link>
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
    </div>
  );
};

export default VendorDetail;
