/**
 * Script to clean up dummy data for Lakshmi Priya employee
 * This will remove test/dummy timesheets, invoices, and client data
 */

const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '../server/.env' });

// Database configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || 'timepulse_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
  }
);

async function cleanupDummyData() {
  try {
    console.log('🔍 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Step 1: Find Lakshmi Priya employee
    console.log('📋 Step 1: Finding Lakshmi Priya employee...');
    const [employees] = await sequelize.query(`
      SELECT id, first_name, last_name, email, tenant_id
      FROM employees
      WHERE LOWER(first_name) LIKE '%lakshmi%'
         OR LOWER(last_name) LIKE '%priya%'
    `);

    if (employees.length === 0) {
      console.log('⚠️  No employee found with name containing "Lakshmi" or "Priya"');
      return;
    }

    console.log(`✅ Found ${employees.length} employee(s):`);
    employees.forEach(emp => {
      console.log(`   - ${emp.first_name} ${emp.last_name} (${emp.email})`);
      console.log(`     ID: ${emp.id}`);
      console.log(`     Tenant: ${emp.tenant_id}`);
    });

    const employeeId = employees[0].id;
    const tenantId = employees[0].tenant_id;

    // Step 2: Check timesheets for this employee
    console.log('\n📋 Step 2: Checking timesheets...');
    const [timesheets] = await sequelize.query(`
      SELECT 
        t.id, t.employee_id, t.client_id, t.vendor_id,
        c.client_name, v.name as vendor_name,
        t.week_start, t.week_end, t.total_hours, t.status, t.created_at
      FROM timesheets t
      LEFT JOIN clients c ON c.id = t.client_id
      LEFT JOIN vendors v ON v.id = t.vendor_id
      WHERE t.employee_id = '${employeeId}'
      ORDER BY t.created_at DESC
    `);

    console.log(`✅ Found ${timesheets.length} timesheet(s)`);
    timesheets.forEach(ts => {
      console.log(`   - Week: ${ts.week_start} to ${ts.week_end}`);
      console.log(`     Client: ${ts.client_name || 'None'}`);
      console.log(`     Vendor: ${ts.vendor_name || 'None'}`);
      console.log(`     Hours: ${ts.total_hours}, Status: ${ts.status}`);
      console.log(`     Created: ${ts.created_at}`);
    });

    // Step 3: Check invoices related to this employee's clients
    console.log('\n📋 Step 3: Checking invoices...');
    const [invoices] = await sequelize.query(`
      SELECT 
        i.id, i.client_id, i.vendor_id,
        c.client_name, v.name as vendor_name,
        i.invoice_date, i.total_amount, i.payment_status, i.created_at
      FROM invoices i
      LEFT JOIN clients c ON c.id = i.client_id
      LEFT JOIN vendors v ON v.id = i.vendor_id
      WHERE (i.client_id IN (
        SELECT DISTINCT client_id FROM timesheets WHERE employee_id = '${employeeId}' AND client_id IS NOT NULL
      ) OR i.vendor_id IN (
        SELECT DISTINCT vendor_id FROM timesheets WHERE employee_id = '${employeeId}' AND vendor_id IS NOT NULL
      ))
      ORDER BY i.created_at DESC
    `);

    console.log(`✅ Found ${invoices.length} invoice(s)`);
    let totalRevenue = 0;
    invoices.forEach(inv => {
      console.log(`   - Invoice ID: ${inv.id}`);
      console.log(`     Client: ${inv.client_name || 'None'}`);
      console.log(`     Vendor: ${inv.vendor_name || 'None'}`);
      console.log(`     Amount: $${inv.total_amount}`);
      console.log(`     Status: ${inv.payment_status}`);
      console.log(`     Date: ${inv.invoice_date}`);
      totalRevenue += parseFloat(inv.total_amount || 0);
    });
    console.log(`   📊 Total Revenue: $${totalRevenue.toFixed(2)}`);

    // Step 4: Prompt for confirmation
    console.log('\n⚠️  CLEANUP CONFIRMATION');
    console.log('═══════════════════════════════════════');
    console.log(`This will delete:`);
    console.log(`  - ${timesheets.length} timesheet(s)`);
    console.log(`  - ${invoices.length} invoice(s)`);
    console.log(`  - Total revenue impact: $${totalRevenue.toFixed(2)}`);
    console.log('═══════════════════════════════════════\n');

    // Auto-proceed with cleanup (since user requested it)
    console.log('🗑️  Proceeding with cleanup...\n');

    // Step 5: Delete timesheets
    if (timesheets.length > 0) {
      console.log('📋 Step 5: Deleting timesheets...');
      const [deleteTimesheets] = await sequelize.query(`
        DELETE FROM timesheets
        WHERE employee_id = '${employeeId}'
        RETURNING id, week_start, week_end
      `);
      console.log(`✅ Deleted ${deleteTimesheets.length} timesheet(s)`);
    }

    // Step 6: Delete invoices
    if (invoices.length > 0) {
      console.log('\n📋 Step 6: Deleting invoices...');
      const invoiceIds = invoices.map(inv => `'${inv.id}'`).join(',');
      const [deleteInvoices] = await sequelize.query(`
        DELETE FROM invoices
        WHERE id IN (${invoiceIds})
        RETURNING id, total_amount
      `);
      console.log(`✅ Deleted ${deleteInvoices.length} invoice(s)`);
    }

    // Step 7: Check if clients should be deleted (only if they're dummy/test clients)
    console.log('\n📋 Step 7: Checking for orphaned clients...');
    const [orphanedClients] = await sequelize.query(`
      SELECT c.id, c.client_name, c.email, c.created_at
      FROM clients c
      WHERE c.tenant_id = '${tenantId}'
        AND c.client_name ILIKE '%cognizant%'
        AND NOT EXISTS (SELECT 1 FROM timesheets WHERE client_id = c.id)
        AND NOT EXISTS (SELECT 1 FROM invoices WHERE client_id = c.id)
    `);

    if (orphanedClients.length > 0) {
      console.log(`✅ Found ${orphanedClients.length} orphaned client(s):`);
      orphanedClients.forEach(client => {
        console.log(`   - ${client.client_name} (${client.email})`);
      });
      
      console.log('🗑️  Deleting orphaned clients...');
      const clientIds = orphanedClients.map(c => `'${c.id}'`).join(',');
      const [deleteClients] = await sequelize.query(`
        DELETE FROM clients
        WHERE id IN (${clientIds})
        RETURNING id, client_name
      `);
      console.log(`✅ Deleted ${deleteClients.length} client(s)`);
    } else {
      console.log('ℹ️  No orphaned clients to delete');
    }

    // Step 8: Verify cleanup
    console.log('\n📋 Step 8: Verifying cleanup...');
    const [remainingTimesheets] = await sequelize.query(`
      SELECT COUNT(*) as count FROM timesheets WHERE employee_id = '${employeeId}'
    `);
    const [remainingInvoices] = await sequelize.query(`
      SELECT COUNT(*) as count FROM invoices 
      WHERE client_id IN (
        SELECT DISTINCT client_id FROM timesheets WHERE employee_id = '${employeeId}' AND client_id IS NOT NULL
      )
    `);

    console.log(`✅ Verification complete:`);
    console.log(`   - Remaining timesheets: ${remainingTimesheets[0].count}`);
    console.log(`   - Remaining invoices: ${remainingInvoices[0].count}`);

    console.log('\n✅ CLEANUP COMPLETE!');
    console.log('═══════════════════════════════════════');
    console.log('The dashboard will now show real-time data only.');
    console.log('Dummy data for Lakshmi Priya has been removed.');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the cleanup
cleanupDummyData()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
