#!/usr/bin/env node

/**
 * Run all pending migrations for TimePulse
 * This script creates all missing tables including implementation_partners and employment_types
 */

const { Client } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

(async () => {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'timepulse_db',
  };

  console.log('🚀 Running all migrations for TimePulse');
  console.log(`📊 DB: ${config.user}@${config.host}:${config.port}/${config.database}`);
  console.log('');

  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Migration 1: Create implementation_partners table
    console.log('\n📝 Migration 1: Creating implementation_partners table...');
    const implPartnersSql = fs.readFileSync(
      path.join(__dirname, '..', 'database', 'migrations', '2025-01-17_create_implementation_partners_table.sql'),
      'utf8'
    );
    await client.query('BEGIN');
    await client.query(implPartnersSql);
    await client.query('COMMIT');
    console.log('✅ implementation_partners table created');

    // Migration 2: Create employment_types table (without the ALTER TABLE part)
    console.log('\n📝 Migration 2: Creating employment_types table...');
    const employmentTypesSql = `
-- Create employment_types lookup table
CREATE TABLE IF NOT EXISTS employment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, name)
);

-- Insert default employment types for each tenant
INSERT INTO employment_types (tenant_id, name, description, is_active)
SELECT 
    t.id as tenant_id,
    'W2' as name,
    'Full-time employee with W2 tax classification' as description,
    true as is_active
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM employment_types et 
    WHERE et.tenant_id = t.id AND et.name = 'W2'
);

INSERT INTO employment_types (tenant_id, name, description, is_active)
SELECT 
    t.id as tenant_id,
    'Sub-Contract' as name,
    'Independent contractor or subcontractor' as description,
    true as is_active
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM employment_types et 
    WHERE et.tenant_id = t.id AND et.name = 'Sub-Contract'
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_employment_types_tenant_id ON employment_types(tenant_id);
`;
    await client.query('BEGIN');
    await client.query(employmentTypesSql);
    await client.query('COMMIT');
    console.log('✅ employment_types table created');

    // Migration 3: Add employment_type_id to employees
    console.log('\n📝 Migration 3: Adding employment_type_id to employees...');
    const addEmploymentTypeIdSql = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'employment_type_id'
  ) THEN
    ALTER TABLE employees
      ADD COLUMN employment_type_id UUID NULL;
    
    ALTER TABLE employees
      ADD CONSTRAINT employees_employment_type_id_fkey
      FOREIGN KEY (employment_type_id) REFERENCES employment_types(id) ON DELETE SET NULL;
    
    CREATE INDEX idx_employees_employment_type_id ON employees(employment_type_id);
  END IF;
END $$;`;
    await client.query('BEGIN');
    await client.query(addEmploymentTypeIdSql);
    await client.query('COMMIT');
    console.log('✅ employment_type_id added to employees');

    // Migration 4: Create notifications table
    console.log('\n📝 Migration 4: Creating notifications table...');
    const notificationsSql = fs.readFileSync(
      path.join(__dirname, '..', 'database', 'migrations', '2025-01-17_create_notifications_table.sql'),
      'utf8'
    );
    await client.query('BEGIN');
    await client.query(notificationsSql);
    await client.query('COMMIT');
    console.log('✅ notifications table created');

    console.log('\n🎉 All migrations completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  ✓ implementation_partners table');
    console.log('  ✓ employment_types table');
    console.log('  ✓ employment_type_id column in employees');
    console.log('  ✓ notifications table');
    console.log('\n✅ Database is now ready for use!');

  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('\n❌ Migration failed:', err.message);
    console.error('Stack:', err.stack);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
