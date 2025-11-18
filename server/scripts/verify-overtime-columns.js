/**
 * Verification script to check if overtime columns exist in timesheets table
 * Run this with: node scripts/verify-overtime-columns.js
 */

const { sequelize } = require('../models');

async function verifyColumns() {
  try {
    console.log('🔍 Checking if overtime columns exist in timesheets table...\n');
    
    // Query to check if columns exist
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'timesheets'
      AND column_name IN ('overtime_comment', 'overtime_days')
      ORDER BY column_name;
    `);
    
    console.log('📊 Found columns:', results);
    
    if (results.length === 0) {
      console.log('\n❌ Overtime columns NOT found in database!');
      console.log('📝 Running ALTER TABLE to add columns...\n');
      
      // Add the columns
      await sequelize.query(`
        ALTER TABLE timesheets 
        ADD COLUMN IF NOT EXISTS overtime_comment TEXT;
      `);
      console.log('✅ Added overtime_comment column');
      
      await sequelize.query(`
        ALTER TABLE timesheets 
        ADD COLUMN IF NOT EXISTS overtime_days JSONB;
      `);
      console.log('✅ Added overtime_days column');
      
      console.log('\n🎉 Overtime columns added successfully!');
    } else if (results.length === 2) {
      console.log('\n✅ Both overtime columns exist in the database!');
      console.log('   - overtime_comment:', results.find(r => r.column_name === 'overtime_comment')?.data_type);
      console.log('   - overtime_days:', results.find(r => r.column_name === 'overtime_days')?.data_type);
    } else {
      console.log('\n⚠️ Only partial columns found. Adding missing columns...');
      
      const hasComment = results.some(r => r.column_name === 'overtime_comment');
      const hasDays = results.some(r => r.column_name === 'overtime_days');
      
      if (!hasComment) {
        await sequelize.query(`ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS overtime_comment TEXT;`);
        console.log('✅ Added overtime_comment column');
      }
      
      if (!hasDays) {
        await sequelize.query(`ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS overtime_days JSONB;`);
        console.log('✅ Added overtime_days column');
      }
    }
    
    // Verify again
    console.log('\n🔍 Final verification...');
    const [finalResults] = await sequelize.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'timesheets'
      AND column_name IN ('overtime_comment', 'overtime_days')
      ORDER BY column_name;
    `);
    
    console.log('📊 Final columns:', finalResults);
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

verifyColumns();
