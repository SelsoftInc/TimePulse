/**
 * Complete setup: Add reviewer column and create test timesheet
 */

const { models, connectDB, sequelize } = require('../models');

async function setupAndCreateTimesheet() {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    // Step 1: Add reviewer_id column if it doesn't exist
    console.log('📋 Step 1: Checking/Adding reviewer_id column...');
    try {
      const [results] = await sequelize.query(`PRAGMA table_info(timesheets);`);
      const columnExists = results.some(col => col.name === 'reviewer_id');

      if (!columnExists) {
        await sequelize.query(`ALTER TABLE timesheets ADD COLUMN reviewer_id TEXT REFERENCES users(id);`);
        await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_timesheets_reviewer ON timesheets(reviewer_id);`);
        console.log('✅ Added reviewer_id column and index\n');
      } else {
        console.log('✅ reviewer_id column already exists\n');
      }
    } catch (err) {
      console.log('⚠️  Column might already exist, continuing...\n');
    }

    // Step 2: Find users
    console.log('📋 Step 2: Finding users...');
    
    const selvakumarUser = await models.User.findOne({
      where: { email: 'selvakumar@selsoftinc.com' }
    });

    if (!selvakumarUser) {
      console.error('❌ Selvakumar user not found!');
      console.log('\n💡 Available users:');
      const allUsers = await models.User.findAll({ attributes: ['email', 'firstName', 'lastName', 'role'] });
      allUsers.forEach(u => console.log(`   - ${u.email} (${u.firstName} ${u.lastName}) - ${u.role}`));
      process.exit(1);
    }

    console.log('✅ Found Selvakumar:', {
      email: selvakumarUser.email,
      name: `${selvakumarUser.firstName} ${selvakumarUser.lastName}`,
      role: selvakumarUser.role
    });

    const pushpanUser = await models.User.findOne({
      where: { email: 'pushban@selsoftinc.com' }
    });

    if (!pushpanUser) {
      console.error('❌ Pushban user not found!');
      console.log('\n💡 Available admin/manager users:');
      const admins = await models.User.findAll({ 
        where: { role: ['admin', 'manager'] },
        attributes: ['email', 'firstName', 'lastName', 'role'] 
      });
      admins.forEach(u => console.log(`   - ${u.email} (${u.firstName} ${u.lastName}) - ${u.role}`));
      process.exit(1);
    }

    console.log('✅ Found Pushban (Reviewer):', {
      email: pushpanUser.email,
      name: `${pushpanUser.firstName} ${pushpanUser.lastName}`,
      role: pushpanUser.role
    });

    // Step 3: Find employee record
    console.log('\n📋 Step 3: Finding employee record...');
    
    const selvakumarEmployee = await models.Employee.findOne({
      where: { 
        tenantId: selvakumarUser.tenantId,
        email: 'selvakumar@selsoftinc.com'
      }
    });

    if (!selvakumarEmployee) {
      console.error('❌ Selvakumar employee record not found!');
      console.log('\n💡 Available employees:');
      const allEmployees = await models.Employee.findAll({ 
        where: { tenantId: selvakumarUser.tenantId },
        attributes: ['email', 'firstName', 'lastName', 'department'] 
      });
      allEmployees.forEach(e => console.log(`   - ${e.email} (${e.firstName} ${e.lastName})`));
      process.exit(1);
    }

    console.log('✅ Found Selvakumar employee:', {
      email: selvakumarEmployee.email,
      name: `${selvakumarEmployee.firstName} ${selvakumarEmployee.lastName}`,
      department: selvakumarEmployee.department || 'N/A'
    });

    // Step 4: Create or update timesheet
    console.log('\n📋 Step 4: Creating/Updating timesheet...');
    
    const [timesheet, created] = await models.Timesheet.findOrCreate({
      where: {
        tenantId: selvakumarUser.tenantId,
        employeeId: selvakumarEmployee.id,
        weekStart: '2025-09-29',
        weekEnd: '2025-10-05'
      },
      defaults: {
        tenantId: selvakumarUser.tenantId,
        employeeId: selvakumarEmployee.id,
        clientId: null,
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
        notes: 'Worked on TimePulse timesheet approval feature implementation. Completed employee timesheet submission with reviewer assignment and admin approval workflow.',
        submittedAt: new Date()
      }
    });

    if (!created) {
      // Update existing timesheet
      timesheet.dailyHours = {
        mon: 8,
        tue: 8,
        wed: 8,
        thu: 8,
        fri: 8,
        sat: 0,
        sun: 0
      };
      timesheet.totalHours = 40;
      timesheet.status = 'submitted';
      timesheet.reviewerId = pushpanUser.id;
      timesheet.notes = 'Worked on TimePulse timesheet approval feature implementation. Completed employee timesheet submission with reviewer assignment and admin approval workflow.';
      timesheet.submittedAt = new Date();
      await timesheet.save();
      console.log('✅ Updated existing timesheet');
    } else {
      console.log('✅ Created new timesheet');
    }

    // Step 5: Verify the timesheet
    console.log('\n📋 Step 5: Verifying timesheet...');
    
    const verifyTimesheet = await models.Timesheet.findByPk(timesheet.id, {
      include: [
        { model: models.Employee, as: 'employee', attributes: ['firstName', 'lastName', 'email'] },
        { model: models.User, as: 'reviewer', attributes: ['firstName', 'lastName', 'email', 'role'] }
      ]
    });

    console.log('\n✅ SUCCESS! Timesheet created and submitted:\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 TIMESHEET DETAILS');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`ID: ${verifyTimesheet.id}`);
    console.log(`Employee: ${verifyTimesheet.employee.firstName} ${verifyTimesheet.employee.lastName}`);
    console.log(`Email: ${verifyTimesheet.employee.email}`);
    console.log(`Week: September 29, 2025 - October 05, 2025`);
    console.log(`Status: ${verifyTimesheet.status.toUpperCase()}`);
    console.log('\n📅 DAILY HOURS:');
    console.log(`   Monday:    ${verifyTimesheet.dailyHours.mon} hours`);
    console.log(`   Tuesday:   ${verifyTimesheet.dailyHours.tue} hours`);
    console.log(`   Wednesday: ${verifyTimesheet.dailyHours.wed} hours`);
    console.log(`   Thursday:  ${verifyTimesheet.dailyHours.thu} hours`);
    console.log(`   Friday:    ${verifyTimesheet.dailyHours.fri} hours`);
    console.log(`   Saturday:  ${verifyTimesheet.dailyHours.sat} hours`);
    console.log(`   Sunday:    ${verifyTimesheet.dailyHours.sun} hours`);
    console.log(`   ─────────────────────────────`);
    console.log(`   TOTAL:     ${verifyTimesheet.totalHours} hours`);
    console.log('\n👤 ASSIGNED REVIEWER:');
    console.log(`   Name: ${verifyTimesheet.reviewer.firstName} ${verifyTimesheet.reviewer.lastName}`);
    console.log(`   Email: ${verifyTimesheet.reviewer.email}`);
    console.log(`   Role: ${verifyTimesheet.reviewer.role.toUpperCase()}`);
    console.log('\n📝 NOTES:');
    console.log(`   ${verifyTimesheet.notes}`);
    console.log('\n⏰ SUBMITTED:');
    console.log('═══════════════════════════════════════════════════════');

    console.log('\n\n🎯 NEXT STEPS:');
    console.log('═══════════════════════════════════════════════════════');
    console.log('1. ✅ Timesheet has been created in the database');
    console.log('\n📌 Next Steps:');
    console.log('   1. Login as Pushban (pushban@selsoftinc.com)');
    console.log('      (Use your password)');
    console.log('   2. 📋 Navigate to: Timesheet Approval page');
    console.log('   3. 👀 You should see Selvakumar\'s timesheet');
    console.log('   4. ✅ Click "Review" to approve or reject');
    console.log('═══════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

setupAndCreateTimesheet();
