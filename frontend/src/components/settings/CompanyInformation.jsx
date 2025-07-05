import React, { useState } from 'react';

const CompanyInformation = () => {
  const [companyInfo, setCompanyInfo] = useState({
    tenantName: 'Acme Corp',
    address: '123 Business Ave, Suite 100\nSan Francisco, CA 94107',
    taxId: '12-3456789',
    contactEmail: 'billing@acmecorp.com',
    contactPhone: '(415) 555-1234',
    logo: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCompanyInfo({
      ...companyInfo,
      [name]: value
    });
  };

  const handleLogoUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        setCompanyInfo({
          ...companyInfo,
          logo: event.target.result
        });
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // Save company information to backend
    console.log('Saving company information:', companyInfo);
    // API call would go here
    alert('Company information saved successfully!');
  };

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Company Information</h3>
      
      <div className="form-group">
        <label className="form-label" htmlFor="tenantName">Tenant Name</label>
        <input
          type="text"
          className="form-control"
          id="tenantName"
          name="tenantName"
          value={companyInfo.tenantName}
          onChange={handleInputChange}
          placeholder="Enter your company name"
        />
      </div>
      
      <div className="form-group">
        <label className="form-label" htmlFor="address">Company Address</label>
        <textarea
          className="form-control"
          id="address"
          name="address"
          value={companyInfo.address}
          onChange={handleInputChange}
          placeholder="Enter your company address"
          rows="3"
        ></textarea>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="taxId">Tax ID Number</label>
          <input
            type="text"
            className="form-control"
            id="taxId"
            name="taxId"
            value={companyInfo.taxId}
            onChange={handleInputChange}
            placeholder="Enter your tax ID"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="contactEmail">Contact Email</label>
          <input
            type="email"
            className="form-control"
            id="contactEmail"
            name="contactEmail"
            value={companyInfo.contactEmail}
            onChange={handleInputChange}
            placeholder="Enter contact email"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="contactPhone">Contact Phone</label>
          <input
            type="tel"
            className="form-control"
            id="contactPhone"
            name="contactPhone"
            value={companyInfo.contactPhone}
            onChange={handleInputChange}
            placeholder="Enter contact phone"
          />
        </div>
      </div>
      
      <div className="form-group">
        <label className="form-label">Company Logo</label>
        <div className="logo-upload-container">
          {companyInfo.logo ? (
            <div className="logo-preview">
              <img src={companyInfo.logo} alt="Company Logo" />
              <button 
                className="btn btn-sm btn-outline-light" 
                onClick={() => setCompanyInfo({...companyInfo, logo: null})}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="file-upload" onClick={() => document.getElementById('logoUpload').click()}>
              <div className="file-upload-icon">
                <i className="fa fa-cloud-upload-alt"></i>
              </div>
              <div className="file-upload-text">Drag & drop your logo here or click to browse</div>
              <div className="file-upload-hint">Recommended size: 200x200px. Max file size: 2MB</div>
            </div>
          )}
          <input
            type="file"
            id="logoUpload"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleLogoUpload}
          />
        </div>
      </div>
      
      <div className="button-group">
        <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
        <button className="btn btn-outline-light">Cancel</button>
      </div>
    </div>
  );
};

export default CompanyInformation;
