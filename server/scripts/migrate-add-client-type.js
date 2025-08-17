#!/usr/bin/env node

/**
 * One-off migration: add clients.client_type column if missing
 */

const { Client } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

(async () => {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'timepulse_db',
  };

  const sql = `
    ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS client_type VARCHAR(20)
      DEFAULT 'external'
      CHECK (client_type IN ('internal','external'));
  `;

  console.log('Running migration: add clients.client_type if missing');
  console.log(`DB: ${config.user}@${config.host}:${config.port}/${config.database}`);

  const client = new Client(config);
  try {
    await client.connect();
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ Migration completed successfully.');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
