const { models } = require('../models');
const { Tenant } = models;

async function checkTenantName() {
  try {
    const tenants = await Tenant.findAll({
      attributes: ['id', 'tenantName', 'subdomain'],
      raw: true
    });
    
    console.log('Current tenant data:');
    console.log(JSON.stringify(tenants, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTenantName();
