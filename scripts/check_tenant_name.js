const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('timepulse_db', 'postgres', 'postgres', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false
});

async function checkTenantName() {
  try {
    const [results] = await sequelize.query(
      'SELECT id, tenant_name, subdomain FROM tenants;'
    );
    
    console.log('Current tenant data:');
    console.log(JSON.stringify(results, null, 2));
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTenantName();
