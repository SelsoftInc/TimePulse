#!/usr/bin/env node

/**
 * TimePulse Server
 * Integrated Node.js server with timesheet processing and invoice generation
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const http = require("http");
require("dotenv").config();

// Import database connection
const { connectDB } = require("./models");
const WebSocketService = require("./services/WebSocketService");

const app = express();
const PORT = process.env.PORT || 5001;

// Import route modules
const timesheetRoutes = require("./routes/timesheets");
const invoiceRoutes = require("./routes/invoices");
const engineRoutes = require("./routes/engine");
const onboardingRoutes = require("./routes/onboarding");
const employeeRoutes = require("./routes/employees");
const employeeDashboardRoutes = require("./routes/employeeDashboard");
const approverRoutes = require("./routes/approvers");
const lookupRoutes = require("./routes/lookups");
const leaveManagementRoutes = require("./routes/leaveManagement");
const clientRoutes = require("./routes/clients");
const tenantRoutes = require("./routes/tenants");
const vendorRoutes = require("./routes/vendors");
const implementationPartnerRoutes = require("./routes/implementationPartners");
const userRoutes = require("./routes/users");
const reportRoutes = require("./routes/reports");
const notificationRoutes = require("./routes/notifications");
const subscriptionRoutes = require("./routes/subscriptions");
const billingRoutes = require("./routes/billing");
const dashboardRoutes = require("./routes/dashboard");
const passwordResetRoutes = require("./routes/passwordReset");
const dashboardExtendedRoutes = require("./routes/dashboard-extended");
const settingsRoutes = require("./routes/settings");

// Middleware
// Configure CORS - allow specific origins from environment variable or default to open
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : ['*']; // Fallback to allow all if not set
    
    // If '*' is in allowed origins, allow all
    if (allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files
app.use("/uploads", express.static(uploadsDir));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "TimePulse Server",
    timestamp: new Date().toISOString(),
    features: ["timesheet_processing", "invoice_generation", "ai_analysis"],
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "TimePulse Server API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/health",
      timesheets: "/api/timesheets",
      invoices: "/api/invoices",
      engine: "/api/engine",
      onboarding: "/api/onboarding",
      employees: "/api/employees",
      employeeDashboard: "/api/employee-dashboard",
      clients: "/api/clients",
      tenants: "/api/tenants",
      vendors: "/api/vendors",
    },
  });
});

// API Routes
console.log('📍 Loading timesheets routes...');
const migrationsRoutes = require('./routes/migrations');
app.use('/api/migrations', migrationsRoutes);
app.use("/api/timesheets", timesheetRoutes);
console.log('📍 Loading invoices routes...');
app.use("/api/invoices", invoiceRoutes);
console.log('📍 Loading engine routes...');
app.use("/api/engine", engineRoutes);
console.log('📍 Loading onboarding routes...');
app.use("/api/onboarding", onboardingRoutes);
console.log('📍 Loading employees routes...');
app.use("/api/employees", employeeRoutes);
console.log('📍 Loading employee-dashboard routes...');
app.use("/api/employee-dashboard", employeeDashboardRoutes);
console.log('📍 Loading approvers routes...');
app.use("/api/approvers", approverRoutes);
console.log('📍 Loading lookups routes...');
app.use("/api/lookups", lookupRoutes);
console.log('📍 Loading leave-management routes...');
app.use("/api/leave-management", leaveManagementRoutes);
console.log('📍 Loading clients routes...');
app.use("/api/clients", clientRoutes);
console.log('📍 Loading tenants routes...');
app.use("/api/tenants", tenantRoutes);
console.log('📍 Loading vendors routes...');
app.use("/api/vendors", vendorRoutes);
console.log('📍 Loading implementation-partners routes...');
app.use("/api/implementation-partners", implementationPartnerRoutes);
console.log('📍 Loading users routes...');
app.use("/api/users", userRoutes);
console.log('📍 Loading reports routes...');
app.use("/api/reports", reportRoutes);
console.log('📍 Loading notifications routes...');
app.use("/api/notifications", notificationRoutes);
console.log('📍 Loading subscriptions routes...');
app.use("/api/subscriptions", subscriptionRoutes);
console.log('📍 Loading billing routes...');
app.use("/api/billing", billingRoutes);
console.log('📍 Loading dashboard routes...');
app.use("/api/dashboard", dashboardRoutes);
console.log('📍 Loading dashboard-extended routes...');
app.use("/api/dashboard-extended", dashboardExtendedRoutes);
console.log('📍 Loading auth routes...');
app.use("/api/auth", require("./routes/auth"));
console.log('📍 Loading oauth routes...');
app.use("/api/oauth", require("./routes/oauth"));
console.log('📍 Loading user-approvals routes...');
app.use("/api/user-approvals", require("./routes/userApprovals"));
console.log('📍 Loading password-reset routes...');
app.use("/api/password-reset", passwordResetRoutes);
console.log('📍 Loading settings routes...');
app.use("/api/settings", settingsRoutes);
console.log('📍 Loading search routes...');
app.use("/api/search", require("./routes/search"));
console.log('✅ All routes loaded successfully');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
  });
});

// Start server with database connection
const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error(
      "❌ Unable to connect to the database at startup:",
      error.message
    );
    console.error(
      "Please check your database configuration and ensure the database is running."
    );
    process.exit(1);
  }

  // Create HTTP server
  const server = http.createServer(app);

  // Initialize WebSocket service
  const wsService = new WebSocketService(server);

  // Make WebSocket service available globally
  global.wsService = wsService;

  // Start HTTP server
  server.listen(PORT, () => {
    console.log(`🚀 TimePulse Server running on port ${PORT}`);
    console.log(`📖 Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🗄️  Database: Connected`);
    console.log(`🔌 WebSocket: Enabled`);
  });
};

startServer();

module.exports = app;
