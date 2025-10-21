import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE } from '../../config/api';
import { PERMISSIONS } from '../../utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import './Employees.css';

const EmployeeSettings = () => {
  const { subdomain, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [approvers, setApprovers] = useState([]);
  const [formData, setFormData] = useState({
    client: '',
    clientType: 'internal',
    approver: '',
    approvalWorkflow: 'manager',
    billableStatus: 'billable',
    overtimeEligible: true
  });
  
  // Sample client list - in a real app, this would come from an API
  const clients = [
    { id: 1, name: 'JPMC', type: 'internal' },
    { id: 2, name: 'Accenture', type: 'internal' },
    { id: 3, name: 'IBM', type: 'external' },
    { id: 4, name: 'Cognizant', type: 'external' },
    { id: 5, name: 'Virtusa', type: 'internal' }
  ];
  
  // Fetch approvers from API
  useEffect(() => {
    const fetchApprovers = async () => {
      if (!user?.tenantId) return;
      
      try {
        const response = await fetch(`${API_BASE}/api/approvers?tenantId=${user.tenantId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setApprovers(data.approvers);
          }
        }
      } catch (error) {
        console.error('Error fetching approvers:', error);
      }
    };
    
    fetchApprovers();
  }, [user?.tenantId]);

  // Use useCallback to memoize the function and avoid dependency issues in useEffect
  const loadEmployeeData = useCallback(async () => {
    setLoading(true);
    try {
      // In a real app, fetch employee data from API
      // For now, using mock data
      setTimeout(() => {
        // Mock employee data with client and approver details
        const isSubcontractor = id === '3' || id === '4';
        const clientId = id === '1' ? 1 : id === '2' ? 5 : id === '3' ? 2 : 4;
        const clientType = id === '1' || id === '2' || id === '3' ? 'internal' : 'external';
        const approverId = id === '1' ? 4 : id === '2' ? 3 : id === '3' ? 2 : 1;
        
        const mockEmployee = {
          id: parseInt(id),
          firstName: id === '1' ? 'John' : id === '2' ? 'Sarah' : id === '3' ? 'Michael' : 'Emily',
          lastName: id === '1' ? 'Smith' : id === '2' ? 'Johnson' : id === '3' ? 'Brown' : 'Davis',
          name: id === '1' ? 'John Smith' : id === '2' ? 'Sarah Johnson' : id === '3' ? 'Michael Brown' : 'Emily Davis',
          email: id === '1' ? 'john.smith@selsoft.com' : id === '2' ? 'sarah.johnson@selsoft.com' : id === '3' ? 'michael.brown@selsoft.com' : 'emily.davis@selsoft.com',
          department: id === '1' ? 'Engineering' : id === '2' ? 'Project Management' : id === '3' ? 'Design' : 'Quality Assurance',
          client: clientId,
          clientType: clientType,
          approver: approverId,
          approvalWorkflow: 'manager',
          billableStatus: id === '2' ? 'non-billable' : 'billable',
          overtimeEligible: id !== '4',
          employmentType: isSubcontractor ? 'Subcontractor' : 'W2'
        };
        
        setEmployee(mockEmployee);
        setFormData({
          client: mockEmployee.client.toString(),
          clientType: mockEmployee.clientType,
          approver: mockEmployee.approver.toString(),
          approvalWorkflow: mockEmployee.approvalWorkflow,
          billableStatus: mockEmployee.billableStatus,
          overtimeEligible: mockEmployee.overtimeEligible
        });
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error loading employee data:', error);
      setLoading(false);
    }
  }, [id]);
  
  useEffect(() => {
    loadEmployeeData();
  }, [loadEmployeeData]);



  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleClientChange = (e) => {
    const clientId = parseInt(e.target.value);
    const selectedClient = clients.find(client => client.id === clientId);
    
    setFormData({
      ...formData,
      client: e.target.value,
      clientType: selectedClient ? selectedClient.type : 'internal'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Log the data that would be sent to the server
      const dataToSubmit = {
        ...formData,
        employeeId: employee.id,
        employeeName: employee.name,
        clientName: clients.find(c => c.id === parseInt(formData.client))?.name,
        approverName: approvers.find(a => a.id === parseInt(formData.approver))?.name
      };
      
      console.log('Employee settings updated:', dataToSubmit);
      
      // Show success message
      alert('Employee settings updated successfully!');
      
      // Navigate back to employee detail
      navigate(`/${subdomain}/employees/${id}`);
    } catch (error) {
      console.error('Error updating employee settings:', error);
      alert('Error updating employee settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PermissionGuard requiredPermission={PERMISSIONS.EDIT_EMPLOYEE}>
      <div className="nk-content">
        <div className="container-fluid">
          <div className="nk-block-head">
            <div className="nk-block-between">
              <div className="nk-block-head-content">
                <h3 className="nk-block-title">Employee Settings</h3>
                <p className="nk-block-subtitle">
                  Configure timesheet settings for {employee?.name}
                </p>
              </div>
              <div className="nk-block-head-content">
                <div className="toggle-wrap nk-block-tools-toggle">
                  <button 
                    className="btn btn-icon btn-trigger toggle-expand mr-n1" 
                    onClick={() => navigate(`/${subdomain}/employees/${id}`)}
                  >
                    <i className="fas fa-arrow-left"></i> Back to Employee
                  </button>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="nk-block">
              <div className="card card-bordered">
                <div className="card-inner d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                  <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="nk-block">
              <div className="card card-bordered">
                <div className="card-inner">
                  <form onSubmit={handleSubmit}>
                    <div className="row g-4">
                      <div className="col-12">
                        <div className="form-group">
                          <label className="form-label" htmlFor="employee-name">Employee</label>
                          <input
                            type="text"
                            className="form-control"
                            id="employee-name"
                            value={employee.name}
                            readOnly
                          />
                        </div>
                      </div>
                      
                      {/* Client Assignment Section */}
                      <div className="col-12">
                        <h5 className="title">Client Assignment</h5>
                        <div className="form-note mb-3">
                          Assign this employee to a client and specify the client type
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-label" htmlFor="client">Client</label>
                          <select
                            className="form-control"
                            id="client"
                            name="client"
                            value={formData.client}
                            onChange={handleClientChange}
                            required
                          >
                            <option value="">Select Client</option>
                            {clients.map(client => (
                              <option key={client.id} value={client.id}>
                                {client.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-label" htmlFor="clientType">Client Type</label>
                          <div className="form-control-wrap">
                            <div className="form-control-select">
                              <select
                                className="form-control"
                                id="clientType"
                                name="clientType"
                                value={formData.clientType}
                                onChange={handleChange}
                                required
                              >
                                <option value="internal">Internal</option>
                                <option value="external">External</option>
                              </select>
                            </div>
                          </div>
                          <div className="form-note">
                            {formData.clientType === 'internal' ? 
                              'Internal clients use our timesheet system for hour tracking' : 
                              'External clients require uploading their own timesheet files'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Timesheet Approval Section */}
                      <div className="col-12 mt-3">
                        <h5 className="title">Timesheet Approval</h5>
                        <div className="form-note mb-3">
                          Configure who approves this employee's timesheets
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-label" htmlFor="approver">Timesheet Approver</label>
                          <select
                            className="form-control"
                            id="approver"
                            name="approver"
                            value={formData.approver}
                            onChange={handleChange}
                            required
                          >
                            <option value="">Select Approver</option>
                            {approvers.map(approver => (
                              <option key={approver.id} value={approver.id}>
                                {approver.name} ({approver.department})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-label" htmlFor="approvalWorkflow">Approval Workflow</label>
                          <div className="form-control-wrap">
                            <div className="form-control-select">
                              <select
                                className="form-control"
                                id="approvalWorkflow"
                                name="approvalWorkflow"
                                value={formData.approvalWorkflow}
                                onChange={handleChange}
                              >
                                <option value="manager">Manager Approval</option>
                                <option value="client">Client Approval</option>
                                <option value="both">Both Manager & Client</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Billing Settings Section */}
                      <div className="col-12 mt-3">
                        <h5 className="title">Billing Settings</h5>
                        <div className="form-note mb-3">
                          Configure billing status and overtime eligibility
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-label" htmlFor="billableStatus">Billable Status</label>
                          <div className="form-control-wrap">
                            <div className="form-control-select">
                              <select
                                className="form-control"
                                id="billableStatus"
                                name="billableStatus"
                                value={formData.billableStatus}
                                onChange={handleChange}
                              >
                                <option value="billable">Billable</option>
                                <option value="non-billable">Non-Billable</option>
                                <option value="partial">Partially Billable</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-label">Overtime Eligible</label>
                          <div className="custom-control custom-switch">
                            <input
                              type="checkbox"
                              className="custom-control-input"
                              id="overtimeEligible"
                              name="overtimeEligible"
                              checked={formData.overtimeEligible}
                              onChange={handleChange}
                            />
                            <label className="custom-control-label" htmlFor="overtimeEligible">
                              {formData.overtimeEligible ? 'Yes' : 'No'}
                            </label>
                          </div>
                          <div className="form-note">
                            {formData.overtimeEligible ? 
                              'Employee is eligible for overtime pay' : 
                              'Employee is not eligible for overtime pay'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-12 mt-4">
                        <div className="form-group">
                          <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? (
                              <>
                                <span className="spinner-border spinner-border-sm mr-1" role="status" aria-hidden="true"></span>
                                Saving...
                              </>
                            ) : (
                              'Save Settings'
                            )}
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-outline-light ml-3"
                            onClick={() => navigate(`/${subdomain}/employees/${id}`)}
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
          )}
        </div>
      </div>
    </PermissionGuard>
  );
};

export default EmployeeSettings;
