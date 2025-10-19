#!/usr/bin/env node

/**
 * Setup Dashboard SQL Functions and Indexes
 * This script sets up the optimized dashboard queries for TimePulse
 */

const fs = require("fs");
const path = require("path");
const { sequelize } = require("../models");

async function setupDashboard() {
  try {
    console.log("🚀 Setting up TimePulse Dashboard...");

    // Read the SQL setup file
    const sqlPath = path.join(__dirname, "setup-dashboard.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf8");

    // Split by semicolon but handle dollar-quoted strings properly
    const statements = [];
    let currentStatement = "";
    let inDollarQuote = false;
    let dollarTag = "";

    const lines = sqlContent.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip comments and empty lines
      if (trimmedLine.startsWith("--") || trimmedLine === "") {
        continue;
      }

      // Check for start of dollar-quoted string
      if (!inDollarQuote && trimmedLine.includes("$$")) {
        const dollarMatch = trimmedLine.match(/\$\$(\w*)\$\$/);
        if (dollarMatch) {
          // Single line dollar quote
          currentStatement += line + "\n";
          if (currentStatement.trim().endsWith(";")) {
            statements.push(currentStatement.trim());
            currentStatement = "";
          }
        } else {
          // Multi-line dollar quote
          const dollarStartMatch = trimmedLine.match(/\$\$(\w*)/);
          if (dollarStartMatch) {
            inDollarQuote = true;
            dollarTag = dollarStartMatch[1];
            currentStatement += line + "\n";
          }
        }
      } else if (inDollarQuote) {
        // Inside dollar-quoted string
        currentStatement += line + "\n";
        if (trimmedLine.includes(`$$${dollarTag}$$`)) {
          inDollarQuote = false;
          dollarTag = "";
          if (currentStatement.trim().endsWith(";")) {
            statements.push(currentStatement.trim());
            currentStatement = "";
          }
        }
      } else {
        // Regular SQL
        currentStatement += line + "\n";
        if (trimmedLine.endsWith(";")) {
          statements.push(currentStatement.trim());
          currentStatement = "";
        }
      }
    }

    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await sequelize.query(statement);
          console.log(
            `✅ Statement ${i + 1}/${statements.length} executed successfully`
          );
        } catch (error) {
          // Some statements might fail if they already exist, which is okay
          if (
            error.message.includes("already exists") ||
            error.message.includes("does not exist") ||
            error.message.includes("duplicate key")
          ) {
            console.log(
              `⚠️  Statement ${
                i + 1
              } skipped (already exists or not applicable)`
            );
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }

    console.log("🎉 Dashboard setup completed successfully!");
    console.log("");
    console.log("📊 Available Dashboard Endpoints:");
    console.log("  GET  /api/dashboard - Main dashboard data");
    console.log("  GET  /api/dashboard/employees - Employee list for dropdown");
    console.log(
      "  POST /api/dashboard/refresh - Refresh materialized view (admin only)"
    );
    console.log("");
    console.log("🔧 Query Parameters:");
    console.log('  scope: "company" | "employee" (default: "company")');
    console.log('  employeeId: UUID (required when scope="employee")');
    console.log("  from: ISO date string (optional)");
    console.log("  to: ISO date string (optional)");
    console.log("");
    console.log("💡 Example API calls:");
    console.log(
      "  GET /api/dashboard?scope=company&from=2024-01-01&to=2024-12-31"
    );
    console.log(
      "  GET /api/dashboard?scope=employee&employeeId=123e4567-e89b-12d3-a456-426614174000"
    );
  } catch (error) {
    console.error("❌ Dashboard setup failed:", error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the setup
if (require.main === module) {
  setupDashboard();
}

module.exports = setupDashboard;
