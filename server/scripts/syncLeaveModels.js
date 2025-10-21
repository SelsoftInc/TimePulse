/**
 * Sync Leave Management Models with Database
 * This script creates/updates the leave_requests and leave_balances tables
 */

const { models, sequelize } = require('../models');

async function syncLeaveModels() {
  try {
    console.log('🔄 Starting Leave Management models sync...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync LeaveBalance model
    console.log('\n📋 Syncing LeaveBalance model...');
    await models.LeaveBalance.sync({ alter: true });
    console.log('✅ LeaveBalance table synced');
    
    // Sync LeaveRequest model
    console.log('\n📋 Syncing LeaveRequest model...');
    await models.LeaveRequest.sync({ alter: true });
    console.log('✅ LeaveRequest table synced');
    
    // Verify tables exist
    const [leaveBalances] = await sequelize.query(
      "SELECT COUNT(*) FROM leave_balances"
    );
    const [leaveRequests] = await sequelize.query(
      "SELECT COUNT(*) FROM leave_requests"
    );
    
    console.log('\n✅ Verification:');
    console.log(`   - leave_balances table: ${leaveBalances[0].count} records`);
    console.log(`   - leave_requests table: ${leaveRequests[0].count} records`);
    
    console.log('\n🎉 Leave Management models synced successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing Leave Management models:', error);
    process.exit(1);
  }
}

syncLeaveModels();
