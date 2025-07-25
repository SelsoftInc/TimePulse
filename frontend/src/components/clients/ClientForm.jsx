import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PERMISSIONS } from '../../utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import './Clients.css';

const ClientForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    employeeCount: 0,
    status: 'active',
    clientType: 'internal',
    notes: '',
    // Billing Information
    billingAddress: '',
    billingAddressSameAsMain: true,
    paymentTerms: 'Net 30',
    paymentMethod: 'Bank Transfer',
    bankDetails: '',
    taxId: '',
    vatNumber: '',
    currency: 'USD'
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // In a real app, this would be an API call
    setTimeout(() => {
      console.log('Client data submitted:', formData);
      setLoading(false);
      navigate('/clients');
      // Show success message
      alert('Client created successfully!');
    }, 800);
  };

  return (
    <PermissionGuard requiredPermission={PERMISSIONS.CREATE_CLIENT}>
      <div className="nk-content">
        <div className="container-fluid">
          <div className="nk-block-head">
            <div className="nk-block-between">
              <div className="nk-block-head-content">
                <h3 className="nk-block-title">Add New Client</h3>
                <p className="nk-block-subtitle">Create a new client record</p>
              </div>
            </div>
          </div>

          <div className="nk-block">
            <div className="card card-bordered">
              <div className="card-inner">
                <form onSubmit={handleSubmit}>
                  <div className="row g-4">
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="name">Client Name*</label>
                        <input
                          type="text"
                          className="form-control"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Enter client name"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="contactPerson">Contact Person*</label>
                        <input
                          type="text"
                          className="form-control"
                          id="contactPerson"
                          name="contactPerson"
                          value={formData.contactPerson}
                          onChange={handleChange}
                          placeholder="Enter contact person name"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="email">Email Address*</label>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter email address"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="phone">Phone Number*</label>
                        <input
                          type="tel"
                          className="form-control"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Enter phone number"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <div className="form-group">
                        <label className="form-label" htmlFor="address">Address</label>
                        <input
                          type="text"
                          className="form-control"
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="Enter street address"
                        />
                      </div>
                    </div>
                    <div className="col-lg-4">
                      <div className="form-group">
                        <label className="form-label" htmlFor="city">City</label>
                        <input
                          type="text"
                          className="form-control"
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="Enter city"
                        />
                      </div>
                    </div>
                    <div className="col-lg-4">
                      <div className="form-group">
                        <label className="form-label" htmlFor="state">State</label>
                        <input
                          type="text"
                          className="form-control"
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          placeholder="Enter state"
                        />
                      </div>
                    </div>
                    <div className="col-lg-4">
                      <div className="form-group">
                        <label className="form-label" htmlFor="zip">ZIP Code</label>
                        <input
                          type="text"
                          className="form-control"
                          id="zip"
                          name="zip"
                          value={formData.zip}
                          onChange={handleChange}
                          placeholder="Enter ZIP code"
                        />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="country">Country</label>
                        <input
                          type="text"
                          className="form-control"
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          placeholder="Enter country"
                        />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="employeeCount">Number of Employees</label>
                        <input
                          type="number"
                          className="form-control"
                          id="employeeCount"
                          name="employeeCount"
                          value={formData.employeeCount}
                          onChange={handleChange}
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="status">Status</label>
                        <select
                          className="form-select"
                          id="status"
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="pending">Pending</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="clientType">Client Type*</label>
                        <select
                          className="form-select"
                          id="clientType"
                          name="clientType"
                          value={formData.clientType}
                          onChange={handleChange}
                          required
                        >
                          <option value="internal">Internal Client</option>
                          <option value="external">External Client</option>
                        </select>
                        <div className="form-note mt-2">
                          <small>
                            {formData.clientType === 'internal' 
                              ? 'Internal clients allow manual hour entry and AI timesheet upload'
                              : 'External clients require uploading client-submitted timesheet files'
                            }
                          </small>
                        </div>
                      </div>
                    </div>
                    
                    {/* Billing & Payment Information Section */}
                    <div className="col-12">
                      <hr className="my-4" />
                      <h5 className="mb-3">
                        <em className="icon ni ni-credit-card mr-2"></em>
                        Billing & Payment Information
                      </h5>
                    </div>
                    
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="paymentTerms">Payment Terms*</label>
                        <select
                          className="form-select"
                          id="paymentTerms"
                          name="paymentTerms"
                          value={formData.paymentTerms}
                          onChange={handleChange}
                          required
                        >
                          <option value="Due upon receipt">Due upon receipt</option>
                          <option value="Net 15">Net 15</option>
                          <option value="Net 30">Net 30</option>
                          <option value="Net 45">Net 45</option>
                          <option value="Net 60">Net 60</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="paymentMethod">Payment Method*</label>
                        <select
                          className="form-select"
                          id="paymentMethod"
                          name="paymentMethod"
                          value={formData.paymentMethod}
                          onChange={handleChange}
                          required
                        >
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Credit Card">Credit Card</option>
                          <option value="PayPal">PayPal</option>
                          <option value="Check">Check</option>
                          <option value="Wire Transfer">Wire Transfer</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="currency">Currency*</label>
                        <select
                          className="form-select"
                          id="currency"
                          name="currency"
                          value={formData.currency}
                          onChange={handleChange}
                          required
                        >
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                          <option value="CAD">CAD - Canadian Dollar</option>
                          <option value="AUD">AUD - Australian Dollar</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="taxId">Tax ID*</label>
                        <input
                          type="text"
                          className="form-control"
                          id="taxId"
                          name="taxId"
                          value={formData.taxId}
                          onChange={handleChange}
                          placeholder="Enter Tax ID (e.g., 13-1234567)"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="vatNumber">VAT Number</label>
                        <input
                          type="text"
                          className="form-control"
                          id="vatNumber"
                          name="vatNumber"
                          value={formData.vatNumber}
                          onChange={handleChange}
                          placeholder="Enter VAT Number (if applicable)"
                        />
                      </div>
                    </div>
                    
                    {(formData.paymentMethod === 'Bank Transfer' || formData.paymentMethod === 'Wire Transfer') && (
                      <div className="col-12">
                        <div className="form-group">
                          <label className="form-label" htmlFor="bankDetails">Bank Details</label>
                          <textarea
                            className="form-control"
                            id="bankDetails"
                            name="bankDetails"
                            value={formData.bankDetails}
                            onChange={handleChange}
                            placeholder="Enter bank details (Bank name, Account number, Routing number, etc.)"
                            rows="3"
                          ></textarea>
                        </div>
                      </div>
                    )}
                    
                    <div className="col-12">
                      <div className="form-group">
                        <div className="custom-control custom-checkbox">
                          <input
                            type="checkbox"
                            className="custom-control-input"
                            id="billingAddressSameAsMain"
                            name="billingAddressSameAsMain"
                            checked={formData.billingAddressSameAsMain}
                            onChange={handleChange}
                          />
                          <label className="custom-control-label" htmlFor="billingAddressSameAsMain">
                            Billing address is the same as main address
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {!formData.billingAddressSameAsMain && (
                      <div className="col-12">
                        <div className="form-group">
                          <label className="form-label" htmlFor="billingAddress">Billing Address*</label>
                          <textarea
                            className="form-control"
                            id="billingAddress"
                            name="billingAddress"
                            value={formData.billingAddress}
                            onChange={handleChange}
                            placeholder="Enter billing address"
                            rows="3"
                            required={!formData.billingAddressSameAsMain}
                          ></textarea>
                        </div>
                      </div>
                    )}
                    
                    <div className="col-lg-12">
                      <div className="form-group">
                        <label className="form-label" htmlFor="notes">Notes</label>
                        <textarea
                          className="form-control"
                          id="notes"
                          name="notes"
                          value={formData.notes}
                          onChange={handleChange}
                          placeholder="Enter any additional notes"
                          rows="4"
                        ></textarea>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-group">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm mr-1" role="status" aria-hidden="true"></span>
                              Creating...
                            </>
                          ) : (
                            'Create Client'
                          )}
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-outline-light ml-3"
                          onClick={() => navigate('/clients')}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default ClientForm;
