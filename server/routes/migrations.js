/**
 * Migration Routes - Temporary endpoints for running database migrations
 * These should be secured in production (e.g., require admin authentication)
 */

const express = require("express");
const router = express.Router();
const { sequelize } = require("../models");
const fs = require("fs");
const path = require("path");

// GET /api/migrations/run-timesheet-audit - Run timesheet audit table migration
router.post("/run-timesheet-audit", async (req, res) => {
  try {
    // TODO: Add authentication/authorization check here
    // For now, this is open - you should secure it in production
    
    console.log("🔄 Running timesheet audit migration via API...");

    // Read the migration SQL file
    const migrationPath = path.join(
      __dirname,
      "../database/migrations/2025-11-16_create_timesheet_audit_table.sql"
    );

    if (!fs.existsSync(migrationPath)) {
      return res.status(404).json({
        success: false,
        message: `Migration file not found: ${migrationPath}`,
      });
    }

    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // Check if table already exists
    const [existingTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'timesheet_audit';
    `);

    if (existingTables.length > 0) {
      return res.json({
        success: true,
        message: "Table 'timesheet_audit' already exists - migration skipped",
        skipped: true,
      });
    }

    // Execute the migration
    await sequelize.query(migrationSQL);

    // Verify table was created
    const [verifyTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'timesheet_audit';
    `);

    if (verifyTables.length > 0) {
      return res.json({
        success: true,
        message: "Timesheet audit table migration completed successfully",
        tableCreated: true,
      });
    } else {
      throw new Error("Table was not created - verification failed");
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    return res.status(500).json({
      success: false,
      message: "Migration failed",
      error: error.message,
    });
  }
});

module.exports = router;

