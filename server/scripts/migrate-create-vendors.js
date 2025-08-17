#!/usr/bin/env node

/**
 * One-off migration: create vendors table if missing
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
    CREATE TABLE IF NOT EXISTS vendors (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      contact_person VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      category VARCHAR(100),
      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','pending')),
      total_spent DECIMAL(12,2) DEFAULT 0,
      address VARCHAR(255),
      city VARCHAR(100),
      state VARCHAR(100),
      zip VARCHAR(20),
      country VARCHAR(100),
      website VARCHAR(255),
      payment_terms VARCHAR(50),
      contract_start DATE,
      contract_end DATE,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    DO $$ BEGIN
      CREATE TRIGGER update_vendors_updated_at
      BEFORE UPDATE ON vendors
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS idx_vendors_tenant_id ON vendors(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(tenant_id, status);
    CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(tenant_id, name);
  `;

  console.log('Running migration: create vendors table if missing');
  console.log(`DB: ${config.user}@${config.host}:${config.port}/${config.database}`);

  const client = new Client(config);
  try {
    await client.connect();
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ Vendors table migration completed successfully.');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
