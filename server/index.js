#!/usr/bin/env node

/**
 * TimePulse Server
 * Integrated Node.js server with timesheet processing and invoice generation
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import database connection
const { connectDB } = require('./models');

const app = express();
const PORT = process.env.PORT || 5001;
const SKIP_DB_CONNECT = process.env.SKIP_DB_CONNECT === 'true' || process.env.ALLOW_START_WITHOUT_DB === 'true';

// Import route modules
const timesheetRoutes = require('./routes/timesheets');
const invoiceRoutes = require('./routes/invoices');
const engineRoutes = require('./routes/engine');
const onboardingRoutes = require('./routes/onboarding');
const employeeRoutes = require('./routes/employees');
const clientRoutes = require('./routes/clients');
const tenantRoutes = require('./routes/tenants');
const vendorRoutes = require('./routes/vendors');



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
      engine: '/api/engine',
      onboarding: '/api/onboarding',
      employees: '/api/employees',
      clients: '/api/clients',
      tenants: '/api/tenants',
      vendors: '/api/vendors'
    }
  });
});

// API Routes
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/engine', engineRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/auth', require('./routes/auth'));

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

// Start server with optional database connection
const startServer = async () => {
  let dbConnected = false;
  if (SKIP_DB_CONNECT) {
    console.warn('⚠️  SKIP_DB_CONNECT is true. Starting server without database connection.');
  } else {
    try {
      await connectDB();
      dbConnected = true;
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Unable to connect to the database at startup:', error.message);
      if (!process.env.ALLOW_START_WITHOUT_DB) {
        console.error('Set SKIP_DB_CONNECT=true to start without DB, or configure DB env vars. Exiting.');
        process.exit(1);
      } else {
        console.warn('⚠️  ALLOW_START_WITHOUT_DB is set. Continuing without DB.');
      }
    }
  }

  // Start HTTP server
  app.listen(PORT, () => {
    console.log(`🚀 TimePulse Server running on port ${PORT}`);
    console.log(`📖 Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Database: ${dbConnected ? 'Connected' : 'Not connected'}`);
  });
};

startServer();

module.exports = app;
