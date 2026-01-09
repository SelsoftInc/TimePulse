'use client';

import React, { useState } from 'react';
import '../auth/Auth.css';

const INDUSTRIES = [
  'Accounting',
  'Consulting',
  'Education',
  'Finance',
  'Healthcare',
  'Information Technology',
  'Legal',
  'Manufacturing',
  'Marketing',
  'Real Estate',
  'Retail',
  'Technology',
  'Other'
];

const CreateWorkspaceModal = ({ onClose, onCreateWorkspace }) => {
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    industry: '',
    contactEmail: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-generate subdomain from workspace name
    if (name === 'name' && !formData.subdomain) {
      const generatedSubdomain = value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
        
      setFormData({
        ...formData,
        [name]: value,
        subdomain: generatedSubdomain
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubdomainChange = (e) => {
    // Ensure subdomain only contains valid characters
    const value = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
      
    setFormData({
      ...formData,
      subdomain: value
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Workspace name is required');
      return false;
    }
    
    if (!formData.subdomain.trim()) {
      setError('Subdomain is required');
      return false;
    }
    
    if (!formData.industry) {
      setError('Please select an industry');
      return false;
    }
    
    if (!formData.contactEmail.trim()) {
      setError('Contact email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contactEmail)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate a new workspace with tenant_id
      const newWorkspace = {
        id: 'ws-' + Math.floor(Math.random() * 10000),
        name: formData.name,
        subdomain: formData.subdomain,
        industry: formData.industry,
        contactEmail: formData.contactEmail,
        status: 'trial',
        createdAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        tenant_id: 'tenant-' + Math.floor(Math.random() * 100000)
      };
      
      // Pass the new workspace to parent component
      onCreateWorkspace(newWorkspace);
    } catch (err) {
      setError('Failed to create workspace. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h4>Create New Workspace</h4>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {error && <div className="auth-error">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Workspace Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter workspace name"
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="subdomain">Subdomain</label>
              <div className="input-group">
                <input
                  type="text"
                  id="subdomain"
                  name="subdomain"
                  value={formData.subdomain}
                  onChange={handleSubdomainChange}
                  placeholder="your-workspace"
                  className="form-control"
                />
                <span className="input-group-text">.timepulse.ai</span>
              </div>
              <small className="form-text">Only lowercase letters, numbers, and hyphens are allowed.</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="industry">Industry</label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="form-control"
              >
                <option value="">Select an industry</option>
                {INDUSTRIES.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="contactEmail">Email</label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="Enter contact email"
                className="form-control"
              />
            </div>
          </form>
        </div>
        
        <div className="modal-footer">
          <button className="btn-outline" onClick={onClose}>Cancel</button>
          <button 
            className="btn-primary" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Workspace'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateWorkspaceModal;
