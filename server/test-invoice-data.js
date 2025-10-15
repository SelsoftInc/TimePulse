/**
 * Test script to verify invoice-related data in database
 * Run with: node test-invoice-data.js
 */

const { models, sequelize } = require('./models');

async function testInvoiceData() {
  try {
    console.log('🔍 Testing Invoice Module Data...\n');

    // Get first tenant
    const tenant = await models.Tenant.findOne();
    if (!tenant) {
      console.log('❌ No tenants found in database');
      return;
    }
    console.log('✅ Tenant found:', tenant.companyName, '(ID:', tenant.id, ')');

    // Check employees
    const employees = await models.Employee.findAll({
      where: { tenantId: tenant.id },
      limit: 5
    });
    console.log(`\n📋 Employees: ${employees.length} found`);
    employees.forEach(emp => {
      console.log(`  - ${emp.firstName} ${emp.lastName} (${emp.email})`);
    });

    // Check vendors
    const vendors = await models.Vendor.findAll({
      where: { tenantId: tenant.id },
      limit: 5
    });
    console.log(`\n🏢 Vendors: ${vendors.length} found`);
    vendors.forEach(vendor => {
      console.log(`  - ${vendor.name} (${vendor.email || 'No email'})`);
    });

    // Check clients
    const clients = await models.Client.findAll({
      where: { tenantId: tenant.id },
      limit: 5
    });
    console.log(`\n👥 Clients: ${clients.length} found`);
    clients.forEach(client => {
      console.log(`  - ${client.clientName} (${client.email || 'No email'})`);
    });

    // Check approved timesheets
    const timesheets = await models.Timesheet.findAll({
      where: { 
        tenantId: tenant.id,
        status: 'approved'
      },
      limit: 5,
      include: [
        { model: models.Employee, as: 'employee', attributes: ['firstName', 'lastName'] },
        { model: models.Client, as: 'client', attributes: ['clientName'] }
      ]
    });
    console.log(`\n⏰ Approved Timesheets: ${timesheets.length} found`);
    timesheets.forEach(ts => {
      const empName = ts.employee ? `${ts.employee.firstName} ${ts.employee.lastName}` : 'Unknown';
      const clientName = ts.client?.clientName || 'Unknown';
      console.log(`  - ${empName} | ${clientName} | Week: ${ts.weekStart} to ${ts.weekEnd} | ${ts.totalHours}hrs @ $${ts.hourlyRate}/hr`);
    });

    // Check invoices
    const invoices = await models.Invoice.findAll({
      where: { tenantId: tenant.id },
      limit: 5
    });
    console.log(`\n💰 Invoices: ${invoices.length} found`);
    invoices.forEach(inv => {
      console.log(`  - ${inv.invoiceNumber} | Status: ${inv.status} | Total: $${inv.total}`);
    });

    console.log('\n✅ Data check complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

testInvoiceData();
