// src/components/timesheets/EmployeeTimesheet.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { apiFetch } from '../../config/api';
import './EmployeeTimesheet.css';

const EmployeeTimesheet = () => {
  const { employeeId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timesheetId, setTimesheetId] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [client, setClient] = useState(null);
  const [currentWeek, setCurrentWeek] = useState('');
  const [weeklyHours, setWeeklyHours] = useState({
    mon: 0,
    tue: 0,
    wed: 0,
    thu: 0,
    fri: 0,
    sat: 0,
    sun: 0
  });
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('draft');
  const [reviewers, setReviewers] = useState([]);
  const [selectedReviewer, setSelectedReviewer] = useState('');
  
  // Fetch timesheet data for current week
  useEffect(() => {
    const fetchTimesheet = async () => {
      if (!employeeId || !user?.tenantId) {
        console.warn('⚠️ Missing employeeId or tenantId');
        return;
      }

      console.log('🔍 Starting timesheet fetch for:', { employeeId, tenantId: user.tenantId });

      try {
        setLoading(true);
        console.log('📡 Making API request...');

        const response = await apiFetch(
          `/api/timesheets/employee/${employeeId}/current?tenantId=${user.tenantId}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          },
          { timeoutMs: 15000 }
        );

        console.log('📡 API Response status:', response.status);

        if (!response.ok) {
          console.error('❌ API request failed:', response.status, response.statusText);
          throw new Error(`Failed to fetch timesheet: ${response.status}`);
        }

        const data = await response.json();
        console.log('📥 Raw API Response:', data);

        if (data.success && data.timesheet) {
          console.log('✅ Timesheet data received:', data.timesheet);

          // Ensure dailyHours exists and is properly structured
          let dailyHours = data.timesheet.dailyHours;
          if (!dailyHours) {
            console.warn('⚠️ No dailyHours in response, using defaults');
            dailyHours = {
              mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0
            };
          } else if (typeof dailyHours === 'string') {
            console.warn('⚠️ dailyHours is a string, attempting to parse:', dailyHours);
            try {
              dailyHours = JSON.parse(dailyHours);
            } catch (e) {
              console.error('❌ Failed to parse dailyHours string:', e);
              dailyHours = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 };
            }
          }

          console.log('⏰ Final daily hours data:', dailyHours);

          setTimesheetId(data.timesheet.id);
          setEmployee(data.timesheet.employee);
          setClient(data.timesheet.client);
          setCurrentWeek(data.timesheet.weekLabel);
          setWeeklyHours(dailyHours);
          setNotes(data.timesheet.notes || '');
          setStatus(data.timesheet.status);
          setSelectedReviewer(data.timesheet.reviewerId || '');

          console.log('✅ State updated successfully');
        } else {
          console.warn('⚠️ API returned success=false or no timesheet data');
          // Set default values when no data is available
          setWeeklyHours({ mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 });
        }

        // Fetch reviewers list
        console.log('👥 Fetching reviewers...');
        const reviewersResponse = await apiFetch(
          `/api/timesheets/reviewers?tenantId=${user.tenantId}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          },
          { timeoutMs: 15000 }
        );

        if (reviewersResponse.ok) {
          const reviewersData = await reviewersResponse.json();
          if (reviewersData.success) {
            console.log('👥 Reviewers loaded:', reviewersData.reviewers.length);
            setReviewers(reviewersData.reviewers);
          } else {
            console.warn('⚠️ Failed to load reviewers');
          }
        } else {
          console.warn('⚠️ Reviewers API failed');
        }
      } catch (error) {
        console.error('❌ Error fetching timesheet:', error);
        toast.error('Failed to load timesheet data. Please check your connection and try again.');

        // Set default values on error
        setWeeklyHours({ mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 });
      } finally {
        console.log('🔄 Loading state set to false');
      }
    };

    fetchTimesheet();
  }, [employeeId, user?.tenantId, toast]); // eslint-disable-line react-hooks/exhaustive-deps
  const totalHours = Object.values(weeklyHours).reduce((sum, hours) => sum + (parseFloat(hours) || 0), 0);

  // Debug logging for troubleshooting
  console.log('Weekly Hours:', weeklyHours);
  console.log('Total Hours:', totalHours);
  
  // Handle hour changes
  const handleHourChange = (day, value) => {
    const hours = parseFloat(value) || 0;
    setWeeklyHours(prev => ({
      ...prev,
      [day]: hours
    }));
  };
  
  // Handle drag and drop for file upload
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(file =>
      ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type) ||
      file.name.toLowerCase().endsWith('.pdf') ||
      file.name.toLowerCase().endsWith('.xlsx') ||
      file.name.toLowerCase().endsWith('.xls') ||
      file.name.toLowerCase().endsWith('.docx') ||
      file.name.toLowerCase().endsWith('.doc')
    );

    if (validFiles.length !== droppedFiles.length) {
      toast.error('Some files were rejected. Only PDF, Excel, and Word files are allowed.');
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} file(s) uploaded successfully`);
    }
  };
  
  // Handle file upload (fallback for file input)
  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    const validFiles = uploadedFiles.filter(file =>
      ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type) ||
      file.name.toLowerCase().endsWith('.pdf') ||
      file.name.toLowerCase().endsWith('.xlsx') ||
      file.name.toLowerCase().endsWith('.xls') ||
      file.name.toLowerCase().endsWith('.docx') ||
      file.name.toLowerCase().endsWith('.doc')
    );

    if (validFiles.length !== uploadedFiles.length) {
      toast.error('Some files were rejected. Only PDF, Excel, and Word files are allowed.');
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} file(s) uploaded successfully`);
    }
  };
  
  // Remove file
  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  
  // Handle form submission
  const handleSubmit = async (isDraft = false) => {
    if (!timesheetId || !user?.tenantId) {
      toast.error('Missing timesheet information');
      return;
    }

    // Validate reviewer selection when submitting (not for draft)
    if (!isDraft && !selectedReviewer) {
      toast.error('Please select a reviewer before submitting the timesheet');
      return;
    }

    // Warn if no hours are entered but allow submission
    if (!isDraft && totalHours === 0) {
      const confirmSubmit = window.confirm('You have not entered any hours for this week. Are you sure you want to submit an empty timesheet?');
      if (!confirmSubmit) {
        return;
      }
    }

    try {
      setSubmitting(true);
      
      const updateData = {
        dailyHours: weeklyHours,
        status: isDraft ? 'draft' : 'submitted',
        notes: notes,
        attachments: files.map(f => ({ name: f.name, size: f.size })),
        reviewerId: selectedReviewer || null
      };

      const response = await apiFetch(
        `/api/timesheets/${timesheetId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        },
        { timeoutMs: 15000 }
      );

      if (!response.ok) {
        throw new Error('Failed to update timesheet');
      }

      const data = await response.json();
      if (data.success) {
        setStatus(isDraft ? 'draft' : 'submitted');
        toast.success(`Timesheet ${isDraft ? 'saved as draft' : 'submitted for approval'} successfully!`);
      }
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      toast.error(`Failed to ${isDraft ? 'save' : 'submit'} timesheet`);
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="nk-content">
        <div className="container-fluid">
          <div className="d-flex justify-content-center mt-5">
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Loading timesheet...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="nk-content">
        <div className="container-fluid">
          <div className="alert alert-warning mt-3">
            Employee not found or you don't have access to this timesheet.
          </div>
        </div>
      </div>
    );
  }

  const isSubmitted = status === 'submitted' || status === 'approved';

  return (
    <div className="nk-content">
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            <div className="nk-block-head nk-block-head-sm">
              <div className="nk-block-between">
                <div className="nk-block-head-content">
                  <h3 className="nk-block-title page-title">Employee Timesheet</h3>
                  <div className="nk-block-des text-soft">
                    <p>Week: {currentWeek}</p>
                    {isSubmitted && (
                      <span className={`badge badge-${status === 'approved' ? 'success' : 'warning'}`}>
                        {status.toUpperCase()}
                      </span>
                    )}
                    {/* Debug info - remove in production */}
                    <small className="d-block mt-1 text-muted">
                      Debug: Total: {totalHours}h | State: {JSON.stringify(weeklyHours)}
                    </small>
                  </div>
                </div>
                <div className="nk-block-head-content">
                  <div className="toggle-wrap nk-block-tools-toggle">
                    <Link to="/timesheets" className="btn btn-outline-light">
                      <em className="icon ni ni-arrow-left"></em>
                      <span>Back</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="nk-block">
              <div className="card card-bordered">
                <div className="card-inner">
                  <div className="card-head">
                    <h5 className="card-title">Timesheet Details</h5>
                  </div>
                  
                  <div className="row g-4">
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label">Employee Name</label>
                        <div className="form-control-wrap">
                          <input type="text" className="form-control" value={employee?.name || ''} readOnly />
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label">Client</label>
                        <div className="form-control-wrap">
                          <input 
                            type="text" 
                            className="form-control" 
                            value={client?.name || 'No client assigned'} 
                            readOnly 
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label">Assign Reviewer <span className="text-danger">*</span></label>
                        <div className="form-control-wrap">
                          <select 
                            className="form-select" 
                            value={selectedReviewer} 
                            onChange={(e) => setSelectedReviewer(e.target.value)}
                            disabled={isSubmitted}
                            required
                          >
                            <option value="">Select a reviewer...</option>
                            {reviewers.map(reviewer => (
                              <option key={reviewer.id} value={reviewer.id}>
                                {reviewer.name} ({reviewer.role})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-note">
                          Select an admin or manager to review this timesheet
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card card-bordered mt-4">
                <div className="card-inner">
                  <div className="card-head">
                    <h5 className="card-title">Weekly Hours</h5>
                  </div>
                  
                  <div className="timesheet-grid">
                    {Object.entries(weeklyHours).map(([day, hours]) => (
                      <div key={day} className="timesheet-day">
                        <label className="form-label">{day.charAt(0).toUpperCase() + day.slice(1)}</label>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          max="24"
                          step="0.5"
                          value={hours}
                          onChange={(e) => handleHourChange(day, e.target.value)}
                          disabled={isSubmitted}
                        />
                      </div>
                    ))}
                    
                    <div className="timesheet-total">
                      <label className="form-label">Total</label>
                      <div className="total-hours">
                        <span className={totalHours === 40 ? 'text-success' : totalHours < 40 ? 'text-warning' : 'text-danger'}>
                          {totalHours} hrs {totalHours === 40 ? '✅' : ''}
                        </span>
                        {totalHours === 0 && (
                          <small className="text-muted d-block">No hours entered yet</small>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card card-bordered mt-4">
                <div className="card-inner">
                  <div className="card-head">
                    <h5 className="card-title">Additional Information</h5>
                  </div>
                  
                  <div className="row g-4">
                    <div className="col-12">
                      <div className="form-group">
                        <label className="form-label">Notes</label>
                        <div className="form-control-wrap">
                          <textarea 
                            className="form-control" 
                            rows="3"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any additional notes or details about your work this week"
                            disabled={isSubmitted}
                          ></textarea>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-12">
                      <div className="form-group">
                        <label className="form-label">
                          Upload Supporting Documents (Optional)
                          <span className="text-soft d-block">Allowed formats: PDF, Excel, Word (.pdf, .xlsx, .docx)</span>
                        </label>
                        <div className="form-control-wrap">
                          <div
                            className={`file-drop-area ${files.length > 0 ? 'has-files' : ''}`}
                            onDragOver={handleDragOver}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                          >
                            <div className="file-drop-content">
                              <div className="file-drop-icon">
                                <i className="fa fa-cloud-upload-alt"></i>
                              </div>
                              <div className="file-drop-text">
                                <h4>Drag & Drop Files Here</h4>
                                <p>Or click to browse files</p>
                                <span className="file-types">Supported: PDF, Excel, Word</span>
                              </div>
                              <input
                                type="file"
                                className="file-input-hidden"
                                multiple
                                accept=".pdf,.xlsx,.docx"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                disabled={isSubmitted}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {files.length > 0 && (
                      <div className="col-12">
                        <h6 className="title">Uploaded Files</h6>
                        <ul className="attached-files">
                          {files.map((file, index) => (
                            <li key={index} className="file-item">
                              <div className="file-name">{file.name}</div>
                              <div className="file-size">{(file.size / 1024).toFixed(2)} KB</div>
                              <button 
                                className="btn btn-sm btn-icon btn-outline-danger" 
                                onClick={() => removeFile(index)}
                              >
                                <em className="icon ni ni-trash"></em>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="card card-bordered mt-4">
                <div className="card-inner">
                  <div className="row g-4">
                    <div className="col-12">
                      <div className="form-group">
                        {!isSubmitted ? (
                          <>
                            <button 
                              className="btn btn-primary mr-3" 
                              onClick={() => handleSubmit(false)}
                              disabled={submitting}
                            >
                              <em className="icon ni ni-send mr-1"></em>
                              <span>{submitting ? 'Submitting...' : 'Submit for Approval'}</span>
                            </button>
                            <button 
                              className="btn btn-outline-light" 
                              onClick={() => handleSubmit(true)}
                              disabled={submitting}
                            >
                              <em className="icon ni ni-save mr-1"></em>
                              <span>{submitting ? 'Saving...' : 'Save Draft'}</span>
                            </button>
                          </>
                        ) : (
                          <div className="alert alert-info">
                            <em className="icon ni ni-info-fill mr-2"></em>
                            This timesheet has been {status}. Contact your manager if you need to make changes.
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
    </div>
  );
};

export default EmployeeTimesheet;
