/**
 * Script to add 'casual' to the ENUM types
 */

const { sequelize } = require('../models');

async function addCasualToEnum() {
  try {
    console.log('🔄 Adding casual to ENUM types...\n');
    
    // Add casual to leave_balances enum
    try {
      console.log('📝 Adding casual to leave_balances enum...');
      await sequelize.query(`ALTER TYPE enum_leave_balances_leave_type ADD VALUE IF NOT EXISTS 'casual'`);
      console.log('✅ Added casual to leave_balances enum\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  casual already exists in leave_balances enum\n');
      } else {
        throw error;
      }
    }
    
    // Add casual to leave_requests enum
    try {
      console.log('📝 Adding casual to leave_requests enum...');
      await sequelize.query(`ALTER TYPE enum_leave_requests_leave_type ADD VALUE IF NOT EXISTS 'casual'`);
      console.log('✅ Added casual to leave_requests enum\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  casual already exists in leave_requests enum\n');
      } else {
        throw error;
      }
    }
    
    // Verify
    console.log('📊 Verification:\n');
    const [balanceEnums] = await sequelize.query(`
      SELECT unnest(enum_range(NULL::enum_leave_balances_leave_type)) as leave_type
    `);
    console.log('Leave Balance ENUM values:', balanceEnums.map(e => e.leave_type).join(', '));
    
    const [requestEnums] = await sequelize.query(`
      SELECT unnest(enum_range(NULL::enum_leave_requests_leave_type)) as leave_type
    `);
    console.log('Leave Request ENUM values:', requestEnums.map(e => e.leave_type).join(', '));
    
    console.log('\n✅ ENUM update completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

addCasualToEnum();
