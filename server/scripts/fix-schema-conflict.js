#!/usr/bin/env node

/**
 * Fix Database Schema Conflict
 * Drops the tenant_dashboard view that's preventing column modifications
 */

const { Client } = require("pg");
require("dotenv").config();

const fixSchemaConflict = async () => {
  const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "timepulse_db",
  };

  console.log("🔧 Fixing database schema conflict...");
  console.log(`📍 Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`🗄️  Database: ${dbConfig.database}`);

  try {
    const client = new Client(dbConfig);
    await client.connect();
    console.log("✅ Connected to database");

    // Drop the problematic view
    console.log("🗑️  Dropping tenant_dashboard view...");
    await client.query("DROP VIEW IF EXISTS tenant_dashboard CASCADE;");
    console.log("✅ View dropped successfully");

    // Recreate the view with proper structure
    console.log("🔨 Recreating tenant_dashboard view...");
    const createViewSQL = `
      CREATE VIEW tenant_dashboard AS
      SELECT 
          t.id,
          t.tenant_name,
          t.subdomain,
          t.status,
          COUNT(DISTINCT u.id) as total_users,
          COUNT(DISTINCT e.id) as total_employees,
          COUNT(DISTINCT c.id) as total_clients,
          COUNT(DISTINCT p.id) as total_projects,
          COUNT(DISTINCT ts.id) as total_timesheets,
          COUNT(DISTINCT i.id) as total_invoices,
          t.created_at,
          t.updated_at
      FROM tenants t
      LEFT JOIN users u ON t.id = u.tenant_id
      LEFT JOIN employees e ON t.id = e.tenant_id
      LEFT JOIN clients c ON t.id = c.tenant_id
      LEFT JOIN projects p ON t.id = p.tenant_id
      LEFT JOIN timesheets ts ON t.id = ts.tenant_id
      LEFT JOIN invoices i ON t.id = i.tenant_id
      GROUP BY t.id, t.tenant_name, t.subdomain, t.status, t.created_at, t.updated_at;
    `;

    await client.query(createViewSQL);
    console.log("✅ View recreated successfully");

    await client.end();
    console.log("🎉 Schema conflict fixed! You can now start the server.");
  } catch (error) {
    console.error("❌ Failed to fix schema conflict:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.log("\n💡 Make sure PostgreSQL is running and accessible at:");
      console.log(`   Host: ${dbConfig.host}`);
      console.log(`   Port: ${dbConfig.port}`);
    }

    if (error.code === "28P01") {
      console.log(
        "\n💡 Authentication failed. Check your credentials in .env file"
      );
    }

    if (error.code === "3D000") {
      console.log("\n💡 Database does not exist. Run: npm run setup-db");
    }

    process.exit(1);
  }
};

// Run fix if called directly
if (require.main === module) {
  fixSchemaConflict();
}

module.exports = { fixSchemaConflict };
