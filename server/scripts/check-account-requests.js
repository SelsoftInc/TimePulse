/**
 * Check Account Requests Table
 * Verify the account_requests table structure and data
 */

const { models, sequelize } = require('../models');
const { AccountRequest, User } = models;

async function checkAccountRequests() {
  try {
    console.log('🔍 Checking account_requests table...\n');

    // Check if table exists (PostgreSQL compatible)
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'account_requests';
    `);

    if (results.length === 0) {
      console.log('❌ Table account_requests does not exist!');
      console.log('Creating table...');
      await AccountRequest.sync({ force: false });
      console.log('✅ Table created successfully');
    } else {
      console.log('✅ Table account_requests exists');
    }

    // Check table structure (PostgreSQL compatible)
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'account_requests'
      ORDER BY ordinal_position;
    `);
    console.log('\n📋 Table Structure:');
    console.table(columns.map(col => ({
      name: col.column_name,
      type: col.data_type,
      nullable: col.is_nullable,
      default: col.column_default
    })));

    // Check for data
    const count = await AccountRequest.count();
    console.log(`\n📊 Total account requests: ${count}`);

    if (count > 0) {
      const requests = await AccountRequest.findAll({
        order: [['created_at', 'DESC']],
        limit: 5,
        raw: true
      });

      console.log('\n📝 Recent Account Requests:');
      console.table(requests.map(req => ({
        id: req.id.substring(0, 8) + '...',
        email: req.email,
        status: req.status,
        role: req.requested_role,
        created: new Date(req.created_at).toLocaleString()
      })));
    } else {
      console.log('\n⚠️ No account requests found in database');
    }

    console.log('\n✅ Check completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking account requests:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

checkAccountRequests();
