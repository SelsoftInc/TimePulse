/**
 * Simple Duplicate Cleanup Script
 * Directly deletes duplicate employees, keeping the oldest record
 */

const { Sequelize } = require('sequelize');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Database configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || 'timepulse_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
  }
);

const TENANT_ID = '5eda5596-b1d9-4963-953d-7af9d0511ce8';

async function main() {
  try {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   CLEANUP DUPLICATE EMPLOYEES (SIMPLE)            ║');
    console.log('╚════════════════════════════════════════════════════╝\n');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Step 1: Find duplicates
    console.log('🔍 Step 1: Finding duplicate employees...\n');
    
    const [duplicates] = await sequelize.query(`
      SELECT 
        first_name,
        last_name,
        email,
        COUNT(*) as count,
        string_agg(CAST(id AS TEXT), ', ' ORDER BY created_at ASC) as ids
      FROM employees
      WHERE tenant_id = :tenantId
      GROUP BY first_name, last_name, email
      HAVING COUNT(*) > 1
      ORDER BY first_name, last_name
    `, {
      replacements: { tenantId: TENANT_ID }
    });

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!\n');
      process.exit(0);
    }

    console.log(`⚠️  Found ${duplicates.length} sets of duplicates:\n`);
    duplicates.forEach((dup, i) => {
      console.log(`${i + 1}. ${dup.first_name} ${dup.last_name} (${dup.email})`);
      console.log(`   - Appears ${dup.count} times`);
      console.log(`   - IDs: ${dup.ids}`);
      console.log('');
    });

    // Step 2: Delete duplicates (keep oldest)
    console.log('🗑️  Step 2: Deleting duplicates (keeping oldest)...\n');
    
    // Start transaction
    const transaction = await sequelize.transaction();
    
    try {
      const [deletedRecords] = await sequelize.query(`
        WITH duplicates AS (
          SELECT 
            id,
            first_name,
            last_name,
            ROW_NUMBER() OVER (
              PARTITION BY first_name, last_name, email, tenant_id
              ORDER BY created_at ASC
            ) as rn
          FROM employees
          WHERE tenant_id = :tenantId
        )
        DELETE FROM employees
        WHERE id IN (
          SELECT id FROM duplicates WHERE rn > 1
        )
        RETURNING id, first_name, last_name
      `, {
        replacements: { tenantId: TENANT_ID },
        transaction
      });

      console.log(`✅ Deleted ${deletedRecords.length} duplicate records:`);
      deletedRecords.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec.first_name} ${rec.last_name} (ID: ${rec.id})`);
      });
      console.log('');

      // Commit transaction
      await transaction.commit();
      console.log('✅ Transaction committed\n');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Transaction rolled back:', error.message);
      throw error;
    }

    // Step 3: Verify
    console.log('✔️  Step 3: Verifying cleanup...\n');
    
    const [remaining] = await sequelize.query(`
      SELECT 
        first_name,
        last_name,
        COUNT(*) as count
      FROM employees
      WHERE tenant_id = :tenantId
      GROUP BY first_name, last_name, email
      HAVING COUNT(*) > 1
    `, {
      replacements: { tenantId: TENANT_ID }
    });

    if (remaining.length === 0) {
      console.log('✅ Success! No duplicates remaining.\n');
    } else {
      console.log('⚠️  Warning: Some duplicates still exist:\n');
      remaining.forEach(dup => {
        console.log(`   - ${dup.first_name} ${dup.last_name}: ${dup.count} records`);
      });
      console.log('');
    }

    // Step 4: Final count
    const [totalCount] = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM employees
      WHERE tenant_id = :tenantId
    `, {
      replacements: { tenantId: TENANT_ID }
    });

    console.log(`📊 Total employees remaining: ${totalCount[0].total}\n`);
    console.log('✅ Cleanup completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the script
main();
