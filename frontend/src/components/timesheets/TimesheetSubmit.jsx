import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Timesheet.css';

const TimesheetSubmit = () => {
  const { subdomain, weekId } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isEmployee } = useAuth();
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
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [clientHours, setClientHours] = useState([]);
  const [holidayHours, setHolidayHours] = useState({
    holiday: Array(7).fill(0),
    timeOff: Array(7).fill(0)
  });
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  
  // AI Processing state
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiProcessedData, setAiProcessedData] = useState(null);
  const [showAiUpload, setShowAiUpload] = useState(false);
  
  // Employee selection for non-employee roles
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [availableEmployees, setAvailableEmployees] = useState([]);
  
  // External timesheet file state (for external clients)
  const [externalTimesheetFile, setExternalTimesheetFile] = useState(null);
  
  // Function to determine current client type based on clients with hours
  const getCurrentClientType = () => {
    const clientsWithHours = clientHours.filter(client => 
      client.hours.some(hour => hour > 0)
    );
    
    if (clientsWithHours.length === 0) {
      // Default to internal if no hours entered yet
      return 'internal';
    }
    
    // Check if any client with hours is external
    const hasExternalClient = clientsWithHours.some(client => client.clientType === 'external');
    
    if (hasExternalClient) {
      return 'external';
    }
    
    return 'internal';
  };
  
  const clientType = getCurrentClientType();
  
  // Mock data removed - using clientHours state instead
  
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
        
        // Mock client data with multiple clients and their types
        const mockClientData = [
          { 
            id: '1', 
            clientName: 'JPMC', 
            project: 'Web Development',
            hourlyRate: 125,
            clientType: 'internal',
            hours: Array(7).fill(0)
          },
          { 
            id: '2', 
            clientName: 'IBM', 
            project: 'Mobile App',
            hourlyRate: 150,
            clientType: 'external',
            hours: Array(7).fill(0)
          },
          { 
            id: '3', 
            clientName: 'Accenture', 
            project: 'UI/UX Design',
            hourlyRate: 110,
            clientType: 'internal',
            hours: Array(7).fill(0)
          }
        ];
        
        setClientHours(mockClientData);
        
        // Load available employees for non-employee roles
        if (!isEmployee()) {
          const mockEmployees = [
            { id: '1', name: 'John Doe', email: 'john.doe@company.com', department: 'Engineering' },
            { id: '2', name: 'Jane Smith', email: 'jane.smith@company.com', department: 'Design' },
            { id: '3', name: 'Mike Johnson', email: 'mike.johnson@company.com', department: 'Marketing' },
            { id: '4', name: 'Sarah Wilson', email: 'sarah.wilson@company.com', department: 'Engineering' },
            { id: '5', name: 'David Brown', email: 'david.brown@company.com', department: 'Sales' }
          ];
          setAvailableEmployees(mockEmployees);
        }
        
        // Generate available weeks dynamically
        const generateAvailableWeeks = () => {
          const weeks = [];
          const today = new Date();
          
          // Generate weeks from 8 weeks ago to 4 weeks in the future
          for (let i = -8; i <= 4; i++) {
            const weekStart = new Date(today);
            const dayOfWeek = today.getDay();
            const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            weekStart.setDate(today.getDate() + mondayOffset + (i * 7));
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            
            const formatDate = (date) => {
              const day = String(date.getDate()).padStart(2, '0');
              const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
              const year = date.getFullYear();
              return `${day}-${month}-${year}`;
            };
            
            const weekValue = `${formatDate(weekStart)} To ${formatDate(weekEnd)}`;
            
            // Mark older weeks as completed (for demo purposes, weeks older than 4 weeks)
            const isOld = i < -4;
            const status = isOld ? 'completed' : 'pending';
            const readonly = isOld;
            
            weeks.push({
              value: weekValue,
              label: weekValue,
              status,
              readonly
            });
          }
          
          return weeks.reverse(); // Most recent first
        };
        
        const mockAvailableWeeks = generateAvailableWeeks();
        
        setAvailableWeeks(mockAvailableWeeks);
        
        // If weekId is provided, load existing timesheet data
        if (weekId) {
          // Mock timesheet data for the given week
          // In a real app, fetch from API
          const mockTimesheet = {
            week: '07-JUL-2025 To 13-JUL-2025',
            clientHours: [
              { id: '1', clientName: 'JPMC', project: 'Web Development', hourlyRate: 125, hours: [8, 8, 8, 8, 8, 0, 0] },
              { id: '2', clientName: 'IBM', project: 'Mobile App', hourlyRate: 150, hours: [0, 0, 0, 0, 0, 0, 0] },
              { id: '3', clientName: 'Accenture', project: 'UI/UX Design', hourlyRate: 110, hours: [0, 0, 0, 0, 0, 0, 0] }
            ],
            holidayHours: {
              holiday: [0, 0, 0, 0, 0, 0, 0],
              timeOff: [0, 0, 0, 0, 0, 0, 0]
            },
            notes: 'Worked on feature implementation',
            attachments: []
          };
          
          setWeek(mockTimesheet.week);
          setSelectedWeek(mockTimesheet.week);
          setClientHours(mockTimesheet.clientHours);
          setHolidayHours(mockTimesheet.holidayHours);
          setNotes(mockTimesheet.notes);
          
          // Check if this week is read-only (completed with invoice raised)
          const selectedWeekData = mockAvailableWeeks.find(w => w.value === mockTimesheet.week);
          if (selectedWeekData && selectedWeekData.readonly) {
            setIsReadOnly(true);
          }
        } else {
          // Find and set current week from available weeks
          const currentWeek = mockAvailableWeeks.find(week => {
            // Find the week that contains today's date
            const today = new Date();
            const [startStr, endStr] = week.value.split(' To ');
            
            // Parse start date
            const startParts = startStr.split('-');
            const startDate = new Date(
              parseInt(startParts[2]), // year
              new Date(Date.parse(startParts[1] + ' 1, 2000')).getMonth(), // month
              parseInt(startParts[0]) // day
            );
            
            // Parse end date
            const endParts = endStr.split('-');
            const endDate = new Date(
              parseInt(endParts[2]), // year
              new Date(Date.parse(endParts[1] + ' 1, 2000')).getMonth(), // month
              parseInt(endParts[0]) // day
            );
            
            return today >= startDate && today <= endDate;
          });
          
          if (currentWeek) {
            setWeek(currentWeek.value);
            setSelectedWeek(currentWeek.value);
          } else {
            // Fallback to first available week if current week not found
            const firstWeek = mockAvailableWeeks[0];
            if (firstWeek) {
              setWeek(firstWeek.value);
              setSelectedWeek(firstWeek.value);
            }
          }
        }
      } catch (error) {
        console.error('Error loading timesheet data:', error);
        setError('Failed to load timesheet data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadTimesheetData();
  }, [weekId, isEmployee]);
  
  const handleWeekChange = (selectedWeekValue) => {
    setSelectedWeek(selectedWeekValue);
    setWeek(selectedWeekValue);
    
    // Check if selected week is read-only
    const selectedWeekData = availableWeeks.find(w => w.value === selectedWeekValue);
    if (selectedWeekData && selectedWeekData.readonly) {
      setIsReadOnly(true);
      // Load existing timesheet data for read-only view
      // In a real app, this would fetch from API
    } else {
      setIsReadOnly(false);
      // Reset form for new timesheet
      setClientHours(clientHours.map(client => ({
        ...client,
        hours: Array(7).fill(0)
      })));
      setHolidayHours({
        holiday: Array(7).fill(0),
        timeOff: Array(7).fill(0)
      });
      setNotes('');
    }
  };
  
  const handleClientHourChange = (clientIndex, dayIndex, value) => {
    const newClientHours = [...clientHours];
    newClientHours[clientIndex].hours[dayIndex] = value === '' ? 0 : Math.min(24, Math.max(0, parseFloat(value)));
    setClientHours(newClientHours);
  };

  const handleHolidayHourChange = (type, dayIndex, value) => {
    const newHolidayHours = { ...holidayHours };
    newHolidayHours[type] = [...newHolidayHours[type]];
    newHolidayHours[type][dayIndex] = value === '' ? 0 : Math.min(24, Math.max(0, parseFloat(value)));
    setHolidayHours(newHolidayHours);
  };

  const getTotalHoursForDay = (dayIndex) => {
    const clientTotal = clientHours.reduce((sum, client) => sum + (client.hours[dayIndex] || 0), 0);
    const holidayTotal = (holidayHours.holiday[dayIndex] || 0) + (holidayHours.timeOff[dayIndex] || 0);
    return clientTotal + holidayTotal;
  };

  const getTotalHoursForClient = (clientIndex) => {
    return clientHours[clientIndex]?.hours.reduce((sum, hours) => sum + (hours || 0), 0) || 0;
  };

  const getGrandTotal = () => {
    const clientTotal = clientHours.reduce((sum, client) => 
      sum + client.hours.reduce((clientSum, hours) => clientSum + (hours || 0), 0), 0
    );
    const holidayTotal = holidayHours.holiday.reduce((sum, hours) => sum + (hours || 0), 0) +
                        holidayHours.timeOff.reduce((sum, hours) => sum + (hours || 0), 0);
    return clientTotal + holidayTotal;
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
    
    // Validate based on client type
    if (clientType === 'internal') {
      // For internal clients, validate hours entry
      const totalClientHours = getGrandTotal();
      if (totalClientHours === 0) {
        setError('Please enter at least one hour for any client or holiday/time off');
        return;
      }
    } else {
      // For external clients, validate file upload
      if (!externalTimesheetFile) {
        setError('Please upload the client submitted timesheet file');
        return;
      }
    }
    
    // Validate employee selection for non-employee roles
    if (!isEmployee() && !selectedEmployee) {
      setError('Please select an employee before submitting');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('week', selectedWeek);
      formData.append('clientType', clientType);
      
      if (!isEmployee()) {
        formData.append('employeeId', selectedEmployee);
      }
      
      if (clientType === 'internal') {
        // Internal client data
        formData.append('clientHours', JSON.stringify(clientHours));
        formData.append('holidayHours', JSON.stringify(holidayHours));
        formData.append('notes', notes);
        
        attachments.forEach((file, index) => {
          formData.append(`attachment_${index}`, file);
        });
      } else {
        // External client data
        formData.append('externalTimesheetFile', externalTimesheetFile);
        formData.append('notes', notes);
      }
      
      // In a real app, send formData to API
      const submissionData = {
        week: selectedWeek,
        clientType,
        employeeId: !isEmployee() ? selectedEmployee : 'current-user',
        ...(clientType === 'internal' ? {
          clientHours,
          holidayHours,
          totalHours: getGrandTotal(),
          attachments: attachments.map(file => file.name)
        } : {
          externalTimesheetFile: externalTimesheetFile.name
        }),
        notes
      };
      
      console.log('Submitting timesheet:', submissionData);
    
    // Simulate sending email notification to approver
    const employeeName = !isEmployee() ? 
      `${selectedEmployee.split(' - ')[0]}` : 
      'Current User';
    
    // Get approver info from mock data
    const mockApproverData = {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      department: 'Management'
    };
    
    // Simulate email notification to approver
    const emailNotification = {
      to: mockApproverData.email,
      subject: `Timesheet Approval Required - ${employeeName} - Week ${selectedWeek}`,
      body: `
        Dear ${mockApproverData.name},
        
        A new timesheet has been submitted and requires your approval:
        
        Employee: ${employeeName}
        Week: ${selectedWeek}
        Client Type: ${clientType === 'internal' ? 'Internal' : 'External'}
        Total Hours: ${clientType === 'internal' ? getGrandTotal() : 'N/A (External)'}
        
        Please review and approve/reject this timesheet at your earliest convenience.
        
        You can access the approval page here: ${window.location.origin}/${subdomain}/timesheets/approval
        
        Thank you,
        TimePulse System
      `
    };
    
    console.log('Email notification sent to approver:', emailNotification);
    
    // Update timesheet status to 'Submitted for Approval'
    submissionData.status = 'Submitted for Approval';
    submissionData.submittedDate = new Date().toISOString().split('T')[0];
    submissionData.approver = mockApproverData.name;
    
    console.log('Updated timesheet with approval status:', submissionData);
    
    setSuccess(`${clientType === 'internal' ? 'Internal' : 'External'} client timesheet submitted successfully! An approval request has been sent to ${mockApproverData.name}.`);
    
    // Redirect after a short delay
    setTimeout(() => {
      navigate(`/${subdomain}/timesheets`);
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
        clientHours,
        holidayHours,
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
  
  // AI Processing Functions
  const handleAiFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Check if employee is selected for non-employee roles
    if (!isEmployee() && !selectedEmployee) {
      alert('Please select an employee first before uploading their timesheet.');
      e.target.value = ''; // Reset file input
      return;
    }
    
    const file = files[0];
    
    // Validate file type
    const validTypes = [
      'image/jpeg', 'image/png', 'image/heic', 'image/webp',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid file format: Image (JPG, PNG, HEIC), PDF, Excel, or CSV');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    
    setError('');
    setAiProcessing(true);
    
    try {
      // Simulate AI processing
      await processTimesheetWithAI(file);
    } catch (error) {
      console.error('AI processing error:', error);
      setError('Failed to process timesheet with AI. Please try again.');
    } finally {
      setAiProcessing(false);
    }
  };
  
  const processTimesheetWithAI = async (file) => {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock AI extracted data - in real implementation, this would call your AI service
    const mockExtractedData = {
      week: selectedWeek || availableWeeks[0]?.value || '14-JUL-2025 To 20-JUL-2025',
      clientHours: [
        { 
          id: '1', 
          clientName: 'JPMC', 
          project: 'Web Development',
          hourlyRate: 125,
          hours: [8, 8, 7.5, 8, 8, 0, 0] // Mock extracted hours
        },
        { 
          id: '2', 
          clientName: 'IBM', 
          project: 'Mobile App',
          hourlyRate: 150,
          hours: [0, 0, 0.5, 0, 0, 4, 0] // Mock extracted hours
        },
        { 
          id: '3', 
          clientName: 'Accenture', 
          project: 'UI/UX Design',
          hourlyRate: 110,
          hours: [0, 0, 0, 0, 0, 0, 0]
        }
      ],
      holidayHours: {
        holiday: [0, 0, 0, 0, 0, 0, 0],
        timeOff: [0, 0, 0, 0, 0, 0, 8] // Mock extracted time off
      },
      notes: 'Timesheet extracted from uploaded file using AI processing',
      confidence: 0.95 // AI confidence score
    };
    
    setAiProcessedData(mockExtractedData);
    setSuccess('AI processing completed! Review the extracted data below.');
  };
  
  const applyAiProcessedData = () => {
    if (!aiProcessedData) return;
    
    // Apply the AI processed data to the form
    setWeek(aiProcessedData.week);
    setSelectedWeek(aiProcessedData.week);
    setClientHours(aiProcessedData.clientHours);
    setHolidayHours(aiProcessedData.holidayHours);
    setNotes(aiProcessedData.notes);
    
    // Clear AI processed data and hide upload section
    setAiProcessedData(null);
    setShowAiUpload(false);
    setSuccess('AI extracted data has been applied to your timesheet. Please review and submit.');
  };
  
  const discardAiProcessedData = () => {
    setAiProcessedData(null);
    setShowAiUpload(false);
    setSuccess('');
  };
  
  const handleExternalTimesheetUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/heic',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid file (Image, PDF, or Word document)');
      return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    
    setExternalTimesheetFile(file);
    setError('');
    setSuccess(`External timesheet file "${file.name}" uploaded successfully`);
  };
  
  const removeExternalTimesheetFile = () => {
    setExternalTimesheetFile(null);
    setSuccess('');
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
                    {/* Employee Selection for Non-Employee Roles */}
                    {!isEmployee() && (
                      <div className="form-group mb-4">
                        <label className="form-label">
                          <em className="icon ni ni-user text-primary me-2"></em>
                          Select Employee
                        </label>
                        <div className="form-control-wrap">
                          <select 
                            className="form-select" 
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            disabled={isReadOnly}
                            required
                          >
                            <option value="">Choose an employee...</option>
                            {availableEmployees.map((employee) => (
                              <option key={employee.id} value={employee.id}>
                                {employee.name} - {employee.department} ({employee.email})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-note mt-2">
                          <small className="text-soft">
                            {isAdmin() ? 'As an admin, you can manage timesheets for any employee.' : 
                             'Select the employee whose timesheet you want to manage.'}
                          </small>
                        </div>
                      </div>
                    )}
                    
                    <div className="form-group mb-4">
                      <label className="form-label">Select Week</label>
                      <div className="form-control-wrap">
                        <select 
                          className="form-select" 
                          value={selectedWeek}
                          onChange={(e) => handleWeekChange(e.target.value)}
                          disabled={isReadOnly}
                        >
                          <option value="">Select a week...</option>
                          {availableWeeks.map((week) => (
                            <option key={week.value} value={week.value}>
                              {week.label}{week.readonly ? ' (Read Only - Invoice Raised)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      {isReadOnly && (
                        <div className="form-note text-warning mt-2">
                          <em className="icon ni ni-info"></em>
                          This timesheet is read-only because the invoice has been raised.
                        </div>
                      )}
                    </div>
                  
                  {/* External Client File Upload */}
                  {clientType === 'external' && (
                    <div className="form-group mb-4">
                      <div className="card card-bordered">
                        <div className="card-inner">
                          <h6 className="card-title mb-3">
                            <em className="icon ni ni-upload text-primary me-2"></em>
                            Upload Client Submitted Timesheet
                          </h6>
                          <div className="form-note mb-3">
                            <small className="text-soft">
                              Upload the timesheet file submitted by the external client (Image, PDF, or Word document)
                            </small>
                          </div>
                            
                            {!externalTimesheetFile ? (
                              <div className="upload-zone" onClick={() => document.getElementById('external-file-input').click()}>
                                <div className="dz-message">
                                  <span className="dz-message-icon">
                                    <em className="icon ni ni-upload"></em>
                                  </span>
                                  <span className="dz-message-text">
                                    <strong>Click to upload</strong> or drag and drop
                                  </span>
                                  <span className="dz-message-hint">
                                    Supported formats: JPG, PNG, PDF, DOC, DOCX (Max 10MB)
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="uploaded-file-preview">
                                <div className="d-flex align-items-center justify-content-between p-3 border rounded">
                                  <div className="d-flex align-items-center">
                                    <em className="icon ni ni-file text-primary me-2"></em>
                                    <div>
                                      <div className="fw-bold">{externalTimesheetFile.name}</div>
                                      <small className="text-muted">
                                        {(externalTimesheetFile.size / 1024 / 1024).toFixed(2)} MB
                                      </small>
                                    </div>
                                  </div>
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={removeExternalTimesheetFile}
                                    disabled={isReadOnly}
                                  >
                                    <em className="icon ni ni-trash"></em>
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            <input 
                              type="file"
                              id="external-file-input"
                              className="d-none"
                              accept=".jpg,.jpeg,.png,.heic,.pdf,.doc,.docx"
                              onChange={handleExternalTimesheetUpload}
                              disabled={isReadOnly}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* AI-Powered Timesheet Upload Section - Only for Internal Clients */}
                    {clientType === 'internal' && (
                      <div className="form-group mb-4">
                        <div className="card card-bordered">
                          <div className="card-inner">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h6 className="card-title mb-0">
                                <em className="icon ni ni-cpu text-primary me-2"></em>
                                AI-Powered Timesheet Upload
                              </h6>
                              <button 
                                type="button" 
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => setShowAiUpload(!showAiUpload)}
                                disabled={isReadOnly}
                              >
                                {showAiUpload ? 'Hide' : 'Upload & Extract'}
                              </button>
                            </div>
                          
                          <p className="text-soft mb-3">
                            Upload {!isEmployee() && selectedEmployee ? 
                              `${availableEmployees.find(emp => emp.id === selectedEmployee)?.name}'s` : 
                              'your'
                            } timesheet in any format (image, Excel, PDF, CSV) and let our AI engine automatically extract and populate the timesheet data.
                          </p>
                          
                          {!isEmployee() && !selectedEmployee && (
                            <div className="alert alert-warning mb-3">
                              <em className="icon ni ni-alert-circle me-2"></em>
                              Please select an employee first before uploading their timesheet.
                            </div>
                          )}
                          
                          {showAiUpload && (
                            <div className="ai-upload-section">
                              <div className="form-group">
                                <div className="form-control-wrap">
                                  <div className="form-file">
                                    <input 
                                      type="file" 
                                      className="form-file-input" 
                                      id="aiFileUpload"
                                      accept=".jpg,.jpeg,.png,.heic,.webp,.pdf,.xlsx,.xls,.csv"
                                      onChange={handleAiFileUpload}
                                      disabled={aiProcessing || isReadOnly || (!isEmployee() && !selectedEmployee)}
                                    />
                                    <label className="form-file-label" htmlFor="aiFileUpload">
                                      {aiProcessing ? (
                                        <>
                                          <span className="spinner-border spinner-border-sm me-2"></span>
                                          Processing with AI...
                                        </>
                                      ) : (
                                        'Choose file or drag & drop'
                                      )}
                                    </label>
                                  </div>
                                </div>
                                <div className="form-note mt-2">
                                  <small className="text-soft">
                                    Supported formats: Images (JPG, PNG, HEIC), PDF, Excel (XLSX, XLS), CSV
                                  </small>
                                </div>
                              </div>
                              
                              {aiProcessing && (
                                <div className="alert alert-info mt-3">
                                  <div className="d-flex align-items-center">
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    <div>
                                      <strong>AI Processing in Progress...</strong>
                                      <br />
                                      <small>Analyzing your timesheet and extracting data. This may take a few moments.</small>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {aiProcessedData && (
                                <div className="alert alert-success mt-3">
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                      <h6 className="alert-heading">
                                        <em className="icon ni ni-check-circle me-1"></em>
                                        AI Extraction Complete!
                                      </h6>
                                      <p className="mb-2">
                                        Confidence Score: <strong>{Math.round(aiProcessedData.confidence * 100)}%</strong>
                                      </p>
                                      <p className="mb-0">
                                        <small>
                                          Extracted {aiProcessedData.clientHours.reduce((sum, client) => 
                                            sum + client.hours.reduce((clientSum, hours) => clientSum + hours, 0), 0
                                          )} total hours across {aiProcessedData.clientHours.filter(client => 
                                            client.hours.some(h => h > 0)
                                          ).length} clients.
                                        </small>
                                      </p>
                                    </div>
                                    <div className="d-flex gap-2">
                                      <button 
                                        type="button" 
                                        className="btn btn-sm btn-success"
                                        onClick={applyAiProcessedData}
                                      >
                                        Apply Data
                                      </button>
                                      <button 
                                        type="button" 
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={discardAiProcessedData}
                                      >
                                        Discard
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    )}
                    
                    {/* SOW and Timesheet Table - Only for Internal Clients */}
                    {clientType === 'internal' && (
                    <>
                    <div className="form-group mb-4">
                      <label className="form-label">Select Statement of Work (SOW)</label>
                      <div className="form-control-wrap">
                        <select className="form-select" disabled>
                          <option>Select SOW</option>
                          <option selected>✓ Web Development - JPMC{isAdmin() ? ' ($125/hr)' : ''}</option>
                          <option selected>✓ Mobile App - IBM{isAdmin() ? ' ($150/hr)' : ''}</option>
                          <option selected>✓ UI/UX Design - Accenture{isAdmin() ? ' ($110/hr)' : ''}</option>
                        </select>
                      </div>

                    </div>
                    
                    {/* Timesheet Table */}
                    <div className="form-group mb-4">
                      <div className="table-responsive">
                        <table className="table table-bordered timesheet-table">
                          <thead className="table-primary">
                            <tr>
                              <th style={{width: '80px'}}>Client ID</th>
                              <th style={{width: '200px'}}>Client Name</th>
                              <th style={{width: '60px'}}>SAT</th>
                              <th style={{width: '60px'}}>SUN</th>
                              <th style={{width: '60px'}}>MON</th>
                              <th style={{width: '60px'}}>TUE</th>
                              <th style={{width: '60px'}}>WED</th>
                              <th style={{width: '60px'}}>THU</th>
                              <th style={{width: '60px'}}>FRI</th>
                              <th style={{width: '80px'}}>Total Hours</th>
                              <th style={{width: '150px'}}>Comment</th>
                            </tr>
                          </thead>
                          <tbody>
                            {clientHours.map((client, clientIndex) => (
                              <tr key={client.id}>
                                <td className="text-center">{client.id}</td>
                                <td>{client.clientName}</td>
                                {client.hours.map((hour, dayIndex) => (
                                  <td key={dayIndex} className="text-center">
                                    <input 
                                      type="number" 
                                      className="form-control form-control-sm text-center" 
                                      style={{width: '50px', margin: '0 auto'}}
                                      value={hour || 0} 
                                      onChange={(e) => handleClientHourChange(clientIndex, dayIndex, e.target.value)}
                                      min="0" 
                                      max="24" 
                                      step="0.5"
                                      readOnly={isReadOnly}
                                      disabled={isReadOnly}
                                    />
                                  </td>
                                ))}
                                <td className="text-center fw-bold">
                                  {getTotalHoursForClient(clientIndex).toFixed(1)}
                                </td>
                                <td>
                                  <input 
                                    type="text" 
                                    className="form-control form-control-sm" 
                                    placeholder="Comment"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="table-light">
                            <tr>
                              <td colSpan="2" className="text-end fw-bold">Total Client Related Hours:</td>
                              {Array.from({length: 7}, (_, dayIndex) => (
                                <td key={dayIndex} className="text-center fw-bold">
                                  {clientHours.reduce((sum, client) => sum + (client.hours[dayIndex] || 0), 0).toFixed(1)}
                                </td>
                              ))}
                              <td className="text-center fw-bold">
                                {clientHours.reduce((sum, client) => 
                                  sum + client.hours.reduce((clientSum, hours) => clientSum + (hours || 0), 0), 0
                                ).toFixed(1)}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Holiday/Time off Section */}
                    <div className="form-group mb-4">
                      <h6 className="form-label">Holiday/Time off</h6>
                      <div className="table-responsive">
                        <table className="table table-bordered">
                          <tbody>
                            <tr>
                              <td style={{width: '200px'}}>Holiday (Public/National)</td>
                              {holidayHours.holiday.map((hour, dayIndex) => (
                                <td key={dayIndex} className="text-center" style={{width: '60px'}}>
                                  <input 
                                    type="number" 
                                    className="form-control form-control-sm text-center" 
                                    style={{width: '50px', margin: '0 auto'}}
                                    value={hour || 0}
                                    onChange={(e) => handleHolidayHourChange('holiday', dayIndex, e.target.value)}
                                    min="0" 
                                    max="24" 
                                    step="0.5"
                                    readOnly={isReadOnly}
                                    disabled={isReadOnly}
                                  />
                                </td>
                              ))}
                              <td className="text-center fw-bold" style={{width: '80px'}}>
                                {holidayHours.holiday.reduce((sum, hour) => sum + (hour || 0), 0).toFixed(1)}
                              </td>
                            </tr>
                            <tr>
                              <td>Time Off</td>
                              {holidayHours.timeOff.map((hour, dayIndex) => (
                                <td key={dayIndex} className="text-center">
                                  <input 
                                    type="number" 
                                    className="form-control form-control-sm text-center" 
                                    style={{width: '50px', margin: '0 auto'}}
                                    value={hour || 0}
                                    onChange={(e) => handleHolidayHourChange('timeOff', dayIndex, e.target.value)}
                                    min="0" 
                                    max="24" 
                                    step="0.5"
                                    readOnly={isReadOnly}
                                    disabled={isReadOnly}
                                  />
                                </td>
                              ))}
                              <td className="text-center fw-bold">
                                {holidayHours.timeOff.reduce((sum, hour) => sum + (hour || 0), 0).toFixed(1)}
                              </td>
                            </tr>
                          </tbody>
                          <tfoot className="table-light">
                            <tr>
                              <td className="text-end fw-bold">Total Personal Hours:</td>
                              {Array.from({length: 7}, (_, dayIndex) => (
                                <td key={dayIndex} className="text-center fw-bold">
                                  {((holidayHours.holiday[dayIndex] || 0) + (holidayHours.timeOff[dayIndex] || 0)).toFixed(1)}
                                </td>
                              ))}
                              <td className="text-center fw-bold">
                                {(holidayHours.holiday.reduce((sum, hour) => sum + (hour || 0), 0) + 
                                  holidayHours.timeOff.reduce((sum, hour) => sum + (hour || 0), 0)).toFixed(1)}
                              </td>
                            </tr>
                            <tr>
                              <td className="text-end fw-bold">Grand Total:</td>
                              {Array.from({length: 7}, (_, dayIndex) => (
                                <td key={dayIndex} className="text-center fw-bold">
                                  {getTotalHoursForDay(dayIndex).toFixed(1)}
                                </td>
                              ))}
                              <td className="text-center fw-bold">
                                {getGrandTotal().toFixed(1)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
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
                          readOnly={isReadOnly}
                          disabled={isReadOnly}
                        ></textarea>
                      </div>
                    </div>
                    
                    <div className="form-group mb-4">
                      <label className="form-label">Attachments</label>
                      <p className="form-note text-soft mb-2">Upload approved timesheet proof, work samples, or supporting documents</p>
                      <div 
                        className={`upload-zone ${isReadOnly ? 'disabled' : ''}`} 
                        onDragOver={!isReadOnly ? handleDragOver : undefined}
                        onDrop={!isReadOnly ? handleDrop : undefined}
                        onClick={!isReadOnly ? () => fileInputRef.current?.click() : undefined}
                        style={isReadOnly ? { pointerEvents: 'none', opacity: 0.6 } : {}}
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
                    
                    {/* Action Buttons */}
                    <div className="form-group mt-4">
                      <div className="d-flex gap-3 justify-content-center">
                        {!isReadOnly ? (
                          <>
                            <button 
                              type="button" 
                              className="btn btn-success"
                              onClick={handleSaveDraft}
                              disabled={submitting}
                            >
                              Save For Later
                            </button>
                            <button 
                              type="submit" 
                              className="btn btn-success"
                              disabled={submitting}
                            >
                              {submitting ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                  Submitting...
                                </>
                              ) : `Submit ${clientType === 'internal' ? 'Internal Client' : 'External Client'} Timesheet`}
                            </button>
                          </>
                        ) : (
                          <div className="alert alert-info text-center">
                            <em className="icon ni ni-info-fill"></em>
                            <strong>Read-Only View:</strong> This timesheet cannot be modified as the invoice has been raised.
                          </div>
                        )}
                        <button 
                          type="button" 
                          className="btn btn-success"
                          onClick={() => navigate(`/${subdomain}/timesheets`)}
                        >
                          Return to Timesheet Summary
                        </button>
                      </div>
                    </div>
                    </>
                    )}
                    
                    {/* Find My Approvers Section */}
                    <div className="text-center mt-4">
                      <button type="button" className="btn btn-link text-primary">
                        Find My Approvers
                      </button>
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
