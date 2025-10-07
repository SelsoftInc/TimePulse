/**
 * Complete setup for PostgreSQL - Create timesheet data
 */

const { models, connectDB, sequelize } = require('../models');

async function setupPostgresTimesheet() {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('STEP 1: Check/Add Missing Columns');
    console.log('═══════════════════════════════════════════════════════\n');

    // Check columns using PostgreSQL syntax
    const [columns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'timesheets'
    `);
    
    const columnNames = columns.map(col => col.column_name);
    console.log('Current columns:', columnNames.join(', '));

    // Add missing columns for PostgreSQL
    const requiredColumns = [
      { name: 'notes', sql: 'ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS notes TEXT;' },
      { name: 'attachments', sql: 'ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS attachments TEXT DEFAULT \'[]\';' },
      { name: 'submitted_at', sql: 'ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;' },
      { name: 'approved_at', sql: 'ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;' },
      { name: 'reviewer_id', sql: 'ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES users(id);' },
      { name: 'approved_by', sql: 'ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);' },
      { name: 'rejection_reason', sql: 'ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS rejection_reason TEXT;' }
    ];

    for (const col of requiredColumns) {
      if (!columnNames.includes(col.name)) {
        try {
          await sequelize.query(col.sql);
          console.log(`✅ Added column: ${col.name}`);
        } catch (err) {
          if (err.message.includes('already exists')) {
            console.log(`✓  Column ${col.name} already exists`);
          } else {
            console.log(`⚠️  ${col.name}: ${err.message}`);
          }
        }
      } else {
        console.log(`✓  Column ${col.name} exists`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('STEP 2: Find Users');
    console.log('═══════════════════════════════════════════════════════\n');

    const selvakumarUser = await models.User.findOne({
      where: { email: 'selvakumar@selsoftinc.com' }
    });

    if (!selvakumarUser) {
      console.error('❌ Selvakumar user not found');
      process.exit(1);
    }

    console.log('✅ Selvakumar User:', {
      id: selvakumarUser.id,
      email: selvakumarUser.email,
      role: selvakumarUser.role,
      tenantId: selvakumarUser.tenantId
    });

    const pushbanUser = await models.User.findOne({
      where: { email: 'pushban@selsoftinc.com' }
    });

    if (!pushbanUser) {
      console.error('❌ Pushban user not found');
      process.exit(1);
    }

    console.log('✅ Pushban User (Reviewer):', {
      id: pushbanUser.id,
      email: pushbanUser.email,
      role: pushbanUser.role
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('STEP 3: Find/Link Employee Record');
    console.log('═══════════════════════════════════════════════════════\n');

    const employee = await models.Employee.findOne({
      where: {
        email: 'selvakumar@selsoftinc.com',
        tenantId: selvakumarUser.tenantId
      }
    });

    if (!employee) {
      console.error('❌ Employee record not found');
      process.exit(1);
    }

    console.log('✅ Employee Record:', {
      id: employee.id,
      name: `${employee.firstName} ${employee.lastName}`,
      email: employee.email,
      department: employee.department
    });

    // Link user to employee if not already linked
    if (selvakumarUser.employeeId !== employee.id) {
      console.log('\n🔗 Linking user to employee record...');
      await selvakumarUser.update({ employeeId: employee.id });
      console.log('✅ User linked to employee record');
    } else {
      console.log('✓  User already linked to employee');
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('STEP 4: Create/Update Timesheet');
    console.log('═══════════════════════════════════════════════════════\n');

    // Delete existing timesheet for this week if any
    await models.Timesheet.destroy({
      where: {
        tenantId: selvakumarUser.tenantId,
        employeeId: employee.id,
        weekStart: '2025-09-29',
        weekEnd: '2025-10-05'
      }
    });

    // Create new timesheet
    const timesheet = await models.Timesheet.create({
      tenantId: selvakumarUser.tenantId,
      employeeId: employee.id,
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
      reviewerId: pushbanUser.id,
      notes: 'Worked on TimePulse timesheet approval feature implementation',
      submittedAt: new Date()
    });

    console.log('✅ Created timesheet:', {
      id: timesheet.id,
      weekStart: timesheet.weekStart,
      weekEnd: timesheet.weekEnd,
      status: timesheet.status,
      totalHours: timesheet.totalHours,
      reviewerId: timesheet.reviewerId
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('STEP 5: Verify Setup');
    console.log('═══════════════════════════════════════════════════════\n');

    // Verify timesheet can be fetched
    const verifyTimesheet = await models.Timesheet.findByPk(timesheet.id, {
      include: [
        { model: models.Employee, as: 'employee', attributes: ['firstName', 'lastName', 'email'] },
        { model: models.User, as: 'reviewer', attributes: ['firstName', 'lastName', 'email', 'role'], required: false }
      ]
    });

    console.log('✅ Verification successful!');
    console.log('\n📊 TIMESHEET DETAILS:');
    console.log('   ID:', verifyTimesheet.id);
    console.log('   Employee:', `${verifyTimesheet.employee.firstName} ${verifyTimesheet.employee.lastName}`);
    console.log('   Week: Sep 29, 2025 - Oct 05, 2025');
    console.log('   Status:', verifyTimesheet.status.toUpperCase());
    console.log('   Total Hours:', verifyTimesheet.totalHours);
    if (verifyTimesheet.reviewer) {
      console.log('   Reviewer:', `${verifyTimesheet.reviewer.firstName} ${verifyTimesheet.reviewer.lastName} (${verifyTimesheet.reviewer.role})`);
    }
    console.log('   Submitted:', verifyTimesheet.submittedAt);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🎯 NEXT STEPS');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n1. ✅ Database is ready');
    console.log('2. ✅ Timesheet created for Selvakumar');
    console.log('3. ✅ Assigned to Pushban for review');
    console.log('\n📋 TO TEST:');
    console.log('   • Restart backend server (Ctrl+C, then npm start)');
    console.log('   • Logout and login as: selvakumar@selsoftinc.com');
    console.log('   • Go to: Timesheets page');
    console.log('   • You should see: 1 timesheet (Sep 29 - Oct 05)');
    console.log('   • Status: Submitted for Approval');
    console.log('\n💡 API Endpoint:');
    console.log(`   GET /api/timesheets/employee/${employee.id}/all?tenantId=${selvakumarUser.tenantId}`);
    console.log('\n✅ Setup complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setupPostgresTimesheet();
