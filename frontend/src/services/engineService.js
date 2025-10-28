import axios from 'axios';

// Engine API base URL - now using Node.js server
const ENGINE_API_BASE_URL = process.env.REACT_APP_ENGINE_API_URL || 'http://localhost:5001/api/engine';

// Create axios instance for engine API
const engineAPI = axios.create({
  baseURL: ENGINE_API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for document processing
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Analyze a document (timesheet) and extract structured data
 * @param {string} documentUrl - URL of the document to analyze
 * @returns {Promise} - Promise resolving to analyzed data
 */
export const analyzeDocument = async (documentUrl) => {
  try {
    const response = await engineAPI.get('/analyze-document', {
      headers: {
        'document-url': documentUrl,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error analyzing document:', error);
    throw new Error(
      error.response?.data?.detail || 
      'Failed to analyze document. Please check if the engine service is running.'
    );
  }
};

/**
 * Convert DOCX to PDF
 * @param {string} docxUrl - URL of the DOCX file to convert
 * @returns {Promise} - Promise resolving to PDF file
 */
export const convertDocxToPdf = async (docxUrl) => {
  try {
    const response = await engineAPI.post('/convert-docx-to-pdf', null, {
      headers: {
        'docx-url': docxUrl,
      },
      responseType: 'blob', // Important for file download
    });
    return response.data;
  } catch (error) {
    console.error('Error converting DOCX to PDF:', error);
    throw new Error(
      error.response?.data?.detail || 
      'Failed to convert document. Please check if the engine service is running.'
    );
  }
};

/**
 * Process document content directly (for already extracted text)
 * @param {string} documentContent - Text content of the document
 * @returns {Promise} - Promise resolving to processed data
 */
export const processDocumentContent = async (documentContent) => {
  try {
    const response = await engineAPI.post('/process-document', documentContent, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error processing document content:', error);
    throw new Error(
      error.response?.data?.detail || 
      'Failed to process document content. Please check if the engine service is running.'
    );
  }
};

/**
 * Extract timesheet data using the new Python engine (AWS Bedrock/Claude)
 * @param {File} file - File object to upload and extract
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise} - Promise resolving to extracted timesheet data
 */
export const extractTimesheetData = async (file, onProgress) => {
  try {
    console.log('🚀 Calling Python engine for timesheet extraction:', file.name);
    
    const formData = new FormData();
    formData.append('file', file);

    onProgress?.({ status: 'uploading', message: 'Uploading file to engine...', progress: 10 });

    const response = await axios.post(`${ENGINE_API_BASE_URL}/extract-timesheet`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes for AI processing
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress?.({ 
          status: 'uploading', 
          message: `Uploading... ${percentCompleted}%`, 
          progress: percentCompleted * 0.3 // Upload is 30% of total progress
        });
      }
    });

    onProgress?.({ status: 'processing', message: 'Processing with AI...', progress: 90 });

    console.log('✅ Python engine response:', response.data);

    // Transform the response to match the expected format
    if (response.data.success && response.data.data && response.data.data.length > 0) {
      const timesheetData = response.data.data[0]; // Get first employee's data
      
      // Transform to the format expected by TimesheetSubmit component
      const transformed = {
        success: true,
        clientName: timesheetData.client_name || timesheetData.employee_name || 'Unknown',
        employeeName: timesheetData.employee_name || timesheetData.client_name || 'Unknown',
        projectName: timesheetData.period || 'Project',
        totalHours: timesheetData.total_hours || 0,
        dailyHours: {},
        confidence: 0.95,
        source: 'python_engine',
        fileName: file.name,
        metadata: response.data.metadata
      };

      // Map week_hours to dailyHours format
      if (timesheetData.week_hours && Array.isArray(timesheetData.week_hours)) {
        timesheetData.week_hours.forEach(dayData => {
          const dayKey = dayData.day.toLowerCase();
          transformed.dailyHours[dayKey] = dayData.hours || 0;
        });
      }

      onProgress?.({ status: 'completed', message: 'Extraction completed!', progress: 100 });
      return transformed;
    }

    throw new Error('No timesheet data found in response');

  } catch (error) {
    console.error('❌ Error extracting timesheet data:', error);
    onProgress?.({ status: 'error', message: error.message, progress: 100 });
    throw new Error(
      error.response?.data?.message || 
      error.response?.data?.detail ||
      error.message ||
      'Failed to extract timesheet data. Please check if the engine is running.'
    );
  }
};

/**
 * Upload and process timesheet file using the Flask app endpoint (Legacy)
 * @param {File} file - File object to upload and process
 * @returns {Promise} - Promise resolving to extracted timesheet data
 */
export const uploadAndProcessTimesheet = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${ENGINE_API_BASE_URL}/upload-and-process`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds for file upload and processing
    });

    return response.data;
  } catch (error) {
    console.error('Error uploading and processing timesheet:', error);
    throw new Error(
      error.response?.data?.error || 
      error.response?.data?.message ||
      'Failed to upload and process timesheet. Please check if the server is running.'
    );
  }
};

/**
 * Transform engine response to invoice format
 * @param {Object} engineData - Data returned from engine analysis
 * @param {Object} clientInfo - Client information for the invoice
 * @returns {Object} - Invoice data structure
 */
export const transformTimesheetToInvoice = (engineData, clientInfo = {}) => {
  try {
    // Handle both single entry and array formats from engine
    const entries = engineData.Entry || engineData.results?.Entry || [];
    const entry = Array.isArray(entries) ? entries[0] : entries;

    if (!entry) {
      throw new Error('No timesheet data found in engine response');
    }

    // Calculate invoice amount based on hours and rate
    const totalHours = parseFloat(entry['Total Hours']) || 0;
    const hourlyRate = clientInfo.hourlyRate || 100; // Default rate
    const invoiceAmount = totalHours * hourlyRate;

    // Parse duration to get start and end dates
    const duration = entry.Duration || '';
    const dateMatch = duration.match(/(\d{1,2}\/\d{1,2}\/\d{4})\s*to\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
    
    let startDate = '';
    let endDate = '';
    if (dateMatch) {
      startDate = dateMatch[1];
      endDate = dateMatch[2];
    }

    return {
      // Invoice header information
      invoiceNumber: `INV-${Date.now()}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      
      // Client information
      clientName: clientInfo.name || entry.Vendor_Name || 'Unknown Client',
      clientEmail: clientInfo.email || '',
      clientAddress: clientInfo.address || '',
      
      // Timesheet period
      periodStart: startDate,
      periodEnd: endDate,
      
      // Line items
      lineItems: [
        {
          description: `Professional Services - ${startDate} to ${endDate}`,
          quantity: totalHours,
          rate: hourlyRate,
          amount: invoiceAmount,
        }
      ],
      
      // Totals
      subtotal: invoiceAmount,
      tax: 0, // Can be calculated based on client location
      total: invoiceAmount,
      
      // Additional metadata
      timesheetData: entry,
      processingCost: engineData.cost || '',
      status: 'draft',
      
      // Notes
      notes: `Invoice generated from timesheet analysis for ${entry.Vendor_Name || 'vendor'}.`,
    };
  } catch (error) {
    console.error('Error transforming timesheet to invoice:', error);
    throw new Error('Failed to transform timesheet data to invoice format');
  }
};

/**
 * Check if engine service is available
 * @returns {Promise<boolean>} - Promise resolving to service availability
 */
export const checkEngineServiceHealth = async () => {
  try {
    const response = await axios.get(`${ENGINE_API_BASE_URL}/health`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    console.warn('Engine service health check failed:', error.message);
    return false;
  }
};

const engineService = {
  analyzeDocument,
  convertDocxToPdf,
  processDocumentContent,
  extractTimesheetData,
  uploadAndProcessTimesheet,
  transformTimesheetToInvoice,
  checkEngineServiceHealth,
};

export default engineService;
