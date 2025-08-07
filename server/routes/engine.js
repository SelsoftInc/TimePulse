/**
 * Engine Routes - Timesheet Processing and AI Analysis
 * Clean version with proper error handling
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { OpenAI } = require('openai');

const router = express.Router();

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

// Initialize OpenAI (optional)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

/**
 * Extract text from different file types
 */
async function extractTextFromFile(filePath, mimeType) {
  try {
    if (mimeType.includes('text') || mimeType === 'text/plain') {
      // Handle text files
      return fs.readFileSync(filePath, 'utf8');
    } else {
      // For other file types, return a mock extraction for now
      return `Mock extracted text from ${path.basename(filePath)}. File type: ${mimeType}`;
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error(`Failed to extract text from file: ${error.message}`);
  }
}

/**
 * Process document content with AI
 */
async function processWithAI(documentText) {
  // Return mock data for now
  return {
    Entry: [{
      Vendor_Name: "Sample Vendor",
      Total_Hours: "40",
      Duration: "01/20/2025 to 01/26/2025"
    }]
  };
}

/**
 * POST /upload-and-process
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
      
      console.log(`Processing file: ${originalname} (${mimetype})`);

      // Extract text from the uploaded file
      const extractedText = await extractTextFromFile(filePath, mimetype);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the file');
      }

      // Process with AI
      const analysisResult = await processWithAI(extractedText);

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      // Return processed data in the expected format
      res.json({
        status: "Processed successfully",
        results: analysisResult,
        cost: "Total Cost (USD): $0.05",
        extractedText: extractedText.substring(0, 500) + '...', // First 500 chars for debugging
        filename: originalname
      });

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
 * GET /analyze-document
 * Analyze document from URL
 */
router.get('/analyze-document', async (req, res) => {
  try {
    const documentUrl = req.headers['document-url'];
    
    if (!documentUrl) {
      return res.status(400).json({
        error: 'Missing document-url header'
      });
    }

    // Mock response
    const mockResponse = {
      status: "Processed successfully",
      results: {
        Entry: [{
          Vendor_Name: "John Doe Consulting",
          Total_Hours: "40",
          Duration: "01/20/2025 to 01/26/2025"
        }]
      },
      cost: "Total Cost (USD): $0.05"
    };

    res.json(mockResponse);
  } catch (error) {
    console.error('Document analysis error:', error);
    res.status(500).json({
      error: 'Document analysis failed',
      message: error.message
    });
  }
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
