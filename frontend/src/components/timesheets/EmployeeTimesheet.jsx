// src/components/timesheets/EmployeeTimesheet.jsx
import React, { useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import './EmployeeTimesheet.css';

const EmployeeTimesheet = () => {
  const { employeeId } = useParams();
  const { isDarkMode } = useTheme();
  const fileInputRef = useRef(null);
  
  // Sample employee data - in a real app, this would come from an API
  const employeeData = {
    1: { id: 1, name: "John Doe", clientId: 1, clientName: "JPMC" },
    2: { id: 2, name: "Jane Smith", clientId: 1, clientName: "JPMC" },
    // More employees would be here
  };
  
  // Sample SOW data - in a real app, this would come from an API
  const sowData = [
    { id: 1, name: "TimePulse Development", clientId: 1, startDate: "Jan 2023", endDate: "Dec 2023" },
    { id: 2, name: "API Integration", clientId: 1, startDate: "Mar 2023", endDate: "Sep 2023" },
    { id: 3, name: "Client Portal Redesign", clientId: 1, startDate: "Feb 2023", endDate: "Aug 2023" }
  ];
  
  const [selectedSOW, setSelectedSOW] = useState(sowData[0].id);
  const [weeklyHours, setWeeklyHours] = useState({
    Mon: 8,
    Tue: 8,
    Wed: 8,
    Thu: 8,
    Fri: 8,
    Sat: 0,
    Sun: 0
  });
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState([]);
  
  const employee = employeeData[employeeId] || {};
  const currentWeek = "July 5 - July 11, 2023"; // In a real app, this would be dynamic
  
  // Calculate total hours
  const totalHours = Object.values(weeklyHours).reduce((sum, hours) => sum + hours, 0);
  
  // Handle hour changes
  const handleHourChange = (day, value) => {
    const hours = parseFloat(value) || 0;
    setWeeklyHours(prev => ({
      ...prev,
      [day]: hours
    }));
  };
  
  // Handle file upload
  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...uploadedFiles]);
  };
  
  // Remove file
  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  
  // Handle form submission
  const handleSubmit = (isDraft = false) => {
    const timesheetData = {
      employeeId,
      sowId: selectedSOW,
      week: currentWeek,
      hours: weeklyHours,
      totalHours,
      notes,
      files: files.map(f => f.name), // In a real app, files would be uploaded to server
      status: isDraft ? 'Draft' : 'Submitted'
    };
    
    console.log('Timesheet data:', timesheetData);
    // In a real app, this would be sent to an API
    alert(`Timesheet ${isDraft ? 'saved as draft' : 'submitted'} successfully!`);
  };
  
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
                        <label className="form-label">Client</label>
                        <div className="form-control-wrap">
                          <input type="text" className="form-control" value={employee.clientName} readOnly />
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label className="form-label">Employee Name</label>
                        <div className="form-control-wrap">
                          <input type="text" className="form-control" value={employee.name} readOnly />
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-12">
                      <div className="form-group">
                        <label className="form-label">Statement of Work (SOW)</label>
                        <div className="form-control-wrap">
                          <select 
                            className="form-select" 
                            value={selectedSOW}
                            onChange={(e) => setSelectedSOW(parseInt(e.target.value))}
                          >
                            {sowData.map(sow => (
                              <option key={sow.id} value={sow.id}>
                                {sow.name} ({sow.startDate} - {sow.endDate})
                              </option>
                            ))}
                          </select>
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
                        <label className="form-label">{day}</label>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          max="24"
                          step="0.5"
                          value={hours}
                          onChange={(e) => handleHourChange(day, e.target.value)}
                        />
                      </div>
                    ))}
                    
                    <div className="timesheet-total">
                      <label className="form-label">Total</label>
                      <div className="total-hours">
                        <span className={totalHours === 40 ? 'text-success' : totalHours < 40 ? 'text-warning' : 'text-danger'}>
                          {totalHours} hrs {totalHours === 40 ? '✅' : ''}
                        </span>
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
                          <div className="custom-file">
                            <input
                              type="file"
                              className="custom-file-input"
                              id="customFile"
                              multiple
                              accept=".pdf,.xlsx,.docx"
                              ref={fileInputRef}
                              onChange={handleFileUpload}
                            />
                            <label className="custom-file-label" htmlFor="customFile">
                              Choose files
                            </label>
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
                        <button 
                          className="btn btn-primary mr-3" 
                          onClick={() => handleSubmit(false)}
                        >
                          <em className="icon ni ni-send mr-1"></em>
                          <span>Submit for Approval</span>
                        </button>
                        <button 
                          className="btn btn-outline-light" 
                          onClick={() => handleSubmit(true)}
                        >
                          <em className="icon ni ni-save mr-1"></em>
                          <span>Save Draft</span>
                        </button>
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
