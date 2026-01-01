/**
 * Setup Script: Create account_requests table with password_hash column
 * Run this with: node scripts/setup-account-requests-table.js
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

async function setupAccountRequestsTable() {
  try {
    console.log('🔧 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check if table exists
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'account_requests'
    `);

    if (tables.length > 0) {
      console.log('ℹ️  Table account_requests already exists');
      
      // Check if password_hash column exists
      const [columns] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'account_requests' 
        AND column_name = 'password_hash'
      `);

      if (columns.length > 0) {
        console.log('ℹ️  Column password_hash already exists');
        console.log('✨ Setup already complete!');
        await sequelize.close();
        return;
      }

      // Add password_hash column
      console.log('📝 Adding password_hash column...');
      await sequelize.query(`
        ALTER TABLE account_requests 
        ADD COLUMN password_hash VARCHAR(255)
      `);
      console.log('✅ Successfully added password_hash column');
      console.log('✨ Setup completed successfully!');
      await sequelize.close();
      return;
    }

    console.log('📝 Creating account_requests table...');
    
    // Create the table with password_hash included
    await sequelize.query(`
      CREATE TABLE account_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE SET NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20) NOT NULL,
        country_code VARCHAR(5) NOT NULL DEFAULT '+1',
        password_hash VARCHAR(255),
        requested_role VARCHAR(50) NOT NULL DEFAULT 'employee',
        requested_approver_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        company_name VARCHAR(255),
        department VARCHAR(100),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        approved_by UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        approved_at TIMESTAMP,
        rejected_by UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        rejected_at TIMESTAMP,
        rejection_reason TEXT,
        temporary_password VARCHAR(255),
        user_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    console.log('✅ Table created successfully');

    // Create indexes
    console.log('📝 Creating indexes...');
    await sequelize.query(`CREATE INDEX idx_account_requests_email ON account_requests(email)`);
    await sequelize.query(`CREATE INDEX idx_account_requests_status ON account_requests(status)`);
    await sequelize.query(`CREATE INDEX idx_account_requests_tenant_id ON account_requests(tenant_id)`);
    await sequelize.query(`CREATE INDEX idx_account_requests_approver_id ON account_requests(requested_approver_id)`);
    await sequelize.query(`CREATE INDEX idx_account_requests_created_at ON account_requests(created_at)`);
    console.log('✅ Indexes created successfully');

    console.log('');
    console.log('✨ Setup completed successfully!');
    console.log('');
    console.log('Table: account_requests');
    console.log('Columns:');
    console.log('  - id (UUID, Primary Key)');
    console.log('  - tenant_id (UUID, Foreign Key)');
    console.log('  - first_name (VARCHAR)');
    console.log('  - last_name (VARCHAR)');
    console.log('  - email (VARCHAR, Unique)');
    console.log('  - phone (VARCHAR)');
    console.log('  - country_code (VARCHAR)');
    console.log('  - password_hash (VARCHAR) ← NEW');
    console.log('  - requested_role (VARCHAR)');
    console.log('  - requested_approver_id (UUID, Foreign Key)');
    console.log('  - company_name (VARCHAR)');
    console.log('  - department (VARCHAR)');
    console.log('  - status (VARCHAR)');
    console.log('  - approved_by (UUID, Foreign Key)');
    console.log('  - approved_at (TIMESTAMP)');
    console.log('  - rejected_by (UUID, Foreign Key)');
    console.log('  - rejected_at (TIMESTAMP)');
    console.log('  - rejection_reason (TEXT)');
    console.log('  - temporary_password (VARCHAR)');
    console.log('  - user_id (UUID, Foreign Key)');
    console.log('  - metadata (JSONB)');
    console.log('  - created_at (TIMESTAMP)');
    console.log('  - updated_at (TIMESTAMP)');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run setup
setupAccountRequestsTable();
