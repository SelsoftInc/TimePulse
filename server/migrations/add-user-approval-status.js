/**
 * Migration: Add approval status fields to users table
 * For OAuth user approval workflow
 * 
 * Run this migration with: node migrations/add-user-approval-status.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { Sequelize } = require('sequelize');

// Database configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'timepulse',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  dialect: 'postgres',
  logging: console.log
};

async function runMigration() {
  const sequelize = new Sequelize(config);

  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    const queryInterface = sequelize.getQueryInterface();

    console.log('\n🔄 Starting migration: Add approval status fields to users table');

    // Check if columns already exist
    const tableDescription = await queryInterface.describeTable('users');
    
    // Add approval_status column
    if (!tableDescription.approval_status) {
      console.log('➕ Adding approval_status column...');
      await queryInterface.addColumn('users', 'approval_status', {
        type: Sequelize.STRING(20),
        defaultValue: 'approved',
        allowNull: false
      });
      console.log('✅ approval_status column added');
    } else {
      console.log('⏭️  approval_status column already exists');
    }

    // Add approved_by column
    if (!tableDescription.approved_by) {
      console.log('➕ Adding approved_by column...');
      await queryInterface.addColumn('users', 'approved_by', {
        type: Sequelize.UUID,
        allowNull: true
      });
      console.log('✅ approved_by column added');
    } else {
      console.log('⏭️  approved_by column already exists');
    }

    // Add approved_at column
    if (!tableDescription.approved_at) {
      console.log('➕ Adding approved_at column...');
      await queryInterface.addColumn('users', 'approved_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
      console.log('✅ approved_at column added');
    } else {
      console.log('⏭️  approved_at column already exists');
    }

    // Add rejection_reason column
    if (!tableDescription.rejection_reason) {
      console.log('➕ Adding rejection_reason column...');
      await queryInterface.addColumn('users', 'rejection_reason', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      console.log('✅ rejection_reason column added');
    } else {
      console.log('⏭️  rejection_reason column already exists');
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Updated columns:');
    console.log('   - approval_status (STRING, default: "approved")');
    console.log('   - approved_by (UUID, nullable)');
    console.log('   - approved_at (DATE, nullable)');
    console.log('   - rejection_reason (TEXT, nullable)');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('\n✅ All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
