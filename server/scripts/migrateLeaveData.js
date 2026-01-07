/**
 * Script to migrate leave data from vacation/sick to sick/casual/earned
 */

const { sequelize } = require('../models');

async function migrateData() {
  try {
    console.log('🔄 Starting leave data migration...\n');
    
    // Step 1: Update vacation to casual with 6 days
    console.log('📝 Step 1: Converting vacation leave to casual leave...');
    const [vacationBalanceUpdated] = await sequelize.query(`
      UPDATE leave_balances 
      SET leave_type = 'casual', 
          total_days = 6,
          used_days = CASE WHEN used_days > 6 THEN 6 ELSE used_days END,
          pending_days = CASE WHEN pending_days > 6 THEN 6 ELSE pending_days END,
          updated_at = NOW()
      WHERE leave_type = 'vacation'
    `);
    console.log(`✅ Updated ${vacationBalanceUpdated.rowCount || 0} vacation leave balances to casual\n`);
    
    // Step 2: Update sick leave to 6 days
    console.log('📝 Step 2: Updating sick leave to 6 days...');
    const [sickUpdated] = await sequelize.query(`
      UPDATE leave_balances 
      SET total_days = 6,
          updated_at = NOW()
      WHERE leave_type = 'sick'
    `);
    console.log(`✅ Updated ${sickUpdated.rowCount || 0} sick leave balances to 6 days\n`);
    
    // Step 3: Create earned leave for all employees
    console.log('📝 Step 3: Creating earned leave balances...');
    const [earnedCreated] = await sequelize.query(`
      INSERT INTO leave_balances (id, employee_id, tenant_id, year, leave_type, total_days, used_days, pending_days, carry_forward_days, created_at, updated_at)
      SELECT 
          gen_random_uuid() as id,
          employee_id,
          tenant_id,
          year,
          'earned' as leave_type,
          6 as total_days,
          0 as used_days,
          0 as pending_days,
          0 as carry_forward_days,
          NOW() as created_at,
          NOW() as updated_at
      FROM leave_balances
      WHERE leave_type = 'sick'
      AND NOT EXISTS (
          SELECT 1 FROM leave_balances lb2 
          WHERE lb2.employee_id = leave_balances.employee_id 
          AND lb2.tenant_id = leave_balances.tenant_id 
          AND lb2.year = leave_balances.year 
          AND lb2.leave_type = 'earned'
      )
      ON CONFLICT DO NOTHING
    `);
    console.log(`✅ Created ${earnedCreated.rowCount || 0} earned leave balance records\n`);
    
    // Step 4: Update leave requests
    console.log('📝 Step 4: Updating leave requests...');
    const [requestsUpdated] = await sequelize.query(`
      UPDATE leave_requests 
      SET leave_type = 'casual',
          updated_at = NOW()
      WHERE leave_type = 'vacation'
    `);
    console.log(`✅ Updated ${requestsUpdated.rowCount || 0} leave requests from vacation to casual\n`);
    
    // Verification
    console.log('📊 Verification:\n');
    
    const [balanceCounts] = await sequelize.query(`
      SELECT leave_type, COUNT(*) as count, SUM(total_days) as total_days 
      FROM leave_balances 
      GROUP BY leave_type 
      ORDER BY leave_type
    `);
    
    console.log('Leave Balance Summary:');
    balanceCounts.forEach(b => {
      console.log(`  - ${b.leave_type}: ${b.count} records, ${b.total_days} total days`);
    });
    
    const [requestCounts] = await sequelize.query(`
      SELECT leave_type, COUNT(*) as count 
      FROM leave_requests 
      GROUP BY leave_type 
      ORDER BY leave_type
    `);
    
    console.log('\nLeave Request Summary:');
    requestCounts.forEach(r => {
      console.log(`  - ${r.leave_type}: ${r.count} requests`);
    });
    
    console.log('\n✅ Data migration completed successfully!');
    console.log('📌 New leave structure: Sick (6 days), Casual (6 days), Earned (6 days) = 18 days total\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
migrateData();
