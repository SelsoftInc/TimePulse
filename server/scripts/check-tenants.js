const { sequelize } = require('../models');

async function checkTenants() {
  try {
    // Get all tenants
    const tenants = await sequelize.query(
      `SELECT * FROM tenants LIMIT 5`,
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log('\n📊 Tenant Data Summary:');
    console.log('='.repeat(80));
    
    for (const tenant of tenants) {
      const empCount = await sequelize.query(
        `SELECT COUNT(*) as count FROM employees WHERE tenant_id = '${tenant.id}'`,
        { type: sequelize.QueryTypes.SELECT }
      );
      
      const clientCount = await sequelize.query(
        `SELECT COUNT(*) as count FROM clients WHERE tenant_id = '${tenant.id}'`,
        { type: sequelize.QueryTypes.SELECT }
      );
      
      const janTimesheets = await sequelize.query(
        `SELECT COUNT(*) as count FROM timesheets WHERE tenant_id = '${tenant.id}' AND week_start >= '2026-01-01'`,
        { type: sequelize.QueryTypes.SELECT }
      );
      
      console.log(`\nTenant ID: ${tenant.id}`);
      console.log(`  Employees: ${empCount[0].count}`);
      console.log(`  Clients: ${clientCount[0].count}`);
      console.log(`  Jan 2026 Timesheets: ${janTimesheets[0].count}`);
    }
    
    console.log('\n' + '='.repeat(80));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTenants();
