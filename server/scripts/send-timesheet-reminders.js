/**
 * Script to send reminder emails to employees who haven't submitted timesheets
 * after the end of the week
 * 
 * Usage:
 *   node server/scripts/send-timesheet-reminders.js [weekEndDate]
 * 
 * If weekEndDate is not provided, it will check the previous week (last Sunday)
 * 
 * This script should be run as a scheduled job (e.g., daily via cron or AWS EventBridge)
 */

require('dotenv').config();
const { models } = require('../models');
const { Op } = require('sequelize');
const EmailService = require('../services/EmailService');

// Helper function to get week range (Monday to Sunday)
const getWeekRangeMonToSun = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun - 6 Sat
  const diffToMon = (day === 0 ? -6 : 1) - day; // move to Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMon);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { 
    weekStart: monday.toISOString().split('T')[0], 
    weekEnd: sunday.toISOString().split('T')[0],
    weekStartDate: monday,
    weekEndDate: sunday
  };
};

// Format date for display
const formatDate = (date) => {
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

// Format week range for display
const formatWeekRange = (weekStart, weekEnd) => {
  const start = new Date(weekStart);
  const end = new Date(weekEnd);
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

// Calculate days overdue
const calculateDaysOverdue = (weekEndDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekEndDate);
  weekEnd.setHours(0, 0, 0, 0);
  const diffTime = today - weekEnd;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

async function sendRemindersForWeek(weekEndDate, tenantId = null) {
  try {
    // Get week range for the specified week end date
    const { weekStart, weekEnd, weekEndDate: weekEndDateObj } = getWeekRangeMonToSun(weekEndDate);
    const daysOverdue = calculateDaysOverdue(weekEnd);
    
    console.log('📅 Checking for missing timesheets...');
    console.log(`   Week: ${formatWeekRange(weekStart, weekEnd)}`);
    console.log(`   Week End: ${formatDate(weekEndDateObj)}`);
    console.log(`   Days Overdue: ${daysOverdue}`);
    console.log('');

    // Build where clause
    const whereClause = {
      weekStart: weekStart,
      weekEnd: weekEnd,
    };

    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    // Find all timesheets submitted for this week
    const submittedTimesheets = await models.Timesheet.findAll({
      where: whereClause,
      attributes: ['employeeId'],
      raw: true,
    });

    const submittedEmployeeIds = new Set(
      submittedTimesheets.map(ts => ts.employeeId.toString())
    );

    console.log(`✅ Found ${submittedEmployeeIds.size} submitted timesheet(s) for this week`);
    console.log('');

    // Find all active employees
    const employeeWhere = {
      status: 'active',
    };

    if (tenantId) {
      employeeWhere.tenantId = tenantId;
    }

    const allEmployees = await models.Employee.findAll({
      where: employeeWhere,
      include: [
        {
          model: models.User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName'],
          required: false,
        },
        {
          model: models.Tenant,
          as: 'tenant',
          attributes: ['id', 'tenantName'],
          required: true,
        },
      ],
    });

    console.log(`👥 Found ${allEmployees.length} active employee(s)`);
    console.log('');

    // Filter employees who haven't submitted
    const employeesNeedingReminders = allEmployees.filter(emp => {
      const empId = emp.id.toString();
      return !submittedEmployeeIds.has(empId) && emp.user && emp.user.email;
    });

    console.log(`📧 ${employeesNeedingReminders.length} employee(s) need reminder emails`);
    console.log('');

    if (employeesNeedingReminders.length === 0) {
      console.log('✅ No reminders needed. All employees have submitted their timesheets.');
      return {
        success: true,
        remindersSent: 0,
        message: 'No reminders needed',
      };
    }

    // Send reminder emails
    const results = [];
    const weekRange = formatWeekRange(weekStart, weekEnd);
    const weekEndDateFormatted = formatDate(weekEndDateObj);
    const frontendUrl = process.env.FRONTEND_URL || 'https://app.timepulse.io';

    for (const employee of employeesNeedingReminders) {
      try {
        const employeeName = `${employee.firstName} ${employee.lastName}`;
        const employeeEmail = employee.user.email;
        const tenantName = employee.tenant?.tenantName || 'Your Company';
        
        // Generate timesheet link
        const timesheetLink = `${frontendUrl}/timesheets?week=${weekEnd}`;

        console.log(`📨 Sending reminder to: ${employeeName} (${employeeEmail})`);

        await EmailService.sendTimesheetReminder({
          employeeEmail,
          employeeName,
          weekRange,
          weekEndDate: weekEndDateFormatted,
          daysOverdue,
          timesheetLink,
          tenantName,
        });

        results.push({
          success: true,
          employeeId: employee.id,
          employeeName,
          employeeEmail,
        });

        console.log(`   ✅ Reminder sent successfully`);
      } catch (error) {
        console.error(`   ❌ Failed to send reminder:`, error.message);
        results.push({
          success: false,
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          employeeEmail: employee.user?.email,
          error: error.message,
        });
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 Summary');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Total reminders sent: ${results.filter(r => r.success).length}`);
    console.log(`Total failures: ${results.filter(r => !r.success).length}`);
    console.log('');

    return {
      success: true,
      remindersSent: results.filter(r => r.success).length,
      failures: results.filter(r => !r.success).length,
      results,
    };
  } catch (error) {
    console.error('❌ Error sending reminders:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('⏰ Timesheet Reminder Script');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    // Get week end date from command line or use previous week
    const weekEndDateArg = process.argv[2];
    let weekEndDate;

    if (weekEndDateArg) {
      weekEndDate = new Date(weekEndDateArg);
      if (isNaN(weekEndDate.getTime())) {
        console.error('❌ Invalid date format. Use YYYY-MM-DD format.');
        process.exit(1);
      }
    } else {
      // Default: Check previous week (last Sunday)
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
      const daysToLastSunday = dayOfWeek === 0 ? 7 : dayOfWeek; // If today is Sunday, go back 7 days
      weekEndDate = new Date(today);
      weekEndDate.setDate(today.getDate() - daysToLastSunday);
      weekEndDate.setHours(23, 59, 59, 999);
    }

    // Get tenant ID from command line (optional)
    const tenantId = process.argv[3] || null;

    if (tenantId) {
      console.log(`🏢 Tenant ID: ${tenantId}`);
      console.log('');
    }

    const result = await sendRemindersForWeek(weekEndDate, tenantId);

    console.log('✅ Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  const { sequelize } = require('../models');
  main().then(() => {
    // Close database connection
    sequelize.close();
  }).catch((error) => {
    console.error('Unhandled error:', error);
    sequelize.close();
    process.exit(1);
  });
}

module.exports = { sendRemindersForWeek };

