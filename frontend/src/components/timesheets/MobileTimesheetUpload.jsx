import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const MobileTimesheetUpload = () => {
  const { subdomain } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // User info will be used for personalization and submission metadata
  const employeeName = user?.name || 'Employee';
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    weekEnding: '',
    hours: '',
    notes: '',
    files: []
  });
  const [errors, setErrors] = useState({});
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Get current date for default week ending
  const today = new Date();
  // Set to Friday of current week
  const fridayOffset = (5 - today.getDay() + 7) % 7;
  const defaultWeekEnding = new Date(today);
  defaultWeekEnding.setDate(today.getDate() + fridayOffset);
  
  // Format date as YYYY-MM-DD for input default
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    if (selectedFiles.length > 0) {
      // Create preview for the first file
      const firstFile = selectedFiles[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      
      reader.readAsDataURL(firstFile);
      
      setFormData({
        ...formData,
        files: [...formData.files, ...selectedFiles]
      });
      
      // Clear file error if it exists
      if (errors.files) {
        setErrors({
          ...errors,
          files: null
        });
      }
    }
  };

  const handleCameraCapture = () => {
    cameraInputRef.current.click();
  };

  const handleGallerySelect = () => {
    fileInputRef.current.click();
  };

  const removeFile = (index) => {
    const updatedFiles = [...formData.files];
    updatedFiles.splice(index, 1);
    
    setFormData({
      ...formData,
      files: updatedFiles
    });
    
    // Update preview if needed
    if (index === 0 && updatedFiles.length > 0) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(updatedFiles[0]);
    } else if (updatedFiles.length === 0) {
      setPreview(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.weekEnding) {
      newErrors.weekEnding = 'Week ending date is required';
    }
    
    if (!formData.hours) {
      newErrors.hours = 'Total hours is required';
    } else if (isNaN(formData.hours) || parseFloat(formData.hours) <= 0) {
      newErrors.hours = 'Hours must be a positive number';
    }
    
    if (formData.files.length === 0) {
      newErrors.files = 'At least one timesheet image is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real app, this would be an API call to upload the timesheet
      // For now, simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Submitting timesheet:', {
        employee: employeeName,
        weekEnding: formData.weekEnding,
        hours: formData.hours,
        notes: formData.notes,
        files: formData.files.map(file => file.name),
        submittedFrom: 'mobile'
      });
      
      setUploadSuccess(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        navigate(`/${subdomain}/dashboard`);
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      setErrors({
        ...errors,
        submit: 'Failed to submit timesheet. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nk-content">
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            <div className="nk-block-head nk-block-head-sm">
              <div className="nk-block-between">
                <div className="nk-block-head-content">
                  <h3 className="nk-block-title page-title">Upload Timesheet</h3>
                  <div className="nk-block-des text-soft">
                    <p>Hello {employeeName}, quickly submit your timesheet from your mobile device</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="nk-block">
              <div className="card card-bordered">
                <div className="card-inner">
                  {uploadSuccess ? (
                    <div className="alert alert-success">
                      <strong>Success!</strong> Your timesheet has been uploaded successfully.
                      <p>Redirecting to dashboard...</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="form-validate">
                      <div className="row g-gs">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label className="form-label" htmlFor="weekEnding">Week Ending</label>
                            <div className="form-control-wrap">
                              <input
                                type="date"
                                id="weekEnding"
                                name="weekEnding"
                                className={`form-control ${errors.weekEnding ? 'error' : ''}`}
                                value={formData.weekEnding || formatDate(defaultWeekEnding)}
                                onChange={handleChange}
                              />
                              {errors.weekEnding && (
                                <span className="invalid-feedback">{errors.weekEnding}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-md-6">
                          <div className="form-group">
                            <label className="form-label" htmlFor="hours">Total Hours</label>
                            <div className="form-control-wrap">
                              <input
                                type="number"
                                id="hours"
                                name="hours"
                                className={`form-control ${errors.hours ? 'error' : ''}`}
                                placeholder="40"
                                value={formData.hours}
                                onChange={handleChange}
                              />
                              {errors.hours && (
                                <span className="invalid-feedback">{errors.hours}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-12">
                          <div className="form-group">
                            <label className="form-label" htmlFor="notes">Notes (Optional)</label>
                            <div className="form-control-wrap">
                              <textarea
                                id="notes"
                                name="notes"
                                className="form-control"
                                placeholder="Any additional information"
                                value={formData.notes}
                                onChange={handleChange}
                                rows={3}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-12">
                          <div className="form-group">
                            <label className="form-label">Upload Timesheet Image</label>
                            <div className="form-control-wrap">
                              <div className="d-flex gap-2 mb-3">
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  onClick={handleCameraCapture}
                                >
                                  <em className="icon ni ni-camera"></em>
                                  <span>Take Photo</span>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-primary"
                                  onClick={handleGallerySelect}
                                >
                                  <em className="icon ni ni-img"></em>
                                  <span>Choose from Gallery</span>
                                </button>
                              </div>
                              
                              {/* Hidden file inputs */}
                              <input
                                type="file"
                                ref={cameraInputRef}
                                accept="image/*"
                                capture="environment"
                                onChange={handleFileChange}
                                className="d-none"
                              />
                              <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                                className="d-none"
                              />
                              
                              {errors.files && (
                                <div className="alert alert-danger">{errors.files}</div>
                              )}
                              
                              {/* Preview area */}
                              {preview && (
                                <div className="upload-preview mt-3">
                                  <img
                                    src={preview}
                                    alt="Timesheet preview"
                                    className="img-fluid"
                                    style={{ maxHeight: '300px', borderRadius: '4px' }}
                                  />
                                </div>
                              )}
                              
                              {/* File list */}
                              {formData.files.length > 0 && (
                                <div className="file-list mt-3">
                                  <h6 className="mb-2">Attached Files ({formData.files.length})</h6>
                                  <ul className="list-group">
                                    {formData.files.map((file, index) => (
                                      <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                        <div>
                                          <em className="icon ni ni-img me-2"></em>
                                          <span>{file.name}</span>
                                        </div>
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-icon btn-danger"
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
                        
                        {errors.submit && (
                          <div className="col-12">
                            <div className="alert alert-danger">{errors.submit}</div>
                          </div>
                        )}
                        
                        <div className="col-12">
                          <div className="form-group">
                            <button
                              type="submit"
                              className="btn btn-lg btn-primary w-100"
                              disabled={loading}
                            >
                              {loading ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                  Uploading...
                                </>
                              ) : 'Submit Timesheet'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileTimesheetUpload;
