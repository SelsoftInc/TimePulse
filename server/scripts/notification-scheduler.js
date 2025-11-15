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
const { sendMissingTimesheetReminders, sendPendingApprovalReminders } = require('./send-manager-notifications');
const { sendRemindersForWeek } = require('./send-timesheet-reminders');

// Schedule: Run twice daily at 9 AM and 5 PM (UTC)
// Adjust timezone as needed: '0 9,17 * * *' for UTC
// For EST: '0 9,17 * * *' (9 AM and 5 PM EST = 14:00 and 22:00 UTC)
const SCHEDULE = '0 9,17 * * *'; // 9 AM and 5 PM UTC

console.log('═══════════════════════════════════════════════════════');
console.log('⏰ Timesheet Notification Scheduler');
console.log('═══════════════════════════════════════════════════════');
console.log('');
console.log(`📅 Schedule: Twice daily (9 AM and 5 PM UTC)`);
console.log(`   Cron: ${SCHEDULE}`);
console.log('');
console.log('✅ Scheduler started. Waiting for scheduled times...');
console.log('   Press Ctrl+C to stop');
console.log('');

// Run immediately on startup (optional - remove if you don't want this)
const runImmediately = process.env.RUN_IMMEDIATELY === 'true';
if (runImmediately) {
  console.log('🚀 Running notifications immediately (RUN_IMMEDIATELY=true)...');
  runAllNotifications();
}

// Schedule the job
cron.schedule(SCHEDULE, async () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`⏰ Scheduled Run: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  
  await runAllNotifications();
  
  console.log('');
  console.log(`✅ Scheduled run completed. Next run: ${getNextRunTime()}`);
  console.log('');
}, {
  scheduled: true,
  timezone: 'UTC'
});

async function runAllNotifications() {
  try {
    const tenantId = process.env.TENANT_ID || null;
    
    // 1. Employee reminders (for missing timesheets)
    console.log('📧 Running Employee Reminders...');
    console.log('───────────────────────────────────────────────────────');
    try {
      await sendRemindersForWeek(undefined, tenantId);
    } catch (error) {
      console.error('❌ Error in employee reminders:', error.message);
    }
    console.log('');

    // 2. Manager reminders (for missing timesheets - 2+ days overdue)
    console.log('📧 Running Manager Missing Timesheet Reminders...');
    console.log('───────────────────────────────────────────────────────');
    try {
      await sendMissingTimesheetReminders(tenantId);
    } catch (error) {
      console.error('❌ Error in manager missing timesheet reminders:', error.message);
    }
    console.log('');

    // 3. Manager reminders (for pending approvals - 2+ days pending)
    console.log('📧 Running Manager Pending Approval Reminders...');
    console.log('───────────────────────────────────────────────────────');
    try {
      await sendPendingApprovalReminders(tenantId);
    } catch (error) {
      console.error('❌ Error in pending approval reminders:', error.message);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Fatal error in notification scheduler:', error);
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

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('');
  console.log('🛑 Shutting down scheduler...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('');
  console.log('🛑 Shutting down scheduler...');
  process.exit(0);
});

// Keep process alive
console.log('💡 Scheduler is running. Process will stay alive.');
console.log('');

