import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Timesheet.css';

const TimesheetSubmit = () => {
  const { subdomain, weekId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Form state
  const [week, setWeek] = useState('');
  const [sowId, setSowId] = useState('');
  const [hours, setHours] = useState(Array(7).fill(0));
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  
  // Mock data
  const [sowData, setSowData] = useState([]);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      setIsMobile(/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()));
    };
    
    checkMobile();
    
    // Load timesheet data if weekId is provided
    const loadTimesheetData = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock SOW data
        const mockSowData = [
          { 
            id: '1', 
            project: 'Web Development', 
            client: 'JPMC', 
            startDate: '2025-01-01', 
            endDate: '2025-12-31',
            hourlyRate: 125
          },
          { 
            id: '2', 
            project: 'Mobile App', 
            client: 'IBM', 
            startDate: '2025-03-01', 
            endDate: '2025-09-30',
            hourlyRate: 150
          },
          { 
            id: '3', 
            project: 'UI/UX Design', 
            client: 'Accenture', 
            startDate: '2025-02-15', 
            endDate: '2025-08-15',
            hourlyRate: 110
          }
        ];
        
        setSowData(mockSowData);
        setSowId(mockSowData[0]?.id || '');
        
        // If weekId is provided, load existing timesheet data
        if (weekId) {
          // Mock timesheet data for the given week
          // In a real app, fetch from API
          const mockTimesheet = {
            week: 'Jul 10, 2025',
            sowId: '1',
            hours: [8, 8, 8, 8, 8, 0, 0],
            notes: 'Worked on feature implementation',
            attachments: []
          };
          
          setWeek(mockTimesheet.week);
          setSowId(mockTimesheet.sowId);
          setHours(mockTimesheet.hours);
          setNotes(mockTimesheet.notes);
        } else {
          // Set current week
          const today = new Date();
          const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Calculate days until Monday
          const monday = new Date(today);
          monday.setDate(today.getDate() + mondayOffset);
          
          const options = { month: 'short', day: 'numeric', year: 'numeric' };
          setWeek(monday.toLocaleDateString('en-US', options));
        }
      } catch (error) {
        console.error('Error loading timesheet data:', error);
        setError('Failed to load timesheet data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadTimesheetData();
  }, [weekId]);
  
  const handleHourChange = (index, value) => {
    const newHours = [...hours];
    newHours[index] = value === '' ? 0 : Math.min(24, Math.max(0, parseFloat(value)));
    setHours(newHours);
  };
  
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };
  
  const handleCameraCapture = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
    setShowCamera(false);
  };
  
  const handleFiles = (files) => {
    // Check file size and type
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/heic', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB max
      
      if (!isValidType) {
        setError('Invalid file type. Please upload images (JPG, PNG, HEIC) or documents (PDF, DOC, DOCX).');
        return false;
      }
      
      if (!isValidSize) {
        setError('File too large. Maximum size is 10MB.');
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    // Clear error if any
    setError('');
    
    // Add files to attachments
    setAttachments(prev => [...prev, ...validFiles]);
    
    // Generate previews for images
    validFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewImages(prev => [...prev, { file: file.name, url: e.target.result }]);
        };
        reader.readAsDataURL(file);
      } else {
        // For non-image files, use a generic icon
        setPreviewImages(prev => [...prev, { file: file.name, url: null, type: file.type }]);
      }
    });
  };
  
  const removeAttachment = (index) => {
    const newAttachments = [...attachments];
    const newPreviews = [...previewImages];
    
    newAttachments.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setAttachments(newAttachments);
    setPreviewImages(newPreviews);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!sowId) {
      setError('Please select a Statement of Work');
      return;
    }
    
    const totalHours = hours.reduce((sum, hour) => sum + hour, 0);
    if (totalHours === 0) {
      setError('Please enter at least one hour');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('week', week);
      formData.append('sowId', sowId);
      formData.append('hours', JSON.stringify(hours));
      formData.append('notes', notes);
      
      attachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
      });
      
      // In a real app, send formData to API
      console.log('Submitting timesheet:', {
        week,
        sowId,
        hours,
        totalHours,
        notes,
        attachments: attachments.map(file => file.name)
      });
      
      setSuccess('Timesheet submitted successfully!');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate(`/${subdomain}/dashboard`);
      }, 2000);
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      setError('Failed to submit timesheet. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleSaveDraft = async () => {
    setSubmitting(true);
    setError('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, send data to API
      console.log('Saving draft:', {
        week,
        sowId,
        hours,
        notes,
        attachments: attachments.map(file => file.name)
      });
      
      setSuccess('Draft saved successfully!');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate(`/${subdomain}/dashboard`);
      }, 2000);
    } catch (error) {
      console.error('Error saving draft:', error);
      setError('Failed to save draft. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return 'ni-img';
    if (type.includes('pdf')) return 'ni-file-pdf';
    if (type.includes('word') || type.includes('doc')) return 'ni-file-doc';
    return 'ni-file';
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
                  <p className="mt-3">Loading timesheet form...</p>
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
                  <h3 className="nk-block-title page-title">Submit Timesheet</h3>
                  <div className="nk-block-des text-soft">
                    <p>Enter your hours for the week of {week}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="nk-block">
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
              
              <div className="card card-bordered">
                <div className="card-inner">
                  <form onSubmit={handleSubmit}>
                    <div className="form-group mb-4">
                      <label className="form-label">Week</label>
                      <div className="form-control-wrap">
                        <input 
                          type="text" 
                          className="form-control" 
                          value={week} 
                          readOnly 
                        />
                      </div>
                    </div>
                    
                    <div className="form-group mb-4">
                      <label className="form-label">Select Statement of Work (SOW)</label>
                      <div className="form-control-wrap">
                        <select 
                          className="form-select" 
                          value={sowId}
                          onChange={(e) => setSowId(e.target.value)}
                          required
                        >
                          <option value="">Select SOW</option>
                          {sowData.map(sow => (
                            <option key={sow.id} value={sow.id}>
                              {sow.project} - {sow.client} (${sow.hourlyRate}/hr)
                            </option>
                          ))}
                        </select>
                      </div>
                      {sowId && (
                        <div className="form-note">
                          Selected SOW: {sowData.find(sow => sow.id === sowId)?.project || "None"}
                        </div>
                      )}
                    </div>
                    
                    <div className="form-group mb-4">
                      <label className="form-label">Hours</label>
                      <div className="timesheet-grid">
                        {days.map((day, index) => (
                          <div key={index} className="timesheet-day">
                            <label htmlFor={`day-${index}`}>{day}</label>
                            <input
                              id={`day-${index}`}
                              type="number"
                              min="0"
                              max="24"
                              step="0.5"
                              value={hours[index] || ""}
                              onChange={(e) => handleHourChange(index, e.target.value)}
                              className="form-control"
                            />
                          </div>
                        ))}
                        <div className="timesheet-total">
                          <label>Total</label>
                          <div className="form-control-plaintext fw-bold">
                            {hours.reduce((sum, hour) => sum + hour, 0).toFixed(1)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="form-group mb-4">
                      <label className="form-label">Notes</label>
                      <div className="form-control-wrap">
                        <textarea 
                          className="form-control" 
                          rows="3"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add any notes or comments about this timesheet"
                        ></textarea>
                      </div>
                    </div>
                    
                    <div className="form-group mb-4">
                      <label className="form-label">Attachments</label>
                      <div 
                        className="upload-zone" 
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="dz-message">
                          <span className="dz-message-text">Drag and drop files here or click to browse</span>
                          <span className="dz-message-or">or</span>
                          <input 
                            ref={fileInputRef}
                            type="file" 
                            multiple 
                            className="d-none"
                            onChange={handleFileUpload}
                            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          />
                          {isMobile && (
                            <>
                              <button 
                                type="button" 
                                className="btn btn-primary mt-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowCamera(true);
                                  setTimeout(() => {
                                    cameraInputRef.current?.click();
                                  }, 100);
                                }}
                              >
                                <em className="icon ni ni-camera"></em>
                                <span>Take Photo</span>
                              </button>
                              {showCamera && (
                                <input 
                                  ref={cameraInputRef}
                                  type="file" 
                                  className="d-none"
                                  onChange={handleCameraCapture}
                                  accept="image/*"
                                  capture="environment"
                                />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      
                      {previewImages.length > 0 && (
                        <div className="attached-files mt-3">
                          <h6 className="title mb-2">Attached Files</h6>
                          <div className="row g-3">
                            {previewImages.map((preview, index) => (
                              <div key={index} className="col-6 col-sm-4 col-md-3 col-lg-2">
                                <div className="attached-file">
                                  {preview.url ? (
                                    <div className="attached-file-image">
                                      <img src={preview.url} alt={preview.file} />
                                    </div>
                                  ) : (
                                    <div className="attached-file-icon">
                                      <em className={`icon ni ${getFileIcon(preview.type)}`}></em>
                                    </div>
                                  )}
                                  <div className="attached-file-info">
                                    <span className="attached-file-name">{preview.file.length > 15 ? preview.file.substring(0, 12) + '...' : preview.file}</span>
                                    <button 
                                      type="button" 
                                      className="btn btn-sm btn-icon btn-trigger attached-file-remove" 
                                      onClick={() => removeAttachment(index)}
                                    >
                                      <em className="icon ni ni-cross"></em>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="form-group mt-5">
                      <div className="d-flex justify-content-between">
                        <button 
                          type="button" 
                          className="btn btn-dim btn-outline-primary"
                          onClick={handleSaveDraft}
                          disabled={submitting}
                        >
                          {submitting ? 'Saving...' : 'Save as Draft'}
                        </button>
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
                          ) : 'Submit Timesheet'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimesheetSubmit;
