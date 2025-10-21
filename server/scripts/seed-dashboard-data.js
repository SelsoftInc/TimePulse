#!/usr/bin/env node

/**
 * Seed Dashboard Data
 * This script adds sample data to demonstrate the dashboard features
 */

const { sequelize } = require("../models");
const { v4: uuidv4 } = require("uuid");

async function seedDashboardData() {
  try {
    console.log("🌱 Seeding dashboard data...");

    const tenantId = "c92fe40d-af85-4c8b-8053-71df10680804";

    // Get existing employees
    const employees = await sequelize.query(
      `SELECT id, first_name, last_name, hourly_rate FROM employees WHERE tenant_id = ? AND status = 'active'`,
      {
        replacements: [tenantId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (employees.length === 0) {
      console.log(
        "❌ No active employees found. Please ensure employees exist first."
      );
      return;
    }

    console.log(`📋 Found ${employees.length} employees`);

    // Get existing clients
    const clients = await sequelize.query(
      `SELECT id, client_name, hourly_rate FROM clients WHERE tenant_id = ? AND status = 'active'`,
      {
        replacements: [tenantId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (clients.length === 0) {
      console.log(
        "❌ No active clients found. Please ensure clients exist first."
      );
      return;
    }

    console.log(`🏢 Found ${clients.length} clients`);

    // Create sample timesheets for the last 4 weeks
    const timesheets = [];
    const now = new Date();

    for (let week = 0; week < 4; week++) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - week * 7 - 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      for (const employee of employees) {
        const client = clients[Math.floor(Math.random() * clients.length)];
        const hours = Math.floor(Math.random() * 20) + 20; // 20-40 hours per week

        timesheets.push({
          id: uuidv4(),
          tenant_id: tenantId,
          employee_id: employee.id,
          client_id: client.id,
          week_start_date: weekStart.toISOString().split("T")[0],
          week_end_date: weekEnd.toISOString().split("T")[0],
          total_hours: hours,
          status: week === 0 ? "submitted" : "approved", // Current week is submitted, others approved
          submitted_at:
            week === 0
              ? new Date()
              : new Date(weekEnd.getTime() + 24 * 60 * 60 * 1000),
          approved_at:
            week === 0
              ? null
              : new Date(weekEnd.getTime() + 48 * 60 * 60 * 1000),
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    }

    // Insert timesheets
    console.log(`📊 Creating ${timesheets.length} timesheets...`);
    for (let i = 0; i < timesheets.length; i++) {
      const timesheet = timesheets[i];
      try {
        await sequelize.query(
          `INSERT INTO timesheets (id, tenant_id, employee_id, client_id, week_start_date, week_end_date, total_hours, status, submitted_at, approved_at, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          {
            replacements: [
              timesheet.id,
              timesheet.tenant_id,
              timesheet.employee_id,
              timesheet.client_id,
              timesheet.week_start_date,
              timesheet.week_end_date,
              timesheet.total_hours,
              timesheet.status,
              timesheet.submitted_at,
              timesheet.approved_at,
              timesheet.created_at,
              timesheet.updated_at,
            ],
          }
        );
        console.log(
          `✅ Timesheet ${i + 1}/${timesheets.length} created for employee ${
            timesheet.employee_id
          }, week ${timesheet.week_start_date}`
        );
      } catch (error) {
        console.error(
          `❌ Error creating timesheet ${i + 1}/${timesheets.length}:`,
          error.message
        );
        console.error("Timesheet data:", timesheet);
        throw error;
      }
    }

    // Get a user to be the creator of invoices
    const users = await sequelize.query(
      `SELECT id FROM users WHERE tenant_id = ? AND role = 'admin' LIMIT 1`,
      {
        replacements: [tenantId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (users.length === 0) {
      console.log("❌ No admin users found. Please ensure users exist first.");
      return;
    }

    const createdBy = users[0].id;

    // Create sample invoices
    console.log("💰 Creating sample invoices...");
    const invoices = [];

    for (let i = 0; i < 10; i++) {
      const client = clients[Math.floor(Math.random() * clients.length)];
      const amount = Math.floor(Math.random() * 5000) + 1000; // $1000-$6000
      const invoiceDate = new Date();
      invoiceDate.setDate(
        invoiceDate.getDate() - Math.floor(Math.random() * 30)
      );

      const paymentStatuses = ["pending", "paid", "overdue"];
      const paymentStatus =
        paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
      const statuses = ["active", "inactive"];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      invoices.push({
        id: uuidv4(),
        tenant_id: tenantId,
        client_id: client.id,
        invoice_number: `INV-${Date.now()}-${i}`,
        total_amount: amount,
        status: status,
        payment_status: paymentStatus,
        invoice_date: invoiceDate.toISOString().split("T")[0],
        due_date: new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        created_by: createdBy,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    // Insert invoices
    for (const invoice of invoices) {
      await sequelize.query(
        `INSERT INTO invoices (id, tenant_id, client_id, invoice_number, total_amount, status, payment_status, invoice_date, due_date, created_by, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        {
          replacements: [
            invoice.id,
            invoice.tenant_id,
            invoice.client_id,
            invoice.invoice_number,
            invoice.total_amount,
            invoice.status,
            invoice.payment_status,
            invoice.invoice_date,
            invoice.due_date,
            invoice.created_by,
            invoice.created_at,
            invoice.updated_at,
          ],
        }
      );
    }

    // Refresh materialized view
    console.log("🔄 Refreshing materialized view...");
    await sequelize.query("REFRESH MATERIALIZED VIEW mv_staffing_daily");

    console.log("✅ Dashboard data seeded successfully!");
    console.log("");
    console.log("📊 Sample data created:");
    console.log(`  - ${timesheets.length} timesheets (4 weeks of data)`);
    console.log(
      `  - ${invoices.length} invoices with various payment statuses`
    );
    console.log(`  - Materialized view refreshed`);
    console.log("");
    console.log("🎯 Your dashboard should now show meaningful data!");
  } catch (error) {
    console.error("❌ Error seeding dashboard data:", error.message);
  } finally {
    await sequelize.close();
  }
}

// Run the seeding
if (require.main === module) {
  seedDashboardData();
}

module.exports = seedDashboardData;
