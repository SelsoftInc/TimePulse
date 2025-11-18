/**
 * Script to run the timesheet audit table migration against RDS
 * This script fetches credentials from AWS Secrets Manager
 * 
 * Usage: node server/scripts/run-timesheet-audit-migration-rds.js
 */

const { execSync } = require("child_process");
const { Sequelize } = require("sequelize");
const fs = require("fs");
const path = require("path");

function getDatabasePassword() {
  try {
    const secret = execSync(
      'aws secretsmanager get-secret-value --secret-id timepulse-db-password --region us-east-1 --query SecretString --output text',
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
    
    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(secret);
      return parsed.password || parsed.PASSWORD || secret;
    } catch (e) {
      // Not JSON, return as-is
      return secret;
    }
  } catch (error) {
    console.error("❌ Error fetching password from Secrets Manager:", error.message);
    console.error("Make sure AWS CLI is configured and you have access to Secrets Manager");
    throw error;
  }
}

async function runMigration() {
  try {
    console.log("🔄 Running timesheet audit table migration against RDS...");
    console.log("");

    // Get database password from AWS Secrets Manager
    console.log("🔐 Fetching database password from AWS Secrets Manager...");
    const dbPassword = await getDatabasePassword();
    console.log("✅ Password retrieved");
    console.log("");

    // Database configuration
    const dbConfig = {
      host: "timepulse-cluster.cluster-chb4yd9ykrnf.us-east-1.rds.amazonaws.com",
      port: 5432,
      database: "timepulse_db",
      username: "postgres",
      password: dbPassword,
      dialect: "postgres",
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    };

    console.log(`📍 Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    console.log("");

    // Create Sequelize instance
    const sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      dbConfig
    );

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
    console.log("✅ Migration SQL executed successfully");
    console.log("");

    // Verify table was created
    const [verifyTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'timesheet_audit';
    `);

    if (verifyTables.length > 0) {
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
    } else {
      throw new Error("Table was not created - verification failed");
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  }
}

// Run migration
runMigration();

