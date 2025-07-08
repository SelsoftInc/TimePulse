import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PERMISSIONS } from '../../utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import { useAuth } from '../../contexts/AuthContext';
import './Employees.css';

const EmployeeForm = () => {
  const navigate = useNavigate();
  const { checkPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    startDate: '',
    client: '',
    hourlyRate: '',
    overtimeRate: '',
    enableOvertime: false,
    overtimeMultiplier: 1.5,
    status: 'active',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    notes: ''
  });
  
  const [workOrder, setWorkOrder] = useState(null);
  const [workOrderPreview, setWorkOrderPreview] = useState('');

  // Sample client list - in a real app, this would come from an API
  const clients = [
    { id: 1, name: 'JPMC' },
    { id: 2, name: 'Accenture' },
    { id: 3, name: 'Virtusa' },
    { id: 4, name: 'Cognizant' },
    { id: 5, name: 'IBM' }
  ];

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
      setWorkOrder(file);
      
      // Create a preview URL for the uploaded file
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setWorkOrderPreview(fileReader.result);
      };
      fileReader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // In a real app, this would be an API call with FormData to handle file upload
    setTimeout(() => {
      // Calculate overtime rate if overtime is enabled
      let overtimeRate = null;
      if (formData.enableOvertime && formData.hourlyRate) {
        overtimeRate = parseFloat(formData.hourlyRate) * parseFloat(formData.overtimeMultiplier);
      }
      
      const dataToSubmit = {
        ...formData,
        overtimeRate,
        workOrderFilename: workOrder ? workOrder.name : null,
        sowDetails: {
          hourlyRate: formData.hourlyRate,
          enableOvertime: formData.enableOvertime,
          overtimeMultiplier: formData.overtimeMultiplier,
          overtimeRate,
          approvalWorkflow: formData.approvalWorkflow || 'manual',
          workOrderDocument: workOrder ? workOrder.name : null
        }
      };
      
      console.log('Employee data submitted:', dataToSubmit);
      setLoading(false);
      navigate('/employees');
      // Show success message
      alert('Employee created successfully!');
    }, 800);
  };

  return (
    <PermissionGuard requiredPermission={PERMISSIONS.CREATE_EMPLOYEE}>
      <div className="nk-content">
        <div className="container-fluid">
          <div className="nk-block-head">
            <div className="nk-block-between">
              <div className="nk-block-head-content">
                <h3 className="nk-block-title">Add New Employee</h3>
                <p className="nk-block-subtitle">Create a new employee record</p>
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
                        <label className="form-label" htmlFor="firstName">First Name*</label>
                        <input
                          type="text"
                          className="form-control"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="Enter first name"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="lastName">Last Name*</label>
                        <input
                          type="text"
                          className="form-control"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          placeholder="Enter last name"
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
                        <label className="form-label" htmlFor="phone">Phone Number</label>
                        <input
                          type="tel"
                          className="form-control"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="position">Position*</label>
                        <input
                          type="text"
                          className="form-control"
                          id="position"
                          name="position"
                          value={formData.position}
                          onChange={handleChange}
                          placeholder="Enter position"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="department">Department</label>
                        <input
                          type="text"
                          className="form-control"
                          id="department"
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          placeholder="Enter department"
                        />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="startDate">Start Date*</label>
                        <input
                          type="date"
                          className="form-control"
                          id="startDate"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label" htmlFor="client">Assigned Client*</label>
                        <select
                          className="form-select"
                          id="client"
                          name="client"
                          value={formData.client}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Client</option>
                          {clients.map(client => (
                            <option key={client.id} value={client.name}>{client.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {/* Hourly Rate - Only visible to Admin */}
                    {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && (
                      <div className="col-lg-6">
                        <div className="form-group">
                          <label className="form-label" htmlFor="hourlyRate">Hourly Rate ($)*</label>
                          <input
                            type="number"
                            className="form-control"
                            id="hourlyRate"
                            name="hourlyRate"
                            value={formData.hourlyRate}
                            onChange={handleChange}
                            placeholder="Enter hourly rate"
                            min="0"
                            step="0.01"
                            required
                          />
                          <small className="text-muted">This information is only visible to administrators</small>
                        </div>
                      </div>
                    )}
                    
                    {/* Overtime Settings - Only visible to Admin */}
                    {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && (
                      <div className="col-lg-12">
                        <div className="form-group mt-3">
                          <div className="custom-control custom-switch">
                            <input
                              type="checkbox"
                              className="custom-control-input"
                              id="enableOvertime"
                              name="enableOvertime"
                              checked={formData.enableOvertime}
                              onChange={(e) => setFormData({
                                ...formData,
                                enableOvertime: e.target.checked
                              })}
                            />
                            <label className="custom-control-label" htmlFor="enableOvertime">Enable Overtime</label>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Overtime Multiplier - Only visible if overtime is enabled and to Admin */}
                    {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && formData.enableOvertime && (
                      <div className="col-lg-6">
                        <div className="form-group">
                          <label className="form-label" htmlFor="overtimeMultiplier">Overtime Multiplier</label>
                          <input
                            type="number"
                            className="form-control"
                            id="overtimeMultiplier"
                            name="overtimeMultiplier"
                            value={formData.overtimeMultiplier}
                            onChange={handleChange}
                            placeholder="1.5"
                            min="1"
                            step="0.1"
                          />
                          <small className="text-muted">Standard rate × multiplier = overtime rate</small>
                        </div>
                      </div>
                    )}
                    
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
                          <option value="onleave">On Leave</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Work Order/SOW Upload - Only visible to Admin */}
                    {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && (
                      <div className="col-lg-12">
                        <div className="form-group">
                          <label className="form-label">Work Order / SOW*</label>
                          <div className="form-control-wrap">
                            <div className="custom-file">
                              <input
                                type="file"
                                className="custom-file-input"
                                id="workOrder"
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx"
                                required
                              />
                              <label className="custom-file-label" htmlFor="workOrder">
                                {workOrder ? workOrder.name : 'Choose file'}
                              </label>
                            </div>
                          </div>
                          <small className="form-hint">Upload the Statement of Work or Work Order document</small>
                          
                          {workOrderPreview && (
                            <div className="document-preview mt-3">
                              <div className="document-preview-header">
                                <span className="document-name">{workOrder?.name}</span>
                                <span className="document-size">{Math.round((workOrder?.size || 0) / 1024)} KB</span>
                              </div>
                              <div className="document-preview-content">
                                {workOrder?.type.includes('image') ? (
                                  <img src={workOrderPreview} alt="Preview" className="preview-image" />
                                ) : (
                                  <div className="document-icon">
                                    <i className="fas fa-file-pdf"></i>
                                    <span>Document uploaded successfully</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* SOW Approval Settings - Only visible to Admin */}
                    {checkPermission(PERMISSIONS.MANAGE_SETTINGS) && (
                      <div className="col-lg-12">
                        <div className="form-group mt-3">
                          <label className="form-label">SOW Approval Workflow</label>
                          <select
                            className="form-select"
                            id="approvalWorkflow"
                            name="approvalWorkflow"
                            value={formData.approvalWorkflow || 'manual'}
                            onChange={handleChange}
                          >
                            <option value="auto">Auto-approve</option>
                            <option value="manual">Manual approval</option>
                            <option value="manager">Manager approval</option>
                            <option value="client">Client approval</option>
                          </select>
                          <small className="form-hint">Select how work hours for this employee should be approved</small>
                        </div>
                      </div>
                    )}
                    
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
                            'Create Employee'
                          )}
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-outline-light ml-3"
                          onClick={() => navigate('/employees')}
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

export default EmployeeForm;
