const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Load database configuration
const getDbConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  const isLocal = env === 'development' || process.env.USE_LOCAL_DB === 'true';

  if (isLocal) {
    const localConfig = require('./config/database.local.js');
    return localConfig.development;
  } else {
    const remoteConfig = require('./config/database.remote.js');
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

async function checkColumns() {
  try {
    console.log('🔍 Checking Stripe columns in tenants table...\n');

    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' 
      AND column_name IN ('stripe_customer_id', 'stripe_subscription_id', 'plan', 'billing_interval', 'seat_limit', 'current_period_end');
    `);

    console.log(`✅ Found ${results.length} Stripe columns:`);
    results.forEach(r => console.log(`  - ${r.column_name}`));

    if (results.length === 6) {
      console.log('\n✅ All Stripe columns are present!');
    } else {
      console.log('\n❌ Missing Stripe columns! Expected 6, found', results.length);
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

checkColumns();
