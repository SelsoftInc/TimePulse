/**
 * Verify account_requests table structure
 * Check if all required columns exist
 */

const { connectDB } = require('../models');
const { sequelize } = require('../models');

async function verifyTable() {
  try {
    console.log('🔍 Connecting to database...');
    await connectDB();
    
    console.log('📋 Checking account_requests table structure...');
    
    // Get table description
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'account_requests'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n✅ Table structure:');
    console.log('==================');
    results.forEach(col => {
      console.log(`${col.column_name.padEnd(25)} | ${col.data_type.padEnd(20)} | Nullable: ${col.is_nullable}`);
    });
    
    // Check for required columns
    const requiredColumns = [
      'id', 'first_name', 'last_name', 'email', 'phone', 
      'country_code', 'password_hash', 'requested_role', 
      'status', 'created_at', 'updated_at'
    ];
    
    const existingColumns = results.map(r => r.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('\n❌ Missing columns:', missingColumns);
    } else {
      console.log('\n✅ All required columns exist');
    }
    
    // Check if table has any data
    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as count FROM account_requests;
    `);
    
    console.log(`\n📊 Total records: ${countResult[0].count}`);
    
    // Check pending requests
    const [pendingResult] = await sequelize.query(`
      SELECT COUNT(*) as count FROM account_requests WHERE status = 'pending';
    `);
    
    console.log(`📊 Pending requests: ${pendingResult[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

verifyTable();
