/**
 * Notification Scheduler
 * Runs notification checks twice daily (9 AM and 5 PM)
 * 
 * This script should be run as a long-running process (e.g., via PM2, systemd, or Docker)
 * 
 * Usage:
 *   node server/scripts/notification-scheduler.js
 * 
 * Or with PM2:
 *   pm2 start server/scripts/notification-scheduler.js --name timesheet-notifications
 */

require('dotenv').config();
const cron = require('node-cron');
const { models, sequelize } = require('../models');
const { sendMissingTimesheetReminders, sendPendingApprovalReminders } = require('./send-manager-notifications');
const { sendRemindersForWeek } = require('./send-timesheet-reminders');

// Schedule: Run twice daily at 9 AM and 5 PM (UTC)
// Adjust timezone as needed: '0 9,17 * * *' for UTC
// For EST: '0 9,17 * * *' (9 AM and 5 PM EST = 14:00 and 22:00 UTC)
const SCHEDULE = process.env.NOTIFICATION_SCHEDULE || '0 9,17 * * *'; // 9 AM and 5 PM UTC

// Statistics tracking
const stats = {
  totalRuns: 0,
  successfulRuns: 0,
  failedRuns: 0,
  lastRun: null,
  lastError: null,
  employeeRemindersSent: 0,
  managerMissingRemindersSent: 0,
  managerPendingRemindersSent: 0,
};

console.log('═══════════════════════════════════════════════════════');
console.log('⏰ Timesheet Notification Scheduler');
console.log('═══════════════════════════════════════════════════════');
console.log('');
console.log(`📅 Schedule: Twice daily (9 AM and 5 PM UTC)`);
console.log(`   Cron: ${SCHEDULE}`);
console.log(`   Timezone: UTC`);
console.log(`   Next Run: ${getNextRunTime()}`);
console.log('');

// Test database connection
async function testDatabaseConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Run immediately on startup (optional - remove if you don't want this)
const runImmediately = process.env.RUN_IMMEDIATELY === 'true';
if (runImmediately) {
  console.log('🚀 Running notifications immediately (RUN_IMMEDIATELY=true)...');
  console.log('');
  runAllNotifications().catch(err => {
    console.error('❌ Error in immediate run:', err);
  });
}

// Schedule the job
const scheduledTask = cron.schedule(SCHEDULE, async () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`⏰ Scheduled Run: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  
  stats.totalRuns++;
  stats.lastRun = new Date().toISOString();
  
  try {
    await runAllNotifications();
    stats.successfulRuns++;
    stats.lastError = null;
  } catch (error) {
    stats.failedRuns++;
    stats.lastError = error.message;
    console.error('❌ Fatal error in scheduled run:', error);
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 Run Summary');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Total Runs: ${stats.totalRuns}`);
  console.log(`Successful: ${stats.successfulRuns}`);
  console.log(`Failed: ${stats.failedRuns}`);
  console.log(`Next Run: ${getNextRunTime()}`);
  console.log('');
}, {
  scheduled: true,
  timezone: 'UTC'
});

async function runAllNotifications() {
  const startTime = Date.now();
  const tenantId = process.env.TENANT_ID || null;
  const results = {
    employeeReminders: { sent: 0, failed: 0 },
    managerMissingReminders: { sent: 0, failed: 0 },
    managerPendingReminders: { sent: 0, failed: 0 },
  };
  
  try {
    // Test database connection before running
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }
    
    // 1. Employee reminders (for missing timesheets)
    console.log('1️⃣  Employee Reminders (Missing Timesheets)');
    console.log('───────────────────────────────────────────────────────');
    try {
      const employeeResult = await sendRemindersForWeek(undefined, tenantId);
      if (employeeResult && employeeResult.remindersSent !== undefined) {
        results.employeeReminders.sent = employeeResult.remindersSent;
        results.employeeReminders.failed = employeeResult.failures || 0;
        stats.employeeRemindersSent += employeeResult.remindersSent;
      }
      console.log(`   ✅ Completed: ${results.employeeReminders.sent} sent, ${results.employeeReminders.failed} failed`);
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      results.employeeReminders.failed++;
      throw error;
    }
    console.log('');

    // 2. Manager reminders (for missing timesheets - 2+ days overdue)
    console.log('2️⃣  Manager Missing Timesheet Reminders (2+ days overdue)');
    console.log('───────────────────────────────────────────────────────');
    try {
      const managerMissingResult = await sendMissingTimesheetReminders(tenantId);
      if (managerMissingResult && managerMissingResult.sent !== undefined) {
        results.managerMissingReminders.sent = managerMissingResult.sent;
        results.managerMissingReminders.failed = managerMissingResult.failed || 0;
        stats.managerMissingRemindersSent += managerMissingResult.sent;
      }
      console.log(`   ✅ Completed: ${results.managerMissingReminders.sent} sent, ${results.managerMissingReminders.failed} failed`);
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      results.managerMissingReminders.failed++;
      // Don't throw - continue with other notifications
    }
    console.log('');

    // 3. Manager reminders (for pending approvals - 2+ days pending)
    console.log('3️⃣  Manager Pending Approval Reminders (2+ days pending)');
    console.log('───────────────────────────────────────────────────────');
    try {
      const managerPendingResult = await sendPendingApprovalReminders(tenantId);
      if (managerPendingResult && managerPendingResult.sent !== undefined) {
        results.managerPendingReminders.sent = managerPendingResult.sent;
        results.managerPendingReminders.failed = managerPendingResult.failed || 0;
        stats.managerPendingRemindersSent += managerPendingResult.sent;
      }
      console.log(`   ✅ Completed: ${results.managerPendingReminders.sent} sent, ${results.managerPendingReminders.failed} failed`);
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      results.managerPendingReminders.failed++;
      // Don't throw - continue
    }
    console.log('');

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const totalSent = results.employeeReminders.sent + results.managerMissingReminders.sent + results.managerPendingReminders.sent;
    const totalFailed = results.employeeReminders.failed + results.managerMissingReminders.failed + results.managerPendingReminders.failed;
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 Notification Summary');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Employee Reminders:        ${results.employeeReminders.sent} sent, ${results.employeeReminders.failed} failed`);
    console.log(`Manager Missing Reminders: ${results.managerMissingReminders.sent} sent, ${results.managerMissingReminders.failed} failed`);
    console.log(`Manager Pending Reminders: ${results.managerPendingReminders.sent} sent, ${results.managerPendingReminders.failed} failed`);
    console.log(`───────────────────────────────────────────────────────`);
    console.log(`Total:                     ${totalSent} sent, ${totalFailed} failed`);
    console.log(`Duration:                  ${duration}s`);
    console.log('');

  } catch (error) {
    console.error('❌ Fatal error in notification scheduler:', error);
    throw error;
  }
}

function getNextRunTime() {
  const now = new Date();
  const hour = now.getUTCHours();
  let nextHour = 9; // Default to 9 AM
  
  if (hour < 9) {
    nextHour = 9;
  } else if (hour < 17) {
    nextHour = 17;
  } else {
    // Next day at 9 AM
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(9, 0, 0, 0);
    return tomorrow.toISOString();
  }
  
  const nextRun = new Date(now);
  nextRun.setUTCHours(nextHour, 0, 0, 0);
  if (nextRun <= now) {
    nextRun.setUTCDate(nextRun.getUTCDate() + 1);
  }
  return nextRun.toISOString();
}

// Health check endpoint (if running as HTTP server)
if (process.env.ENABLE_HEALTH_CHECK === 'true') {
  const express = require('express');
  const app = express();
  const port = process.env.HEALTH_CHECK_PORT || 3001;
  
  app.get('/health', (req, res) => {
    res.json({
      status: 'running',
      stats: {
        ...stats,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      },
      nextRun: getNextRunTime(),
    });
  });
  
  app.get('/stats', (req, res) => {
    res.json(stats);
  });
  
  app.listen(port, () => {
    console.log(`📊 Health check server running on port ${port}`);
    console.log(`   Health: http://localhost:${port}/health`);
    console.log(`   Stats:  http://localhost:${port}/stats`);
    console.log('');
  });
}

// Handle graceful shutdown
let isShuttingDown = false;

async function gracefulShutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log('');
  console.log('🛑 Shutting down scheduler gracefully...');
  console.log('');
  
  // Stop the cron job
  scheduledTask.stop();
  
  // Close database connections
  try {
    await sequelize.close();
    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('⚠️  Error closing database:', error.message);
  }
  
  console.log('✅ Scheduler stopped');
  console.log('');
  console.log('📊 Final Statistics:');
  console.log(`   Total Runs: ${stats.totalRuns}`);
  console.log(`   Successful: ${stats.successfulRuns}`);
  console.log(`   Failed: ${stats.failedRuns}`);
  console.log(`   Employee Reminders: ${stats.employeeRemindersSent}`);
  console.log(`   Manager Missing: ${stats.managerMissingRemindersSent}`);
  console.log(`   Manager Pending: ${stats.managerPendingRemindersSent}`);
  console.log('');
  
  process.exit(0);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  stats.lastError = error.message;
  // Don't exit - let the scheduler continue
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  stats.lastError = reason?.message || String(reason);
  // Don't exit - let the scheduler continue
});

// Keep process alive
console.log('✅ Scheduler started. Waiting for scheduled times...');
console.log('   Press Ctrl+C to stop');
console.log('');
console.log('💡 Scheduler is running. Process will stay alive.');
console.log('');

// Initial database connection test
testDatabaseConnection().then(connected => {
  if (!connected) {
    console.error('⚠️  Warning: Database connection failed. Scheduler will retry on next run.');
  }
});

// Export for testing
module.exports = {
  runAllNotifications,
  getNextRunTime,
  testDatabaseConnection,
  stats,
};

