/**
 * Check Script: Verify admin/approver users exist in database
 * Run this with: node scripts/check-approvers.js
 */

const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Load database configuration
const getDbConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  const isLocal = env === 'development' || process.env.USE_LOCAL_DB === 'true';

  if (isLocal) {
    const localConfig = require('../config/database.local.js');
    return localConfig.development;
  } else {
    const remoteConfig = require('../config/database.remote.js');
    return remoteConfig[env] || remoteConfig.production;
  }
};

const dbConfig = getDbConfig();

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

async function checkApprovers() {
  try {
    console.log('🔧 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Check all users
    console.log('📊 Checking all users in database:');
    const [allUsers] = await sequelize.query(`
      SELECT id, first_name, last_name, email, role, status, approval_status
      FROM users
      ORDER BY role, first_name
    `);

    if (allUsers.length === 0) {
      console.log('⚠️  No users found in database!');
      console.log('\nYou need to create at least one admin or approver user first.');
      await sequelize.close();
      return;
    }

    console.log(`\nTotal users: ${allUsers.length}\n`);
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.first_name} ${user.last_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Approval Status: ${user.approval_status}`);
      console.log('');
    });

    // Check admin/approver users specifically
    console.log('👥 Checking admin/approver users:');
    const [approvers] = await sequelize.query(`
      SELECT id, first_name, last_name, email, role, status, approval_status
      FROM users
      WHERE role IN ('admin', 'approver')
      AND status = 'active'
      AND approval_status = 'approved'
      ORDER BY role, first_name
    `);

    if (approvers.length === 0) {
      console.log('⚠️  No active admin/approver users found!');
      console.log('\nThe approver dropdown will be empty because there are no:');
      console.log('  - Users with role = "admin" OR "approver"');
      console.log('  - AND status = "active"');
      console.log('  - AND approval_status = "approved"');
      console.log('\nPlease create an admin or approver user first.');
    } else {
      console.log(`\n✅ Found ${approvers.length} active admin/approver user(s):\n`);
      approvers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.first_name} ${user.last_name} (${user.role})`);
        console.log(`   Email: ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log('');
      });
      console.log('These users should appear in the approver dropdown.');
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run check
checkApprovers();
