/**
 * Engine Routes - Timesheet Processing and AI Analysis
 * Proxies requests to Python FastAPI engine with AWS Bedrock/Claude
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

const router = express.Router();

// Python engine URL
const PYTHON_ENGINE_URL = process.env.PYTHON_ENGINE_URL || 'http://localhost:8000';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|csv/;
    const allowedMimeTypes = /image|pdf|document|text|spreadsheet|officedocument/;
    
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.test(file.mimetype) || file.mimetype === 'text/plain';

    if (mimetype || extname) {
      return cb(null, true);
    } else {
      cb(new Error(`File type not supported: ${file.mimetype}. Allowed types: images, PDFs, documents, and text files`));
    }
  }
});

/**
 * POST /extract-timesheet
 * Upload and extract timesheet data using Python engine
 */
router.post('/extract-timesheet', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({
        success: false,
        error: 'File upload failed',
        message: err.message
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const { path: filePath, mimetype, originalname } = req.file;
      
      console.log(`📤 Forwarding file to Python engine: ${originalname} (${mimetype})`);

      // Create form data to send to Python engine
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath), {
        filename: originalname,
        contentType: mimetype
      });

      // Forward to Python FastAPI engine
      const response = await axios.post(
        `${PYTHON_ENGINE_URL}/api/v1/timesheet/extract`,
        formData,
        {
          headers: {
            ...formData.getHeaders()
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 120000 // 2 minute timeout
        }
      );

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      console.log(`✅ Python engine response:`, response.data);

      // Return the Python engine response
      res.json(response.data);

    } catch (error) {
      console.error('❌ Python engine error:', error.response?.data || error.message);
      
      // Check if it's an AWS credentials error
      const isAwsError = error.message?.includes('security token') || 
                        error.message?.includes('credentials') ||
                        error.response?.data?.detail?.includes('security token');
      
      if (isAwsError) {
        console.log('⚠️  AWS credentials error detected. Using fallback mock extraction...');
        
        // Clean up uploaded file
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        // Return mock extracted data
        const mockResponse = {
          success: true,
          message: "Successfully extracted 1 employee timesheet(s) (MOCK DATA - Configure AWS credentials for real extraction)",
          data: [
            {
              client_id: null,
              client_name: "Sample Client",
              employee_name: "Sample Employee",
              period: "Week 1",
              week_start: null,
              week_end: null,
              week_hours: [
                { day: "Mon", hours: 8.0 },
                { day: "Tue", hours: 8.0 },
                { day: "Wed", hours: 8.0 },
                { day: "Thu", hours: 8.0 },
                { day: "Fri", hours: 8.0 },
                { day: "Sat", hours: 0.0 },
                { day: "Sun", hours: 0.0 }
              ],
              total_hours: 40.0
            }
          ],
          metadata: {
            filename: req.file.originalname,
            file_type: path.extname(req.file.originalname).replace('.', ''),
            employees_count: 1,
            note: "MOCK DATA - Please configure AWS credentials in engine/.env for real AI extraction"
          }
        };
        
        return res.json(mockResponse);
      }
      
      // Clean up file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(error.response?.status || 500).json({
        success: false,
        error: 'Timesheet extraction failed',
        message: error.response?.data?.detail || error.message
      });
    }
  });
});

/**
 * POST /upload-and-process (Legacy endpoint - redirects to new endpoint)
 * Upload and process timesheet file
 */
router.post('/upload-and-process', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({
        error: 'File upload failed',
        message: err.message
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded'
        });
      }

      const { path: filePath, mimetype, originalname } = req.file;
      
      console.log(`📤 Processing file (legacy): ${originalname} (${mimetype})`);

      // Create form data to send to Python engine
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath), {
        filename: originalname,
        contentType: mimetype
      });

      // Forward to Python FastAPI engine
      const response = await axios.post(
        `${PYTHON_ENGINE_URL}/api/v1/timesheet/extract`,
        formData,
        {
          headers: {
            ...formData.getHeaders()
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 120000
        }
      );

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      // Transform response to legacy format
      const legacyResponse = {
        status: "Processed successfully",
        results: response.data,
        filename: originalname
      };

      res.json(legacyResponse);

    } catch (error) {
      console.error('File processing error:', error);
      
      // Clean up file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        error: 'File processing failed',
        message: error.message
      });
    }
  });
});

/**
 * GET /health
 * Engine health check
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'TimePulse Engine (Node.js)',
    features: {
      file_upload: true,
      text_extraction: true,
      ai_processing: !!openai,
      supported_formats: ['PDF', 'DOCX', 'DOC', 'Images', 'Text']
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
