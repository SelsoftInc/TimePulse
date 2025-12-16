'use client';

import { useRouter, useParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { 
  analyzeDocument, 
  uploadAndProcessTimesheet, 
  transformTimesheetToInvoice,
  checkEngineServiceHealth 
} from '@/services/engineService';
import './TimesheetToInvoice.css';

const TimesheetToInvoice = () => {
  const router = useRouter();
  const { subdomain } = useParams();
  
  // State management
  const [file, setFile] = useState(null);
  const [documentUrl, setDocumentUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [timesheetData, setTimesheetData] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [engineServiceAvailable, setEngineServiceAvailable] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  
  // Client information for invoice generation
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    address: '',
    hourlyRate: 100});

  // Check engine service availability on component mount
  useEffect(() => {
    checkEngineHealth();
  }, []);

  const checkEngineHealth = async () => {
    try {
      const isAvailable = await checkEngineServiceHealth();
      setEngineServiceAvailable(isAvailable);
      if (!isAvailable) {
        setError('Engine service is not available. Please ensure the engine server is running.');
      }
    } catch (error) {
      setEngineServiceAvailable(false);
      setError('Failed to connect to engine service.');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError('');
    setSuccess('');
    setTimesheetData(null);
    setInvoiceData(null);
  };

  const handleDocumentUrlChange = (e) => {
    setDocumentUrl(e.target.value);
    setError('');
    setSuccess('');
    setTimesheetData(null);
    setInvoiceData(null);
  };

  const handleClientInfoChange = (field, value) => {
    setClientInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const processTimesheetFile = async () => {
    if (!file && !documentUrl) {
      setError('Please select a file or provide a document URL.');
      return;
    }

    if (!engineServiceAvailable) {
      setError('Engine service is not available. Please check the service status.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');
    setProcessingStep('Uploading and analyzing timesheet...');

    try {
      let result;

      if (file) {
        // Process uploaded file
        setProcessingStep('Processing uploaded file...');
        result = await uploadAndProcessTimesheet(file);
      } else if (documentUrl) {
        // Process document from URL
        setProcessingStep('Analyzing document from URL...');
        result = await analyzeDocument(documentUrl);
      }

      setProcessingStep('Extracting timesheet data...');
      setTimesheetData(result);

      // Transform to invoice format
      setProcessingStep('Generating invoice data...');
      const invoice = transformTimesheetToInvoice(result, clientInfo);
      setInvoiceData(invoice);

      setSuccess('Timesheet processed successfully! Invoice data generated.');
      setProcessingStep('');
    } catch (error) {
      console.error('Error processing timesheet:', error);
      setError(error.message || 'Failed to process timesheet. Please try again.');
      setProcessingStep('');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateInvoice = () => {
    if (!invoiceData) {
      setError('No invoice data available. Please process a timesheet first.');
      return;
    }

    // Navigate to invoice creation with pre-filled data
    router.push(`/${subdomain}/invoices/create`, {
      state: { 
        invoiceData,
        fromTimesheet: true 
      }
    });
  };

  const resetForm = () => {
    setFile(null);
    setDocumentUrl('');
    setTimesheetData(null);
    setInvoiceData(null);
    setError('');
    setSuccess('');
    setProcessingStep('');
  };

  return (
    <div className="timesheet-to-invoice-container">
      <div className="nk-content-inner">
        <div className="nk-content-body">
          <div className="nk-block-head nk-block-head-sm">
            <div className="nk-block-between">
              <div className="nk-block-head-content">
                <h3 className="nk-block-title page-title">
                  Convert Timesheet to Invoice
                </h3>
                <div className="nk-block-des text-soft">
                  <p>Upload a timesheet document or provide a URL to automatically generate an invoice.</p>
                </div>
              </div>
              <div className="nk-block-head-content">
                <button 
                  className="btn btn-outline-light bg-white d-none d-sm-inline-flex"
                  onClick={() => router.push(`/${subdomain}/timesheets`)}
                >
                  <em className="icon ni ni-arrow-left"></em>
                  <span>Back to Timesheets</span>
                </button>
              </div>
            </div>
          </div>

          {/* Engine Service Status */}
          <div className="nk-block">
            <div className="card">
              <div className="card-inner">
                <div className="service-status">
                  <div className={`status-indicator ${engineServiceAvailable ? 'available' : 'unavailable'}`}>
                    <em className={`icon ni ${engineServiceAvailable ? 'ni-check-circle' : 'ni-alert-circle'}`}></em>
                    <span>
                      Engine Service: {engineServiceAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  {!engineServiceAvailable && (
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={checkEngineHealth}
                    >
                      <em className="icon ni ni-reload"></em>
                      Retry Connection
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="nk-block">
            <div className="card">
              <div className="card-inner">
                <h5 className="card-title">Upload Timesheet Document</h5>
                
                {/* File Upload */}
                <div className="form-group">
                  <label className="form-label">Upload File</label>
                  <div className="form-control-wrap">
                    <input
                      type="file"
                      className="form-control"
                      accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      disabled={isProcessing}
                    />
                  </div>
                  <div className="form-note">
                    Supported formats: PDF, DOCX, XLSX, PNG, JPG, JPEG
                  </div>
                </div>

                {/* OR Divider */}
                <div className="divider-text">OR</div>

                {/* Document URL */}
                <div className="form-group">
                  <label className="form-label">Document URL</label>
                  <div className="form-control-wrap">
                    <input
                      type="url"
                      className="form-control"
                      placeholder="https://example.com/timesheet.pdf"
                      value={documentUrl}
                      onChange={handleDocumentUrlChange}
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                {/* Client Information */}
                <div className="client-info-section">
                  <h6 className="title">Client Information (Optional)</h6>
                  <div className="row gy-3">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Client Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={clientInfo.name}
                          onChange={(e) => handleClientInfoChange('name', e.target.value)}
                          placeholder="Client name"
                          disabled={isProcessing}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Hourly Rate ($)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={clientInfo.hourlyRate}
                          onChange={(e) => handleClientInfoChange('hourlyRate', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          disabled={isProcessing}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Client Email</label>
                        <input
                          type="email"
                          className="form-control"
                          value={clientInfo.email}
                          onChange={(e) => handleClientInfoChange('email', e.target.value)}
                          placeholder="client@example.com"
                          disabled={isProcessing}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Client Address</label>
                        <textarea
                          className="form-control"
                          value={clientInfo.address}
                          onChange={(e) => handleClientInfoChange('address', e.target.value)}
                          placeholder="Client address"
                          rows="2"
                          disabled={isProcessing}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="form-group">
                  <button
                    className="btn btn-primary"
                    onClick={processTimesheetFile}
                    disabled={isProcessing || !engineServiceAvailable || (!file && !documentUrl)}
                  >
                    {isProcessing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <em className="icon ni ni-upload"></em>
                        Process Timesheet
                      </>
                    )}
                  </button>
                  
                  {(timesheetData || invoiceData) && (
                    <button
                      className="btn btn-outline-primary ms-2"
                      onClick={resetForm}
                      disabled={isProcessing}
                    >
                      <em className="icon ni ni-reload"></em>
                      Reset
                    </button>
                  )}
                </div>

                {/* Processing Status */}
                {processingStep && (
                  <div className="processing-status">
                    <div className="alert alert-info">
                      <div className="d-flex align-items-center">
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        {processingStep}
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="alert alert-danger">
                    <em className="icon ni ni-alert-circle"></em>
                    {error}
                  </div>
                )}

                {/* Success Display */}
                {success && (
                  <div className="alert alert-success">
                    <em className="icon ni ni-check-circle"></em>
                    {success}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timesheet Data Display */}
          {timesheetData && (
            <div className="nk-block">
              <div className="card">
                <div className="card-inner">
                  <h5 className="card-title">Extracted Timesheet Data</h5>
                  <div className="timesheet-data-display">
                    {timesheetData.results?.Entry?.map((entry, index) => (
                      <div key={index} className="timesheet-entry">
                        <div className="row gy-3">
                          <div className="col-md-6">
                            <div className="data-item">
                              <span className="data-label">Vendor Name:</span>
                              <span className="data-value">{entry.Vendor_Name || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="data-item">
                              <span className="data-label">Total Hours:</span>
                              <span className="data-value">{entry['Total Hours'] || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="data-item">
                              <span className="data-label">Duration:</span>
                              <span className="data-value">{entry.Duration || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="timesheet-entry">
                        <div className="row gy-3">
                          <div className="col-md-6">
                            <div className="data-item">
                              <span className="data-label">Vendor Name:</span>
                              <span className="data-value">{timesheetData['Vendor Name'] || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="data-item">
                              <span className="data-label">Total Hours:</span>
                              <span className="data-value">
                                {timesheetData['Total Hours']?.['Billable Project Hrs'] || 'N/A'}
                              </span>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="data-item">
                              <span className="data-label">Start Date:</span>
                              <span className="data-value">{timesheetData['Start Date'] || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="data-item">
                              <span className="data-label">End Date:</span>
                              <span className="data-value">{timesheetData['End Date'] || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {timesheetData.cost && (
                      <div className="processing-cost">
                        <small className="text-muted">Processing Cost: {timesheetData.cost}</small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Preview */}
          {invoiceData && (
            <div className="nk-block">
              <div className="card">
                <div className="card-inner">
                  <div className="card-title-group">
                    <h5 className="card-title">Generated Invoice Preview</h5>
                    <div className="card-tools">
                      <button
                        className="btn btn-primary"
                        onClick={generateInvoice}
                      >
                        <em className="icon ni ni-file-text"></em>
                        Create Invoice
                      </button>
                    </div>
                  </div>
                  
                  <div className="invoice-preview">
                    <div className="row gy-3">
                      <div className="col-md-6">
                        <div className="preview-item">
                          <span className="preview-label">Invoice Number:</span>
                          <span className="preview-value">{invoiceData.invoiceNumber}</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="preview-item">
                          <span className="preview-label">Client:</span>
                          <span className="preview-value">{invoiceData.clientName}</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="preview-item">
                          <span className="preview-label">Period:</span>
                          <span className="preview-value">
                            {invoiceData.periodStart} - {invoiceData.periodEnd}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="preview-item">
                          <span className="preview-label">Total Amount:</span>
                          <span className="preview-value amount">${invoiceData.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="line-items">
                      <h6 className="title">Line Items</h6>
                      {invoiceData.lineItems.map((item, index) => (
                        <div key={index} className="line-item">
                          <div className="item-description">{item.description}</div>
                          <div className="item-details">
                            {item.quantity} hours × ${item.rate}/hour = ${item.amount.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimesheetToInvoice;
