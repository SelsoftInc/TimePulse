/**
 * Script to run the timesheet audit table migration
 * Usage: 
 *   Production: NODE_ENV=production USE_LOCAL_DB=false node server/scripts/run-timesheet-audit-migration.js
 *   Local: node server/scripts/run-timesheet-audit-migration.js
 */

require('dotenv').config();
const fs = require("fs");
const path = require("path");

// Load database configuration
const getDbConfig = () => {
  const env = process.env.NODE_ENV || "development";
  const isLocal = env === "development" || process.env.USE_LOCAL_DB === "true";

  if (isLocal) {
    const localConfig = require("../config/database.local.js");
    return localConfig.development;
  } else {
    const remoteConfig = require("../config/database.remote.js");
    return remoteConfig[env] || remoteConfig.production;
  }
};

const dbConfig = getDbConfig();
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

async function runMigration() {
  try {
    console.log("🔄 Running timesheet audit table migration...");
    console.log(`📍 Database: ${dbConfig.host}:${dbConfig.port || 5432}/${dbConfig.database}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log("");

    // Connect to database
    await sequelize.authenticate();
    console.log("✅ Database connection established");
    console.log("");

    // Read the migration SQL file
    const migrationPath = path.join(
      __dirname,
      "../database/migrations/2025-11-16_create_timesheet_audit_table.sql"
    );

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
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
      console.log("⚠️  Table 'timesheet_audit' already exists");
      console.log("   Skipping migration (table already created)");
      await sequelize.close();
      process.exit(0);
    }

    // Execute the migration
    console.log("📝 Executing migration SQL...");
    await sequelize.query(migrationSQL);

    console.log("✅ Timesheet audit table migration completed successfully!");
    console.log("");
    console.log("📊 The following table has been created:");
    console.log("   - timesheet_audit");
    console.log("");
    console.log("📋 The audit system will now automatically log:");
    console.log("   - Timesheet creation");
    console.log("   - Timesheet updates");
    console.log("   - Timesheet submission");
    console.log("   - Timesheet approval");
    console.log("   - Timesheet rejection");
    console.log("   - Timesheet deletion");
    console.log("");
    console.log("🔍 You can view audit logs using:");
    console.log("   GET /api/timesheets/:id/audit");
    console.log("   GET /api/timesheets/audit/employee/:employeeId");
    console.log("   GET /api/timesheets/audit/tenant");

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    console.error("Error details:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    await sequelize.close().catch(() => {});
    process.exit(1);
  }
}

// Run migration
runMigration();

