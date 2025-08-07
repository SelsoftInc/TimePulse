#!/usr/bin/env node

/**
 * TimePulse Server
 * Integrated Node.js server with timesheet processing and invoice generation
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import route modules
const timesheetRoutes = require('./routes/timesheets');
const invoiceRoutes = require('./routes/invoices');
const engineRoutes = require('./routes/engine');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
  ],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'TimePulse Server',
    timestamp: new Date().toISOString(),
    features: ['timesheet_processing', 'invoice_generation', 'ai_analysis']
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'TimePulse Server API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      timesheets: '/api/timesheets',
      invoices: '/api/invoices',
      engine: '/api/engine'
    }
  });
});

// API Routes
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/engine', engineRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TimePulse Server running on port ${PORT}`);
  console.log(`📖 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
