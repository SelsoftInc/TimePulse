import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const LeaveManagement = () => {
  const { user } = useAuth();
  
  // Use subdomain for navigation links and user info for personalization
  const userFullName = user?.name || 'Employee';
  const userRole = user?.role || 'employee';
  const [loading, setLoading] = useState(true);
  const [leaveData, setLeaveData] = useState({
    balance: {},
    history: [],
    pending: []
  });
  const [formData, setFormData] = useState({
    leaveType: 'vacation',
    startDate: '',
    endDate: '',
    reason: '',
    attachment: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchLeaveData = async () => {
      try {
        setLoading(true);
        // In a real app, fetch from API
        // For now, using mock data
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock leave data
        const mockLeaveData = {
          balance: {
            vacation: {
              total: 15,
              used: 5,
              pending: 2,
              remaining: 8
            },
            sick: {
              total: 10,
              used: 2,
              pending: 0,
              remaining: 8
            },
            personal: {
              total: 5,
              used: 1,
              pending: 0,
              remaining: 4
            }
          },
          history: [
            {
              id: '1',
              type: 'Vacation',
              startDate: '2025-05-10',
              endDate: '2025-05-14',
              days: 5,
              status: 'Approved',
              approvedBy: 'John Manager',
              approvedOn: '2025-04-20'
            },
            {
              id: '2',
              type: 'Sick',
              startDate: '2025-03-05',
              endDate: '2025-03-06',
              days: 2,
              status: 'Approved',
              approvedBy: 'John Manager',
              approvedOn: '2025-03-07'
            }
          ],
          pending: [
            {
              id: '3',
              type: 'Vacation',
              startDate: '2025-08-15',
              endDate: '2025-08-16',
              days: 2,
              status: 'Pending',
              requestedOn: '2025-07-20'
            }
          ]
        };
        
        setLeaveData(mockLeaveData);
      } catch (error) {
        console.error('Error fetching leave data:', error);
        setError('Failed to load leave data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaveData();
  }, []);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      attachment: e.target.files[0]
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate form
    if (!formData.startDate || !formData.endDate) {
      setError('Please select start and end dates');
      return;
    }
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    
    if (end < start) {
      setError('End date cannot be before start date');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // In a real app, send to API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Calculate days (excluding weekends)
      let days = 0;
      let currentDate = new Date(start);
      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          days++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Mock new request
      const newRequest = {
        id: `new-${Date.now()}`,
        type: formData.leaveType.charAt(0).toUpperCase() + formData.leaveType.slice(1),
        startDate: formData.startDate,
        endDate: formData.endDate,
        days,
        status: 'Pending',
        requestedOn: new Date().toISOString().split('T')[0]
      };
      
      // Update state
      setLeaveData(prev => ({
        ...prev,
        pending: [...prev.pending, newRequest],
        balance: {
          ...prev.balance,
          [formData.leaveType]: {
            ...prev.balance[formData.leaveType],
            pending: prev.balance[formData.leaveType].pending + days,
            remaining: prev.balance[formData.leaveType].remaining - days
          }
        }
      }));
      
      // Reset form
      setFormData({
        leaveType: 'vacation',
        startDate: '',
        endDate: '',
        reason: '',
        attachment: null
      });
      
      setSuccess('Leave request submitted successfully');
    } catch (error) {
      console.error('Error submitting leave request:', error);
      setError('Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };
  
  const cancelRequest = async (id) => {
    try {
      // In a real app, send to API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Find the request
      const request = leaveData.pending.find(req => req.id === id);
      
      if (!request) return;
      
      // Update state
      setLeaveData(prev => ({
        ...prev,
        pending: prev.pending.filter(req => req.id !== id),
        balance: {
          ...prev.balance,
          [request.type.toLowerCase()]: {
            ...prev.balance[request.type.toLowerCase()],
            pending: prev.balance[request.type.toLowerCase()].pending - request.days,
            remaining: prev.balance[request.type.toLowerCase()].remaining + request.days
          }
        }
      }));
      
      setSuccess('Leave request cancelled successfully');
    } catch (error) {
      console.error('Error cancelling leave request:', error);
      setError('Failed to cancel leave request');
    }
  };
  
  if (loading) {
    return (
      <div className="nk-content">
        <div className="container-fluid">
          <div className="nk-content-inner">
            <div className="nk-content-body">
              <div className="nk-block">
                <div className="text-center p-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3">Loading leave data...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="nk-content">
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            <div className="nk-block-head nk-block-head-sm">
              <div className="nk-block-between">
                <div className="nk-block-head-content">
                  <h3 className="nk-block-title page-title">Leave Management</h3>
                  <div className="nk-block-des text-soft">
                    <p>Welcome {userFullName}, {userRole === 'admin' ? 'manage all leave requests' : 'request and manage your leave and absences'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="alert alert-danger alert-icon">
                <em className="icon ni ni-alert-circle"></em>
                <strong>{error}</strong>
              </div>
            )}
            
            {success && (
              <div className="alert alert-success alert-icon">
                <em className="icon ni ni-check-circle"></em>
                <strong>{success}</strong>
              </div>
            )}
            
            <div className="nk-block">
              <div className="row g-gs">
                {/* Leave Balance */}
                <div className="col-lg-5">
                  <div className="card card-bordered h-100">
                    <div className="card-inner">
                      <div className="card-title-group align-start mb-3">
                        <div className="card-title">
                          <h6 className="title">Leave Balance</h6>
                        </div>
                      </div>
                      
                      <div className="leave-balance">
                        {Object.entries(leaveData.balance).map(([type, data]) => (
                          <div key={type} className="leave-balance-item mb-3">
                            <div className="leave-balance-title d-flex justify-content-between">
                              <h6 className="mb-1">{type.charAt(0).toUpperCase() + type.slice(1)}</h6>
                              <span className="badge badge-dim badge-outline badge-primary">
                                {data.remaining} days remaining
                              </span>
                            </div>
                            <div className="progress">
                              <div 
                                className="progress-bar bg-primary" 
                                role="progressbar" 
                                style={{ width: `${(data.used / data.total) * 100}%` }} 
                                aria-valuenow={data.used} 
                                aria-valuemin="0" 
                                aria-valuemax={data.total}
                              ></div>
                              <div 
                                className="progress-bar bg-warning" 
                                role="progressbar" 
                                style={{ width: `${(data.pending / data.total) * 100}%` }} 
                                aria-valuenow={data.pending} 
                                aria-valuemin="0" 
                                aria-valuemax={data.total}
                              ></div>
                            </div>
                            <div className="d-flex justify-content-between mt-1">
                              <small>{data.used} used</small>
                              <small>{data.pending > 0 ? `${data.pending} pending` : ''}</small>
                              <small>Total: {data.total}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Request Leave Form */}
                <div className="col-lg-7">
                  <div className="card card-bordered h-100">
                    <div className="card-inner">
                      <div className="card-title-group align-start mb-3">
                        <div className="card-title">
                          <h6 className="title">Request Leave</h6>
                        </div>
                      </div>
                      
                      <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                          <div className="col-12">
                            <div className="form-group">
                              <label className="form-label">Leave Type</label>
                              <select 
                                className="form-select" 
                                name="leaveType" 
                                value={formData.leaveType}
                                onChange={handleInputChange}
                                required
                              >
                                <option value="vacation">Vacation</option>
                                <option value="sick">Sick Leave</option>
                                <option value="personal">Personal Leave</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-group">
                              <label className="form-label">Start Date</label>
                              <input 
                                type="date" 
                                className="form-control" 
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleInputChange}
                                required
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-group">
                              <label className="form-label">End Date</label>
                              <input 
                                type="date" 
                                className="form-control" 
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleInputChange}
                                required
                              />
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="form-group">
                              <label className="form-label">Reason</label>
                              <textarea 
                                className="form-control" 
                                name="reason"
                                value={formData.reason}
                                onChange={handleInputChange}
                                rows="3"
                              ></textarea>
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="form-group">
                              <label className="form-label">Attachment (optional)</label>
                              <div className="form-control-wrap">
                                <input 
                                  type="file" 
                                  className="form-control" 
                                  onChange={handleFileChange}
                                />
                              </div>
                              <div className="form-note">
                                Upload any supporting documents (e.g., medical certificate)
                              </div>
                            </div>
                          </div>
                          <div className="col-12">
                            <button 
                              type="submit" 
                              className="btn btn-primary"
                              disabled={submitting}
                            >
                              {submitting ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                  Submitting...
                                </>
                              ) : 'Submit Request'}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
                
                {/* Pending Requests */}
                <div className="col-12">
                  <div className="card card-bordered">
                    <div className="card-inner">
                      <div className="card-title-group align-start mb-3">
                        <div className="card-title">
                          <h6 className="title">Pending Requests</h6>
                        </div>
                      </div>
                      
                      {leaveData.pending.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>Type</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Days</th>
                                <th>Status</th>
                                <th>Requested On</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {leaveData.pending.map(request => (
                                <tr key={request.id}>
                                  <td>{request.type}</td>
                                  <td>{request.startDate}</td>
                                  <td>{request.endDate}</td>
                                  <td>{request.days}</td>
                                  <td>
                                    <span className="badge badge-dim badge-warning">
                                      {request.status}
                                    </span>
                                  </td>
                                  <td>{request.requestedOn}</td>
                                  <td>
                                    <button 
                                      className="btn btn-sm btn-danger"
                                      onClick={() => cancelRequest(request.id)}
                                    >
                                      Cancel
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p>No pending leave requests</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Leave History */}
                <div className="col-12">
                  <div className="card card-bordered">
                    <div className="card-inner">
                      <div className="card-title-group align-start mb-3">
                        <div className="card-title">
                          <h6 className="title">Leave History</h6>
                        </div>
                      </div>
                      
                      {leaveData.history.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>Type</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Days</th>
                                <th>Status</th>
                                <th>Approved By</th>
                                <th>Approved On</th>
                              </tr>
                            </thead>
                            <tbody>
                              {leaveData.history.map(request => (
                                <tr key={request.id}>
                                  <td>{request.type}</td>
                                  <td>{request.startDate}</td>
                                  <td>{request.endDate}</td>
                                  <td>{request.days}</td>
                                  <td>
                                    <span className="badge badge-dim badge-success">
                                      {request.status}
                                    </span>
                                  </td>
                                  <td>{request.approvedBy}</td>
                                  <td>{request.approvedOn}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p>No leave history</p>
                        </div>
                      )}
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

export default LeaveManagement;
