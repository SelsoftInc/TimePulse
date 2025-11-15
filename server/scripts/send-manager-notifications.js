/**
 * Script to send notifications to managers:
 * 1. Employees with missing timesheets (after 2 days of week end)
 * 2. Timesheets pending approval (after 2 days of submission)
 * 
 * Usage:
 *   node server/scripts/send-manager-notifications.js [tenantId]
 */

require('dotenv').config();
const models = require('../models');
const EmailService = require('../services/EmailService');
const { Op } = require('sequelize');

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

// Calculate days pending
const calculateDaysPending = (submittedDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const submitted = new Date(submittedDate);
  submitted.setHours(0, 0, 0, 0);
  const diffTime = today - submitted;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

/**
 * Send reminders to managers about employees with missing timesheets
 * (Only if timesheet is overdue by 2+ days)
 */
async function sendMissingTimesheetReminders(tenantId = null) {
  try {
    console.log('📋 Checking for missing timesheets (2+ days overdue)...');
    
    // Get previous week (last Sunday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToLastSunday = dayOfWeek === 0 ? 7 : dayOfWeek;
    const lastSunday = new Date(today);
    lastSunday.setDate(today.getDate() - daysToLastSunday);
    lastSunday.setHours(23, 59, 59, 999);
    
    const { weekStart, weekEnd, weekEndDate: weekEndDateObj } = getWeekRangeMonToSun(lastSunday);
    const daysOverdue = calculateDaysOverdue(weekEnd);
    
    // Only send if 2+ days overdue
    if (daysOverdue < 2) {
      console.log(`   ⏭️  Skipping: Only ${daysOverdue} day(s) overdue (need 2+ days)`);
      return { sent: 0, skipped: true };
    }
    
    console.log(`   Week: ${formatWeekRange(weekStart, weekEnd)}`);
    console.log(`   Days Overdue: ${daysOverdue}`);
    console.log('');

    // Find submitted timesheets
    const whereClause = {
      weekStart,
      weekEnd,
    };
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const submittedTimesheets = await models.Timesheet.findAll({
      where: whereClause,
      attributes: ['employeeId'],
      raw: true,
    });

    const submittedEmployeeIds = new Set(
      submittedTimesheets.map(ts => ts.employeeId.toString())
    );

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
          attributes: ['id', 'email', 'firstName', 'lastName', 'managerId'],
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

    // Filter employees who haven't submitted
    const employeesNeedingReminders = allEmployees.filter(emp => {
      const empId = emp.id.toString();
      return !submittedEmployeeIds.has(empId) && emp.user && emp.user.email;
    });

    if (employeesNeedingReminders.length === 0) {
      console.log('   ✅ No missing timesheets found');
      return { sent: 0, skipped: false };
    }

    console.log(`   Found ${employeesNeedingReminders.length} employee(s) with missing timesheets`);

    // Group employees by manager/reviewer
    const managerGroups = new Map();

    for (const employee of employeesNeedingReminders) {
      let managerId = null;
      let manager = null;

      // Try to find manager from employee relationships
      try {
        const relationship = await models.EmployeeRelationship.findOne({
          where: {
            employeeId: employee.id,
            relationshipType: { [Op.in]: ['manager', 'timesheet_approver'] },
            isPrimary: true,
          },
          include: [
            {
              model: models.User,
              as: 'relatedUser',
              attributes: ['id', 'email', 'firstName', 'lastName'],
              required: false,
            },
          ],
        });

        if (relationship) {
          // Check if relatedUser is populated
          const relatedUserId = relationship.relatedUserId || relationship.related_user_id;
          if (relatedUserId) {
            manager = await models.User.findByPk(relatedUserId, {
              attributes: ['id', 'email', 'firstName', 'lastName'],
            });
            if (manager) {
              managerId = manager.id.toString();
            }
          }
        }
      } catch (err) {
        // EmployeeRelationship might not exist or have issues, continue
        console.log(`   ⚠️  Could not find manager via EmployeeRelationship for ${employee.id}: ${err.message}`);
      }

      // Fallback: Use User.managerId
      if (!manager && employee.user && employee.user.managerId) {
        try {
          manager = await models.User.findByPk(employee.user.managerId, {
            attributes: ['id', 'email', 'firstName', 'lastName'],
          });
          if (manager) {
            managerId = manager.id.toString();
          }
        } catch (err) {
          // Manager not found, continue
        }
      }

      // Fallback: Use tenant admins/managers
      if (!manager) {
        try {
          const admins = await models.User.findAll({
            where: {
              tenantId: employee.tenantId,
              role: { [Op.in]: ['admin', 'manager'] },
            },
            attributes: ['id', 'email', 'firstName', 'lastName'],
            limit: 1,
          });
          if (admins.length > 0) {
            manager = admins[0];
            managerId = manager.id.toString();
          }
        } catch (err) {
          // No admins found
        }
      }

      if (manager && manager.email) {
        if (!managerGroups.has(managerId)) {
          managerGroups.set(managerId, {
            manager,
            employees: [],
            tenant: employee.tenant,
          });
        }
        managerGroups.get(managerId).employees.push({
          name: `${employee.firstName} ${employee.lastName}`,
          email: employee.user.email,
        });
      }
    }

    console.log(`   Found ${managerGroups.size} manager(s) to notify`);
    console.log('');

    // Send emails to managers
    const results = [];
    const weekRange = formatWeekRange(weekStart, weekEnd);
    const weekEndDateFormatted = formatDate(weekEndDateObj);

    for (const [managerId, group] of managerGroups) {
      try {
        const managerName = `${group.manager.firstName} ${group.manager.lastName}`;
        const tenantName = group.tenant?.tenantName || 'Your Company';

        console.log(`📨 Sending reminder to manager: ${managerName} (${group.manager.email})`);
        console.log(`   Employees: ${group.employees.length}`);

        await EmailService.sendManagerTimesheetReminder({
          managerEmail: group.manager.email,
          managerName,
          missingEmployees: group.employees,
          weekRange,
          weekEndDate: weekEndDateFormatted,
          daysOverdue,
          tenantName,
        });

        results.push({
          success: true,
          managerId,
          managerName,
          managerEmail: group.manager.email,
          employeeCount: group.employees.length,
        });

        console.log(`   ✅ Reminder sent successfully`);
      } catch (error) {
        console.error(`   ❌ Failed to send reminder:`, error.message);
        results.push({
          success: false,
          managerId,
          managerName: `${group.manager.firstName} ${group.manager.lastName}`,
          managerEmail: group.manager.email,
          error: error.message,
        });
      }
    }

    return {
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  } catch (error) {
    console.error('❌ Error sending missing timesheet reminders:', error);
    throw error;
  }
}

/**
 * Send reminders to managers about pending approvals
 * (Only if timesheet is pending for 2+ days)
 */
async function sendPendingApprovalReminders(tenantId = null) {
  try {
    console.log('📋 Checking for pending approvals (2+ days pending)...');
    
    // Calculate date 2 days ago
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);

    const whereClause = {
      status: 'submitted',
      submittedAt: {
        [Op.lte]: twoDaysAgo.toISOString(),
      },
    };

    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    // Find pending timesheets
    const pendingTimesheets = await models.Timesheet.findAll({
      where: whereClause,
      include: [
        {
          model: models.Employee,
          as: 'employee',
          attributes: ['id', 'firstName', 'lastName'],
          include: [
            {
              model: models.User,
              as: 'user',
              attributes: ['id', 'email'],
            },
          ],
        },
        {
          model: models.User,
          as: 'reviewer',
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

    if (pendingTimesheets.length === 0) {
      console.log('   ✅ No pending approvals found (2+ days)');
      return { sent: 0, skipped: false };
    }

    console.log(`   Found ${pendingTimesheets.length} timesheet(s) pending approval`);

    // Group by reviewer
    const reviewerGroups = new Map();

    for (const timesheet of pendingTimesheets) {
      let reviewer = timesheet.reviewer;
      let reviewerId = null;

      // If no reviewer assigned, find one
      if (!reviewer) {
        // Try to find from employee relationships
        try {
          const relationship = await models.EmployeeRelationship.findOne({
            where: {
              employeeId: timesheet.employeeId,
              relationshipType: { [Op.in]: ['manager', 'timesheet_approver'] },
              isPrimary: true,
            },
          });

          if (relationship) {
            const relatedUserId = relationship.relatedUserId || relationship.related_user_id;
            if (relatedUserId) {
              reviewer = await models.User.findByPk(relatedUserId, {
                attributes: ['id', 'email', 'firstName', 'lastName'],
              });
            }
          }
        } catch (err) {
          // Continue
        }

        // Fallback: Use tenant admins
        if (!reviewer) {
          try {
            const admins = await models.User.findAll({
              where: {
                tenantId: timesheet.tenantId,
                role: { [Op.in]: ['admin', 'manager'] },
              },
              attributes: ['id', 'email', 'firstName', 'lastName'],
              limit: 1,
            });
            if (admins.length > 0) {
              reviewer = admins[0];
            }
          } catch (err) {
            // Continue
          }
        }
      }

      if (reviewer && reviewer.email) {
        reviewerId = reviewer.id.toString();
        const daysPending = calculateDaysPending(timesheet.submittedAt);
        const weekRange = formatWeekRange(timesheet.weekStart, timesheet.weekEnd);
        const submittedDate = formatDate(new Date(timesheet.submittedAt));

        if (!reviewerGroups.has(reviewerId)) {
          reviewerGroups.set(reviewerId, {
            reviewer,
            timesheets: [],
            tenant: timesheet.tenant,
          });
        }

        reviewerGroups.get(reviewerId).timesheets.push({
          employeeName: `${timesheet.employee.firstName} ${timesheet.employee.lastName}`,
          weekRange,
          submittedDate,
          daysPending,
        });
      }
    }

    console.log(`   Found ${reviewerGroups.size} reviewer(s) to notify`);
    console.log('');

    // Send emails
    const results = [];

    for (const [reviewerId, group] of reviewerGroups) {
      try {
        const reviewerName = `${group.reviewer.firstName} ${group.reviewer.lastName}`;
        const tenantName = group.tenant?.tenantName || 'Your Company';

        console.log(`📨 Sending pending approval reminder to: ${reviewerName} (${group.reviewer.email})`);
        console.log(`   Pending timesheets: ${group.timesheets.length}`);

        await EmailService.sendPendingApprovalReminder({
          managerEmail: group.reviewer.email,
          managerName: reviewerName,
          pendingTimesheets: group.timesheets,
          tenantName,
        });

        results.push({
          success: true,
          reviewerId,
          reviewerName,
          reviewerEmail: group.reviewer.email,
          timesheetCount: group.timesheets.length,
        });

        console.log(`   ✅ Reminder sent successfully`);
      } catch (error) {
        console.error(`   ❌ Failed to send reminder:`, error.message);
        results.push({
          success: false,
          reviewerId,
          reviewerName: `${group.reviewer.firstName} ${group.reviewer.lastName}`,
          reviewerEmail: group.reviewer.email,
          error: error.message,
        });
      }
    }

    return {
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  } catch (error) {
    console.error('❌ Error sending pending approval reminders:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('📧 Manager Notification Script');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    const tenantId = process.argv[2] || null;
    if (tenantId) {
      console.log(`🏢 Tenant ID: ${tenantId}`);
      console.log('');
    }

    // Send missing timesheet reminders
    console.log('1️⃣  Missing Timesheet Reminders');
    console.log('───────────────────────────────────────────────────────');
    const missingResult = await sendMissingTimesheetReminders(tenantId);
    console.log('');

    // Send pending approval reminders
    console.log('2️⃣  Pending Approval Reminders');
    console.log('───────────────────────────────────────────────────────');
    const pendingResult = await sendPendingApprovalReminders(tenantId);
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 Summary');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Missing Timesheet Reminders: ${missingResult.sent} sent, ${missingResult.failed || 0} failed`);
    console.log(`Pending Approval Reminders: ${pendingResult.sent} sent, ${pendingResult.failed || 0} failed`);
    console.log('');

    console.log('✅ Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().then(() => {
    models.sequelize.close();
  }).catch((error) => {
    console.error('Unhandled error:', error);
    models.sequelize.close();
    process.exit(1);
  });
}

module.exports = { sendMissingTimesheetReminders, sendPendingApprovalReminders };

