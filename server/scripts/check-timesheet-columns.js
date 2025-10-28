const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('timepulse_db', 'postgres', 'postgres', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false
});

async function checkColumns() {
  try {
    const [results] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'timesheets'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📊 Timesheets Table Columns:');
    console.log('================================');
    results.forEach(col => {
      console.log(`  ${col.column_name.padEnd(25)} ${col.data_type}`);
    });
    console.log('================================\n');
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    await sequelize.close();
  }
}

checkColumns();
