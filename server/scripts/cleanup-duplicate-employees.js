/**
 * Cleanup Duplicate Employees Script
 * 
 * This script identifies and removes duplicate employees from the database,
 * keeping only the oldest record for each duplicate.
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
    logging: false, // Set to console.log to see SQL queries
  }
);

const TENANT_ID = '5eda5596-b1d9-4963-953d-7af9d0511ce8';

async function findDuplicates() {
  console.log('\n🔍 Step 1: Finding duplicate employees...\n');
  
  const [duplicates] = await sequelize.query(`
    SELECT 
      first_name,
      last_name,
      email,
      COUNT(*) as duplicate_count,
      array_agg(id ORDER BY created_at ASC) as employee_ids,
      array_agg(hourly_rate) as hourly_rates,
      array_agg(created_at ORDER BY created_at ASC) as created_dates
    FROM employees
    WHERE tenant_id = :tenantId
    GROUP BY first_name, last_name, email
    HAVING COUNT(*) > 1
    ORDER BY first_name, last_name
  `, {
    replacements: { tenantId: TENANT_ID }
  });

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found!');
    return [];
  }

  console.log(`⚠️  Found ${duplicates.length} sets of duplicate employees:\n`);
  
  duplicates.forEach((dup, index) => {
    console.log(`${index + 1}. ${dup.first_name} ${dup.last_name} (${dup.email})`);
    console.log(`   - Appears ${dup.duplicate_count} times`);
    console.log(`   - IDs: ${dup.employee_ids.join(', ')}`);
    console.log(`   - Hourly Rates: ${dup.hourly_rates.map(r => r ? `$${r}` : 'null').join(', ')}`);
    console.log(`   - Will KEEP: ${dup.employee_ids[0]} (oldest)`);
    console.log(`   - Will DELETE: ${dup.employee_ids.slice(1).join(', ')}`);
    console.log('');
  });

  return duplicates;
}

async function previewDeletion() {
  console.log('\n📋 Step 2: Preview of records to be deleted...\n');
  
  const [records] = await sequelize.query(`
    WITH ranked_employees AS (
      SELECT 
        id,
        first_name,
        last_name,
        email,
        hourly_rate,
        created_at,
        ROW_NUMBER() OVER (
          PARTITION BY first_name, last_name, email, tenant_id 
          ORDER BY created_at ASC
        ) as row_num
      FROM employees
      WHERE tenant_id = :tenantId
    )
    SELECT 
      id,
      first_name,
      last_name,
      email,
      hourly_rate,
      created_at,
      row_num,
      CASE 
        WHEN row_num = 1 THEN 'KEEP'
        ELSE 'DELETE'
      END as action
    FROM ranked_employees
    WHERE id IN (
      SELECT id 
      FROM ranked_employees 
      WHERE row_num > 1
      UNION
      SELECT id
      FROM ranked_employees
      WHERE row_num = 1
      AND id IN (
        SELECT MIN(id)
        FROM ranked_employees
        GROUP BY first_name, last_name, email
        HAVING COUNT(*) > 1
      )
    )
    ORDER BY first_name, last_name, created_at
  `, {
    replacements: { tenantId: TENANT_ID }
  });

  records.forEach(record => {
    const action = record.action === 'KEEP' ? '✅ KEEP' : '❌ DELETE';
    const rate = record.hourly_rate ? `$${record.hourly_rate}` : 'null';
    console.log(`${action} - ${record.first_name} ${record.last_name} (ID: ${record.id}, Rate: ${rate}, Created: ${record.created_at})`);
  });

  return records.filter(r => r.action === 'DELETE');
}

async function deleteDuplicates(dryRun = true) {
  console.log('\n🗑️  Step 3: Deleting duplicate employees...\n');
  
  if (dryRun) {
    console.log('🔒 DRY RUN MODE - No records will be deleted');
    console.log('   Set dryRun = false to actually delete records\n');
  }

  const [idsToDelete] = await sequelize.query(`
    SELECT id
    FROM (
      SELECT 
        id,
        ROW_NUMBER() OVER (
          PARTITION BY first_name, last_name, email, tenant_id 
          ORDER BY created_at ASC
        ) as row_num
      FROM employees
      WHERE tenant_id = :tenantId
    ) ranked
    WHERE row_num > 1
  `, {
    replacements: { tenantId: TENANT_ID }
  });

  if (idsToDelete.length === 0) {
    console.log('✅ No duplicates to delete!');
    return 0;
  }

  console.log(`Found ${idsToDelete.length} duplicate records to delete`);
  console.log(`IDs: ${idsToDelete.map(r => r.id).join(', ')}\n`);

  if (!dryRun) {
    const ids = idsToDelete.map(r => r.id);
    
    const [result] = await sequelize.query(`
      DELETE FROM employees
      WHERE id IN (:ids)
    `, {
      replacements: { ids }
    });

    console.log(`✅ Deleted ${idsToDelete.length} duplicate records`);
  }

  return idsToDelete.length;
}

async function verifyCleanup() {
  console.log('\n✔️  Step 4: Verifying cleanup...\n');
  
  const [remaining] = await sequelize.query(`
    SELECT 
      first_name,
      last_name,
      email,
      COUNT(*) as count
    FROM employees
    WHERE tenant_id = :tenantId
    GROUP BY first_name, last_name, email
    HAVING COUNT(*) > 1
  `, {
    replacements: { tenantId: TENANT_ID }
  });

  if (remaining.length === 0) {
    console.log('✅ Success! No duplicates remaining.');
  } else {
    console.log('⚠️  Warning: Some duplicates still exist:');
    remaining.forEach(dup => {
      console.log(`   - ${dup.first_name} ${dup.last_name}: ${dup.count} records`);
    });
  }

  const [totalCount] = await sequelize.query(`
    SELECT COUNT(*) as total
    FROM employees
    WHERE tenant_id = :tenantId
  `, {
    replacements: { tenantId: TENANT_ID }
  });

  console.log(`\n📊 Total employees remaining: ${totalCount[0].total}`);
}

async function main() {
  try {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   CLEANUP DUPLICATE EMPLOYEES SCRIPT              ║');
    console.log('╚════════════════════════════════════════════════════╝');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Step 1: Find duplicates
    const duplicates = await findDuplicates();
    
    if (duplicates.length === 0) {
      console.log('\n✅ No cleanup needed!');
      process.exit(0);
    }

    // Step 2: Preview deletion
    const toDelete = await previewDeletion();
    
    // Step 3: Delete duplicates (DRY RUN by default)
    const deletedCount = await deleteDuplicates(false); // Set to false to actually delete
    
    // Step 4: Verify cleanup
    if (deletedCount > 0) {
      await verifyCleanup();
    }

    console.log('\n✅ Script completed successfully!');
    
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
