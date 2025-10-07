/**
 * Create test timesheet for Selvakumar with Pushpan as reviewer
 */

const { models, connectDB } = require('../models');

async function createTestTimesheet() {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    // Find Selvakumar's user and employee records
    const selvakumarUser = await models.User.findOne({
      where: { email: 'selvakumar@selsoftinc.com' }
    });

    if (!selvakumarUser) {
      console.error('❌ Selvakumar user not found with email: selvakumar@selsoftinc.com');
      process.exit(1);
    }

    console.log('✅ Found Selvakumar user:', {
      id: selvakumarUser.id,
      name: `${selvakumarUser.firstName} ${selvakumarUser.lastName}`,
      email: selvakumarUser.email,
      role: selvakumarUser.role
    });

    // Find Selvakumar's employee record
    const selvakumarEmployee = await models.Employee.findOne({
      where: { 
        email: 'selvakumar@selsoftinc.com',
        tenantId: selvakumarUser.tenantId
      }
    });

    if (!selvakumarEmployee) {
      console.error('❌ Selvakumar employee record not found');
      process.exit(1);
    }

    console.log('✅ Found Selvakumar employee:', {
      id: selvakumarEmployee.id,
      name: `${selvakumarEmployee.firstName} ${selvakumarEmployee.lastName}`,
      department: selvakumarEmployee.department
    });

    // Find Pushpan (admin/reviewer)
    const pushpanUser = await models.User.findOne({
      where: { email: 'pushpan@selsoftinc.com' }
    });

    if (!pushpanUser) {
      console.error('❌ Pushpan user not found with email: pushpan@selsoftinc.com');
      process.exit(1);
    }

    console.log('✅ Found Pushpan user (Reviewer):', {
      id: pushpanUser.id,
      name: `${pushpanUser.firstName} ${pushpanUser.lastName}`,
      email: pushpanUser.email,
      role: pushpanUser.role
    });

    // Get client if assigned
    let clientId = null;
    if (selvakumarEmployee.clientId) {
      clientId = selvakumarEmployee.clientId;
      const client = await models.Client.findByPk(clientId);
      if (client) {
        console.log('✅ Employee assigned to client:', client.clientName);
      }
    }

    // Check if timesheet already exists for this week
    const existingTimesheet = await models.Timesheet.findOne({
      where: {
        tenantId: selvakumarUser.tenantId,
        employeeId: selvakumarEmployee.id,
        weekStart: '2025-09-29',
        weekEnd: '2025-10-05'
      }
    });

    if (existingTimesheet) {
      console.log('\n⚠️  Timesheet already exists for this week. Updating it...');
      
      // Update existing timesheet
      existingTimesheet.dailyHours = {
        mon: 8,
        tue: 8,
        wed: 8,
        thu: 8,
        fri: 8,
        sat: 0,
        sun: 0
      };
      existingTimesheet.totalHours = 40;
      existingTimesheet.status = 'submitted';
      existingTimesheet.reviewerId = pushpanUser.id;
      existingTimesheet.notes = 'Worked on TimePulse timesheet approval feature implementation';
      existingTimesheet.submittedAt = new Date();
      
      await existingTimesheet.save();
      
      console.log('\n✅ Updated existing timesheet:', {
        id: existingTimesheet.id,
        weekStart: existingTimesheet.weekStart,
        weekEnd: existingTimesheet.weekEnd,
        totalHours: existingTimesheet.totalHours,
        status: existingTimesheet.status,
        reviewerId: existingTimesheet.reviewerId
      });
    } else {
      // Create new timesheet
      const timesheet = await models.Timesheet.create({
        tenantId: selvakumarUser.tenantId,
        employeeId: selvakumarEmployee.id,
        clientId: clientId,
        weekStart: '2025-09-29',
        weekEnd: '2025-10-05',
        dailyHours: {
          mon: 8,
          tue: 8,
          wed: 8,
          thu: 8,
          fri: 8,
          sat: 0,
          sun: 0
        },
        totalHours: 40,
        status: 'submitted',
        reviewerId: pushpanUser.id,
        notes: 'Worked on TimePulse timesheet approval feature implementation',
        submittedAt: new Date()
      });

      console.log('\n✅ Created new timesheet:', {
        id: timesheet.id,
        weekStart: timesheet.weekStart,
        weekEnd: timesheet.weekEnd,
        totalHours: timesheet.totalHours,
        status: timesheet.status,
        reviewerId: timesheet.reviewerId
      });
    }

    console.log('\n📋 Timesheet Details:');
    console.log('   Employee: Selvakumar');
    console.log('   Week: Sep 29, 2025 - Oct 05, 2025');
    console.log('   Hours: Mon-Fri: 8 hours each (Total: 40 hours)');
    console.log('   Status: Submitted for Approval');
    console.log('   Assigned Reviewer: Pushpan (Admin)');
    console.log('   Notes: Worked on TimePulse timesheet approval feature implementation');

    console.log('\n✅ SUCCESS! Timesheet created and submitted.');
    console.log('\n📌 Next Steps:');
    console.log('   1. Login as Pushpan (pushpan@selsoftinc.com)');
    console.log('   2. Navigate to "Timesheet Approval" page');
    console.log('   3. You should see Selvakumar\'s timesheet pending approval');
    console.log('   4. Click "Review" to approve or reject the timesheet');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating timesheet:', error);
    process.exit(1);
  }
}

createTestTimesheet();
