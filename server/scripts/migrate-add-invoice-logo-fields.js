/**
 * Migration Script: Add company_logo, timesheet_file, and timesheet_file_name to invoices table
 * Date: 2025-11-24
 * Description: Adds columns to store company logo and timesheet document uploads for invoices
 */

const { Pool } = require('pg');
require('dotenv').config();

(async () => {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'timepulse_db',
  };

  console.log('🔧 Starting migration: Add invoice logo and document fields');
  console.log('📊 Database:', config.database);
  console.log('🖥️  Host:', config.host);

  const pool = new Pool(config);

  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');

    // Step 1: Add columns
    console.log('\n📝 Step 1: Adding columns to invoices table...');
    
    const addColumnsSQL = `
      DO $$ 
      BEGIN
          -- Add company_logo column
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'invoices' AND column_name = 'company_logo'
          ) THEN
              ALTER TABLE invoices ADD COLUMN company_logo TEXT;
              RAISE NOTICE 'Added column: company_logo';
          ELSE
              RAISE NOTICE 'Column company_logo already exists';
          END IF;

          -- Add timesheet_file column
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'invoices' AND column_name = 'timesheet_file'
          ) THEN
              ALTER TABLE invoices ADD COLUMN timesheet_file TEXT;
              RAISE NOTICE 'Added column: timesheet_file';
          ELSE
              RAISE NOTICE 'Column timesheet_file already exists';
          END IF;

          -- Add timesheet_file_name column
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'invoices' AND column_name = 'timesheet_file_name'
          ) THEN
              ALTER TABLE invoices ADD COLUMN timesheet_file_name VARCHAR(255);
              RAISE NOTICE 'Added column: timesheet_file_name';
          ELSE
              RAISE NOTICE 'Column timesheet_file_name already exists';
          END IF;
      END $$;
    `;

    await client.query(addColumnsSQL);
    console.log('✅ Columns added successfully');

    // Step 2: Add comments to columns for documentation
    console.log('\n📝 Step 2: Adding column comments...');
    
    const addCommentsSQL = `
      COMMENT ON COLUMN invoices.company_logo IS 'Base64 encoded company logo image for invoice PDF';
      COMMENT ON COLUMN invoices.timesheet_file IS 'Base64 encoded timesheet document attachment';
      COMMENT ON COLUMN invoices.timesheet_file_name IS 'Original filename of the uploaded timesheet document';
    `;

    await client.query(addCommentsSQL);
    console.log('✅ Column comments added successfully');

    // Step 3: Verify columns exist
    console.log('\n📝 Step 3: Verifying columns...');
    
    const verifySQL = `
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'invoices' 
        AND column_name IN ('company_logo', 'timesheet_file', 'timesheet_file_name')
      ORDER BY column_name;
    `;

    const result = await client.query(verifySQL);
    
    if (result.rows.length === 3) {
      console.log('✅ All columns verified:');
      result.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''}`);
      });
    } else {
      console.warn('⚠️  Warning: Expected 3 columns, found', result.rows.length);
    }

    client.release();
    console.log('\n✅ Migration completed successfully!');
    console.log('🎉 Invoice logo and document fields are now available');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
