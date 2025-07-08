import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PERMISSIONS } from '../../utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import './Vendors.css';

const VendorForm = () => {
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
    taxId: '',
    vendorType: 'consultant',
    paymentTerms: 'net30',
    status: 'active',
    notes: ''
  });
  
  const [contractFile, setContractFile] = useState(null);
  const [contractPreview, setContractPreview] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setContractFile(file);
      
      // Create a preview URL for the uploaded file
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setContractPreview(fileReader.result);
      };
      fileReader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // In a real app, this would be an API call with FormData to handle file upload
    setTimeout(() => {
      const dataToSubmit = {
        ...formData,
        contractFilename: contractFile ? contractFile.name : null
      };
      
      console.log('Vendor data submitted:', dataToSubmit);
      setLoading(false);
      navigate('/vendors');
      // Show success message
      alert('Vendor created successfully!');
    }, 800);
  };

  return (
    <PermissionGuard requiredPermission={PERMISSIONS.CREATE_VENDOR}>
      <div className="nk-content">
        <div className="container-fluid">
          <div className="nk-block-head">
            <div className="nk-block-between">
              <div className="nk-block-head-content">
                <h3 className="nk-block-title">Add New Vendor</h3>
                <p className="nk-block-subtitle">Create a new vendor record</p>
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
                        <label className="form-label" htmlFor="name">Vendor Name*</label>
                        <input
                          type="text"
                          className="form-control"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Enter vendor name"
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
                        <label className="form-label" htmlFor="taxId">Tax ID / EIN</label>
                        <input
                          type="text"
                          className="form-control"
                          id="taxId"
                          name="taxId"
                          value={formData.taxId}
                          onChange={handleChange}
                          placeholder="Enter tax ID or EIN"
                        />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="vendorType">Vendor Type*</label>
                        <select
                          className="form-select"
                          id="vendorType"
                          name="vendorType"
                          value={formData.vendorType}
                          onChange={handleChange}
                          required
                        >
                          <option value="consultant">Consultant</option>
                          <option value="contractor">Contractor</option>
                          <option value="supplier">Supplier</option>
                          <option value="service">Service Provider</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
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
                          <option value="net15">Net 15</option>
                          <option value="net30">Net 30</option>
                          <option value="net45">Net 45</option>
                          <option value="net60">Net 60</option>
                          <option value="immediate">Immediate</option>
                        </select>
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
                          <option value="pending">Pending Approval</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <div className="form-group">
                        <label className="form-label">Contract / Agreement</label>
                        <div className="form-control-wrap">
                          <div className="custom-file">
                            <input
                              type="file"
                              className="custom-file-input"
                              id="contractFile"
                              accept=".pdf,.doc,.docx"
                              onChange={handleFileChange}
                            />
                            <label className="custom-file-label" htmlFor="contractFile">
                              {contractFile ? contractFile.name : 'Choose file'}
                            </label>
                          </div>
                        </div>
                        <small className="text-muted">Upload vendor contract or agreement (PDF, DOC, DOCX)</small>
                        
                        {contractPreview && (
                          <div className="document-preview mt-3">
                            <p>Document uploaded: {contractFile.name}</p>
                            {contractFile.type.includes('image') ? (
                              <img 
                                src={contractPreview} 
                                alt="Contract Preview" 
                                style={{ maxWidth: '100%', maxHeight: '200px' }} 
                              />
                            ) : (
                              <div className="document-icon">
                                <i className="fas fa-file-pdf fa-3x"></i>
                                <p>Document ready for upload</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
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
                            'Create Vendor'
                          )}
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-outline-light ml-3"
                          onClick={() => navigate('/vendors')}
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

export default VendorForm;
