'use client';

import { useRouter, useParams } from 'next/navigation';
import React, { useState } from 'react';
import { uploadAndProcessTimesheet, transformTimesheetToInvoice } from '@/services/engineService';

const TimesheetAutoConvert = () => {
  const { subdomain } = useParams();
  const router = useRouter();
  
  // State for auto-conversion
  const [autoConvertToInvoice, setAutoConvertToInvoice] = useState(true);
  const [conversionProcessing, setConversionProcessing] = useState(false);
  const [conversionSuccess, setConversionSuccess] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);

  // Auto-conversion function
  const processTimesheetAndConvertToInvoice = async (file) => {
    setConversionProcessing(true);
    setError('');
    setConversionSuccess(false);
    
    try {
      // Step 1: Process timesheet with AI engine
      console.log('Processing timesheet with AI engine...');
      setSuccess('🔄 Processing timesheet with AI engine...');
      
      const engineResponse = await uploadAndProcessTimesheet(file);
      
      // Step 2: Transform to invoice format
      console.log('Converting to invoice format...');
      setSuccess('🔄 Converting to invoice format...');
      
      const clientInfo = {
        name: 'Sample Client',
        email: 'client@example.com',
        rate: 100
      };
      
      const invoiceData = transformTimesheetToInvoice(engineResponse, clientInfo);
      setInvoiceData(invoiceData);
      
      // Step 3: Show success and offer to navigate to invoice creation
      setConversionSuccess(true);
      setSuccess('✅ Timesheet processed successfully! Invoice data is ready.');
      
    } catch (error) {
      console.error('Error in auto-conversion:', error);
      setError(`❌ Auto-conversion failed: ${error.message}`);
    } finally {
      setConversionProcessing(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/heic',
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

    setUploadedFile(file);
    setError('');
    setSuccess(`File "${file.name}" uploaded successfully`);

    // Auto-convert if enabled
    if (autoConvertToInvoice) {
      await processTimesheetAndConvertToInvoice(file);
    }
  };

  const navigateToInvoiceCreation = () => {
    router.push(`/${subdomain}/invoices/create`, {
      state: { 
        timesheetData: invoiceData,
        sourceTimesheet: {
          file: uploadedFile?.name || 'uploaded-timesheet'
        }
      }
    });
  };

  return (
    <div className="nk-content">
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            <div className="nk-block-head nk-block-head-sm">
              <div className="nk-block-between">
                <div className="nk-block-head-content">
                  <h3 className="nk-block-title page-title">Timesheet Auto-Conversion Test</h3>
                  <div className="nk-block-des text-soft">
                    <p>Upload a timesheet image to test AI-powered conversion to invoice</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="nk-block">
              <div className="card">
                <div className="card-inner">
                  
                  {/* Auto-conversion toggle */}
                  <div className="form-group mb-4">
                    <div className="custom-control custom-switch">
                      <input 
                        type="checkbox" 
                        className="custom-control-input" 
                        id="autoConvertToggle"
                        checked={autoConvertToInvoice}
                        onChange={(e) => setAutoConvertToInvoice(e.target.checked)}
                      />
                      <label className="custom-control-label" htmlFor="autoConvertToggle">
                        🤖 Auto-convert timesheet to invoice using AI
                      </label>
                    </div>
                    <small className="form-note text-soft">
                      When enabled, uploaded timesheet images will be automatically processed and converted to invoice format
                    </small>
                  </div>

                  {/* File upload */}
                  <div className="form-group mb-4">
                    <label className="form-label">Upload Timesheet</label>
                    <div className="form-control-wrap">
                      <input 
                        type="file" 
                        className="form-control"
                        onChange={handleFileUpload}
                        accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      />
                    </div>
                  </div>

                  {/* Error display */}
                  {error && (
                    <div className="alert alert-danger">
                      {error}
                    </div>
                  )}

                  {/* Success display */}
                  {success && !error && (
                    <div className="alert alert-info">
                      {success}
                    </div>
                  )}

                  {/* Conversion status display */}
                  {conversionProcessing && (
                    <div className="alert alert-info">
                      <div className="d-flex align-items-center">
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Processing...</span>
                        </div>
                        <span>🔄 Processing timesheet with AI engine...</span>
                      </div>
                    </div>
                  )}

                  {/* Conversion success display */}
                  {conversionSuccess && invoiceData && (
                    <div className="alert alert-success">
                      <h6>✅ Conversion Successful!</h6>
                      <p className="mb-2">Your timesheet has been processed and converted to invoice format.</p>
                      <div className="d-flex gap-2">
                        <button 
                          type="button" 
                          className="btn btn-success btn-sm"
                          onClick={navigateToInvoiceCreation}
                        >
                          📄 Create Invoice Now
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => console.log('Invoice Data:', invoiceData)}
                        >
                          👁️ View Processed Data
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Back button */}
                  <div className="form-group mt-4">
                    <button 
                      type="button" 
                      className="btn btn-outline-primary"
                      onClick={() => router.push(`/${subdomain}/timesheets`)}
                    >
                      ← Back to Timesheets
                    </button>
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

export default TimesheetAutoConvert;
