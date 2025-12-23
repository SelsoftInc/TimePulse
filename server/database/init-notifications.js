/**
 * Initialize notifications table in PostgreSQL database
 * Run this script to create the notifications table if it doesn't exist
 */

const { Sequelize } = require('sequelize');
const path = require('path');
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
  {
    ...dbConfig,
    logging: console.log
  }
);

async function initNotificationsTable() {
  try {
    console.log('🔧 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('📋 Creating notifications table...');
    
    // Create notifications table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'info',
        category VARCHAR(50) NOT NULL DEFAULT 'general',
        priority VARCHAR(20) NOT NULL DEFAULT 'medium',
        read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL,
        action_url VARCHAR(500) NULL,
        metadata JSONB NULL
      );
    `);
    
    console.log('✅ Notifications table created');

    console.log('📋 Creating indexes...');
    
    // Create indexes
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);`);
    
    console.log('✅ Indexes created');

    console.log('📋 Creating trigger function...');
    
    // Create trigger function
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION update_notifications_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    console.log('✅ Trigger function created');

    console.log('📋 Creating trigger...');
    
    // Create trigger
    await sequelize.query(`
      DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
      CREATE TRIGGER update_notifications_updated_at
        BEFORE UPDATE ON notifications
        FOR EACH ROW
        EXECUTE FUNCTION update_notifications_updated_at();
    `);
    
    console.log('✅ Trigger created');
    console.log('🎉 Notifications table initialization complete!');

  } catch (error) {
    console.error('❌ Error initializing notifications table:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run initialization
initNotificationsTable()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
