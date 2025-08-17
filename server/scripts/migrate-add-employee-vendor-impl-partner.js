#!/usr/bin/env node

/**
 * One-off migration: add vendor_id and impl_partner_id to employees table
 */

const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

(async () => {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'timepulse_db',
  };

  const sql = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'vendor_id'
  ) THEN
    ALTER TABLE employees
      ADD COLUMN vendor_id UUID NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'impl_partner_id'
  ) THEN
    ALTER TABLE employees
      ADD COLUMN impl_partner_id UUID NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
   WHERE tc.table_name = 'employees'
     AND tc.constraint_type = 'FOREIGN KEY'
     AND kcu.column_name = 'vendor_id'
  ) THEN
    ALTER TABLE employees
      ADD CONSTRAINT employees_vendor_id_fkey
      FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
   WHERE tc.table_name = 'employees'
     AND tc.constraint_type = 'FOREIGN KEY'
     AND kcu.column_name = 'impl_partner_id'
  ) THEN
    ALTER TABLE employees
      ADD CONSTRAINT employees_impl_partner_id_fkey
      FOREIGN KEY (impl_partner_id) REFERENCES vendors(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'employees' AND indexname = 'idx_employees_vendor_id'
  ) THEN
    CREATE INDEX idx_employees_vendor_id ON employees(vendor_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'employees' AND indexname = 'idx_employees_impl_partner_id'
  ) THEN
    CREATE INDEX idx_employees_impl_partner_id ON employees(impl_partner_id);
  END IF;
END $$;`;

  console.log('Running migration: add vendor_id and impl_partner_id to employees');
  console.log(`DB: ${config.user}@${config.host}:${config.port}/${config.database}`);

  const client = new Client(config);
  try {
    await client.connect();
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ Employee vendor/impl partner migration completed successfully.');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
