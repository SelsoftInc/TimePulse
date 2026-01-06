/**
 * Migration Script: Update Leave Types
 * Migrates from vacation/sick to sick/casual/earned leave types
 * Run with: node scripts/migrateLeaveTypes.js
 */

const { sequelize, models } = require('../models');
const { LeaveBalance, LeaveRequest } = models;

async function migrateLeaveTypes() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔄 Starting leave types migration...');
    
    // Step 1: Update vacation to casual with 6 days
    console.log('📝 Step 1: Converting vacation leave to casual leave...');
    const [vacationUpdated] = await LeaveBalance.update(
      { 
        leaveType: 'casual',
        totalDays: 6
      },
      { 
        where: { leaveType: 'vacation' },
        transaction 
      }
    );
    console.log(`✅ Updated ${vacationUpdated} vacation leave records to casual`);
    
    // Step 2: Update sick leave to 6 days
    console.log('📝 Step 2: Updating sick leave to 6 days...');
    const [sickUpdated] = await LeaveBalance.update(
      { totalDays: 6 },
      { 
        where: { leaveType: 'sick' },
        transaction 
      }
    );
    console.log(`✅ Updated ${sickUpdated} sick leave records to 6 days`);
    
    // Step 3: Create earned leave for all employees
    console.log('📝 Step 3: Creating earned leave balances...');
    const currentYear = new Date().getFullYear();
    
    // Get all unique employee/tenant combinations
    const existingBalances = await LeaveBalance.findAll({
      attributes: ['employeeId', 'tenantId', 'year'],
      where: { leaveType: 'sick' },
      group: ['employeeId', 'tenantId', 'year'],
      transaction
    });
    
    let earnedCreated = 0;
    for (const balance of existingBalances) {
      const [earnedBalance, created] = await LeaveBalance.findOrCreate({
        where: {
          employeeId: balance.employeeId,
          tenantId: balance.tenantId,
          year: balance.year,
          leaveType: 'earned'
        },
        defaults: {
          totalDays: 6,
          usedDays: 0,
          pendingDays: 0,
          carryForwardDays: 0
        },
        transaction
      });
      
      if (created) earnedCreated++;
    }
    console.log(`✅ Created ${earnedCreated} earned leave balance records`);
    
    // Step 4: Update leave requests
    console.log('📝 Step 4: Updating leave requests...');
    const [requestsUpdated] = await LeaveRequest.update(
      { leaveType: 'casual' },
      { 
        where: { leaveType: 'vacation' },
        transaction 
      }
    );
    console.log(`✅ Updated ${requestsUpdated} leave requests from vacation to casual`);
    
    // Commit transaction
    await transaction.commit();
    
    // Verification
    console.log('\n📊 Verification:');
    const balanceCounts = await LeaveBalance.findAll({
      attributes: [
        'leaveType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('totalDays')), 'totalDays']
      ],
      group: ['leaveType']
    });
    
    console.log('Leave Balance Summary:');
    balanceCounts.forEach(b => {
      console.log(`  - ${b.leaveType}: ${b.get('count')} records, ${b.get('totalDays')} total days`);
    });
    
    const requestCounts = await LeaveRequest.findAll({
      attributes: [
        'leaveType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['leaveType']
    });
    
    console.log('\nLeave Request Summary:');
    requestCounts.forEach(r => {
      console.log(`  - ${r.leaveType}: ${r.get('count')} requests`);
    });
    
    console.log('\n✅ Migration completed successfully!');
    console.log('📌 New leave structure: Sick (6 days), Casual (6 days), Earned (6 days) = 18 days total');
    
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Migration failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
migrateLeaveTypes();
