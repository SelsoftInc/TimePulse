/**
 * Check if approver_id column exists in employees table
 */

const { sequelize } = require('./models');

async function checkColumn() {
  try {
    console.log('🔍 Checking for approver_id column in employees table...\n');

    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'employees'
        AND column_name = 'approver_id';
    `);

    if (results.length > 0) {
      console.log('✅ Column exists!');
      console.log('Details:', results[0]);
    } else {
      console.log('❌ Column does NOT exist!');
      console.log('\nAdding column now...\n');
      
      await sequelize.query(`
        ALTER TABLE employees 
        ADD COLUMN approver_id UUID REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;
      `);
      
      console.log('✅ Column added successfully!');
      
      // Create index
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_employees_approver_id ON employees(approver_id);
      `);
      
      console.log('✅ Index created successfully!');
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

checkColumn();
